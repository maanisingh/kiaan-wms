const BaseIntegrationClient = require('./BaseIntegrationClient');
const SellingPartner = require('amazon-sp-api');
const prisma = require('../prisma');

/**
 * Amazon SP-API integration client
 * Supports both MFN (Merchant Fulfilled Network) and FBA (Fulfillment by Amazon) modes
 */
class AmazonSPAPIClient extends BaseIntegrationClient {
  constructor(integrationId, credentials) {
    super(integrationId, credentials);

    // Determine fulfillment type from platform
    this.fulfillmentType = credentials.fulfillmentType || 'MFN';
    this.platform = this.fulfillmentType === 'FBA' ? 'AMAZON_FBA' : 'AMAZON_MFN';

    // Validate required credentials
    const required = ['clientId', 'clientSecret', 'refreshToken'];
    for (const field of required) {
      if (!credentials[field]) {
        throw new Error(`Amazon SP-API requires ${field}`);
      }
    }

    // Initialize SP-API client
    this.spApi = new SellingPartner({
      region: credentials.region || 'eu', // 'na', 'eu', 'fe'
      refresh_token: credentials.refreshToken,
      credentials: {
        SELLING_PARTNER_APP_CLIENT_ID: credentials.clientId,
        SELLING_PARTNER_APP_CLIENT_SECRET: credentials.clientSecret,
        AWS_ACCESS_KEY_ID: credentials.awsAccessKey,
        AWS_SECRET_ACCESS_KEY: credentials.awsSecretKey
      },
      options: {
        auto_request_tokens: true,
        auto_request_throttled: true, // SDK handles rate limiting
        use_sandbox: credentials.sandbox || false
      }
    });

    // Default marketplace IDs by region
    this.marketplaceIds = {
      'eu': {
        'UK': 'A1F83G8C2ARO7P',
        'DE': 'A1PA6795UKMFR9',
        'FR': 'A13V1IB3VIYZZH',
        'IT': 'APJ6JRA9NG5V4',
        'ES': 'A1RKKUPIHCS9HS'
      },
      'na': {
        'US': 'ATVPDKIKX0DER',
        'CA': 'A2EUQ1WTGCTBG2',
        'MX': 'A1AM78C64UM0Y8'
      },
      'fe': {
        'JP': 'A1VC38T7YXB528',
        'AU': 'A39IBJ37TRP1C6'
      }
    };

    this.marketplaceId = credentials.marketplaceId || 'A1F83G8C2ARO7P'; // Default UK
    this.region = credentials.region || 'eu';
  }

  /**
   * Test connection to Amazon SP-API
   * @returns {Promise<Object>} - Connection result
   */
  async testConnection() {
    try {
      const result = await this.spApi.callAPI({
        operation: 'getMarketplaceParticipations',
        endpoint: 'sellers'
      });

      const activeMarketplaces = result.filter(mp => mp.participation.isParticipating);

      return {
        success: true,
        marketplaces: activeMarketplaces.length,
        sellerId: activeMarketplaces[0]?.participation?.sellerId || 'Unknown',
        message: `Connected to ${activeMarketplaces.length} marketplace(s)`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync orders from Amazon
   * @param {Date} since - Fetch orders created after this date
   * @returns {Promise<Object>} - Sync result
   */
  async syncOrders(since) {
    try {
      const sinceDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let imported = 0;
      let total = 0;
      let nextToken = null;

      await this.logSync('ORDERS', 'IN_PROGRESS', 0);

      // Determine fulfillment channel filter
      const fulfillmentChannels = this.fulfillmentType === 'FBA' ? ['AFN'] : ['MFN'];

      do {
        const params = {
          MarketplaceIds: [this.marketplaceId],
          CreatedAfter: sinceDate.toISOString(),
          FulfillmentChannels: fulfillmentChannels
        };

        if (this.fulfillmentType === 'MFN') {
          // Only unshipped orders for MFN
          params.OrderStatuses = ['Unshipped', 'PartiallyShipped'];
        }

        if (nextToken) {
          params.NextToken = nextToken;
        }

        const response = await this.spApi.callAPI({
          operation: 'getOrders',
          endpoint: 'orders',
          query: params
        });

        const orders = response.Orders || [];
        total += orders.length;

        for (const order of orders) {
          // Get order items
          const orderItems = await this.getOrderItems(order.AmazonOrderId);
          order.OrderItems = orderItems;

          const result = await this.importOrder(order);
          if (result) imported++;
        }

        nextToken = response.NextToken;
      } while (nextToken);

      await this.logSync('ORDERS', 'SUCCESS', imported);
      await this.updateLastSync();

      return { imported, total };
    } catch (error) {
      await this.logSync('ORDERS', 'FAILED', 0, error.message);
      throw error;
    }
  }

  /**
   * Get order items for an Amazon order
   * @param {string} orderId - Amazon order ID
   * @returns {Promise<Array>} - Array of order items
   */
  async getOrderItems(orderId) {
    try {
      const response = await this.spApi.callAPI({
        operation: 'getOrderItems',
        endpoint: 'orders',
        path: {
          orderId
        }
      });

      return response.OrderItems || [];
    } catch (error) {
      console.error(`Failed to get order items for ${orderId}:`, error.message);
      return [];
    }
  }

  /**
   * Import single Amazon order into WMS
   * @param {Object} amazonOrder - Amazon order object
   * @returns {Promise<Object|null>} - Created order or null
   */
  async importOrder(amazonOrder) {
    // Check if already imported
    const existing = await prisma.orderImport.findUnique({
      where: {
        integrationId_externalOrderId: {
          integrationId: this.integrationId,
          externalOrderId: amazonOrder.AmazonOrderId
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
        externalOrderId: amazonOrder.AmazonOrderId,
        orderData: JSON.stringify(amazonOrder),
        status: 'PENDING'
      }
    });

    try {
      const orderItems = [];

      for (const item of amazonOrder.OrderItems || []) {
        const sku = item.SellerSKU;
        if (!sku) continue;

        const product = await this.resolveInternalSku(sku);

        if (product) {
          orderItems.push({
            productId: product.id,
            quantity: item.QuantityOrdered,
            price: parseFloat(item.ItemPrice?.Amount || 0)
          });
        }
      }

      if (orderItems.length > 0) {
        const shippingAddress = amazonOrder.ShippingAddress || {};

        const internalOrder = await prisma.order.create({
          data: {
            companyId: integration.companyId,
            orderNumber: amazonOrder.AmazonOrderId,
            status: 'PENDING',
            customerName: shippingAddress.Name || amazonOrder.BuyerInfo?.BuyerName,
            customerEmail: amazonOrder.BuyerInfo?.BuyerEmail,
            customerPhone: shippingAddress.Phone,
            shippingAddress: JSON.stringify({
              line1: shippingAddress.AddressLine1,
              line2: shippingAddress.AddressLine2,
              line3: shippingAddress.AddressLine3,
              city: shippingAddress.City,
              state: shippingAddress.StateOrRegion,
              postcode: shippingAddress.PostalCode,
              country: shippingAddress.CountryCode
            }),
            totalAmount: parseFloat(amazonOrder.OrderTotal?.Amount || 0),
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
      console.error('Failed to import Amazon order:', error);
      return null;
    }
  }

  /**
   * Sync inventory to Amazon (MFN) or read inventory (FBA)
   * @returns {Promise<Object>} - Sync result
   */
  async syncInventory() {
    if (this.fulfillmentType === 'FBA') {
      return this.syncFBAInventory();
    }
    return this.syncMFNInventory();
  }

  /**
   * Sync inventory for MFN (push to Amazon)
   * @returns {Promise<Object>} - Sync result
   */
  async syncMFNInventory() {
    try {
      await this.logSync('INVENTORY', 'IN_PROGRESS', 0);

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
          // Update inventory via Listings API
          await this.spApi.callAPI({
            operation: 'patchListingsItem',
            endpoint: 'listings',
            path: {
              sellerId: await this.getSellerId(),
              sku: mapping.externalSku
            },
            body: {
              productType: 'PRODUCT',
              patches: [
                {
                  op: 'replace',
                  path: '/attributes/fulfillment_availability',
                  value: [
                    {
                      fulfillment_channel_code: 'MERCHANT',
                      quantity: totalQty,
                      marketplace_id: this.marketplaceId
                    }
                  ]
                }
              ]
            },
            query: {
              marketplaceIds: this.marketplaceId
            }
          });

          updated++;
        } catch (error) {
          console.error(`Failed to update Amazon inventory for ${mapping.internalSku}:`, error.message);
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
   * Read FBA inventory levels (Amazon manages FBA inventory)
   * @returns {Promise<Object>} - FBA inventory levels
   */
  async syncFBAInventory() {
    try {
      await this.logSync('INVENTORY', 'IN_PROGRESS', 0);

      let inventoryItems = [];
      let nextToken = null;

      do {
        const params = {
          marketplaceIds: this.marketplaceId,
          granularityType: 'Marketplace',
          granularityId: this.marketplaceId
        };

        if (nextToken) {
          params.nextToken = nextToken;
        }

        const response = await this.spApi.callAPI({
          operation: 'getInventorySummaries',
          endpoint: 'fbaInventory',
          query: params
        });

        inventoryItems.push(...(response.inventorySummaries || []));
        nextToken = response.pagination?.nextToken;
      } while (nextToken);

      // Update local records with FBA levels (read-only sync)
      let updated = 0;

      for (const item of inventoryItems) {
        const mapping = await prisma.integrationMapping.findFirst({
          where: {
            integrationId: this.integrationId,
            externalSku: item.sellerSku
          }
        });

        if (mapping) {
          // Store FBA quantity in a separate field or log
          await prisma.integrationMapping.update({
            where: { id: mapping.id },
            data: {
              lastExternalQty: item.totalQuantity,
              lastSyncedAt: new Date()
            }
          });
          updated++;
        }
      }

      await this.logSync('INVENTORY', 'SUCCESS', updated);
      await this.updateLastSync();

      return {
        updated,
        fbaItems: inventoryItems.length,
        message: 'FBA inventory read (Amazon-managed)'
      };
    } catch (error) {
      await this.logSync('INVENTORY', 'FAILED', 0, error.message);
      throw error;
    }
  }

  /**
   * Create shipment confirmation for MFN order
   * @param {string} orderId - Amazon order ID
   * @param {Object} shipmentDetails - Tracking info
   * @returns {Promise<Object>} - Confirmation result
   */
  async createFulfillment(orderId, shipmentDetails) {
    if (this.fulfillmentType === 'FBA') {
      throw new Error('FBA orders are fulfilled by Amazon - cannot create shipment');
    }

    try {
      // Submit shipment confirmation
      const response = await this.spApi.callAPI({
        operation: 'confirmShipment',
        endpoint: 'orders',
        path: {
          orderId
        },
        body: {
          packageDetail: {
            carrierCode: this.mapCarrierCode(shipmentDetails.carrierCode),
            trackingNumber: shipmentDetails.trackingNumber,
            shipDate: new Date().toISOString(),
            shippingServiceCode: shipmentDetails.serviceCode
          },
          marketplaceId: this.marketplaceId
        }
      });

      // Update internal order status
      const orderImport = await prisma.orderImport.findFirst({
        where: {
          integrationId: this.integrationId,
          externalOrderId: orderId
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
        orderId,
        trackingNumber: shipmentDetails.trackingNumber
      };
    } catch (error) {
      console.error('Failed to confirm Amazon shipment:', error);
      throw error;
    }
  }

  /**
   * Map internal carrier code to Amazon carrier code
   * @param {string} carrierCode - Internal carrier code
   * @returns {string} - Amazon carrier code
   */
  mapCarrierCode(carrierCode) {
    const mapping = {
      'ROYAL_MAIL': 'Royal Mail',
      'DPD': 'DPD',
      'PARCEL_FORCE': 'Parcelforce',
      'HERMES': 'Hermes',
      'UPS': 'UPS',
      'FEDEX': 'FedEx',
      'DHL': 'DHL'
    };

    return mapping[carrierCode] || carrierCode;
  }

  /**
   * Get seller ID from marketplace participations
   * @returns {Promise<string>} - Seller ID
   */
  async getSellerId() {
    if (this._sellerId) return this._sellerId;

    const result = await this.spApi.callAPI({
      operation: 'getMarketplaceParticipations',
      endpoint: 'sellers'
    });

    const participation = result.find(mp =>
      mp.marketplace.id === this.marketplaceId &&
      mp.participation.isParticipating
    );

    this._sellerId = participation?.participation?.sellerId;
    return this._sellerId;
  }

  /**
   * Get order details by ID
   * @param {string} orderId - Amazon order ID
   * @returns {Promise<Object>} - Order details
   */
  async getOrder(orderId) {
    return this.spApi.callAPI({
      operation: 'getOrder',
      endpoint: 'orders',
      path: { orderId }
    });
  }
}

module.exports = AmazonSPAPIClient;
