const BaseIntegrationClient = require('./BaseIntegrationClient');
const axios = require('axios');
const prisma = require('../prisma');

/**
 * Shopify integration client using REST Admin API
 * Supports order sync, inventory sync, and fulfillment creation
 */
class ShopifyClient extends BaseIntegrationClient {
  constructor(integrationId, credentials) {
    super(integrationId, credentials);
    this.platform = 'SHOPIFY';

    // Validate required credentials
    if (!credentials.shop || !credentials.accessToken) {
      throw new Error('Shopify integration requires shop URL and accessToken');
    }

    // Normalize shop URL
    this.shopUrl = credentials.shop.replace('https://', '').replace('http://', '');
    if (!this.shopUrl.includes('.myshopify.com')) {
      this.shopUrl = `${this.shopUrl}.myshopify.com`;
    }

    this.accessToken = credentials.accessToken;
    this.apiVersion = credentials.apiVersion || '2024-01';

    // Base URL for REST API calls
    this.baseUrl = `https://${this.shopUrl}/admin/api/${this.apiVersion}`;

    // Rate limiting: Shopify allows 40 requests/second with bucket refill
    this.maxRequestsPerSecond = 40;
  }

  /**
   * Make authenticated request to Shopify REST API
   * @param {string} endpoint - API endpoint (e.g., '/orders.json')
   * @param {string} method - HTTP method
   * @param {Object} data - Request body for POST/PUT
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response data
   */
  async makeRequest(endpoint, method = 'GET', data = null, params = {}) {
    await this.checkLimit('shopify', this.maxRequestsPerSecond, 1000);

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await axios({
        method,
        url,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        params,
        data
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 429) {
          // Rate limited - wait and retry
          const retryAfter = error.response.headers['retry-after'] || 2;
          console.log(`Shopify rate limit hit, waiting ${retryAfter}s`);
          await this.sleep(retryAfter * 1000);
          return this.makeRequest(endpoint, method, data, params);
        }

        throw new Error(`Shopify API error (${status}): ${JSON.stringify(data)}`);
      }
      throw error;
    }
  }

  /**
   * Test connection to Shopify
   * @returns {Promise<Object>} - Shop info if successful
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('/shop.json');
      return {
        success: true,
        shopName: response.shop.name,
        shopUrl: response.shop.myshopify_domain,
        email: response.shop.email,
        currency: response.shop.currency
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync orders from Shopify
   * @param {Date} since - Fetch orders created after this date
   * @returns {Promise<Object>} - Sync result with imported count
   */
  async syncOrders(since) {
    try {
      const sinceDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let imported = 0;
      let total = 0;
      let pageInfo = null;

      await this.logSync('ORDERS', 'IN_PROGRESS', 0);

      do {
        // Build query parameters
        const params = {
          status: 'any',
          fulfillment_status: 'unfulfilled,partial',
          created_at_min: sinceDate.toISOString(),
          limit: 250
        };

        if (pageInfo) {
          params.page_info = pageInfo;
        }

        const response = await this.makeRequest('/orders.json', 'GET', null, params);
        const orders = response.orders || [];
        total += orders.length;

        for (const order of orders) {
          const result = await this.importOrder(order);
          if (result) imported++;
        }

        // Handle pagination via Link header (simplified - Shopify uses cursor-based pagination)
        pageInfo = null; // In production, parse Link header for next page

      } while (pageInfo);

      await this.logSync('ORDERS', 'SUCCESS', imported);
      await this.updateLastSync();

      return { imported, total };
    } catch (error) {
      await this.logSync('ORDERS', 'FAILED', 0, error.message);
      throw error;
    }
  }

  /**
   * Import single Shopify order into WMS
   * @param {Object} shopifyOrder - Shopify order object
   * @returns {Promise<Object|null>} - Created order or null
   */
  async importOrder(shopifyOrder) {
    // Check if already imported
    const existing = await prisma.orderImport.findUnique({
      where: {
        integrationId_externalOrderId: {
          integrationId: this.integrationId,
          externalOrderId: shopifyOrder.id.toString()
        }
      }
    });

    if (existing) return null;

    const integration = await prisma.integration.findUnique({
      where: { id: this.integrationId }
    });

    // Create import record
    const orderImport = await prisma.orderImport.create({
      data: {
        integrationId: this.integrationId,
        externalOrderId: shopifyOrder.id.toString(),
        orderData: JSON.stringify(shopifyOrder),
        status: 'PENDING'
      }
    });

    try {
      const orderItems = [];

      for (const lineItem of shopifyOrder.line_items || []) {
        const sku = lineItem.sku;
        if (!sku) continue;

        const product = await this.resolveInternalSku(sku);

        if (product) {
          orderItems.push({
            productId: product.id,
            quantity: lineItem.quantity,
            price: parseFloat(lineItem.price || 0)
          });
        }
      }

      if (orderItems.length > 0) {
        const shippingAddress = shopifyOrder.shipping_address || {};

        const internalOrder = await prisma.order.create({
          data: {
            companyId: integration.companyId,
            orderNumber: shopifyOrder.order_number?.toString() || shopifyOrder.name,
            status: 'PENDING',
            customerName: shippingAddress.name || `${shopifyOrder.customer?.first_name || ''} ${shopifyOrder.customer?.last_name || ''}`.trim(),
            customerEmail: shopifyOrder.email || shopifyOrder.customer?.email,
            customerPhone: shippingAddress.phone,
            shippingAddress: JSON.stringify({
              line1: shippingAddress.address1,
              line2: shippingAddress.address2,
              city: shippingAddress.city,
              province: shippingAddress.province,
              postcode: shippingAddress.zip,
              country: shippingAddress.country_code
            }),
            totalAmount: parseFloat(shopifyOrder.total_price || 0),
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

      // No matching products
      await prisma.orderImport.update({
        where: { id: orderImport.id },
        data: { status: 'SKIPPED' }
      });

      return null;
    } catch (error) {
      await prisma.orderImport.update({
        where: { id: orderImport.id },
        data: { status: 'FAILED' }
      });
      console.error('Failed to import Shopify order:', error);
      return null;
    }
  }

  /**
   * Sync inventory from WMS to Shopify
   * @returns {Promise<Object>} - Sync result with updated count
   */
  async syncInventory() {
    try {
      await this.logSync('INVENTORY', 'IN_PROGRESS', 0);

      // Get integration mappings
      const mappings = await prisma.integrationMapping.findMany({
        where: { integrationId: this.integrationId }
      });

      let updated = 0;
      let errors = 0;

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
          // Get Shopify inventory item ID for this variant
          const inventoryItemId = mapping.externalProductId;

          if (inventoryItemId) {
            // Get location ID (use default location)
            const locationsResponse = await this.makeRequest('/locations.json');
            const locationId = locationsResponse.locations?.[0]?.id;

            if (locationId) {
              // Set inventory level
              await this.makeRequest('/inventory_levels/set.json', 'POST', {
                inventory_item_id: parseInt(inventoryItemId),
                location_id: locationId,
                available: totalQty
              });

              updated++;
            }
          }
        } catch (error) {
          console.error(`Failed to update Shopify inventory for ${mapping.internalSku}:`, error.message);
          errors++;
        }
      }

      await this.logSync('INVENTORY', 'SUCCESS', updated);
      await this.updateLastSync();

      return { updated, errors };
    } catch (error) {
      await this.logSync('INVENTORY', 'FAILED', 0, error.message);
      throw error;
    }
  }

  /**
   * Create fulfillment for Shopify order
   * @param {string} orderId - Shopify order ID
   * @param {Object} shipmentDetails - Tracking info and line items
   * @returns {Promise<Object>} - Fulfillment result
   */
  async createFulfillment(orderId, shipmentDetails) {
    try {
      // First, get fulfillment orders for this order
      const fulfillmentOrdersResponse = await this.makeRequest(
        `/orders/${orderId}/fulfillment_orders.json`
      );

      const fulfillmentOrders = fulfillmentOrdersResponse.fulfillment_orders || [];

      if (fulfillmentOrders.length === 0) {
        throw new Error('No fulfillment orders found for this order');
      }

      // Create fulfillment for each fulfillment order
      const fulfillment = await this.makeRequest('/fulfillments.json', 'POST', {
        fulfillment: {
          line_items_by_fulfillment_order: fulfillmentOrders.map(fo => ({
            fulfillment_order_id: fo.id,
            fulfillment_order_line_items: fo.line_items.map(li => ({
              id: li.id,
              quantity: li.fulfillable_quantity
            }))
          })),
          tracking_info: {
            number: shipmentDetails.trackingNumber,
            company: shipmentDetails.carrierName || this.mapCarrierCode(shipmentDetails.carrierCode),
            url: shipmentDetails.trackingUrl
          },
          notify_customer: shipmentDetails.notifyCustomer !== false
        }
      });

      // Update internal order status
      const orderImport = await prisma.orderImport.findFirst({
        where: {
          integrationId: this.integrationId,
          externalOrderId: orderId.toString()
        }
      });

      if (orderImport?.internalOrderId) {
        await prisma.order.update({
          where: { id: orderImport.internalOrderId },
          data: { status: 'SHIPPED' }
        });
      }

      return {
        success: true,
        fulfillmentId: fulfillment.fulfillment?.id,
        trackingNumber: shipmentDetails.trackingNumber
      };
    } catch (error) {
      console.error('Failed to create Shopify fulfillment:', error);
      throw error;
    }
  }

  /**
   * Map internal carrier code to Shopify carrier name
   * @param {string} carrierCode - Internal carrier code
   * @returns {string} - Shopify carrier name
   */
  mapCarrierCode(carrierCode) {
    const mapping = {
      'ROYAL_MAIL': 'Royal Mail',
      'DPD': 'DPD UK',
      'PARCEL_FORCE': 'Parcelforce',
      'HERMES': 'Evri',
      'UPS': 'UPS',
      'FEDEX': 'FedEx',
      'DHL': 'DHL'
    };

    return mapping[carrierCode] || carrierCode;
  }

  /**
   * Get all products from Shopify for mapping purposes
   * @returns {Promise<Array>} - Array of products with variants
   */
  async getProducts() {
    const products = [];
    let pageInfo = null;

    do {
      const params = { limit: 250 };
      if (pageInfo) params.page_info = pageInfo;

      const response = await this.makeRequest('/products.json', 'GET', null, params);
      products.push(...(response.products || []));

      pageInfo = null; // Parse Link header in production
    } while (pageInfo);

    return products;
  }

  /**
   * Get inventory levels for all items
   * @returns {Promise<Array>} - Array of inventory levels
   */
  async getInventoryLevels() {
    const locationsResponse = await this.makeRequest('/locations.json');
    const locationIds = locationsResponse.locations?.map(l => l.id) || [];

    const inventoryLevels = [];

    for (const locationId of locationIds) {
      const response = await this.makeRequest('/inventory_levels.json', 'GET', null, {
        location_ids: locationId,
        limit: 250
      });
      inventoryLevels.push(...(response.inventory_levels || []));
    }

    return inventoryLevels;
  }
}

module.exports = ShopifyClient;
