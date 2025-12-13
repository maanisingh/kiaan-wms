const prisma = require('../prisma');

/**
 * Abstract base class for marketplace integration clients
 * Provides common functionality for rate limiting, sync logging, and SKU resolution
 */
class BaseIntegrationClient {
  constructor(integrationId, credentials) {
    this.integrationId = integrationId;
    this.credentials = credentials;
    this.rateLimiter = new Map();
    this.platform = 'UNKNOWN';
  }

  /**
   * Rate limiter implementation
   * @param {string} key - Unique key for rate limit tracking
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   */
  async checkLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const limiterKey = `${this.integrationId}_${key}`;

    if (!this.rateLimiter.has(limiterKey)) {
      this.rateLimiter.set(limiterKey, []);
    }

    const requests = this.rateLimiter.get(limiterKey);

    // Remove expired requests
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

    if (validRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const waitTime = windowMs - (now - oldestRequest);

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkLimit(key, maxRequests, windowMs);
    }

    validRequests.push(now);
    this.rateLimiter.set(limiterKey, validRequests);
  }

  /**
   * Log sync operation to database
   * @param {string} syncType - ORDERS or INVENTORY
   * @param {string} status - SUCCESS, FAILED, IN_PROGRESS
   * @param {number} recordsProcessed - Number of records synced
   * @param {string} errorMessage - Error message if failed
   */
  async logSync(syncType, status, recordsProcessed, errorMessage = null) {
    try {
      await prisma.syncLog.create({
        data: {
          integrationId: this.integrationId,
          syncType,
          status,
          recordsProcessed,
          errorMessage,
          startedAt: new Date(),
          completedAt: status !== 'IN_PROGRESS' ? new Date() : null
        }
      });
    } catch (error) {
      console.error('Failed to log sync operation:', error);
    }
  }

  /**
   * Update integration's last sync timestamp
   */
  async updateLastSync() {
    try {
      await prisma.integration.update({
        where: { id: this.integrationId },
        data: { lastSync: new Date() }
      });
    } catch (error) {
      console.error('Failed to update last sync:', error);
    }
  }

  /**
   * Resolve external SKU to internal product
   * Checks integration mappings, alternative SKUs, and direct match
   * @param {string} externalSku - SKU from marketplace
   * @param {string} platform - Platform identifier for alternative SKU lookup
   * @returns {Object|null} - Product object or null
   */
  async resolveInternalSku(externalSku, platform = this.platform) {
    // 1. Check integration mapping first (explicit mapping)
    const mapping = await prisma.integrationMapping.findFirst({
      where: {
        integrationId: this.integrationId,
        externalSku: externalSku
      }
    });

    if (mapping) {
      const product = await prisma.product.findFirst({
        where: { sku: mapping.internalSku }
      });
      if (product) return product;
    }

    // 2. Check AlternativeSku table
    const altSku = await prisma.alternativeSku.findFirst({
      where: {
        sku: externalSku,
        channel: platform,
        isActive: true
      },
      include: { product: true }
    });

    if (altSku?.product) return altSku.product;

    // 3. Check platform-specific fields on Product
    const skuField = this.getSkuFieldForPlatform(platform);
    if (skuField) {
      const product = await prisma.product.findFirst({
        where: { [skuField]: externalSku }
      });
      if (product) return product;
    }

    // 4. Direct SKU match
    return prisma.product.findFirst({
      where: { sku: externalSku }
    });
  }

  /**
   * Get the product field name for platform-specific SKUs
   * @param {string} platform - Platform identifier
   * @returns {string|null} - Field name or null
   */
  getSkuFieldForPlatform(platform) {
    const mapping = {
      'SHOPIFY': 'ffdSku',
      'SHOPIFY_WHOLESALE': 'wsSku',
      'AMAZON_FBA': 'amzSku',
      'AMAZON_MFN': 'amzSkuM',
      'AMAZON_FBA_BB': 'amzSkuBb',
      'AMAZON_EU': 'amzSkuEu',
      'EBAY': null // eBay uses integration mappings
    };

    return mapping[platform] || null;
  }

  /**
   * Get company ID for this integration
   * @returns {Promise<string>} - Company ID
   */
  async getCompanyId() {
    const integration = await prisma.integration.findUnique({
      where: { id: this.integrationId }
    });
    return integration?.companyId;
  }

  /**
   * Helper for exponential backoff with retry
   * @param {Function} operation - Async function to execute
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} baseDelayMs - Base delay in milliseconds
   * @returns {Promise<any>} - Operation result
   */
  async withRetry(operation, maxRetries = 3, baseDelayMs = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        // Don't retry authentication errors
        if (error.status === 401 || error.status === 403) {
          throw error;
        }

        // Rate limit - longer backoff
        if (error.status === 429) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          console.log(`Rate limited, waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
          await this.sleep(delay);
          continue;
        }

        if (attempt === maxRetries) throw error;

        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Sleep helper
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Abstract methods to be implemented by concrete clients
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  async syncOrders(since) {
    throw new Error('syncOrders() must be implemented by subclass');
  }

  async syncInventory() {
    throw new Error('syncInventory() must be implemented by subclass');
  }

  async createFulfillment(orderId, shipmentDetails) {
    throw new Error('createFulfillment() must be implemented by subclass');
  }
}

module.exports = BaseIntegrationClient;
