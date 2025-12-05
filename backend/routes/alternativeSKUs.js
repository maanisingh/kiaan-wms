/**
 * Alternative SKU API Routes
 * Handles multi-channel SKU mapping (Amazon _BB, _M, Shopify, eBay, TikTok, Temu)
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Get all alternative SKUs with filters
router.get('/', async (req, res) => {
  try {
    const { productId, channelType, channelSKU, skuType, isActive } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (channelType) where.channelType = channelType;
    if (channelSKU) where.channelSKU = { contains: channelSKU, mode: 'insensitive' };
    if (skuType) where.skuType = skuType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const alternativeSKUs = await prisma.alternativeSKU.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            costPrice: true
          }
        }
      },
      orderBy: [
        { channelType: 'asc' },
        { product: { sku: 'asc' } }
      ]
    });

    res.json(alternativeSKUs);
  } catch (error) {
    console.error('Error fetching alternative SKUs:', error);
    res.status(500).json({ error: 'Failed to fetch alternative SKUs' });
  }
});

// Get alternative SKUs for a specific product
router.get('/by-product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const alternativeSKUs = await prisma.alternativeSKU.findMany({
      where: {
        productId,
        isActive: true
      },
      orderBy: [
        { channelType: 'asc' },
        { isPrimary: 'desc' }
      ]
    });

    // Group by channel type
    const grouped = alternativeSKUs.reduce((acc, sku) => {
      if (!acc[sku.channelType]) {
        acc[sku.channelType] = [];
      }
      acc[sku.channelType].push(sku);
      return acc;
    }, {});

    res.json({
      productId,
      byChannel: grouped,
      all: alternativeSKUs
    });
  } catch (error) {
    console.error('Error fetching product alternative SKUs:', error);
    res.status(500).json({ error: 'Failed to fetch alternative SKUs' });
  }
});

// Find product by alternative SKU (reverse lookup)
router.get('/lookup/:channelSKU', async (req, res) => {
  try {
    const { channelSKU } = req.params;
    const { channelType } = req.query;

    const where = {
      channelSKU,
      isActive: true
    };

    if (channelType) {
      where.channelType = channelType;
    }

    const alternativeSKU = await prisma.alternativeSKU.findFirst({
      where,
      include: {
        product: {
          include: {
            brand: true,
            inventory: {
              select: {
                quantity: true,
                availableQuantity: true,
                bestBeforeDate: true,
                locationId: true
              }
            }
          }
        }
      }
    });

    if (!alternativeSKU) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    res.json(alternativeSKU);
  } catch (error) {
    console.error('Error looking up alternative SKU:', error);
    res.status(500).json({ error: 'Failed to lookup SKU' });
  }
});

// Get Amazon SKU variants for a product (Normal, _BB, _M)
router.get('/amazon-variants/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const amazonSKUs = await prisma.alternativeSKU.findMany({
      where: {
        productId,
        channelType: { in: ['Amazon', 'Amazon_UK_FBA', 'Amazon_UK_MFN'] },
        isActive: true
      },
      orderBy: {
        skuType: 'asc'
      }
    });

    const variants = {
      normal: amazonSKUs.find(s => s.skuType === 'NORMAL' || !s.skuType),
      bbRotation: amazonSKUs.find(s => s.skuType === 'BB_ROTATION'),
      mfn: amazonSKUs.find(s => s.skuType === 'MFN')
    };

    res.json(variants);
  } catch (error) {
    console.error('Error fetching Amazon variants:', error);
    res.status(500).json({ error: 'Failed to fetch Amazon variants' });
  }
});

// Get single alternative SKU
router.get('/:id', async (req, res) => {
  try {
    const alternativeSKU = await prisma.alternativeSKU.findUnique({
      where: { id: req.params.id },
      include: {
        product: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!alternativeSKU) {
      return res.status(404).json({ error: 'Alternative SKU not found' });
    }

    res.json(alternativeSKU);
  } catch (error) {
    console.error('Error fetching alternative SKU:', error);
    res.status(500).json({ error: 'Failed to fetch alternative SKU' });
  }
});

// Create alternative SKU
router.post('/', async (req, res) => {
  try {
    const {
      productId,
      channelType,
      channelSKU,
      skuType,
      isPrimary,
      isActive,
      notes
    } = req.body;

    // Validate required fields
    if (!productId || !channelType || !channelSKU) {
      return res.status(400).json({
        error: 'Product ID, Channel Type, and Channel SKU are required'
      });
    }

    // Check if this exact mapping already exists
    const existing = await prisma.alternativeSKU.findFirst({
      where: {
        productId,
        channelType,
        channelSKU
      }
    });

    if (existing) {
      return res.status(400).json({
        error: 'This SKU mapping already exists'
      });
    }

    // If setting as primary, unset other primary SKUs for this channel
    if (isPrimary) {
      await prisma.alternativeSKU.updateMany({
        where: {
          productId,
          channelType,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }

    const alternativeSKU = await prisma.alternativeSKU.create({
      data: {
        productId,
        channelType,
        channelSKU,
        skuType: skuType || null,
        isPrimary: isPrimary === true,
        isActive: isActive !== false,
        notes
      },
      include: {
        product: true
      }
    });

    res.status(201).json(alternativeSKU);
  } catch (error) {
    console.error('Error creating alternative SKU:', error);
    res.status(500).json({ error: 'Failed to create alternative SKU' });
  }
});

// Update alternative SKU
router.put('/:id', async (req, res) => {
  try {
    const {
      channelSKU,
      skuType,
      isPrimary,
      isActive,
      notes
    } = req.body;

    // If setting as primary, unset others first
    if (isPrimary) {
      const current = await prisma.alternativeSKU.findUnique({
        where: { id: req.params.id }
      });

      if (current) {
        await prisma.alternativeSKU.updateMany({
          where: {
            productId: current.productId,
            channelType: current.channelType,
            isPrimary: true,
            NOT: { id: req.params.id }
          },
          data: {
            isPrimary: false
          }
        });
      }
    }

    const alternativeSKU = await prisma.alternativeSKU.update({
      where: { id: req.params.id },
      data: {
        ...(channelSKU && { channelSKU }),
        ...(skuType !== undefined && { skuType }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes })
      },
      include: {
        product: true
      }
    });

    res.json(alternativeSKU);
  } catch (error) {
    console.error('Error updating alternative SKU:', error);
    res.status(500).json({ error: 'Failed to update alternative SKU' });
  }
});

// Delete alternative SKU
router.delete('/:id', async (req, res) => {
  try {
    await prisma.alternativeSKU.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Alternative SKU deleted successfully' });
  } catch (error) {
    console.error('Error deleting alternative SKU:', error);
    res.status(500).json({ error: 'Failed to delete alternative SKU' });
  }
});

// Bulk import alternative SKUs (useful for Excel imports)
router.post('/bulk-import', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (const item of items) {
      try {
        const { productId, channelType, channelSKU, ...rest } = item;

        if (!productId || !channelType || !channelSKU) {
          results.errors.push({
            item,
            error: 'Missing required fields'
          });
          continue;
        }

        // Check if exists
        const existing = await prisma.alternativeSKU.findFirst({
          where: {
            productId,
            channelType,
            channelSKU
          }
        });

        if (existing) {
          // Update
          await prisma.alternativeSKU.update({
            where: { id: existing.id },
            data: rest
          });
          results.updated++;
        } else {
          // Create
          await prisma.alternativeSKU.create({
            data: {
              productId,
              channelType,
              channelSKU,
              ...rest
            }
          });
          results.created++;
        }
      } catch (itemError) {
        results.errors.push({
          item,
          error: itemError.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error bulk importing alternative SKUs:', error);
    res.status(500).json({ error: 'Failed to bulk import alternative SKUs' });
  }
});

module.exports = router;
