const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

// Food brands commonly found in distribution
const FOOD_BRANDS = [
  { name: 'Nakd', code: 'NAKD' },
  { name: 'Graze', code: 'GRAZE' },
  { name: 'KIND', code: 'KIND' },
  { name: 'Nature Valley', code: 'NTVLY' },
  { name: 'Clif Bar', code: 'CLIF' },
  { name: 'RXBAR', code: 'RX' },
  { name: 'Quest', code: 'QUEST' },
  { name: 'LÄRABAR', code: 'LARA' },
  { name: 'GoMacro', code: 'GMCRO' },
  { name: 'Booja-Booja', code: 'BOOJA' },
];

// Product types for food distribution
const PRODUCT_FLAVORS = {
  'Nakd': ['Cashew Cookie', 'Cocoa Delight', 'Berry Delight', 'Pecan Pie', 'Salted Caramel'],
  'Graze': ['Vanilla Bliss', 'Choc Orange', 'Coconut Dream', 'Apple Crunch'],
  'KIND': ['Dark Chocolate', 'Almond & Coconut', 'Peanut Butter', 'Maple Glazed'],
  'RXBAR': ['Chocolate Sea Salt', 'Blueberry', 'Peanut Butter', 'Mixed Berry'],
};

// Sales channels for food business
const SALES_CHANNELS = [
  { name: 'Amazon FBA UK', code: 'AMZN-FBA-UK', type: 'AMAZON_FBA', referralFee: 15.0, fulfillmentFee: 2.5 },
  { name: 'Shopify Retail', code: 'SHOPIFY-RETAIL', type: 'SHOPIFY', referralFee: 2.9, fixedFee: 0.30 },
  { name: 'Shopify B2B', code: 'SHOPIFY-B2B', type: 'SHOPIFY', referralFee: 2.9, fixedFee: 0.30 },
  { name: 'eBay UK', code: 'EBAY-UK', type: 'EBAY', referralFee: 12.8, fixedFee: 0.30 },
  { name: 'Direct Wholesale', code: 'DIRECT-WHOLESALE', type: 'WHOLESALE', referralFee: 0, fixedFee: 0 },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.pickItem.deleteMany();
  await prisma.pickList.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.transferItem.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.channelPrice.deleteMany();
  await prisma.salesChannel.deleteMany();
  await prisma.replenishmentTask.deleteMany();
  await prisma.replenishmentConfig.deleteMany();
  await prisma.bundleItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.location.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Create company
  console.log('🏢 Creating company...');
  const company = await prisma.company.create({
    data: {
      name: 'Kiaan Food Distribution Ltd',
      code: 'KIAAN',
      description: 'Premium food and snack distribution',
      email: 'info@kiaan-distribution.com',
      phone: '+44 20 1234 5678',
      address: '123 Distribution Lane, London, UK',
    },
  });

  // Create demo users for all 6 roles (matching frontend quick login buttons)
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10); // Match frontend password

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@kiaan-wms.com',
      password: hashedPassword,
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      companyId: company.id,
    },
  });

  const companyAdmin = await prisma.user.create({
    data: {
      email: 'companyadmin@kiaan-wms.com',
      password: hashedPassword,
      name: 'Company Admin',
      role: 'COMPANY_ADMIN',
      companyId: company.id,
    },
  });

  const warehouseManager = await prisma.user.create({
    data: {
      email: 'warehousemanager@kiaan-wms.com',
      password: hashedPassword,
      name: 'Warehouse Manager',
      role: 'WAREHOUSE_MANAGER',
      companyId: company.id,
    },
  });

  const inventoryManager = await prisma.user.create({
    data: {
      email: 'inventorymanager@kiaan-wms.com',
      password: hashedPassword,
      name: 'Inventory Manager',
      role: 'INVENTORY_MANAGER',
      companyId: company.id,
    },
  });

  const picker = await prisma.user.create({
    data: {
      email: 'picker@kiaan-wms.com',
      password: hashedPassword,
      name: 'Picker',
      role: 'PICKER',
      companyId: company.id,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@kiaan-wms.com',
      password: hashedPassword,
      name: 'Viewer (Read-Only)',
      role: 'VIEWER',
      companyId: company.id,
    },
  });

  // Also keep the legacy admin for backward compatibility
  const admin = await prisma.user.create({
    data: {
      email: 'admin@kiaan.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      role: 'ADMIN',
      companyId: company.id,
    },
  });

  // Create warehouses (Main + Prep)
  console.log('🏭 Creating warehouses...');
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Distribution Center',
      code: 'WH-MAIN',
      type: 'MAIN',
      companyId: company.id,
      address: '123 Distribution Lane, London, UK',
      phone: '+44 20 1234 5678',
      capacity: 50000,
      status: 'ACTIVE',
    },
  });

  const prepWarehouse = await prisma.warehouse.create({
    data: {
      name: 'FBA Prep Warehouse',
      code: 'WH-PREP',
      type: 'PREP',
      companyId: company.id,
      address: '456 Prep Street, London, UK',
      phone: '+44 20 1234 5679',
      capacity: 10000,
      status: 'ACTIVE',
    },
  });

  // Create zones
  console.log('📍 Creating zones...');
  const zoneA = await prisma.zone.create({
    data: {
      name: 'Zone A - Ambient',
      code: 'ZN-A',
      warehouseId: mainWarehouse.id,
      zoneType: 'STANDARD',
    },
  });

  const zoneB = await prisma.zone.create({
    data: {
      name: 'Zone B - Ambient',
      code: 'ZN-B',
      warehouseId: mainWarehouse.id,
      zoneType: 'STANDARD',
    },
  });

  // Create locations
  console.log('📦 Creating locations...');
  const locations = [];
  for (let i = 1; i <= 20; i++) {
    const zone = i <= 10 ? zoneA : zoneB;
    const aisle = String.fromCharCode(65 + Math.floor((i - 1) / 5)); // A, B, C, D
    const rack = String(((i - 1) % 5) + 1);

    const location = await prisma.location.create({
      data: {
        name: `Location ${aisle}${rack}`,
        code: `LOC-${aisle}${rack}`,
        warehouseId: mainWarehouse.id,
        zoneId: zone.id,
        aisle: aisle,
        rack: rack,
        shelf: '1',
        bin: '1',
      },
    });
    locations.push(location);
  }

  // Create food brands
  console.log('🏷️ Creating food brands...');
  const brands = [];
  for (const brandData of FOOD_BRANDS) {
    const brand = await prisma.brand.create({
      data: {
        name: brandData.name,
        code: brandData.code,
        description: `${brandData.name} healthy snack brand`,
        companyId: company.id,
      },
    });
    brands.push(brand);
  }

  // Create products with bundles
  console.log('🍫 Creating products (single items + bundles)...');
  const products = [];
  const bundleProducts = [];

  for (const brand of brands.slice(0, 4)) { // Focus on top 4 brands
    const flavors = PRODUCT_FLAVORS[brand.name] || ['Original', 'Classic', 'Deluxe'];

    for (let i = 0; i < flavors.length; i++) {
      const flavor = flavors[i];
      const sku = `${brand.code}-${String(i + 1).padStart(3, '0')}`;

      // Create single product
      const product = await prisma.product.create({
        data: {
          sku: sku,
          name: `${brand.name} ${flavor}`,
          description: `${brand.name} ${flavor} Bar - Single Unit`,
          barcode: `${Math.floor(Math.random() * 1000000000000)}`,
          companyId: company.id,
          brandId: brand.id,
          type: 'SIMPLE',
          status: 'ACTIVE',
          length: 15,
          width: 5,
          height: 2,
          weight: 0.05,
          dimensionUnit: 'cm',
          weightUnit: 'kg',
          costPrice: 0.75,
          sellingPrice: 1.50,
          currency: 'GBP',
          isPerishable: true,
          requiresBatch: true,
          shelfLifeDays: 365,
          images: [],
        },
      });
      products.push(product);

      // Create 12-pack bundle
      const bundleSku = `${brand.code}-BDL-${String(i + 1).padStart(3, '0')}`;
      const bundle = await prisma.product.create({
        data: {
          sku: bundleSku,
          name: `${brand.name} ${flavor} - 12 Pack`,
          description: `${brand.name} ${flavor} Bar - Case of 12`,
          barcode: `${Math.floor(Math.random() * 1000000000000)}`,
          companyId: company.id,
          brandId: brand.id,
          type: 'BUNDLE',
          status: 'ACTIVE',
          length: 30,
          width: 20,
          height: 10,
          weight: 0.6,
          dimensionUnit: 'cm',
          weightUnit: 'kg',
          costPrice: 9.00,
          sellingPrice: 15.00,
          currency: 'GBP',
          isPerishable: true,
          requiresBatch: true,
          shelfLifeDays: 365,
          images: [],
        },
      });
      bundleProducts.push(bundle);

      // Link bundle to single product (12 units)
      await prisma.bundleItem.create({
        data: {
          parentId: bundle.id,
          childId: product.id,
          quantity: 12,
        },
      });
    }
  }

  console.log(`✅ Created ${products.length} single products and ${bundleProducts.length} bundles`);

  // Create inventory with best-before dates
  console.log('📊 Creating inventory with best-before dates...');
  const today = new Date();
  const inventoryItems = [];

  for (const product of products) {
    // Create multiple lots with different best-before dates
    const lots = [
      {
        lotNumber: `LOT-${faker.string.alphanumeric(6).toUpperCase()}`,
        bestBeforeDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days
        quantity: faker.number.int({ min: 50, max: 150 }),
      },
      {
        lotNumber: `LOT-${faker.string.alphanumeric(6).toUpperCase()}`,
        bestBeforeDate: new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000), // 180 days
        quantity: faker.number.int({ min: 100, max: 300 }),
      },
      {
        lotNumber: `LOT-${faker.string.alphanumeric(6).toUpperCase()}`,
        bestBeforeDate: new Date(today.getTime() + 300 * 24 * 60 * 60 * 1000), // 300 days
        quantity: faker.number.int({ min: 200, max: 500 }),
      },
    ];

    for (const lot of lots) {
      const location = faker.helpers.arrayElement(locations);
      const inventory = await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: mainWarehouse.id,
          locationId: location.id,
          lotNumber: lot.lotNumber,
          batchNumber: lot.lotNumber,
          bestBeforeDate: lot.bestBeforeDate,
          receivedDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          quantity: lot.quantity,
          availableQuantity: lot.quantity,
          reservedQuantity: 0,
          status: 'AVAILABLE',
        },
      });
      inventoryItems.push(inventory);
    }
  }

  console.log(`✅ Created ${inventoryItems.length} inventory items with BB dates`);

  // Create replenishment configs
  console.log('🔄 Creating replenishment configurations...');
  for (const product of products.slice(0, 10)) { // First 10 products
    await prisma.replenishmentConfig.create({
      data: {
        productId: product.id,
        minStockLevel: 100,
        maxStockLevel: 500,
        reorderPoint: 150,
        reorderQuantity: 300,
        autoCreateTasks: true,
        enabled: true,
      },
    });
  }

  // Create sales channels
  console.log('📢 Creating sales channels...');
  const channels = [];
  for (const channelData of SALES_CHANNELS) {
    const channel = await prisma.salesChannel.create({
      data: {
        name: channelData.name,
        code: channelData.code,
        type: channelData.type,
        referralFeePercent: channelData.referralFee,
        fixedFee: channelData.fixedFee,
        fulfillmentFeePerUnit: channelData.fulfillmentFee || null,
        isActive: true,
      },
    });
    channels.push(channel);
  }

  // Create channel pricing
  console.log('💰 Creating channel pricing...');
  for (const product of products.slice(0, 10)) {
    for (const channel of channels) {
      const sellingPrice = channel.type === 'WHOLESALE' ? 1.20 : product.sellingPrice;
      const totalCost = product.costPrice + 0.10 + 0.05; // Cost + labor + materials
      const grossProfit = sellingPrice - totalCost;
      const profitMargin = (grossProfit / sellingPrice) * 100;

      await prisma.channelPrice.create({
        data: {
          productId: product.id,
          channelId: channel.id,
          sellingPrice: sellingPrice,
          productCost: product.costPrice,
          laborCost: 0.10,
          materialCost: 0.05,
          shippingCost: 0.50,
          totalCost: totalCost,
          grossProfit: grossProfit,
          profitMargin: profitMargin,
          isActive: true,
        },
      });
    }
  }

  // Create customers
  console.log('👥 Creating customers...');
  const customers = [];

  // B2C customers
  for (let i = 0; i < 20; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        code: `CUST-${String(i + 1).padStart(4, '0')}`,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        companyId: company.id,
        customerType: 'B2C',
      },
    });
    customers.push(customer);
  }

  // B2B wholesale customers
  for (let i = 0; i < 5; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.company.name(),
        code: `WHSL-${String(i + 1).padStart(4, '0')}`,
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        companyId: company.id,
        customerType: 'B2B',
      },
    });
    customers.push(customer);
  }

  // Create sales orders with wholesale flags
  console.log('🛒 Creating sales orders (B2C + B2B wholesale)...');
  const shopifyB2B = channels.find(c => c.code === 'SHOPIFY-B2B');
  const shopifyRetail = channels.find(c => c.code === 'SHOPIFY-RETAIL');

  for (let i = 0; i < 30; i++) {
    const isWholesale = i % 4 === 0; // Every 4th order is wholesale
    const customer = isWholesale
      ? customers.find(c => c.customerType === 'B2B') || customers[0]
      : customers.find(c => c.customerType === 'B2C') || customers[0];

    const channel = isWholesale ? shopifyB2B : shopifyRetail;
    const productsToOrder = isWholesale
      ? faker.helpers.arrayElements(bundleProducts, faker.number.int({ min: 2, max: 5 }))
      : faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 5 }));

    let subtotal = 0;
    const orderItems = [];

    for (const product of productsToOrder) {
      const quantity = isWholesale
        ? faker.number.int({ min: 5, max: 20 }) // Wholesale orders higher quantity
        : faker.number.int({ min: 1, max: 5 });
      const unitPrice = product.sellingPrice;
      const total = quantity * unitPrice;
      subtotal += total;

      orderItems.push({
        productId: product.id,
        quantity,
        unitPrice,
        discount: 0,
        tax: total * 0.2,
        totalPrice: total,
      });
    }

    const tax = subtotal * 0.2;
    const shipping = isWholesale ? 0 : 5.99;
    const total = subtotal + tax + shipping;

    await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${String(i + 1).padStart(6, '0')}`,
        customerId: customer.id,
        isWholesale: isWholesale,
        salesChannel: channel?.name || 'Direct',
        externalOrderId: `SHOP-${faker.string.alphanumeric(10).toUpperCase()}`,
        status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'ALLOCATED']),
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
        items: {
          create: orderItems,
        },
        subtotal,
        taxAmount: tax,
        shippingCost: shipping,
        discountAmount: 0,
        totalAmount: total,
        shippingAddress: customer.address,
        shippingMethod: isWholesale ? 'Pallet' : 'Standard',
        orderDate: new Date(),
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Companies: 1`);
  console.log(`   - Users: 7 (6 demo roles + 1 legacy admin)`);
  console.log(`   - Warehouses: 2 (Main + Prep)`);
  console.log(`   - Zones: 2`);
  console.log(`   - Locations: ${locations.length}`);
  console.log(`   - Brands: ${brands.length}`);
  console.log(`   - Products: ${products.length} singles + ${bundleProducts.length} bundles`);
  console.log(`   - Inventory Items: ${inventoryItems.length} (with BB dates)`);
  console.log(`   - Sales Channels: ${channels.length}`);
  console.log(`   - Customers: ${customers.length} (20 B2C + 5 B2B)`);
  console.log(`   - Sales Orders: 30 (with wholesale flags)`);
  console.log('\n✨ Ready to use!');
  console.log('   Email: admin@kiaan.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
