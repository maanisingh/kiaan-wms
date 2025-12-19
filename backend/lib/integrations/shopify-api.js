/**
 * Shopify Admin API Integration Service
 * Handles Shopify store operations for orders, products, and inventory
 */

const axios = require('axios');

class ShopifyAPI {
  constructor(config) {
    this.shopDomain = config.shopDomain; // e.g., 'free-from-direct.myshopify.com'
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '2024-01';

    // Build base URL
    this.baseUrl = `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  /**
   * Make authenticated request to Shopify Admin API
   */
  async makeRequest(method, endpoint, data = null, queryParams = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      method,
      url,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
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
      console.error('Shopify API request error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get orders from Shopify
   */
  async getOrders(options = {}) {
    const {
      status = 'any', // open, closed, cancelled, any
      fulfillmentStatus = 'unfulfilled', // fulfilled, unfulfilled, partial, any
      financialStatus = 'paid', // authorized, pending, paid, any
      createdAtMin = null,
      limit = 50,
      sinceId = null
    } = options;

    const queryParams = {
      status,
      fulfillment_status: fulfillmentStatus,
      financial_status: financialStatus,
      limit
    };

    if (createdAtMin) {
      queryParams.created_at_min = createdAtMin;
    }
    if (sinceId) {
      queryParams.since_id = sinceId;
    }

    try {
      const response = await this.makeRequest('GET', '/orders.json', null, queryParams);
      return response.orders || [];
    } catch (error) {
      console.error('Error fetching Shopify orders:', error);
      throw error;
    }
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId) {
    try {
      const response = await this.makeRequest('GET', `/orders/${orderId}.json`);
      return response.order;
    } catch (error) {
      console.error(`Error fetching Shopify order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Create fulfillment for an order
   */
  async createFulfillment(orderId, fulfillmentData) {
    const {
      trackingNumber,
      trackingCompany,
      trackingUrls,
      lineItems, // array of { id, quantity }
      notifyCustomer = true
    } = fulfillmentData;

    // First, get the fulfillment order
    const fulfillmentOrdersResponse = await this.makeRequest(
      'GET',
      `/orders/${orderId}/fulfillment_orders.json`
    );

    const fulfillmentOrders = fulfillmentOrdersResponse.fulfillment_orders || [];
    if (fulfillmentOrders.length === 0) {
      throw new Error('No fulfillment orders found for this order');
    }

    // Create fulfillment for each fulfillment order
    const results = [];
    for (const fulfillmentOrder of fulfillmentOrders) {
      const payload = {
        fulfillment: {
          line_items_by_fulfillment_order: [{
            fulfillment_order_id: fulfillmentOrder.id,
            fulfillment_order_line_items: lineItems.map(item => ({
              id: item.id,
              quantity: item.quantity
            }))
          }],
          tracking_info: {
            number: trackingNumber,
            company: trackingCompany,
            urls: trackingUrls || []
          },
          notify_customer: notifyCustomer
        }
      };

      try {
        const response = await this.makeRequest('POST', '/fulfillments.json', payload);
        results.push(response.fulfillment);
      } catch (error) {
        console.error(`Error creating fulfillment for order ${orderId}:`, error);
        results.push({ error: error.message });
      }
    }

    return results;
  }

  /**
   * Get all products
   */
  async getProducts(options = {}) {
    const {
      limit = 250,
      sinceId = null,
      status = 'active'
    } = options;

    const queryParams = {
      limit,
      status
    };

    if (sinceId) {
      queryParams.since_id = sinceId;
    }

    try {
      const response = await this.makeRequest('GET', '/products.json', null, queryParams);
      return response.products || [];
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    try {
      const response = await this.makeRequest('GET', `/products/${productId}.json`);
      return response.product;
    } catch (error) {
      console.error(`Error fetching Shopify product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get inventory levels
   */
  async getInventoryLevels(locationId, inventoryItemIds = []) {
    const queryParams = {
      location_ids: locationId
    };

    if (inventoryItemIds.length > 0) {
      queryParams.inventory_item_ids = inventoryItemIds.join(',');
    }

    try {
      const response = await this.makeRequest('GET', '/inventory_levels.json', null, queryParams);
      return response.inventory_levels || [];
    } catch (error) {
      console.error('Error fetching Shopify inventory levels:', error);
      throw error;
    }
  }

  /**
   * Set inventory level
   */
  async setInventoryLevel(inventoryItemId, locationId, quantity) {
    const payload = {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: quantity
    };

    try {
      const response = await this.makeRequest('POST', '/inventory_levels/set.json', payload);
      return response.inventory_level;
    } catch (error) {
      console.error(`Error setting inventory level for item ${inventoryItemId}:`, error);
      throw error;
    }
  }

  /**
   * Adjust inventory level
   */
  async adjustInventoryLevel(inventoryItemId, locationId, adjustment) {
    const payload = {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available_adjustment: adjustment
    };

    try {
      const response = await this.makeRequest('POST', '/inventory_levels/adjust.json', payload);
      return response.inventory_level;
    } catch (error) {
      console.error(`Error adjusting inventory level for item ${inventoryItemId}:`, error);
      throw error;
    }
  }

  /**
   * Get locations (warehouses/stores)
   */
  async getLocations() {
    try {
      const response = await this.makeRequest('GET', '/locations.json');
      return response.locations || [];
    } catch (error) {
      console.error('Error fetching Shopify locations:', error);
      throw error;
    }
  }

  /**
   * Get customers
   */
  async getCustomers(options = {}) {
    const {
      limit = 50,
      sinceId = null
    } = options;

    const queryParams = { limit };
    if (sinceId) {
      queryParams.since_id = sinceId;
    }

    try {
      const response = await this.makeRequest('GET', '/customers.json', null, queryParams);
      return response.customers || [];
    } catch (error) {
      console.error('Error fetching Shopify customers:', error);
      throw error;
    }
  }

  /**
   * Update order tags
   */
  async updateOrderTags(orderId, tags) {
    const payload = {
      order: {
        id: orderId,
        tags: Array.isArray(tags) ? tags.join(', ') : tags
      }
    };

    try {
      const response = await this.makeRequest('PUT', `/orders/${orderId}.json`, payload);
      return response.order;
    } catch (error) {
      console.error(`Error updating order ${orderId} tags:`, error);
      throw error;
    }
  }

  /**
   * Update product (for sync purposes)
   */
  async updateProduct(productId, productData) {
    const payload = {
      product: productData
    };

    try {
      const response = await this.makeRequest('PUT', `/products/${productId}.json`, payload);
      return response.product;
    } catch (error) {
      console.error(`Error updating Shopify product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get webhooks
   */
  async getWebhooks() {
    try {
      const response = await this.makeRequest('GET', '/webhooks.json');
      return response.webhooks || [];
    } catch (error) {
      console.error('Error fetching Shopify webhooks:', error);
      throw error;
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(topic, address) {
    const payload = {
      webhook: {
        topic,
        address,
        format: 'json'
      }
    };

    try {
      const response = await this.makeRequest('POST', '/webhooks.json', payload);
      return response.webhook;
    } catch (error) {
      console.error(`Error creating webhook for topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Test connection to Shopify
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('GET', '/shop.json');
      return {
        success: true,
        message: 'Successfully connected to Shopify',
        shop: {
          name: response.shop.name,
          domain: response.shop.domain,
          email: response.shop.email,
          currency: response.shop.currency
        }
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

module.exports = ShopifyAPI;
