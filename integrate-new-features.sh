#!/bin/bash
# Script to integrate all new WMS features

set -e

echo "========================================="
echo "Integrating New WMS Features"
echo "========================================="
echo ""

cd /root/kiaan-wms-frontend/backend

# Backup server.js
echo "1. Backing up server.js..."
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# Add route imports to server.js (after line 9, after prisma import)
echo "2. Adding route imports..."
sed -i "10i\\
// New feature routes\\
const supplierProductsRouter = require('./routes/supplierProducts');\\
const alternativeSKUsRouter = require('./routes/alternativeSKUs');\\
const bundlesRouter = require('./routes/bundles');\\
" server.js

# Find where to insert new routes (after existing API routes, before the app.listen)
# We'll add them before the "Start server" comment or near the end

echo "3. Adding route registrations..."
# Add before the last 50 lines (before app.listen)
LINE_COUNT=$(wc -l < server.js)
INSERT_LINE=$((LINE_COUNT - 50))

sed -i "${INSERT_LINE}i\\
// ===================================\\
// NEW FEATURES - Supplier Products, Alternative SKUs, Bundles\\
// ===================================\\
\\
// Supplier Products Management\\
app.use('/api/supplier-products', verifyToken, supplierProductsRouter);\\
\\
// Alternative SKU Management (Amazon _BB, _M, marketplace SKUs)\\
app.use('/api/alternative-skus', verifyToken, alternativeSKUsRouter);\\
\\
// Bundle Management (cost calculation, stock by BBD)\\
app.use('/api/bundles', verifyToken, bundlesRouter);\\
" server.js

echo "4. Adding inline endpoints (inventory views, VAT, pricing)..."
# Add inline endpoints
cat >> server.js.additions << 'EOF'

// ===================================
// INVENTORY VIEWS BY BBD AND LOCATION
// ===================================

// Get inventory grouped by Best Before Date
app.get('/api/inventory/by-best-before-date', verifyToken, async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true } },
        location: { select: { code: true, name: true } }
      },
      orderBy: [{ bestBeforeDate: 'asc' }, { product: { sku: 'asc' } }]
    });

    const grouped = inventory.reduce((acc, inv) => {
      const key = inv.productId;
      const bbdKey = inv.bestBeforeDate ? inv.bestBeforeDate.toISOString().split('T')[0] : 'NO_BBD';
      if (!acc[key]) acc[key] = { product: inv.product, byBBD: {} };
      if (!acc[key].byBBD[bbdKey]) acc[key].byBBD[bbdKey] = { bestBeforeDate: inv.bestBeforeDate, totalQty: 0, availableQty: 0, locations: [] };
      acc[key].byBBD[bbdKey].totalQty += inv.quantity;
      acc[key].byBBD[bbdKey].availableQty += inv.availableQuantity;
      acc[key].byBBD[bbdKey].locations.push({ locationCode: inv.location?.code, quantity: inv.quantity });
      return acc;
    }, {});

    res.json({ inventory: Object.values(grouped) });
  } catch (error) {
    console.error('Error fetching inventory by BBD:', error);
    res.status(500).json({ error: 'Failed to fetch inventory by best before date' });
  }
});

// Get inventory grouped by Location
app.get('/api/inventory/by-location', verifyToken, async (req, res) => {
  try {
    const { warehouseId, locationType } = req.query;
    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: { select: { sku: true, name: true, isHeatSensitive: true, weight: true } },
        location: {
          where: locationType ? { locationType } : {},
          select: { code: true, name: true, locationType: true, pickSequence: true, maxWeight: true, isHeatSensitive: true }
        }
      },
      orderBy: [{ location: { pickSequence: 'asc' } }]
    });

    const grouped = inventory.reduce((acc, inv) => {
      if (!inv.location) return acc;
      const key = inv.locationId;
      if (!acc[key]) acc[key] = { location: inv.location, products: [], warnings: [] };
      acc[key].products.push({ product: inv.product, quantity: inv.quantity });
      if (inv.product.isHeatSensitive && inv.location.isHeatSensitive) {
        acc[key].warnings.push({ type: 'HEAT_SENSITIVE', message: 'Heat-sensitive product in hot location' });
      }
      return acc;
    }, {});

    res.json({ locations: Object.values(grouped) });
  } catch (error) {
    console.error('Error fetching inventory by location:', error);
    res.status(500).json({ error: 'Failed to fetch inventory by location' });
  }
});

// ===================================
// VAT CODES
// ===================================

app.get('/api/vat-codes', verifyToken, async (req, res) => {
  try {
    const vatCodes = await prisma.vATCode.findMany({
      include: { rates: { where: { isActive: true } } },
      orderBy: { code: 'asc' }
    });
    res.json(vatCodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch VAT codes' });
  }
});

app.post('/api/vat-codes/bulk-import', verifyToken, async (req, res) => {
  try {
    const { vatCodes } = req.body;
    const results = { created: 0, updated: 0 };
    for (const vc of vatCodes) {
      const existing = await prisma.vATCode.findUnique({ where: { code: vc.code } });
      if (existing) {
        await prisma.vATCode.update({
          where: { code: vc.code },
          data: { description: vc.description, rates: { deleteMany: {}, create: vc.rates } }
        });
        results.updated++;
      } else {
        await prisma.vATCode.create({ data: { code: vc.code, description: vc.description, rates: { create: vc.rates } } });
        results.created++;
      }
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk import VAT codes' });
  }
});

// ===================================
// MARKETPLACE PRICING CALCULATOR
// ===================================

app.post('/api/pricing/calculate', verifyToken, async (req, res) => {
  try {
    const { productId, channelType, consumableIds, shippingCost, laborCost, desiredMargin } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { bundleItems: { include: { child: true } } }
    });

    let productCost = product.costPrice || 0;
    if (product.type === 'BUNDLE') {
      productCost = product.bundleItems.reduce((sum, item) => sum + ((item.child.costPrice || 0) * item.quantity), 0);
    }

    let consumablesCost = 0;
    if (consumableIds?.length > 0) {
      const consumables = await prisma.consumable.findMany({ where: { id: { in: consumableIds } } });
      consumablesCost = consumables.reduce((sum, c) => sum + (c.costPriceEach || 0), 0);
    }

    const totalCost = productCost + consumablesCost + (shippingCost || 0) + (laborCost || 0);
    const referralFee = 0.15; // Default 15%
    const sellingPrice = totalCost / (1 - (desiredMargin || 0) - referralFee);
    const fees = sellingPrice * referralFee;
    const profit = sellingPrice - totalCost - fees;

    res.json({
      productCost,
      consumablesCost,
      totalCost,
      recommendedSellingPrice: Math.ceil(sellingPrice * 100) / 100,
      fees,
      profit,
      margin: profit / sellingPrice
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

// ===================================
// CONSUMABLES STOCK VALUE
// ===================================

app.get('/api/consumables/stock-value', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.user;
    const consumables = await prisma.consumable.findMany({
      where: { companyId, isActive: true }
    });

    let totalValue = 0;
    const breakdown = consumables.map(c => {
      const value = (c.costPricePack || 0) * Math.ceil(c.onStock / (c.unitPerPack || 1));
      totalValue += value;
      return {
        sku: c.sku,
        name: c.name,
        onStock: c.onStock,
        stockValue: value,
        needsReorder: c.reorderLevel && c.onStock <= c.reorderLevel
      };
    });

    res.json({ totalStockValue: totalValue, consumables: breakdown });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate stock value' });
  }
});

EOF

# Insert additions before the final "Start server" section
FINAL_LINE=$((LINE_COUNT - 30))
sed -i "${FINAL_LINE}r server.js.additions" server.js
rm server.js.additions

echo "✅ Integration complete!"
echo ""
echo "New features added:"
echo "  - Supplier Products API (/api/supplier-products)"
echo "  - Alternative SKUs API (/api/alternative-skus)"
echo "  - Bundle cost calculation (/api/bundles)"
echo "  - Inventory by BBD (/api/inventory/by-best-before-date)"
echo "  - Inventory by Location (/api/inventory/by-location)"
echo "  - VAT Codes (/api/vat-codes)"
echo "  - Pricing Calculator (/api/pricing/calculate)"
echo "  - Consumables stock value (/api/consumables/stock-value)"
echo ""
echo "Backend integration complete!"
