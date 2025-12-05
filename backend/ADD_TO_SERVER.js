/**
 * ADD THIS CODE TO server.js
 *
 * Add these imports at the top:
 */

const supplierProductsRouter = require('./routes/supplierProducts');
const alternativeSKUsRouter = require('./routes/alternativeSKUs');
const bundlesRouter = require('./routes/bundles');

/**
 * Add these route registrations after the existing routes (around line 200):
 */

// Supplier Products Management
app.use('/api/supplier-products', verifyToken, supplierProductsRouter);

// Alternative SKU Management (Amazon _BB, _M, marketplace SKUs)
app.use('/api/alternative-skus', verifyToken, alternativeSKUsRouter);

// Bundle Management (cost calculation, stock by BBD)
app.use('/api/bundles', verifyToken, bundlesRouter);

/**
 * Add these new endpoints directly in server.js (after existing product routes):
 */

// ===================================
// INVENTORY VIEWS
// ===================================

// Get inventory grouped by Best Before Date
app.get('/api/inventory/by-best-before-date', verifyToken, async (req, res) => {
  try {
    const { productId, warehouseId, minDate, maxDate } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;

    if (minDate || maxDate) {
      where.bestBeforeDate = {};
      if (minDate) where.bestBeforeDate.gte = new Date(minDate);
      if (maxDate) where.bestBeforeDate.lte = new Date(maxDate);
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            brand: {
              select: {
                name: true
              }
            }
          }
        },
        location: {
          select: {
            code: true,
            name: true
          }
        },
        warehouse: {
          select: {
            code: true,
            name: true
          }
        }
      },
      orderBy: [
        { bestBeforeDate: 'asc' },
        { product: { sku: 'asc' } }
      ]
    });

    // Group by product and BBD
    const grouped = inventory.reduce((acc, inv) => {
      const productKey = inv.productId;
      const bbdKey = inv.bestBeforeDate
        ? inv.bestBeforeDate.toISOString().split('T')[0]
        : 'NO_BBD';

      if (!acc[productKey]) {
        acc[productKey] = {
          product: inv.product,
          byBestBeforeDate: {}
        };
      }

      if (!acc[productKey].byBestBeforeDate[bbdKey]) {
        acc[productKey].byBestBeforeDate[bbdKey] = {
          bestBeforeDate: inv.bestBeforeDate,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          locations: []
        };
      }

      acc[productKey].byBestBeforeDate[bbdKey].totalQuantity += inv.quantity;
      acc[productKey].byBestBeforeDate[bbdKey].availableQuantity += inv.availableQuantity;
      acc[productKey].byBestBeforeDate[bbdKey].reservedQuantity += inv.reservedQuantity;
      acc[productKey].byBestBeforeDate[bbdKey].locations.push({
        locationCode: inv.location?.code,
        locationName: inv.location?.name,
        quantity: inv.quantity,
        availableQuantity: inv.availableQuantity
      });

      return acc;
    }, {});

    res.json({
      inventory: Object.values(grouped),
      summary: {
        totalProducts: Object.keys(grouped).length,
        totalRecords: inventory.length
      }
    });
  } catch (error) {
    console.error('Error fetching inventory by BBD:', error);
    res.status(500).json({ error: 'Failed to fetch inventory by best before date' });
  }
});

// Get inventory grouped by Location
app.get('/api/inventory/by-location', verifyToken, async (req, res) => {
  try {
    const { warehouseId, locationType, zoneId } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            isHeatSensitive: true,
            weight: true
          }
        },
        location: {
          where: {
            ...(locationType && { locationType }),
            ...(zoneId && { zoneId })
          },
          select: {
            id: true,
            code: true,
            name: true,
            locationType: true,
            isHeatSensitive: true,
            maxWeight: true,
            pickSequence: true,
            zone: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: [
        { location: { pickSequence: 'asc' } },
        { location: { code: 'asc' } }
      ]
    });

    // Group by location
    const grouped = inventory.reduce((acc, inv) => {
      if (!inv.location) return acc;

      const locationKey = inv.locationId;

      if (!acc[locationKey]) {
        acc[locationKey] = {
          location: inv.location,
          products: [],
          totalItems: 0,
          utilizationWarnings: []
        };
      }

      acc[locationKey].products.push({
        product: inv.product,
        quantity: inv.quantity,
        availableQuantity: inv.availableQuantity,
        bestBeforeDate: inv.bestBeforeDate,
        lotNumber: inv.lotNumber
      });

      acc[locationKey].totalItems += inv.quantity;

      // Heat sensitivity check
      if (inv.product.isHeatSensitive && inv.location.isHeatSensitive) {
        acc[locationKey].utilizationWarnings.push({
          type: 'HEAT_SENSITIVE',
          message: `Heat-sensitive product ${inv.product.sku} in heat-sensitive location`,
          severity: 'WARNING'
        });
      }

      // Weight check for BULK_LW locations
      if (inv.location.locationType === 'BULK_LW' && inv.location.maxWeight) {
        const estimatedWeight = inv.quantity * (inv.product.weight || 0);
        if (estimatedWeight > inv.location.maxWeight) {
          acc[locationKey].utilizationWarnings.push({
            type: 'WEIGHT_EXCEEDED',
            message: `Estimated weight ${estimatedWeight}kg exceeds max ${inv.location.maxWeight}kg`,
            severity: 'ERROR'
          });
        }
      }

      return acc;
    }, {});

    res.json({
      locations: Object.values(grouped),
      summary: {
        totalLocations: Object.keys(grouped).length,
        totalRecords: inventory.length
      }
    });
  } catch (error) {
    console.error('Error fetching inventory by location:', error);
    res.status(500).json({ error: 'Failed to fetch inventory by location' });
  }
});

// ===================================
// VAT CODES AND RATES
// ===================================

// Get all VAT codes with rates
app.get('/api/vat-codes', verifyToken, async (req, res) => {
  try {
    const vatCodes = await prisma.vATCode.findMany({
      include: {
        rates: {
          where: { isActive: true },
          orderBy: { countryName: 'asc' }
        }
      },
      orderBy: { code: 'asc' }
    });

    res.json(vatCodes);
  } catch (error) {
    console.error('Error fetching VAT codes:', error);
    res.status(500).json({ error: 'Failed to fetch VAT codes' });
  }
});

// Create VAT code
app.post('/api/vat-codes', verifyToken, async (req, res) => {
  try {
    const { code, description, rates } = req.body;

    const vatCode = await prisma.vATCode.create({
      data: {
        code,
        description,
        rates: {
          create: rates || []
        }
      },
      include: {
        rates: true
      }
    });

    res.status(201).json(vatCode);
  } catch (error) {
    console.error('Error creating VAT code:', error);
    res.status(500).json({ error: 'Failed to create VAT code' });
  }
});

// Bulk import VAT codes and rates (from Excel)
app.post('/api/vat-codes/bulk-import', verifyToken, async (req, res) => {
  try {
    const { vatCodes } = req.body;

    const results = { created: 0, updated: 0, errors: [] };

    for (const vc of vatCodes) {
      try {
        const { code, description, rates } = vc;

        // Check if exists
        const existing = await prisma.vATCode.findUnique({
          where: { code }
        });

        if (existing) {
          // Update
          await prisma.vATCode.update({
            where: { code },
            data: {
              description,
              rates: {
                deleteMany: {}, // Clear old rates
                create: rates
              }
            }
          });
          results.updated++;
        } else {
          // Create
          await prisma.vATCode.create({
            data: {
              code,
              description,
              rates: {
                create: rates
              }
            }
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({ code: vc.code, error: error.message });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error bulk importing VAT codes:', error);
    res.status(500).json({ error: 'Failed to bulk import VAT codes' });
  }
});

// ===================================
// CONSUMABLES (Enhanced)
// ===================================

// Note: Consumables pages already exist in frontend (app/protected/consumables/)
// These endpoints enhance the existing consumables functionality

// Get consumable stock value
app.get('/api/consumables/stock-value', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.user;

    const consumables = await prisma.consumable.findMany({
      where: {
        companyId,
        isActive: true
      }
    });

    let totalValue = 0;
    const breakdown = consumables.map(c => {
      const value = (c.costPricePack || 0) * Math.ceil(c.onStock / (c.unitPerPack || 1));
      totalValue += value;

      return {
        sku: c.sku,
        name: c.name,
        category: c.category,
        onStock: c.onStock,
        unitPerPack: c.unitPerPack,
        costPricePack: c.costPricePack,
        stockValue: value,
        needsReorder: c.reorderLevel && c.onStock <= c.reorderLevel
      };
    });

    res.json({
      totalStockValue: totalValue,
      consumables: breakdown,
      needsReorder: breakdown.filter(c => c.needsReorder)
    });
  } catch (error) {
    console.error('Error calculating consumable stock value:', error);
    res.status(500).json({ error: 'Failed to calculate stock value' });
  }
});

// ===================================
// MARKETPLACE PRICE CALCULATOR
// ===================================

// Calculate selling price for a product on a specific channel
app.post('/api/pricing/calculate', verifyToken, async (req, res) => {
  try {
    const {
      productId,
      channelType, // 'Amazon_FBA', 'Shopify', 'eBay', 'TikTok', 'Temu'
      consumableIds, // Array of consumable IDs used for this product
      shippingCost,
      laborCost,
      desiredMargin // e.g., 0.20 for 20% margin
    } = req.body;

    // Get product cost
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        bundleItems: {
          include: {
            child: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate product cost (use bundle calculation if bundle)
    let productCost = product.costPrice || 0;
    if (product.type === 'BUNDLE') {
      productCost = product.bundleItems.reduce((sum, item) => {
        return sum + ((item.child.costPrice || 0) * item.quantity);
      }, 0);
    }

    // Calculate consumables cost
    let consumablesCost = 0;
    if (consumableIds && consumableIds.length > 0) {
      const consumables = await prisma.consumable.findMany({
        where: {
          id: { in: consumableIds }
        }
      });

      consumablesCost = consumables.reduce((sum, c) => {
        return sum + (c.costPriceEach || 0);
      }, 0);
    }

    // Get channel fees
    const channel = await prisma.salesChannel.findFirst({
      where: { code: channelType }
    });

    const referralFee = channel?.referralFeePercent || 0.15;
    const fixedFee = channel?.fixedFee || 0;
    const fulfillmentFee = channel?.fulfillmentFeePerUnit || 0;

    // Calculate costs
    const totalCost = productCost + consumablesCost + (shippingCost || 0) + (laborCost || 0);

    // Calculate selling price to achieve desired margin
    // Formula: sellingPrice = totalCost / (1 - margin - referralFee)
    const sellingPrice = totalCost / (1 - (desiredMargin || 0) - referralFee);

    const fees = (sellingPrice * referralFee) + fixedFee + fulfillmentFee;
    const profit = sellingPrice - totalCost - fees;
    const actualMargin = profit / sellingPrice;

    res.json({
      productId,
      productSKU: product.sku,
      channelType,
      breakdown: {
        productCost,
        consumablesCost,
        shippingCost: shippingCost || 0,
        laborCost: laborCost || 0,
        totalCost
      },
      fees: {
        referralFee: sellingPrice * referralFee,
        fixedFee,
        fulfillmentFee,
        totalFees: fees
      },
      pricing: {
        recommendedSellingPrice: Math.ceil(sellingPrice * 100) / 100, // Round to 2 decimals
        desiredMargin: desiredMargin || 0,
        actualMargin,
        grossProfit: profit,
        ROI: profit / totalCost
      }
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

/**
 * END OF ADDITIONS
 *
 * Save this file and integrate these sections into server.js
 */
