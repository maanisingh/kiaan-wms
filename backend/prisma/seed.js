const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

// Expanded food brands
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
  { name: 'Deliciously Ella', code: 'DELLA' },
  { name: 'Pip & Nut', code: 'PIPNUT' },
];

// Expanded product catalog with realistic pricing
const PRODUCT_CATALOG = {
  'Nakd': [
    { name: 'Cashew Cookie Bar', cost: 0.65, price: 1.49, weight: 0.035 },
    { name: 'Cocoa Delight Bar', cost: 0.68, price: 1.49, weight: 0.035 },
    { name: 'Berry Delight Bar', cost: 0.70, price: 1.59, weight: 0.035 },
    { name: 'Pecan Pie Bar', cost: 0.72, price: 1.59, weight: 0.035 },
    { name: 'Salted Caramel Bar', cost: 0.75, price: 1.69, weight: 0.035 },
    { name: 'Blueberry Muffin Bar', cost: 0.68, price: 1.49, weight: 0.035 },
  ],
  'Graze': [
    { name: 'Vanilla Bliss Flapjack', cost: 0.55, price: 1.29, weight: 0.040 },
    { name: 'Choc Orange Flapjack', cost: 0.58, price: 1.29, weight: 0.040 },
    { name: 'Coconut Dream Flapjack', cost: 0.52, price: 1.19, weight: 0.040 },
    { name: 'Apple Crunch Bar', cost: 0.60, price: 1.39, weight: 0.040 },
    { name: 'Lemon Drizzle Flapjack', cost: 0.55, price: 1.29, weight: 0.040 },
  ],
  'KIND': [
    { name: 'Dark Chocolate Nuts & Sea Salt', cost: 0.85, price: 1.99, weight: 0.040 },
    { name: 'Almond & Coconut Bar', cost: 0.88, price: 1.99, weight: 0.040 },
    { name: 'Peanut Butter Dark Chocolate', cost: 0.90, price: 2.09, weight: 0.040 },
    { name: 'Maple Glazed Pecan & Sea Salt', cost: 0.92, price: 2.19, weight: 0.040 },
    { name: 'Caramel Almond & Sea Salt', cost: 0.88, price: 1.99, weight: 0.040 },
  ],
  'RXBAR': [
    { name: 'Chocolate Sea Salt Bar', cost: 1.10, price: 2.49, weight: 0.052 },
    { name: 'Blueberry Bar', cost: 1.05, price: 2.39, weight: 0.052 },
    { name: 'Peanut Butter Bar', cost: 1.08, price: 2.49, weight: 0.052 },
    { name: 'Mixed Berry Bar', cost: 1.12, price: 2.59, weight: 0.052 },
    { name: 'Coconut Chocolate Bar', cost: 1.15, price: 2.59, weight: 0.052 },
  ],
  'Quest': [
    { name: 'Chocolate Chip Cookie Dough Bar', cost: 1.20, price: 2.79, weight: 0.060 },
    { name: 'Cookies & Cream Bar', cost: 1.18, price: 2.79, weight: 0.060 },
    { name: 'Birthday Cake Bar', cost: 1.22, price: 2.89, weight: 0.060 },
    { name: 'S\'mores Bar', cost: 1.25, price: 2.99, weight: 0.060 },
  ],
  'Clif Bar': [
    { name: 'Chocolate Chip Energy Bar', cost: 0.75, price: 1.79, weight: 0.068 },
    { name: 'Crunchy Peanut Butter Bar', cost: 0.78, price: 1.89, weight: 0.068 },
    { name: 'White Chocolate Macadamia Bar', cost: 0.80, price: 1.99, weight: 0.068 },
    { name: 'Cool Mint Chocolate Bar', cost: 0.78, price: 1.89, weight: 0.068 },
  ],
  'Nature Valley': [
    { name: 'Oats & Honey Crunchy Bar', cost: 0.35, price: 0.89, weight: 0.042 },
    { name: 'Peanut Butter Crunchy Bar', cost: 0.38, price: 0.99, weight: 0.042 },
    { name: 'Dark Chocolate & Nut Bar', cost: 0.42, price: 1.09, weight: 0.042 },
    { name: 'Fruit & Nut Chewy Bar', cost: 0.40, price: 0.99, weight: 0.042 },
  ],
  'Deliciously Ella': [
    { name: 'Cacao & Almond Energy Ball', cost: 0.95, price: 2.29, weight: 0.036 },
    { name: 'Lemon & Pistachio Ball', cost: 0.98, price: 2.39, weight: 0.036 },
    { name: 'Apple & Cinnamon Oat Bar', cost: 0.88, price: 2.09, weight: 0.040 },
  ],
  'Pip & Nut': [
    { name: 'Almond Butter 250g', cost: 2.80, price: 5.49, weight: 0.250 },
    { name: 'Peanut Butter Smooth 300g', cost: 2.20, price: 4.29, weight: 0.300 },
    { name: 'Coconut Almond Butter 170g', cost: 2.50, price: 4.99, weight: 0.170 },
  ],
};

// Sales channels with realistic fees
const SALES_CHANNELS = [
  { name: 'Amazon FBA UK', code: 'AMZN-FBA-UK', type: 'AMAZON_FBA', referralFee: 15.0, fulfillmentFee: 2.50, fixedFee: 0 },
  { name: 'Amazon FBM UK', code: 'AMZN-FBM-UK', type: 'AMAZON_FBM', referralFee: 15.0, fulfillmentFee: 0, fixedFee: 0 },
  { name: 'Shopify DTC', code: 'SHOPIFY-DTC', type: 'SHOPIFY', referralFee: 2.9, fixedFee: 0.30, fulfillmentFee: 0 },
  { name: 'Shopify B2B Wholesale', code: 'SHOPIFY-B2B', type: 'SHOPIFY', referralFee: 2.9, fixedFee: 0.30, fulfillmentFee: 0 },
  { name: 'eBay UK', code: 'EBAY-UK', type: 'EBAY', referralFee: 12.8, fixedFee: 0.30, fulfillmentFee: 0 },
  { name: 'TikTok Shop UK', code: 'TIKTOK-UK', type: 'TIKTOK', referralFee: 5.0, fixedFee: 0, fulfillmentFee: 0 },
  { name: 'Direct Wholesale', code: 'DIRECT-WHOLESALE', type: 'WHOLESALE', referralFee: 0, fixedFee: 0, fulfillmentFee: 0 },
];

// Supplier data
const SUPPLIERS = [
  { name: 'Healthy Snacks Distribution', code: 'HSD', email: 'orders@hsd.co.uk', phone: '+44 161 555 0100' },
  { name: 'Natural Foods Wholesale', code: 'NFW', email: 'sales@naturalfoods.co.uk', phone: '+44 121 555 0200' },
  { name: 'Organic Treats Ltd', code: 'OTL', email: 'supply@organictreats.com', phone: '+44 20 555 0300' },
  { name: 'Premium Snack Co', code: 'PSC', email: 'trade@premiumsnack.co.uk', phone: '+44 151 555 0400' },
];

async function main() {
  console.log('🌱 Seeding database with comprehensive data...');

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

  // Create company with full settings
  console.log('🏢 Creating company with settings...');
  const company = await prisma.company.create({
    data: {
      name: 'Kiaan Food Distribution Ltd',
      code: 'KIAAN',
      description: 'Premium food and snack distribution across UK & Europe',
      email: 'info@kiaan-distribution.com',
      phone: '+44 20 7123 4567',
      address: '123 Distribution Way, London, E1 6AN, UK',
      // General Settings
      currency: 'GBP',
      timezone: 'Europe/London',
      dateFormat: 'DD/MM/YYYY',
      // Notification Settings
      emailNotifications: true,
      lowStockAlerts: true,
      orderConfirmations: true,
      // Inventory Settings
      autoReorderEnabled: true,
      batchTrackingEnabled: true,
      expiryTrackingEnabled: true,
      lowStockThreshold: 50,
      defaultTaxRate: 20.0,
    },
  });

  // Create demo users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@kiaan-wms.com',
        password: hashedPassword,
        name: 'Super Administrator',
        role: 'SUPER_ADMIN',
        companyId: company.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'companyadmin@kiaan-wms.com',
        password: hashedPassword,
        name: 'Company Admin',
        role: 'COMPANY_ADMIN',
        companyId: company.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'warehousemanager@kiaan-wms.com',
        password: hashedPassword,
        name: 'Warehouse Manager',
        role: 'WAREHOUSE_MANAGER',
        companyId: company.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'inventorymanager@kiaan-wms.com',
        password: hashedPassword,
        name: 'Inventory Manager',
        role: 'INVENTORY_MANAGER',
        companyId: company.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'picker@kiaan-wms.com',
        password: hashedPassword,
        name: 'Warehouse Picker',
        role: 'PICKER',
        companyId: company.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'packer@kiaan-wms.com',
        password: hashedPassword,
        name: 'Warehouse Packer',
        role: 'PACKER',
        companyId: company.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'viewer@kiaan-wms.com',
        password: hashedPassword,
        name: 'Viewer (Read-Only)',
        role: 'VIEWER',
        companyId: company.id,
      },
    }),
    // Legacy admin
    prisma.user.create({
      data: {
        email: 'admin@kiaan.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Admin User',
        role: 'ADMIN',
        companyId: company.id,
      },
    }),
  ]);

  // Create warehouses
  console.log('🏭 Creating warehouses...');
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Distribution Center',
      code: 'WH-MAIN',
      type: 'MAIN',
      companyId: company.id,
      address: '123 Distribution Way, London, E1 6AN',
      phone: '+44 20 7123 4567',
      capacity: 50000,
      status: 'ACTIVE',
    },
  });

  const prepWarehouse = await prisma.warehouse.create({
    data: {
      name: 'FBA Prep Center',
      code: 'WH-PREP',
      type: 'PREP',
      companyId: company.id,
      address: '456 Prep Lane, Manchester, M1 1AA',
      phone: '+44 161 123 4567',
      capacity: 15000,
      status: 'ACTIVE',
    },
  });

  // Create zones
  console.log('📍 Creating zones...');
  const zones = await Promise.all([
    prisma.zone.create({
      data: { name: 'Zone A - Ambient Storage', code: 'ZN-A', warehouseId: mainWarehouse.id, zoneType: 'STANDARD' },
    }),
    prisma.zone.create({
      data: { name: 'Zone B - Ambient Storage', code: 'ZN-B', warehouseId: mainWarehouse.id, zoneType: 'STANDARD' },
    }),
    prisma.zone.create({
      data: { name: 'Zone C - Picking Area', code: 'ZN-C', warehouseId: mainWarehouse.id, zoneType: 'PICKING' },
    }),
    prisma.zone.create({
      data: { name: 'Zone D - Dispatch', code: 'ZN-D', warehouseId: mainWarehouse.id, zoneType: 'DISPATCH' },
    }),
  ]);

  // Create locations
  console.log('📦 Creating locations...');
  const locations = [];
  const aisles = ['A', 'B', 'C', 'D', 'E'];
  for (const aisle of aisles) {
    for (let rack = 1; rack <= 5; rack++) {
      for (let shelf = 1; shelf <= 4; shelf++) {
        const zone = aisle <= 'B' ? zones[0] : zones[1];
        const location = await prisma.location.create({
          data: {
            name: `${aisle}${rack}-${shelf}`,
            code: `LOC-${aisle}${rack}${shelf}`,
            warehouseId: mainWarehouse.id,
            zoneId: zone.id,
            aisle,
            rack: String(rack),
            shelf: String(shelf),
            bin: '1',
          },
        });
        locations.push(location);
      }
    }
  }

  // Create suppliers
  console.log('🚚 Creating suppliers...');
  const suppliers = [];
  for (const supplierData of SUPPLIERS) {
    const supplier = await prisma.supplier.create({
      data: {
        name: supplierData.name,
        code: supplierData.code,
        email: supplierData.email,
        phone: supplierData.phone,
        address: faker.location.streetAddress() + ', ' + faker.location.city(),
        companyId: company.id,
        status: 'ACTIVE',
        paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 60', 'COD']),
      },
    });
    suppliers.push(supplier);
  }

  // Create brands
  console.log('🏷️ Creating brands...');
  const brands = [];
  for (const brandData of FOOD_BRANDS) {
    const brand = await prisma.brand.create({
      data: {
        name: brandData.name,
        code: brandData.code,
        description: `${brandData.name} - Premium healthy snack brand`,
        companyId: company.id,
      },
    });
    brands.push(brand);
  }

  // Create products with realistic pricing
  console.log('🍫 Creating products (50+ items)...');
  const products = [];
  const bundleProducts = [];
  let productIndex = 0;

  for (const brand of brands) {
    const catalog = PRODUCT_CATALOG[brand.name] || [];

    for (const item of catalog) {
      productIndex++;
      const sku = `${brand.code}-${String(productIndex).padStart(4, '0')}`;

      // Single product
      const product = await prisma.product.create({
        data: {
          sku,
          name: `${brand.name} ${item.name}`,
          description: `${brand.name} ${item.name} - Premium quality`,
          barcode: `50${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`,
          companyId: company.id,
          brandId: brand.id,
          type: 'SIMPLE',
          status: 'ACTIVE',
          length: 15,
          width: 5,
          height: 2,
          weight: item.weight,
          dimensionUnit: 'cm',
          weightUnit: 'kg',
          costPrice: item.cost,
          sellingPrice: item.price,
          currency: 'GBP',
          isPerishable: true,
          requiresBatch: true,
          shelfLifeDays: 365,
          images: [],
        },
      });
      products.push(product);

      // Create 12-pack bundle for bars
      if (item.weight < 0.1) {
        const bundleSku = `${brand.code}-BDL-${String(productIndex).padStart(4, '0')}`;
        const bundle = await prisma.product.create({
          data: {
            sku: bundleSku,
            name: `${brand.name} ${item.name} - 12 Pack`,
            description: `${brand.name} ${item.name} - Case of 12`,
            barcode: `50${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`,
            companyId: company.id,
            brandId: brand.id,
            type: 'BUNDLE',
            status: 'ACTIVE',
            length: 30,
            width: 20,
            height: 10,
            weight: item.weight * 12,
            dimensionUnit: 'cm',
            weightUnit: 'kg',
            costPrice: item.cost * 12 * 0.95, // 5% bundle discount
            sellingPrice: item.price * 12 * 0.90, // 10% bundle discount
            currency: 'GBP',
            isPerishable: true,
            requiresBatch: true,
            shelfLifeDays: 365,
            images: [],
          },
        });
        bundleProducts.push(bundle);

        await prisma.bundleItem.create({
          data: {
            parentId: bundle.id,
            childId: product.id,
            quantity: 12,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${products.length} products + ${bundleProducts.length} bundles`);

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

  // Create channel pricing for ALL products
  console.log('💰 Creating channel pricing for all products...');
  let channelPriceCount = 0;
  for (const product of [...products, ...bundleProducts]) {
    for (const channel of channels) {
      // Calculate channel-specific pricing
      let sellingPrice = product.sellingPrice;
      let laborCost = 0.15;
      let materialCost = 0.10;
      let shippingCost = 0.80;

      // Adjust for channel type
      if (channel.type === 'WHOLESALE') {
        sellingPrice = product.sellingPrice * 0.75; // 25% wholesale discount
        shippingCost = 0.20; // Lower per-unit shipping for bulk
      } else if (channel.type === 'AMAZON_FBA') {
        laborCost = 0.25; // Higher prep labor
        materialCost = 0.20; // FBA labeling
      }

      const referralFee = sellingPrice * (channel.referralFeePercent / 100);
      const fulfillmentFee = channel.fulfillmentFeePerUnit || 0;
      const totalChannelFees = referralFee + (channel.fixedFee || 0) + fulfillmentFee;
      const totalCost = product.costPrice + laborCost + materialCost + shippingCost + totalChannelFees;
      const grossProfit = sellingPrice - totalCost;
      const profitMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

      await prisma.channelPrice.create({
        data: {
          productId: product.id,
          channelId: channel.id,
          sellingPrice,
          productCost: product.costPrice,
          laborCost,
          materialCost,
          shippingCost,
          channelFees: totalChannelFees,
          totalCost,
          grossProfit,
          profitMargin,
          isActive: true,
        },
      });
      channelPriceCount++;
    }
  }
  console.log(`✅ Created ${channelPriceCount} channel price records`);

  // Create inventory with BBD
  console.log('📊 Creating inventory with best-before dates...');
  const today = new Date();
  let inventoryCount = 0;

  for (const product of products) {
    // 3 lots per product with different BBD
    const lots = [
      { daysUntilExpiry: 45, quantity: faker.number.int({ min: 30, max: 80 }) },
      { daysUntilExpiry: 120, quantity: faker.number.int({ min: 100, max: 250 }) },
      { daysUntilExpiry: 280, quantity: faker.number.int({ min: 200, max: 500 }) },
    ];

    for (const lot of lots) {
      const location = faker.helpers.arrayElement(locations);
      const lotNumber = `LOT-${faker.string.alphanumeric(8).toUpperCase()}`;

      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: mainWarehouse.id,
          locationId: location.id,
          lotNumber,
          batchNumber: lotNumber,
          bestBeforeDate: new Date(today.getTime() + lot.daysUntilExpiry * 24 * 60 * 60 * 1000),
          receivedDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          quantity: lot.quantity,
          availableQuantity: lot.quantity,
          reservedQuantity: 0,
          status: 'AVAILABLE',
        },
      });
      inventoryCount++;
    }
  }
  console.log(`✅ Created ${inventoryCount} inventory records`);

  // Create replenishment configs
  console.log('🔄 Creating replenishment configurations...');
  for (const product of products) {
    await prisma.replenishmentConfig.create({
      data: {
        productId: product.id,
        minStockLevel: 50,
        maxStockLevel: 500,
        reorderPoint: 100,
        reorderQuantity: 200,
        autoCreateTasks: true,
        enabled: true,
      },
    });
  }

  // Create customers
  console.log('👥 Creating customers...');
  const customers = [];

  // B2C customers
  for (let i = 0; i < 50; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        code: `CUST-${String(i + 1).padStart(5, '0')}`,
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number('+44 7### ### ###'),
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.zipCode()}`,
        companyId: company.id,
        customerType: 'B2C',
      },
    });
    customers.push(customer);
  }

  // B2B wholesale customers
  const b2bCompanies = [
    'Holland & Barrett', 'Whole Foods Market UK', 'Planet Organic', 'As Nature Intended',
    'Healthy Living', 'The Health Store', 'GNC UK', 'Revital Health', 'Grape Tree',
    'Natural Grocers Ltd', 'Organic Direct', 'Health Matters', 'Fresh & Wild', 'Pure Foods'
  ];

  for (let i = 0; i < b2bCompanies.length; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: b2bCompanies[i],
        code: `B2B-${String(i + 1).padStart(4, '0')}`,
        email: faker.internet.email({ firstName: b2bCompanies[i].split(' ')[0].toLowerCase() }).toLowerCase(),
        phone: faker.phone.number('+44 20 #### ####'),
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.zipCode()}`,
        companyId: company.id,
        customerType: 'B2B',
      },
    });
    customers.push(customer);
  }

  // Create 30 days of sales orders
  console.log('🛒 Creating 30 days of sales order history...');
  const orderStatuses = ['PENDING', 'CONFIRMED', 'ALLOCATED', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED'];
  let orderCount = 0;

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const orderDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const ordersPerDay = faker.number.int({ min: 8, max: 20 }); // 8-20 orders per day

    for (let j = 0; j < ordersPerDay; j++) {
      orderCount++;
      const isWholesale = Math.random() < 0.2; // 20% wholesale
      const customer = isWholesale
        ? faker.helpers.arrayElement(customers.filter(c => c.customerType === 'B2B'))
        : faker.helpers.arrayElement(customers.filter(c => c.customerType === 'B2C'));

      const channel = isWholesale
        ? channels.find(c => c.type === 'WHOLESALE') || channels[0]
        : faker.helpers.arrayElement(channels.filter(c => c.type !== 'WHOLESALE'));

      const orderProducts = isWholesale
        ? faker.helpers.arrayElements(bundleProducts, faker.number.int({ min: 3, max: 8 }))
        : faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 6 }));

      let subtotal = 0;
      const orderItems = [];

      for (const prod of orderProducts) {
        const quantity = isWholesale
          ? faker.number.int({ min: 10, max: 50 })
          : faker.number.int({ min: 1, max: 4 });
        const unitPrice = isWholesale ? prod.sellingPrice * 0.75 : prod.sellingPrice;
        const total = quantity * unitPrice;
        subtotal += total;

        orderItems.push({
          productId: prod.id,
          quantity,
          unitPrice,
          discount: 0,
          tax: total * 0.2,
          totalPrice: total,
        });
      }

      const tax = subtotal * 0.2;
      const shipping = isWholesale ? 0 : faker.helpers.arrayElement([3.99, 4.99, 5.99, 0]);
      const total = subtotal + tax + shipping;

      // Older orders more likely to be delivered
      let status;
      if (daysAgo > 7) {
        status = faker.helpers.arrayElement(['DELIVERED', 'SHIPPED', 'DELIVERED', 'DELIVERED']);
      } else if (daysAgo > 3) {
        status = faker.helpers.arrayElement(['SHIPPED', 'PACKED', 'PICKING', 'DELIVERED']);
      } else {
        status = faker.helpers.arrayElement(orderStatuses);
      }

      await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${String(orderCount).padStart(6, '0')}`,
          customerId: customer.id,
          isWholesale,
          salesChannel: channel.name,
          externalOrderId: `${channel.code}-${faker.string.alphanumeric(10).toUpperCase()}`,
          status,
          priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
          items: { create: orderItems },
          subtotal,
          taxAmount: tax,
          shippingCost: shipping,
          discountAmount: 0,
          totalAmount: total,
          shippingAddress: customer.address,
          shippingMethod: isWholesale ? 'Pallet Delivery' : faker.helpers.arrayElement(['Standard', 'Express', 'Next Day']),
          orderDate,
        },
      });
    }
  }
  console.log(`✅ Created ${orderCount} sales orders over 30 days`);

  // Summary
  console.log('\n✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Company: 1 (with full settings)`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Warehouses: 2`);
  console.log(`   - Zones: ${zones.length}`);
  console.log(`   - Locations: ${locations.length}`);
  console.log(`   - Suppliers: ${suppliers.length}`);
  console.log(`   - Brands: ${brands.length}`);
  console.log(`   - Products: ${products.length} + ${bundleProducts.length} bundles`);
  console.log(`   - Channel Prices: ${channelPriceCount}`);
  console.log(`   - Inventory Records: ${inventoryCount}`);
  console.log(`   - Customers: ${customers.length} (B2C + B2B)`);
  console.log(`   - Sales Orders: ${orderCount} (30 days history)`);
  console.log('\n🔐 Login Credentials:');
  console.log('   admin@kiaan-wms.com / Admin@123');
  console.log('   admin@kiaan.com / admin123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
