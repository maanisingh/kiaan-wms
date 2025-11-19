const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { faker } = require('@faker-js/faker');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'wms-secret-key-2024';

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://wms.alexandratechlab.com',
    'http://localhost:3000',
    'http://localhost:3011'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// In-memory data storage (for demo purposes)
const dataStore = {
  users: [],
  companies: [],
  warehouses: [],
  products: [],
  inventory: [],
  salesOrders: [],
  purchaseOrders: [],
  shipments: [],
  returns: [],
  transfers: [],
  customers: [],
  suppliers: [],
  categories: [],
  zones: [],
  locations: [],
  pickLists: [],
  activities: [],
  notifications: []
};

// Helper functions
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Initialize mock data
const initializeData = () => {
  // Create admin user
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  dataStore.users.push({
    id: 'user-1',
    email: 'admin@kiaan.com',
    password: hashedPassword,
    name: 'Admin User',
    role: 'admin',
    companyId: 'company-1',
    status: 'active',
    permissions: ['all'],
    createdAt: new Date().toISOString()
  });

  // Generate companies
  for (let i = 1; i <= 5; i++) {
    dataStore.companies.push({
      id: `company-${i}`,
      name: faker.company.name(),
      code: `COMP${String(i).padStart(3, '0')}`,
      logo: `https://via.placeholder.com/100?text=C${i}`,
      billingRules: [],
      settings: {
        allowBackorders: faker.datatype.boolean(),
        autoAllocate: true,
        requireSerialNumbers: false,
        requireBatchNumbers: faker.datatype.boolean()
      },
      status: 'active',
      createdAt: faker.date.past().toISOString()
    });
  }

  // Generate warehouses
  for (let i = 1; i <= 10; i++) {
    const total = faker.number.int({ min: 50000, max: 200000 });
    const used = faker.number.int({ min: 20000, max: total * 0.8 });

    dataStore.warehouses.push({
      id: `warehouse-${i}`,
      name: `${faker.location.city()} Warehouse ${i}`,
      code: `WH${String(i).padStart(3, '0')}`,
      companyId: `company-${faker.number.int({ min: 1, max: 5 })}`,
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode()
      },
      type: faker.helpers.arrayElement(['fulfillment', '3pl', 'distribution', 'cold_storage']),
      capacity: {
        total,
        used,
        available: total - used,
        unit: 'sqft'
      },
      zones: [],
      status: 'active',
      settings: {
        enablePickOptimization: true,
        enableCycleCounts: true,
        lowStockThreshold: 10,
        expiryAlertDays: 30
      },
      createdAt: faker.date.past().toISOString()
    });
  }

  // Generate categories
  const categories = [
    { id: 'cat-1', name: 'Electronics', code: 'ELEC', description: 'Electronic devices' },
    { id: 'cat-2', name: 'Clothing', code: 'CLTH', description: 'Apparel and accessories' },
    { id: 'cat-3', name: 'Food & Beverage', code: 'FOOD', description: 'Food products' },
    { id: 'cat-4', name: 'Home & Garden', code: 'HOME', description: 'Home supplies' },
    { id: 'cat-5', name: 'Sports', code: 'SPRT', description: 'Sports equipment' }
  ];
  dataStore.categories = categories;

  // Generate products
  for (let i = 1; i <= 100; i++) {
    const product = {
      id: `product-${i}`,
      sku: `SKU${String(i).padStart(6, '0')}`,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      barcode: faker.string.numeric(12),
      companyId: `company-${faker.number.int({ min: 1, max: 5 })}`,
      categoryId: categories[faker.number.int({ min: 0, max: 4 })].id,
      type: faker.helpers.arrayElement(['simple', 'variant', 'bundle']),
      status: 'active',
      dimensions: {
        length: faker.number.float({ min: 10, max: 100 }),
        width: faker.number.float({ min: 10, max: 100 }),
        height: faker.number.float({ min: 10, max: 100 }),
        weight: faker.number.float({ min: 0.5, max: 50 }),
        unit: 'cm',
        weightUnit: 'kg'
      },
      pricing: {
        cost: faker.number.float({ min: 10, max: 500 }),
        price: faker.number.float({ min: 20, max: 1000 }),
        currency: 'USD'
      },
      inventory: {
        reorderPoint: faker.number.int({ min: 10, max: 50 }),
        reorderQuantity: faker.number.int({ min: 50, max: 200 }),
        minStock: 10,
        maxStock: 1000
      },
      images: [faker.image.url()],
      requiresSerial: faker.datatype.boolean(),
      requiresBatch: faker.datatype.boolean(),
      isPerishable: faker.datatype.boolean(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    };
    dataStore.products.push(product);

    // Generate inventory for each product
    for (let w = 1; w <= 3; w++) {
      dataStore.inventory.push({
        id: `inv-${i}-${w}`,
        productId: product.id,
        warehouseId: `warehouse-${w}`,
        quantity: faker.number.int({ min: 0, max: 500 }),
        available: faker.number.int({ min: 0, max: 400 }),
        reserved: faker.number.int({ min: 0, max: 100 }),
        status: 'available',
        locationId: `location-${faker.number.int({ min: 1, max: 100 })}`,
        batchNumber: product.requiresBatch ? `BATCH-${faker.string.alphanumeric(8)}` : null,
        serialNumbers: product.requiresSerial ? [faker.string.alphanumeric(12)] : [],
        expiryDate: product.isPerishable ? faker.date.future().toISOString() : null,
        lastCounted: faker.date.recent().toISOString()
      });
    }
  }

  // Generate customers
  for (let i = 1; i <= 50; i++) {
    dataStore.customers.push({
      id: `customer-${i}`,
      companyId: `company-${faker.number.int({ min: 1, max: 5 })}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      type: faker.helpers.arrayElement(['retail', 'wholesale', 'b2b']),
      taxId: faker.string.alphanumeric(10),
      billingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode()
      },
      shippingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode()
      },
      creditLimit: faker.number.int({ min: 1000, max: 100000 }),
      balance: faker.number.float({ min: 0, max: 50000 }),
      status: 'active',
      createdAt: faker.date.past().toISOString()
    });
  }

  // Generate sales orders
  for (let i = 1; i <= 100; i++) {
    const items = [];
    const numItems = faker.number.int({ min: 1, max: 5 });

    for (let j = 0; j < numItems; j++) {
      const product = faker.helpers.arrayElement(dataStore.products);
      items.push({
        id: `item-${i}-${j}`,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: faker.number.int({ min: 1, max: 20 }),
        price: product.pricing.price,
        discount: faker.number.float({ min: 0, max: 20 }),
        tax: faker.number.float({ min: 0, max: 10 }),
        total: 0
      });
    }

    items.forEach(item => {
      item.total = (item.quantity * item.price) - item.discount + item.tax;
    });

    dataStore.salesOrders.push({
      id: `order-${i}`,
      orderNumber: `SO-${String(i).padStart(6, '0')}`,
      companyId: `company-${faker.number.int({ min: 1, max: 5 })}`,
      warehouseId: `warehouse-${faker.number.int({ min: 1, max: 10 })}`,
      customerId: `customer-${faker.number.int({ min: 1, max: 50 })}`,
      status: faker.helpers.arrayElement([
        'pending', 'confirmed', 'allocated', 'picking',
        'packing', 'shipped', 'delivered', 'cancelled'
      ]),
      priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
      items,
      subtotal: items.reduce((sum, item) => sum + item.total, 0),
      shipping: faker.number.float({ min: 0, max: 50 }),
      tax: faker.number.float({ min: 0, max: 100 }),
      discount: faker.number.float({ min: 0, max: 100 }),
      total: 0,
      paymentStatus: faker.helpers.arrayElement(['pending', 'paid', 'partial', 'refunded']),
      paymentMethod: faker.helpers.arrayElement(['credit_card', 'paypal', 'bank_transfer', 'cash']),
      shippingMethod: faker.helpers.arrayElement(['standard', 'express', 'overnight']),
      carrier: faker.helpers.arrayElement(['ups', 'fedex', 'usps', 'dhl']),
      trackingNumber: faker.string.alphanumeric(20).toUpperCase(),
      notes: faker.lorem.sentence(),
      orderDate: faker.date.recent({ days: 30 }).toISOString(),
      expectedDelivery: faker.date.future({ days: 7 }).toISOString(),
      createdAt: faker.date.past().toISOString()
    });
  }

  // Calculate totals for orders
  dataStore.salesOrders.forEach(order => {
    order.total = order.subtotal + order.shipping + order.tax - order.discount;
  });

  console.log('Mock data initialized successfully');
};

// Initialize data on server start
initializeData();

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Kiaan WMS API'
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = dataStore.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, companyId } = req.body;

  if (dataStore.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: `user-${uuidv4()}`,
    email,
    password: hashedPassword,
    name,
    role: role || 'warehouse_staff',
    companyId,
    status: 'active',
    permissions: [],
    createdAt: new Date().toISOString()
  };

  dataStore.users.push(user);
  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    token,
    user: userWithoutPassword
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Dashboard stats
app.get('/api/dashboard/stats', verifyToken, (req, res) => {
  const stats = {
    totalOrders: dataStore.salesOrders.length,
    ordersToday: dataStore.salesOrders.filter(o =>
      new Date(o.orderDate).toDateString() === new Date().toDateString()
    ).length,
    pendingOrders: dataStore.salesOrders.filter(o => o.status === 'pending').length,
    shippedOrders: dataStore.salesOrders.filter(o => o.status === 'shipped').length,

    totalProducts: dataStore.products.length,
    activeProducts: dataStore.products.filter(p => p.status === 'active').length,
    lowStockProducts: dataStore.inventory.filter(i => i.quantity < 20).length,
    outOfStockProducts: dataStore.inventory.filter(i => i.quantity === 0).length,

    totalInventoryValue: dataStore.inventory.reduce((sum, inv) => {
      const product = dataStore.products.find(p => p.id === inv.productId);
      return sum + (product ? inv.quantity * product.pricing.cost : 0);
    }, 0),

    totalWarehouses: dataStore.warehouses.length,
    activeWarehouses: dataStore.warehouses.filter(w => w.status === 'active').length,
    warehouseUtilization: dataStore.warehouses.reduce((sum, w) =>
      sum + (w.capacity.used / w.capacity.total * 100), 0
    ) / dataStore.warehouses.length,

    recentOrders: dataStore.salesOrders.slice(-5),
    lowStockAlerts: dataStore.inventory
      .filter(i => i.quantity < 20)
      .slice(0, 5)
      .map(inv => ({
        ...inv,
        product: dataStore.products.find(p => p.id === inv.productId)
      })),

    ordersByStatus: {
      pending: dataStore.salesOrders.filter(o => o.status === 'pending').length,
      confirmed: dataStore.salesOrders.filter(o => o.status === 'confirmed').length,
      picking: dataStore.salesOrders.filter(o => o.status === 'picking').length,
      packing: dataStore.salesOrders.filter(o => o.status === 'packing').length,
      shipped: dataStore.salesOrders.filter(o => o.status === 'shipped').length,
      delivered: dataStore.salesOrders.filter(o => o.status === 'delivered').length
    },

    topSellingProducts: dataStore.products.slice(0, 5),

    monthlyRevenue: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      revenue: faker.number.int({ min: 100000, max: 500000 })
    })),

    inventoryByCategory: dataStore.categories.map(cat => ({
      category: cat.name,
      value: dataStore.products.filter(p => p.categoryId === cat.id).length *
        faker.number.int({ min: 100, max: 1000 })
    }))
  };

  res.json(stats);
});

// CRUD endpoints for all entities

// Companies
app.get('/api/companies', verifyToken, (req, res) => {
  res.json(dataStore.companies);
});

app.get('/api/companies/:id', verifyToken, (req, res) => {
  const company = dataStore.companies.find(c => c.id === req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json(company);
});

app.post('/api/companies', verifyToken, (req, res) => {
  const company = {
    id: `company-${uuidv4()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  dataStore.companies.push(company);
  res.status(201).json(company);
});

app.put('/api/companies/:id', verifyToken, (req, res) => {
  const index = dataStore.companies.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Company not found' });

  dataStore.companies[index] = {
    ...dataStore.companies[index],
    ...req.body,
    id: req.params.id
  };
  res.json(dataStore.companies[index]);
});

app.delete('/api/companies/:id', verifyToken, (req, res) => {
  const index = dataStore.companies.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Company not found' });

  dataStore.companies.splice(index, 1);
  res.status(204).send();
});

// Warehouses
app.get('/api/warehouses', verifyToken, (req, res) => {
  res.json(dataStore.warehouses);
});

app.get('/api/warehouses/:id', verifyToken, (req, res) => {
  const warehouse = dataStore.warehouses.find(w => w.id === req.params.id);
  if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
  res.json(warehouse);
});

app.post('/api/warehouses', verifyToken, (req, res) => {
  const warehouse = {
    id: `warehouse-${uuidv4()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  dataStore.warehouses.push(warehouse);
  res.status(201).json(warehouse);
});

app.put('/api/warehouses/:id', verifyToken, (req, res) => {
  const index = dataStore.warehouses.findIndex(w => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Warehouse not found' });

  dataStore.warehouses[index] = {
    ...dataStore.warehouses[index],
    ...req.body,
    id: req.params.id
  };
  res.json(dataStore.warehouses[index]);
});

app.delete('/api/warehouses/:id', verifyToken, (req, res) => {
  const index = dataStore.warehouses.findIndex(w => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Warehouse not found' });

  dataStore.warehouses.splice(index, 1);
  res.status(204).send();
});

// Products
app.get('/api/products', verifyToken, (req, res) => {
  const { page = 1, limit = 20, search, category, status } = req.query;

  let filtered = [...dataStore.products];

  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (category) {
    filtered = filtered.filter(p => p.categoryId === category);
  }

  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);

  res.json({
    data: filtered.slice(startIndex, endIndex),
    total: filtered.length,
    page: parseInt(page),
    totalPages: Math.ceil(filtered.length / limit)
  });
});

app.get('/api/products/:id', verifyToken, (req, res) => {
  const product = dataStore.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/products', verifyToken, (req, res) => {
  const product = {
    id: `product-${uuidv4()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  dataStore.products.push(product);
  res.status(201).json(product);
});

app.put('/api/products/:id', verifyToken, (req, res) => {
  const index = dataStore.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  dataStore.products[index] = {
    ...dataStore.products[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  res.json(dataStore.products[index]);
});

app.delete('/api/products/:id', verifyToken, (req, res) => {
  const index = dataStore.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  dataStore.products.splice(index, 1);
  res.status(204).send();
});

// Inventory
app.get('/api/inventory', verifyToken, (req, res) => {
  const { warehouseId, productId } = req.query;

  let filtered = [...dataStore.inventory];

  if (warehouseId) {
    filtered = filtered.filter(i => i.warehouseId === warehouseId);
  }

  if (productId) {
    filtered = filtered.filter(i => i.productId === productId);
  }

  // Add product details
  const inventoryWithProducts = filtered.map(inv => ({
    ...inv,
    product: dataStore.products.find(p => p.id === inv.productId)
  }));

  res.json(inventoryWithProducts);
});

app.post('/api/inventory/adjust', verifyToken, (req, res) => {
  const { productId, warehouseId, adjustment, reason } = req.body;

  const inventory = dataStore.inventory.find(i =>
    i.productId === productId && i.warehouseId === warehouseId
  );

  if (!inventory) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  inventory.quantity += adjustment;
  inventory.available = Math.max(0, inventory.quantity - inventory.reserved);

  // Log activity
  dataStore.activities.push({
    id: `activity-${uuidv4()}`,
    type: 'inventory_adjustment',
    entityId: inventory.id,
    entityType: 'inventory',
    description: `Adjusted inventory by ${adjustment} units. Reason: ${reason}`,
    userId: req.user.id,
    timestamp: new Date().toISOString()
  });

  res.json(inventory);
});

// Sales Orders
app.get('/api/sales-orders', verifyToken, (req, res) => {
  const { page = 1, limit = 20, status, customerId } = req.query;

  let filtered = [...dataStore.salesOrders];

  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }

  if (customerId) {
    filtered = filtered.filter(o => o.customerId === customerId);
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);

  res.json({
    data: filtered.slice(startIndex, endIndex),
    total: filtered.length,
    page: parseInt(page),
    totalPages: Math.ceil(filtered.length / limit)
  });
});

app.get('/api/sales-orders/:id', verifyToken, (req, res) => {
  const order = dataStore.salesOrders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/sales-orders', verifyToken, (req, res) => {
  const orderNumber = `SO-${String(dataStore.salesOrders.length + 1).padStart(6, '0')}`;
  const order = {
    id: `order-${uuidv4()}`,
    orderNumber,
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // Calculate totals
  order.subtotal = order.items.reduce((sum, item) => sum + item.total, 0);
  order.total = order.subtotal + (order.shipping || 0) + (order.tax || 0) - (order.discount || 0);

  dataStore.salesOrders.push(order);
  res.status(201).json(order);
});

app.put('/api/sales-orders/:id', verifyToken, (req, res) => {
  const index = dataStore.salesOrders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  dataStore.salesOrders[index] = {
    ...dataStore.salesOrders[index],
    ...req.body,
    id: req.params.id
  };
  res.json(dataStore.salesOrders[index]);
});

app.delete('/api/sales-orders/:id', verifyToken, (req, res) => {
  const index = dataStore.salesOrders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  dataStore.salesOrders.splice(index, 1);
  res.status(204).send();
});

// Purchase Orders
app.get('/api/purchase-orders', verifyToken, (req, res) => {
  res.json(dataStore.purchaseOrders);
});

app.post('/api/purchase-orders', verifyToken, (req, res) => {
  const purchaseOrder = {
    id: `po-${uuidv4()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  dataStore.purchaseOrders.push(purchaseOrder);
  res.status(201).json(purchaseOrder);
});

// Shipments
app.get('/api/shipments', verifyToken, (req, res) => {
  res.json(dataStore.shipments);
});

app.post('/api/shipments', verifyToken, (req, res) => {
  const shipment = {
    id: `shipment-${uuidv4()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  dataStore.shipments.push(shipment);
  res.status(201).json(shipment);
});

// Returns
app.get('/api/returns', verifyToken, (req, res) => {
  res.json(dataStore.returns);
});

app.post('/api/returns', verifyToken, (req, res) => {
  const returnOrder = {
    id: `return-${uuidv4()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  dataStore.returns.push(returnOrder);
  res.status(201).json(returnOrder);
});

// Users
app.get('/api/users', verifyToken, (req, res) => {
  const users = dataStore.users.map(u => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
  res.json(users);
});

app.get('/api/users/:id', verifyToken, (req, res) => {
  const user = dataStore.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Reports
app.get('/api/reports/inventory', verifyToken, (req, res) => {
  const report = {
    totalProducts: dataStore.products.length,
    totalValue: dataStore.inventory.reduce((sum, inv) => {
      const product = dataStore.products.find(p => p.id === inv.productId);
      return sum + (product ? inv.quantity * product.pricing.cost : 0);
    }, 0),
    byWarehouse: dataStore.warehouses.map(w => ({
      warehouse: w.name,
      items: dataStore.inventory.filter(i => i.warehouseId === w.id).length,
      value: dataStore.inventory
        .filter(i => i.warehouseId === w.id)
        .reduce((sum, inv) => {
          const product = dataStore.products.find(p => p.id === inv.productId);
          return sum + (product ? inv.quantity * product.pricing.cost : 0);
        }, 0)
    }))
  };
  res.json(report);
});

// Notifications
app.get('/api/notifications', verifyToken, (req, res) => {
  res.json(dataStore.notifications);
});

// Categories
app.get('/api/categories', verifyToken, (req, res) => {
  res.json(dataStore.categories);
});

// Customers
app.get('/api/customers', verifyToken, (req, res) => {
  res.json(dataStore.customers);
});

app.post('/api/customers', verifyToken, (req, res) => {
  const customer = {
    id: `customer-${uuidv4()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  dataStore.customers.push(customer);
  res.status(201).json(customer);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`WMS Backend API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: https://wms.alexandratechlab.com`);
  console.log(`API available at: http://localhost:${PORT}/api`);
});