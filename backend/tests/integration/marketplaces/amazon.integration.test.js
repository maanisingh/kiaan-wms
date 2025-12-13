/**
 * Amazon SP-API Integration Tests
 *
 * These tests run against the actual Amazon SP-API (sandbox).
 * They verify that the AmazonSPAPIClient implementation works correctly.
 *
 * Required environment variables:
 *   AMAZON_SANDBOX_CLIENT_ID
 *   AMAZON_SANDBOX_CLIENT_SECRET
 *   AMAZON_SANDBOX_REFRESH_TOKEN
 */

const AmazonSPAPIClient = require('../../../lib/integrations/AmazonSPAPIClient');
const { getSandboxCredentials, hasSandboxCredentials } = require('../../fixtures/sandbox-credentials');

// Skip all tests if sandbox credentials not configured
const hasCredentials = hasSandboxCredentials('AMAZON_MFN');
const describeOrSkip = hasCredentials ? describe : describe.skip;

describeOrSkip('Amazon SP-API Integration Tests (MFN)', () => {
  let client;
  let testIntegrationId;

  beforeAll(async () => {
    const credentials = getSandboxCredentials('AMAZON_MFN');
    testIntegrationId = `test-amazon-mfn-${Date.now()}`;
    client = new AmazonSPAPIClient(testIntegrationId, credentials);
  });

  describe('Connection', () => {
    test('should connect with valid credentials', async () => {
      const result = await client.testConnection();

      expect(result.success).toBe(true);
      expect(result.marketplaces).toBeGreaterThan(0);
      expect(result.sellerId).toBeDefined();
    });

    test('should fail with invalid credentials', async () => {
      const badClient = new AmazonSPAPIClient('test-bad', {
        clientId: 'invalid',
        clientSecret: 'invalid',
        refreshToken: 'invalid',
        region: 'eu'
      });

      const result = await badClient.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Order Sync', () => {
    test('should fetch orders from marketplace', async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      const result = await client.syncOrders(since);

      expect(result).toHaveProperty('imported');
      expect(result).toHaveProperty('total');
      expect(typeof result.imported).toBe('number');
    });

    test('should handle empty order list', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const result = await client.syncOrders(futureDate);

      expect(result.total).toBe(0);
    });
  });

  describe('Inventory Sync', () => {
    test('should sync MFN inventory', async () => {
      const result = await client.syncInventory();

      expect(result).toHaveProperty('updated');
      expect(typeof result.updated).toBe('number');
    });
  });

  describe('Carrier Code Mapping', () => {
    test('should map internal carrier codes to Amazon names', () => {
      expect(client.mapCarrierCode('ROYAL_MAIL')).toBe('Royal Mail');
      expect(client.mapCarrierCode('DPD')).toBe('DPD');
      expect(client.mapCarrierCode('PARCEL_FORCE')).toBe('Parcelforce');
    });
  });
});

describeOrSkip('Amazon SP-API Integration Tests (FBA)', () => {
  let client;
  let testIntegrationId;

  beforeAll(async () => {
    const credentials = getSandboxCredentials('AMAZON_FBA');
    testIntegrationId = `test-amazon-fba-${Date.now()}`;
    client = new AmazonSPAPIClient(testIntegrationId, credentials);
  });

  describe('Connection', () => {
    test('should connect with valid credentials', async () => {
      const result = await client.testConnection();

      expect(result.success).toBe(true);
    });
  });

  describe('FBA Inventory', () => {
    test('should read FBA inventory levels', async () => {
      const result = await client.syncInventory();

      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('FBA');
    });
  });

  describe('Fulfillment', () => {
    test('should reject fulfillment creation for FBA orders', async () => {
      await expect(
        client.createFulfillment('test-order', { trackingNumber: 'TEST123' })
      ).rejects.toThrow('FBA orders are fulfilled by Amazon');
    });
  });
});

// Health check test - always runs
describe('Amazon SP-API Client Health', () => {
  test('should throw error if missing required credentials', () => {
    expect(() => {
      new AmazonSPAPIClient('test', {});
    }).toThrow('Amazon SP-API requires clientId');
  });

  test('should set correct platform for MFN', () => {
    // Will fail connection but tests instantiation
    const client = new AmazonSPAPIClient('test', {
      clientId: 'test',
      clientSecret: 'test',
      refreshToken: 'test',
      fulfillmentType: 'MFN'
    });
    expect(client.platform).toBe('AMAZON_MFN');
  });

  test('should set correct platform for FBA', () => {
    const client = new AmazonSPAPIClient('test', {
      clientId: 'test',
      clientSecret: 'test',
      refreshToken: 'test',
      fulfillmentType: 'FBA'
    });
    expect(client.platform).toBe('AMAZON_FBA');
  });

  test('should default to UK marketplace', () => {
    const client = new AmazonSPAPIClient('test', {
      clientId: 'test',
      clientSecret: 'test',
      refreshToken: 'test'
    });
    expect(client.marketplaceId).toBe('A1F83G8C2ARO7P');
  });
});
