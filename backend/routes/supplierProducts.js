/**
 * Supplier Products API Routes
 * Handles supplier-product associations with supplier SKUs and case sizes
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Get all supplier products with filters
router.get('/', async (req, res) => {
  try {
    const { supplierId, productId, isActive } = req.query;

    const where = {};
    if (supplierId) where.supplierId = supplierId;
    if (productId) where.productId = productId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const supplierProducts = await prisma.supplierProduct.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
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
        { isPreferred: 'desc' },
        { supplier: { name: 'asc' } }
      ]
    });

    res.json(supplierProducts);
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({ error: 'Failed to fetch supplier products' });
  }
});

// Get products by supplier (for PO creation)
router.get('/by-supplier/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplierProducts = await prisma.supplierProduct.findMany({
      where: {
        supplierId,
        isActive: true
      },
      include: {
        product: {
          include: {
            brand: true,
            inventory: {
              select: {
                quantity: true,
                availableQuantity: true
              }
            }
          }
        }
      },
      orderBy: {
        product: { name: 'asc' }
      }
    });

    // Calculate total stock for each product
    const productsWithStock = supplierProducts.map(sp => ({
      ...sp,
      product: {
        ...sp.product,
        totalStock: sp.product.inventory.reduce((sum, inv) => sum + inv.availableQuantity, 0)
      }
    }));

    res.json(productsWithStock);
  } catch (error) {
    console.error('Error fetching products by supplier:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single supplier product
router.get('/:id', async (req, res) => {
  try {
    const supplierProduct = await prisma.supplierProduct.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        product: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!supplierProduct) {
      return res.status(404).json({ error: 'Supplier product not found' });
    }

    res.json(supplierProduct);
  } catch (error) {
    console.error('Error fetching supplier product:', error);
    res.status(500).json({ error: 'Failed to fetch supplier product' });
  }
});

// Create supplier product
router.post('/', async (req, res) => {
  try {
    const {
      supplierId,
      productId,
      supplierSKU,
      caseSize,
      minOrderQty,
      leadTimeDays,
      costPrice,
      isPreferred,
      isActive,
      notes
    } = req.body;

    // Validate required fields
    if (!supplierId || !productId || !supplierSKU) {
      return res.status(400).json({
        error: 'Supplier ID, Product ID, and Supplier SKU are required'
      });
    }

    // Check if this supplier-product combination already exists
    const existing = await prisma.supplierProduct.findUnique({
      where: {
        supplierId_productId: {
          supplierId,
          productId
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        error: 'This supplier-product association already exists'
      });
    }

    const supplierProduct = await prisma.supplierProduct.create({
      data: {
        supplierId,
        productId,
        supplierSKU,
        caseSize: caseSize ? parseInt(caseSize) : null,
        minOrderQty: minOrderQty ? parseInt(minOrderQty) : null,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        isPreferred: isPreferred === true,
        isActive: isActive !== false,
        notes
      },
      include: {
        supplier: true,
        product: true
      }
    });

    res.status(201).json(supplierProduct);
  } catch (error) {
    console.error('Error creating supplier product:', error);
    res.status(500).json({ error: 'Failed to create supplier product' });
  }
});

// Update supplier product
router.put('/:id', async (req, res) => {
  try {
    const {
      supplierSKU,
      caseSize,
      minOrderQty,
      leadTimeDays,
      costPrice,
      isPreferred,
      isActive,
      notes
    } = req.body;

    const supplierProduct = await prisma.supplierProduct.update({
      where: { id: req.params.id },
      data: {
        ...(supplierSKU && { supplierSKU }),
        ...(caseSize !== undefined && { caseSize: caseSize ? parseInt(caseSize) : null }),
        ...(minOrderQty !== undefined && { minOrderQty: minOrderQty ? parseInt(minOrderQty) : null }),
        ...(leadTimeDays !== undefined && { leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : null }),
        ...(costPrice !== undefined && { costPrice: costPrice ? parseFloat(costPrice) : null }),
        ...(isPreferred !== undefined && { isPreferred }),
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes })
      },
      include: {
        supplier: true,
        product: true
      }
    });

    res.json(supplierProduct);
  } catch (error) {
    console.error('Error updating supplier product:', error);
    res.status(500).json({ error: 'Failed to update supplier product' });
  }
});

// Delete supplier product
router.delete('/:id', async (req, res) => {
  try {
    await prisma.supplierProduct.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Supplier product deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier product:', error);
    res.status(500).json({ error: 'Failed to delete supplier product' });
  }
});

// Bulk import supplier products (useful for Excel imports)
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
        const { supplierId, productId, supplierSKU, caseSize, costPrice, ...rest } = item;

        // Check if exists
        const existing = await prisma.supplierProduct.findUnique({
          where: {
            supplierId_productId: {
              supplierId,
              productId
            }
          }
        });

        if (existing) {
          // Update
          await prisma.supplierProduct.update({
            where: { id: existing.id },
            data: {
              supplierSKU,
              caseSize: caseSize ? parseInt(caseSize) : null,
              costPrice: costPrice ? parseFloat(costPrice) : null,
              ...rest
            }
          });
          results.updated++;
        } else {
          // Create
          await prisma.supplierProduct.create({
            data: {
              supplierId,
              productId,
              supplierSKU,
              caseSize: caseSize ? parseInt(caseSize) : null,
              costPrice: costPrice ? parseFloat(costPrice) : null,
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
    console.error('Error bulk importing supplier products:', error);
    res.status(500).json({ error: 'Failed to bulk import supplier products' });
  }
});

module.exports = router;
