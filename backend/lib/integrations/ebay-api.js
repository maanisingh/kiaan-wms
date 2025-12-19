/**
 * eBay API Integration Service
 * Handles eBay marketplace operations for orders, inventory, and listings
 */

const axios = require('axios');

class eBayAPI {
  constructor(config) {
    this.appId = config.appId; // Client ID
    this.devId = config.devId;
    this.certId = config.certId; // Client Secret
    this.refreshToken = config.refreshToken;
    this.accessToken = config.accessToken;
    this.tokenExpiry = config.tokenExpiry;
    this.environment = config.environment || 'production'; // 'sandbox' or 'production'

    // eBay API endpoints
    this.authEndpoint = this.environment === 'sandbox'
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';

    this.apiEndpoint = this.environment === 'sandbox'
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';

    // OAuth scopes required
    this.scopes = [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      'https://api.ebay.com/oauth/api_scope/sell.marketing'
    ];
  }

  /**
   * Get OAuth access token using refresh token
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Create Base64 encoded credentials
    const credentials = Buffer.from(`${this.appId}:${this.certId}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', this.refreshToken);
    params.append('scope', this.scopes.join(' '));

    try {
      const response = await axios.post(this.authEndpoint, params.toString(), {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      // Token valid for expires_in seconds, refresh 5 minutes before expiry
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('eBay OAuth error:', error.response?.data || error.message);
      throw new Error(`Failed to authenticate with eBay: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to eBay API
   */
  async makeRequest(method, path, data = null, queryParams = {}) {
    const accessToken = await this.getAccessToken();

    const url = `${this.apiEndpoint}${path}`;
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
      console.error('eBay API request error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get orders from eBay
   */
  async getOrders(options = {}) {
    const {
      filter = null, // e.g., 'orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}'
      orderIds = null,
      limit = 50,
      offset = 0
    } = options;

    const queryParams = {
      limit,
      offset
    };

    if (filter) {
      queryParams.filter = filter;
    }
    if (orderIds) {
      queryParams.orderIds = Array.isArray(orderIds) ? orderIds.join(',') : orderIds;
    }

    try {
      const response = await this.makeRequest('GET', '/sell/fulfillment/v1/order', null, queryParams);
      return response.orders || [];
    } catch (error) {
      console.error('Error fetching eBay orders:', error);
      throw error;
    }
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId) {
    try {
      const response = await this.makeRequest('GET', `/sell/fulfillment/v1/order/${orderId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching eBay order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Create shipment for an order
   */
  async createShipment(orderId, shipmentData) {
    const {
      trackingNumber,
      shippingCarrierCode,
      lineItems // array of { lineItemId, quantity }
    } = shipmentData;

    const payload = {
      lineItems: lineItems.map(item => ({
        lineItemId: item.lineItemId,
        quantity: item.quantity
      })),
      shippingCarrierCode,
      trackingNumber
    };

    try {
      const response = await this.makeRequest(
        'POST',
        `/sell/fulfillment/v1/order/${orderId}/shipping_fulfillment`,
        payload
      );
      return response;
    } catch (error) {
      console.error(`Error creating shipment for eBay order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get inventory items
   */
  async getInventoryItems(options = {}) {
    const {
      limit = 100,
      offset = 0
    } = options;

    const queryParams = {
      limit,
      offset
    };

    try {
      const response = await this.makeRequest('GET', '/sell/inventory/v1/inventory_item', null, queryParams);
      return response.inventoryItems || [];
    } catch (error) {
      console.error('Error fetching eBay inventory items:', error);
      throw error;
    }
  }

  /**
   * Get inventory item by SKU
   */
  async getInventoryItem(sku) {
    try {
      const response = await this.makeRequest('GET', `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`);
      return response;
    } catch (error) {
      console.error(`Error fetching eBay inventory item ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Create or update inventory item
   */
  async upsertInventoryItem(sku, itemData) {
    const {
      condition = 'NEW',
      quantity,
      product // { title, description, aspects, imageUrls }
    } = itemData;

    const payload = {
      condition,
      availability: {
        shipToLocationAvailability: {
          quantity
        }
      },
      product
    };

    try {
      const response = await this.makeRequest(
        'PUT',
        `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
        payload
      );
      return response;
    } catch (error) {
      console.error(`Error upserting eBay inventory item ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Update inventory quantity
   */
  async updateQuantity(sku, quantity) {
    try {
      // First get the existing item
      const existingItem = await this.getInventoryItem(sku);

      // Update only the quantity
      existingItem.availability = {
        shipToLocationAvailability: {
          quantity
        }
      };

      const response = await this.makeRequest(
        'PUT',
        `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
        existingItem
      );
      return response;
    } catch (error) {
      console.error(`Error updating quantity for eBay SKU ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Get offers (listings) for a SKU
   */
  async getOffers(sku) {
    try {
      const response = await this.makeRequest('GET', '/sell/inventory/v1/offer', null, { sku });
      return response.offers || [];
    } catch (error) {
      console.error(`Error fetching offers for eBay SKU ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Publish offer (list item)
   */
  async publishOffer(offerId) {
    try {
      const response = await this.makeRequest('POST', `/sell/inventory/v1/offer/${offerId}/publish`);
      return response;
    } catch (error) {
      console.error(`Error publishing eBay offer ${offerId}:`, error);
      throw error;
    }
  }

  /**
   * Get selling policies
   */
  async getSellingPolicies() {
    try {
      const fulfillmentPolicies = await this.makeRequest('GET', '/sell/account/v1/fulfillment_policy');
      const paymentPolicies = await this.makeRequest('GET', '/sell/account/v1/payment_policy');
      const returnPolicies = await this.makeRequest('GET', '/sell/account/v1/return_policy');

      return {
        fulfillment: fulfillmentPolicies.fulfillmentPolicies || [],
        payment: paymentPolicies.paymentPolicies || [],
        return: returnPolicies.returnPolicies || []
      };
    } catch (error) {
      console.error('Error fetching eBay selling policies:', error);
      throw error;
    }
  }

  /**
   * Bulk update inventory quantities
   */
  async bulkUpdateInventory(items) {
    // items: array of { sku, quantity }
    const requests = items.map(item => ({
      shipToLocationAvailability: {
        quantity: item.quantity
      },
      sku: item.sku
    }));

    const payload = {
      requests
    };

    try {
      const response = await this.makeRequest(
        'POST',
        '/sell/inventory/v1/bulk_update_price_quantity',
        payload
      );
      return response;
    } catch (error) {
      console.error('Error bulk updating eBay inventory:', error);
      throw error;
    }
  }

  /**
   * Test connection to eBay
   */
  async testConnection() {
    try {
      await this.getAccessToken();
      // Try to get marketplace info to verify access
      const response = await this.makeRequest('GET', '/sell/marketplace/v1/marketplace/EBAY_GB');
      return {
        success: true,
        message: 'Successfully connected to eBay API',
        environment: this.environment,
        marketplace: response.marketplaceId
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

module.exports = eBayAPI;
