const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Health status constants
const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

/**
 * GET /api/health/integrations
 * Returns health status of all active marketplace integrations
 */
router.get('/integrations', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      integrations: [],
      summary: { healthy: 0, degraded: 0, unhealthy: 0, total: 0 }
    };

    // Get all active marketplace connections
    const connections = await prisma.marketplaceConnection.findMany({
      where: { isActive: true },
      include: {
        orderSyncs: {
          orderBy: { syncedAt: 'desc' },
          take: 5
        },
        stockSyncs: {
          orderBy: { syncedAt: 'desc' },
          take: 5
        }
      }
    });

    results.summary.total = connections.length;

    for (const connection of connections) {
      const healthCheck = await checkIntegrationHealth(connection);
      results.integrations.push(healthCheck);

      if (healthCheck.status === HealthStatus.HEALTHY) {
        results.summary.healthy++;
      } else if (healthCheck.status === HealthStatus.DEGRADED) {
        results.summary.degraded++;
      } else {
        results.summary.unhealthy++;
      }
    }

    // Determine overall status
    if (results.summary.unhealthy > 0) {
      results.overallStatus = 'critical';
    } else if (results.summary.degraded > 0) {
      results.overallStatus = 'warning';
    } else {
      results.overallStatus = 'healthy';
    }

    res.json(results);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * GET /api/health/integrations/:platform
 * Returns detailed health check for specific platform
 */
router.get('/integrations/:platform', async (req, res) => {
  try {
    const { platform } = req.params;

    const connection = await prisma.marketplaceConnection.findFirst({
      where: {
        marketplace: platform.toUpperCase(),
        isActive: true
      },
      include: {
        orderSyncs: {
          orderBy: { syncedAt: 'desc' },
          take: 10
        },
        stockSyncs: {
          orderBy: { syncedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!connection) {
      return res.status(404).json({
        error: `No active ${platform} integration found`
      });
    }

    const detailedHealth = await performDetailedHealthCheck(connection);
    res.json(detailedHealth);
  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * GET /api/health/carriers
 * Returns health status of all shipping carriers
 */
router.get('/carriers', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      carriers: [],
      summary: { healthy: 0, degraded: 0, unhealthy: 0, total: 0 }
    };

    // Get all active courier connections
    const carriers = await prisma.courierConnection.findMany({
      where: { isActive: true }
    });

    results.summary.total = carriers.length;

    for (const carrier of carriers) {
      const healthCheck = await checkCarrierHealth(carrier);
      results.carriers.push(healthCheck);

      if (healthCheck.status === HealthStatus.HEALTHY) {
        results.summary.healthy++;
      } else if (healthCheck.status === HealthStatus.DEGRADED) {
        results.summary.degraded++;
      } else {
        results.summary.unhealthy++;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Carrier health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * GET /api/health/carriers/:carrierCode
 * Returns detailed health for specific carrier
 */
router.get('/carriers/:carrierCode', async (req, res) => {
  try {
    const { carrierCode } = req.params;

    const carrier = await prisma.courierConnection.findFirst({
      where: {
        courier: carrierCode.toUpperCase(),
        isActive: true
      }
    });

    if (!carrier) {
      return res.status(404).json({
        error: `No active ${carrierCode} carrier found`
      });
    }

    const detailedHealth = await performDetailedCarrierHealthCheck(carrier);
    res.json(detailedHealth);
  } catch (error) {
    console.error('Detailed carrier health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * POST /api/health/integrations/:id/test
 * Manually trigger a connection test for an integration
 */
router.post('/integrations/:id/test', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await prisma.marketplaceConnection.findUnique({
      where: { id }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Test connection (simplified - actual implementation would use client factory)
    const testResult = {
      success: connection.isActive && (connection.accessToken || connection.apiKey || connection.shopifyAccessToken || connection.ebayAuthToken),
      message: connection.isActive ? 'Credentials configured' : 'Integration is inactive'
    };

    res.json({
      integrationId: id,
      platform: connection.marketplace,
      ...testResult,
      testedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    res.status(500).json({
      error: 'Connection test failed',
      message: error.message
    });
  }
});

/**
 * GET /api/health/summary
 * Returns a quick summary of all integration health
 */
router.get('/summary', async (req, res) => {
  try {
    const [integrations, carriers] = await Promise.all([
      prisma.marketplaceConnection.findMany({ where: { isActive: true } }),
      prisma.courierConnection.findMany({ where: { isActive: true } })
    ]);

    // Count recent order sync failures
    const recentOrderSyncFailures = await prisma.marketplaceOrderSync.count({
      where: {
        status: 'FAILED',
        syncedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Count recent stock sync failures
    const recentStockSyncFailures = await prisma.marketplaceStockSync.count({
      where: {
        status: 'FAILED',
        syncedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get last successful syncs
    const lastOrderSyncs = await prisma.marketplaceOrderSync.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { syncedAt: 'desc' },
      take: 10,
      distinct: ['connectionId']
    });

    res.json({
      timestamp: new Date().toISOString(),
      integrations: {
        total: integrations.length,
        platforms: integrations.map(i => i.marketplace)
      },
      carriers: {
        total: carriers.length,
        types: carriers.map(c => c.courier)
      },
      metrics: {
        recentOrderSyncFailures24h: recentOrderSyncFailures,
        recentStockSyncFailures24h: recentStockSyncFailures,
        lastSyncs: lastOrderSyncs.map(s => ({
          connectionId: s.connectionId,
          externalOrderId: s.externalOrderId,
          status: s.status,
          syncedAt: s.syncedAt
        }))
      }
    });
  } catch (error) {
    console.error('Summary check failed:', error);
    res.status(500).json({
      error: 'Summary check failed',
      message: error.message
    });
  }
});

/**
 * Check health of a marketplace integration
 * @param {Object} connection - MarketplaceConnection record from database
 * @returns {Object} - Health check result
 */
async function checkIntegrationHealth(connection) {
  const startTime = Date.now();
  const result = {
    id: connection.id,
    platform: connection.marketplace,
    accountName: connection.accountName,
    status: HealthStatus.UNKNOWN,
    latencyMs: 0,
    checks: {},
    lastSync: connection.lastSyncAt,
    lastError: connection.lastSyncError
  };

  try {
    // Test 1: Check credentials are configured
    const hasCredentials = !!(
      connection.accessToken ||
      connection.apiKey ||
      connection.shopifyAccessToken ||
      connection.ebayAuthToken ||
      connection.clientId
    );
    result.checks.credentials = {
      success: hasCredentials,
      message: hasCredentials ? 'Credentials configured' : 'Missing credentials'
    };

    // Test 2: Check recent sync logs
    const recentOrderSyncs = connection.orderSyncs || [];
    const recentStockSyncs = connection.stockSyncs || [];
    const recentFailures = [
      ...recentOrderSyncs.filter(s => s.status === 'FAILED'),
      ...recentStockSyncs.filter(s => s.status === 'FAILED')
    ].length;

    result.checks.recentSyncs = {
      orderSyncs: recentOrderSyncs.length,
      stockSyncs: recentStockSyncs.length,
      failures: recentFailures,
      success: recentFailures < 3
    };

    // Test 3: Check last sync time
    const lastSyncAge = connection.lastSyncAt
      ? Date.now() - new Date(connection.lastSyncAt).getTime()
      : Infinity;
    const syncAgeHours = lastSyncAge / (1000 * 60 * 60);
    result.checks.syncAge = {
      lastSync: connection.lastSyncAt,
      hoursAgo: Math.round(syncAgeHours),
      success: syncAgeHours < 24 || !connection.lastSyncAt // OK if never synced yet
    };

    result.latencyMs = Date.now() - startTime;

    // Determine overall status
    if (hasCredentials && recentFailures === 0) {
      result.status = syncAgeHours > 24 && connection.lastSyncAt ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;
    } else if (hasCredentials) {
      result.status = HealthStatus.DEGRADED;
    } else {
      result.status = HealthStatus.UNHEALTHY;
    }
  } catch (error) {
    result.status = HealthStatus.UNHEALTHY;
    result.lastError = error.message;
    result.latencyMs = Date.now() - startTime;
  }

  return result;
}

/**
 * Perform detailed health check for an integration
 * @param {Object} connection - MarketplaceConnection record
 * @returns {Object} - Detailed health result
 */
async function performDetailedHealthCheck(connection) {
  const basicHealth = await checkIntegrationHealth(connection);

  // Add additional details
  basicHealth.details = {
    orderSyncHistory: (connection.orderSyncs || []).map(sync => ({
      externalOrderId: sync.externalOrderId,
      status: sync.status,
      syncedAt: sync.syncedAt,
      error: sync.errorMessage
    })),
    stockSyncHistory: (connection.stockSyncs || []).map(sync => ({
      sku: sync.sku,
      quantitySynced: sync.quantitySynced,
      status: sync.status,
      syncedAt: sync.syncedAt,
      error: sync.errorMessage
    })),
    configuration: {
      autoSyncOrders: connection.autoSyncOrders,
      autoSyncStock: connection.autoSyncStock,
      syncFrequency: connection.syncFrequency,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt
    }
  };

  return basicHealth;
}

/**
 * Check health of a shipping carrier
 * @param {Object} carrier - CourierConnection record from database
 * @returns {Object} - Health check result
 */
async function checkCarrierHealth(carrier) {
  const startTime = Date.now();
  const result = {
    id: carrier.id,
    courierCode: carrier.courier,
    accountName: carrier.accountName,
    status: HealthStatus.UNKNOWN,
    latencyMs: 0,
    checks: {},
    lastError: null
  };

  try {
    // Check if carrier credentials are configured
    const hasCredentials = !!(carrier.apiKey || carrier.clientId || carrier.username);
    result.checks.configured = {
      success: hasCredentials,
      message: hasCredentials ? 'Credentials configured' : 'Missing credentials'
    };

    result.latencyMs = Date.now() - startTime;
    result.status = hasCredentials && carrier.isActive ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
  } catch (error) {
    result.status = HealthStatus.UNHEALTHY;
    result.lastError = error.message;
    result.latencyMs = Date.now() - startTime;
  }

  return result;
}

/**
 * Perform detailed health check for a carrier
 * @param {Object} carrier - CourierConnection record
 * @returns {Object} - Detailed health result
 */
async function performDetailedCarrierHealthCheck(carrier) {
  const basicHealth = await checkCarrierHealth(carrier);

  // Get shipment stats
  const shipmentStats = await prisma.courierShipment.groupBy({
    by: ['status'],
    where: { connectionId: carrier.id },
    _count: true
  });
  basicHealth.details = {
    shipments: shipmentStats.reduce((acc, stat) => {
      acc[stat.status?.toLowerCase() || 'unknown'] = stat._count;
      return acc;
    }, {})
  };

  // Get recent shipments
  const recentShipments = await prisma.courierShipment.findMany({
    where: { connectionId: carrier.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  basicHealth.details.recentShipments = recentShipments.map(s => ({
    trackingNumber: s.trackingNumber,
    status: s.status,
    createdAt: s.createdAt
  }));

  return basicHealth;
}

module.exports = router;
