const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Abstract base class for shipping carrier integrations
 * Provides common functionality for rate limiting, logging, and credential management
 */
class BaseShippingClient {
  constructor(carrierId, credentials) {
    this.carrierId = carrierId;
    this.credentials = credentials;
    this.rateLimiter = new Map();
  }

  /**
   * Rate limiter implementation
   * @param {string} key - Unique key for rate limit tracking
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   */
  async checkLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const limiterKey = `${this.carrierId}_${key}`;

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
   * Log shipping operation
   * @param {string} operation - Operation type (CREATE_SHIPMENT, CANCEL, TRACK, etc)
   * @param {string} status - SUCCESS or FAILED
   * @param {Object} details - Additional details
   */
  async logOperation(operation, status, details = {}) {
    try {
      await prisma.shippingLog.create({
        data: {
          carrierId: this.carrierId,
          operation,
          status,
          details: JSON.stringify(details),
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log shipping operation:', error);
    }
  }

  /**
   * Abstract methods to be implemented by concrete carrier clients
   */
  async createShipment(orderDetails) {
    throw new Error('createShipment() must be implemented by subclass');
  }

  async getServices(fromAddress, toAddress, parcelDetails) {
    throw new Error('getServices() must be implemented by subclass');
  }

  async trackShipment(trackingNumber) {
    throw new Error('trackShipment() must be implemented by subclass');
  }

  async cancelShipment(shipmentId) {
    throw new Error('cancelShipment() must be implemented by subclass');
  }

  async printLabel(shipmentId) {
    throw new Error('printLabel() must be implemented by subclass');
  }
}

module.exports = BaseShippingClient;
