/**
 * Shopify Integration Tests
 *
 * These tests run against the actual Shopify API (sandbox or development store).
 * They verify that the ShopifyClient implementation works correctly.
 *
 * Required environment variables:
 *   SHOPIFY_TEST_SHOP - Your test shop URL (e.g., test-store.myshopify.com)
 *   SHOPIFY_TEST_ACCESS_TOKEN - Admin API access token
 */

const ShopifyClient = require('../../../lib/integrations/ShopifyClient');
const { getSandboxCredentials, hasSandboxCredentials } = require('../../fixtures/sandbox-credentials');

// Skip all tests if sandbox credentials not configured
const hasCredentials = hasSandboxCredentials('SHOPIFY');
const describeOrSkip = hasCredentials ? describe : describe.skip;

describeOrSkip('Shopify Integration Tests', () => {
  let client;
  let testIntegrationId;

  beforeAll(async () => {
    const credentials = getSandboxCredentials('SHOPIFY');
    testIntegrationId = `test-shopify-${Date.now()}`;
    client = new ShopifyClient(testIntegrationId, credentials);
  });

  describe('Connection', () => {
    test('should connect with valid credentials', async () => {
      const result = await client.testConnection();

      expect(result.success).toBe(true);
      expect(result.shopName).toBeDefined();
      expect(result.shopUrl).toContain('.myshopify.com');
    });

    test('should fail with invalid credentials', async () => {
      const badClient = new ShopifyClient('test-bad', {
        shop: 'fake-store.myshopify.com',
        accessToken: 'invalid-token'
      });

      const result = await badClient.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Order Sync', () => {
    test('should fetch orders from shop', async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      const result = await client.syncOrders(since);

      expect(result).toHaveProperty('imported');
      expect(result).toHaveProperty('total');
      expect(typeof result.imported).toBe('number');
      expect(typeof result.total).toBe('number');
    });

    test('should handle empty order list', async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const result = await client.syncOrders(futureDate);

      expect(result.total).toBe(0);
    });
  });

  describe('API Requests', () => {
    test('should make successful GET request', async () => {
      const response = await client.makeRequest('/shop.json');

      expect(response).toHaveProperty('shop');
      expect(response.shop).toHaveProperty('name');
      expect(response.shop).toHaveProperty('email');
    });

    test('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests
      const promises = Array(5).fill().map(() =>
        client.makeRequest('/shop.json')
      );

      const results = await Promise.all(promises);

      // All should succeed (rate limiter should handle throttling)
      results.forEach(result => {
        expect(result).toHaveProperty('shop');
      });
    });
  });

  describe('Products', () => {
    test('should fetch products list', async () => {
      const products = await client.getProducts();

      expect(Array.isArray(products)).toBe(true);
      // Products may be empty in test store
      if (products.length > 0) {
        expect(products[0]).toHaveProperty('id');
        expect(products[0]).toHaveProperty('title');
      }
    });
  });

  describe('Inventory', () => {
    test('should fetch inventory levels', async () => {
      const levels = await client.getInventoryLevels();

      expect(Array.isArray(levels)).toBe(true);
      if (levels.length > 0) {
        expect(levels[0]).toHaveProperty('inventory_item_id');
        expect(levels[0]).toHaveProperty('available');
      }
    });
  });

  describe('Carrier Code Mapping', () => {
    test('should map internal carrier codes to Shopify names', () => {
      expect(client.mapCarrierCode('ROYAL_MAIL')).toBe('Royal Mail');
      expect(client.mapCarrierCode('DPD')).toBe('DPD UK');
      expect(client.mapCarrierCode('PARCEL_FORCE')).toBe('Parcelforce');
      expect(client.mapCarrierCode('UNKNOWN_CARRIER')).toBe('UNKNOWN_CARRIER');
    });
  });
});

// Health check test - always runs
describe('Shopify Client Health', () => {
  test('should instantiate without credentials for unit testing', () => {
    expect(() => {
      new ShopifyClient('test', { shop: 'test.myshopify.com', accessToken: 'token' });
    }).not.toThrow();
  });

  test('should normalize shop URL', () => {
    const client1 = new ShopifyClient('test', { shop: 'test-shop', accessToken: 'token' });
    expect(client1.shopUrl).toBe('test-shop.myshopify.com');

    const client2 = new ShopifyClient('test', { shop: 'test-shop.myshopify.com', accessToken: 'token' });
    expect(client2.shopUrl).toBe('test-shop.myshopify.com');

    const client3 = new ShopifyClient('test', { shop: 'https://test-shop.myshopify.com', accessToken: 'token' });
    expect(client3.shopUrl).toBe('test-shop.myshopify.com');
  });

  test('should throw error if missing required credentials', () => {
    expect(() => {
      new ShopifyClient('test', {});
    }).toThrow('Shopify integration requires shop URL and accessToken');
  });
});
