const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedData() {
  console.log('Starting data population...');

  // Get or create company
  let company = await prisma.company.findFirst({ where: { code: 'KIAAN' } });
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Kiaan Trading', code: 'KIAAN', description: 'Main company' }
    });
  }
  console.log('Company:', company.id);

  // Get or create warehouse
  let warehouse = await prisma.warehouse.findFirst({ where: { companyId: company.id } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        code: 'WH-001',
        address: '123 Industrial Park',
        companyId: company.id
      }
    });
  }
  console.log('Warehouse:', warehouse.id);

  // Create locations
  const locationCodes = ['LOC-A01', 'LOC-A02', 'LOC-B01', 'LOC-B02', 'LOC-C01'];
  for (const code of locationCodes) {
    const exists = await prisma.location.findFirst({ where: { code, warehouseId: warehouse.id } });
    if (!exists) {
      await prisma.location.create({
        data: {
          name: code.replace('LOC-', 'Location '),
          code,
          warehouseId: warehouse.id,
          locationType: 'PICK'
        }
      });
    }
  }
  const locations = await prisma.location.findMany({ where: { warehouseId: warehouse.id } });
  console.log('Locations created:', locations.length);

  // Create brands
  const brandsData = [
    { name: 'McVities', code: 'MCV' },
    { name: 'Cadbury', code: 'CAD' },
    { name: 'Nestle', code: 'NES' },
    { name: 'Mars', code: 'MAR' },
    { name: 'Kelloggs', code: 'KEL' }
  ];
  const brands = [];
  for (const bd of brandsData) {
    let brand = await prisma.brand.findFirst({ where: { code: bd.code, companyId: company.id } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: bd.name, code: bd.code, companyId: company.id }
      });
    }
    brands.push(brand);
  }
  console.log('Brands created:', brands.length);

  // Create suppliers
  const suppliersData = [
    { name: 'Global Supplies Ltd', code: 'SUP-001', email: 'orders@globalsupplies.com', phone: '+44 20 1234 5678', address: '456 Supply Chain Road' },
    { name: 'UK Food Distributors', code: 'SUP-002', email: 'sales@ukfooddist.co.uk', phone: '+44 121 555 0123', address: '789 Distribution Way' },
    { name: 'Premium Imports', code: 'SUP-003', email: 'info@premiumimports.com', phone: '+44 20 5555 9876', address: '321 Import Lane' }
  ];
  const suppliers = [];
  for (const sd of suppliersData) {
    let supplier = await prisma.supplier.findFirst({ where: { code: sd.code, companyId: company.id } });
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: { ...sd, companyId: company.id }
      });
    }
    suppliers.push(supplier);
  }
  console.log('Suppliers created:', suppliers.length);

  // CREATE PRODUCTS
  const productsData = [
    { sku: 'MCV-DIG-001', name: 'McVities Digestive Biscuits 400g', barcode: '5000168214030', brandCode: 'MCV', costPrice: 1.20, sellingPrice: 1.99, vatRate: 0, cartonSizes: 24, isPerishable: true, shelfLifeDays: 365 },
    { sku: 'MCV-HOB-001', name: 'McVities Hobnobs Original 300g', barcode: '5000168214047', brandCode: 'MCV', costPrice: 1.30, sellingPrice: 2.19, vatRate: 0, cartonSizes: 18, isPerishable: true, shelfLifeDays: 365 },
    { sku: 'CAD-DM-001', name: 'Cadbury Dairy Milk 200g', barcode: '7622300119812', brandCode: 'CAD', costPrice: 2.50, sellingPrice: 3.99, vatRate: 20, cartonSizes: 12, isPerishable: true, isHeatSensitive: true, shelfLifeDays: 300 },
    { sku: 'CAD-WI-001', name: 'Cadbury Wispa Bar 36g', barcode: '7622300119829', brandCode: 'CAD', costPrice: 0.45, sellingPrice: 0.89, vatRate: 20, cartonSizes: 48, isPerishable: true, isHeatSensitive: true, shelfLifeDays: 270 },
    { sku: 'NES-KIT-001', name: 'Nestle KitKat 4 Finger 41.5g', barcode: '5000573100182', brandCode: 'NES', costPrice: 0.50, sellingPrice: 0.95, vatRate: 20, cartonSizes: 36, isPerishable: true, isHeatSensitive: true, shelfLifeDays: 365 },
    { sku: 'NES-AER-001', name: 'Nestle Aero Milk Chocolate 36g', barcode: '5000573100199', brandCode: 'NES', costPrice: 0.48, sellingPrice: 0.89, vatRate: 20, cartonSizes: 36, isPerishable: true, isHeatSensitive: true, shelfLifeDays: 365 },
    { sku: 'MAR-SNI-001', name: 'Mars Snickers Bar 48g', barcode: '5000159461122', brandCode: 'MAR', costPrice: 0.52, sellingPrice: 0.99, vatRate: 20, cartonSizes: 48, isPerishable: true, isHeatSensitive: true, shelfLifeDays: 365 },
    { sku: 'MAR-MIL-001', name: 'Mars Milky Way Twin 43g', barcode: '5000159461139', brandCode: 'MAR', costPrice: 0.45, sellingPrice: 0.85, vatRate: 20, cartonSizes: 48, isPerishable: true, isHeatSensitive: true, shelfLifeDays: 365 },
    { sku: 'KEL-CRN-001', name: 'Kelloggs Corn Flakes 500g', barcode: '5050083366253', brandCode: 'KEL', costPrice: 2.20, sellingPrice: 3.49, vatRate: 0, cartonSizes: 12, isPerishable: true, shelfLifeDays: 365 },
    { sku: 'KEL-RKR-001', name: 'Kelloggs Rice Krispies 510g', barcode: '5050083366260', brandCode: 'KEL', costPrice: 2.30, sellingPrice: 3.59, vatRate: 0, cartonSizes: 12, isPerishable: true, shelfLifeDays: 365 },
    { sku: 'MCV-JAF-001', name: 'McVities Jaffa Cakes 12pk', barcode: '5000168214054', brandCode: 'MCV', costPrice: 1.50, sellingPrice: 2.49, vatRate: 0, cartonSizes: 24, isPerishable: true, shelfLifeDays: 270 },
    { sku: 'CAD-FLA-001', name: 'Cadbury Flake 32g', barcode: '7622300119836', brandCode: 'CAD', costPrice: 0.55, sellingPrice: 0.99, vatRate: 20, cartonSizes: 48, isPerishable: true, isHeatSensitive: true, shelfLifeDays: 270 },
    { sku: 'NES-QUA-001', name: 'Nestle Quality Street Tin 650g', barcode: '5000573100205', brandCode: 'NES', costPrice: 6.00, sellingPrice: 9.99, vatRate: 20, cartonSizes: 6, isPerishable: true, shelfLifeDays: 365 },
    { sku: 'MAR-MAL-001', name: 'Mars Maltesers 37g', barcode: '5000159461146', brandCode: 'MAR', costPrice: 0.50, sellingPrice: 0.95, vatRate: 20, cartonSizes: 40, isPerishable: true, isHeatSensitive: true, shelfLifeDays: 365 },
    { sku: 'KEL-FRO-001', name: 'Kelloggs Frosties 470g', barcode: '5050083366277', brandCode: 'KEL', costPrice: 2.40, sellingPrice: 3.79, vatRate: 0, cartonSizes: 12, isPerishable: true, shelfLifeDays: 365 }
  ];

  const products = [];
  for (const pd of productsData) {
    let product = await prisma.product.findFirst({ where: { sku: pd.sku } });
    if (!product) {
      const brand = brands.find(b => b.code === pd.brandCode);
      product = await prisma.product.create({
        data: {
          sku: pd.sku,
          name: pd.name,
          barcode: pd.barcode,
          companyId: company.id,
          brandId: brand ? brand.id : null,
          costPrice: pd.costPrice,
          sellingPrice: pd.sellingPrice,
          vatRate: pd.vatRate,
          cartonSizes: pd.cartonSizes,
          isPerishable: pd.isPerishable || false,
          isHeatSensitive: pd.isHeatSensitive || false,
          shelfLifeDays: pd.shelfLifeDays,
          requiresBatch: true,
          length: 20,
          width: 15,
          height: 10,
          weight: 0.5
        }
      });
      console.log('Created product:', pd.sku);
    }
    products.push(product);
  }
  console.log('Products created:', products.length);

  const supplier = suppliers[0];

  for (const product of products) {
    // Add inventory for each product in multiple locations
    const existingInv = await prisma.inventory.findFirst({ where: { productId: product.id } });
    if (!existingInv && locations.length > 0) {
      // Add to 2 random locations
      for (let i = 0; i < 2; i++) {
        const randomLoc = locations[Math.floor(Math.random() * locations.length)];
        const qty = Math.floor(Math.random() * 100) + 10;
        try {
          await prisma.inventory.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              locationId: randomLoc.id,
              quantity: qty,
              availableQuantity: qty,
              reservedQuantity: 0,
              lotNumber: 'LOT-' + Date.now().toString(36).toUpperCase() + i,
              batchNumber: 'BATCH-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
              batchBarcode: 'BC' + Math.random().toString(36).substring(2, 10).toUpperCase(),
              bestBeforeDate: new Date(Date.now() + (30 + Math.random() * 180) * 24 * 60 * 60 * 1000)
            }
          });
        } catch (e) {
          // Skip duplicates
        }
      }
      console.log('Added inventory for:', product.sku);
    }

    // Add supplier product
    const existingSP = await prisma.supplierProduct.findFirst({
      where: { productId: product.id, supplierId: supplier.id }
    });
    if (!existingSP) {
      try {
        await prisma.supplierProduct.create({
          data: {
            productId: product.id,
            supplierId: supplier.id,
            supplierSku: 'SUP-' + product.sku,
            caseSize: 12,
            caseCost: (product.costPrice || 10) * 12 * 0.9,
            unitCost: (product.costPrice || 10) * 0.9,
            companyId: company.id
          }
        });
        console.log('Added supplier product for:', product.sku);
      } catch (e) {
        // Skip if exists
      }
    }

    // Add alternative SKUs
    const existingAltSku = await prisma.alternativeSku.findFirst({
      where: { productId: product.id }
    });
    if (!existingAltSku) {
      const channels = ['AMAZON', 'EBAY', 'SHOPIFY'];
      for (const channel of channels) {
        try {
          await prisma.alternativeSku.create({
            data: {
              productId: product.id,
              sku: `${channel}-${product.sku}`,
              channel: channel,
              description: `${channel} marketplace SKU`,
              isActive: true,
              companyId: company.id
            }
          });
        } catch (e) {
          // Skip duplicates
        }
      }
      console.log('Added alternative SKUs for:', product.sku);
    }
  }

  // Create purchase orders
  const existingPO = await prisma.purchaseOrder.findFirst({ where: { supplierId: supplier.id } });
  if (!existingPO && products.length > 0) {
    const poNumber = 'PO-' + Date.now().toString(36).toUpperCase();
    const poItems = products.slice(0, 5).map(p => {
      const qty = Math.floor(Math.random() * 50) + 10;
      const unitPrice = p.costPrice || 10;
      return {
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        quantity: qty,
        unitPrice: unitPrice,
        totalPrice: qty * unitPrice,
        receivedQty: 0
      };
    });
    const subtotal = poItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber,
        supplierId: supplier.id,
        status: 'DRAFT',
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        subtotal: subtotal,
        totalAmount: subtotal,
        items: {
          create: poItems
        }
      }
    });
    console.log('Created PO:', po.poNumber);
  }

  // Create inventory movements
  const inventories = await prisma.inventory.findMany({ take: 5 });
  for (const inv of inventories) {
    const existingMovement = await prisma.inventoryMovement.findFirst({
      where: { productId: inv.productId }
    });
    if (!existingMovement) {
      try {
        await prisma.inventoryMovement.create({
          data: {
            productId: inv.productId,
            type: 'RECEIPT',
            quantity: inv.quantity,
            toLocationId: inv.locationId,
            reference: 'INIT-' + Date.now().toString(36),
            notes: 'Initial stock receipt'
          }
        });
        console.log('Created movement for product');
      } catch (e) {
        // Skip errors
      }
    }
  }

  console.log('\nData population complete!');
  console.log('Summary:');
  console.log('- Company:', company.name);
  console.log('- Warehouse:', warehouse.name);
  console.log('- Locations:', locations.length);
  console.log('- Products with data:', products.length);
}

seedData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
