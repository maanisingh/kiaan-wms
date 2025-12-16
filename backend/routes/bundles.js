/**
 * Bundle Management API Routes
 * Handles bundle cost calculation and stock tracking by BBD
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Get all bundles
router.get('/', async (req, res) => {
  try {
    const bundles = await prisma.product.findMany({
      where: {
        type: 'BUNDLE'
      },
      include: {
        brand: true,
        bundleItems: {
          include: {
            child: {
              select: {
                id: true,
                sku: true,
                name: true,
                costPrice: true,
                sellingPrice: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(bundles);
  } catch (error) {
    console.error('Error fetching bundles:', error);
    res.status(500).json({ error: 'Failed to fetch bundles' });
  }
});

// Calculate bundle cost price from components
router.get('/:bundleId/cost-price', async (req, res) => {
  try {
    const { bundleId } = req.params;

    const bundle = await prisma.product.findUnique({
      where: { id: bundleId },
      include: {
        bundleItems: {
          include: {
            child: {
              select: {
                id: true,
                sku: true,
                name: true,
                costPrice: true
              }
            }
          }
        }
      }
    });

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    if (bundle.type !== 'BUNDLE') {
      return res.status(400).json({ error: 'Product is not a bundle' });
    }

    // Calculate total cost
    let totalCost = 0;
    const breakdown = [];

    for (const item of bundle.bundleItems) {
      const itemCost = (item.child.costPrice || 0) * item.quantity;
      totalCost += itemCost;

      breakdown.push({
        productId: item.child.id,
        sku: item.child.sku,
        name: item.child.name,
        quantity: item.quantity,
        unitCost: item.child.costPrice || 0,
        totalCost: itemCost
      });
    }

    res.json({
      bundleId: bundle.id,
      bundleSKU: bundle.sku,
      bundleName: bundle.name,
      calculatedCostPrice: totalCost,
      currentCostPrice: bundle.costPrice,
      needsUpdate: bundle.costPrice !== totalCost,
      breakdown
    });
  } catch (error) {
    console.error('Error calculating bundle cost:', error);
    res.status(500).json({ error: 'Failed to calculate bundle cost' });
  }
});

// Update bundle cost price from components
router.post('/:bundleId/update-cost-price', async (req, res) => {
  try {
    const { bundleId } = req.params;

    // Calculate cost
    const bundle = await prisma.product.findUnique({
      where: { id: bundleId },
      include: {
        bundleItems: {
          include: {
            child: true
          }
        }
      }
    });

    if (!bundle || bundle.type !== 'BUNDLE') {
      return res.status(400).json({ error: 'Invalid bundle' });
    }

    let totalCost = 0;
    for (const item of bundle.bundleItems) {
      totalCost += (item.child.costPrice || 0) * item.quantity;
    }

    // Update
    const updated = await prisma.product.update({
      where: { id: bundleId },
      data: {
        costPrice: totalCost
      }
    });

    res.json({
      message: 'Bundle cost price updated',
      bundleId,
      oldCostPrice: bundle.costPrice,
      newCostPrice: totalCost,
      product: updated
    });
  } catch (error) {
    console.error('Error updating bundle cost:', error);
    res.status(500).json({ error: 'Failed to update bundle cost' });
  }
});

// Get bundle stock by best before date
router.get('/:bundleId/stock-by-bbd', async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { warehouseId } = req.query;

    const bundle = await prisma.product.findUnique({
      where: { id: bundleId },
      include: {
        bundleItems: {
          include: {
            child: {
              include: {
                inventory: {
                  where: warehouseId ? { warehouseId } : {},
                  orderBy: {
                    bestBeforeDate: 'asc'
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!bundle || bundle.type !== 'BUNDLE') {
      return res.status(400).json({ error: 'Invalid bundle' });
    }

    // Group inventory by BBD for each component
    const componentStock = [];
    let limitingComponent = null;
    let minBundleQty = Infinity;

    for (const item of bundle.bundleItems) {
      const stockByBBD = {};

      for (const inv of item.child.inventory) {
        const bbdKey = inv.bestBeforeDate
          ? inv.bestBeforeDate.toISOString().split('T')[0]
          : 'NO_BBD';

        if (!stockByBBD[bbdKey]) {
          stockByBBD[bbdKey] = {
            bestBeforeDate: inv.bestBeforeDate,
            totalQty: 0,
            availableQty: 0,
            possibleBundles: 0
          };
        }

        stockByBBD[bbdKey].totalQty += inv.quantity;
        stockByBBD[bbdKey].availableQty += inv.availableQuantity;
      }

      // Calculate possible bundles for each BBD
      Object.keys(stockByBBD).forEach(bbdKey => {
        stockByBBD[bbdKey].possibleBundles = Math.floor(
          stockByBBD[bbdKey].availableQty / item.quantity
        );
      });

      // Find total possible bundles (limited by smallest BBD quantity)
      const componentBundles = Object.values(stockByBBD).reduce((sum, bbd) => {
        return sum + bbd.possibleBundles;
      }, 0);

      if (componentBundles < minBundleQty) {
        minBundleQty = componentBundles;
        limitingComponent = {
          productId: item.child.id,
          sku: item.child.sku,
          name: item.child.name,
          requiredPerBundle: item.quantity
        };
      }

      componentStock.push({
        productId: item.child.id,
        sku: item.child.sku,
        name: item.child.name,
        requiredPerBundle: item.quantity,
        stockByBBD,
        totalPossibleBundles: componentBundles
      });
    }

    // Calculate bundle quantities by matching BBDs
    const bundlesByBBD = {};

    // Find all unique BBDs across all components
    const allBBDs = new Set();
    componentStock.forEach(comp => {
      Object.keys(comp.stockByBBD).forEach(bbd => allBBDs.add(bbd));
    });

    // For each BBD, calculate how many bundles can be made
    allBBDs.forEach(bbd => {
      let minBundles = Infinity;

      for (const comp of componentStock) {
        const stock = comp.stockByBBD[bbd];
        if (!stock) {
          minBundles = 0;
          break;
        }
        const possibleFromThis = Math.floor(stock.availableQty / comp.requiredPerBundle);
        minBundles = Math.min(minBundles, possibleFromThis);
      }

      if (minBundles > 0 && minBundles !== Infinity) {
        bundlesByBBD[bbd] = {
          bestBeforeDate: bbd !== 'NO_BBD' ? bbd : null,
          bundleQuantity: minBundles
        };
      }
    });

    res.json({
      bundleId: bundle.id,
      bundleSKU: bundle.sku,
      bundleName: bundle.name,
      totalPossibleBundles: minBundleQty === Infinity ? 0 : minBundleQty,
      limitingComponent,
      bundlesByBestBeforeDate: bundlesByBBD,
      componentStock
    });
  } catch (error) {
    console.error('Error calculating bundle stock by BBD:', error);
    res.status(500).json({ error: 'Failed to calculate bundle stock' });
  }
});

// Recalculate all bundle costs
router.post('/recalculate-all-costs', async (req, res) => {
  try {
    const bundles = await prisma.product.findMany({
      where: {
        type: 'BUNDLE'
      },
      include: {
        bundleItems: {
          include: {
            child: true
          }
        }
      }
    });

    const results = {
      processed: 0,
      updated: 0,
      unchanged: 0,
      errors: []
    };

    for (const bundle of bundles) {
      try {
        let totalCost = 0;
        for (const item of bundle.bundleItems) {
          totalCost += (item.child.costPrice || 0) * item.quantity;
        }

        if (bundle.costPrice !== totalCost) {
          await prisma.product.update({
            where: { id: bundle.id },
            data: { costPrice: totalCost }
          });
          results.updated++;
        } else {
          results.unchanged++;
        }

        results.processed++;
      } catch (error) {
        results.errors.push({
          bundleId: bundle.id,
          sku: bundle.sku,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error recalculating bundle costs:', error);
    res.status(500).json({ error: 'Failed to recalculate bundle costs' });
  }
});

module.exports = router;
