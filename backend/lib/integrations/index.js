/**
 * Integration Services Index
 * Export all marketplace and courier integration services
 */

const AmazonSPAPI = require('./amazon-sp-api');
const ShopifyAPI = require('./shopify-api');
const eBayAPI = require('./ebay-api');
const RoyalMailAPI = require('./royalmail-api');

/**
 * Integration Service Factory
 * Creates the appropriate integration service based on connection type
 */
class IntegrationFactory {
  /**
   * Create marketplace integration instance
   * @param {string} marketplace - Type of marketplace (AMAZON_FBA, AMAZON_MFN, SHOPIFY, EBAY, etc.)
   * @param {object} connectionData - Connection credentials from database
   */
  static createMarketplaceIntegration(marketplace, connectionData) {
    switch (marketplace) {
      case 'AMAZON_FBA':
      case 'AMAZON_MFN':
        return new AmazonSPAPI({
          sellerId: connectionData.sellerId,
          clientId: connectionData.clientId,
          clientSecret: connectionData.clientSecret,
          refreshToken: connectionData.refreshToken,
          region: connectionData.region || 'eu-west-1',
          marketplaceId: connectionData.storeId || 'A1F83G8C2ARO7P' // UK default
        });

      case 'SHOPIFY':
        return new ShopifyAPI({
          shopDomain: connectionData.shopUrl,
          accessToken: connectionData.shopifyAccessToken || connectionData.accessToken,
          apiVersion: '2024-01'
        });

      case 'EBAY':
        return new eBayAPI({
          appId: connectionData.ebayAppId,
          devId: connectionData.ebayDevId,
          certId: connectionData.ebayCertId,
          refreshToken: connectionData.ebayRefreshToken,
          accessToken: connectionData.ebayAuthToken,
          environment: connectionData.ebayEnvironment || 'production'
        });

      default:
        throw new Error(`Unsupported marketplace type: ${marketplace}`);
    }
  }

  /**
   * Create courier integration instance
   * @param {string} courier - Type of courier (ROYAL_MAIL, PARCELFORCE, etc.)
   * @param {object} connectionData - Connection credentials from database
   */
  static createCourierIntegration(courier, connectionData) {
    switch (courier) {
      case 'ROYAL_MAIL':
      case 'PARCELFORCE':
        return new RoyalMailAPI({
          apiKey: connectionData.royalMailApiKey || connectionData.apiKey,
          accountNumber: connectionData.accountNumber,
          postingLocation: connectionData.royalMailPostingLocation
        });

      case 'AMAZON_BUY_SHIPPING':
        // Amazon Buy Shipping uses the Amazon SP-API
        return new AmazonSPAPI({
          sellerId: connectionData.sellerId,
          clientId: connectionData.clientId,
          clientSecret: connectionData.clientSecret,
          refreshToken: connectionData.refreshToken,
          region: connectionData.region || 'eu-west-1'
        });

      default:
        throw new Error(`Unsupported courier type: ${courier}`);
    }
  }

  /**
   * Test a marketplace connection
   * @param {string} marketplace - Type of marketplace
   * @param {object} connectionData - Connection credentials
   */
  static async testMarketplaceConnection(marketplace, connectionData) {
    try {
      const integration = this.createMarketplaceIntegration(marketplace, connectionData);
      return await integration.testConnection();
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Test a courier connection
   * @param {string} courier - Type of courier
   * @param {object} connectionData - Connection credentials
   */
  static async testCourierConnection(courier, connectionData) {
    try {
      const integration = this.createCourierIntegration(courier, connectionData);
      return await integration.testConnection();
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }
}

module.exports = {
  AmazonSPAPI,
  ShopifyAPI,
  eBayAPI,
  RoyalMailAPI,
  IntegrationFactory
};
