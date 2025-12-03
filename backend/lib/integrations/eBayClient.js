const BaseIntegrationClient = require('./BaseIntegrationClient');
const eBayApi = require('ebay-api');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class eBayClient extends BaseIntegrationClient {
  constructor(integrationId, credentials) {
    super(integrationId, credentials);

    // Initialize eBay API SDK
    this.eBay = new eBayApi({
      appId: credentials.appId,
      certId: credentials.certId,
      devId: credentials.devId,
      authToken: credentials.authToken,
      sandbox: credentials.sandbox || false,
      siteId: credentials.siteId || eBayApi.SiteId.EBAY_GB // Default to UK
    });
  }

  /**
   * Sync orders from eBay using Fulfillment API
   * @param {Date} since - Fetch orders created after this date
   */
  async syncOrders(since) {
    try {
      const sinceDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // eBay Fulfillment API - Get Orders
      const ordersResponse = await this.eBay.sell.fulfillment.getOrders({
        filter: `creationdate:[${sinceDate.toISOString()}..],orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}`
      });

      const orders = ordersResponse.orders || [];
      let imported = 0;

      for (const order of orders) {
        await this.importOrder(order);
        imported++;

        // Rate limiting - eBay allows 5000 calls/day
        await this.rateLimiter.checkLimit('ebay', 5000, 86400000);
      }

      await this.logSync('ORDERS', 'SUCCESS', imported);
      await this.updateLastSync();

      return { imported, total: orders.length };
    } catch (error) {
      await this.logSync('ORDERS', 'FAILED', 0, error.message);
      throw error;
    }
  }

  /**
   * Import single eBay order into WMS
   * @param {Object} ebayOrder - eBay order object from Fulfillment API
   */
  async importOrder(ebayOrder) {
    const existing = await prisma.orderImport.findUnique({
      where: {
        integrationId_externalOrderId: {
          integrationId: this.integrationId,
          externalOrderId: ebayOrder.orderId
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
        externalOrderId: ebayOrder.orderId,
        orderData: JSON.stringify(ebayOrder),
        status: 'PENDING'
      }
    });

    try {
      const orderItems = [];

      for (const lineItem of ebayOrder.lineItems || []) {
        const sku = lineItem.sku;

        // Check for integration mapping first
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
              quantity: lineItem.quantity,
              price: parseFloat(lineItem.lineItemCost?.value || 0)
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
              quantity: lineItem.quantity,
              price: parseFloat(lineItem.lineItemCost?.value || 0)
            });
          }
        }
      }

      if (orderItems.length > 0) {
        // Extract shipping address
        const shippingAddress = ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo;

        const internalOrder = await prisma.order.create({
          data: {
            companyId: integration.companyId,
            orderNumber: ebayOrder.orderId,
            status: 'PENDING',
            customerName: shippingAddress?.fullName || ebayOrder.buyer?.username,
            customerEmail: shippingAddress?.email || ebayOrder.buyer?.username,
            shippingAddress: JSON.stringify(shippingAddress),
            totalAmount: parseFloat(ebayOrder.pricingSummary?.total?.value || 0),
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
      console.error('Failed to import eBay order:', error);
    }

    return orderImport;
  }

  /**
   * Sync inventory to eBay using Inventory API
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
          if (mapping.externalSku) {
            // Update eBay inventory item
            await this.eBay.sell.inventory.updateInventoryItem(mapping.externalSku, {
              availability: {
                shipToLocationAvailability: {
                  quantity: totalQty
                }
              }
            });

            updated++;
          }
        } catch (error) {
          console.error(`Failed to update eBay inventory for ${mapping.internalSku}:`, error.message);
        }

        // Rate limiting
        await this.rateLimiter.checkLimit('ebay', 5000, 86400000);
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
   * Create eBay shipping fulfillment
   * @param {string} orderId - eBay order ID
   * @param {Object} shipmentDetails - Tracking and carrier info
   */
  async createShippingFulfillment(orderId, shipmentDetails) {
    try {
      const response = await this.eBay.sell.fulfillment.createShippingFulfillment(orderId, {
        lineItems: shipmentDetails.lineItems.map(item => ({
          lineItemId: item.lineItemId,
          quantity: item.quantity
        })),
        shippedDate: new Date().toISOString(),
        shippingCarrierCode: shipmentDetails.carrierCode, // e.g., 'ROYAL_MAIL', 'DPD'
        trackingNumber: shipmentDetails.trackingNumber
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

      return response;
    } catch (error) {
      console.error('Failed to create eBay shipping fulfillment:', error);
      throw error;
    }
  }

  /**
   * Get available shipping services for order
   * @param {string} orderId - eBay order ID
   */
  async getShippingQuotes(orderId) {
    try {
      const orderDetails = await this.eBay.sell.fulfillment.getOrder(orderId);

      // Return shipping service options from order
      const shippingServices = orderDetails.fulfillmentStartInstructions?.[0]?.shippingStep?.shippingServiceOptions || [];

      return shippingServices.map(service => ({
        serviceCode: service.shippingCarrierCode,
        serviceName: service.shippingServiceCode,
        cost: parseFloat(service.shippingCost?.value || 0),
        currency: service.shippingCost?.currency
      }));
    } catch (error) {
      console.error('Failed to get eBay shipping quotes:', error);
      throw error;
    }
  }
}

module.exports = eBayClient;
