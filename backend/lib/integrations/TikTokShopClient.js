const BaseIntegrationClient = require('./BaseIntegrationClient');
const crypto = require('crypto');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TikTokShopClient extends BaseIntegrationClient {
  constructor(integrationId, credentials) {
    super(integrationId, credentials);

    this.appKey = credentials.appKey;
    this.appSecret = credentials.appSecret;
    this.accessToken = credentials.accessToken;
    this.shopId = credentials.shopId;
    this.baseUrl = credentials.region === 'US'
      ? 'https://open-api.tiktokglobalshop.com'
      : 'https://open-api.tiktokshop.com'; // UK/EU
  }

  /**
   * Generate TikTok Shop API signature
   * @param {string} path - API path (e.g., '/api/orders/search')
   * @param {Object} params - Query/body parameters
   */
  generateSignature(path, params) {
    const timestamp = Math.floor(Date.now() / 1000);

    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}${params[key]}`)
      .join('');

    // Build sign string
    const signString = `${this.appSecret}${path}${this.appKey}${this.accessToken}${timestamp}${sortedParams}${this.appSecret}`;

    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', this.appSecret)
      .update(signString)
      .digest('hex');

    return { signature, timestamp };
  }

  /**
   * Make authenticated request to TikTok Shop API
   * @param {string} path - API endpoint path
   * @param {string} method - HTTP method
   * @param {Object} params - Request parameters
   */
  async makeRequest(path, method = 'GET', params = {}) {
    const { signature, timestamp } = this.generateSignature(path, params);

    const config = {
      method,
      url: `${this.baseUrl}${path}`,
      headers: {
        'Content-Type': 'application/json',
        'x-tts-access-token': this.accessToken
      },
      params: {
        app_key: this.appKey,
        timestamp,
        sign: signature,
        ...params
      }
    };

    if (method === 'POST') {
      config.data = params;
      config.params = { app_key: this.appKey, timestamp, sign: signature };
    }

    try {
      const response = await axios(config);

      if (response.data.code !== 0) {
        throw new Error(`TikTok API Error: ${response.data.message}`);
      }

      return response.data.data;
    } catch (error) {
      console.error('TikTok API request failed:', error);
      throw error;
    }
  }

  /**
   * Sync orders from TikTok Shop
   * @param {Date} since - Fetch orders created after this date
   */
  async syncOrders(since) {
    try {
      const sinceTimestamp = since
        ? Math.floor(since.getTime() / 1000)
        : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

      let imported = 0;
      let cursor = '';
      let hasMore = true;

      while (hasMore) {
        const params = {
          shop_id: this.shopId,
          create_time_ge: sinceTimestamp,
          order_status: 111, // AWAITING_SHIPMENT
          page_size: 50,
          cursor
        };

        const response = await this.makeRequest('/api/orders/search', 'POST', params);

        const orders = response.order_list || [];

        for (const order of orders) {
          // Get order details including line items
          const orderDetail = await this.makeRequest('/api/orders/detail/query', 'POST', {
            shop_id: this.shopId,
            order_id_list: [order.order_id]
          });

          if (orderDetail.order_list?.[0]) {
            await this.importOrder(orderDetail.order_list[0]);
            imported++;
          }

          // Rate limiting - TikTok: 10 requests/second
          await this.rateLimiter.checkLimit('tiktok', 600, 60000);
        }

        cursor = response.next_cursor;
        hasMore = response.more;
      }

      await this.logSync('ORDERS', 'SUCCESS', imported);
      await this.updateLastSync();

      return { imported };
    } catch (error) {
      await this.logSync('ORDERS', 'FAILED', 0, error.message);
      throw error;
    }
  }

  /**
   * Import single TikTok Shop order
   * @param {Object} tiktokOrder - TikTok order object
   */
  async importOrder(tiktokOrder) {
    const existing = await prisma.orderImport.findUnique({
      where: {
        integrationId_externalOrderId: {
          integrationId: this.integrationId,
          externalOrderId: tiktokOrder.order_id
        }
      }
    });

    if (existing) return existing;

    const integration = await prisma.integration.findUnique({
      where: { id: this.integrationId }
    });

    const orderImport = await prisma.orderImport.create({
      data: {
        integrationId: this.integrationId,
        externalOrderId: tiktokOrder.order_id,
        orderData: JSON.stringify(tiktokOrder),
        status: 'PENDING'
      }
    });

    try {
      const orderItems = [];

      for (const item of tiktokOrder.item_list || []) {
        const sku = item.seller_sku;

        // Check for integration mapping
        const mapping = await prisma.integrationMapping.findFirst({
          where: {
            integrationId: this.integrationId,
            externalSku: sku
          }
        });

        if (mapping) {
          const product = await prisma.product.findFirst({
            where: { sku: mapping.internalSku }
          });

          if (product) {
            orderItems.push({
              productId: product.id,
              quantity: item.quantity,
              price: parseFloat(item.sale_price || 0)
            });
          }
        } else {
          // Try direct SKU match
          const product = await prisma.product.findFirst({
            where: { sku }
          });

          if (product) {
            orderItems.push({
              productId: product.id,
              quantity: item.quantity,
              price: parseFloat(item.sale_price || 0)
            });
          }
        }
      }

      if (orderItems.length > 0) {
        const recipientAddress = tiktokOrder.recipient_address;

        const internalOrder = await prisma.order.create({
          data: {
            companyId: integration.companyId,
            orderNumber: tiktokOrder.order_id,
            status: 'PENDING',
            customerName: recipientAddress?.full_address || recipientAddress?.name,
            customerEmail: tiktokOrder.buyer_email,
            shippingAddress: JSON.stringify(recipientAddress),
            totalAmount: parseFloat(tiktokOrder.payment?.total_amount || 0),
            items: {
              create: orderItems
            }
          }
        });

        await prisma.orderImport.update({
          where: { id: orderImport.id },
          data: {
            status: 'IMPORTED',
            internalOrderId: internalOrder.id
          }
        });

        return internalOrder;
      }
    } catch (error) {
      await prisma.orderImport.update({
        where: { id: orderImport.id },
        data: { status: 'FAILED' }
      });
      console.error('Failed to import TikTok order:', error);
    }

    return orderImport;
  }

  /**
   * Sync inventory to TikTok Shop
   */
  async syncInventory() {
    try {
      const mappings = await prisma.integrationMapping.findMany({
        where: { integrationId: this.integrationId },
        include: { integration: true }
      });

      let updated = 0;

      for (const mapping of mappings) {
        const product = await prisma.product.findFirst({
          where: { sku: mapping.internalSku }
        });

        if (!product) continue;

        // Calculate total available quantity
        const inventory = await prisma.inventory.aggregate({
          where: { productId: product.id },
          _sum: { quantity: true }
        });

        const totalQty = inventory._sum.quantity || 0;

        try {
          if (mapping.externalProductId) {
            // Update TikTok product inventory
            await this.makeRequest('/api/products/stocks/update', 'POST', {
              shop_id: this.shopId,
              product_id: mapping.externalProductId,
              skus: [{
                seller_sku: mapping.externalSku,
                available_stock: totalQty
              }]
            });

            updated++;
          }
        } catch (error) {
          console.error(`Failed to update TikTok inventory for ${mapping.internalSku}:`, error.message);
        }

        // Rate limiting
        await this.rateLimiter.checkLimit('tiktok', 600, 60000);
      }

      await this.logSync('INVENTORY', 'SUCCESS', updated);
      await this.updateLastSync();

      return { updated };
    } catch (error) {
      await this.logSync('INVENTORY', 'FAILED', 0, error.message);
      throw error;
    }
  }

  /**
   * Ship TikTok order (update tracking)
   * @param {string} orderId - TikTok order ID
   * @param {Object} shipmentDetails - Tracking and carrier info
   */
  async shipOrder(orderId, shipmentDetails) {
    try {
      await this.makeRequest('/api/fulfillment/rts', 'POST', {
        shop_id: this.shopId,
        order_id: orderId,
        tracking_number: shipmentDetails.trackingNumber,
        shipping_provider_id: shipmentDetails.providerId
      });

      // Update internal order status
      const orderImport = await prisma.orderImport.findFirst({
        where: {
          integrationId: this.integrationId,
          externalOrderId: orderId
        },
        include: { internalOrder: true }
      });

      if (orderImport?.internalOrder) {
        await prisma.order.update({
          where: { id: orderImport.internalOrder.id },
          data: { status: 'SHIPPED' }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to ship TikTok order:', error);
      throw error;
    }
  }

  /**
   * Get available shipping providers
   */
  async getShippingProviders() {
    try {
      const response = await this.makeRequest('/api/logistics/ship/get', 'POST', {
        shop_id: this.shopId
      });

      return response.shipping_providers || [];
    } catch (error) {
      console.error('Failed to get TikTok shipping providers:', error);
      throw error;
    }
  }
}

module.exports = TikTokShopClient;
