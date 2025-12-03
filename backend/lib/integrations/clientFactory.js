const ShopifyClient = require('./ShopifyClient');
const AmazonSPAPIClient = require('./AmazonSPAPIClient');
const eBayClient = require('./eBayClient');
const TikTokShopClient = require('./TikTokShopClient');
const encryptionService = require('../encryption');

/**
 * Factory for creating marketplace integration clients
 * Handles decryption of credentials and instantiation of correct client class
 */
class IntegrationClientFactory {
  /**
   * Create integration client based on platform type
   * @param {Object} integration - Integration model from database
   * @returns {BaseIntegrationClient} - Instantiated client
   */
  static createClient(integration) {
    if (!integration) {
      throw new Error('Integration object is required');
    }

    if (!integration.isActive) {
      throw new Error(`Integration ${integration.id} is not active`);
    }

    // Decrypt stored credentials
    let credentials;
    try {
      const encryptedObj = JSON.parse(integration.credentials);
      const decryptedJson = encryptionService.decrypt(encryptedObj);
      credentials = JSON.parse(decryptedJson);
    } catch (error) {
      throw new Error(`Failed to decrypt credentials for integration ${integration.id}: ${error.message}`);
    }

    // Instantiate appropriate client based on platform
    switch (integration.platform) {
      case 'SHOPIFY':
        return new ShopifyClient(integration.id, credentials);

      case 'AMAZON_MFN':
      case 'AMAZON_FBA':
        return new AmazonSPAPIClient(integration.id, credentials);

      case 'EBAY':
        return new eBayClient(integration.id, credentials);

      case 'TIKTOK':
        return new TikTokShopClient(integration.id, credentials);

      case 'TEMU':
        // Note: Temu API documentation not publicly available yet
        // Placeholder for future implementation
        throw new Error('Temu integration not yet implemented - awaiting API documentation');

      default:
        throw new Error(`Unsupported integration platform: ${integration.platform}`);
    }
  }

  /**
   * Get list of supported platforms
   * @returns {Array<Object>} - Platform configurations
   */
  static getSupportedPlatforms() {
    return [
      {
        platform: 'SHOPIFY',
        name: 'Shopify',
        type: 'MARKETPLACE',
        requiredCredentials: ['apiKey', 'apiSecret', 'shop', 'accessToken'],
        description: 'Shopify online store integration with REST Admin API',
        oauth: true,
        supportsWebhooks: true
      },
      {
        platform: 'AMAZON_MFN',
        name: 'Amazon Seller (MFN)',
        type: 'MARKETPLACE',
        requiredCredentials: ['clientId', 'clientSecret', 'refreshToken', 'awsAccessKey', 'awsSecretKey', 'roleArn', 'marketplaceId', 'region'],
        description: 'Amazon Merchant Fulfilled Network - ship your own orders',
        oauth: true,
        supportsWebhooks: false
      },
      {
        platform: 'AMAZON_FBA',
        name: 'Amazon FBA',
        type: 'MARKETPLACE',
        requiredCredentials: ['clientId', 'clientSecret', 'refreshToken', 'awsAccessKey', 'awsSecretKey', 'roleArn', 'marketplaceId', 'region'],
        description: 'Amazon Fulfillment by Amazon - inventory sync only',
        oauth: true,
        supportsWebhooks: false
      },
      {
        platform: 'EBAY',
        name: 'eBay',
        type: 'MARKETPLACE',
        requiredCredentials: ['appId', 'certId', 'devId', 'authToken', 'siteId'],
        description: 'eBay marketplace integration via Trading & Fulfillment APIs',
        oauth: false,
        supportsWebhooks: true
      },
      {
        platform: 'TIKTOK',
        name: 'TikTok Shop',
        type: 'MARKETPLACE',
        requiredCredentials: ['appKey', 'appSecret', 'accessToken', 'shopId', 'region'],
        description: 'TikTok Shop integration for social commerce',
        oauth: true,
        supportsWebhooks: true
      },
      {
        platform: 'TEMU',
        name: 'Temu',
        type: 'MARKETPLACE',
        requiredCredentials: [],
        description: 'Temu marketplace integration (pending API documentation)',
        oauth: false,
        supportsWebhooks: false,
        status: 'COMING_SOON'
      }
    ];
  }

  /**
   * Validate credentials for a platform
   * @param {string} platform - Platform identifier
   * @param {Object} credentials - Credentials object to validate
   * @returns {Object} - Validation result with errors if any
   */
  static validateCredentials(platform, credentials) {
    const platformConfig = this.getSupportedPlatforms().find(p => p.platform === platform);

    if (!platformConfig) {
      return {
        valid: false,
        errors: [`Unknown platform: ${platform}`]
      };
    }

    const errors = [];
    const missingFields = [];

    for (const field of platformConfig.requiredCredentials) {
      if (!credentials[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      errors.push(`Missing required credentials: ${missingFields.join(', ')}`);
    }

    // Platform-specific validation
    switch (platform) {
      case 'SHOPIFY':
        if (credentials.shop && !credentials.shop.includes('.myshopify.com')) {
          errors.push('Shopify shop must be in format: your-store.myshopify.com');
        }
        break;

      case 'AMAZON_MFN':
      case 'AMAZON_FBA':
        const validRegions = ['na', 'eu', 'fe'];
        if (credentials.region && !validRegions.includes(credentials.region)) {
          errors.push(`Amazon region must be one of: ${validRegions.join(', ')}`);
        }
        break;

      case 'EBAY':
        if (credentials.siteId && isNaN(credentials.siteId)) {
          errors.push('eBay siteId must be a number');
        }
        break;

      case 'TIKTOK':
        const validTTRegions = ['US', 'UK', 'EU'];
        if (credentials.region && !validTTRegions.includes(credentials.region)) {
          errors.push(`TikTok region must be one of: ${validTTRegions.join(', ')}`);
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Test integration connection
   * @param {Object} integration - Integration model
   * @returns {Promise<Object>} - Connection test result
   */
  static async testConnection(integration) {
    try {
      const client = this.createClient(integration);

      // Attempt a simple API call to verify connectivity
      switch (integration.platform) {
        case 'SHOPIFY':
          const shopifyTest = await client.shopify.clients.Rest({
            session: client.session
          }).get({ path: 'shop' });
          return {
            success: true,
            message: `Connected to Shopify shop: ${shopifyTest.body.shop.name}`
          };

        case 'AMAZON_MFN':
        case 'AMAZON_FBA':
          const amazonTest = await client.spApi.callAPI({
            operation: 'getMarketplaceParticipations',
            endpoint: 'sellers'
          });
          return {
            success: true,
            message: `Connected to Amazon (${amazonTest.length} marketplace(s))`
          };

        case 'EBAY':
          const ebayTest = await client.eBay.sell.account.getFulfillmentPolicy({});
          return {
            success: true,
            message: 'Connected to eBay successfully'
          };

        case 'TIKTOK':
          const tiktokTest = await client.makeRequest('/api/shop/get_authorized_shop', 'GET', {
            shop_id: client.shopId
          });
          return {
            success: true,
            message: `Connected to TikTok Shop: ${tiktokTest.shop_name}`
          };

        default:
          return {
            success: false,
            message: 'Connection test not implemented for this platform'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }
}

module.exports = IntegrationClientFactory;
