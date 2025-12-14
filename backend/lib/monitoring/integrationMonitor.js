const cron = require('node-cron');
const prisma = require('../prisma');

const IntegrationClientFactory = require('../integrations/clientFactory');
const AlertService = require('./alertService');

/**
 * Integration Monitor Service
 * Performs scheduled health checks on all integrations and sends alerts on failures
 */
class IntegrationMonitor {
  constructor(options = {}) {
    this.alertService = new AlertService();
    this.healthHistory = new Map();
    this.failureThreshold = options.failureThreshold || 3;
    this.isRunning = false;
    this.jobs = [];
  }

  /**
   * Start all monitoring schedules
   */
  start() {
    if (this.isRunning) {
      console.log('[IntegrationMonitor] Already running');
      return;
    }

    console.log('[IntegrationMonitor] Starting monitoring service...');

    // Every 5 minutes: Quick health ping
    const quickCheck = cron.schedule('*/5 * * * *', () => {
      this.runQuickHealthCheck();
    });
    this.jobs.push(quickCheck);

    // Every 15 minutes: Full health check
    const fullCheck = cron.schedule('*/15 * * * *', () => {
      this.runFullHealthCheck();
    });
    this.jobs.push(fullCheck);

    // Every hour: Deep integration test
    const deepCheck = cron.schedule('0 * * * *', () => {
      this.runDeepHealthCheck();
    });
    this.jobs.push(deepCheck);

    // Daily at 6 AM: Token expiry check
    const tokenCheck = cron.schedule('0 6 * * *', () => {
      this.checkTokenExpiry();
    });
    this.jobs.push(tokenCheck);

    // Run initial check on startup
    setTimeout(() => {
      this.runQuickHealthCheck();
    }, 5000);

    this.isRunning = true;
    console.log('[IntegrationMonitor] Monitoring started with schedules:');
    console.log('  - Quick health: every 5 minutes');
    console.log('  - Full health: every 15 minutes');
    console.log('  - Deep check: every hour');
    console.log('  - Token expiry: daily at 6 AM');
  }

  /**
   * Stop all monitoring schedules
   */
  stop() {
    console.log('[IntegrationMonitor] Stopping monitoring service...');
    for (const job of this.jobs) {
      job.stop();
    }
    this.jobs = [];
    this.isRunning = false;
    console.log('[IntegrationMonitor] Monitoring stopped');
  }

  /**
   * Quick health ping - lightweight connectivity check
   */
  async runQuickHealthCheck() {
    const startTime = Date.now();
    console.log('[IntegrationMonitor] Running quick health check...');

    try {
      const integrations = await prisma.marketplaceConnection.findMany({
        where: { isActive: true }
      });

      for (const integration of integrations) {
        await this.pingIntegration(integration);
      }

      console.log(`[IntegrationMonitor] Quick check completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[IntegrationMonitor] Quick health check failed:', error);
      await this.alertService.sendAlert('MONITOR_FAILURE', {
        error: error.message,
        checkType: 'quick'
      }, 'warning');
    }
  }

  /**
   * Full health check - connection test with metrics
   */
  async runFullHealthCheck() {
    const startTime = Date.now();
    console.log('[IntegrationMonitor] Running full health check...');

    try {
      const integrations = await prisma.marketplaceConnection.findMany({
        where: { isActive: true }
      });

      const results = [];

      for (const integration of integrations) {
        const result = await this.checkIntegration(integration);
        results.push(result);

        // Process result
        await this.processHealthResult(integration, result);
      }

      // Log summary
      const healthy = results.filter(r => r.healthy).length;
      const unhealthy = results.filter(r => !r.healthy).length;

      console.log(`[IntegrationMonitor] Full check completed in ${Date.now() - startTime}ms`);
      console.log(`  Healthy: ${healthy}, Unhealthy: ${unhealthy}`);
    } catch (error) {
      console.error('[IntegrationMonitor] Full health check failed:', error);
      await this.alertService.sendAlert('MONITOR_FAILURE', {
        error: error.message,
        checkType: 'full'
      }, 'warning');
    }
  }

  /**
   * Deep health check - actual API operations
   */
  async runDeepHealthCheck() {
    const startTime = Date.now();
    console.log('[IntegrationMonitor] Running deep health check...');

    try {
      const integrations = await prisma.marketplaceConnection.findMany({
        where: { isActive: true }
      });

      for (const integration of integrations) {
        try {
          const client = IntegrationClientFactory.createClient(integration);

          // Attempt a lightweight operation based on platform
          switch (integration.marketplace) {
            case 'SHOPIFY':
              await client.makeRequest('/shop.json', 'GET');
              break;
            case 'AMAZON_MFN':
            case 'AMAZON_FBA':
              await client.testConnection();
              break;
            case 'EBAY':
              await client.eBay.sell.account.getFulfillmentPolicy({});
              break;
            default:
              await client.testConnection();
          }

          // Update health status
          await prisma.marketplaceConnection.update({
            where: { id: integration.id },
            data: {
              lastSyncAt: new Date(),
              lastSyncError: null
            }
          });
        } catch (error) {
          console.error(`[IntegrationMonitor] Deep check failed for ${integration.marketplace}:`, error.message);

          await prisma.marketplaceConnection.update({
            where: { id: integration.id },
            data: {
              lastSyncAt: new Date(),
              lastSyncError: error.message
            }
          });
        }
      }

      console.log(`[IntegrationMonitor] Deep check completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[IntegrationMonitor] Deep health check failed:', error);
    }
  }

  /**
   * Check token expiry for all integrations
   */
  async checkTokenExpiry() {
    console.log('[IntegrationMonitor] Checking token expiry...');

    const warningDays = 7;
    const criticalDays = 1;

    try {
      const integrations = await prisma.marketplaceConnection.findMany({
        where: {
          isActive: true,
          tokenExpiresAt: { not: null }
        }
      });

      for (const integration of integrations) {
        const expiresAt = new Date(integration.tokenExpiresAt);
        const daysUntilExpiry = (expiresAt - Date.now()) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry <= criticalDays) {
          await this.alertService.sendAlert('TOKEN_EXPIRY_CRITICAL', {
            integration: integration.marketplace,
            integrationId: integration.id,
            expiresAt: expiresAt.toISOString(),
            daysRemaining: Math.max(0, Math.floor(daysUntilExpiry))
          }, 'critical');
        } else if (daysUntilExpiry <= warningDays) {
          await this.alertService.sendAlert('TOKEN_EXPIRY_WARNING', {
            integration: integration.marketplace,
            integrationId: integration.id,
            expiresAt: expiresAt.toISOString(),
            daysRemaining: Math.floor(daysUntilExpiry)
          }, 'warning');
        }
      }

      console.log('[IntegrationMonitor] Token expiry check completed');
    } catch (error) {
      console.error('[IntegrationMonitor] Token expiry check failed:', error);
    }
  }

  /**
   * Ping single integration for connectivity
   * @param {Object} integration - Integration record
   * @returns {Object} - Ping result
   */
  async pingIntegration(integration) {
    const startTime = Date.now();

    try {
      const result = await IntegrationClientFactory.testConnection(integration);

      return {
        integrationId: integration.id,
        platform: integration.marketplace,
        healthy: result.success,
        latencyMs: Date.now() - startTime,
        error: result.success ? null : result.message
      };
    } catch (error) {
      return {
        integrationId: integration.id,
        platform: integration.marketplace,
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Full check of single integration
   * @param {Object} integration - Integration record
   * @returns {Object} - Check result
   */
  async checkIntegration(integration) {
    const startTime = Date.now();
    const result = {
      integrationId: integration.id,
      platform: integration.marketplace,
      healthy: false,
      latencyMs: 0,
      checks: {},
      error: null
    };

    try {
      // Test connection
      const connectionResult = await IntegrationClientFactory.testConnection(integration);
      result.checks.connection = {
        success: connectionResult.success,
        message: connectionResult.message
      };

      // Check recent sync logs
      const recentSyncs = await prisma.marketplaceOrderSync.findMany({
        where: {
          connectionId: integration.id,
          syncedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { syncedAt: 'desc' },
        take: 10
      });

      const recentFailures = recentSyncs.filter(s => s.status === 'FAILED').length;
      result.checks.recentSyncs = {
        total: recentSyncs.length,
        failures: recentFailures,
        success: recentFailures < 3
      };

      // Determine overall health
      result.healthy = connectionResult.success && recentFailures < 3;
      result.latencyMs = Date.now() - startTime;
    } catch (error) {
      result.error = error.message;
      result.latencyMs = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Process health result and update history
   * @param {Object} integration - Integration record
   * @param {Object} result - Health check result
   */
  async processHealthResult(integration, result) {
    const key = integration.id;
    const history = this.healthHistory.get(key) || [];

    history.push({
      timestamp: new Date(),
      healthy: result.healthy,
      latencyMs: result.latencyMs,
      error: result.error
    });

    // Keep last 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = history.filter(h => h.timestamp.getTime() > cutoff);
    this.healthHistory.set(key, filtered);

    // Check for consecutive failures
    const recentResults = filtered.slice(-this.failureThreshold);
    const allFailed = recentResults.length === this.failureThreshold &&
                     recentResults.every(h => !h.healthy);

    if (allFailed) {
      await this.alertService.sendAlert('INTEGRATION_DOWN', {
        integration: integration.marketplace,
        integrationId: integration.id,
        consecutiveFailures: this.failureThreshold,
        lastError: result.error
      }, 'critical');
    }

    // Check for high latency
    if (result.latencyMs > 5000) {
      await this.alertService.sendAlert('HIGH_LATENCY', {
        integration: integration.marketplace,
        integrationId: integration.id,
        latencyMs: result.latencyMs
      }, 'warning');
    }

    // Update database - use existing fields
    await prisma.marketplaceConnection.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncError: result.error || null
      }
    });
  }

  /**
   * Get health history for an integration
   * @param {string} integrationId - Integration ID
   * @returns {Array} - Health history
   */
  getHealthHistory(integrationId) {
    return this.healthHistory.get(integrationId) || [];
  }

  /**
   * Get current status of all integrations
   * @returns {Object} - Status summary
   */
  async getStatus() {
    const integrations = await prisma.marketplaceConnection.findMany({
      where: { isActive: true },
      select: {
        id: true,
        marketplace: true,
        accountName: true,
        lastSyncAt: true,
        lastSyncError: true
      }
    });

    return {
      isRunning: this.isRunning,
      integrations: integrations.map(i => ({
        ...i,
        history: this.getHealthHistory(i.id).slice(-10)
      })),
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Manually trigger health check for specific integration
   * @param {string} integrationId - Integration ID
   * @returns {Object} - Check result
   */
  async checkSingleIntegration(integrationId) {
    const integration = await prisma.marketplaceConnection.findUnique({
      where: { id: integrationId }
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    const result = await this.checkIntegration(integration);
    await this.processHealthResult(integration, result);

    return result;
  }
}

// Export singleton instance
let monitorInstance = null;

module.exports = {
  IntegrationMonitor,
  getMonitor: () => {
    if (!monitorInstance) {
      monitorInstance = new IntegrationMonitor();
    }
    return monitorInstance;
  }
};
