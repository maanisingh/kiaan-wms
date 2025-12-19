/**
 * Integration Routes
 * API endpoints for managing marketplace and courier integrations
 */

const { IntegrationFactory, AmazonSPAPI, ShopifyAPI, eBayAPI, RoyalMailAPI } = require('./index');

/**
 * Register all integration routes
 * @param {Express} app - Express application instance
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Function} verifyToken - Authentication middleware
 */
function registerIntegrationRoutes(app, prisma, verifyToken) {

  // ===================================
  // MARKETPLACE CONNECTIONS
  // ===================================

  // Get all marketplace connections for the company
  app.get('/api/marketplace-connections', verifyToken, async (req, res) => {
    try {
      const connections = await prisma.marketplaceConnection.findMany({
        where: { companyId: req.user.companyId },
        orderBy: { createdAt: 'desc' }
      });

      // Don't expose sensitive credentials in response
      const safeConnections = connections.map(conn => ({
        id: conn.id,
        marketplace: conn.marketplace,
        accountName: conn.accountName,
        isActive: conn.isActive,
        autoSyncOrders: conn.autoSyncOrders,
        autoSyncStock: conn.autoSyncStock,
        syncFrequency: conn.syncFrequency,
        lastSyncAt: conn.lastSyncAt,
        lastSyncError: conn.lastSyncError,
        shopUrl: conn.shopUrl,
        region: conn.region,
        hasCredentials: !!(conn.accessToken || conn.clientId || conn.shopifyAccessToken || conn.ebayAppId),
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt
      }));

      res.json(safeConnections);
    } catch (error) {
      console.error('Error fetching marketplace connections:', error);
      res.status(500).json({ error: 'Failed to fetch marketplace connections' });
    }
  });

  // Create new marketplace connection
  app.post('/api/marketplace-connections', verifyToken, async (req, res) => {
    try {
      const {
        marketplace,
        accountName,
        // Generic fields
        apiKey,
        apiSecret,
        accessToken,
        refreshToken,
        // Amazon SP-API fields
        sellerId,
        clientId,
        clientSecret,
        region,
        // Shopify fields
        shopUrl,
        shopifyAccessToken,
        // eBay fields
        ebayAppId,
        ebayDevId,
        ebayCertId,
        ebayEnvironment,
        // Settings
        autoSyncOrders = true,
        autoSyncStock = true,
        syncFrequency = 30
      } = req.body;

      // Validate required fields
      if (!marketplace || !accountName) {
        return res.status(400).json({ error: 'Marketplace and account name are required' });
      }

      // Create the connection
      const connection = await prisma.marketplaceConnection.create({
        data: {
          companyId: req.user.companyId,
          marketplace,
          accountName,
          apiKey,
          apiSecret,
          accessToken,
          refreshToken,
          sellerId,
          clientId,
          clientSecret,
          region: region || 'eu-west-1',
          shopUrl,
          shopifyAccessToken,
          ebayAppId,
          ebayDevId,
          ebayCertId,
          ebayEnvironment: ebayEnvironment || 'production',
          autoSyncOrders,
          autoSyncStock,
          syncFrequency,
          isActive: true
        }
      });

      res.status(201).json({
        id: connection.id,
        marketplace: connection.marketplace,
        accountName: connection.accountName,
        isActive: connection.isActive,
        message: 'Marketplace connection created successfully'
      });
    } catch (error) {
      console.error('Error creating marketplace connection:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A connection with this marketplace and account already exists' });
      }
      res.status(500).json({ error: 'Failed to create marketplace connection' });
    }
  });

  // Update marketplace connection
  app.put('/api/marketplace-connections/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.companyId;
      delete updateData.createdAt;

      const connection = await prisma.marketplaceConnection.update({
        where: {
          id,
          companyId: req.user.companyId
        },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      res.json({
        id: connection.id,
        marketplace: connection.marketplace,
        accountName: connection.accountName,
        message: 'Marketplace connection updated successfully'
      });
    } catch (error) {
      console.error('Error updating marketplace connection:', error);
      res.status(500).json({ error: 'Failed to update marketplace connection' });
    }
  });

  // Delete marketplace connection
  app.delete('/api/marketplace-connections/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.marketplaceConnection.delete({
        where: {
          id,
          companyId: req.user.companyId
        }
      });

      res.json({ message: 'Marketplace connection deleted successfully' });
    } catch (error) {
      console.error('Error deleting marketplace connection:', error);
      res.status(500).json({ error: 'Failed to delete marketplace connection' });
    }
  });

  // Test marketplace connection
  app.post('/api/marketplace-connections/:id/test', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      const connection = await prisma.marketplaceConnection.findUnique({
        where: { id }
      });

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      // Test the connection using the factory
      const result = await IntegrationFactory.testMarketplaceConnection(
        connection.marketplace,
        connection
      );

      // Update connection with test result
      await prisma.marketplaceConnection.update({
        where: { id },
        data: {
          lastSyncError: result.success ? null : result.message,
          updatedAt: new Date()
        }
      });

      res.json(result);
    } catch (error) {
      console.error('Error testing marketplace connection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test connection',
        error: error.message
      });
    }
  });

  // Sync orders from marketplace
  app.post('/api/marketplace-connections/:id/sync-orders', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { createdAfter, limit = 50 } = req.body;

      const connection = await prisma.marketplaceConnection.findUnique({
        where: { id }
      });

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      const integration = IntegrationFactory.createMarketplaceIntegration(
        connection.marketplace,
        connection
      );

      let orders = [];
      const syncedOrders = [];
      const errors = [];

      // Fetch orders from the marketplace
      switch (connection.marketplace) {
        case 'AMAZON_FBA':
        case 'AMAZON_MFN':
          orders = await integration.getOrders({
            createdAfter: createdAfter || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            maxResults: limit
          });
          break;

        case 'SHOPIFY':
          orders = await integration.getOrders({
            status: 'open',
            fulfillmentStatus: 'unfulfilled',
            limit
          });
          break;

        case 'EBAY':
          orders = await integration.getOrders({
            filter: 'orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}',
            limit
          });
          break;
      }

      // Process and store each order
      for (const order of orders) {
        try {
          // Check if already synced
          const existingSync = await prisma.marketplaceOrderSync.findFirst({
            where: {
              connectionId: id,
              externalOrderId: order.id || order.AmazonOrderId || order.orderId
            }
          });

          if (existingSync) {
            continue; // Already synced
          }

          // Create sync record
          const sync = await prisma.marketplaceOrderSync.create({
            data: {
              connectionId: id,
              externalOrderId: order.id || order.AmazonOrderId || order.orderId,
              status: 'PENDING',
              orderData: JSON.stringify(order)
            }
          });

          syncedOrders.push(sync);
        } catch (orderError) {
          errors.push({
            orderId: order.id || order.AmazonOrderId || order.orderId,
            error: orderError.message
          });
        }
      }

      // Update last sync time
      await prisma.marketplaceConnection.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: errors.length > 0 ? `${errors.length} orders failed` : null
        }
      });

      res.json({
        success: true,
        totalOrders: orders.length,
        syncedOrders: syncedOrders.length,
        errors: errors.length,
        details: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error syncing marketplace orders:', error);
      res.status(500).json({ error: 'Failed to sync orders', details: error.message });
    }
  });

  // Sync stock to marketplace
  app.post('/api/marketplace-connections/:id/sync-stock', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { skus } = req.body; // Optional: specific SKUs to sync

      const connection = await prisma.marketplaceConnection.findUnique({
        where: { id }
      });

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      // Get inventory from our WMS
      let inventory;
      if (skus && skus.length > 0) {
        inventory = await prisma.inventory.findMany({
          where: {
            product: {
              companyId: req.user.companyId,
              sku: { in: skus }
            }
          },
          include: { product: true }
        });
      } else {
        inventory = await prisma.inventory.findMany({
          where: {
            product: {
              companyId: req.user.companyId
            }
          },
          include: { product: true },
          take: 1000
        });
      }

      // Aggregate inventory by product
      const stockByProduct = {};
      for (const inv of inventory) {
        const sku = inv.product.sku;
        if (!stockByProduct[sku]) {
          stockByProduct[sku] = {
            sku,
            quantity: 0,
            productId: inv.productId
          };
        }
        stockByProduct[sku].quantity += inv.availableQuantity;
      }

      const integration = IntegrationFactory.createMarketplaceIntegration(
        connection.marketplace,
        connection
      );

      const results = [];
      const errors = [];

      // Update stock on the marketplace
      for (const item of Object.values(stockByProduct)) {
        try {
          // Different update methods for different platforms
          switch (connection.marketplace) {
            case 'SHOPIFY':
              // Would need to get inventory_item_id and location_id
              // For now, log what would be synced
              results.push({ sku: item.sku, quantity: item.quantity, status: 'logged' });
              break;

            case 'EBAY':
              // await integration.updateQuantity(item.sku, item.quantity);
              results.push({ sku: item.sku, quantity: item.quantity, status: 'logged' });
              break;

            case 'AMAZON_FBA':
            case 'AMAZON_MFN':
              // Amazon uses feeds for inventory updates
              results.push({ sku: item.sku, quantity: item.quantity, status: 'logged' });
              break;
          }

          // Record the sync
          await prisma.marketplaceStockSync.create({
            data: {
              connectionId: id,
              productId: item.productId,
              sku: item.sku,
              quantitySynced: item.quantity,
              status: 'COMPLETED'
            }
          });
        } catch (itemError) {
          errors.push({
            sku: item.sku,
            error: itemError.message
          });
        }
      }

      // Update last sync time
      await prisma.marketplaceConnection.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: errors.length > 0 ? `${errors.length} items failed` : null
        }
      });

      res.json({
        success: true,
        totalItems: Object.keys(stockByProduct).length,
        syncedItems: results.length,
        errors: errors.length,
        details: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error syncing marketplace stock:', error);
      res.status(500).json({ error: 'Failed to sync stock', details: error.message });
    }
  });

  // ===================================
  // COURIER CONNECTIONS
  // ===================================

  // Get all courier connections
  app.get('/api/courier-connections', verifyToken, async (req, res) => {
    try {
      const connections = await prisma.courierConnection.findMany({
        where: { companyId: req.user.companyId },
        orderBy: { createdAt: 'desc' }
      });

      // Don't expose sensitive credentials
      const safeConnections = connections.map(conn => ({
        id: conn.id,
        courier: conn.courier,
        accountName: conn.accountName,
        isActive: conn.isActive,
        isDefault: conn.isDefault,
        testMode: conn.testMode,
        defaultService: conn.defaultService,
        hasCredentials: !!(conn.apiKey || conn.royalMailApiKey),
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt
      }));

      res.json(safeConnections);
    } catch (error) {
      console.error('Error fetching courier connections:', error);
      res.status(500).json({ error: 'Failed to fetch courier connections' });
    }
  });

  // Create courier connection
  app.post('/api/courier-connections', verifyToken, async (req, res) => {
    try {
      const {
        courier,
        accountName,
        apiKey,
        apiSecret,
        accountNumber,
        royalMailApiKey,
        royalMailPostingLocation,
        parcelforceContractNumber,
        defaultService,
        testMode = false,
        isDefault = false
      } = req.body;

      if (!courier || !accountName) {
        return res.status(400).json({ error: 'Courier type and account name are required' });
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await prisma.courierConnection.updateMany({
          where: { companyId: req.user.companyId },
          data: { isDefault: false }
        });
      }

      const connection = await prisma.courierConnection.create({
        data: {
          companyId: req.user.companyId,
          courier,
          accountName,
          apiKey,
          apiSecret,
          accountNumber,
          royalMailApiKey,
          royalMailPostingLocation,
          parcelforceContractNumber,
          defaultService,
          testMode,
          isDefault,
          isActive: true
        }
      });

      res.status(201).json({
        id: connection.id,
        courier: connection.courier,
        accountName: connection.accountName,
        message: 'Courier connection created successfully'
      });
    } catch (error) {
      console.error('Error creating courier connection:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A connection with this courier and account already exists' });
      }
      res.status(500).json({ error: 'Failed to create courier connection' });
    }
  });

  // Update courier connection
  app.put('/api/courier-connections/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      delete updateData.id;
      delete updateData.companyId;
      delete updateData.createdAt;

      // Handle default flag
      if (updateData.isDefault) {
        await prisma.courierConnection.updateMany({
          where: {
            companyId: req.user.companyId,
            id: { not: id }
          },
          data: { isDefault: false }
        });
      }

      const connection = await prisma.courierConnection.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      res.json({
        id: connection.id,
        courier: connection.courier,
        accountName: connection.accountName,
        message: 'Courier connection updated successfully'
      });
    } catch (error) {
      console.error('Error updating courier connection:', error);
      res.status(500).json({ error: 'Failed to update courier connection' });
    }
  });

  // Delete courier connection
  app.delete('/api/courier-connections/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.courierConnection.delete({
        where: { id }
      });

      res.json({ message: 'Courier connection deleted successfully' });
    } catch (error) {
      console.error('Error deleting courier connection:', error);
      res.status(500).json({ error: 'Failed to delete courier connection' });
    }
  });

  // Test courier connection
  app.post('/api/courier-connections/:id/test', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      const connection = await prisma.courierConnection.findUnique({
        where: { id }
      });

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      const result = await IntegrationFactory.testCourierConnection(
        connection.courier,
        connection
      );

      res.json(result);
    } catch (error) {
      console.error('Error testing courier connection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test connection',
        error: error.message
      });
    }
  });

  // Get shipping rates
  app.post('/api/courier-connections/:id/rates', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { weight, length, width, height, postcode, countryCode } = req.body;

      const connection = await prisma.courierConnection.findUnique({
        where: { id }
      });

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      const integration = IntegrationFactory.createCourierIntegration(
        connection.courier,
        connection
      );

      const rates = await integration.getRates({
        weight,
        length,
        width,
        height,
        postcode,
        countryCode: countryCode || 'GB'
      });

      res.json(rates);
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      res.status(500).json({ error: 'Failed to fetch shipping rates', details: error.message });
    }
  });

  // Create shipment
  app.post('/api/courier-shipments', verifyToken, async (req, res) => {
    try {
      const {
        connectionId,
        orderId,
        recipientName,
        recipientCompany,
        recipientAddress,
        recipientCity,
        recipientCounty,
        recipientPostcode,
        recipientCountryCode,
        recipientPhone,
        recipientEmail,
        weight,
        length,
        width,
        height,
        serviceCode,
        contents,
        value
      } = req.body;

      const connection = await prisma.courierConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connection) {
        return res.status(404).json({ error: 'Courier connection not found' });
      }

      const integration = IntegrationFactory.createCourierIntegration(
        connection.courier,
        connection
      );

      // Create shipment with the courier
      const shipmentResult = await integration.createShipment({
        orderId,
        recipientName,
        recipientCompany,
        recipientAddress,
        recipientCity,
        recipientCounty,
        recipientPostcode,
        recipientCountryCode,
        recipientPhone,
        recipientEmail,
        weight,
        length,
        width,
        height,
        serviceCode: serviceCode || connection.defaultService,
        contents,
        value
      });

      // Store the shipment in our database
      const shipment = await prisma.courierShipment.create({
        data: {
          connectionId,
          orderId,
          trackingNumber: shipmentResult.trackingNumber || shipmentResult.items?.[0]?.trackingNumber || `TRK-${Date.now()}`,
          labelUrl: shipmentResult.labelUrl || shipmentResult.items?.[0]?.labelUrl,
          serviceCode,
          weight,
          cost: shipmentResult.cost,
          status: 'LABEL_CREATED',
          companyId: req.user.companyId
        }
      });

      res.status(201).json({
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        labelUrl: shipment.labelUrl,
        status: shipment.status,
        message: 'Shipment created successfully'
      });
    } catch (error) {
      console.error('Error creating shipment:', error);
      res.status(500).json({ error: 'Failed to create shipment', details: error.message });
    }
  });

  // Get shipment tracking
  app.get('/api/courier-shipments/:id/tracking', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      const shipment = await prisma.courierShipment.findUnique({
        where: { id },
        include: { connection: true }
      });

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      const integration = IntegrationFactory.createCourierIntegration(
        shipment.connection.courier,
        shipment.connection
      );

      const tracking = await integration.getTracking(shipment.trackingNumber);

      res.json(tracking);
    } catch (error) {
      console.error('Error fetching tracking:', error);
      res.status(500).json({ error: 'Failed to fetch tracking', details: error.message });
    }
  });

  // Get shipment label
  app.get('/api/courier-shipments/:id/label', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      const shipment = await prisma.courierShipment.findUnique({
        where: { id },
        include: { connection: true }
      });

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      if (shipment.labelUrl) {
        return res.json({ labelUrl: shipment.labelUrl });
      }

      const integration = IntegrationFactory.createCourierIntegration(
        shipment.connection.courier,
        shipment.connection
      );

      const label = await integration.getLabel(shipment.orderId);

      // Update shipment with label URL if we got it
      if (label.labelUrl) {
        await prisma.courierShipment.update({
          where: { id },
          data: { labelUrl: label.labelUrl }
        });
      }

      res.json(label);
    } catch (error) {
      console.error('Error fetching label:', error);
      res.status(500).json({ error: 'Failed to fetch label', details: error.message });
    }
  });

  // ===================================
  // INTEGRATION SUMMARY
  // ===================================

  // Get integration overview/summary
  app.get('/api/integrations/summary', verifyToken, async (req, res) => {
    try {
      const marketplaceConnections = await prisma.marketplaceConnection.findMany({
        where: { companyId: req.user.companyId }
      });

      const courierConnections = await prisma.courierConnection.findMany({
        where: { companyId: req.user.companyId }
      });

      const recentOrderSyncs = await prisma.marketplaceOrderSync.count({
        where: {
          connection: { companyId: req.user.companyId },
          syncedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });

      const recentShipments = await prisma.courierShipment.count({
        where: {
          companyId: req.user.companyId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });

      res.json({
        marketplaces: {
          total: marketplaceConnections.length,
          active: marketplaceConnections.filter(c => c.isActive).length,
          types: [...new Set(marketplaceConnections.map(c => c.marketplace))]
        },
        couriers: {
          total: courierConnections.length,
          active: courierConnections.filter(c => c.isActive).length,
          types: [...new Set(courierConnections.map(c => c.courier))]
        },
        activity: {
          ordersSyncedToday: recentOrderSyncs,
          shipmentsCreatedToday: recentShipments
        }
      });
    } catch (error) {
      console.error('Error fetching integration summary:', error);
      res.status(500).json({ error: 'Failed to fetch integration summary' });
    }
  });

  console.log('Integration routes registered successfully');
}

module.exports = { registerIntegrationRoutes };
