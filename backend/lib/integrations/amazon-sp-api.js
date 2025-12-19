/**
 * Amazon SP-API Integration Service
 * Handles Amazon Seller Central API operations for orders, inventory, and FBA
 */

const axios = require('axios');
const crypto = require('crypto');

class AmazonSPAPI {
  constructor(config) {
    this.sellerId = config.sellerId; // Merchant Token
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.refreshToken = config.refreshToken;
    this.accessToken = null;
    this.tokenExpiry = null;

    // Amazon SP-API endpoints (UK/EU)
    this.region = config.region || 'eu-west-1';
    this.marketplaceId = config.marketplaceId || 'A1F83G8C2ARO7P'; // UK marketplace
    this.endpoint = 'https://sellingpartnerapi-eu.amazon.com';
    this.authEndpoint = 'https://api.amazon.com/auth/o2/token';
  }

  /**
   * Get LWA (Login with Amazon) access token
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(this.authEndpoint, {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      // Token valid for 1 hour, refresh 5 minutes before expiry
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Amazon SP-API auth error:', error.response?.data || error.message);
      throw new Error(`Failed to authenticate with Amazon: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Amazon SP-API
   */
  async makeRequest(method, path, data = null, queryParams = {}) {
    const accessToken = await this.getAccessToken();

    const url = `${this.endpoint}${path}`;
    const config = {
      method,
      url,
      headers: {
        'x-amz-access-token': accessToken,
        'x-amz-date': new Date().toISOString(),
        'Content-Type': 'application/json'
      },
      params: queryParams
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Amazon SP-API request error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get orders from Amazon
   */
  async getOrders(options = {}) {
    const {
      createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      orderStatuses = ['Unshipped', 'PartiallyShipped'],
      maxResults = 100
    } = options;

    const queryParams = {
      MarketplaceIds: this.marketplaceId,
      CreatedAfter: createdAfter,
      MaxResultsPerPage: maxResults
    };

    if (orderStatuses.length > 0) {
      queryParams.OrderStatuses = orderStatuses.join(',');
    }

    try {
      const response = await this.makeRequest('GET', '/orders/v0/orders', null, queryParams);
      return response.payload?.Orders || [];
    } catch (error) {
      console.error('Error fetching Amazon orders:', error);
      throw error;
    }
  }

  /**
   * Get order items for a specific order
   */
  async getOrderItems(orderId) {
    try {
      const response = await this.makeRequest('GET', `/orders/v0/orders/${orderId}/orderItems`);
      return response.payload?.OrderItems || [];
    } catch (error) {
      console.error(`Error fetching items for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Update order shipment status
   */
  async confirmShipment(orderId, shipmentData) {
    const {
      trackingNumber,
      carrierCode,
      shippingMethod,
      items
    } = shipmentData;

    const payload = {
      marketplaceId: this.marketplaceId,
      codCollectionMethod: 'DirectPayment',
      packageDetail: {
        packageReferenceId: `PKG-${orderId}`,
        carrierCode,
        carrierName: carrierCode,
        shippingMethod,
        trackingNumber,
        shipDate: new Date().toISOString(),
        orderItems: items.map(item => ({
          orderItemId: item.orderItemId,
          quantity: item.quantity
        }))
      }
    };

    try {
      const response = await this.makeRequest('POST', `/orders/v0/orders/${orderId}/shipmentConfirmation`, payload);
      return response;
    } catch (error) {
      console.error(`Error confirming shipment for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get FBA inventory summary
   */
  async getFBAInventory(options = {}) {
    const {
      skus = [],
      nextToken = null
    } = options;

    const queryParams = {
      granularityType: 'Marketplace',
      granularityId: this.marketplaceId,
      marketplaceIds: this.marketplaceId
    };

    if (skus.length > 0) {
      queryParams.sellerSkus = skus.join(',');
    }
    if (nextToken) {
      queryParams.nextToken = nextToken;
    }

    try {
      const response = await this.makeRequest('GET', '/fba/inventory/v1/summaries', null, queryParams);
      return response.payload || { inventorySummaries: [] };
    } catch (error) {
      console.error('Error fetching FBA inventory:', error);
      throw error;
    }
  }

  /**
   * Update inventory quantity
   */
  async updateInventory(sku, quantity, fulfillmentLatency = 1) {
    // For MFN (Merchant Fulfilled) inventory updates
    const payload = {
      feedType: 'POST_INVENTORY_AVAILABILITY_DATA',
      messages: [{
        messageId: Date.now().toString(),
        sku,
        quantity,
        fulfillmentLatency
      }]
    };

    try {
      // This would typically use the Feeds API
      const response = await this.makeRequest('POST', '/feeds/2021-06-30/feeds', payload);
      return response;
    } catch (error) {
      console.error(`Error updating inventory for SKU ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Get catalog item details by ASIN or SKU
   */
  async getCatalogItem(asin) {
    const queryParams = {
      marketplaceIds: this.marketplaceId,
      includedData: 'attributes,dimensions,identifiers,images,productTypes,salesRanks,summaries'
    };

    try {
      const response = await this.makeRequest('GET', `/catalog/2022-04-01/items/${asin}`, null, queryParams);
      return response;
    } catch (error) {
      console.error(`Error fetching catalog item ${asin}:`, error);
      throw error;
    }
  }

  /**
   * Create inbound FBA shipment plan
   */
  async createInboundShipmentPlan(items, shipFromAddress) {
    const payload = {
      ShipFromAddress: shipFromAddress,
      InboundShipmentPlanRequestItems: items.map(item => ({
        SellerSKU: item.sku,
        ASIN: item.asin,
        Quantity: item.quantity,
        Condition: 'NewItem',
        QuantityInCase: item.caseQuantity || null
      })),
      LabelPrepPreference: 'SELLER_LABEL'
    };

    try {
      const response = await this.makeRequest('POST', '/fba/inbound/v0/plans', payload);
      return response.payload?.InboundShipmentPlans || [];
    } catch (error) {
      console.error('Error creating inbound shipment plan:', error);
      throw error;
    }
  }

  /**
   * Test connection to Amazon SP-API
   */
  async testConnection() {
    try {
      await this.getAccessToken();
      // Try to get seller participation to verify access
      const response = await this.makeRequest('GET', '/sellers/v1/marketplaceParticipations');
      return {
        success: true,
        message: 'Successfully connected to Amazon SP-API',
        marketplaces: response.payload?.map(p => p.marketplace?.name) || []
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = AmazonSPAPI;
