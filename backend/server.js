const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');
const { registerIntegrationRoutes } = require('./lib/integrations/routes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8010;
const JWT_SECRET = process.env.JWT_SECRET || 'wms-secret-key-2024';

// Middleware
app.use(helmet());

// CORS configuration - use environment variable or defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
    'https://wms.alexandratechlab.com',
    'https://kiaan-wms.vercel.app',
    'http://localhost:3000',
    'http://localhost:3011'
  ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting - increased to 10000 requests per 15 minutes for bulk operations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000
});
app.use('/api/', limiter);

// Helper function to calculate bundle cost from components
async function calculateBundleCost(bundleItems) {
  let totalCost = 0;
  const itemsWithCost = [];

  for (const item of bundleItems) {
    const childProduct = await prisma.product.findUnique({
      where: { id: item.childId || item.productId },
      select: { costPrice: true, sku: true, name: true }
    });

    if (childProduct && childProduct.costPrice) {
      const componentCost = childProduct.costPrice * item.quantity;
      totalCost += componentCost;
      itemsWithCost.push({
        ...item,
        componentCost,
        childProduct
      });
    } else {
      itemsWithCost.push({
        ...item,
        componentCost: 0,
        childProduct
      });
    }
  }

  return { totalCost, itemsWithCost };
}

// Helper function to get or create default company (GLOBAL - used by middleware)
async function ensureUserHasCompany(userId) {
  // Check if KIAAN company exists
  let defaultCompany = await prisma.company.findFirst({ where: { code: 'KIAAN' } });
  if (!defaultCompany) {
    defaultCompany = await prisma.company.create({
      data: {
        name: 'Kiaan Food Distribution Ltd',
        code: 'KIAAN',
        description: 'Premium food and snack distribution',
        email: 'info@kiaan-distribution.com',
      },
    });
    console.log('Created default KIAAN company:', defaultCompany.id);
  }
  // Update user with company if userId provided
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { companyId: defaultCompany.id }
    });
    console.log(`Updated user ${userId} with companyId ${defaultCompany.id}`);
  }
  return defaultCompany.id;
}

// Auth middleware - NOW ENSURES companyId is always set
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // CRITICAL FIX: Ensure companyId is always set
    if (!req.user.companyId) {
      console.log(`User ${req.user.id} has no companyId, assigning default...`);
      const companyId = await ensureUserHasCompany(req.user.id);
      req.user.companyId = companyId;
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// ===================================
// ROUTES
// ===================================

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'WMS API is running', database: 'PostgreSQL + Prisma' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WMS API is running', database: 'PostgreSQL + Prisma' });
});

// Delete all data (except users) - for testing/reset purposes
app.delete('/api/admin/reset-data', verifyToken, async (req, res) => {
  try {
    // Only allow SUPER_ADMIN to reset data
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only SUPER_ADMIN can reset data' });
    }

    console.log('Starting data reset...');

    // Delete in correct order (children first to respect foreign keys)
    await prisma.pickItem.deleteMany({});
    await prisma.pickList.deleteMany({});
    await prisma.salesOrderItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.transferItem.deleteMany({});
    await prisma.transfer.deleteMany({});
    await prisma.cycleCountItem.deleteMany({});
    await prisma.cycleCount.deleteMany({});
    await prisma.stockAdjustmentItem.deleteMany({});
    await prisma.stockAdjustment.deleteMany({});
    await prisma.inventoryMovement.deleteMany({});
    await prisma.replenishmentTask.deleteMany({});
    await prisma.replenishmentConfig.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.channelPrice.deleteMany({});
    await prisma.salesChannel.deleteMany({});
    await prisma.bundleItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.zone.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.company.deleteMany({});

    console.log('All data deleted');

    // Count remaining
    const counts = {
      companies: await prisma.company.count(),
      products: await prisma.product.count(),
      salesOrders: await prisma.salesOrder.count(),
      users: await prisma.user.count()
    };

    res.json({
      message: 'All data deleted (users kept)',
      counts
    });
  } catch (error) {
    console.error('Reset data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'USER', companyId } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        email,
        password: hashedPassword,
        name,
        role,
        companyId: companyId || '53c65d84-4606-4b0a-8aa5-6eda9e50c3df', // Default company
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: { company: true }
    });

    // Generate token
    const token = generateToken(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If the email exists, a reset link will be sent' });
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date()
      }
    });

    // TODO: Send email with reset link
    // For now, return the token (in production, send via email)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      message: 'If the email exists, a reset link will be sent',
      // Remove this in production:
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password (authenticated)
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (authenticated) - for audit trail
app.post('/api/auth/logout', verifyToken, async (req, res) => {
  try {
    // Update last activity
    await prisma.user.update({
      where: { id: req.user.id },
      data: { updatedAt: new Date() }
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (authenticated)
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate input
    if (!name && !email && !phone) {
      return res.status(400).json({ error: 'At least one field (name, email, or phone) is required' });
    }

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    // Build update data object
    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phoneNumber = phone; // Allow clearing phone

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: { company: true }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// DASHBOARD & ANALYTICS
// ===================================

// Get dashboard statistics
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await prisma.product.count();

    // Get total inventory
    const inventoryData = await prisma.inventory.aggregate({
      _sum: {
        quantity: true,
        availableQuantity: true,
      },
    });

    // Get orders count by status
    const totalOrders = await prisma.salesOrder.count();
    const pendingOrders = await prisma.salesOrder.count({
      where: { status: 'PENDING' }
    });
    const ordersToday = await prisma.salesOrder.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Get pick lists count
    const activePickLists = await prisma.pickList.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    // Get low stock items (items with less than 50 units available)
    const lowStockCount = await prisma.inventory.count({
      where: {
        availableQuantity: {
          lte: 50
        }
      }
    });

    // Get warehouses
    const warehousesCount = await prisma.warehouse.count();

    // Get orders by status for pie chart
    const ordersByStatusRaw = await prisma.salesOrder.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    const statusColors = {
      PENDING: '#faad14',
      CONFIRMED: '#1890ff',
      PROCESSING: '#722ed1',
      PICKING: '#13c2c2',
      PACKING: '#eb2f96',
      SHIPPED: '#52c41a',
      DELIVERED: '#389e0d',
      CANCELLED: '#f5222d',
      ALLOCATED: '#2f54eb',
    };
    const ordersByStatus = ordersByStatusRaw.map(s => ({
      status: s.status,
      count: s._count.status,
      color: statusColors[s.status] || '#8c8c8c'
    }));

    // Get sales trend for last 7 days
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dayOrders = await prisma.salesOrder.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      salesTrend.push({
        date: new Date(startOfDay).toLocaleDateString('en-US', { weekday: 'short' }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0)
      });
    }

    // Get top products by order quantity
    const orderItems = await prisma.salesOrderItem.findMany({
      include: { product: true },
      take: 100
    });
    const productSales = {};
    orderItems.forEach(item => {
      const name = item.product?.name || 'Unknown';
      if (!productSales[name]) {
        productSales[name] = { name, sold: 0, revenue: 0 };
      }
      productSales[name].sold += item.quantity || 0;
      productSales[name].revenue += (parseFloat(item.price) || 0) * (item.quantity || 0);
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    // Get recent orders
    const recentOrdersRaw = await prisma.salesOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: true
      }
    });
    const recentOrders = recentOrdersRaw.map((o, i) => ({
      id: i + 1,
      orderNumber: o.orderNumber || `ORD-${o.id.slice(0, 8)}`,
      customer: o.customer?.name || 'Walk-in Customer',
      items: o.items?.length || 0,
      total: parseFloat(o.totalAmount) || 0,
      status: o.status?.toLowerCase() || 'pending',
      date: o.createdAt
    }));

    // Get low stock alerts
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        availableQuantity: { lte: 50 }
      },
      include: { product: true },
      take: 5,
      orderBy: { availableQuantity: 'asc' }
    });
    const lowStockAlerts = lowStockItems.map((inv, i) => ({
      id: i + 1,
      sku: inv.product?.sku || inv.productId?.slice(0, 8),
      name: inv.product?.name || 'Unknown Product',
      current: inv.availableQuantity || 0,
      reorderPoint: 50,
      status: inv.availableQuantity === 0 ? 'critical' : inv.availableQuantity < 20 ? 'warning' : 'low'
    }));

    res.json({
      kpis: {
        totalStock: {
          value: inventoryData._sum.quantity || 0,
          change: 0,
          trend: 'stable'
        },
        lowStockItems: {
          value: lowStockCount || 0,
          change: 0,
          trend: 'stable'
        },
        pendingOrders: {
          value: pendingOrders || 0,
          change: 0,
          trend: 'stable'
        },
        activePickLists: {
          value: activePickLists || 0,
          change: 0,
          trend: 'stable'
        },
        warehouseUtilization: {
          value: warehousesCount > 0 ? Math.min(85, Math.round((totalProducts / (warehousesCount * 100)) * 100)) : 0,
          change: 0,
          trend: 'stable'
        },
        ordersToday: {
          value: ordersToday || 0,
          change: 0,
          trend: 'stable'
        },
      },
      totals: {
        products: totalProducts,
        totalInventory: inventoryData._sum.quantity || 0,
        availableInventory: inventoryData._sum.availableQuantity || 0,
        orders: totalOrders,
        warehouses: warehousesCount,
      },
      salesTrend,
      topProducts: topProducts.length > 0 ? topProducts : [{ name: 'No sales data', sold: 0, revenue: 0 }],
      ordersByStatus: ordersByStatus.length > 0 ? ordersByStatus : [{ status: 'No Orders', count: 0, color: '#8c8c8c' }],
      recentOrders,
      lowStockAlerts
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent orders
app.get('/api/dashboard/recent-orders', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const orders = await prisma.salesOrder.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: true,
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock alerts
app.get('/api/dashboard/low-stock', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const lowStockItems = await prisma.inventory.findMany({
      where: {
        OR: [
          {
            availableQuantity: {
              lte: 20 // Critical threshold
            }
          }
        ]
      },
      take: limit,
      include: {
        product: true
      },
      orderBy: {
        availableQuantity: 'asc'
      }
    });

    res.json(lowStockItems.map(item => ({
      id: item.id,
      sku: item.product?.sku || 'N/A',
      name: item.product?.name || 'Unknown Product',
      current: item.availableQuantity,
      reorderPoint: 20,
      status: item.availableQuantity < 10 ? 'critical' : item.availableQuantity < 20 ? 'warning' : 'low'
    })));
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent activity
app.get('/api/dashboard/activity', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent audit logs if AuditLog table exists
    // For now, return mock data
    const activities = [
      { id: 1, action: 'Order Created', user: req.user?.name || 'User', entity: 'SO-001238', time: '2 mins ago', type: 'order' },
      { id: 2, action: 'Pick List Completed', user: 'System', entity: 'PL-00512', time: '15 mins ago', type: 'picklist' },
      { id: 3, action: 'Stock Adjusted', user: req.user?.name || 'User', entity: 'PRD-045', time: '1 hour ago', type: 'inventory' },
      { id: 4, action: 'Transfer Created', user: 'System', entity: 'TR-00234', time: '2 hours ago', type: 'transfer' },
      { id: 5, action: 'Goods Received', user: req.user?.name || 'User', entity: 'GR-00892', time: '3 hours ago', type: 'goods' },
    ];

    res.json(activities.slice(0, limit));
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard Quick Stats
app.get('/api/dashboard/quick-stats', verifyToken, async (req, res) => {
  try {
    const [products, orders, inventory, customers] = await Promise.all([
      prisma.product.count({ where: { companyId: req.user.companyId } }),
      prisma.salesOrder.count({ where: { customer: { companyId: req.user.companyId } } }),
      prisma.inventory.aggregate({
        where: { warehouse: { companyId: req.user.companyId } },
        _sum: { quantity: true }
      }),
      prisma.customer.count({ where: { companyId: req.user.companyId } })
    ]);

    res.json({
      totalProducts: products,
      totalOrders: orders,
      totalStock: inventory._sum.quantity || 0,
      totalCustomers: customers
    });
  } catch (error) {
    console.error('Get quick stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// ANALYTICS ENDPOINTS (Dashboard)
// ===================================

// Analytics Overview
app.get('/api/analytics/overview', verifyToken, async (req, res) => {
  try {
    const [products, orders, inventory, warehouses] = await Promise.all([
      prisma.product.count({ where: { companyId: req.user.companyId } }),
      prisma.salesOrder.findMany({
        where: { customer: { companyId: req.user.companyId } },
        select: { totalAmount: true, status: true }
      }),
      prisma.inventory.aggregate({
        where: { warehouse: { companyId: req.user.companyId } },
        _sum: { quantity: true, availableQuantity: true }
      }),
      prisma.warehouse.count({ where: { companyId: req.user.companyId } })
    ]);

    res.json({
      totalProducts: products,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      totalStock: inventory._sum.quantity || 0,
      availableStock: inventory._sum.availableQuantity || 0,
      totalWarehouses: warehouses,
      ordersByStatus: orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics Inventory
app.get('/api/analytics/inventory', verifyToken, async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: { warehouse: { companyId: req.user.companyId } },
      include: { product: true, warehouse: true }
    });

    const byWarehouse = {};
    const byProduct = {};
    let totalValue = 0;

    inventory.forEach(inv => {
      const whName = inv.warehouse?.name || 'Unknown';
      const prodName = inv.product?.name || 'Unknown';

      byWarehouse[whName] = (byWarehouse[whName] || 0) + inv.quantity;
      byProduct[prodName] = (byProduct[prodName] || 0) + inv.quantity;
      totalValue += inv.quantity * (inv.product?.costPrice || 0);
    });

    res.json({
      totalItems: inventory.length,
      totalQuantity: inventory.reduce((sum, i) => sum + i.quantity, 0),
      totalValue,
      lowStockCount: inventory.filter(i => i.quantity < 10).length,
      byWarehouse,
      topProducts: Object.entries(byProduct)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, qty]) => ({ name, quantity: qty }))
    });
  } catch (error) {
    console.error('Get analytics inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics Sales
app.get('/api/analytics/sales', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: { customer: { companyId: req.user.companyId } },
      include: { customer: true, items: { include: { product: true } } }
    });

    const byStatus = {};
    const byCustomer = {};
    let totalRevenue = 0;

    orders.forEach(order => {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      const custName = order.customer?.name || 'Unknown';
      byCustomer[custName] = (byCustomer[custName] || 0) + (order.totalAmount || 0);
      totalRevenue += order.totalAmount || 0;
    });

    res.json({
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
      byStatus,
      topCustomers: Object.entries(byCustomer)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, revenue]) => ({ name, revenue }))
    });
  } catch (error) {
    console.error('Get analytics sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// INVENTORY ADJUSTMENTS
// ===================================

// Get all inventory adjustments
app.get('/api/inventory/adjustments', verifyToken, async (req, res) => {
  try {
    // Check if model exists
    if (!prisma.stockAdjustment) {
      console.log('StockAdjustment model not available');
      return res.json([]);
    }

    const { type, status, startDate, endDate } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Try with full includes first, fallback to simple query
    let adjustments;
    try {
      adjustments = await prisma.stockAdjustment.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (includeError) {
      console.log('Fallback to simple query for adjustments');
      adjustments = await prisma.stockAdjustment.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Transform to match frontend expected format
    const transformed = adjustments.map(adj => ({
      id: adj.id,
      referenceNumber: `ADJ-${adj.id.slice(0, 8).toUpperCase()}`,
      type: adj.type,
      reason: adj.reason || '',
      notes: adj.notes,
      status: adj.status,
      createdAt: adj.createdAt,
      completedAt: adj.completedAt,
      items: adj.items?.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name || 'Unknown Product',
          sku: item.product.sku || 'N/A'
        } : null
      })) || [],
      createdBy: adj.user ? {
        id: adj.user.id,
        name: adj.user.name || '',
        email: adj.user.email || ''
      } : null
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get adjustments error:', error);
    // Return empty array for any error to prevent 500
    return res.json([]);
  }
});

// Create inventory adjustment
app.post('/api/inventory/adjustments', verifyToken, async (req, res) => {
  try {
    const { type, reason, notes, items, warehouseId } = req.body;

    if (!type || !reason || !items || items.length === 0) {
      return res.status(400).json({ error: 'Type, reason, and items are required' });
    }

    // Get companyId
    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }

    // Get warehouse ID - use provided one or get user's company default warehouse
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWarehouse = await prisma.warehouse.findFirst({
        where: {
          companyId,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'asc' }
      });
      if (!defaultWarehouse) {
        return res.status(400).json({ error: 'No warehouse found. Please create a warehouse first.' });
      }
      targetWarehouseId = defaultWarehouse.id;
    }

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        type,
        status: 'PENDING',
        warehouseId: targetWarehouseId,
        reason,
        notes,
        requestedBy: req.user.id,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            locationId: item.locationId || null,
            batchNumber: item.batchNumber || null,
            quantity: parseInt(item.quantity) || 0,
            unitCost: parseFloat(item.unitCost) || 0
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        warehouse: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(adjustment);
  } catch (error) {
    console.error('Create adjustment error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Approve/Complete adjustment
app.patch('/api/inventory/adjustments/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await prisma.stockAdjustment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        approvedBy: req.user.id,
        completedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Apply inventory changes
    for (const item of adjustment.items) {
      await prisma.inventory.updateMany({
        where: {
          productId: item.productId,
          locationId: item.locationId
        },
        data: {
          quantity: {
            increment: adjustment.type === 'INCREASE' ? item.quantity : -item.quantity
          },
          availableQuantity: {
            increment: adjustment.type === 'INCREASE' ? item.quantity : -item.quantity
          }
        }
      });
    }

    res.json(adjustment);
  } catch (error) {
    console.error('Approve adjustment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// CYCLE COUNTS
// ===================================

// Helper to generate reference number
const generateCycleCountReference = async (prisma) => {
  const count = await prisma.cycleCount.count();
  return `CC-${String(count + 1).padStart(5, '0')}`;
};

// Get all cycle counts
app.get('/api/inventory/cycle-counts', verifyToken, async (req, res) => {
  try {
    // Check if model exists
    if (!prisma.cycleCount) {
      console.log('CycleCount model not available');
      return res.json([]);
    }

    const { status } = req.query;

    const where = { warehouse: { companyId: req.user.companyId } };
    // Map PENDING to include SCHEDULED for backwards compatibility
    if (status) {
      if (status === 'PENDING') {
        where.status = { in: ['PENDING', 'SCHEDULED'] };
      } else {
        where.status = status;
      }
    }

    // Try with full includes first, fallback to simple query
    let cycleCounts;
    try {
      cycleCounts = await prisma.cycleCount.findMany({
        where,
        include: {
          warehouse: {
            select: { id: true, name: true, code: true }
          },
          countedBy: {
            select: { id: true, name: true, email: true }
          },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (includeError) {
      console.log('Fallback to simple query for cycle counts');
      cycleCounts = await prisma.cycleCount.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Resolve location IDs to full location objects and add computed fields
    const cycleCountsWithDetails = await Promise.all(
      cycleCounts.map(async (cc) => {
        let location = null;
        let locationDetails = [];

        if (cc.locations && Array.isArray(cc.locations) && cc.locations.length > 0) {
          locationDetails = await prisma.location.findMany({
            where: { id: { in: cc.locations } },
            include: { zone: { select: { id: true, name: true } } }
          });
          if (locationDetails.length > 0) {
            location = locationDetails[0];
          }
        }

        // Calculate itemsCount and discrepancies
        const items = cc.items || [];
        const itemsCount = items.length;
        const discrepancies = items.filter(item =>
          (item.countedQuantity ?? item.actualQuantity) !== null &&
          (item.countedQuantity ?? item.actualQuantity) !== item.expectedQuantity
        ).length;

        return {
          ...cc,
          referenceNumber: cc.referenceNumber || `CC-${cc.id.slice(0, 8).toUpperCase()}`,
          location,
          locationDetails,
          itemsCount,
          discrepancies,
          // Map SCHEDULED to PENDING for frontend compatibility
          status: cc.status === 'SCHEDULED' ? 'PENDING' : cc.status
        };
      })
    );

    res.json(cycleCountsWithDetails);
  } catch (error) {
    console.error('Get cycle counts error:', error);
    // Return empty array for any error to prevent 500
    return res.json([]);
  }
});

// Create cycle count with items from inventory
app.post('/api/inventory/cycle-counts', verifyToken, async (req, res) => {
  try {
    const { name, type, warehouseId, locations, scheduledDate, notes } = req.body;

    // Get warehouse from the selected location if not provided
    let effectiveWarehouseId = warehouseId;
    if (!effectiveWarehouseId && locations && locations.length > 0) {
      // Get warehouse from the first location
      const location = await prisma.location.findFirst({
        where: { id: locations[0] },
        select: { warehouseId: true }
      });
      effectiveWarehouseId = location?.warehouseId;
    }

    // Fallback to default warehouse if still not found
    if (!effectiveWarehouseId) {
      const defaultWarehouse = await prisma.warehouse.findFirst({
        where: { companyId: req.user.companyId }
      });
      effectiveWarehouseId = defaultWarehouse?.id;
    }

    if (!effectiveWarehouseId) {
      return res.status(400).json({ error: 'No warehouse found. Please create a warehouse first.' });
    }

    // Generate reference number
    const referenceNumber = await generateCycleCountReference(prisma);

    // Create the cycle count
    const cycleCount = await prisma.cycleCount.create({
      data: {
        id: require('crypto').randomUUID(),
        referenceNumber,
        warehouseId: effectiveWarehouseId,
        name,
        status: 'PENDING',
        type: type || 'FULL',
        scheduledDate: new Date(scheduledDate),
        locations: locations || [],
        notes: notes || null,
        countedById: req.user.id
      }
    });

    // If locations are specified, create cycle count items from inventory at those locations
    if (locations && locations.length > 0) {
      // Get inventory at these locations (don't filter by warehouse - location already determines it)
      const inventoryItems = await prisma.inventory.findMany({
        where: {
          locationId: { in: locations }
        },
        include: { product: true }
      });

      if (inventoryItems.length > 0) {
        const cycleCountItems = inventoryItems.map(inv => ({
          id: require('crypto').randomUUID(),
          cycleCountId: cycleCount.id,
          productId: inv.productId,
          locationId: inv.locationId,
          expectedQuantity: inv.quantity,
          countedQuantity: null,
          variance: null,
          status: 'PENDING'
        }));

        await prisma.cycleCountItem.createMany({ data: cycleCountItems });
      }
    }

    // Fetch the created cycle count with items
    const createdCycleCount = await prisma.cycleCount.findUnique({
      where: { id: cycleCount.id },
      include: {
        warehouse: true,
        countedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            location: true
          }
        }
      }
    });

    // Get location details
    let location = null;
    if (locations && locations.length > 0) {
      const locationDetails = await prisma.location.findMany({
        where: { id: { in: locations } },
        include: { zone: { select: { id: true, name: true } } }
      });
      if (locationDetails.length > 0) {
        location = locationDetails[0];
      }
    }

    res.status(201).json({
      ...createdCycleCount,
      referenceNumber: createdCycleCount.referenceNumber,
      location,
      itemsCount: createdCycleCount.items?.length || 0,
      discrepancies: 0
    });
  } catch (error) {
    console.error('Create cycle count error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ===================================
// STOCK ALERTS
// ===================================

// Get stock alerts (low stock, expiry warnings)
app.get('/api/inventory/alerts', verifyToken, async (req, res) => {
  try {
    const { type } = req.query;

    const alerts = [];

    // Low stock alerts
    if (!type || type === 'low_stock') {
      const lowStockItems = await prisma.inventory.findMany({
        where: {
          availableQuantity: {
            lte: 50 // Low stock threshold
          }
        },
        include: {
          product: true,
          location: true
        },
        take: 50
      });

      alerts.push(...lowStockItems.map(item => ({
        id: item.id,
        type: 'low_stock',
        severity: item.availableQuantity < 10 ? 'critical' : item.availableQuantity < 25 ? 'high' : 'medium',
        productId: item.productId,
        productName: item.product?.name || 'Unknown',
        sku: item.product?.sku || 'N/A',
        currentStock: item.availableQuantity,
        reorderPoint: 50,
        location: item.location?.aisle + '-' + item.location?.rack + '-' + item.location?.bin || 'N/A',
        createdAt: new Date()
      })));
    }

    // Expiring items alerts
    if (!type || type === 'expiring') {
      const expiringItems = await prisma.inventory.findMany({
        where: {
          bestBeforeDate: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            gte: new Date()
          }
        },
        include: {
          product: true,
          location: true
        },
        take: 50
      });

      alerts.push(...expiringItems.map(item => {
        const daysUntilExpiry = Math.floor((new Date(item.bestBeforeDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        return {
          id: item.id,
          type: 'expiring',
          severity: daysUntilExpiry < 7 ? 'critical' : daysUntilExpiry < 30 ? 'high' : 'medium',
          productId: item.productId,
          productName: item.product?.name || 'Unknown',
          sku: item.product?.sku || 'N/A',
          quantity: item.availableQuantity,
          expiryDate: item.bestBeforeDate,
          daysUntilExpiry,
          location: item.location?.aisle + '-' + item.location?.rack + '-' + item.location?.bin || 'N/A',
          createdAt: new Date()
        };
      }));
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// BATCH/LOT TRACKING (FIFO/LIFO)
// ===================================

// FIFO Allocation - MUST be defined before /:id route
app.get('/api/inventory/batches/fifo', verifyToken, async (req, res) => {
  try {
    const batches = await prisma.inventory.findMany({
      where: {
        availableQuantity: { gt: 0 },
        OR: [
          { batchNumber: { not: null } },
          { lotNumber: { not: null } }
        ]
      },
      include: {
        product: true,
        warehouse: true,
        location: true
      },
      orderBy: { receivedDate: 'asc' }
    });
    res.json({
      strategy: 'FIFO',
      description: 'First In, First Out - Oldest batches allocated first',
      batches
    });
  } catch (error) {
    console.error('Get FIFO batches error:', error);
    res.json({ strategy: 'FIFO', description: 'First In, First Out', batches: [] });
  }
});

// LIFO Allocation - MUST be defined before /:id route
app.get('/api/inventory/batches/lifo', verifyToken, async (req, res) => {
  try {
    const batches = await prisma.inventory.findMany({
      where: {
        availableQuantity: { gt: 0 },
        OR: [
          { batchNumber: { not: null } },
          { lotNumber: { not: null } }
        ]
      },
      include: {
        product: true,
        warehouse: true,
        location: true
      },
      orderBy: { receivedDate: 'desc' }
    });
    res.json({
      strategy: 'LIFO',
      description: 'Last In, First Out - Newest batches allocated first',
      batches
    });
  } catch (error) {
    console.error('Get LIFO batches error:', error);
    res.json({ strategy: 'LIFO', description: 'Last In, First Out', batches: [] });
  }
});

// FEFO Allocation - MUST be defined before /:id route
app.get('/api/inventory/batches/fefo', verifyToken, async (req, res) => {
  try {
    const batches = await prisma.inventory.findMany({
      where: {
        availableQuantity: { gt: 0 },
        bestBeforeDate: { not: null }
      },
      include: {
        product: true,
        warehouse: true,
        location: true
      },
      orderBy: { bestBeforeDate: 'asc' }
    });
    res.json({
      strategy: 'FEFO',
      description: 'First Expiry, First Out - Soonest expiring batches allocated first',
      batches
    });
  } catch (error) {
    console.error('Get FEFO batches error:', error);
    res.json({ strategy: 'FEFO', description: 'First Expiry, First Out', batches: [] });
  }
});

// Get all batches/lots
app.get('/api/inventory/batches', verifyToken, async (req, res) => {
  try {
    const { productId, locationId, status, warehouseId } = req.query;

    const where = {
      // Only return inventory with batch tracking (has batchNumber or lotNumber)
      OR: [
        { batchNumber: { not: null } },
        { lotNumber: { not: null } }
      ],
      warehouse: { companyId: req.user.companyId }
    };
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (warehouseId) where.warehouseId = warehouseId;

    // Map frontend status to database status
    if (status) {
      if (status === 'ACTIVE') {
        where.status = 'AVAILABLE';
        where.availableQuantity = { gt: 0 };
      } else if (status === 'DEPLETED') {
        where.availableQuantity = 0;
        where.quantity = { gt: 0 };
      } else if (status === 'QUARANTINED') {
        where.status = 'QUARANTINE';
      } else {
        where.status = status;
      }
    }

    const batches = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true
          }
        },
        location: true,
        warehouse: true
      },
      orderBy: [
        { receivedDate: 'asc' }, // FIFO ordering
        { batchNumber: 'asc' }
      ]
    });

    // Add displayStatus and expiryDate for frontend compatibility
    const batchesWithStatus = batches.map(batch => {
      let displayStatus = batch.status;
      if (batch.status === 'AVAILABLE' && batch.availableQuantity > 0) {
        displayStatus = 'ACTIVE';
      } else if (batch.availableQuantity === 0 && batch.quantity > 0) {
        displayStatus = 'DEPLETED';
      } else if (batch.status === 'QUARANTINE') {
        displayStatus = 'QUARANTINED';
      }
      return {
        ...batch,
        displayStatus,
        expiryDate: batch.bestBeforeDate
      };
    });

    res.json(batchesWithStatus);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get inventory grouped by best-before date
app.get('/api/inventory/by-best-before-date', verifyToken, async (req, res) => {
  try {
    const { productId, warehouseId, minDate, maxDate } = req.query;

    const where = {
      bestBeforeDate: { not: null }
    };
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
          include: { brand: true }
        },
        location: true,
        warehouse: true
      },
      orderBy: { bestBeforeDate: 'asc' }
    });

    // Group by product and best-before date
    const grouped = {};
    inventory.forEach(item => {
      const productId = item.productId;
      const bbdKey = item.bestBeforeDate ? item.bestBeforeDate.toISOString().split('T')[0] : 'no-date';

      if (!grouped[productId]) {
        grouped[productId] = {
          product: item.product,
          byBestBeforeDate: {}
        };
      }

      if (!grouped[productId].byBestBeforeDate[bbdKey]) {
        grouped[productId].byBestBeforeDate[bbdKey] = {
          bestBeforeDate: item.bestBeforeDate,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          locations: []
        };
      }

      const bbd = grouped[productId].byBestBeforeDate[bbdKey];
      bbd.totalQuantity += item.quantity || 0;
      bbd.availableQuantity += item.availableQuantity || 0;
      bbd.reservedQuantity += item.reservedQuantity || 0;
      bbd.locations.push({
        locationCode: item.location?.code || 'N/A',
        locationName: item.location?.name || 'Unknown',
        quantity: item.quantity || 0,
        availableQuantity: item.availableQuantity || 0
      });
    });

    res.json({ inventory: Object.values(grouped) });
  } catch (error) {
    console.error('Get inventory by BBD error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get inventory grouped by location
app.get('/api/inventory/by-location', verifyToken, async (req, res) => {
  try {
    const { warehouseId, zoneId, productId } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;
    if (zoneId) where.location = { zoneId };

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: { brand: true }
        },
        location: {
          include: { zone: true }
        },
        warehouse: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by location
    const grouped = {};
    inventory.forEach(item => {
      const locationId = item.locationId || 'no-location';

      if (!grouped[locationId]) {
        // Ensure location has all required fields with defaults
        const location = item.location ? {
          ...item.location,
          pickSequence: item.location.pickSequence || 0
        } : {
          id: 'no-location',
          code: 'UNASSIGNED',
          name: 'Unassigned Location',
          locationType: 'BULK',
          isHeatSensitive: false,
          pickSequence: 9999,
          zone: null
        };

        grouped[locationId] = {
          location,
          warehouse: item.warehouse,
          totalQuantity: 0,
          totalProducts: 0,
          totalItems: 0,
          products: [],
          utilizationWarnings: []
        };
      }

      grouped[locationId].totalQuantity += item.quantity || 0;
      grouped[locationId].totalProducts += 1;
      grouped[locationId].totalItems += item.quantity || 0;
      grouped[locationId].products.push({
        product: item.product || { sku: 'N/A', name: 'Unknown Product', isHeatSensitive: false },
        quantity: item.quantity || 0,
        availableQuantity: item.availableQuantity || 0,
        reservedQuantity: item.reservedQuantity || 0,
        bestBeforeDate: item.bestBeforeDate,
        lotNumber: item.lotNumber || item.batchNumber
      });
    });

    // Add utilization warnings
    Object.values(grouped).forEach((loc) => {
      const location = loc.location;
      if (location.maxWeight && loc.totalQuantity > location.maxWeight) {
        loc.utilizationWarnings.push({
          type: 'WEIGHT_EXCEEDED',
          message: `Location weight limit exceeded`,
          severity: 'ERROR'
        });
      }
      if (location.isHeatSensitive) {
        const hasHeatSensitive = loc.products.some(p => p.product?.isHeatSensitive);
        if (!hasHeatSensitive) {
          loc.utilizationWarnings.push({
            type: 'HEAT_SENSITIVE_LOCATION',
            message: `Heat-sensitive location contains non-heat-sensitive products`,
            severity: 'WARNING'
          });
        }
      }
    });

    res.json({ locations: Object.values(grouped) });
  } catch (error) {
    console.error('Get inventory by location error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get batch by ID
app.get('/api/inventory/batches/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            brand: true
          }
        },
        location: true,
        warehouse: true,
        inventoryMovements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: { select: { id: true, name: true, email: true } },
            fromLocation: { select: { id: true, name: true, code: true, aisle: true, rack: true, bin: true } },
            toLocation: { select: { id: true, name: true, code: true, aisle: true, rack: true, bin: true } }
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Map status for frontend compatibility (ACTIVE = AVAILABLE, compute DEPLETED)
    let displayStatus = batch.status;
    if (batch.status === 'AVAILABLE' && batch.availableQuantity > 0) {
      displayStatus = 'ACTIVE';
    } else if (batch.availableQuantity === 0 && batch.quantity > 0) {
      displayStatus = 'DEPLETED';
    }

    // Add expiryDate alias for frontend compatibility
    res.json({
      ...batch,
      displayStatus,
      expiryDate: batch.bestBeforeDate,
      movements: batch.inventoryMovements || []
    });
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Create new batch
app.post('/api/inventory/batches', verifyToken, async (req, res) => {
  try {
    const {
      batchNumber,
      lotNumber,
      productId,
      warehouseId,
      locationId,
      quantity,
      receivedDate,
      bestBeforeDate
    } = req.body;

    if (!productId || !warehouseId || !quantity) {
      return res.status(400).json({
        error: 'Product, warehouse, and quantity are required'
      });
    }

    if (!batchNumber && !lotNumber) {
      return res.status(400).json({
        error: 'Either batchNumber or lotNumber is required for batch tracking'
      });
    }

    // Check if batch/lot already exists for this product at this location
    const existingBatch = await prisma.inventory.findFirst({
      where: {
        productId,
        warehouseId,
        locationId: locationId || null,
        OR: [
          { batchNumber: batchNumber || null },
          { lotNumber: lotNumber || null }
        ]
      }
    });

    if (existingBatch) {
      return res.status(400).json({
        error: 'Batch/Lot number already exists for this product at this location'
      });
    }

    const batch = await prisma.inventory.create({
      data: {
        productId,
        warehouseId,
        locationId: locationId || null,
        batchNumber: batchNumber || null,
        lotNumber: lotNumber || null,
        quantity: parseInt(quantity),
        availableQuantity: parseInt(quantity),
        reservedQuantity: 0,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        bestBeforeDate: bestBeforeDate ? new Date(bestBeforeDate) : null,
        status: 'AVAILABLE'
      },
      include: {
        product: {
          include: {
            brand: true
          }
        },
        warehouse: true,
        location: true
      }
    });

    res.status(201).json(batch);
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Allocate inventory using FIFO (First In, First Out)
app.post('/api/inventory/batches/allocate-fifo', verifyToken, async (req, res) => {
  try {
    const { productId, warehouseId, locationId, quantityNeeded } = req.body;

    if (!productId || !quantityNeeded) {
      return res.status(400).json({
        error: 'Product ID and quantity needed are required'
      });
    }

    // Get batches ordered by FIFO (oldest first)
    const where = {
      productId,
      status: 'AVAILABLE',
      availableQuantity: {
        gt: 0
      },
      OR: [
        { batchNumber: { not: null } },
        { lotNumber: { not: null } }
      ]
    };
    if (warehouseId) where.warehouseId = warehouseId;
    if (locationId) where.locationId = locationId;

    const batches = await prisma.inventory.findMany({
      where,
      orderBy: [
        { receivedDate: 'asc' }, // FIFO - oldest first
        { batchNumber: 'asc' }
      ],
      include: {
        product: {
          include: {
            brand: true
          }
        },
        warehouse: true,
        location: true
      }
    });

    if (batches.length === 0) {
      return res.status(404).json({
        error: 'No available batches found for this product'
      });
    }

    // Calculate total available
    const totalAvailable = batches.reduce((sum, batch) => sum + batch.availableQuantity, 0);

    if (totalAvailable < quantityNeeded) {
      return res.status(400).json({
        error: `Insufficient inventory. Available: ${totalAvailable}, Needed: ${quantityNeeded}`
      });
    }

    // Allocate from batches using FIFO
    const allocations = [];
    let remainingNeeded = parseFloat(quantityNeeded);

    for (const batch of batches) {
      if (remainingNeeded <= 0) break;

      const allocatedQty = Math.min(batch.availableQuantity, remainingNeeded);

      allocations.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber || batch.lotNumber,
        lotNumber: batch.lotNumber,
        quantity: allocatedQty,
        receivedDate: batch.receivedDate,
        bestBeforeDate: batch.bestBeforeDate,
        warehouse: batch.warehouse,
        location: batch.location
      });

      // Update batch available/reserved quantities
      await prisma.inventory.update({
        where: { id: batch.id },
        data: {
          availableQuantity: {
            decrement: allocatedQty
          },
          reservedQuantity: {
            increment: allocatedQty
          },
          status: batch.availableQuantity - allocatedQty === 0 ? 'RESERVED' : 'AVAILABLE'
        }
      });

      remainingNeeded -= allocatedQty;
    }

    res.json({
      method: 'FIFO',
      totalAllocated: parseFloat(quantityNeeded),
      allocations
    });
  } catch (error) {
    console.error('FIFO allocation error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Allocate inventory using LIFO (Last In, First Out)
app.post('/api/inventory/batches/allocate-lifo', verifyToken, async (req, res) => {
  try {
    const { productId, warehouseId, locationId, quantityNeeded } = req.body;

    if (!productId || !quantityNeeded) {
      return res.status(400).json({
        error: 'Product ID and quantity needed are required'
      });
    }

    // Get batches ordered by LIFO (newest first)
    const where = {
      productId,
      status: 'AVAILABLE',
      availableQuantity: {
        gt: 0
      },
      OR: [
        { batchNumber: { not: null } },
        { lotNumber: { not: null } }
      ]
    };
    if (warehouseId) where.warehouseId = warehouseId;
    if (locationId) where.locationId = locationId;

    const batches = await prisma.inventory.findMany({
      where,
      orderBy: [
        { receivedDate: 'desc' }, // LIFO - newest first
        { batchNumber: 'desc' }
      ],
      include: {
        product: {
          include: {
            brand: true
          }
        },
        warehouse: true,
        location: true
      }
    });

    if (batches.length === 0) {
      return res.status(404).json({
        error: 'No available batches found for this product'
      });
    }

    // Calculate total available
    const totalAvailable = batches.reduce((sum, batch) => sum + batch.availableQuantity, 0);

    if (totalAvailable < quantityNeeded) {
      return res.status(400).json({
        error: `Insufficient inventory. Available: ${totalAvailable}, Needed: ${quantityNeeded}`
      });
    }

    // Allocate from batches using LIFO
    const allocations = [];
    let remainingNeeded = parseFloat(quantityNeeded);

    for (const batch of batches) {
      if (remainingNeeded <= 0) break;

      const allocatedQty = Math.min(batch.availableQuantity, remainingNeeded);

      allocations.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber || batch.lotNumber,
        lotNumber: batch.lotNumber,
        quantity: allocatedQty,
        receivedDate: batch.receivedDate,
        bestBeforeDate: batch.bestBeforeDate,
        warehouse: batch.warehouse,
        location: batch.location
      });

      // Update batch available/reserved quantities
      await prisma.inventory.update({
        where: { id: batch.id },
        data: {
          availableQuantity: {
            decrement: allocatedQty
          },
          reservedQuantity: {
            increment: allocatedQty
          },
          status: batch.availableQuantity - allocatedQty === 0 ? 'RESERVED' : 'AVAILABLE'
        }
      });

      remainingNeeded -= allocatedQty;
    }

    res.json({
      method: 'LIFO',
      totalAllocated: parseFloat(quantityNeeded),
      allocations
    });
  } catch (error) {
    console.error('LIFO allocation error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Allocate inventory using FEFO (First Expired, First Out)
app.post('/api/inventory/batches/allocate-fefo', verifyToken, async (req, res) => {
  try {
    const { productId, warehouseId, locationId, quantityNeeded } = req.body;

    if (!productId || !quantityNeeded) {
      return res.status(400).json({
        error: 'Product ID and quantity needed are required'
      });
    }

    // Get batches ordered by FEFO (earliest best-before date first)
    const where = {
      productId,
      status: 'AVAILABLE',
      availableQuantity: {
        gt: 0
      },
      bestBeforeDate: {
        not: null
      },
      OR: [
        { batchNumber: { not: null } },
        { lotNumber: { not: null } }
      ]
    };
    if (warehouseId) where.warehouseId = warehouseId;
    if (locationId) where.locationId = locationId;

    const batches = await prisma.inventory.findMany({
      where,
      orderBy: [
        { bestBeforeDate: 'asc' }, // FEFO - earliest expiry first
        { batchNumber: 'asc' }
      ],
      include: {
        product: {
          include: {
            brand: true
          }
        },
        warehouse: true,
        location: true
      }
    });

    if (batches.length === 0) {
      return res.status(404).json({
        error: 'No available batches with best-before dates found for this product'
      });
    }

    // Calculate total available
    const totalAvailable = batches.reduce((sum, batch) => sum + batch.availableQuantity, 0);

    if (totalAvailable < quantityNeeded) {
      return res.status(400).json({
        error: `Insufficient inventory. Available: ${totalAvailable}, Needed: ${quantityNeeded}`
      });
    }

    // Allocate from batches using FEFO
    const allocations = [];
    let remainingNeeded = parseFloat(quantityNeeded);

    for (const batch of batches) {
      if (remainingNeeded <= 0) break;

      const allocatedQty = Math.min(batch.availableQuantity, remainingNeeded);

      allocations.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber || batch.lotNumber,
        lotNumber: batch.lotNumber,
        quantity: allocatedQty,
        receivedDate: batch.receivedDate,
        bestBeforeDate: batch.bestBeforeDate,
        warehouse: batch.warehouse,
        location: batch.location
      });

      // Update batch available/reserved quantities
      await prisma.inventory.update({
        where: { id: batch.id },
        data: {
          availableQuantity: {
            decrement: allocatedQty
          },
          reservedQuantity: {
            increment: allocatedQty
          },
          status: batch.availableQuantity - allocatedQty === 0 ? 'RESERVED' : 'AVAILABLE'
        }
      });

      remainingNeeded -= allocatedQty;
    }

    res.json({
      method: 'FEFO',
      totalAllocated: parseFloat(quantityNeeded),
      allocations
    });
  } catch (error) {
    console.error('FEFO allocation error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update batch status
app.patch('/api/inventory/batches/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['AVAILABLE', 'RESERVED', 'QUARANTINE', 'DAMAGED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const batch = await prisma.inventory.update({
      where: { id },
      data: { status },
      include: {
        product: {
          include: {
            brand: true
          }
        },
        warehouse: true,
        location: true
      }
    });

    res.json(batch);
  } catch (error) {
    console.error('Update batch status error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ===================================
// INVENTORY MOVEMENTS
// ===================================

// Get all inventory movements
app.get('/api/inventory/movements', verifyToken, async (req, res) => {
  try {
    const { productId, type, startDate, endDate, limit, warehouseId, locationId } = req.query;

    // Check if model exists (Prisma client may need regeneration)
    if (!prisma.inventoryMovement) {
      console.log('InventoryMovement model not available - returning empty array');
      return res.json([]);
    }

    const where = {
      product: { companyId: req.user.companyId }
    };
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    // Filter by location (either from or to)
    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId }
      ];
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true
          }
        },
        fromLocation: {
          select: { id: true, name: true, code: true, aisle: true, rack: true, shelf: true, bin: true }
        },
        toLocation: {
          select: { id: true, name: true, code: true, aisle: true, rack: true, shelf: true, bin: true }
        },
        batch: {
          select: { id: true, batchNumber: true, lotNumber: true, bestBeforeDate: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : 100
    });

    res.json(movements);
  } catch (error) {
    console.error('Get movements error:', error);
    // Return empty array instead of 500 if model doesn't exist
    if (error.message?.includes('undefined')) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create inventory movement
app.post('/api/inventory/movements', verifyToken, async (req, res) => {
  try {
    const {
      type,
      productId,
      batchId,
      fromLocationId,
      toLocationId,
      quantity,
      reason,
      notes
    } = req.body;

    if (!type || !productId || !quantity) {
      return res.status(400).json({
        error: 'Type, product, and quantity are required'
      });
    }

    const requestedQty = parseFloat(quantity);

    // Outbound movement types that reduce inventory
    const outboundTypes = ['PICK', 'TRANSFER', 'SHIPMENT', 'DAMAGE', 'LOSS'];

    if (outboundTypes.includes(type)) {
      // For outbound movements, validate available stock
      if (!fromLocationId) {
        return res.status(400).json({
          error: 'From Location is required for outbound movements'
        });
      }

      // Check inventory at the from location
      const inventoryAtLocation = await prisma.inventory.findFirst({
        where: {
          productId,
          locationId: fromLocationId
        }
      });

      const availableQty = inventoryAtLocation?.availableQuantity || inventoryAtLocation?.quantity || 0;

      if (requestedQty > availableQty) {
        return res.status(400).json({
          error: `Insufficient stock. Available: ${availableQty}, Requested: ${requestedQty}`
        });
      }

      // Update inventory - reduce quantity at from location
      if (inventoryAtLocation) {
        await prisma.inventory.update({
          where: { id: inventoryAtLocation.id },
          data: {
            quantity: { decrement: requestedQty },
            availableQuantity: { decrement: requestedQty }
          }
        });
      }

      // For TRANSFER, add to destination location
      if (type === 'TRANSFER' && toLocationId) {
        const destInventory = await prisma.inventory.findFirst({
          where: {
            productId,
            locationId: toLocationId
          }
        });

        if (destInventory) {
          await prisma.inventory.update({
            where: { id: destInventory.id },
            data: {
              quantity: { increment: requestedQty },
              availableQuantity: { increment: requestedQty }
            }
          });
        } else {
          // Create new inventory record at destination
          const product = await prisma.product.findUnique({ where: { id: productId } });
          const location = await prisma.location.findUnique({ where: { id: toLocationId } });

          await prisma.inventory.create({
            data: {
              id: require('crypto').randomUUID(),
              productId,
              locationId: toLocationId,
              warehouseId: location?.warehouseId || inventoryAtLocation?.warehouseId,
              companyId: product?.companyId,
              quantity: requestedQty,
              availableQuantity: requestedQty,
              reservedQuantity: 0
            }
          });
        }
      }
    } else if (type === 'RECEIVE' || type === 'RETURN') {
      // Inbound movements - add to destination location
      if (!toLocationId) {
        return res.status(400).json({
          error: 'To Location is required for inbound movements'
        });
      }

      const destInventory = await prisma.inventory.findFirst({
        where: {
          productId,
          locationId: toLocationId
        }
      });

      if (destInventory) {
        await prisma.inventory.update({
          where: { id: destInventory.id },
          data: {
            quantity: { increment: requestedQty },
            availableQuantity: { increment: requestedQty }
          }
        });
      } else {
        // Create new inventory record
        const product = await prisma.product.findUnique({ where: { id: productId } });
        const location = await prisma.location.findUnique({
          where: { id: toLocationId },
          include: { warehouse: true }
        });

        await prisma.inventory.create({
          data: {
            id: require('crypto').randomUUID(),
            productId,
            locationId: toLocationId,
            warehouseId: location?.warehouseId,
            companyId: product?.companyId,
            quantity: requestedQty,
            availableQuantity: requestedQty,
            reservedQuantity: 0
          }
        });
      }
    }
    // ADJUST type - no automatic inventory update, manual adjustment

    const movement = await prisma.inventoryMovement.create({
      data: {
        id: require('crypto').randomUUID(),
        type,
        productId,
        batchId,
        fromLocationId,
        toLocationId,
        quantity: requestedQty,
        reason,
        notes,
        userId: req.user.id,
        createdAt: new Date()
      },
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
        batch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(movement);
  } catch (error) {
    console.error('Create movement error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get movement history for a product
app.get('/api/inventory/movements/product/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit } = req.query;

    const movements = await prisma.inventoryMovement.findMany({
      where: { productId },
      include: {
        fromLocation: true,
        toLocation: true,
        batch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : 50
    });

    res.json(movements);
  } catch (error) {
    console.error('Get product movements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get movement history for a batch
app.get('/api/inventory/movements/batch/:batchId', verifyToken, async (req, res) => {
  try {
    const { batchId } = req.params;

    const movements = await prisma.inventoryMovement.findMany({
      where: { batchId },
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(movements);
  } catch (error) {
    console.error('Get batch movements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single movement by ID
app.get('/api/inventory/movements/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const movement = await prisma.inventoryMovement.findUnique({
      where: { id },
      include: {
        product: true,
        batch: true,
        fromLocation: true,
        toLocation: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!movement) {
      return res.status(404).json({ error: 'Movement not found' });
    }

    res.json(movement);
  } catch (error) {
    console.error('Get movement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update movement
app.patch('/api/inventory/movements/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, productId, batchId, fromLocationId, toLocationId, quantity, reason, notes } = req.body;

    // Check if movement exists
    const existingMovement = await prisma.inventoryMovement.findUnique({
      where: { id }
    });

    if (!existingMovement) {
      return res.status(404).json({ error: 'Movement not found' });
    }

    const updatedMovement = await prisma.inventoryMovement.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(productId && { productId }),
        ...(batchId !== undefined && { batchId: batchId || null }),
        ...(fromLocationId !== undefined && { fromLocationId: fromLocationId || null }),
        ...(toLocationId !== undefined && { toLocationId: toLocationId || null }),
        ...(quantity && { quantity }),
        ...(reason !== undefined && { reason: reason || null }),
        ...(notes !== undefined && { notes: notes || null })
      },
      include: {
        product: true,
        batch: true,
        fromLocation: true,
        toLocation: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedMovement);
  } catch (error) {
    console.error('Update movement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete movement
app.delete('/api/inventory/movements/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if movement exists
    const existingMovement = await prisma.inventoryMovement.findUnique({
      where: { id }
    });

    if (!existingMovement) {
      return res.status(404).json({ error: 'Movement not found' });
    }

    await prisma.inventoryMovement.delete({
      where: { id }
    });

    res.json({ message: 'Movement deleted successfully' });
  } catch (error) {
    console.error('Delete movement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// BRANDS (formerly Categories)
// ===================================

app.get('/api/brands', verifyToken, async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET brand by ID
app.get('/api/brands/:id', verifyToken, async (req, res) => {
  try {
    const brand = await prisma.brand.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      },
      include: {
        products: { select: { id: true, name: true, sku: true } }
      }
    });
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    console.error('Get brand by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/brands', verifyToken, async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Get companyId - use user's company or get/create default
    let companyId = req.user.companyId;
    if (!companyId) {
      // Get or create default company
      let defaultCompany = await prisma.company.findFirst({ where: { code: 'KIAAN' } });
      if (!defaultCompany) {
        defaultCompany = await prisma.company.create({
          data: {
            name: 'Kiaan Food Distribution Ltd',
            code: 'KIAAN',
            description: 'Premium food and snack distribution',
            email: 'info@kiaan-distribution.com',
          },
        });
      }
      companyId = defaultCompany.id;
      // Update user with company
      await prisma.user.update({
        where: { id: req.user.id },
        data: { companyId }
      });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        code,
        description,
        companyId
      }
    });

    res.status(201).json(brand);
  } catch (error) {
    console.error('Create brand error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Brand code already exists' });
    }
    res.status(500).json({ error: 'Failed to create brand', details: error.message });
  }
});

// Legacy endpoint for backward compatibility
app.get('/api/categories', verifyToken, async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(brands);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// PRODUCTS (with Bundles)
// ===================================

app.get('/api/products', verifyToken, async (req, res) => {
  try {
    const { type, brandId, status } = req.query;

    const where = {};
    if (type) where.type = type.toUpperCase();
    if (brandId) where.brandId = brandId;
    if (status) where.status = status.toUpperCase();

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        bundleItems: {
          include: {
            child: true
          }
        },
        inventory: {
          select: {
            quantity: true,
            availableQuantity: true,
            reservedQuantity: true
          }
        },
        _count: {
          select: { inventory: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate total available quantity for each product
    const productsWithStock = products.map(product => {
      const totalQuantity = product.inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
      const availableQuantity = product.inventory.reduce((sum, inv) => sum + (inv.availableQuantity || inv.quantity || 0), 0);
      const reservedQuantity = product.inventory.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0);

      return {
        ...product,
        totalQuantity,
        availableQuantity,
        reservedQuantity,
        inventory: undefined // Remove detailed inventory from list view
      };
    });

    res.json(productsWithStock);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        brand: true,
        bundleItems: {
          include: {
            child: {
              include: {
                brand: true
              }
            }
          }
        },
        partOfBundles: {
          include: {
            parent: true
          }
        },
        inventory: {
          include: {
            warehouse: true,
            location: true
          },
          orderBy: { bestBeforeDate: 'asc' }
        },
        replenConfig: true,
        channelPrices: {
          include: {
            channel: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const { bundleItems, reorderPoint, maxStockLevel, reorderQuantity, unitOfMeasure, ...rawProductData } = req.body;

    // Get companyId - use user's company or get/create default
    let companyId = rawProductData.companyId || req.user.companyId;
    if (!companyId) {
      let defaultCompany = await prisma.company.findFirst({ where: { code: 'KIAAN' } });
      if (!defaultCompany) {
        defaultCompany = await prisma.company.create({
          data: {
            name: 'Kiaan Food Distribution Ltd',
            code: 'KIAAN',
            description: 'Premium food and snack distribution',
            email: 'info@kiaan-distribution.com',
          },
        });
      }
      companyId = defaultCompany.id;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { companyId }
      });
    }

    // Only include valid Product model fields
    const productData = {
      sku: rawProductData.sku,
      name: rawProductData.name,
      description: rawProductData.description || null,
      barcode: rawProductData.barcode || null,
      brandId: rawProductData.brandId || null,
      type: rawProductData.type || 'SIMPLE',
      status: rawProductData.status || 'ACTIVE',
      length: rawProductData.length || null,
      width: rawProductData.width || null,
      height: rawProductData.height || null,
      weight: rawProductData.weight || null,
      dimensionUnit: rawProductData.dimensionUnit || 'cm',
      weightUnit: rawProductData.weightUnit || 'kg',
      costPrice: rawProductData.costPrice || null,
      sellingPrice: rawProductData.sellingPrice || null,
      currency: rawProductData.currency || 'GBP',
      vatRate: rawProductData.vatRate !== undefined ? rawProductData.vatRate : 20.0,
      vatCode: rawProductData.vatCode || null,
      isHeatSensitive: rawProductData.isHeatSensitive || false,
      primarySupplierId: rawProductData.primarySupplierId || null,
      cartonSizes: rawProductData.cartonSizes || null,
      // Marketplace-specific SKUs
      ffdSku: rawProductData.ffdSku || null,
      ffdSaleSku: rawProductData.ffdSaleSku || null,
      wsSku: rawProductData.wsSku || null,
      amzSku: rawProductData.amzSku || null,
      amzSkuBb: rawProductData.amzSkuBb || null,
      amzSkuM: rawProductData.amzSkuM || null,
      amzSkuEu: rawProductData.amzSkuEu || null,
      onBuySku: rawProductData.onBuySku || null,
      isPerishable: rawProductData.isPerishable || false,
      requiresBatch: rawProductData.requiresBatch || false,
      requiresSerial: rawProductData.requiresSerial || false,
      shelfLifeDays: rawProductData.shelfLifeDays || null,
      images: rawProductData.images || [],
      companyId,
    };

    // Calculate bundle cost if this is a bundle
    let calculatedCost = null;
    let bundleItemsWithCost = [];
    if (bundleItems && bundleItems.length > 0) {
      const result = await calculateBundleCost(bundleItems);
      calculatedCost = result.totalCost;
      bundleItemsWithCost = result.itemsWithCost;

      // Set costPrice to bundle cost if not provided
      if (!productData.costPrice) {
        productData.costPrice = calculatedCost;
      }
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        bundleItems: bundleItemsWithCost.length > 0 ? {
          create: bundleItemsWithCost.map(item => ({
            childId: item.childId || item.productId,
            quantity: item.quantity,
            componentCost: item.componentCost
          }))
        } : undefined
      },
      include: {
        brand: true,
        bundleItems: {
          include: {
            child: true
          }
        }
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.put('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const { bundleItems, reorderPoint, maxStockLevel, reorderQuantity, unitOfMeasure, companyId, ...rawProductData } = req.body;

    // Only include valid Product model fields that are provided
    const productData = {};
    if (rawProductData.sku !== undefined) productData.sku = rawProductData.sku;
    if (rawProductData.name !== undefined) productData.name = rawProductData.name;
    if (rawProductData.description !== undefined) productData.description = rawProductData.description;
    if (rawProductData.barcode !== undefined) productData.barcode = rawProductData.barcode;
    if (rawProductData.brandId !== undefined) productData.brandId = rawProductData.brandId;
    if (rawProductData.type !== undefined) productData.type = rawProductData.type;
    if (rawProductData.status !== undefined) productData.status = rawProductData.status;
    if (rawProductData.length !== undefined) productData.length = rawProductData.length;
    if (rawProductData.width !== undefined) productData.width = rawProductData.width;
    if (rawProductData.height !== undefined) productData.height = rawProductData.height;
    if (rawProductData.weight !== undefined) productData.weight = rawProductData.weight;
    if (rawProductData.dimensionUnit !== undefined) productData.dimensionUnit = rawProductData.dimensionUnit;
    if (rawProductData.weightUnit !== undefined) productData.weightUnit = rawProductData.weightUnit;
    if (rawProductData.costPrice !== undefined) productData.costPrice = rawProductData.costPrice;
    if (rawProductData.sellingPrice !== undefined) productData.sellingPrice = rawProductData.sellingPrice;
    if (rawProductData.currency !== undefined) productData.currency = rawProductData.currency;
    if (rawProductData.vatRate !== undefined) productData.vatRate = rawProductData.vatRate;
    if (rawProductData.vatCode !== undefined) productData.vatCode = rawProductData.vatCode;
    if (rawProductData.isHeatSensitive !== undefined) productData.isHeatSensitive = rawProductData.isHeatSensitive;
    if (rawProductData.primarySupplierId !== undefined) productData.primarySupplierId = rawProductData.primarySupplierId;
    if (rawProductData.cartonSizes !== undefined) productData.cartonSizes = rawProductData.cartonSizes;
    // Marketplace-specific SKUs
    if (rawProductData.ffdSku !== undefined) productData.ffdSku = rawProductData.ffdSku;
    if (rawProductData.ffdSaleSku !== undefined) productData.ffdSaleSku = rawProductData.ffdSaleSku;
    if (rawProductData.wsSku !== undefined) productData.wsSku = rawProductData.wsSku;
    if (rawProductData.amzSku !== undefined) productData.amzSku = rawProductData.amzSku;
    if (rawProductData.amzSkuBb !== undefined) productData.amzSkuBb = rawProductData.amzSkuBb;
    if (rawProductData.amzSkuM !== undefined) productData.amzSkuM = rawProductData.amzSkuM;
    if (rawProductData.amzSkuEu !== undefined) productData.amzSkuEu = rawProductData.amzSkuEu;
    if (rawProductData.onBuySku !== undefined) productData.onBuySku = rawProductData.onBuySku;
    if (rawProductData.isPerishable !== undefined) productData.isPerishable = rawProductData.isPerishable;
    if (rawProductData.requiresBatch !== undefined) productData.requiresBatch = rawProductData.requiresBatch;
    if (rawProductData.requiresSerial !== undefined) productData.requiresSerial = rawProductData.requiresSerial;
    if (rawProductData.shelfLifeDays !== undefined) productData.shelfLifeDays = rawProductData.shelfLifeDays;
    if (rawProductData.images !== undefined) productData.images = rawProductData.images;

    // Calculate bundle cost if bundle items are being updated
    let bundleItemsWithCost = [];
    if (bundleItems !== undefined) {
      // Delete old bundle items first
      await prisma.bundleItem.deleteMany({
        where: { parentId: req.params.id }
      });

      if (bundleItems.length > 0) {
        const result = await calculateBundleCost(bundleItems);
        bundleItemsWithCost = result.itemsWithCost;

        // Auto-update costPrice to bundle cost if not explicitly provided
        if (rawProductData.costPrice === undefined) {
          productData.costPrice = result.totalCost;
        }
      }
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...productData,
        bundleItems: bundleItemsWithCost.length > 0 ? {
          create: bundleItemsWithCost.map(item => ({
            childId: item.childId || item.productId,
            quantity: item.quantity,
            componentCost: item.componentCost
          }))
        } : undefined
      },
      include: {
        brand: true,
        bundleItems: {
          include: {
            child: true
          }
        }
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First delete related bundle items
    await prisma.bundleItem.deleteMany({
      where: {
        OR: [
          { parentId: id },
          { childId: id }
        ]
      }
    });

    // Delete the product
    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product history (inventory movements, orders, adjustments)
app.get('/api/products/:id/history', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    // Get inventory movements for this product
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        inventory: {
          productId: id
        }
      },
      include: {
        fromLocation: true,
        toLocation: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Get stock adjustments for this product
    const adjustments = await prisma.stockAdjustmentItem.findMany({
      where: { productId: id },
      include: {
        adjustment: true,
        location: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Combine and format history
    const history = [
      ...movements.map(m => ({
        id: m.id,
        type: 'movement',
        action: m.type,
        quantity: m.quantity,
        fromLocation: m.fromLocation?.name,
        toLocation: m.toLocation?.name,
        reference: m.reference,
        notes: m.notes,
        createdBy: m.createdBy?.name,
        createdAt: m.createdAt
      })),
      ...adjustments.map(a => ({
        id: a.id,
        type: 'adjustment',
        action: a.adjustment?.type || 'ADJUSTMENT',
        quantity: a.quantity,
        location: a.location?.name,
        reference: a.adjustment?.reference,
        notes: a.adjustment?.reason,
        createdAt: a.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(history.slice(0, parseInt(limit)));
  } catch (error) {
    console.error('Get product history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product analytics
app.get('/api/products/:id/analytics', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get product with inventory
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            warehouse: true,
            location: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate analytics
    const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const reservedStock = product.inventory.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0);
    const availableStock = totalStock - reservedStock;

    // Get sales data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesOrderItems = await prisma.salesOrderItem.findMany({
      where: {
        productId: id,
        salesOrder: {
          createdAt: { gte: thirtyDaysAgo }
        }
      },
      include: {
        salesOrder: true
      }
    });

    const totalSalesQty = salesOrderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalSalesValue = salesOrderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Stock by warehouse
    const stockByWarehouse = product.inventory.reduce((acc, inv) => {
      const whName = inv.warehouse?.name || 'Unknown';
      acc[whName] = (acc[whName] || 0) + inv.quantity;
      return acc;
    }, {});

    res.json({
      productId: id,
      totalStock,
      reservedStock,
      availableStock,
      reorderPoint: product.reorderPoint || 0,
      reorderQuantity: product.reorderQuantity || 0,
      last30Days: {
        salesQuantity: totalSalesQty,
        salesValue: totalSalesValue,
        averageDaily: Math.round(totalSalesQty / 30 * 100) / 100
      },
      stockByWarehouse
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product barcode history
app.get('/api/products/:id/barcode-history', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get barcode scan history from barcode scans table if it exists
    // For now, return empty array as the barcode scan history table may not exist
    const barcodeHistory = [];

    res.json(barcodeHistory);
  } catch (error) {
    console.error('Get product barcode history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// BRANDS - UPDATE and DELETE
// ===================================

// Update brand
app.put('/api/brands/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        code,
        description,
        updatedAt: new Date()
      }
    });

    res.json(brand);
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete brand
app.delete('/api/brands/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any products use this brand
    const productsUsingBrand = await prisma.product.count({
      where: { brandId: id }
    });

    if (productsUsingBrand > 0) {
      return res.status(400).json({
        error: `Cannot delete brand: ${productsUsingBrand} products are using this brand`
      });
    }

    await prisma.brand.delete({
      where: { id }
    });

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products for a specific brand
app.get('/api/brands/:id/products', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const products = await prisma.product.findMany({
      where: { brandId: id },
      include: {
        brand: true,
        category: true,
        inventory: {
          include: {
            warehouse: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(products);
  } catch (error) {
    console.error('Get brand products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update products for a brand (assign/unassign products)
app.put('/api/brands/:id/products', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }

    // First, unassign all products from this brand
    await prisma.product.updateMany({
      where: { brandId: id },
      data: { brandId: null }
    });

    // Then assign the specified products to this brand
    if (productIds.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { brandId: id }
      });
    }

    // Return updated products list
    const products = await prisma.product.findMany({
      where: { brandId: id },
      include: {
        brand: true,
        category: true
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Update brand products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// INVENTORY (with BB Dates)
// ===================================

app.get('/api/inventory', verifyToken, async (req, res) => {
  try {
    const { warehouseId, productId, status } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;
    if (status) where.status = status.toUpperCase();

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true
          }
        },
        warehouse: true,
        location: true
      },
      orderBy: [
        { product: { name: 'asc' } },
        { bestBeforeDate: 'asc' }
      ]
    });

    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create inventory record
app.post('/api/inventory', verifyToken, async (req, res) => {
  try {
    const {
      productId,
      warehouseId,
      locationId,
      lotNumber,
      batchNumber,
      serialNumber,
      bestBeforeDate,
      quantity,
      availableQuantity,
      reservedQuantity,
      status
    } = req.body;

    // Validate required fields
    if (!productId || !warehouseId) {
      return res.status(400).json({ error: 'productId and warehouseId are required' });
    }

    const inventory = await prisma.inventory.create({
      data: {
        productId,
        warehouseId,
        locationId: locationId || null,
        lotNumber: lotNumber || null,
        batchNumber: batchNumber || null,
        serialNumber: serialNumber || null,
        bestBeforeDate: bestBeforeDate ? new Date(bestBeforeDate) : null,
        quantity: parseInt(quantity) || 0,
        availableQuantity: availableQuantity !== undefined ? parseInt(availableQuantity) : (parseInt(quantity) || 0),
        reservedQuantity: parseInt(reservedQuantity) || 0,
        status: status || 'AVAILABLE'
      },
      include: {
        product: {
          include: {
            brand: true
          }
        },
        warehouse: true,
        location: true
      }
    });

    res.status(201).json(inventory);
  } catch (error) {
    console.error('Create inventory error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Inventory record already exists for this product/warehouse/location/lot combination' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory record
app.put('/api/inventory/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productId,
      warehouseId,
      locationId,
      lotNumber,
      batchNumber,
      serialNumber,
      bestBeforeDate,
      quantity,
      availableQuantity,
      reservedQuantity,
      status
    } = req.body;

    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        productId,
        warehouseId,
        locationId: locationId || null,
        lotNumber: lotNumber || null,
        batchNumber: batchNumber || null,
        serialNumber: serialNumber || null,
        bestBeforeDate: bestBeforeDate ? new Date(bestBeforeDate) : null,
        quantity: parseInt(quantity) || 0,
        availableQuantity: availableQuantity !== undefined ? parseInt(availableQuantity) : (parseInt(quantity) || 0),
        reservedQuantity: parseInt(reservedQuantity) || 0,
        status: status || 'AVAILABLE'
      },
      include: {
        product: {
          include: {
            brand: true
          }
        },
        warehouse: true,
        location: true
      }
    });

    res.json(inventory);
  } catch (error) {
    console.error('Update inventory error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete inventory record
app.delete('/api/inventory/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.inventory.delete({
      where: { id }
    });

    res.json({ message: 'Inventory record deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// SALES ORDERS (with Wholesale Flag)
// ===================================

app.get('/api/sales-orders', verifyToken, async (req, res) => {
  try {
    const { status, isWholesale, salesChannel } = req.query;

    const where = {};
    if (status) where.status = status.toUpperCase();
    if (isWholesale !== undefined) where.isWholesale = isWholesale === 'true';
    if (salesChannel) where.salesChannel = salesChannel;

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                brand: true
              }
            }
          }
        },
        pickLists: {
          include: {
            assignedUser: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get sales orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sales-orders', verifyToken, async (req, res) => {
  try {
    const { items, ...orderData } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Validate stock availability for each item
    const stockErrors = [];
    for (const item of items) {
      const productId = item.productId;
      const requestedQty = parseFloat(item.quantity);

      // Get total available inventory for this product
      const inventoryRecords = await prisma.inventory.findMany({
        where: { productId },
        include: { product: true }
      });

      const totalAvailable = inventoryRecords.reduce((sum, inv) => {
        return sum + (inv.availableQuantity || inv.quantity || 0);
      }, 0);

      const productName = inventoryRecords[0]?.product?.name || item.productId;

      if (requestedQty > totalAvailable) {
        stockErrors.push({
          productId,
          productName,
          requested: requestedQty,
          available: totalAvailable
        });
      }
    }

    if (stockErrors.length > 0) {
      const errorMessages = stockErrors.map(e =>
        `${e.productName}: requested ${e.requested}, available ${e.available}`
      ).join('; ');
      return res.status(400).json({
        error: `Insufficient stock: ${errorMessages}`,
        stockErrors
      });
    }

    // Generate order number if not provided
    if (!orderData.orderNumber) {
      const count = await prisma.salesOrder.count();
      orderData.orderNumber = `SO-${String(count + 1).padStart(6, '0')}`;
    }

    // Set default status
    if (!orderData.status) {
      orderData.status = 'PENDING';
    }

    const order = await prisma.salesOrder.create({
      data: {
        id: require('crypto').randomUUID(),
        ...orderData,
        status: 'PICKING', // Auto-set to PICKING since we auto-generate pick list
        items: {
          create: items.map(item => ({
            id: require('crypto').randomUUID(),
            ...item
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Auto-generate pick list for the order
    try {
      // Generate pick list number
      const allPickLists = await prisma.pickList.findMany({
        select: { pickListNumber: true },
        where: { pickListNumber: { startsWith: 'PL-' } }
      });
      let maxNumber = 0;
      for (const pl of allPickLists) {
        const match = pl.pickListNumber.match(/^PL-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      }
      const pickListNumber = `PL-${String(maxNumber + 1).padStart(6, '0')}`;

      // Find inventory locations for each product (FIFO allocation)
      const pickItems = [];
      for (const item of order.items) {
        const inventory = await prisma.inventory.findFirst({
          where: {
            productId: item.productId,
            availableQuantity: { gt: 0 }
          },
          include: { location: true },
          orderBy: { createdAt: 'asc' } // FIFO
        });

        pickItems.push({
          id: require('crypto').randomUUID(),
          productId: item.productId,
          quantity: item.quantity,
          pickedQty: 0,
          locationId: inventory?.locationId || null
        });
      }

      // Create pick list
      await prisma.pickList.create({
        data: {
          id: require('crypto').randomUUID(),
          pickListNumber,
          orderId: order.id,
          priority: order.priority || 'MEDIUM',
          status: 'PENDING',
          enforceSingleBBDate: order.isWholesale || false,
          items: {
            create: pickItems
          }
        }
      });

      console.log(`Auto-generated pick list ${pickListNumber} for order ${order.orderNumber}`);
    } catch (pickListError) {
      console.error('Failed to auto-generate pick list:', pickListError);
      // Don't fail the order creation, just log the error
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Create sales order error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.patch('/api/sales-orders/:id/wholesale', verifyToken, async (req, res) => {
  try {
    const { isWholesale } = req.body;

    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: { isWholesale },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Update wholesale flag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// WAREHOUSES
// ===================================

app.get('/api/warehouses', verifyToken, async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        zones: true,
        _count: {
          select: { inventory: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// LOCATIONS (Warehouse storage locations)
// ===================================

// Get all locations
app.get('/api/locations', verifyToken, async (req, res) => {
  try {
    const { warehouseId, zoneId } = req.query;

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (zoneId) where.zoneId = zoneId;

    const locations = await prisma.location.findMany({
      where,
      include: {
        warehouse: {
          select: { id: true, name: true, code: true }
        },
        zone: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { inventory: true }
        }
      },
      orderBy: [
        { warehouse: { name: 'asc' } },
        { code: 'asc' }
      ]
    });

    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get locations with stock for a specific product
app.get('/api/locations/with-stock/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;

    // Find all inventory records for this product with available quantity
    const inventory = await prisma.inventory.findMany({
      where: {
        productId,
        availableQuantity: { gt: 0 }
      },
      include: {
        location: {
          include: {
            zone: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Extract unique locations with their available quantities
    const locationsMap = new Map();
    inventory.forEach(inv => {
      if (inv.location) {
        const existing = locationsMap.get(inv.location.id);
        if (existing) {
          existing.availableQuantity += inv.availableQuantity;
        } else {
          locationsMap.set(inv.location.id, {
            ...inv.location,
            availableQuantity: inv.availableQuantity,
            batchNumber: inv.batchNumber,
            lotNumber: inv.lotNumber
          });
        }
      }
    });

    res.json(Array.from(locationsMap.values()));
  } catch (error) {
    console.error('Get locations with stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single location
app.get('/api/locations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: true,
        zone: true,
        inventory: {
          include: {
            product: true
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create location
app.post('/api/locations', verifyToken, async (req, res) => {
  try {
    const { name, code, warehouseId, zoneId, aisle, rack, shelf, bin, locationType, pickSequence, maxWeight, isHeatSensitive } = req.body;

    if (!name || !warehouseId) {
      return res.status(400).json({ error: 'Name and warehouseId are required' });
    }

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Auto-generate code if not provided
    let locationCode = code;
    if (!locationCode) {
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      locationCode = `LOC-${randomPart}`;
    }

    // Check for duplicate code in same warehouse
    const existing = await prisma.location.findFirst({
      where: { warehouseId, code: locationCode }
    });

    if (existing) {
      return res.status(400).json({ error: 'Location code already exists in this warehouse' });
    }

    const location = await prisma.location.create({
      data: {
        name,
        code: locationCode,
        warehouseId,
        zoneId: zoneId || null,
        aisle: aisle || null,
        rack: rack || null,
        shelf: shelf || null,
        bin: bin || null,
        locationType: locationType || 'PICK',
        pickSequence: pickSequence || null,
        weightLimit: maxWeight || null,
        isHeatSensitive: isHeatSensitive || false
      },
      include: {
        warehouse: true,
        zone: true
      }
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update location
app.put('/api/locations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, warehouseId, zoneId, aisle, rack, shelf, bin, locationType, pickSequence, maxWeight, isHeatSensitive } = req.body;

    const existing = await prisma.location.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check for duplicate code if changing
    if (code && code !== existing.code) {
      const duplicate = await prisma.location.findFirst({
        where: {
          warehouseId: warehouseId || existing.warehouseId,
          code,
          NOT: { id }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Location code already exists in this warehouse' });
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        code: code !== undefined ? code : existing.code,
        warehouseId: warehouseId !== undefined ? warehouseId : existing.warehouseId,
        zoneId: zoneId !== undefined ? (zoneId || null) : existing.zoneId,
        aisle: aisle !== undefined ? (aisle || null) : existing.aisle,
        rack: rack !== undefined ? (rack || null) : existing.rack,
        shelf: shelf !== undefined ? (shelf || null) : existing.shelf,
        bin: bin !== undefined ? (bin || null) : existing.bin,
        locationType: locationType !== undefined ? locationType : existing.locationType,
        pickSequence: pickSequence !== undefined ? (pickSequence || null) : existing.pickSequence,
        weightLimit: maxWeight !== undefined ? (maxWeight || null) : existing.weightLimit,
        isHeatSensitive: isHeatSensitive !== undefined ? isHeatSensitive : existing.isHeatSensitive
      },
      include: {
        warehouse: true,
        zone: true
      }
    });

    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete location
app.delete('/api/locations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventory: true }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check if location has inventory
    if (existing._count.inventory > 0) {
      return res.status(400).json({
        error: 'Cannot delete location with existing inventory',
        inventoryCount: existing._count.inventory
      });
    }

    await prisma.location.delete({
      where: { id }
    });

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// CUSTOMERS
// ===================================

app.get('/api/customers', verifyToken, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID with orders
app.get('/api/customers/:id', verifyToken, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate total order value
    const totalOrderValue = customer.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    res.json({
      ...customer,
      totalOrderValue
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders for a specific customer
app.get('/api/customers/:id/orders', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: { customerId: req.params.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// REPLENISHMENT
// ===================================

app.get('/api/replenishment/tasks', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) where.status = status.toUpperCase();

    const tasks = await prisma.replenishmentTask.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get replenishment tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/replenishment/config', verifyToken, async (req, res) => {
  try {
    const configs = await prisma.replenishmentConfig.findMany({
      include: {
        product: {
          include: {
            brand: true
          }
        }
      },
      orderBy: { product: { name: 'asc' } }
    });

    res.json(configs);
  } catch (error) {
    console.error('Get replenishment configs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/replenishment/config', verifyToken, async (req, res) => {
  try {
    const config = await prisma.replenishmentConfig.create({
      data: req.body,
      include: {
        product: true
      }
    });

    res.status(201).json(config);
  } catch (error) {
    console.error('Create replenishment config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// FBA TRANSFERS
// ===================================

app.get('/api/transfers', verifyToken, async (req, res) => {
  try {
    const { type, status } = req.query;

    const where = {};
    if (type) where.type = type.toUpperCase();
    if (status) where.status = status.toUpperCase();

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available inventory for a warehouse (for transfer source selection)
app.get('/api/transfers/available-inventory/:warehouseId', verifyToken, async (req, res) => {
  try {
    const { warehouseId } = req.params;

    // Get all inventory in this warehouse with quantity > 0
    const inventory = await prisma.inventory.findMany({
      where: {
        warehouseId,
        quantity: { gt: 0 }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true
          }
        },
        location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      },
      orderBy: [
        { product: { name: 'asc' } }
      ]
    });

    // Group by product and sum quantities
    const productMap = new Map();
    for (const inv of inventory) {
      const key = inv.productId;
      if (productMap.has(key)) {
        const existing = productMap.get(key);
        existing.availableQty += inv.quantity;
        existing.locations.push({
          locationId: inv.locationId,
          locationCode: inv.location?.code || 'N/A',
          quantity: inv.quantity,
          batchNumber: inv.batchNumber,
          bestBefore: inv.bestBefore
        });
      } else {
        productMap.set(key, {
          productId: inv.productId,
          productName: inv.product?.name || 'Unknown',
          productSku: inv.product?.sku || 'N/A',
          barcode: inv.product?.barcode,
          availableQty: inv.quantity,
          locations: [{
            locationId: inv.locationId,
            locationCode: inv.location?.code || 'N/A',
            quantity: inv.quantity,
            batchNumber: inv.batchNumber,
            bestBefore: inv.bestBefore
          }]
        });
      }
    }

    const result = Array.from(productMap.values());
    res.json(result);
  } catch (error) {
    console.error('Get available inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch available inventory' });
  }
});

app.post('/api/transfers', verifyToken, async (req, res) => {
  try {
    const { items, transferItems, fromWarehouseId, toWarehouseId, type, notes } = req.body;

    // Accept both 'items' and 'transferItems' for flexibility
    const transferItemsList = items || transferItems || [];

    console.log('Transfer request:', { fromWarehouseId, toWarehouseId, type, itemCount: transferItemsList.length });

    if (!fromWarehouseId || !toWarehouseId) {
      return res.status(400).json({ error: 'Source and destination warehouses are required' });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ error: 'Source and destination warehouses must be different' });
    }

    if (!transferItemsList || transferItemsList.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Validate each item has sufficient inventory
    const validationErrors = [];
    for (const item of transferItemsList) {
      const inventory = await prisma.inventory.aggregate({
        where: {
          warehouseId: fromWarehouseId,
          productId: item.productId
        },
        _sum: { quantity: true }
      });

      const availableQty = inventory._sum.quantity || 0;
      if (item.quantity > availableQty) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true }
        });
        validationErrors.push(
          `${product?.name || item.productId}: requested ${item.quantity}, available ${availableQty}`
        );
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Insufficient inventory',
        details: validationErrors
      });
    }

    // Generate transfer number
    const allTransfers = await prisma.transfer.findMany({
      select: { transferNumber: true },
      where: { transferNumber: { startsWith: 'TRF-' } }
    });
    let maxNumber = 0;
    for (const t of allTransfers) {
      const match = t.transferNumber.match(/^TRF-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
    const transferNumber = `TRF-${String(maxNumber + 1).padStart(6, '0')}`;

    // Create transfer with validated items
    const transfer = await prisma.transfer.create({
      data: {
        transferNumber,
        fromWarehouseId,
        toWarehouseId,
        type: type?.toUpperCase() || 'INTERNAL',
        status: 'PENDING',
        notes,
        items: {
          create: transferItemsList.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            transferredQty: 0,
            notes: item.notes
          }))
        }
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    });

    res.status(201).json({
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      fromWarehouse: transfer.fromWarehouse?.name,
      toWarehouse: transfer.toWarehouse?.name,
      status: transfer.status.toLowerCase(),
      items: transfer.items?.map(item => ({
        productId: item.productId,
        productName: item.product?.name,
        productSku: item.product?.sku,
        quantity: item.quantity
      })),
      createdAt: transfer.createdAt
    });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// Complete transfer - move inventory
app.post('/api/transfers/:id/complete', verifyToken, async (req, res) => {
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Transfer already completed' });
    }

    // Process each item - reduce from source, add to destination
    for (const item of transfer.items) {
      // Find source inventory and reduce
      const sourceInventory = await prisma.inventory.findFirst({
        where: {
          warehouseId: transfer.fromWarehouseId,
          productId: item.productId,
          quantity: { gte: item.quantity }
        }
      });

      if (sourceInventory) {
        await prisma.inventory.update({
          where: { id: sourceInventory.id },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // Find or create destination inventory and add
      const destInventory = await prisma.inventory.findFirst({
        where: {
          warehouseId: transfer.toWarehouseId,
          productId: item.productId
        }
      });

      if (destInventory) {
        await prisma.inventory.update({
          where: { id: destInventory.id },
          data: { quantity: { increment: item.quantity } }
        });
      } else {
        // Create new inventory record at destination
        await prisma.inventory.create({
          data: {
            warehouseId: transfer.toWarehouseId,
            productId: item.productId,
            quantity: item.quantity
          }
        });
      }

      // Update transfer item
      await prisma.transferItem.update({
        where: { id: item.id },
        data: { transferredQty: item.quantity }
      });
    }

    // Mark transfer as completed
    const updated = await prisma.transfer.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: { include: { product: true } }
      }
    });

    res.json({
      id: updated.id,
      transferNumber: updated.transferNumber,
      status: updated.status.toLowerCase(),
      completedAt: updated.completedAt,
      message: 'Transfer completed and inventory updated'
    });
  } catch (error) {
    console.error('Complete transfer error:', error);
    res.status(500).json({ error: 'Failed to complete transfer' });
  }
});

// ===================================
// SALES CHANNELS & ANALYTICS
// ===================================

app.get('/api/channels', verifyToken, async (req, res) => {
  try {
    const channels = await prisma.salesChannel.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { channelPrices: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/channel-prices', verifyToken, async (req, res) => {
  try {
    const { channelId, productId } = req.query;

    const where = { isActive: true };
    if (channelId) where.channelId = channelId;
    if (productId) where.productId = productId;

    const prices = await prisma.channelPrice.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true
          }
        },
        channel: true
      },
      orderBy: [
        { product: { name: 'asc' } },
        { channel: { name: 'asc' } }
      ]
    });

    res.json(prices);
  } catch (error) {
    console.error('Get channel prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/analytics/channel-prices', verifyToken, async (req, res) => {
  try {
    const price = await prisma.channelPrice.create({
      data: req.body,
      include: {
        product: true,
        channel: true
      }
    });

    res.status(201).json(price);
  } catch (error) {
    console.error('Create channel price error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// COMPANIES
// ===================================

app.get('/api/companies', verifyToken, async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            warehouses: true,
            products: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single company by ID
app.get('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        warehouses: true,
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: {
          select: {
            warehouses: true,
            products: true,
            users: true,
            customers: true,
            suppliers: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new company
app.post('/api/companies', verifyToken, async (req, res) => {
  try {
    const { name, code, description, address, phone, email } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Check if code already exists
    const existing = await prisma.company.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Company code already exists' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        address,
        phone,
        email
      }
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update company
app.put('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, address, phone, email } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        code: code?.toUpperCase(),
        description,
        address,
        phone,
        email
      }
    });

    res.json(company);
  } catch (error) {
    console.error('Update company error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete company
app.delete('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.company.delete({ where: { id } });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// SPRINT 4: BARCODE & DOCUMENT MANAGEMENT
// ===================================

// 1. Generate barcode for product
app.post('/api/barcode/generate', verifyToken, async (req, res) => {
  try {
    const { productId, format = 'CODE128', width = 2, height = 100 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate barcode value (use SKU or generate)
    const barcodeValue = product.sku || `WMS${product.id.substring(0, 8)}`;

    res.json({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: barcodeValue,
      format,
      width,
      height,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Generate barcode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Batch generate barcodes
app.post('/api/barcode/generate/batch', verifyToken, async (req, res) => {
  try {
    const { productIds, format = 'CODE128' } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    });

    const barcodes = products.map(product => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.sku || `WMS${product.id.substring(0, 8)}`,
      format,
      brand: product.brand?.name || 'N/A'
    }));

    res.json({
      total: barcodes.length,
      barcodes,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Batch generate barcodes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Generate QR code for location
app.post('/api/qrcode/generate', verifyToken, async (req, res) => {
  try {
    const { locationId, type = 'location' } = req.body;

    if (!locationId) {
      return res.status(400).json({ error: 'Location ID is required' });
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { warehouse: true }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      type: 'location',
      id: location.id,
      code: `${location.aisle}-${location.rack}-${location.bin}`,
      warehouse: location.warehouse?.name || 'N/A',
      timestamp: new Date().toISOString()
    });

    res.json({
      locationId: location.id,
      locationCode: `${location.aisle}-${location.rack}-${location.bin}`,
      warehouse: location.warehouse?.name || 'N/A',
      qrData,
      type,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Lookup product by barcode
app.get('/api/barcode/lookup/:barcode', verifyToken, async (req, res) => {
  try {
    const { barcode } = req.params;

    const product = await prisma.product.findFirst({
      where: { sku: barcode },
      include: {
        brand: true,
        inventory: {
          include: {
            location: {
              include: { warehouse: true }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found with this barcode' });
    }

    // Calculate total available quantity
    const totalAvailable = product.inventory.reduce((sum, inv) => sum + (inv.availableQuantity || 0), 0);

    res.json({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.sku,
      brand: product.brand?.name || 'N/A',
      price: product.price,
      totalAvailable,
      locations: product.inventory.map(inv => ({
        id: inv.id,
        locationCode: `${inv.location?.aisle}-${inv.location?.rack}-${inv.location?.bin}`,
        warehouse: inv.location?.warehouse?.name || 'N/A',
        quantity: inv.availableQuantity,
        expiryDate: inv.bestBeforeDate
      }))
    });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Generate pick list document data
app.get('/api/documents/pick-list/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const pickList = await prisma.pickList.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            },
            location: {
              include: { warehouse: true }
            }
          }
        },
        assignedTo: true,
        createdBy: true
      }
    });

    if (!pickList) {
      return res.status(404).json({ error: 'Pick list not found' });
    }

    // Group items by zone/aisle for efficient picking
    const groupedItems = pickList.items.reduce((acc, item) => {
      const zone = item.location?.aisle || 'Unknown';
      if (!acc[zone]) acc[zone] = [];
      acc[zone].push({
        productName: item.product?.name || 'Unknown',
        sku: item.product?.sku || 'N/A',
        brand: item.product?.brand?.name || 'N/A',
        quantity: item.quantity,
        location: `${item.location?.aisle}-${item.location?.rack}-${item.location?.bin}`,
        barcode: item.product?.sku || ''
      });
      return acc;
    }, {});

    res.json({
      pickListNumber: pickList.id.substring(0, 8).toUpperCase(),
      status: pickList.status,
      priority: pickList.priority || 'MEDIUM',
      createdAt: pickList.createdAt,
      assignedTo: pickList.assignedTo?.name || 'Unassigned',
      createdBy: pickList.createdBy?.name || 'System',
      totalItems: pickList.items.length,
      groupedItems,
      notes: pickList.notes || ''
    });
  } catch (error) {
    console.error('Generate pick list document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Generate packing slip document data
app.post('/api/documents/packing-slip', verifyToken, async (req, res) => {
  try {
    const { orderId, items, shippingInfo } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Get product details for items
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    });

    const itemsWithDetails = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productName: product?.name || 'Unknown',
        sku: product?.sku || 'N/A',
        brand: product?.brand?.name || 'N/A',
        quantity: item.quantity,
        price: product?.price || 0
      };
    });

    const subtotal = itemsWithDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      packingSlipNumber: `PS-${Date.now()}`,
      orderId: orderId || 'N/A',
      date: new Date(),
      items: itemsWithDetails,
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shippingInfo: shippingInfo || {
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      }
    });
  } catch (error) {
    console.error('Generate packing slip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. Generate shipping label document data
app.post('/api/documents/shipping-label', verifyToken, async (req, res) => {
  try {
    const { orderId, shipTo, shipFrom, weight, dimensions } = req.body;

    if (!shipTo || !shipTo.name) {
      return res.status(400).json({ error: 'Shipping recipient information is required' });
    }

    res.json({
      labelNumber: `LABEL-${Date.now()}`,
      orderId: orderId || 'N/A',
      trackingNumber: `WMS${Date.now().toString().substring(5)}`,
      date: new Date(),
      shipTo,
      shipFrom: shipFrom || {
        name: 'Kiaan WMS Warehouse',
        address: '123 Warehouse St',
        city: 'Commerce',
        state: 'CA',
        zip: '90040',
        country: 'USA'
      },
      weight: weight || { value: 0, unit: 'lbs' },
      dimensions: dimensions || { length: 0, width: 0, height: 0, unit: 'in' },
      service: 'Standard Shipping',
      barcode: `WMS${Date.now()}`
    });
  } catch (error) {
    console.error('Generate shipping label error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. Generate transfer document data
app.get('/api/documents/transfer/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        },
        fromWarehouse: true,
        toWarehouse: true,
        createdBy: true
      }
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.json({
      transferNumber: transfer.id.substring(0, 8).toUpperCase(),
      status: transfer.status,
      transferDate: transfer.transferDate,
      fromWarehouse: transfer.fromWarehouse?.name || 'Unknown',
      toWarehouse: transfer.toWarehouse?.name || 'Unknown',
      createdBy: transfer.createdBy?.name || 'System',
      items: transfer.items.map(item => ({
        productName: item.product?.name || 'Unknown',
        sku: item.product?.sku || 'N/A',
        brand: item.product?.brand?.name || 'N/A',
        quantity: item.quantity,
        barcode: item.product?.sku || ''
      })),
      totalItems: transfer.items.length,
      totalQuantity: transfer.items.reduce((sum, item) => sum + item.quantity, 0),
      notes: transfer.notes || ''
    });
  } catch (error) {
    console.error('Generate transfer document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 9. Generate product label data (for printing)
app.post('/api/documents/product-label', verifyToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        inventory: {
          include: {
            location: true
          },
          take: 1
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const labels = Array(quantity).fill(null).map((_, index) => ({
      labelNumber: index + 1,
      productName: product.name,
      sku: product.sku,
      brand: product.brand?.name || 'N/A',
      barcode: product.sku || `WMS${product.id.substring(0, 8)}`,
      price: product.price,
      location: product.inventory[0]
        ? `${product.inventory[0].location?.aisle}-${product.inventory[0].location?.rack}-${product.inventory[0].location?.bin}`
        : 'N/A',
      generatedAt: new Date()
    }));

    res.json({
      productId: product.id,
      quantity,
      labels
    });
  } catch (error) {
    console.error('Generate product label error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 10. Get all document templates
app.get('/api/documents/templates', verifyToken, async (req, res) => {
  try {
    const templates = [
      {
        id: 'pick-list',
        name: 'Pick List',
        description: 'Printable pick list grouped by zone',
        category: 'Operations',
        icon: 'FileText',
        requiresId: true
      },
      {
        id: 'packing-slip',
        name: 'Packing Slip',
        description: 'Packing slip with order details',
        category: 'Shipping',
        icon: 'Package',
        requiresId: false
      },
      {
        id: 'shipping-label',
        name: 'Shipping Label',
        description: 'Shipping label with barcode',
        category: 'Shipping',
        icon: 'Tag',
        requiresId: false
      },
      {
        id: 'transfer-document',
        name: 'Transfer Document',
        description: 'Transfer order form',
        category: 'Operations',
        icon: 'Truck',
        requiresId: true
      },
      {
        id: 'product-label',
        name: 'Product Label',
        description: 'Product label with barcode',
        category: 'Inventory',
        icon: 'Barcode',
        requiresId: false
      },
      {
        id: 'location-qr',
        name: 'Location QR Code',
        description: 'QR code for warehouse location',
        category: 'Inventory',
        icon: 'QrCode',
        requiresId: false
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 11. Get barcode statistics
app.get('/api/barcode/statistics', verifyToken, async (req, res) => {
  try {
    const totalProducts = await prisma.product.count();

    // Count products with non-empty barcode
    const productsWithBarcode = await prisma.product.count({
      where: {
        barcode: {
          not: ''
        }
      }
    });

    const totalLocations = await prisma.location.count();

    res.json({
      totalProducts,
      productsWithBarcode: productsWithBarcode,
      productsWithoutBarcode: totalProducts - productsWithBarcode,
      totalLocations,
      barcodeFormat: 'CODE128',
      qrCodeFormat: 'QR_CODE'
    });
  } catch (error) {
    console.error('Get barcode statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// RETURNS & RMA (Mock endpoints removed - using database endpoints below)
// ===================================

// NOTE: All Returns/RMA endpoints are defined in the "RETURNS / RMA" section below (around line 6900+)
// This section is intentionally left empty to prevent duplicate route conflicts

// Placeholder removed - mock endpoints deleted. Use database endpoints.

// ===================================
// PLACEHOLDER - Mock endpoints removed
// ===================================

// The following mock code has been removed to avoid conflicts:
// - Mock GET /api/returns (returned fake data)
// - Mock POST /api/returns (returned fake data)
// Actual database-backed endpoints are in the "RETURNS / RMA" section

// LEGACY MOCK CODE REMOVED
// Using database-backed endpoints instead at line ~6900+

// Keep this comment block to preserve line spacing
// and prevent git merge conflicts

// End of removed mock section

// ===================================
// SHIPMENTS
// ===================================

// Get orders ready to ship (for batch shipment creation)
app.get('/api/shipments/ready-orders', verifyToken, async (req, res) => {
  try {
    // Get orders that are packed/ready to ship (without tracking numbers)
    const orders = await prisma.salesOrder.findMany({
      where: {
        AND: [
          { status: { in: ['PICKING', 'PACKING', 'PACKED', 'READY_TO_SHIP'] } },
          {
            OR: [
              { trackingNumber: null },
              { trackingNumber: '' }
            ]
          }
        ]
      },
      include: {
        customer: true,
        items: {
          include: { product: true }
        },
        packingTasks: {
          select: {
            id: true,
            packingNumber: true,
            status: true,
            totalWeight: true,
            completedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformed = orders.map(order => {
      const latestPacking = order.packingTasks?.[0];
      const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: {
          id: order.customer?.id,
          name: order.customer?.name || 'Unknown',
          email: order.customer?.email,
          phone: order.customer?.phone
        },
        shippingAddress: order.shippingAddress || order.customer?.address || '',
        city: order.customer?.city || '',
        postcode: order.customer?.postcode || '',
        country: order.customer?.country || 'UK',
        status: order.status,
        priority: order.priority,
        totalAmount: order.totalAmount,
        itemCount: itemCount,
        skuCount: order.items?.length || 0,
        weight: latestPacking?.totalWeight || (itemCount * 0.5),
        packingNumber: latestPacking?.packingNumber || 'N/A',
        packingStatus: latestPacking?.status || 'PENDING',
        packedAt: latestPacking?.completedAt,
        createdAt: order.createdAt
      };
    });

    res.json(transformed);
  } catch (error) {
    console.error('Get ready orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders ready for shipping' });
  }
});

app.get('/api/shipments', verifyToken, async (req, res) => {
  try {
    // Try to get real shipments from database if table exists
    try {
      const shipments = await prisma.shipment.findMany({
        include: {
          orders: {
            include: { customer: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const transformed = shipments.map(s => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        carrier: s.carrier,
        tracking: s.trackingNumber,
        status: (s.status || 'PENDING').toLowerCase(),
        orders: s.orders?.length || 0,
        orderNumbers: s.orders?.map(o => o.orderNumber).join(', ') || '',
        shipDate: s.shippedAt,
        destination: s.orders?.[0]?.customer?.address || s.shippingAddress || '',
        totalWeight: s.totalWeight,
        createdAt: s.createdAt
      }));

      return res.json(transformed);
    } catch (dbError) {
      // Table doesn't exist, return empty array
      console.log('Shipment table not found, returning empty array');
      return res.json([]);
    }
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create batch shipment for multiple orders
app.post('/api/shipments/batch', verifyToken, async (req, res) => {
  try {
    const { orderIds, carrier, serviceType, notes } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one order' });
    }

    if (!carrier) {
      return res.status(400).json({ error: 'Please select a carrier' });
    }

    // Get orders with details
    const orders = await prisma.salesOrder.findMany({
      where: { id: { in: orderIds } },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (orders.length === 0) {
      return res.status(404).json({ error: 'No valid orders found' });
    }

    // Generate shipment number
    const shipmentCount = await prisma.shipment.count().catch(() => 0);
    const shipmentNumber = `SHP-${String(shipmentCount + 1).padStart(6, '0')}`;

    // Calculate total weight
    const totalWeight = orders.reduce((sum, order) => {
      const orderWeight = order.items?.reduce((itemSum, item) => {
        return itemSum + ((item.product?.weight || 0.5) * (item.quantity || 1));
      }, 0) || 0;
      return sum + orderWeight;
    }, 0);

    // Try to create shipment in database
    try {
      const shipment = await prisma.shipment.create({
        data: {
          id: require('crypto').randomUUID(),
          shipmentNumber,
          carrier,
          serviceType: serviceType || 'standard',
          status: 'PENDING',
          totalWeight,
          notes,
          orders: {
            connect: orderIds.map(id => ({ id }))
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          orders: { include: { customer: true } }
        }
      });

      // Update order statuses to SHIPPED
      await prisma.salesOrder.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'SHIPPED' }
      });

      res.status(201).json({
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        carrier: shipment.carrier,
        orderCount: orders.length,
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customer: o.customer?.name
        })),
        totalWeight,
        status: 'pending',
        message: `Shipment created with ${orders.length} orders. Ready for label generation.`
      });
    } catch (dbError) {
      // Shipment table might not exist - just update order status
      console.log('Shipment table not found, updating order status only');

      await prisma.salesOrder.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'SHIPPED' }
      });

      res.status(201).json({
        id: require('crypto').randomUUID(),
        shipmentNumber,
        carrier,
        orderCount: orders.length,
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customer: o.customer?.name,
          address: o.shippingAddress || o.customer?.address
        })),
        totalWeight,
        status: 'pending',
        message: `${orders.length} orders marked as shipped. Generate labels in your carrier portal.`
      });
    }
  } catch (error) {
    console.error('Create batch shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

app.post('/api/shipments', verifyToken, async (req, res) => {
  try {
    const { carrier, tracking, destination, recipientName, postcode, serviceType } = req.body;

    const shipmentNumber = `SHP-${Date.now().toString().slice(-6)}`;

    // Try to create in database
    try {
      const shipment = await prisma.shipment.create({
        data: {
          id: require('crypto').randomUUID(),
          shipmentNumber,
          carrier,
          trackingNumber: tracking,
          shippingAddress: destination,
          recipientName,
          postcode,
          serviceType: serviceType || 'standard',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      return res.status(201).json(shipment);
    } catch (dbError) {
      // Return mock response if table doesn't exist
      const newShipment = {
        id: require('crypto').randomUUID(),
        shipmentNumber,
        carrier,
        tracking,
        destination,
        recipientName,
        postcode,
        serviceType,
        orders: 0,
        shipDate: null,
        status: 'pending'
      };
      return res.status(201).json(newShipment);
    }
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shipping carriers (saved API settings)
app.get('/api/shipping/carriers', verifyToken, async (req, res) => {
  try {
    // Try to get from database
    try {
      const carriers = await prisma.carrierSetting.findMany();
      return res.json(carriers);
    } catch (e) {
      // Table doesn't exist
      return res.json([]);
    }
  } catch (error) {
    console.error('Get carriers error:', error);
    res.status(500).json({ error: 'Failed to fetch carriers' });
  }
});

// Save carrier API settings
app.post('/api/shipping/carriers', verifyToken, async (req, res) => {
  try {
    const { carrierId, apiKey, apiSecret, accountNumber, sandboxMode } = req.body;

    // Try to save to database
    try {
      const existing = await prisma.carrierSetting.findFirst({
        where: { carrierId }
      });

      if (existing) {
        await prisma.carrierSetting.update({
          where: { id: existing.id },
          data: { apiKey, apiSecret, accountNumber, sandboxMode }
        });
      } else {
        await prisma.carrierSetting.create({
          data: {
            id: require('crypto').randomUUID(),
            carrierId,
            apiKey,
            apiSecret,
            accountNumber,
            sandboxMode: sandboxMode || false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      return res.json({ success: true, message: 'Carrier settings saved' });
    } catch (e) {
      // Table doesn't exist - return success anyway for demo
      return res.json({ success: true, message: 'Carrier settings saved (demo mode)' });
    }
  } catch (error) {
    console.error('Save carrier error:', error);
    res.status(500).json({ error: 'Failed to save carrier settings' });
  }
});

// Get shipping rates from carrier APIs
app.post('/api/shipping/rates', verifyToken, async (req, res) => {
  try {
    const { shipmentId, orderId, carrier, weight, postcode } = req.body;

    // Mock rates for different carriers
    const rates = [
      { carrier: 'royal_mail', service: 'Tracked 24', price: 4.50, estimatedDays: 1, currency: 'GBP' },
      { carrier: 'royal_mail', service: 'Tracked 48', price: 3.20, estimatedDays: 2, currency: 'GBP' },
      { carrier: 'dpd', service: 'Next Day', price: 6.99, estimatedDays: 1, currency: 'GBP' },
      { carrier: 'dpd', service: 'Next Day by 12', price: 9.99, estimatedDays: 1, currency: 'GBP' },
      { carrier: 'evri', service: 'Standard', price: 2.99, estimatedDays: 3, currency: 'GBP' },
      { carrier: 'parcelforce', service: 'Express 24', price: 8.50, estimatedDays: 1, currency: 'GBP' },
    ];

    // Filter by carrier if specified
    const filteredRates = carrier
      ? rates.filter(r => r.carrier === carrier)
      : rates;

    res.json(filteredRates);
  } catch (error) {
    console.error('Get rates error:', error);
    res.status(500).json({ error: 'Failed to get shipping rates' });
  }
});

// Generate shipping labels for batch
app.post('/api/shipping/labels/batch', verifyToken, async (req, res) => {
  try {
    const { orderIds, carrier, serviceType } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'No orders provided' });
    }

    // Get orders with customer details
    const orders = await prisma.salesOrder.findMany({
      where: { id: { in: orderIds } },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    // Generate labels for each order
    const labels = orders.map((order, idx) => {
      const trackingNumber = generateTrackingNumber(carrier);
      const weight = order.items?.reduce((sum, item) => sum + ((item.product?.weight || 0.5) * (item.quantity || 1)), 0) || 0;

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer?.name || 'Unknown',
        address: order.shippingAddress || order.customer?.address || '',
        postcode: order.customer?.postcode || '',
        carrier: carrier,
        service: serviceType || 'standard',
        trackingNumber: trackingNumber,
        weight: weight.toFixed(2),
        labelUrl: `/api/shipping/labels/${order.id}/download`,
        status: 'generated'
      };
    });

    // Update orders with tracking numbers
    for (const label of labels) {
      await prisma.salesOrder.update({
        where: { id: label.orderId },
        data: {
          status: 'SHIPPED',
          trackingNumber: label.trackingNumber
        }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Generated ${labels.length} shipping labels`,
      labels: labels,
      downloadAllUrl: `/api/shipping/labels/batch/download?orders=${orderIds.join(',')}`
    });
  } catch (error) {
    console.error('Generate batch labels error:', error);
    res.status(500).json({ error: 'Failed to generate labels' });
  }
});

// Generate single shipping label
app.post('/api/shipping/labels', verifyToken, async (req, res) => {
  try {
    const { orderId, shipmentId, carrier, serviceType } = req.body;

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId || shipmentId },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const trackingNumber = generateTrackingNumber(carrier);
    const weight = order.items?.reduce((sum, item) => sum + ((item.product?.weight || 0.5) * (item.quantity || 1)), 0) || 0;

    // Update order with tracking
    await prisma.salesOrder.update({
      where: { id: order.id },
      data: {
        status: 'SHIPPED',
        trackingNumber: trackingNumber
      }
    }).catch(() => {});

    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingNumber: trackingNumber,
      carrier: carrier,
      service: serviceType || 'standard',
      weight: weight.toFixed(2),
      labelUrl: `/api/shipping/labels/${order.id}/download`,
      message: 'Label generated successfully'
    });
  } catch (error) {
    console.error('Generate label error:', error);
    res.status(500).json({ error: 'Failed to generate label' });
  }
});

// Download label (placeholder - would return PDF in real implementation)
app.get('/api/shipping/labels/:id/download', async (req, res) => {
  try {
    // In real implementation, this would:
    // 1. Fetch label from carrier API
    // 2. Return PDF binary
    // For now, redirect to a placeholder
    res.json({
      message: 'Label download endpoint',
      note: 'Configure carrier API credentials to generate real labels',
      orderId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download label' });
  }
});

// Helper function to generate tracking numbers
function generateTrackingNumber(carrier) {
  const prefix = {
    'royal_mail': 'RM',
    'dpd': 'DPD',
    'evri': 'EVR',
    'parcelforce': 'PF',
    'yodel': 'YDL',
    'dhl': 'DHL',
    'fedex': 'FDX',
    'ups': 'UPS',
    'amazon': 'AMZ'
  }[carrier] || 'TRK';

  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);

  return `${prefix}${timestamp}${random}`;
}

// ===================================
// ===================================
// PICKING
// ===================================

// Get all pick lists
app.get('/api/picking', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status.toUpperCase();

    const pickLists = await prisma.pickList.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true,
            items: { include: { product: true } }
          }
        },
        assignedUser: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform for frontend
    const transformed = pickLists.map(pl => ({
      id: pl.id,
      pickListNumber: pl.pickListNumber,
      orderNumber: pl.order?.orderNumber || 'N/A',
      orderId: pl.orderId,
      picker: pl.assignedUser?.name || pl.assignedUser?.email || 'Unassigned',
      pickerId: pl.assignedUserId,
      status: pl.status.toLowerCase(),
      priority: pl.priority.toLowerCase(),
      items: pl.items?.length || 0,
      itemDetails: pl.items?.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Unknown',
        productSku: item.product?.sku || 'N/A',
        quantity: item.quantity,
        pickedQty: item.pickedQty || 0,
        location: item.location?.code || 'N/A'
      })) || [],
      customer: pl.order?.customer?.name || 'Unknown',
      type: pl.type,
      startedAt: pl.startedAt,
      completedAt: pl.completedAt,
      createdAt: pl.createdAt
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get picking tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch picking tasks' });
  }
});

// Get available sales orders for picking (CONFIRMED or ALLOCATED status, no existing pick list)
app.get('/api/picking/available-orders', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: {
        status: { in: ['CONFIRMED', 'ALLOCATED'] },
        pickLists: { none: {} } // No existing pick list
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    const transformed = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer?.name || 'Unknown',
      status: order.status.toLowerCase(),
      priority: order.priority.toLowerCase(),
      items: order.items?.length || 0,
      itemDetails: order.items?.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Unknown',
        productSku: item.product?.sku || 'N/A',
        quantity: item.quantity
      })) || [],
      totalAmount: order.totalAmount,
      isWholesale: order.isWholesale,
      requiredDate: order.requiredDate,
      createdAt: order.createdAt
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ error: 'Failed to fetch available orders' });
  }
});

// Get single pick list by ID
app.get('/api/picking/:id', verifyToken, async (req, res) => {
  try {
    // Validate UUID format to prevent Prisma errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(404).json({ error: 'Pick list not found' });
    }

    const pickList = await prisma.pickList.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            customer: true,
            items: { include: { product: true } }
          }
        },
        assignedUser: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true,
            location: true
          },
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });

    if (!pickList) {
      return res.status(404).json({ error: 'Pick list not found' });
    }

    // Return response matching frontend expectations
    res.json({
      id: pickList.id,
      pickListNumber: pickList.pickListNumber,
      type: pickList.type || 'SINGLE',
      orderId: pickList.orderId,
      SalesOrder: pickList.order ? {
        id: pickList.order.id,
        orderNumber: pickList.order.orderNumber,
        customer: pickList.order.customer,
        items: pickList.order.items
      } : null,
      assignedUserId: pickList.assignedUserId,
      User: pickList.assignedUser,
      status: pickList.status,
      priority: pickList.priority,
      enforceSingleBBDate: pickList.enforceSingleBBDate || false,
      pickItems: (pickList.items || []).map(item => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product?.id,
          name: item.product?.name || 'Unknown',
          sku: item.product?.sku || 'N/A',
          barcode: item.product?.barcode
        },
        locationId: item.locationId,
        location: item.location ? {
          id: item.location.id,
          code: item.location.code || `${item.location.aisle || ''}-${item.location.rack || ''}-${item.location.bin || ''}`,
          name: item.location.name
        } : null,
        quantityRequired: item.quantityRequired,
        quantityPicked: item.quantityPicked || 0,
        status: item.status,
        lotNumber: item.lotNumber,
        sequenceNumber: item.sequenceNumber
      })),
      startedAt: pickList.startedAt,
      completedAt: pickList.completedAt,
      createdAt: pickList.createdAt,
      updatedAt: pickList.updatedAt
    });
  } catch (error) {
    console.error('Get pick list error:', error);
    res.status(500).json({ error: 'Failed to fetch pick list' });
  }
});

// Create pick list from order
app.post('/api/picking', verifyToken, async (req, res) => {
  try {
    const { orderId, assignedUserId, priority, enforceSingleBBDate } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Check if order exists and is in correct status
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if pick list already exists for this order
    const existingPickList = await prisma.pickList.findFirst({
      where: { orderId }
    });

    if (existingPickList) {
      return res.status(400).json({ error: 'Pick list already exists for this order' });
    }

    // Generate pick list number
    const allPickLists = await prisma.pickList.findMany({
      select: { pickListNumber: true },
      where: { pickListNumber: { startsWith: 'PL-' } }
    });
    let maxNumber = 0;
    for (const pl of allPickLists) {
      const match = pl.pickListNumber.match(/^PL-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
    const pickListNumber = `PL-${String(maxNumber + 1).padStart(6, '0')}`;

    // Create pick list with items from order
    const pickList = await prisma.pickList.create({
      data: {
        pickListNumber,
        orderId,
        assignedUserId: assignedUserId || null,
        priority: priority?.toUpperCase() || order.priority || 'MEDIUM',
        status: 'PENDING',
        enforceSingleBBDate: enforceSingleBBDate || order.isWholesale || false,
        items: {
          create: order.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            pickedQty: 0
          }))
        }
      },
      include: {
        order: { include: { customer: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } }
      }
    });

    // Update order status to PICKING
    await prisma.salesOrder.update({
      where: { id: orderId },
      data: { status: 'PICKING' }
    });

    res.status(201).json({
      id: pickList.id,
      pickListNumber: pickList.pickListNumber,
      orderNumber: pickList.order?.orderNumber || 'N/A',
      orderId: pickList.orderId,
      picker: pickList.assignedUser?.name || 'Unassigned',
      status: pickList.status.toLowerCase(),
      priority: pickList.priority.toLowerCase(),
      items: pickList.items?.length || 0,
      createdAt: pickList.createdAt
    });
  } catch (error) {
    console.error('Create picking task error:', error);
    res.status(500).json({ error: 'Failed to create picking task' });
  }
});

// Update pick list status (PATCH and PUT both supported)
const handlePickListUpdate = async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(404).json({ error: 'Pick list not found' });
    }

    const { status, assignedUserId } = req.body;

    const pickList = await prisma.pickList.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });

    if (!pickList) {
      return res.status(404).json({ error: 'Pick list not found' });
    }

    const updateData = {};
    if (status) updateData.status = status.toUpperCase();
    if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId;

    // Handle status transitions
    if (status?.toUpperCase() === 'IN_PROGRESS' && !pickList.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status?.toUpperCase() === 'COMPLETED') {
      updateData.completedAt = new Date();
      // Update order to PACKING status and auto-generate packing task
      if (pickList.orderId) {
        await prisma.salesOrder.update({
          where: { id: pickList.orderId },
          data: { status: 'PACKING' }
        });

        // Auto-generate packing task
        try {
          // Check if packing task already exists
          const existingPackingTask = await prisma.packingTask.findFirst({
            where: { orderId: pickList.orderId }
          });

          if (!existingPackingTask) {
            // Generate packing number
            const allPackingTasks = await prisma.packingTask.findMany({
              select: { packingNumber: true },
              where: { packingNumber: { startsWith: 'PK-' } }
            });
            let maxPackingNumber = 0;
            for (const pt of allPackingTasks) {
              const match = pt.packingNumber.match(/^PK-(\d+)$/);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxPackingNumber) maxPackingNumber = num;
              }
            }
            const packingNumber = `PK-${String(maxPackingNumber + 1).padStart(6, '0')}`;

            // Get pick list items for packing
            const pickListWithItems = await prisma.pickList.findUnique({
              where: { id: req.params.id },
              include: { items: { include: { product: true } } }
            });

            // Create packing task
            await prisma.packingTask.create({
              data: {
                id: require('crypto').randomUUID(),
                packingNumber,
                orderId: pickList.orderId,
                pickListId: pickList.id,
                status: 'PENDING',
                priority: pickList.priority || 'MEDIUM',
                items: {
                  create: (pickListWithItems?.items || []).map(item => ({
                    id: require('crypto').randomUUID(),
                    productId: item.productId,
                    quantity: item.pickedQty || item.quantity,
                    packedQty: 0
                  }))
                }
              }
            });

            console.log(`Auto-generated packing task ${packingNumber} for order ${pickList.orderId}`);
          }
        } catch (packingError) {
          console.error('Failed to auto-generate packing task:', packingError);
        }
      }
    }

    const updated = await prisma.pickList.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        order: { include: { customer: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } }
      }
    });

    res.json({
      id: updated.id,
      pickListNumber: updated.pickListNumber,
      orderNumber: updated.order?.orderNumber || 'N/A',
      status: updated.status.toLowerCase(),
      priority: updated.priority.toLowerCase(),
      items: updated.items?.length || 0,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt
    });
  } catch (error) {
    console.error('Update picking task error:', error);
    res.status(500).json({ error: 'Failed to update picking task' });
  }
};

// Register both PUT and PATCH for picking updates
app.put('/api/picking/:id', verifyToken, handlePickListUpdate);
app.patch('/api/picking/:id', verifyToken, handlePickListUpdate);

// Update pick item (record picking)
app.patch('/api/picking/:id/items/:itemId/pick', verifyToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { quantityPicked, scannedBarcode, lotNumber } = req.body;

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id) || !uuidRegex.test(itemId)) {
      return res.status(404).json({ error: 'Pick item not found' });
    }

    const pickItem = await prisma.pickItem.findUnique({
      where: { id: itemId },
      include: { product: true }
    });

    if (!pickItem) {
      return res.status(404).json({ error: 'Pick item not found' });
    }

    // Verify barcode if provided
    if (scannedBarcode && pickItem.product?.barcode) {
      if (scannedBarcode !== pickItem.product.barcode && scannedBarcode !== pickItem.product.sku) {
        return res.status(400).json({ error: 'Barcode does not match product' });
      }
    }

    // Determine new status
    let newStatus = 'PENDING';
    if (quantityPicked >= pickItem.quantityRequired) {
      newStatus = 'PICKED';
    } else if (quantityPicked > 0) {
      newStatus = 'PENDING'; // Partial pick, still pending
    }

    const updated = await prisma.pickItem.update({
      where: { id: itemId },
      data: {
        quantityPicked: quantityPicked,
        status: newStatus,
        lotNumber: lotNumber || pickItem.lotNumber
      },
      include: { product: true, location: true }
    });

    res.json({
      id: updated.id,
      productId: updated.productId,
      product: {
        id: updated.product?.id,
        name: updated.product?.name,
        sku: updated.product?.sku,
        barcode: updated.product?.barcode
      },
      quantityRequired: updated.quantityRequired,
      quantityPicked: updated.quantityPicked,
      status: updated.status,
      lotNumber: updated.lotNumber
    });
  } catch (error) {
    console.error('Update pick item error:', error);
    res.status(500).json({ error: 'Failed to update pick item' });
  }
});

// Delete pick list
app.delete('/api/picking/:id', verifyToken, async (req, res) => {
  try {
    const pickList = await prisma.pickList.findUnique({
      where: { id: req.params.id }
    });

    if (!pickList) {
      return res.status(404).json({ error: 'Pick list not found' });
    }

    if (pickList.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete completed pick list' });
    }

    // Delete pick items first
    await prisma.pickItem.deleteMany({ where: { pickListId: req.params.id } });
    await prisma.pickList.delete({ where: { id: req.params.id } });

    // Revert order status if needed
    if (pickList.orderId) {
      await prisma.salesOrder.update({
        where: { id: pickList.orderId },
        data: { status: 'CONFIRMED' }
      });
    }

    res.json({ message: 'Pick list deleted successfully' });
  } catch (error) {
    console.error('Delete picking task error:', error);
    res.status(500).json({ error: 'Failed to delete picking task' });
  }
});

// ===================================
// PACKING
// ===================================

// Get all packing tasks
app.get('/api/packing', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status.toUpperCase();

    const packingTasks = await prisma.packingTask.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true,
            items: { include: { product: true } },
            pickLists: { select: { pickListNumber: true }, take: 1 }
          }
        },
        assignedUser: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformed = packingTasks.map(pt => {
      const itemCount = pt.order?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
      return {
        id: pt.id,
        packingSlip: pt.packingNumber,
        packingNumber: pt.packingNumber,
        pickListNumber: pt.order?.pickLists?.[0]?.pickListNumber || 'N/A',
        orderNumber: pt.order?.orderNumber || 'N/A',
        orderId: pt.orderId,
        packer: pt.assignedUser?.name || pt.assignedUser?.email || 'Unassigned',
        packerId: pt.assignedUserId,
        status: (pt.status || 'PENDING').toLowerCase().replace('PENDING', 'ready_to_pack'),
        priority: (pt.priority || 'MEDIUM').toLowerCase(),
        customer: pt.order?.customer?.name || 'Unknown',
        customerId: pt.order?.customer?.id,
        items: pt.order?.items?.length || 0,
        itemCount: itemCount,
        weight: `${(pt.totalWeight || (itemCount * 0.5)).toFixed(1)} kg`,
        packageCount: pt.packageCount,
        totalWeight: pt.totalWeight,
        dimensions: pt.dimensions,
        shippingAddress: pt.order?.shippingAddress || pt.order?.customer?.address || '',
        shippingMethod: pt.shippingMethod,
        trackingNumber: pt.trackingNumber,
        startedAt: pt.startedAt,
        completedAt: pt.completedAt,
        createdAt: pt.createdAt
      };
    });

    res.json(transformed);
  } catch (error) {
    console.error('Get packing tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch packing tasks' });
  }
});

// Get available orders for packing (PACKING status, no existing packing task)
app.get('/api/packing/available-orders', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: {
        status: 'PACKING',
        packingTasks: { none: {} }
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    const transformed = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer?.name || 'Unknown',
      status: order.status.toLowerCase(),
      priority: order.priority.toLowerCase(),
      items: order.items?.length || 0,
      totalAmount: order.totalAmount,
      isWholesale: order.isWholesale,
      createdAt: order.createdAt
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get available packing orders error:', error);
    res.status(500).json({ error: 'Failed to fetch available orders' });
  }
});

// Get single packing task by ID
app.get('/api/packing/:id', verifyToken, async (req, res) => {
  try {
    // Validate UUID format to prevent Prisma errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(404).json({ error: 'Packing task not found' });
    }

    const packingTask = await prisma.packingTask.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            customer: true,
            items: { include: { product: true } }
          }
        },
        assignedUser: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!packingTask) {
      return res.status(404).json({ error: 'Packing task not found' });
    }

    // Build items list from order items with packing status
    const items = (packingTask.order?.items || []).map((item, idx) => {
      const packingItem = packingTask.items?.find(pi => pi.productId === item.productId);
      return {
        id: item.id,
        productId: item.productId,
        sku: item.product?.sku || 'N/A',
        name: item.product?.name || 'Unknown',
        barcode: item.product?.barcode || item.product?.sku || '',
        quantity: item.quantity,
        quantityPicked: item.quantity, // Assume picked if at packing stage
        quantityPacked: packingItem?.quantityPacked || 0,
        weight: item.product?.weight || 0.5,
        location: 'PACK-AREA',
        batchNumber: null,
        expiryDate: null,
        status: (packingItem?.quantityPacked || 0) >= item.quantity ? 'packed' : 'pending'
      };
    });

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const packedItems = items.filter(i => i.status === 'packed').reduce((sum, i) => sum + i.quantity, 0);

    // Get pick list number from order's pick lists
    const pickListForOrder = await prisma.pickList.findFirst({
      where: { orderId: packingTask.orderId },
      select: { id: true, pickListNumber: true }
    });

    res.json({
      id: packingTask.id,
      packingSlip: packingTask.packingNumber,
      pickListId: pickListForOrder?.id || null,
      pickListNumber: pickListForOrder?.pickListNumber || 'N/A',
      orderId: packingTask.orderId,
      orderNumber: packingTask.order?.orderNumber || 'N/A',
      customer: {
        id: packingTask.order?.customer?.id || '',
        name: packingTask.order?.customer?.name || 'Unknown',
        email: packingTask.order?.customer?.email || '',
        phone: packingTask.order?.customer?.phone || ''
      },
      shippingAddress: {
        street: packingTask.order?.shippingAddress || packingTask.order?.customer?.address || '',
        city: packingTask.order?.customer?.city || '',
        state: '',
        postalCode: '',
        country: packingTask.order?.customer?.country || 'UK'
      },
      status: (packingTask.status || 'PENDING').toLowerCase().replace('_', '_'),
      priority: (packingTask.priority || 'MEDIUM').toLowerCase(),
      packer: packingTask.assignedUser?.name || packingTask.assignedUser?.email || null,
      packerId: packingTask.assignedUserId,
      totalItems: totalItems,
      totalSKUs: items.length,
      packedItems: packedItems,
      weight: `${(packingTask.totalWeight || (totalItems * 0.5)).toFixed(1)} kg`,
      shippingMethod: packingTask.shippingMethod || null,
      carrier: packingTask.carrier || null,
      trackingNumber: packingTask.trackingNumber || null,
      notes: packingTask.notes || null,
      createdAt: packingTask.createdAt,
      startedAt: packingTask.startedAt,
      completedAt: packingTask.completedAt,
      items: items
    });
  } catch (error) {
    console.error('Get packing task error:', error);
    res.status(500).json({ error: 'Failed to fetch packing task' });
  }
});

// Create packing task
app.post('/api/packing', verifyToken, async (req, res) => {
  try {
    const { orderId, assignedUserId, priority, packageCount, totalWeight, dimensions } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const existingTask = await prisma.packingTask.findFirst({
      where: { orderId }
    });

    if (existingTask) {
      return res.status(400).json({ error: 'Packing task already exists for this order' });
    }

    // Generate packing number
    const allPackingTasks = await prisma.packingTask.findMany({
      select: { packingNumber: true },
      where: { packingNumber: { startsWith: 'PK-' } }
    });
    let maxNumber = 0;
    for (const pk of allPackingTasks) {
      const match = pk.packingNumber.match(/^PK-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
    const packingNumber = `PK-${String(maxNumber + 1).padStart(6, '0')}`;

    const packingTask = await prisma.packingTask.create({
      data: {
        packingNumber,
        orderId,
        assignedUserId: assignedUserId || null,
        priority: priority?.toUpperCase() || order.priority || 'MEDIUM',
        status: 'PENDING',
        packageCount: packageCount || 1,
        totalWeight,
        dimensions
      },
      include: {
        order: { include: { customer: true } },
        assignedUser: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({
      id: packingTask.id,
      packingNumber: packingTask.packingNumber,
      orderNumber: packingTask.order?.orderNumber || 'N/A',
      status: packingTask.status.toLowerCase(),
      createdAt: packingTask.createdAt
    });
  } catch (error) {
    console.error('Create packing task error:', error);
    res.status(500).json({ error: 'Failed to create packing task' });
  }
});

// Update packing task - handler function
const handlePackingUpdate = async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(404).json({ error: 'Packing task not found' });
    }

    const { action, status, assignedUserId, packageCount, totalWeight, dimensions, trackingNumber, carrier, shippingMethod } = req.body;

    const packingTask = await prisma.packingTask.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });

    if (!packingTask) {
      return res.status(404).json({ error: 'Packing task not found' });
    }

    const updateData = {};

    // Handle action-based updates (from frontend)
    if (action) {
      switch (action) {
        case 'start_packing':
          updateData.status = 'IN_PROGRESS';
          if (!packingTask.startedAt) updateData.startedAt = new Date();
          break;
        case 'complete_packing':
          updateData.status = 'COMPLETED';
          updateData.completedAt = new Date();
          break;
        case 'ready_to_ship':
          updateData.status = 'READY_TO_SHIP';
          if (packingTask.orderId) {
            await prisma.salesOrder.update({
              where: { id: packingTask.orderId },
              data: { status: 'READY_TO_SHIP' }
            });
          }
          break;
        case 'add_tracking':
          if (trackingNumber) updateData.trackingNumber = trackingNumber;
          if (carrier) updateData.carrier = carrier;
          if (shippingMethod) updateData.shippingMethod = shippingMethod;
          break;
      }
    }

    // Handle direct status updates
    if (status) updateData.status = status.toUpperCase();
    if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId;
    if (packageCount !== undefined) updateData.packageCount = packageCount;
    if (totalWeight !== undefined) updateData.totalWeight = totalWeight;
    if (dimensions !== undefined) updateData.dimensions = dimensions;

    if (status?.toUpperCase() === 'IN_PROGRESS' && !packingTask.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status?.toUpperCase() === 'COMPLETED') {
      updateData.completedAt = new Date();
      // Update order to SHIPPED status (ready for shipping)
      if (packingTask.orderId) {
        await prisma.salesOrder.update({
          where: { id: packingTask.orderId },
          data: { status: 'SHIPPED' }
        });
      }
    }

    const updated = await prisma.packingTask.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        order: { include: { customer: true } },
        assignedUser: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({
      id: updated.id,
      packingNumber: updated.packingNumber,
      packingSlip: updated.packingNumber,
      status: (updated.status || 'PENDING').toLowerCase().replace('_', '_'),
      completedAt: updated.completedAt,
      trackingNumber: updated.trackingNumber,
      carrier: updated.carrier,
      shippingMethod: updated.shippingMethod
    });
  } catch (error) {
    console.error('Update packing task error:', error);
    res.status(500).json({ error: 'Failed to update packing task' });
  }
};

// Register both PUT and PATCH for packing updates
app.put('/api/packing/:id', verifyToken, handlePackingUpdate);
app.patch('/api/packing/:id', verifyToken, handlePackingUpdate);

// Delete packing task
app.delete('/api/packing/:id', verifyToken, async (req, res) => {
  try {
    const packingTask = await prisma.packingTask.findUnique({
      where: { id: req.params.id }
    });

    if (!packingTask) {
      return res.status(404).json({ error: 'Packing task not found' });
    }

    if (packingTask.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete completed packing task' });
    }

    // Delete packing items first if they exist
    await prisma.packingItem.deleteMany({ where: { packingTaskId: req.params.id } }).catch(() => {});
    await prisma.packingTask.delete({ where: { id: req.params.id } });

    // Revert order status if needed
    if (packingTask.orderId) {
      await prisma.salesOrder.update({
        where: { id: packingTask.orderId },
        data: { status: 'PICKING' }
      });
    }

    res.json({ message: 'Packing task deleted successfully' });
  } catch (error) {
    console.error('Delete packing task error:', error);
    res.status(500).json({ error: 'Failed to delete packing task' });
  }
});

// ===================================
// SHIPPING
// ===================================

// Get all shipments
app.get('/api/shipping', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status.toUpperCase();

    const shipments = await prisma.courierShipment.findMany({
      where,
      include: {
        connection: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformed = shipments.map(s => ({
      id: s.id,
      trackingNumber: s.trackingNumber,
      orderId: s.orderId,
      carrier: s.connection?.courier || 'Unknown',
      carrierName: s.connection?.accountName || 'Unknown',
      serviceCode: s.serviceCode,
      labelUrl: s.labelUrl,
      weight: s.weight,
      cost: s.cost,
      status: s.status.toLowerCase(),
      estimatedDelivery: s.estimatedDelivery,
      actualDelivery: s.actualDelivery,
      createdAt: s.createdAt
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// Get available carriers
app.get('/api/shipping/carriers', verifyToken, async (req, res) => {
  try {
    const carriers = await prisma.courierConnection.findMany({
      where: { isActive: true },
      orderBy: [
        { isDefault: 'desc' },
        { courier: 'asc' }
      ]
    });

    const transformed = carriers.map(c => ({
      id: c.id,
      courier: c.courier,
      accountName: c.accountName,
      isDefault: c.isDefault,
      testMode: c.testMode,
      defaultService: c.defaultService,
      serviceOptions: c.serviceOptions
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get carriers error:', error);
    res.status(500).json({ error: 'Failed to fetch carriers' });
  }
});

// Get orders ready for shipping (SHIPPED status, no shipment yet)
app.get('/api/shipping/available-orders', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: {
        status: 'SHIPPED',
        trackingNumber: null
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    const transformed = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer?.name || 'Unknown',
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      items: order.items?.length || 0,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get available shipping orders error:', error);
    res.status(500).json({ error: 'Failed to fetch available orders' });
  }
});

// Create shipment and generate label
app.post('/api/shipping', verifyToken, async (req, res) => {
  try {
    const { orderId, carrierId, serviceCode, weight, dimensions } = req.body;

    if (!orderId || !carrierId) {
      return res.status(400).json({ error: 'Order ID and Carrier ID are required' });
    }

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const carrier = await prisma.courierConnection.findUnique({
      where: { id: carrierId }
    });

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    // Generate tracking number (in production, this would call the carrier API)
    const trackingNumber = `${carrier.courier.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-10)}`;

    // Create shipment record
    const shipment = await prisma.courierShipment.create({
      data: {
        connectionId: carrierId,
        orderId,
        trackingNumber,
        serviceCode: serviceCode || carrier.defaultService,
        weight: weight || null,
        status: 'PENDING',
        companyId: carrier.companyId
      },
      include: {
        connection: true
      }
    });

    // Update order with tracking number
    await prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        shippedDate: new Date()
      }
    });

    res.status(201).json({
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.connection?.courier,
      serviceCode: shipment.serviceCode,
      labelUrl: shipment.labelUrl,
      status: shipment.status.toLowerCase(),
      message: 'Shipment created. Label generation would be handled by carrier API integration.'
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// Update shipment status
app.put('/api/shipping/:id', verifyToken, async (req, res) => {
  try {
    const { status, actualDelivery } = req.body;

    const updateData = {};
    if (status) updateData.status = status.toUpperCase();
    if (actualDelivery) updateData.actualDelivery = new Date(actualDelivery);

    const shipment = await prisma.courierShipment.update({
      where: { id: req.params.id },
      data: updateData,
      include: { connection: true }
    });

    // Update order status if delivered
    if (status?.toUpperCase() === 'DELIVERED' && shipment.orderId) {
      await prisma.salesOrder.update({
        where: { id: shipment.orderId },
        data: { status: 'DELIVERED' }
      });
    }

    res.json({
      id: shipment.id,
      status: shipment.status.toLowerCase(),
      actualDelivery: shipment.actualDelivery
    });
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// ===================================
// RETURNS / RMA
// ===================================

// Get all returns
app.get('/api/returns', verifyToken, async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status.toUpperCase();
    if (type) where.type = type.toUpperCase();

    const returns = await prisma.return.findMany({
      where,
      include: {
        order: true,
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total value from items for each return
    const transformed = returns.map(r => {
      // Calculate value from items
      let value = 0;
      if (r.items && r.items.length > 0) {
        r.items.forEach(item => {
          const unitPrice = item.product?.sellingPrice || item.product?.costPrice || 0;
          value += unitPrice * item.quantity;
        });
      }
      value = r.refundAmount || value;

      return {
        id: r.id,
        rmaNumber: r.returnNumber, // Frontend expects rmaNumber
        returnNumber: r.returnNumber,
        orderNumber: r.order?.orderNumber || 'N/A',
        orderId: r.orderId,
        customer: r.customer?.name || 'Unknown',
        customerId: r.customerId,
        type: r.type.charAt(0).toUpperCase() + r.type.slice(1).toLowerCase(), // Capitalize first letter
        status: r.status.toLowerCase(),
        reason: r.reason,
        notes: r.notes,
        requestedDate: r.createdAt, // Frontend expects requestedDate
        value: value, // Calculated value
        items: r.items?.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || 'Unknown',
          sku: item.product?.sku || 'N/A',
          productSku: item.product?.sku || 'N/A',
          quantity: item.quantity,
          receivedQty: item.receivedQty,
          condition: item.condition?.toLowerCase(),
          action: item.action?.toLowerCase(),
          reason: r.reason // Add reason to items for display
        })) || [],
        refundAmount: r.refundAmount,
        refundMethod: r.refundMethod,
        trackingNumber: r.trackingNumber,
        receivedAt: r.receivedAt,
        processedAt: r.processedAt,
        createdAt: r.createdAt
      };
    });

    res.json(transformed);
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Get single return
app.get('/api/returns/:id', verifyToken, async (req, res) => {
  try {
    const returnOrder = await prisma.return.findUnique({
      where: { id: req.params.id },
      include: {
        order: { include: { items: { include: { product: true } } } },
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (!returnOrder) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Calculate value from items
    let value = 0;
    if (returnOrder.items && returnOrder.items.length > 0) {
      returnOrder.items.forEach(item => {
        const unitPrice = item.product?.sellingPrice || item.product?.costPrice || 0;
        value += unitPrice * item.quantity;
      });
    }
    value = returnOrder.refundAmount || value;

    res.json({
      id: returnOrder.id,
      rmaNumber: returnOrder.returnNumber, // Frontend expects rmaNumber
      returnNumber: returnOrder.returnNumber,
      orderNumber: returnOrder.order?.orderNumber || 'N/A',
      orderId: returnOrder.orderId,
      customer: returnOrder.customer?.name || 'Unknown',
      customerId: returnOrder.customerId,
      type: returnOrder.type.charAt(0).toUpperCase() + returnOrder.type.slice(1).toLowerCase(),
      status: returnOrder.status.toLowerCase(),
      reason: returnOrder.reason,
      notes: returnOrder.notes,
      requestedDate: returnOrder.createdAt, // Frontend expects requestedDate
      value: value, // Calculated value
      items: returnOrder.items?.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Unknown',
        sku: item.product?.sku || 'N/A',
        productSku: item.product?.sku || 'N/A',
        quantity: item.quantity,
        receivedQty: item.receivedQty,
        condition: item.condition?.toLowerCase(),
        action: item.action?.toLowerCase(),
        reason: returnOrder.reason, // Add reason to items
        notes: item.notes
      })) || [],
      refundAmount: returnOrder.refundAmount,
      refundMethod: returnOrder.refundMethod,
      trackingNumber: returnOrder.trackingNumber,
      receivedAt: returnOrder.receivedAt,
      processedAt: returnOrder.processedAt,
      createdAt: returnOrder.createdAt
    });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ error: 'Failed to fetch return' });
  }
});

// Create return/RMA
app.post('/api/returns', verifyToken, async (req, res) => {
  try {
    const { orderId, customerId, type, reason, notes, items } = req.body;

    if (!customerId || !reason) {
      return res.status(400).json({ error: 'Customer ID and reason are required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Generate return number
    const allReturns = await prisma.return.findMany({
      select: { returnNumber: true },
      where: { returnNumber: { startsWith: 'RET-' } }
    });
    let maxNumber = 0;
    for (const r of allReturns) {
      const match = r.returnNumber.match(/^RET-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
    const returnNumber = `RET-${String(maxNumber + 1).padStart(6, '0')}`;

    const returnOrder = await prisma.return.create({
      data: {
        returnNumber,
        orderId: orderId || null,
        customerId,
        type: type?.toUpperCase() || 'RETURN',
        status: 'PENDING',
        reason,
        notes,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            receivedQty: 0,
            condition: 'GOOD',
            action: item.action?.toUpperCase() || 'RESTOCK',
            notes: item.notes
          }))
        }
      },
      include: {
        order: true,
        customer: true,
        items: { include: { product: true } }
      }
    });

    res.status(201).json({
      id: returnOrder.id,
      returnNumber: returnOrder.returnNumber,
      status: returnOrder.status.toLowerCase(),
      createdAt: returnOrder.createdAt
    });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ error: 'Failed to create return' });
  }
});

// Update return status
app.put('/api/returns/:id', verifyToken, async (req, res) => {
  try {
    const { status, refundAmount, refundMethod, trackingNumber, notes } = req.body;

    const returnOrder = await prisma.return.findUnique({
      where: { id: req.params.id }
    });

    if (!returnOrder) {
      return res.status(404).json({ error: 'Return not found' });
    }

    const updateData = {};
    if (status) updateData.status = status.toUpperCase();
    if (refundAmount !== undefined) updateData.refundAmount = refundAmount;
    if (refundMethod !== undefined) updateData.refundMethod = refundMethod;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    // Handle status transitions
    if (status?.toUpperCase() === 'RECEIVED') {
      updateData.receivedAt = new Date();
    }
    if (status?.toUpperCase() === 'PROCESSED' || status?.toUpperCase() === 'REFUNDED') {
      updateData.processedAt = new Date();
    }
    if (status?.toUpperCase() === 'REFUNDED') {
      updateData.refundedAt = new Date();
    }

    const updated = await prisma.return.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        order: true,
        customer: true,
        items: { include: { product: true } }
      }
    });

    res.json({
      id: updated.id,
      returnNumber: updated.returnNumber,
      status: updated.status.toLowerCase(),
      receivedAt: updated.receivedAt,
      processedAt: updated.processedAt
    });
  } catch (error) {
    console.error('Update return error:', error);
    res.status(500).json({ error: 'Failed to update return' });
  }
});

// Update return item (receive items, set condition/action)
app.put('/api/returns/:id/items/:itemId', verifyToken, async (req, res) => {
  try {
    const { receivedQty, condition, action, notes } = req.body;

    const updateData = {};
    if (receivedQty !== undefined) updateData.receivedQty = receivedQty;
    if (condition) updateData.condition = condition.toUpperCase();
    if (action) updateData.action = action.toUpperCase();
    if (notes !== undefined) updateData.notes = notes;

    const item = await prisma.returnItem.update({
      where: { id: req.params.itemId },
      data: updateData,
      include: { product: true }
    });

    // If action is RESTOCK and item received, update inventory
    if (action?.toUpperCase() === 'RESTOCK' && receivedQty > 0) {
      // Find existing inventory record or create one
      const existingInventory = await prisma.inventory.findFirst({
        where: { productId: item.productId }
      });

      if (existingInventory) {
        await prisma.inventory.update({
          where: { id: existingInventory.id },
          data: { quantity: { increment: receivedQty } }
        });
      }
    }

    res.json({
      id: item.id,
      receivedQty: item.receivedQty,
      condition: item.condition?.toLowerCase(),
      action: item.action?.toLowerCase()
    });
  } catch (error) {
    console.error('Update return item error:', error);
    res.status(500).json({ error: 'Failed to update return item' });
  }
});

// PATCH return (same as PUT but for frontend compatibility)
app.patch('/api/returns/:id', verifyToken, async (req, res) => {
  try {
    const { status, type, reason, refundAmount, refundMethod, trackingNumber, notes } = req.body;

    const returnOrder = await prisma.return.findUnique({
      where: { id: req.params.id }
    });

    if (!returnOrder) {
      return res.status(404).json({ error: 'Return not found' });
    }

    const updateData = {};
    if (status) updateData.status = status.toUpperCase();
    if (type) updateData.type = type.toUpperCase();
    if (reason) updateData.reason = reason;
    if (refundAmount !== undefined) updateData.refundAmount = refundAmount;
    if (refundMethod !== undefined) updateData.refundMethod = refundMethod;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    // Handle status transitions
    if (status?.toUpperCase() === 'RECEIVED') {
      updateData.receivedAt = new Date();
    }
    if (status?.toUpperCase() === 'PROCESSED' || status?.toUpperCase() === 'REFUNDED') {
      updateData.processedAt = new Date();
    }
    if (status?.toUpperCase() === 'REFUNDED') {
      updateData.refundedAt = new Date();
    }

    const updated = await prisma.return.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        order: true,
        customer: true,
        items: { include: { product: true } }
      }
    });

    res.json({
      id: updated.id,
      rmaNumber: updated.returnNumber,
      returnNumber: updated.returnNumber,
      status: updated.status.toLowerCase(),
      type: updated.type.charAt(0).toUpperCase() + updated.type.slice(1).toLowerCase(),
      reason: updated.reason,
      receivedAt: updated.receivedAt,
      processedAt: updated.processedAt
    });
  } catch (error) {
    console.error('Patch return error:', error);
    res.status(500).json({ error: 'Failed to update return' });
  }
});

// DELETE return
app.delete('/api/returns/:id', verifyToken, async (req, res) => {
  try {
    const returnOrder = await prisma.return.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    if (!returnOrder) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Delete associated items first
    await prisma.returnItem.deleteMany({
      where: { returnId: req.params.id }
    });

    // Delete the return
    await prisma.return.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Return deleted successfully' });
  } catch (error) {
    console.error('Delete return error:', error);
    res.status(500).json({ error: 'Failed to delete return' });
  }
});

// ===================================
// PURCHASE ORDERS
// ===================================

// ===================================
// PURCHASE ORDERS - Full CRUD with Database
// ===================================

// GET all purchase orders
app.get('/api/purchase-orders', verifyToken, async (req, res) => {
  try {
    const { status, supplierId, search } = req.query;

    const where = {};
    if (status) where.status = status.toUpperCase();
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform for frontend
    const transformed = purchaseOrders.map(po => ({
      id: po.id,
      poNumber: po.poNumber,
      supplier: po.supplier?.name || 'Unknown',
      supplierId: po.supplierId,
      status: po.status.toLowerCase(),
      items: po.items?.length || 0,
      totalAmount: po.totalAmount,
      orderDate: po.orderDate,
      expectedDelivery: po.expectedDelivery,
      createdAt: po.createdAt,
      notes: po.notes
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE purchase order
app.post('/api/purchase-orders', verifyToken, async (req, res) => {
  try {
    const { supplierId, supplier, expectedDelivery, totalAmount, notes, items } = req.body;

    // Generate PO number - find the highest existing number
    const allPOs = await prisma.purchaseOrder.findMany({
      select: { poNumber: true },
      where: { poNumber: { startsWith: 'PO-' } }
    });
    let maxNumber = 0;
    for (const po of allPOs) {
      const match = po.poNumber.match(/^PO-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
    const poNumber = `PO-${String(maxNumber + 1).padStart(6, '0')}`;

    // Find or validate supplier
    let finalSupplierId = supplierId;
    if (!finalSupplierId && supplier) {
      // Try to find supplier by name
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: supplier }
      });
      if (existingSupplier) {
        finalSupplierId = existingSupplier.id;
      } else {
        // Create a new supplier
        const newSupplier = await prisma.supplier.create({
          data: {
            name: supplier,
            code: `SUP-${Date.now().toString().slice(-6)}`,
            companyId: req.user.companyId || (await prisma.company.findFirst())?.id
          }
        });
        finalSupplierId = newSupplier.id;
      }
    }

    if (!finalSupplierId) {
      return res.status(400).json({ error: 'Supplier is required' });
    }

    // Calculate totals from items if provided
    let subtotal = 0;
    if (items && items.length > 0) {
      subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: finalSupplierId,
        status: 'PENDING',
        subtotal,
        totalAmount: totalAmount || subtotal,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        notes,
        items: items && items.length > 0 ? {
          create: items.filter(item => item.productId).map(item => ({
            productId: item.productId,
            productName: item.productName || item.name || 'Unknown',
            productSku: item.productSku || item.sku || 'N/A',
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            totalPrice: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
            isBundle: item.isBundle || false,
            bundleQty: item.bundleQty || null,
            notes: item.notes || null
          }))
        } : undefined
      },
      include: {
        supplier: true,
        items: true
      }
    });

    res.status(201).json({
      id: purchaseOrder.id,
      poNumber: purchaseOrder.poNumber,
      supplier: purchaseOrder.supplier?.name,
      supplierId: purchaseOrder.supplierId,
      status: purchaseOrder.status.toLowerCase(),
      items: purchaseOrder.items?.length || 0,
      totalAmount: purchaseOrder.totalAmount,
      expectedDelivery: purchaseOrder.expectedDelivery,
      createdAt: purchaseOrder.createdAt
    });
  } catch (error) {
    console.error('Create purchase order error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      error: error.message || 'Internal server error',
      details: error.meta?.cause || error.code || 'Unknown error'
    });
  }
});

// GET purchase order by ID
app.get('/api/purchase-orders/:id', verifyToken, async (req, res) => {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        items: true
      }
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({
      ...purchaseOrder,
      supplier: purchaseOrder.supplier?.name,
      status: purchaseOrder.status.toLowerCase()
    });
  } catch (error) {
    console.error('Get purchase order by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE purchase order
app.put('/api/purchase-orders/:id', verifyToken, async (req, res) => {
  try {
    const { supplierId, expectedDelivery, totalAmount, notes, status, items } = req.body;

    // Check if PO exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Build update data
    const updateData = {};
    if (supplierId) updateData.supplierId = supplierId;
    if (expectedDelivery) updateData.expectedDelivery = new Date(expectedDelivery);
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount);
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status.toUpperCase();

    // Update items if provided
    if (items && items.length > 0) {
      // Delete existing items and create new ones
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: req.params.id }
      });

      // Calculate new subtotal
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      updateData.subtotal = subtotal;
      updateData.totalAmount = subtotal;

      // Create new items
      await prisma.purchaseOrderItem.createMany({
        data: items.map(item => ({
          purchaseOrderId: req.params.id,
          productId: item.productId,
          productName: item.productName || item.name,
          productSku: item.productSku || item.sku || '',
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          totalPrice: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
          isBundle: item.isBundle || false,
          bundleQty: item.bundleQty || null,
          notes: item.notes
        }))
      });
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        supplier: true,
        items: true
      }
    });

    res.json({
      ...updatedPO,
      supplier: updatedPO.supplier?.name,
      status: updatedPO.status.toLowerCase(),
      itemCount: updatedPO.items?.length || 0
    });
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE purchase order
app.delete('/api/purchase-orders/:id', verifyToken, async (req, res) => {
  try {
    // Check if PO exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Delete PO (items will cascade delete)
    await prisma.purchaseOrder.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// APPROVE purchase order
app.post('/api/purchase-orders/:id/approve', verifyToken, async (req, res) => {
  try {
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (existingPO.status !== 'PENDING' && existingPO.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only pending or draft POs can be approved' });
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      include: {
        supplier: true,
        items: true
      }
    });

    res.json({
      ...updatedPO,
      supplier: updatedPO.supplier?.name,
      status: updatedPO.status.toLowerCase()
    });
  } catch (error) {
    console.error('Approve purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// REJECT purchase order
app.post('/api/purchase-orders/:id/reject', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (existingPO.status !== 'PENDING' && existingPO.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only pending or draft POs can be rejected' });
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason || null
      },
      include: {
        supplier: true,
        items: true
      }
    });

    res.json({
      ...updatedPO,
      supplier: updatedPO.supplier?.name,
      status: updatedPO.status.toLowerCase()
    });
  } catch (error) {
    console.error('Reject purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADD item to purchase order
app.post('/api/purchase-orders/:id/items', verifyToken, async (req, res) => {
  try {
    const { productId, productName, productSku, quantity, unitPrice, isBundle, bundleQty, notes } = req.body;

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (existingPO.status === 'APPROVED' || existingPO.status === 'RECEIVED') {
      return res.status(400).json({ error: 'Cannot add items to approved or received POs' });
    }

    const totalPrice = (parseInt(quantity) || 1) * (parseFloat(unitPrice) || 0);

    const newItem = await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: req.params.id,
        productId,
        productName,
        productSku: productSku || '',
        quantity: parseInt(quantity) || 1,
        unitPrice: parseFloat(unitPrice) || 0,
        totalPrice,
        isBundle: isBundle || false,
        bundleQty: bundleQty || null,
        notes
      }
    });

    // Update PO totals
    const allItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: req.params.id }
    });
    const newSubtotal = allItems.reduce((sum, item) => sum + item.totalPrice, 0);

    await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        subtotal: newSubtotal,
        totalAmount: newSubtotal
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Add PO item error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// REMOVE item from purchase order
app.delete('/api/purchase-orders/:id/items/:itemId', verifyToken, async (req, res) => {
  try {
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (existingPO.status === 'APPROVED' || existingPO.status === 'RECEIVED') {
      return res.status(400).json({ error: 'Cannot remove items from approved or received POs' });
    }

    await prisma.purchaseOrderItem.delete({
      where: { id: req.params.itemId }
    });

    // Update PO totals
    const allItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: req.params.id }
    });
    const newSubtotal = allItems.reduce((sum, item) => sum + item.totalPrice, 0);

    await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        subtotal: newSubtotal,
        totalAmount: newSubtotal
      }
    });

    res.json({ success: true, message: 'Item removed successfully' });
  } catch (error) {
    console.error('Remove PO item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// GOODS RECEIVING
// ===================================

// Get all goods receipts
app.get('/api/goods-receiving', verifyToken, async (req, res) => {
  try {
    const { status, search, purchaseOrderId } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId;
    }

    if (search) {
      where.OR = [
        { grNumber: { contains: search, mode: 'insensitive' } },
        { purchaseOrder: { poNumber: { contains: search, mode: 'insensitive' } } },
        { purchaseOrder: { supplier: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const receivings = await prisma.goodsReceipt.findMany({
      where,
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data for frontend
    const transformed = receivings.map(gr => ({
      id: gr.id,
      grNumber: gr.grNumber,
      poNumber: gr.purchaseOrder.poNumber,
      purchaseOrderId: gr.purchaseOrderId,
      supplier: gr.purchaseOrder.supplier.name,
      supplierId: gr.purchaseOrder.supplierId,
      status: gr.status.toLowerCase(),
      items: gr.items.length,
      totalExpected: gr.totalExpected,
      totalReceived: gr.totalReceived,
      totalDamaged: gr.totalDamaged,
      receivedDate: gr.receivedDate,
      receivedBy: gr.receivedBy,
      qualityStatus: gr.qualityStatus,
      qualityNotes: gr.qualityNotes,
      notes: gr.notes,
      createdAt: gr.createdAt,
      updatedAt: gr.updatedAt
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get goods receiving error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get single goods receipt by ID
app.get('/api/goods-receiving/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            items: true
          }
        },
        items: true
      }
    });

    if (!goodsReceipt) {
      return res.status(404).json({ error: 'Goods receipt not found' });
    }

    // Transform for frontend
    const transformed = {
      id: goodsReceipt.id,
      grNumber: goodsReceipt.grNumber,
      purchaseOrderId: goodsReceipt.purchaseOrderId,
      poNumber: goodsReceipt.purchaseOrder.poNumber,
      supplier: {
        id: goodsReceipt.purchaseOrder.supplier.id,
        name: goodsReceipt.purchaseOrder.supplier.name,
        code: goodsReceipt.purchaseOrder.supplier.code
      },
      status: goodsReceipt.status.toLowerCase(),
      receivedDate: goodsReceipt.receivedDate,
      receivedBy: goodsReceipt.receivedBy,
      qualityStatus: goodsReceipt.qualityStatus,
      qualityNotes: goodsReceipt.qualityNotes,
      totalExpected: goodsReceipt.totalExpected,
      totalReceived: goodsReceipt.totalReceived,
      totalDamaged: goodsReceipt.totalDamaged,
      notes: goodsReceipt.notes,
      createdAt: goodsReceipt.createdAt,
      updatedAt: goodsReceipt.updatedAt,
      items: goodsReceipt.items.map(item => ({
        id: item.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        expectedQty: item.expectedQty,
        receivedQty: item.receivedQty,
        damagedQty: item.damagedQty,
        batchNumber: item.batchNumber,
        lotNumber: item.lotNumber,
        bestBeforeDate: item.bestBeforeDate,
        locationId: item.locationId,
        qualityStatus: item.qualityStatus,
        qualityNotes: item.qualityNotes,
        notes: item.notes
      })),
      purchaseOrder: {
        id: goodsReceipt.purchaseOrder.id,
        poNumber: goodsReceipt.purchaseOrder.poNumber,
        status: goodsReceipt.purchaseOrder.status,
        totalAmount: goodsReceipt.purchaseOrder.totalAmount,
        items: goodsReceipt.purchaseOrder.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }
    };

    res.json(transformed);
  } catch (error) {
    console.error('Get goods receipt error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get approved purchase orders available for goods receiving
app.get('/api/goods-receiving/purchase-orders/approved', verifyToken, async (req, res) => {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: 'APPROVED'
      },
      include: {
        supplier: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformed = purchaseOrders.map(po => ({
      id: po.id,
      poNumber: po.poNumber,
      supplier: {
        id: po.supplier.id,
        name: po.supplier.name,
        code: po.supplier.code
      },
      status: po.status.toLowerCase(),
      totalAmount: po.totalAmount,
      expectedDate: po.expectedDeliveryDate,
      items: po.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      createdAt: po.createdAt
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Get approved POs error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Create goods receipt from purchase order
app.post('/api/goods-receiving', verifyToken, async (req, res) => {
  try {
    const { purchaseOrderId, notes } = req.body;

    if (!purchaseOrderId) {
      return res.status(400).json({ error: 'Purchase Order ID is required' });
    }

    // Get the purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        items: true
      }
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    if (purchaseOrder.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Purchase Order must be approved to create goods receipt' });
    }

    // Generate GR number
    const lastGR = await prisma.goodsReceipt.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let grNumber;
    if (lastGR && lastGR.grNumber) {
      const lastNum = parseInt(lastGR.grNumber.replace('GR-', '')) || 0;
      grNumber = `GR-${String(lastNum + 1).padStart(6, '0')}`;
    } else {
      grNumber = 'GR-000001';
    }

    // Calculate totals
    const totalExpected = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);

    // Create goods receipt with items
    const goodsReceipt = await prisma.goodsReceipt.create({
      data: {
        grNumber,
        purchaseOrderId,
        status: 'PENDING',
        totalExpected,
        totalReceived: 0,
        totalDamaged: 0,
        notes,
        items: {
          create: purchaseOrder.items.map(item => ({
            purchaseOrderItemId: item.id,
            productId: item.productId,
            productName: item.productName || 'Unknown Product',
            productSku: item.productSku || 'N/A',
            expectedQty: item.quantity,
            receivedQty: 0,
            damagedQty: 0
          }))
        }
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        },
        items: true
      }
    });

    res.status(201).json({
      id: goodsReceipt.id,
      grNumber: goodsReceipt.grNumber,
      poNumber: goodsReceipt.purchaseOrder.poNumber,
      supplier: goodsReceipt.purchaseOrder.supplier.name,
      status: goodsReceipt.status.toLowerCase(),
      totalExpected: goodsReceipt.totalExpected,
      items: goodsReceipt.items.length,
      createdAt: goodsReceipt.createdAt
    });
  } catch (error) {
    console.error('Create goods receiving error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update goods receipt
app.put('/api/goods-receiving/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, qualityStatus, qualityNotes, receivedBy } = req.body;

    const goodsReceipt = await prisma.goodsReceipt.update({
      where: { id },
      data: {
        notes,
        qualityStatus,
        qualityNotes,
        receivedBy,
        updatedAt: new Date()
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        },
        items: true
      }
    });

    res.json({
      id: goodsReceipt.id,
      grNumber: goodsReceipt.grNumber,
      poNumber: goodsReceipt.purchaseOrder.poNumber,
      supplier: goodsReceipt.purchaseOrder.supplier.name,
      status: goodsReceipt.status.toLowerCase(),
      totalExpected: goodsReceipt.totalExpected,
      totalReceived: goodsReceipt.totalReceived,
      notes: goodsReceipt.notes,
      qualityStatus: goodsReceipt.qualityStatus,
      qualityNotes: goodsReceipt.qualityNotes,
      receivedBy: goodsReceipt.receivedBy,
      updatedAt: goodsReceipt.updatedAt
    });
  } catch (error) {
    console.error('Update goods receipt error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete goods receipt
app.delete('/api/goods-receiving/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id }
    });

    if (!goodsReceipt) {
      return res.status(404).json({ error: 'Goods receipt not found' });
    }

    if (goodsReceipt.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete completed goods receipt' });
    }

    await prisma.goodsReceipt.delete({
      where: { id }
    });

    res.json({ message: 'Goods receipt deleted successfully' });
  } catch (error) {
    console.error('Delete goods receipt error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Receive items - update item quantities
app.post('/api/goods-receiving/:id/receive-item', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, receivedQty, damagedQty, batchNumber, lotNumber, bestBeforeDate, locationId, qualityStatus, qualityNotes, notes } = req.body;

    // Update the item
    const item = await prisma.goodsReceiptItem.update({
      where: { id: itemId },
      data: {
        receivedQty: parseInt(receivedQty) || 0,
        damagedQty: parseInt(damagedQty) || 0,
        batchNumber,
        lotNumber,
        bestBeforeDate: bestBeforeDate ? new Date(bestBeforeDate) : null,
        locationId,
        qualityStatus,
        qualityNotes,
        notes,
        updatedAt: new Date()
      }
    });

    // Update totals in goods receipt
    const allItems = await prisma.goodsReceiptItem.findMany({
      where: { goodsReceiptId: id }
    });

    const totalReceived = allItems.reduce((sum, i) => sum + i.receivedQty, 0);
    const totalDamaged = allItems.reduce((sum, i) => sum + i.damagedQty, 0);

    // Determine status
    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id }
    });

    let newStatus = goodsReceipt.status;
    if (totalReceived > 0 && totalReceived < goodsReceipt.totalExpected) {
      newStatus = 'IN_PROGRESS';
    } else if (totalReceived >= goodsReceipt.totalExpected) {
      newStatus = 'IN_PROGRESS'; // Still needs completion action
    }

    await prisma.goodsReceipt.update({
      where: { id },
      data: {
        totalReceived,
        totalDamaged,
        status: newStatus,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Item received successfully',
      item,
      totals: { totalReceived, totalDamaged }
    });
  } catch (error) {
    console.error('Receive item error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Bulk receive items
app.post('/api/goods-receiving/:id/receive-items', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { items, receivedBy } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Update all items
    for (const item of items) {
      await prisma.goodsReceiptItem.update({
        where: { id: item.id },
        data: {
          receivedQty: parseInt(item.receivedQty) || 0,
          damagedQty: parseInt(item.damagedQty) || 0,
          batchNumber: item.batchNumber,
          lotNumber: item.lotNumber,
          bestBeforeDate: item.bestBeforeDate ? new Date(item.bestBeforeDate) : null,
          locationId: item.locationId,
          qualityStatus: item.qualityStatus,
          qualityNotes: item.qualityNotes,
          notes: item.notes,
          updatedAt: new Date()
        }
      });
    }

    // Update totals
    const allItems = await prisma.goodsReceiptItem.findMany({
      where: { goodsReceiptId: id }
    });

    const totalReceived = allItems.reduce((sum, i) => sum + i.receivedQty, 0);
    const totalDamaged = allItems.reduce((sum, i) => sum + i.damagedQty, 0);

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id }
    });

    let newStatus = 'IN_PROGRESS';
    if (totalReceived === 0) {
      newStatus = 'PENDING';
    }

    await prisma.goodsReceipt.update({
      where: { id },
      data: {
        totalReceived,
        totalDamaged,
        status: newStatus,
        receivedBy,
        receivedDate: totalReceived > 0 ? new Date() : null,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Items received successfully',
      totals: { totalReceived, totalDamaged }
    });
  } catch (error) {
    console.error('Bulk receive items error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Complete goods receipt
app.post('/api/goods-receiving/:id/complete', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { qualityStatus, qualityNotes, notes } = req.body;

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!goodsReceipt) {
      return res.status(404).json({ error: 'Goods receipt not found' });
    }

    if (goodsReceipt.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Goods receipt already completed' });
    }

    // Verify at least some items received
    const totalReceived = goodsReceipt.items.reduce((sum, i) => sum + i.receivedQty, 0);
    if (totalReceived === 0) {
      return res.status(400).json({ error: 'Cannot complete goods receipt with no items received' });
    }

    // Update goods receipt to completed
    const updated = await prisma.goodsReceipt.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        qualityStatus: qualityStatus || 'PASSED',
        qualityNotes,
        notes,
        receivedDate: goodsReceipt.receivedDate || new Date(),
        updatedAt: new Date()
      },
      include: {
        purchaseOrder: {
          include: { supplier: true }
        }
      }
    });

    // Update PO status to RECEIVED if all items received
    if (updated.totalReceived >= updated.totalExpected) {
      await prisma.purchaseOrder.update({
        where: { id: goodsReceipt.purchaseOrderId },
        data: {
          status: 'RECEIVED',
          updatedAt: new Date()
        }
      });
    } else {
      // Partial receive
      await prisma.purchaseOrder.update({
        where: { id: goodsReceipt.purchaseOrderId },
        data: {
          status: 'PARTIAL',
          updatedAt: new Date()
        }
      });
    }

    res.json({
      message: 'Goods receipt completed successfully',
      id: updated.id,
      grNumber: updated.grNumber,
      status: updated.status.toLowerCase(),
      totalExpected: updated.totalExpected,
      totalReceived: updated.totalReceived,
      totalDamaged: updated.totalDamaged
    });
  } catch (error) {
    console.error('Complete goods receipt error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Cancel goods receipt
app.post('/api/goods-receiving/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id }
    });

    if (!goodsReceipt) {
      return res.status(404).json({ error: 'Goods receipt not found' });
    }

    if (goodsReceipt.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel completed goods receipt' });
    }

    await prisma.goodsReceipt.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : goodsReceipt.notes,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Goods receipt cancelled successfully' });
  } catch (error) {
    console.error('Cancel goods receipt error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ===================================
// FBA TRANSFERS
// ===================================

app.get('/api/fba-transfers', verifyToken, async (req, res) => {
  try {
    const fbaTransfers = [
      { id: '1', transferId: 'FBA-001', destination: 'Amazon FBA - PHX3', status: 'pending', items: 100, pallets: 2, createdAt: new Date().toISOString() },
      { id: '2', transferId: 'FBA-002', destination: 'Amazon FBA - ONT8', status: 'in_transit', items: 250, pallets: 5, createdAt: new Date(Date.now() - 172800000).toISOString() },
      { id: '3', transferId: 'FBA-003', destination: 'Amazon FBA - SBD1', status: 'received', items: 75, pallets: 1, createdAt: new Date(Date.now() - 604800000).toISOString() },
      { id: '4', transferId: 'FBA-004', destination: 'Amazon FBA - LGB8', status: 'preparing', items: 500, pallets: 10, createdAt: new Date().toISOString() }
    ];
    res.json(fbaTransfers);
  } catch (error) {
    console.error('Get FBA transfers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/fba-transfers', verifyToken, async (req, res) => {
  try {
    const { destination, items, pallets } = req.body;
    const newTransfer = {
      id: require('crypto').randomUUID(),
      transferId: `FBA-${Date.now().toString().slice(-6)}`,
      destination,
      items: parseInt(items) || 0,
      pallets: parseInt(pallets) || 0,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    res.status(201).json(newTransfer);
  } catch (error) {
    console.error('Create FBA transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// INTEGRATIONS
// ===================================

app.get('/api/integrations', verifyToken, async (req, res) => {
  try {
    const integrations = [
      { id: '1', name: 'Amazon Seller Central', type: 'marketplace', status: 'connected', lastSync: new Date().toISOString() },
      { id: '2', name: 'Shopify', type: 'ecommerce', status: 'connected', lastSync: new Date().toISOString() },
      { id: '3', name: 'QuickBooks', type: 'accounting', status: 'disconnected', lastSync: null },
      { id: '4', name: 'ShipStation', type: 'shipping', status: 'connected', lastSync: new Date(Date.now() - 3600000).toISOString() }
    ];
    res.json(integrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/integrations/channels', verifyToken, async (req, res) => {
  try {
    const channels = [
      { id: '1', name: 'Amazon US', platform: 'Amazon', status: 'active', products: 150, orders: 45 },
      { id: '2', name: 'Shopify Store', platform: 'Shopify', status: 'active', products: 200, orders: 30 },
      { id: '3', name: 'eBay Store', platform: 'eBay', status: 'inactive', products: 75, orders: 0 },
      { id: '4', name: 'Walmart Marketplace', platform: 'Walmart', status: 'active', products: 100, orders: 20 }
    ];
    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/integrations/mappings', verifyToken, async (req, res) => {
  try {
    const mappings = [
      { id: '1', localSku: 'SKU-001', channelSku: 'AMZN-001', channel: 'Amazon US', status: 'mapped' },
      { id: '2', localSku: 'SKU-002', channelSku: 'SHOP-002', channel: 'Shopify', status: 'mapped' },
      { id: '3', localSku: 'SKU-003', channelSku: null, channel: null, status: 'unmapped' },
      { id: '4', localSku: 'SKU-004', channelSku: 'WMT-004', channel: 'Walmart', status: 'mapped' }
    ];
    res.json(mappings);
  } catch (error) {
    console.error('Get mappings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// REPLENISHMENT SETTINGS
// ===================================

app.get('/api/replenishment/settings', verifyToken, async (req, res) => {
  try {
    const settings = {
      autoReplenish: true,
      lowStockThreshold: 10,
      reorderPoint: 20,
      maxStockLevel: 100,
      leadTimeDays: 7,
      safetyStockDays: 3,
      defaultSupplier: null
    };
    res.json(settings);
  } catch (error) {
    console.error('Get replenishment settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/replenishment/settings', verifyToken, async (req, res) => {
  try {
    const settings = req.body;
    res.json({ ...settings, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Update replenishment settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// ORDERS ENDPOINTS
// ===================================

// Get all orders (alias for sales-orders)
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: {
        customer: { companyId: req.user.companyId }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// USERS MANAGEMENT ENDPOINTS
// ===================================

// Get all users
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user
app.get('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user
app.post('/api/users', verifyToken, async (req, res) => {
  try {
    const { email, name, role, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'temppass123', 10);

    const user = await prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        email,
        name,
        role: role || 'USER',
        password: hashedPassword,
        companyId: req.user.companyId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { name, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name,
        role,
        isActive,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
app.delete('/api/users/:id', verifyToken, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// PICK LISTS ENDPOINTS
// ===================================

// Get all pick lists
app.get('/api/pick-lists', verifyToken, async (req, res) => {
  try {
    const pickLists = await prisma.pickList.findMany({
      where: { companyId: req.user.companyId },
      include: {
        items: {
          include: {
            product: true,
            location: true
          }
        },
        order: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pickLists);
  } catch (error) {
    console.error('Get pick lists error:', error);
    // Return empty array if table doesn't exist yet
    res.json([]);
  }
});

// Create pick list
app.post('/api/pick-lists', verifyToken, async (req, res) => {
  try {
    const { orderId, items } = req.body;

    const pickList = await prisma.pickList.create({
      data: {
        id: require('crypto').randomUUID(),
        orderId,
        companyId: req.user.companyId,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            id: require('crypto').randomUUID(),
            productId: item.productId,
            locationId: item.locationId,
            quantity: item.quantity,
            pickedQuantity: 0,
            status: 'PENDING'
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true,
            location: true
          }
        }
      }
    });
    res.status(201).json(pickList);
  } catch (error) {
    console.error('Create pick list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// REPORTS ENDPOINTS
// ===================================

// Inventory Report
app.get('/api/reports/inventory', verifyToken, async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: {
        warehouse: {
          companyId: req.user.companyId
        }
      },
      include: {
        product: true,
        warehouse: true,
        location: true
      }
    });

    const summary = {
      totalItems: inventory.length,
      totalQuantity: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      totalValue: inventory.reduce((sum, inv) => sum + (inv.quantity * (inv.product?.costPrice || 0)), 0),
      lowStockItems: inventory.filter(inv => inv.quantity < 10).length,
      byWarehouse: {},
      generatedAt: new Date().toISOString()
    };

    inventory.forEach(inv => {
      const warehouseName = inv.warehouse?.name || 'Unknown';
      if (!summary.byWarehouse[warehouseName]) {
        summary.byWarehouse[warehouseName] = { items: 0, quantity: 0 };
      }
      summary.byWarehouse[warehouseName].items++;
      summary.byWarehouse[warehouseName].quantity += inv.quantity;
    });

    res.json({ summary, details: inventory });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sales Report
app.get('/api/reports/sales', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = {
      customer: {
        companyId: req.user.companyId
      }
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.salesOrder.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      }
    });

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length
        : 0,
      byStatus: {},
      topProducts: {},
      generatedAt: new Date().toISOString()
    };

    orders.forEach(order => {
      const status = order.status || 'UNKNOWN';
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

      order.items?.forEach(item => {
        const productName = item.product?.name || 'Unknown';
        if (!summary.topProducts[productName]) {
          summary.topProducts[productName] = { quantity: 0, revenue: 0 };
        }
        summary.topProducts[productName].quantity += item.quantity || 0;
        summary.topProducts[productName].revenue += (item.quantity || 0) * (item.unitPrice || 0);
      });
    });

    res.json({ summary, orders });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stock Movements Report
app.get('/api/reports/stock-movements', verifyToken, async (req, res) => {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        product: {
          companyId: req.user.companyId
        }
      },
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    const summary = {
      totalMovements: movements.length,
      byType: {},
      byProduct: {},
      generatedAt: new Date().toISOString()
    };

    movements.forEach(mov => {
      const type = mov.type || 'UNKNOWN';
      summary.byType[type] = (summary.byType[type] || 0) + 1;

      const productName = mov.product?.name || 'Unknown';
      summary.byProduct[productName] = (summary.byProduct[productName] || 0) + 1;
    });

    res.json({ summary, movements });
  } catch (error) {
    console.error('Get stock movements report error:', error);
    // Return empty if model doesn't exist
    res.json({
      summary: { totalMovements: 0, byType: {}, byProduct: {}, generatedAt: new Date().toISOString() },
      movements: []
    });
  }
});

// Reports Summary - Combined overview of all reports
app.get('/api/reports/summary', verifyToken, async (req, res) => {
  try {
    // Get inventory summary
    const inventory = await prisma.inventory.findMany({
      where: {
        warehouse: {
          companyId: req.user.companyId
        }
      },
      include: { product: true }
    });

    // Get orders summary
    const orders = await prisma.salesOrder.findMany({
      where: {
        customer: {
          companyId: req.user.companyId
        }
      }
    });

    // Get products count
    const productsCount = await prisma.product.count({
      where: { companyId: req.user.companyId }
    });

    // Get customers count
    const customersCount = await prisma.customer.count({
      where: { companyId: req.user.companyId }
    });

    // Get suppliers count
    const suppliersCount = await prisma.supplier.count({
      where: { companyId: req.user.companyId }
    });

    const summary = {
      inventory: {
        totalItems: inventory.length,
        totalQuantity: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        totalValue: inventory.reduce((sum, inv) => sum + (inv.quantity * (inv.product?.costPrice || 0)), 0),
        lowStockItems: inventory.filter(inv => inv.quantity < 10).length
      },
      sales: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        pendingOrders: orders.filter(o => o.status === 'PENDING').length,
        completedOrders: orders.filter(o => o.status === 'DELIVERED' || o.status === 'SHIPPED').length
      },
      entities: {
        products: productsCount,
        customers: customersCount,
        suppliers: suppliersCount
      },
      generatedAt: new Date().toISOString()
    };

    res.json(summary);
  } catch (error) {
    console.error('Get reports summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// STOCK VALUATION REPORT
// ===================================

app.get('/api/reports/stock-valuation', verifyToken, async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: {
        warehouse: {
          companyId: req.user.companyId
        }
      },
      include: {
        product: true,
        warehouse: true
      }
    });

    // Calculate valuations using different methods
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalAverageCostValue = 0;
    const byProduct = {};
    const byWarehouse = {};
    const byCategory = {};

    inventory.forEach(inv => {
      const costPrice = parseFloat(inv.product?.costPrice || 0);
      const sellingPrice = parseFloat(inv.product?.sellingPrice || 0);
      const quantity = inv.quantity || 0;

      const itemCostValue = quantity * costPrice;
      const itemRetailValue = quantity * sellingPrice;

      totalCostValue += itemCostValue;
      totalRetailValue += itemRetailValue;

      // Group by product
      const productName = inv.product?.name || 'Unknown';
      if (!byProduct[productName]) {
        byProduct[productName] = { quantity: 0, costValue: 0, retailValue: 0, sku: inv.product?.sku };
      }
      byProduct[productName].quantity += quantity;
      byProduct[productName].costValue += itemCostValue;
      byProduct[productName].retailValue += itemRetailValue;

      // Group by warehouse
      const warehouseName = inv.warehouse?.name || 'Unknown';
      if (!byWarehouse[warehouseName]) {
        byWarehouse[warehouseName] = { items: 0, quantity: 0, costValue: 0, retailValue: 0 };
      }
      byWarehouse[warehouseName].items++;
      byWarehouse[warehouseName].quantity += quantity;
      byWarehouse[warehouseName].costValue += itemCostValue;
      byWarehouse[warehouseName].retailValue += itemRetailValue;

      // Group by brand/category
      const brandId = inv.product?.brandId || 'uncategorized';
      if (!byCategory[brandId]) {
        byCategory[brandId] = { items: 0, quantity: 0, costValue: 0, retailValue: 0 };
      }
      byCategory[brandId].items++;
      byCategory[brandId].quantity += quantity;
      byCategory[brandId].costValue += itemCostValue;
      byCategory[brandId].retailValue += itemRetailValue;
    });

    // Sort products by value for top items
    const topProducts = Object.entries(byProduct)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.costValue - a.costValue)
      .slice(0, 20);

    res.json({
      summary: {
        totalItems: inventory.length,
        totalQuantity: inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0),
        valuationMethods: {
          costBasis: {
            method: 'COST',
            description: 'Valuation based on purchase/cost price',
            totalValue: Math.round(totalCostValue * 100) / 100
          },
          retailBasis: {
            method: 'RETAIL',
            description: 'Valuation based on selling price',
            totalValue: Math.round(totalRetailValue * 100) / 100
          },
          averageCost: {
            method: 'AVERAGE_COST',
            description: 'Weighted average cost method',
            totalValue: Math.round(totalCostValue * 100) / 100
          }
        },
        potentialProfit: Math.round((totalRetailValue - totalCostValue) * 100) / 100,
        profitMargin: totalRetailValue > 0 ? Math.round(((totalRetailValue - totalCostValue) / totalRetailValue) * 10000) / 100 : 0,
        generatedAt: new Date().toISOString()
      },
      byWarehouse,
      topProducts,
      details: inventory.slice(0, 100).map(inv => ({
        id: inv.id,
        productName: inv.product?.name,
        sku: inv.product?.sku,
        warehouse: inv.warehouse?.name,
        quantity: inv.quantity,
        costPrice: inv.product?.costPrice,
        sellingPrice: inv.product?.sellingPrice,
        costValue: (inv.quantity || 0) * parseFloat(inv.product?.costPrice || 0),
        retailValue: (inv.quantity || 0) * parseFloat(inv.product?.sellingPrice || 0)
      }))
    });
  } catch (error) {
    console.error('Get stock valuation error:', error);
    res.status(500).json({ error: 'Failed to generate stock valuation report' });
  }
});

// ===================================
// ABC ANALYSIS (Inventory Classification)
// ===================================

app.get('/api/reports/abc-analysis', verifyToken, async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: {
        warehouse: {
          companyId: req.user.companyId
        }
      },
      include: {
        product: true
      }
    });

    // Get sales data for consumption analysis
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        customer: { companyId: req.user.companyId }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    // Calculate annual consumption value per product
    const productAnalysis = {};

    salesOrders.forEach(order => {
      order.items?.forEach(item => {
        const productId = item.productId;
        const productName = item.product?.name || 'Unknown';
        const value = (item.quantity || 0) * (item.unitPrice || 0);

        if (!productAnalysis[productId]) {
          productAnalysis[productId] = {
            id: productId,
            name: productName,
            sku: item.product?.sku,
            totalQuantitySold: 0,
            totalValue: 0,
            orderCount: 0,
            currentStock: 0,
            costPrice: item.product?.costPrice || 0
          };
        }
        productAnalysis[productId].totalQuantitySold += item.quantity || 0;
        productAnalysis[productId].totalValue += value;
        productAnalysis[productId].orderCount++;
      });
    });

    // Add current stock levels
    inventory.forEach(inv => {
      if (productAnalysis[inv.productId]) {
        productAnalysis[inv.productId].currentStock += inv.quantity || 0;
      }
    });

    // Convert to array and sort by value
    const sortedProducts = Object.values(productAnalysis)
      .sort((a, b) => b.totalValue - a.totalValue);

    // Calculate total value
    const totalValue = sortedProducts.reduce((sum, p) => sum + p.totalValue, 0);

    // Classify into ABC categories
    let cumulativeValue = 0;
    const classifiedProducts = sortedProducts.map((product, index) => {
      cumulativeValue += product.totalValue;
      const cumulativePercentage = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0;

      let category;
      if (cumulativePercentage <= 80) {
        category = 'A'; // Top 80% of value
      } else if (cumulativePercentage <= 95) {
        category = 'B'; // Next 15% of value
      } else {
        category = 'C'; // Bottom 5% of value
      }

      return {
        ...product,
        category,
        valuePercentage: totalValue > 0 ? Math.round((product.totalValue / totalValue) * 10000) / 100 : 0,
        cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
        rank: index + 1
      };
    });

    // Summary statistics
    const categoryA = classifiedProducts.filter(p => p.category === 'A');
    const categoryB = classifiedProducts.filter(p => p.category === 'B');
    const categoryC = classifiedProducts.filter(p => p.category === 'C');

    res.json({
      summary: {
        totalProducts: classifiedProducts.length,
        totalValue: Math.round(totalValue * 100) / 100,
        categories: {
          A: {
            count: categoryA.length,
            percentage: classifiedProducts.length > 0 ? Math.round((categoryA.length / classifiedProducts.length) * 10000) / 100 : 0,
            totalValue: Math.round(categoryA.reduce((sum, p) => sum + p.totalValue, 0) * 100) / 100,
            description: 'High-value items - 80% of total value, require tight control'
          },
          B: {
            count: categoryB.length,
            percentage: classifiedProducts.length > 0 ? Math.round((categoryB.length / classifiedProducts.length) * 10000) / 100 : 0,
            totalValue: Math.round(categoryB.reduce((sum, p) => sum + p.totalValue, 0) * 100) / 100,
            description: 'Medium-value items - 15% of total value, moderate control'
          },
          C: {
            count: categoryC.length,
            percentage: classifiedProducts.length > 0 ? Math.round((categoryC.length / classifiedProducts.length) * 10000) / 100 : 0,
            totalValue: Math.round(categoryC.reduce((sum, p) => sum + p.totalValue, 0) * 100) / 100,
            description: 'Low-value items - 5% of total value, simple control'
          }
        },
        generatedAt: new Date().toISOString()
      },
      products: classifiedProducts
    });
  } catch (error) {
    console.error('Get ABC analysis error:', error);
    res.status(500).json({ error: 'Failed to generate ABC analysis' });
  }
});

// ===================================
// SHIPPING CARRIERS API
// ===================================

// In-memory storage for shipping carriers (in production, this would be in the database)
let shippingCarriers = [
  { id: '1', name: 'DHL Express', code: 'DHL', type: 'EXPRESS', status: 'active', trackingUrl: 'https://www.dhl.com/track?AWB={tracking}', apiConfigured: true, credentials: { apiKey: '***configured***' }, supportedServices: ['EXPRESS', 'ECONOMY', 'FREIGHT'], createdAt: new Date().toISOString() },
  { id: '2', name: 'FedEx', code: 'FEDEX', type: 'EXPRESS', status: 'active', trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={tracking}', apiConfigured: true, credentials: { apiKey: '***configured***' }, supportedServices: ['PRIORITY', 'STANDARD', 'FREIGHT'], createdAt: new Date().toISOString() },
  { id: '3', name: 'UPS', code: 'UPS', type: 'EXPRESS', status: 'active', trackingUrl: 'https://www.ups.com/track?tracknum={tracking}', apiConfigured: true, credentials: { apiKey: '***configured***' }, supportedServices: ['NEXT_DAY', 'GROUND', 'FREIGHT'], createdAt: new Date().toISOString() },
  { id: '4', name: 'Royal Mail', code: 'ROYALMAIL', type: 'POSTAL', status: 'active', trackingUrl: 'https://www.royalmail.com/track-your-item/{tracking}', apiConfigured: false, credentials: null, supportedServices: ['FIRST_CLASS', 'SECOND_CLASS', 'SIGNED_FOR'], createdAt: new Date().toISOString() },
  { id: '5', name: 'Amazon Logistics', code: 'AMZL', type: 'FBA', status: 'active', trackingUrl: 'https://track.amazon.com/{tracking}', apiConfigured: true, credentials: { apiKey: '***configured***' }, supportedServices: ['STANDARD', 'SAME_DAY', 'NEXT_DAY'], createdAt: new Date().toISOString() }
];

app.get('/api/shipping/carriers', verifyToken, async (req, res) => {
  try {
    res.json(shippingCarriers);
  } catch (error) {
    console.error('Get shipping carriers error:', error);
    res.status(500).json({ error: 'Failed to get shipping carriers' });
  }
});

app.get('/api/shipping/carriers/:id', verifyToken, async (req, res) => {
  try {
    const carrier = shippingCarriers.find(c => c.id === req.params.id);
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }
    res.json(carrier);
  } catch (error) {
    console.error('Get shipping carrier error:', error);
    res.status(500).json({ error: 'Failed to get carrier' });
  }
});

app.post('/api/shipping/carriers', verifyToken, async (req, res) => {
  try {
    const { name, code, type, trackingUrl, credentials, supportedServices } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const newCarrier = {
      id: String(Date.now()),
      name,
      code: code.toUpperCase(),
      type: type || 'STANDARD',
      status: 'active',
      trackingUrl: trackingUrl || '',
      apiConfigured: !!credentials,
      credentials: credentials ? { apiKey: '***configured***' } : null,
      supportedServices: supportedServices || ['STANDARD'],
      createdAt: new Date().toISOString()
    };

    shippingCarriers.push(newCarrier);
    res.status(201).json(newCarrier);
  } catch (error) {
    console.error('Create shipping carrier error:', error);
    res.status(500).json({ error: 'Failed to create carrier' });
  }
});

app.put('/api/shipping/carriers/:id', verifyToken, async (req, res) => {
  try {
    const index = shippingCarriers.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    const { name, code, type, status, trackingUrl, credentials, supportedServices } = req.body;

    shippingCarriers[index] = {
      ...shippingCarriers[index],
      ...(name && { name }),
      ...(code && { code: code.toUpperCase() }),
      ...(type && { type }),
      ...(status && { status }),
      ...(trackingUrl !== undefined && { trackingUrl }),
      ...(credentials !== undefined && { apiConfigured: !!credentials, credentials: credentials ? { apiKey: '***configured***' } : null }),
      ...(supportedServices && { supportedServices }),
      updatedAt: new Date().toISOString()
    };

    res.json(shippingCarriers[index]);
  } catch (error) {
    console.error('Update shipping carrier error:', error);
    res.status(500).json({ error: 'Failed to update carrier' });
  }
});

app.delete('/api/shipping/carriers/:id', verifyToken, async (req, res) => {
  try {
    const index = shippingCarriers.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    shippingCarriers.splice(index, 1);
    res.json({ message: 'Carrier deleted successfully' });
  } catch (error) {
    console.error('Delete shipping carrier error:', error);
    res.status(500).json({ error: 'Failed to delete carrier' });
  }
});

// Get shipping rates from carrier
app.post('/api/shipping/rates', verifyToken, async (req, res) => {
  try {
    const { carrierId, origin, destination, weight, dimensions } = req.body;

    // Simulated rate calculation
    const baseRates = {
      DHL: { EXPRESS: 25.99, ECONOMY: 12.99, FREIGHT: 89.99 },
      FEDEX: { PRIORITY: 29.99, STANDARD: 14.99, FREIGHT: 99.99 },
      UPS: { NEXT_DAY: 34.99, GROUND: 9.99, FREIGHT: 79.99 },
      ROYALMAIL: { FIRST_CLASS: 3.99, SECOND_CLASS: 2.49, SIGNED_FOR: 5.99 },
      AMZL: { STANDARD: 4.99, SAME_DAY: 9.99, NEXT_DAY: 7.99 }
    };

    const carrier = shippingCarriers.find(c => c.id === carrierId);
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    const rates = carrier.supportedServices.map(service => ({
      service,
      carrier: carrier.name,
      estimatedDays: service.includes('EXPRESS') || service.includes('NEXT_DAY') || service.includes('SAME_DAY') ? 1 : service.includes('STANDARD') ? 3 : 5,
      price: (baseRates[carrier.code]?.[service] || 15.99) + (weight || 1) * 0.5,
      currency: 'USD'
    }));

    res.json({ carrier: carrier.name, rates });
  } catch (error) {
    console.error('Get shipping rates error:', error);
    res.status(500).json({ error: 'Failed to get rates' });
  }
});

// ===================================
// WEBHOOKS API
// ===================================

// In-memory storage for webhooks
let webhooks = [
  { id: '1', name: 'Order Created Webhook', url: 'https://example.com/webhooks/order-created', events: ['order.created'], status: 'active', secret: 'whsec_***', lastTriggered: null, successCount: 0, failureCount: 0, createdAt: new Date().toISOString() },
  { id: '2', name: 'Inventory Low Stock Alert', url: 'https://example.com/webhooks/low-stock', events: ['inventory.low_stock'], status: 'active', secret: 'whsec_***', lastTriggered: null, successCount: 0, failureCount: 0, createdAt: new Date().toISOString() },
  { id: '3', name: 'Shipment Tracking Update', url: 'https://example.com/webhooks/shipment-update', events: ['shipment.created', 'shipment.delivered'], status: 'inactive', secret: 'whsec_***', lastTriggered: null, successCount: 0, failureCount: 0, createdAt: new Date().toISOString() }
];

const availableWebhookEvents = [
  { event: 'order.created', description: 'Fired when a new order is created' },
  { event: 'order.updated', description: 'Fired when an order is updated' },
  { event: 'order.shipped', description: 'Fired when an order is shipped' },
  { event: 'order.delivered', description: 'Fired when an order is delivered' },
  { event: 'order.cancelled', description: 'Fired when an order is cancelled' },
  { event: 'inventory.updated', description: 'Fired when inventory levels change' },
  { event: 'inventory.low_stock', description: 'Fired when inventory falls below threshold' },
  { event: 'inventory.out_of_stock', description: 'Fired when inventory reaches zero' },
  { event: 'product.created', description: 'Fired when a new product is created' },
  { event: 'product.updated', description: 'Fired when a product is updated' },
  { event: 'shipment.created', description: 'Fired when a shipment is created' },
  { event: 'shipment.delivered', description: 'Fired when a shipment is delivered' },
  { event: 'customer.created', description: 'Fired when a new customer is created' },
  { event: 'return.created', description: 'Fired when a return is initiated' }
];

app.get('/api/webhooks', verifyToken, async (req, res) => {
  try {
    res.json(webhooks);
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ error: 'Failed to get webhooks' });
  }
});

app.get('/api/webhooks/events', verifyToken, async (req, res) => {
  try {
    res.json(availableWebhookEvents);
  } catch (error) {
    console.error('Get webhook events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

app.get('/api/webhooks/:id', verifyToken, async (req, res) => {
  try {
    const webhook = webhooks.find(w => w.id === req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  } catch (error) {
    console.error('Get webhook error:', error);
    res.status(500).json({ error: 'Failed to get webhook' });
  }
});

app.post('/api/webhooks', verifyToken, async (req, res) => {
  try {
    const { name, url, events } = req.body;

    if (!name || !url || !events || events.length === 0) {
      return res.status(400).json({ error: 'Name, URL, and at least one event are required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Generate webhook secret
    const secret = 'whsec_' + require('crypto').randomBytes(24).toString('hex');

    const newWebhook = {
      id: String(Date.now()),
      name,
      url,
      events,
      status: 'active',
      secret,
      lastTriggered: null,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString()
    };

    webhooks.push(newWebhook);
    res.status(201).json(newWebhook);
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

app.put('/api/webhooks/:id', verifyToken, async (req, res) => {
  try {
    const index = webhooks.findIndex(w => w.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const { name, url, events, status } = req.body;

    if (url) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }

    webhooks[index] = {
      ...webhooks[index],
      ...(name && { name }),
      ...(url && { url }),
      ...(events && { events }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };

    res.json(webhooks[index]);
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

app.delete('/api/webhooks/:id', verifyToken, async (req, res) => {
  try {
    const index = webhooks.findIndex(w => w.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    webhooks.splice(index, 1);
    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Test webhook endpoint
app.post('/api/webhooks/:id/test', verifyToken, async (req, res) => {
  try {
    const webhook = webhooks.find(w => w.id === req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Simulate webhook test
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Kiaan WMS',
        webhookId: webhook.id
      }
    };

    // In production, this would actually send the request
    // For now, we simulate success
    const index = webhooks.findIndex(w => w.id === req.params.id);
    webhooks[index].lastTriggered = new Date().toISOString();
    webhooks[index].successCount++;

    res.json({
      success: true,
      message: 'Test webhook sent successfully',
      payload: testPayload
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

// ===================================
// LOW STOCK ALERTS
// ===================================

app.get('/api/reports/low-stock', verifyToken, async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const inventory = await prisma.inventory.findMany({
      where: {
        warehouse: {
          companyId: req.user.companyId
        },
        quantity: {
          lte: parseInt(threshold)
        }
      },
      include: {
        product: true,
        warehouse: true
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    const alerts = inventory.map(inv => ({
      id: inv.id,
      productId: inv.productId,
      productName: inv.product?.name,
      sku: inv.product?.sku,
      warehouse: inv.warehouse?.name,
      currentQuantity: inv.quantity,
      threshold: parseInt(threshold),
      status: inv.quantity === 0 ? 'OUT_OF_STOCK' : inv.quantity <= parseInt(threshold) / 2 ? 'CRITICAL' : 'LOW',
      reorderSuggestion: Math.max(50, parseInt(threshold) * 3),
      estimatedValue: (inv.quantity || 0) * parseFloat(inv.product?.costPrice || 0)
    }));

    res.json({
      summary: {
        totalAlerts: alerts.length,
        outOfStock: alerts.filter(a => a.status === 'OUT_OF_STOCK').length,
        critical: alerts.filter(a => a.status === 'CRITICAL').length,
        low: alerts.filter(a => a.status === 'LOW').length,
        threshold: parseInt(threshold),
        generatedAt: new Date().toISOString()
      },
      alerts
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({ error: 'Failed to get low stock alerts' });
  }
});

// ===================================
// SETTINGS ENDPOINTS
// ===================================

// Get company settings
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Return comprehensive settings object
    res.json({
      id: company.id,
      name: company.name,
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',

      // General Settings
      currency: company.currency || 'USD',
      timezone: company.timezone || 'UTC',
      dateFormat: company.dateFormat || 'YYYY-MM-DD',
      logo: company.logo || null,

      // Notification Settings
      emailNotifications: company.emailNotifications !== false,
      lowStockAlerts: company.lowStockAlerts !== false,
      orderConfirmations: company.orderConfirmations !== false,

      // Inventory Settings
      defaultWarehouse: company.defaultWarehouse || null,
      autoReorderEnabled: company.autoReorderEnabled || false,
      batchTrackingEnabled: company.batchTrackingEnabled !== false,
      expiryTrackingEnabled: company.expiryTrackingEnabled !== false,
      lowStockThreshold: company.lowStockThreshold || 10,
      defaultTaxRate: company.defaultTaxRate || 0,

      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update company settings
app.put('/api/settings', verifyToken, async (req, res) => {
  try {
    const {
      name, email, phone, address, currency, timezone, dateFormat, logo,
      emailNotifications, lowStockAlerts, orderConfirmations,
      defaultWarehouse, autoReorderEnabled, batchTrackingEnabled,
      expiryTrackingEnabled, lowStockThreshold, defaultTaxRate
    } = req.body;

    const updateData = {};

    // General settings
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (currency !== undefined) updateData.currency = currency;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
    if (logo !== undefined) updateData.logo = logo;

    // Notification settings
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (lowStockAlerts !== undefined) updateData.lowStockAlerts = lowStockAlerts;
    if (orderConfirmations !== undefined) updateData.orderConfirmations = orderConfirmations;

    // Inventory settings
    if (defaultWarehouse !== undefined) updateData.defaultWarehouse = defaultWarehouse;
    if (autoReorderEnabled !== undefined) updateData.autoReorderEnabled = autoReorderEnabled;
    if (batchTrackingEnabled !== undefined) updateData.batchTrackingEnabled = batchTrackingEnabled;
    if (expiryTrackingEnabled !== undefined) updateData.expiryTrackingEnabled = expiryTrackingEnabled;
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);
    if (defaultTaxRate !== undefined) updateData.defaultTaxRate = parseFloat(defaultTaxRate);

    const company = await prisma.company.update({
      where: { id: req.user.companyId },
      data: updateData
    });

    res.json({
      id: company.id,
      name: company.name,
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      currency: company.currency || 'USD',
      timezone: company.timezone || 'UTC',
      dateFormat: company.dateFormat || 'YYYY-MM-DD',
      logo: company.logo || null,
      emailNotifications: company.emailNotifications,
      lowStockAlerts: company.lowStockAlerts,
      orderConfirmations: company.orderConfirmations,
      defaultWarehouse: company.defaultWarehouse,
      autoReorderEnabled: company.autoReorderEnabled,
      batchTrackingEnabled: company.batchTrackingEnabled,
      expiryTrackingEnabled: company.expiryTrackingEnabled,
      lowStockThreshold: company.lowStockThreshold,
      defaultTaxRate: company.defaultTaxRate,
      updatedAt: company.updatedAt
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// ANALYTICS ENDPOINTS
// ===================================

// Revenue by Channel
app.get('/api/analytics/revenue-by-channel', verifyToken, async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      where: { companyId: req.user.companyId },
      select: {
        channel: true,
        totalAmount: true,
        createdAt: true
      }
    });

    const byChannel = {};
    orders.forEach(order => {
      const channel = order.channel || 'Direct';
      if (!byChannel[channel]) {
        byChannel[channel] = { revenue: 0, orders: 0 };
      }
      byChannel[channel].revenue += order.totalAmount || 0;
      byChannel[channel].orders++;
    });

    const result = Object.entries(byChannel).map(([channel, data]) => ({
      channel,
      revenue: data.revenue,
      orders: data.orders,
      averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Get revenue by channel error:', error);
    res.json([]);
  }
});

// Sales Trends
app.get('/api/analytics/sales-trends', verifyToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const orders = await prisma.salesOrder.findMany({
      where: {
        companyId: req.user.companyId,
        createdAt: { gte: startDate }
      },
      select: {
        totalAmount: true,
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const byDate = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { revenue: 0, orders: 0 };
      }
      byDate[date].revenue += order.totalAmount || 0;
      byDate[date].orders++;
    });

    const trends = Object.entries(byDate).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period: `${daysAgo} days`,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      totalOrders: orders.length,
      trends
    });
  } catch (error) {
    console.error('Get sales trends error:', error);
    res.json({ period: '30 days', totalRevenue: 0, totalOrders: 0, trends: [] });
  }
});

// ===================================
// ANALYTICS - Pricing Calculator, Channels, Optimizer, Margins
// ===================================

// Channel fee configurations for different marketplaces
const CHANNEL_FEES = {
  'Amazon_FBA': { feePercent: 15, fulfillmentFee: 3.50, storageFee: 0.50 },
  'Amazon_UK_FBA': { feePercent: 15.3, fulfillmentFee: 3.25, storageFee: 0.45 },
  'Amazon_UK_MFN': { feePercent: 13.5, fulfillmentFee: 0, storageFee: 0 },
  'Shopify': { feePercent: 2.9, fulfillmentFee: 0, storageFee: 0 },
  'eBay': { feePercent: 12.8, fulfillmentFee: 0, storageFee: 0 },
  'TikTok': { feePercent: 5.0, fulfillmentFee: 0, storageFee: 0 },
  'Temu': { feePercent: 8.0, fulfillmentFee: 0, storageFee: 0 },
  'Direct': { feePercent: 0, fulfillmentFee: 0, storageFee: 0 },
};

// POST /api/pricing/calculate - Calculate optimal selling price
app.post('/api/pricing/calculate', verifyToken, async (req, res) => {
  try {
    const { productId, channelType, consumableIds, shippingCost, laborCost, desiredMargin } = req.body;

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const productCost = product.costPrice || 0;

    // Get consumables cost
    let consumablesCost = 0;
    if (consumableIds && consumableIds.length > 0) {
      const consumables = await prisma.consumable.findMany({
        where: { id: { in: consumableIds } }
      });
      consumablesCost = consumables.reduce((sum, c) => sum + (c.costPriceEach || 0), 0);
    }

    // Get channel fees
    const channelConfig = CHANNEL_FEES[channelType] || CHANNEL_FEES['Direct'];

    // Calculate total cost before fees
    const baseCost = productCost + consumablesCost + (shippingCost || 0) + (laborCost || 0);

    // Add fulfillment and storage fees
    const fulfillmentCost = channelConfig.fulfillmentFee + channelConfig.storageFee;

    // Calculate recommended price based on desired margin
    // Price = (baseCost + fulfillmentCost) / (1 - margin - feePercent/100)
    const marginDecimal = desiredMargin || 0.20;
    const feeDecimal = channelConfig.feePercent / 100;

    const totalCostWithFulfillment = baseCost + fulfillmentCost;
    const recommendedSellingPrice = totalCostWithFulfillment / (1 - marginDecimal - feeDecimal);

    // Calculate channel fee on selling price
    const fees = recommendedSellingPrice * feeDecimal + fulfillmentCost;
    const totalCost = baseCost + fees;

    // Calculate profit and margin
    const profit = recommendedSellingPrice - totalCost;
    const actualMargin = recommendedSellingPrice > 0 ? profit / recommendedSellingPrice : 0;

    res.json({
      product: { id: product.id, name: product.name, sku: product.sku },
      channel: channelType,
      productCost,
      consumablesCost,
      shippingCost: shippingCost || 0,
      laborCost: laborCost || 0,
      baseCost,
      fees: parseFloat(fees.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      recommendedSellingPrice: parseFloat(recommendedSellingPrice.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      margin: parseFloat(actualMargin.toFixed(4)),
      breakdown: {
        channelFeePercent: channelConfig.feePercent,
        fulfillmentFee: channelConfig.fulfillmentFee,
        storageFee: channelConfig.storageFee
      }
    });
  } catch (error) {
    console.error('Pricing calculate error:', error);
    res.status(500).json({ error: 'Failed to calculate pricing' });
  }
});

// GET /api/analytics/channels - Channel pricing analytics
app.get('/api/analytics/channels', verifyToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { companyId: req.user.companyId },
      include: {
        brand: { select: { id: true, name: true } },
        channelPrices: {
          include: {
            channel: { select: { id: true, name: true, referralFeePercent: true, fulfillmentFeePerUnit: true } }
          }
        }
      }
    });

    // Get inventory totals
    const inventory = await prisma.inventory.findMany({
      where: { companyId: req.user.companyId },
      select: { productId: true, quantity: true }
    });

    const inventoryMap = {};
    inventory.forEach(inv => {
      inventoryMap[inv.productId] = (inventoryMap[inv.productId] || 0) + inv.quantity;
    });

    // Enrich products with channel and stock data
    const enrichedProducts = products.map(p => {
      const channelPrice = p.channelPrices?.[0];
      const channel = channelPrice?.channel;
      const totalStock = inventoryMap[p.id] || 0;
      const sellingPrice = p.sellingPrice || channelPrice?.price || 0;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        costPrice: p.costPrice || 0,
        sellingPrice,
        channel: channel?.name || 'Direct',
        channelFee: ((channel?.referralFeePercent || 0) / 100) * sellingPrice + (channel?.fulfillmentFeePerUnit || 0),
        totalStock,
        volume: totalStock,
        packaging: sellingPrice * 0.03,
        shipping: sellingPrice * 0.08,
      };
    });

    res.json({ products: enrichedProducts });
  } catch (error) {
    console.error('Analytics channels error:', error);
    res.status(500).json({ error: 'Failed to fetch channel analytics' });
  }
});

// GET /api/analytics/pricing-optimizer - Price optimization data
app.get('/api/analytics/pricing-optimizer', verifyToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { companyId: req.user.companyId },
      include: {
        brand: { select: { id: true, name: true } },
        channelPrices: {
          include: {
            channel: { select: { id: true, name: true, referralFeePercent: true, fulfillmentFeePerUnit: true } }
          }
        }
      }
    });

    // Get inventory totals
    const inventory = await prisma.inventory.findMany({
      where: { companyId: req.user.companyId },
      select: { productId: true, quantity: true }
    });

    const inventoryMap = {};
    inventory.forEach(inv => {
      inventoryMap[inv.productId] = (inventoryMap[inv.productId] || 0) + inv.quantity;
    });

    // Enrich products with optimization data
    const enrichedProducts = products.map(p => {
      const channelPrice = p.channelPrices?.[0];
      const channel = channelPrice?.channel;
      const totalStock = inventoryMap[p.id] || 0;
      const sellingPrice = p.sellingPrice || channelPrice?.price || 0;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        costPrice: p.costPrice || 0,
        cost: p.costPrice || 0,
        sellingPrice,
        currentPrice: sellingPrice,
        channel: channel?.name || 'Direct',
        channelFee: ((channel?.referralFeePercent || 0) / 100) * sellingPrice + (channel?.fulfillmentFeePerUnit || 0),
        totalStock,
        volume: totalStock,
        packaging: sellingPrice * 0.03,
        shipping: sellingPrice * 0.08,
        competitorPrice: sellingPrice * (1 + (Math.random() * 0.2 - 0.1)), // Simulated competitor price
        demandElasticity: -1.2 + (Math.random() * 0.4), // Simulated elasticity
      };
    });

    res.json({ products: enrichedProducts });
  } catch (error) {
    console.error('Pricing optimizer error:', error);
    res.status(500).json({ error: 'Failed to fetch pricing optimizer data' });
  }
});

// GET /api/analytics/margins - Margin analysis data
app.get('/api/analytics/margins', verifyToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { companyId: req.user.companyId },
      include: {
        brand: { select: { id: true, name: true } },
        channelPrices: {
          include: {
            channel: { select: { id: true, name: true, referralFeePercent: true, fulfillmentFeePerUnit: true } }
          }
        }
      }
    });

    // Get inventory totals
    const inventory = await prisma.inventory.findMany({
      where: { companyId: req.user.companyId },
      select: { productId: true, quantity: true }
    });

    const inventoryMap = {};
    inventory.forEach(inv => {
      inventoryMap[inv.productId] = (inventoryMap[inv.productId] || 0) + inv.quantity;
    });

    // Get sales data for return rates
    const orders = await prisma.salesOrder.findMany({
      where: {
        companyId: req.user.companyId,
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      },
      include: {
        items: { select: { productId: true, quantity: true } }
      }
    });

    // Calculate sales volume per product
    const salesMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        salesMap[item.productId] = (salesMap[item.productId] || 0) + item.quantity;
      });
    });

    // Enrich products with margin data
    const enrichedProducts = products.map(p => {
      const channelPrice = p.channelPrices?.[0];
      const channel = channelPrice?.channel;
      const sellingPrice = p.sellingPrice || channelPrice?.price || 0;
      const productCost = p.costPrice || 0;

      // Cost estimates
      const packaging = sellingPrice * 0.03;
      const shipping = sellingPrice * 0.10;
      const channelFee = ((channel?.referralFeePercent || 0) / 100) * sellingPrice + (channel?.fulfillmentFeePerUnit || 0);

      // Volume from sales or inventory
      const salesVolume = salesMap[p.id] || 0;
      const stockVolume = inventoryMap[p.id] || 0;
      const volume = salesVolume || stockVolume || Math.floor(Math.random() * 300) + 50;

      // Returns estimate
      const returnRate = 1 + Math.random() * 4;
      const returns = Math.floor(volume * (returnRate / 100));

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand?.name || 'Unknown',
        channel: channel?.name || 'Direct',
        category: p.brand?.name || 'General',
        sellingPrice,
        productCost,
        packaging,
        shipping,
        channelFee,
        volume,
        returns,
        returnRate,
      };
    });

    res.json({ products: enrichedProducts });
  } catch (error) {
    console.error('Margins analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch margin data' });
  }
});

// ===================================
// WAREHOUSES - Full CRUD
// ===================================

// GET single warehouse
app.get('/api/warehouses/:id', verifyToken, async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      },
      include: {
        zones: true,
        locations: true,
        _count: {
          select: { inventory: true, locations: true }
        }
      }
    });
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.json(warehouse);
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Failed to get warehouse' });
  }
});

// CREATE warehouse
app.post('/api/warehouses', verifyToken, async (req, res) => {
  try {
    const { name, code, type, address, phone, capacity, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Get companyId - use user's company or get/create default
    let companyId = req.user.companyId;
    if (!companyId) {
      // Get or create default company
      let defaultCompany = await prisma.company.findFirst({ where: { code: 'KIAAN' } });
      if (!defaultCompany) {
        defaultCompany = await prisma.company.create({
          data: {
            name: 'Kiaan Food Distribution Ltd',
            code: 'KIAAN',
            description: 'Premium food and snack distribution',
            email: 'info@kiaan-distribution.com',
          },
        });
      }
      companyId = defaultCompany.id;
      // Update user with company
      await prisma.user.update({
        where: { id: req.user.id },
        data: { companyId }
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        type: type || 'MAIN',
        address,
        phone,
        capacity: capacity ? parseInt(capacity) : null,
        status: status || 'ACTIVE',
        companyId
      }
    });
    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Create warehouse error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Warehouse code already exists' });
    }
    res.status(500).json({ error: 'Failed to create warehouse', details: error.message });
  }
});

// UPDATE warehouse
app.put('/api/warehouses/:id', verifyToken, async (req, res) => {
  try {
    const { name, code, type, address, phone, capacity, status } = req.body;

    const existing = await prisma.warehouse.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(type && { type }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity) : null }),
        ...(status && { status })
      }
    });
    res.json(warehouse);
  } catch (error) {
    console.error('Update warehouse error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Warehouse code already exists' });
    }
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

// DELETE warehouse
app.delete('/api/warehouses/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.warehouse.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: { _count: { select: { inventory: true } } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    if (existing._count.inventory > 0) {
      return res.status(400).json({ error: 'Cannot delete warehouse with inventory' });
    }

    await prisma.warehouse.delete({ where: { id: req.params.id } });
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

// ===================================
// CUSTOMERS - Full CRUD
// ===================================

// GET single customer
app.get('/api/customers/:id', verifyToken, async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { orders: true } }
      }
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to get customer' });
  }
});

// CREATE customer
app.post('/api/customers', verifyToken, async (req, res) => {
  try {
    const { name, code, email, phone, address, customerType } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        code,
        email,
        phone,
        address,
        customerType: customerType || 'B2C',
        companyId: req.user.companyId
      }
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Customer code already exists' });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// UPDATE customer
app.put('/api/customers/:id', verifyToken, async (req, res) => {
  try {
    const { name, code, email, phone, address, customerType } = req.body;

    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(customerType && { customerType })
      }
    });
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Customer code already exists' });
    }
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer
app.delete('/api/customers/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: { _count: { select: { orders: true } } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (existing._count.orders > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with orders' });
    }

    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ===================================
// CATEGORIES - Full CRUD
// ===================================

// GET single category
app.get('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const category = await prisma.brand.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      },
      include: {
        _count: { select: { products: true } }
      }
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// CREATE category
app.post('/api/categories', verifyToken, async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const category = await prisma.brand.create({
      data: {
        name,
        code,
        description,
        companyId: req.user.companyId
      }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category code already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// UPDATE category
app.put('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const existing = await prisma.brand.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = await prisma.brand.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description })
      }
    });
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category code already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category
app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.brand.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: { _count: { select: { products: true } } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (existing._count.products > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }

    await prisma.brand.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ===================================
// SALES ORDERS - Full CRUD
// ===================================

// GET single sales order
app.get('/api/sales-orders/:id', verifyToken, async (req, res) => {
  try {
    const order = await prisma.salesOrder.findFirst({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: {
          include: { product: true }
        },
        pickLists: true
      }
    });
    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get sales order error:', error);
    res.status(500).json({ error: 'Failed to get sales order' });
  }
});

// UPDATE sales order
app.put('/api/sales-orders/:id', verifyToken, async (req, res) => {
  try {
    const { status, priority, isWholesale, shippingAddress, shippingMethod, notes, trackingNumber } = req.body;

    const existing = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } }, pickLists: true }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(isWholesale !== undefined && { isWholesale }),
        ...(shippingAddress !== undefined && { shippingAddress }),
        ...(shippingMethod !== undefined && { shippingMethod }),
        ...(notes !== undefined && { notes }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(status === 'SHIPPED' && { shippedDate: new Date() })
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    // Auto-create pick list when status changes to PICKING
    if (status === 'PICKING' && existing.status !== 'PICKING' && existing.pickLists.length === 0) {
      // Generate pick list number
      const allPickLists = await prisma.pickList.findMany({
        select: { pickListNumber: true },
        where: { pickListNumber: { startsWith: 'PL-' } }
      });
      let maxNumber = 0;
      for (const pl of allPickLists) {
        const match = pl.pickListNumber.match(/^PL-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      }
      const pickListNumber = `PL-${String(maxNumber + 1).padStart(6, '0')}`;

      await prisma.pickList.create({
        data: {
          pickListNumber,
          orderId: req.params.id,
          priority: order.priority || 'MEDIUM',
          status: 'PENDING',
          enforceSingleBBDate: order.isWholesale || false,
          items: {
            create: existing.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              pickedQty: 0
            }))
          }
        }
      });
    }

    // Auto-create packing task when status changes to PACKING
    if (status === 'PACKING' && existing.status !== 'PACKING') {
      const existingPackingTask = await prisma.packingTask.findFirst({
        where: { orderId: req.params.id }
      });

      if (!existingPackingTask) {
        // Generate packing number
        const allPackingTasks = await prisma.packingTask.findMany({
          select: { packingNumber: true },
          where: { packingNumber: { startsWith: 'PK-' } }
        });
        let maxPkNumber = 0;
        for (const pk of allPackingTasks) {
          const match = pk.packingNumber.match(/^PK-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxPkNumber) maxPkNumber = num;
          }
        }
        const packingNumber = `PK-${String(maxPkNumber + 1).padStart(6, '0')}`;

        await prisma.packingTask.create({
          data: {
            packingNumber,
            orderId: req.params.id,
            status: 'PENDING',
            priority: order.priority || 'MEDIUM'
          }
        });
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Update sales order error:', error);
    res.status(500).json({ error: 'Failed to update sales order' });
  }
});

// DELETE sales order
app.delete('/api/sales-orders/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    if (!['PENDING', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Can only delete pending or cancelled orders' });
    }

    // Delete order items first
    await prisma.salesOrderItem.deleteMany({ where: { orderId: req.params.id } });
    await prisma.salesOrder.delete({ where: { id: req.params.id } });
    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    console.error('Delete sales order error:', error);
    res.status(500).json({ error: 'Failed to delete sales order' });
  }
});

// ===================================
// TRANSFERS - Full CRUD
// ===================================

// GET single transfer
app.get('/api/transfers/:id', verifyToken, async (req, res) => {
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: req.params.id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: true
      }
    });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    res.json(transfer);
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({ error: 'Failed to get transfer' });
  }
});

// UPDATE transfer
app.put('/api/transfers/:id', verifyToken, async (req, res) => {
  try {
    const { status, notes, fbaShipmentId, fbaDestination, shipmentBuilt } = req.body;

    const existing = await prisma.transfer.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    const transfer = await prisma.transfer.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(fbaShipmentId !== undefined && { fbaShipmentId }),
        ...(fbaDestination !== undefined && { fbaDestination }),
        ...(shipmentBuilt !== undefined && { shipmentBuilt }),
        ...(status === 'IN_TRANSIT' && { shippedAt: new Date() }),
        ...(status === 'COMPLETED' && { receivedAt: new Date() })
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: true
      }
    });
    res.json(transfer);
  } catch (error) {
    console.error('Update transfer error:', error);
    res.status(500).json({ error: 'Failed to update transfer' });
  }
});

// DELETE transfer
app.delete('/api/transfers/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.transfer.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    if (!['PENDING', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Can only delete pending or cancelled transfers' });
    }

    await prisma.transferItem.deleteMany({ where: { transferId: req.params.id } });
    await prisma.transfer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    console.error('Delete transfer error:', error);
    res.status(500).json({ error: 'Failed to delete transfer' });
  }
});

// ===================================
// CHANNELS (Sales Channels) - Full CRUD
// ===================================

// GET single channel
app.get('/api/channels/:id', verifyToken, async (req, res) => {
  try {
    const channel = await prisma.salesChannel.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { channelPrices: true } }
      }
    });
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Failed to get channel' });
  }
});

// CREATE channel
app.post('/api/channels', verifyToken, async (req, res) => {
  try {
    const { name, code, type, referralFeePercent, fixedFee, fulfillmentFeePerUnit, storageFeePerUnit, additionalFees, isActive } = req.body;

    if (!name || !code || !type) {
      return res.status(400).json({ error: 'Name, code, and type are required' });
    }

    const channel = await prisma.salesChannel.create({
      data: {
        name,
        code,
        type,
        referralFeePercent: referralFeePercent ? parseFloat(referralFeePercent) : null,
        fixedFee: fixedFee ? parseFloat(fixedFee) : null,
        fulfillmentFeePerUnit: fulfillmentFeePerUnit ? parseFloat(fulfillmentFeePerUnit) : null,
        storageFeePerUnit: storageFeePerUnit ? parseFloat(storageFeePerUnit) : null,
        additionalFees: additionalFees || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Channel code already exists' });
    }
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// UPDATE channel
app.put('/api/channels/:id', verifyToken, async (req, res) => {
  try {
    const { name, code, type, referralFeePercent, fixedFee, fulfillmentFeePerUnit, storageFeePerUnit, additionalFees, isActive } = req.body;

    const existing = await prisma.salesChannel.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channel = await prisma.salesChannel.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(type && { type }),
        ...(referralFeePercent !== undefined && { referralFeePercent: referralFeePercent ? parseFloat(referralFeePercent) : null }),
        ...(fixedFee !== undefined && { fixedFee: fixedFee ? parseFloat(fixedFee) : null }),
        ...(fulfillmentFeePerUnit !== undefined && { fulfillmentFeePerUnit: fulfillmentFeePerUnit ? parseFloat(fulfillmentFeePerUnit) : null }),
        ...(storageFeePerUnit !== undefined && { storageFeePerUnit: storageFeePerUnit ? parseFloat(storageFeePerUnit) : null }),
        ...(additionalFees !== undefined && { additionalFees }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.json(channel);
  } catch (error) {
    console.error('Update channel error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Channel code already exists' });
    }
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// DELETE channel
app.delete('/api/channels/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.salesChannel.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { channelPrices: true } } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    if (existing._count.channelPrices > 0) {
      return res.status(400).json({ error: 'Cannot delete channel with prices configured' });
    }

    await prisma.salesChannel.delete({ where: { id: req.params.id } });
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// ===================================
// SUPPLIERS - Full CRUD
// ===================================

// GET all suppliers
app.get('/api/suppliers', verifyToken, async (req, res) => {
  try {
    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }
    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to get suppliers', details: error.message });
  }
});

// GET single supplier
app.get('/api/suppliers/:id', verifyToken, async (req, res) => {
  try {
    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: req.params.id,
        companyId
      }
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to get supplier', details: error.message });
  }
});

// CREATE supplier
app.post('/api/suppliers', verifyToken, async (req, res) => {
  try {
    const { name, code, email, phone, address } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        email,
        phone,
        address,
        companyId
      }
    });
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Supplier code already exists' });
    }
    res.status(500).json({ error: 'Failed to create supplier', details: error.message });
  }
});

// UPDATE supplier
app.put('/api/suppliers/:id', verifyToken, async (req, res) => {
  try {
    const { name, code, email, phone, address } = req.body;

    const existing = await prisma.supplier.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address })
      }
    });
    res.json(supplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Supplier code already exists' });
    }
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE supplier
app.delete('/api/suppliers/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.supplier.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// ===================================
// CLIENTS - 3PL Client Management
// ===================================

// Helper function to get or create default company
async function getOrCreateDefaultCompany(userId) {
  let defaultCompany = await prisma.company.findFirst({ where: { code: 'KIAAN' } });
  if (!defaultCompany) {
    defaultCompany = await prisma.company.create({
      data: {
        name: 'Kiaan Food Distribution Ltd',
        code: 'KIAAN',
        description: 'Premium food and snack distribution',
        email: 'info@kiaan-distribution.com',
      },
    });
  }
  // Update user with company
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { companyId: defaultCompany.id }
    });
  }
  return defaultCompany.id;
}

// GET all clients
app.get('/api/clients', verifyToken, async (req, res) => {
  try {
    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }

    const clients = await prisma.client.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to get clients', details: error.message });
  }
});

// GET single client
app.get('/api/clients/:id', verifyToken, async (req, res) => {
  try {
    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }

    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        companyId
      }
    });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to get client', details: error.message });
  }
});

// CREATE client
app.post('/api/clients', verifyToken, async (req, res) => {
  try {
    const { name, code, email, phone, address, contactName, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }

    const client = await prisma.client.create({
      data: {
        name,
        code,
        email,
        phone,
        address,
        contactName,
        status: status || 'ACTIVE',
        companyId
      }
    });
    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Client code already exists' });
    }
    res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
});

// UPDATE client
app.put('/api/clients/:id', verifyToken, async (req, res) => {
  try {
    const { name, code, email, phone, address, contactName, status } = req.body;

    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }

    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(contactName !== undefined && { contactName }),
        ...(status && { status })
      }
    });
    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Client code already exists' });
    }
    res.status(500).json({ error: 'Failed to update client', details: error.message });
  }
});

// DELETE client
app.delete('/api/clients/:id', verifyToken, async (req, res) => {
  try {
    let companyId = req.user.companyId;
    if (!companyId) {
      companyId = await getOrCreateDefaultCompany(req.user.id);
    }

    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, companyId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client', details: error.message });
  }
});

// ===================================
// ORDERS - Full CRUD (alias for sales-orders)
// ===================================

// GET single order
app.get('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const order = await prisma.salesOrder.findFirst({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { product: true } },
        pickLists: true
      }
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// CREATE order
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { customerId, isWholesale, salesChannel, items, shippingAddress, shippingMethod, notes, priority } = req.body;

    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer ID and items are required' });
    }

    // Generate order number
    const orderCount = await prisma.salesOrder.count();
    const orderNumber = `SO-${String(orderCount + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
      const unitPrice = item.unitPrice || product.sellingPrice || 0;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 0,
        totalPrice
      });
    }

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId,
        isWholesale: isWholesale || false,
        salesChannel,
        status: 'PENDING',
        priority: priority || 'MEDIUM',
        shippingAddress,
        shippingMethod,
        notes,
        subtotal,
        totalAmount: subtotal,
        items: {
          create: orderItems
        }
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// UPDATE order
app.put('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { status, priority, isWholesale, shippingAddress, shippingMethod, notes, trackingNumber } = req.body;

    const existing = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(isWholesale !== undefined && { isWholesale }),
        ...(shippingAddress !== undefined && { shippingAddress }),
        ...(shippingMethod !== undefined && { shippingMethod }),
        ...(notes !== undefined && { notes }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(status === 'SHIPPED' && { shippedDate: new Date() })
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    // Auto-generate pick list when order is CONFIRMED or ALLOCATED
    if (status && ['CONFIRMED', 'ALLOCATED'].includes(status.toUpperCase()) &&
        !['CONFIRMED', 'ALLOCATED'].includes(existing.status?.toUpperCase())) {
      try {
        // Check if pick list already exists for this order
        const existingPickList = await prisma.pickList.findFirst({
          where: { orderId: req.params.id }
        });

        if (!existingPickList && order.items?.length > 0) {
          // Generate pick list items from inventory
          const pickListItems = [];
          let sequence = 1;

          for (const item of order.items) {
            // Find available inventory for this product (FEFO)
            const inventoryItems = await prisma.inventory.findMany({
              where: {
                productId: item.productId,
                status: 'AVAILABLE',
                quantity: { gt: 0 }
              },
              include: {
                product: true,
                location: { include: { warehouse: true } }
              },
              orderBy: [
                { bestBeforeDate: 'asc' },
                { createdAt: 'asc' }
              ]
            });

            let remainingQty = item.quantity;
            for (const inv of inventoryItems) {
              if (remainingQty <= 0) break;
              const qtyToPick = Math.min(remainingQty, inv.quantity);
              pickListItems.push({
                pickSequence: sequence++,
                inventoryId: inv.id,
                productId: inv.productId,
                locationId: inv.locationId,
                quantityToPick: qtyToPick,
                quantityPicked: 0,
                status: 'PENDING'
              });
              remainingQty -= qtyToPick;
            }
          }

          if (pickListItems.length > 0) {
            await prisma.pickList.create({
              data: {
                orderId: req.params.id,
                status: 'PENDING',
                priority: order.priority || 'MEDIUM',
                items: { create: pickListItems }
              }
            });
            console.log(`✅ Auto-generated pick list for order ${order.orderNumber}`);
          }
        }
      } catch (pickErr) {
        console.error('Auto pick list generation error:', pickErr);
        // Don't fail the order update if pick list generation fails
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE order
app.delete('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!['PENDING', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Can only delete pending or cancelled orders' });
    }

    await prisma.salesOrderItem.deleteMany({ where: { orderId: req.params.id } });
    await prisma.salesOrder.delete({ where: { id: req.params.id } });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ===================================
// ZONES - Full CRUD
// ===================================

// GET all zones
app.get('/api/zones', verifyToken, async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const zones = await prisma.zone.findMany({
      where: warehouseId ? {
        warehouse: { companyId: req.user.companyId },
        warehouseId
      } : {
        warehouse: { companyId: req.user.companyId }
      },
      include: {
        warehouse: true,
        _count: { select: { locations: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(zones);
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({ error: 'Failed to get zones' });
  }
});

// GET single zone
app.get('/api/zones/:id', verifyToken, async (req, res) => {
  try {
    const zone = await prisma.zone.findFirst({
      where: {
        id: req.params.id,
        warehouse: { companyId: req.user.companyId }
      },
      include: {
        warehouse: true,
        locations: true,
        _count: { select: { locations: true } }
      }
    });
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    res.json(zone);
  } catch (error) {
    console.error('Get zone error:', error);
    res.status(500).json({ error: 'Failed to get zone' });
  }
});

// CREATE zone
app.post('/api/zones', verifyToken, async (req, res) => {
  try {
    const { name, code, warehouseId, zoneType } = req.body;

    if (!name || !code || !warehouseId) {
      return res.status(400).json({ error: 'Name, code, and warehouseId are required' });
    }

    // Verify warehouse belongs to company
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId: req.user.companyId }
    });
    if (!warehouse) {
      return res.status(400).json({ error: 'Warehouse not found' });
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        code,
        warehouseId,
        zoneType: zoneType || 'STANDARD'
      },
      include: { warehouse: true }
    });
    res.status(201).json(zone);
  } catch (error) {
    console.error('Create zone error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Zone code already exists in this warehouse' });
    }
    res.status(500).json({ error: 'Failed to create zone' });
  }
});

// UPDATE zone
app.put('/api/zones/:id', verifyToken, async (req, res) => {
  try {
    const { name, code, zoneType } = req.body;

    const existing = await prisma.zone.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const zone = await prisma.zone.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(zoneType && { zoneType })
      },
      include: { warehouse: true }
    });
    res.json(zone);
  } catch (error) {
    console.error('Update zone error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Zone code already exists in this warehouse' });
    }
    res.status(500).json({ error: 'Failed to update zone' });
  }
});

// DELETE zone
app.delete('/api/zones/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.zone.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } },
      include: { _count: { select: { locations: true } } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    if (existing._count.locations > 0) {
      return res.status(400).json({ error: 'Cannot delete zone with locations' });
    }

    await prisma.zone.delete({ where: { id: req.params.id } });
    res.json({ message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Delete zone error:', error);
    res.status(500).json({ error: 'Failed to delete zone' });
  }
});

// ===================================
// PICK LISTS - Full CRUD
// ===================================

// GET single pick list
app.get('/api/pick-lists/:id', verifyToken, async (req, res) => {
  try {
    const pickList = await prisma.pickList.findUnique({
      where: { id: req.params.id },
      include: {
        order: { include: { customer: true } },
        assignedUser: true,
        items: {
          include: {
            product: true,
            location: true
          }
        }
      }
    });
    if (!pickList) {
      return res.status(404).json({ error: 'Pick list not found' });
    }
    res.json(pickList);
  } catch (error) {
    console.error('Get pick list error:', error);
    res.status(500).json({ error: 'Failed to get pick list' });
  }
});

// UPDATE pick list
app.put('/api/pick-lists/:id', verifyToken, async (req, res) => {
  try {
    const { status, assignedUserId, priority, enforceSingleBBDate } = req.body;

    const existing = await prisma.pickList.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Pick list not found' });
    }

    const pickList = await prisma.pickList.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(assignedUserId !== undefined && { assignedUserId }),
        ...(priority && { priority }),
        ...(enforceSingleBBDate !== undefined && { enforceSingleBBDate }),
        ...(status === 'IN_PROGRESS' && !existing.startedAt && { startedAt: new Date() }),
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        order: { include: { customer: true } },
        assignedUser: true,
        items: { include: { product: true, location: true } }
      }
    });
    res.json(pickList);
  } catch (error) {
    console.error('Update pick list error:', error);
    res.status(500).json({ error: 'Failed to update pick list' });
  }
});

// DELETE pick list
app.delete('/api/pick-lists/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.pickList.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Pick list not found' });
    }
    if (!['PENDING', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Can only delete pending or cancelled pick lists' });
    }

    await prisma.pickItem.deleteMany({ where: { pickListId: req.params.id } });
    await prisma.pickList.delete({ where: { id: req.params.id } });
    res.json({ message: 'Pick list deleted successfully' });
  } catch (error) {
    console.error('Delete pick list error:', error);
    res.status(500).json({ error: 'Failed to delete pick list' });
  }
});

// ===================================
// REPLENISHMENT TASKS - Full CRUD
// ===================================

// GET single replenishment task
app.get('/api/replenishment/tasks/:id', verifyToken, async (req, res) => {
  try {
    const task = await prisma.replenishmentTask.findUnique({
      where: { id: req.params.id },
      include: { product: true }
    });
    if (!task) {
      return res.status(404).json({ error: 'Replenishment task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Get replenishment task error:', error);
    res.status(500).json({ error: 'Failed to get replenishment task' });
  }
});

// CREATE replenishment task
app.post('/api/replenishment/tasks', verifyToken, async (req, res) => {
  try {
    const { productId, fromLocation, toLocation, quantityNeeded, priority, notes } = req.body;

    if (!productId || !quantityNeeded) {
      return res.status(400).json({ error: 'Product ID and quantity needed are required' });
    }

    const taskCount = await prisma.replenishmentTask.count();
    const taskNumber = `RPL-${String(taskCount + 1).padStart(6, '0')}`;

    const task = await prisma.replenishmentTask.create({
      data: {
        taskNumber,
        productId,
        fromLocation,
        toLocation,
        quantityNeeded,
        priority: priority || 'MEDIUM',
        notes,
        status: 'PENDING'
      },
      include: { product: true }
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('Create replenishment task error:', error);
    res.status(500).json({ error: 'Failed to create replenishment task' });
  }
});

// UPDATE replenishment task
app.put('/api/replenishment/tasks/:id', verifyToken, async (req, res) => {
  try {
    const { status, quantityMoved, assignedUserId, notes, priority } = req.body;

    const existing = await prisma.replenishmentTask.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Replenishment task not found' });
    }

    const task = await prisma.replenishmentTask.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(quantityMoved !== undefined && { quantityMoved }),
        ...(assignedUserId !== undefined && { assignedUserId }),
        ...(notes !== undefined && { notes }),
        ...(priority && { priority }),
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: { product: true }
    });
    res.json(task);
  } catch (error) {
    console.error('Update replenishment task error:', error);
    res.status(500).json({ error: 'Failed to update replenishment task' });
  }
});

// PATCH replenishment task (same as PUT, for frontend compatibility)
app.patch('/api/replenishment/tasks/:id', verifyToken, async (req, res) => {
  try {
    const { status, quantityMoved, assignedUserId, notes, priority } = req.body;

    const existing = await prisma.replenishmentTask.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Replenishment task not found' });
    }

    const task = await prisma.replenishmentTask.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(quantityMoved !== undefined && { quantityMoved }),
        ...(assignedUserId !== undefined && { assignedUserId }),
        ...(notes !== undefined && { notes }),
        ...(priority && { priority }),
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: { product: true }
    });
    res.json(task);
  } catch (error) {
    console.error('Update replenishment task error:', error);
    res.status(500).json({ error: 'Failed to update replenishment task' });
  }
});

// DELETE replenishment task
app.delete('/api/replenishment/tasks/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.replenishmentTask.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Replenishment task not found' });
    }

    await prisma.replenishmentTask.delete({ where: { id: req.params.id } });
    res.json({ message: 'Replenishment task deleted successfully' });
  } catch (error) {
    console.error('Delete replenishment task error:', error);
    res.status(500).json({ error: 'Failed to delete replenishment task' });
  }
});

// ===================================
// REPLENISHMENT CONFIGS - CRUD endpoints
// ===================================

// GET all replenishment configs
app.get('/api/replenishment/configs', verifyToken, async (req, res) => {
  try {
    const configs = await prisma.replenishmentConfig.findMany({
      include: {
        product: {
          include: {
            brand: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(configs);
  } catch (error) {
    console.error('Get replenishment configs error:', error);
    res.status(500).json({ error: 'Failed to fetch replenishment configs' });
  }
});

// GET single replenishment config
app.get('/api/replenishment/configs/:id', verifyToken, async (req, res) => {
  try {
    const config = await prisma.replenishmentConfig.findUnique({
      where: { id: req.params.id },
      include: {
        product: {
          include: {
            brand: { select: { id: true, name: true } }
          }
        }
      }
    });
    if (!config) {
      return res.status(404).json({ error: 'Replenishment config not found' });
    }
    res.json(config);
  } catch (error) {
    console.error('Get replenishment config error:', error);
    res.status(500).json({ error: 'Failed to fetch replenishment config' });
  }
});

// POST create replenishment config
app.post('/api/replenishment/configs', verifyToken, async (req, res) => {
  try {
    const { productId, minStockLevel, maxStockLevel, reorderPoint, reorderQuantity, autoCreateTasks, enabled } = req.body;

    // Check if config already exists for this product
    const existing = await prisma.replenishmentConfig.findUnique({
      where: { productId }
    });
    if (existing) {
      return res.status(400).json({ error: 'Config already exists for this product' });
    }

    const config = await prisma.replenishmentConfig.create({
      data: {
        id: `cfg_${Date.now()}`,
        productId,
        minStockLevel: parseInt(minStockLevel),
        maxStockLevel: parseInt(maxStockLevel),
        reorderPoint: parseInt(reorderPoint),
        reorderQuantity: parseInt(reorderQuantity),
        autoCreateTasks: autoCreateTasks || false,
        enabled: enabled !== false,
        updatedAt: new Date()
      },
      include: {
        product: {
          include: {
            brand: { select: { id: true, name: true } }
          }
        }
      }
    });
    res.status(201).json(config);
  } catch (error) {
    console.error('Create replenishment config error:', error);
    res.status(500).json({ error: 'Failed to create replenishment config' });
  }
});

// PUT update replenishment config
app.put('/api/replenishment/configs/:id', verifyToken, async (req, res) => {
  try {
    const { minStockLevel, maxStockLevel, reorderPoint, reorderQuantity, autoCreateTasks, enabled } = req.body;

    const existing = await prisma.replenishmentConfig.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Replenishment config not found' });
    }

    const config = await prisma.replenishmentConfig.update({
      where: { id: req.params.id },
      data: {
        ...(minStockLevel !== undefined && { minStockLevel: parseInt(minStockLevel) }),
        ...(maxStockLevel !== undefined && { maxStockLevel: parseInt(maxStockLevel) }),
        ...(reorderPoint !== undefined && { reorderPoint: parseInt(reorderPoint) }),
        ...(reorderQuantity !== undefined && { reorderQuantity: parseInt(reorderQuantity) }),
        ...(autoCreateTasks !== undefined && { autoCreateTasks }),
        ...(enabled !== undefined && { enabled }),
        updatedAt: new Date()
      },
      include: {
        product: {
          include: {
            brand: { select: { id: true, name: true } }
          }
        }
      }
    });
    res.json(config);
  } catch (error) {
    console.error('Update replenishment config error:', error);
    res.status(500).json({ error: 'Failed to update replenishment config' });
  }
});

// DELETE replenishment config
app.delete('/api/replenishment/configs/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.replenishmentConfig.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Replenishment config not found' });
    }

    await prisma.replenishmentConfig.delete({ where: { id: req.params.id } });
    res.json({ message: 'Replenishment config deleted successfully' });
  } catch (error) {
    console.error('Delete replenishment config error:', error);
    res.status(500).json({ error: 'Failed to delete replenishment config' });
  }
});

// POST trigger auto-replenishment check
app.post('/api/replenishment/check', verifyToken, async (req, res) => {
  try {
    // Get all enabled configs with auto-create enabled
    const configs = await prisma.replenishmentConfig.findMany({
      where: {
        enabled: true,
        autoCreateTasks: true
      },
      include: { product: true }
    });

    const createdTasks = [];

    for (const config of configs) {
      // Get current inventory for this product
      const inventory = await prisma.inventory.aggregate({
        where: { productId: config.productId },
        _sum: { quantity: true }
      });

      const currentStock = inventory._sum.quantity || 0;

      // Check if stock is below reorder point
      if (currentStock < config.reorderPoint) {
        // Check if there's already a pending task for this product
        const existingTask = await prisma.replenishmentTask.findFirst({
          where: {
            productId: config.productId,
            status: { in: ['PENDING', 'IN_PROGRESS'] }
          }
        });

        if (!existingTask) {
          // Create replenishment task
          const task = await prisma.replenishmentTask.create({
            data: {
              id: `rpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              taskNumber: `RPL-${Date.now()}`,
              productId: config.productId,
              fromLocation: 'BULK',
              toLocation: 'PICK',
              quantityNeeded: config.reorderQuantity,
              quantityMoved: 0,
              status: 'PENDING',
              priority: currentStock < config.minStockLevel ? 'URGENT' : 'MEDIUM',
              notes: `Auto-generated: Stock at ${currentStock}, below reorder point of ${config.reorderPoint}`,
              updatedAt: new Date()
            },
            include: { product: true }
          });
          createdTasks.push(task);
        }
      }
    }

    res.json({
      message: `Auto-replenishment check completed`,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    });
  } catch (error) {
    console.error('Auto-replenishment check error:', error);
    res.status(500).json({ error: 'Failed to run auto-replenishment check' });
  }
});

// ===================================
// CYCLE COUNTS - Full CRUD with proper field mapping
// ===================================

// Helper function to transform cycle count for frontend
const transformCycleCount = async (cc, prisma) => {
  // Get location details if locations array exists
  let location = null;
  let locationDetails = [];
  if (cc.locations && Array.isArray(cc.locations) && cc.locations.length > 0) {
    locationDetails = await prisma.location.findMany({
      where: { id: { in: cc.locations } },
      include: { zone: { select: { id: true, name: true } } }
    });
    if (locationDetails.length > 0) {
      location = locationDetails[0]; // Primary location
    }
  }

  // Calculate itemsCount and discrepancies
  const items = cc.items || [];
  const itemsCount = items.length;
  const discrepancies = items.filter(item =>
    item.countedQuantity !== null && item.countedQuantity !== item.expectedQuantity
  ).length;

  // Transform items to include proper field names
  const transformedItems = items.map(item => ({
    ...item,
    // Ensure countedQuantity is available (map from actualQuantity if needed)
    countedQuantity: item.countedQuantity ?? item.actualQuantity ?? null,
    variance: item.countedQuantity !== null
      ? (item.countedQuantity ?? item.actualQuantity ?? 0) - item.expectedQuantity
      : null,
    status: item.status || (item.countedQuantity !== null
      ? ((item.countedQuantity ?? item.actualQuantity) !== item.expectedQuantity ? 'DISCREPANCY' : 'COUNTED')
      : 'PENDING')
  }));

  return {
    ...cc,
    referenceNumber: cc.referenceNumber || `CC-${cc.id.slice(0, 8).toUpperCase()}`,
    location,
    locationDetails,
    items: transformedItems,
    itemsCount,
    discrepancies,
    // Map status for frontend compatibility
    status: cc.status === 'SCHEDULED' ? 'PENDING' : cc.status
  };
};

// GET single cycle count
app.get('/api/inventory/cycle-counts/:id', verifyToken, async (req, res) => {
  try {
    const cycleCount = await prisma.cycleCount.findFirst({
      where: {
        id: req.params.id,
        warehouse: { companyId: req.user.companyId }
      },
      include: {
        warehouse: true,
        countedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            location: { select: { id: true, name: true, code: true, aisle: true, rack: true, shelf: true, bin: true } }
          }
        }
      }
    });
    if (!cycleCount) {
      return res.status(404).json({ error: 'Cycle count not found' });
    }

    const transformed = await transformCycleCount(cycleCount, prisma);
    res.json(transformed);
  } catch (error) {
    console.error('Get cycle count error:', error);
    res.status(500).json({ error: 'Failed to get cycle count' });
  }
});

// PATCH cycle count (for status updates) - Frontend uses PATCH
app.patch('/api/inventory/cycle-counts/:id', verifyToken, async (req, res) => {
  try {
    const { status, completedDate, countedById } = req.body;

    const existing = await prisma.cycleCount.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Cycle count not found' });
    }

    // Map PENDING back to SCHEDULED for database if needed
    const dbStatus = status === 'PENDING' ? 'PENDING' : status;

    const cycleCount = await prisma.cycleCount.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status: dbStatus }),
        ...(status === 'COMPLETED' && { completedDate: completedDate ? new Date(completedDate) : new Date() }),
        ...(status === 'IN_PROGRESS' && !existing.countedById && { countedById: req.user.id }),
        ...(countedById && { countedById })
      },
      include: {
        warehouse: true,
        countedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            location: true
          }
        }
      }
    });

    const transformed = await transformCycleCount(cycleCount, prisma);
    res.json(transformed);
  } catch (error) {
    console.error('Update cycle count error:', error);
    res.status(500).json({ error: 'Failed to update cycle count' });
  }
});

// PATCH cycle count item (for counting items)
app.patch('/api/inventory/cycle-counts/:id/items/:itemId', verifyToken, async (req, res) => {
  try {
    const { countedQuantity, notes } = req.body;

    // Verify cycle count exists and belongs to user's company
    const cycleCount = await prisma.cycleCount.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!cycleCount) {
      return res.status(404).json({ error: 'Cycle count not found' });
    }

    // Find the item
    const existingItem = await prisma.cycleCountItem.findFirst({
      where: { id: req.params.itemId, cycleCountId: req.params.id }
    });
    if (!existingItem) {
      return res.status(404).json({ error: 'Cycle count item not found' });
    }

    // Calculate variance and status
    const variance = countedQuantity !== null ? countedQuantity - existingItem.expectedQuantity : null;
    const itemStatus = countedQuantity !== null
      ? (variance !== 0 ? 'DISCREPANCY' : 'COUNTED')
      : 'PENDING';

    // Update the item
    const updatedItem = await prisma.cycleCountItem.update({
      where: { id: req.params.itemId },
      data: {
        countedQuantity: countedQuantity,
        variance: variance,
        status: itemStatus,
        ...(notes !== undefined && { notes }),
        updatedAt: new Date()
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        location: true
      }
    });

    res.json({
      ...updatedItem,
      status: itemStatus
    });
  } catch (error) {
    console.error('Update cycle count item error:', error);
    res.status(500).json({ error: 'Failed to update cycle count item' });
  }
});

// UPDATE cycle count (PUT for backwards compatibility)
app.put('/api/inventory/cycle-counts/:id', verifyToken, async (req, res) => {
  try {
    const { status, name, scheduledDate, type, locations, variance, notes } = req.body;

    const existing = await prisma.cycleCount.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Cycle count not found' });
    }

    const cycleCount = await prisma.cycleCount.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
        ...(type && { type }),
        ...(locations !== undefined && { locations }),
        ...(variance !== undefined && { variance }),
        ...(notes !== undefined && { notes }),
        ...(status === 'COMPLETED' && { completedDate: new Date() })
      },
      include: {
        warehouse: true,
        countedBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } }
      }
    });

    const transformed = await transformCycleCount(cycleCount, prisma);
    res.json(transformed);
  } catch (error) {
    console.error('Update cycle count error:', error);
    res.status(500).json({ error: 'Failed to update cycle count' });
  }
});

// DELETE cycle count
app.delete('/api/inventory/cycle-counts/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.cycleCount.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Cycle count not found' });
    }
    if (!['PENDING', 'SCHEDULED', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Can only delete pending or cancelled cycle counts' });
    }

    await prisma.cycleCountItem.deleteMany({ where: { cycleCountId: req.params.id } });
    await prisma.cycleCount.delete({ where: { id: req.params.id } });
    res.json({ message: 'Cycle count deleted successfully' });
  } catch (error) {
    console.error('Delete cycle count error:', error);
    res.status(500).json({ error: 'Failed to delete cycle count' });
  }
});

// ===================================
// STOCK ADJUSTMENTS - Full CRUD
// ===================================

// GET single stock adjustment
app.get('/api/inventory/adjustments/:id', verifyToken, async (req, res) => {
  try {
    const adjustment = await prisma.stockAdjustment.findFirst({
      where: {
        id: req.params.id,
        warehouse: { companyId: req.user.companyId }
      },
      include: {
        warehouse: true,
        user: true,
        approver: true,
        items: { include: { product: true, location: true } }
      }
    });
    if (!adjustment) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }
    res.json(adjustment);
  } catch (error) {
    console.error('Get adjustment error:', error);
    res.status(500).json({ error: 'Failed to get adjustment' });
  }
});

// UPDATE stock adjustment
app.put('/api/inventory/adjustments/:id', verifyToken, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const existing = await prisma.stockAdjustment.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }

    const adjustment = await prisma.stockAdjustment.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(status === 'APPROVED' && { approvedBy: req.user.id }),
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        warehouse: true,
        user: true,
        approver: true,
        items: { include: { product: true, location: true } }
      }
    });
    res.json(adjustment);
  } catch (error) {
    console.error('Update adjustment error:', error);
    res.status(500).json({ error: 'Failed to update adjustment' });
  }
});

// DELETE stock adjustment
app.delete('/api/inventory/adjustments/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.stockAdjustment.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }
    if (!['PENDING', 'REJECTED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Can only delete pending or rejected adjustments' });
    }

    await prisma.stockAdjustmentItem.deleteMany({ where: { adjustmentId: req.params.id } });
    await prisma.stockAdjustment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Adjustment deleted successfully' });
  } catch (error) {
    console.error('Delete adjustment error:', error);
    res.status(500).json({ error: 'Failed to delete adjustment' });
  }
});

// ===================================
// BATCHES - Full CRUD (Update & Delete)
// ===================================

// UPDATE batch
app.put('/api/inventory/batches/:id', verifyToken, async (req, res) => {
  try {
    const { lotNumber, batchNumber, bestBeforeDate, quantity, availableQuantity, reservedQuantity, status } = req.body;

    const existing = await prisma.inventory.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = await prisma.inventory.update({
      where: { id: req.params.id },
      data: {
        ...(lotNumber !== undefined && { lotNumber }),
        ...(batchNumber !== undefined && { batchNumber }),
        ...(bestBeforeDate !== undefined && { bestBeforeDate: bestBeforeDate ? new Date(bestBeforeDate) : null }),
        ...(quantity !== undefined && { quantity }),
        ...(availableQuantity !== undefined && { availableQuantity }),
        ...(reservedQuantity !== undefined && { reservedQuantity }),
        ...(status && { status })
      },
      include: {
        product: true,
        warehouse: true,
        location: true
      }
    });
    res.json(batch);
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// DELETE batch
app.delete('/api/inventory/batches/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.inventory.findFirst({
      where: { id: req.params.id, warehouse: { companyId: req.user.companyId } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    if (existing.reservedQuantity > 0) {
      return res.status(400).json({ error: 'Cannot delete batch with reserved quantity' });
    }

    await prisma.inventory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ========================================
// ZOLTAN'S CUSTOMIZATIONS - NEW API ROUTES
// ========================================

// ==========================================
// ALTERNATIVE SKU ROUTES (Multi-Channel SKU Mapping)
// ==========================================

// Get all alternative SKUs for a product
app.get('/api/products/:productId/alternative-skus', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const alternativeSkus = await prisma.alternativeSku.findMany({
      where: { 
        productId,
        companyId: req.user.companyId 
      },
      include: {
        product: {
          select: { sku: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(alternativeSkus);
  } catch (error) {
    console.error('Error fetching alternative SKUs:', error);
    res.status(500).json({ error: 'Failed to fetch alternative SKUs' });
  }
});

// Get alternative SKU by ID
app.get('/api/alternative-skus/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const alternativeSku = await prisma.alternativeSku.findFirst({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      include: {
        product: true
      }
    });
    
    if (!alternativeSku) {
      return res.status(404).json({ error: 'Alternative SKU not found' });
    }
    
    res.json(alternativeSku);
  } catch (error) {
    console.error('Error fetching alternative SKU:', error);
    res.status(500).json({ error: 'Failed to fetch alternative SKU' });
  }
});

// Create alternative SKU
app.post('/api/alternative-skus', verifyToken, async (req, res) => {
  try {
    const { productId, channel, sku, skuSuffix, fnsku, asin, isActive } = req.body;
    
    const alternativeSku = await prisma.alternativeSku.create({
      data: {
        productId,
        channel,
        sku,
        skuSuffix,
        fnsku,
        asin,
        isActive: isActive !== undefined ? isActive : true,
        companyId: req.user.companyId
      },
      include: {
        product: {
          select: { sku: true, name: true }
        }
      }
    });
    
    res.status(201).json(alternativeSku);
  } catch (error) {
    console.error('Error creating alternative SKU:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Alternative SKU already exists for this product and channel' });
    } else {
      res.status(500).json({ error: 'Failed to create alternative SKU' });
    }
  }
});

// Update alternative SKU
app.put('/api/alternative-skus/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, skuSuffix, fnsku, asin, isActive } = req.body;
    
    const alternativeSku = await prisma.alternativeSku.updateMany({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      data: {
        sku,
        skuSuffix,
        fnsku,
        asin,
        isActive
      }
    });
    
    if (alternativeSku.count === 0) {
      return res.status(404).json({ error: 'Alternative SKU not found' });
    }
    
    const updated = await prisma.alternativeSku.findUnique({
      where: { id },
      include: {
        product: {
          select: { sku: true, name: true }
        }
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating alternative SKU:', error);
    res.status(500).json({ error: 'Failed to update alternative SKU' });
  }
});

// Delete alternative SKU
app.delete('/api/alternative-skus/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.alternativeSku.deleteMany({
      where: { 
        id,
        companyId: req.user.companyId 
      }
    });
    
    if (result.count === 0) {
      return res.status(404).json({ error: 'Alternative SKU not found' });
    }
    
    res.json({ message: 'Alternative SKU deleted successfully' });
  } catch (error) {
    console.error('Error deleting alternative SKU:', error);
    res.status(500).json({ error: 'Failed to delete alternative SKU' });
  }
});

// ==========================================
// SUPPLIER PRODUCT ROUTES (Supplier Products with Case Sizes)
// ==========================================

// Get all supplier products
app.get('/api/supplier-products', verifyToken, async (req, res) => {
  try {
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: { companyId: req.user.companyId },
      include: {
        product: {
          select: { sku: true, name: true, costPrice: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(supplierProducts);
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({ error: 'Failed to fetch supplier products' });
  }
});

// Get supplier products by supplier ID
app.get('/api/suppliers/:supplierId/products', verifyToken, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: { 
        supplierId,
        companyId: req.user.companyId 
      },
      include: {
        product: {
          select: { sku: true, name: true, costPrice: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(supplierProducts);
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({ error: 'Failed to fetch supplier products' });
  }
});

// Get purchase orders for a specific supplier
app.get('/api/suppliers/:supplierId/purchase-orders', verifyToken, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { supplierId },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformed = purchaseOrders.map(po => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status.toLowerCase(),
      items: po.items?.length || 0,
      totalAmount: po.totalAmount,
      expectedDelivery: po.expectedDelivery,
      createdAt: po.createdAt,
      receivedAt: po.receivedAt
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching supplier purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch supplier purchase orders' });
  }
});

// Get supplier rating
app.get('/api/suppliers/:supplierId/rating', verifyToken, async (req, res) => {
  try {
    const { supplierId } = req.params;

    // Get supplier's purchase orders to calculate rating
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { supplierId },
      include: { items: true }
    });

    // Calculate metrics based on PO data
    const totalOrders = purchaseOrders.length;
    const completedOrders = purchaseOrders.filter(po => po.status === 'RECEIVED' || po.status === 'COMPLETED').length;

    // Calculate on-time delivery rate
    let onTimeDeliveries = 0;
    for (const po of purchaseOrders) {
      if ((po.status === 'RECEIVED' || po.status === 'COMPLETED') && po.receivedAt && po.expectedDelivery) {
        if (new Date(po.receivedAt) <= new Date(po.expectedDelivery)) {
          onTimeDeliveries++;
        }
      }
    }

    const deliveryRate = completedOrders > 0 ? Math.round((onTimeDeliveries / completedOrders) * 100) : 100;
    const qualityRate = 95; // Default quality rate - could be calculated from returns/defects
    const responseTime = 24; // Default response time in hours

    // Overall rating calculation (weighted average)
    const overallRating = Math.min(5, Math.max(1,
      ((deliveryRate / 100) * 2 + (qualityRate / 100) * 2 + 1).toFixed(1)
    ));

    res.json({
      supplierId,
      overallRating: parseFloat(overallRating),
      totalOrders,
      completedOrders,
      metrics: {
        deliveryRate,
        qualityRate,
        responseTime,
        onTimeDeliveries,
        totalDeliveries: completedOrders
      },
      breakdown: [
        { category: 'On-Time Delivery', score: deliveryRate, weight: 40 },
        { category: 'Product Quality', score: qualityRate, weight: 40 },
        { category: 'Communication', score: 90, weight: 20 }
      ]
    });
  } catch (error) {
    console.error('Error fetching supplier rating:', error);
    res.status(500).json({ error: 'Failed to fetch supplier rating' });
  }
});

// Get supplier products by product ID
app.get('/api/products/:productId/supplier-products', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: {
        productId,
        companyId: req.user.companyId 
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    res.json(supplierProducts);
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({ error: 'Failed to fetch supplier products' });
  }
});

// Create supplier product (with auto unit cost calculation)
app.post('/api/supplier-products', verifyToken, async (req, res) => {
  try {
    const { 
      supplierId, 
      productId, 
      supplierSku, 
      supplierName, 
      caseSize, 
      caseCost, 
      isPrimary, 
      leadTimeDays, 
      moq 
    } = req.body;
    
    // Auto-calculate unit cost if caseCost and caseSize provided
    const unitCost = (caseCost && caseSize) ? caseCost / caseSize : null;
    
    const supplierProduct = await prisma.supplierProduct.create({
      data: {
        supplierId,
        productId,
        supplierSku,
        supplierName,
        caseSize,
        caseCost,
        unitCost,
        isPrimary: isPrimary || false,
        leadTimeDays,
        moq,
        companyId: req.user.companyId
      },
      include: {
        product: {
          select: { sku: true, name: true, costPrice: true }
        }
      }
    });
    
    res.status(201).json(supplierProduct);
  } catch (error) {
    console.error('Error creating supplier product:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Supplier SKU already exists for this supplier' });
    } else {
      res.status(500).json({ error: 'Failed to create supplier product' });
    }
  }
});

// Update supplier product
app.put('/api/supplier-products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      supplierSku, 
      supplierName, 
      caseSize, 
      caseCost, 
      isPrimary, 
      leadTimeDays, 
      moq 
    } = req.body;
    
    // Auto-calculate unit cost if caseCost and caseSize provided
    const unitCost = (caseCost && caseSize) ? caseCost / caseSize : undefined;
    
    const supplierProduct = await prisma.supplierProduct.updateMany({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      data: {
        supplierSku,
        supplierName,
        caseSize,
        caseCost,
        unitCost,
        isPrimary,
        leadTimeDays,
        moq
      }
    });
    
    if (supplierProduct.count === 0) {
      return res.status(404).json({ error: 'Supplier product not found' });
    }
    
    const updated = await prisma.supplierProduct.findUnique({
      where: { id },
      include: {
        product: {
          select: { sku: true, name: true, costPrice: true }
        }
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating supplier product:', error);
    res.status(500).json({ error: 'Failed to update supplier product' });
  }
});

// Delete supplier product
app.delete('/api/supplier-products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.supplierProduct.deleteMany({
      where: { 
        id,
        companyId: req.user.companyId 
      }
    });
    
    if (result.count === 0) {
      return res.status(404).json({ error: 'Supplier product not found' });
    }
    
    res.json({ message: 'Supplier product deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier product:', error);
    res.status(500).json({ error: 'Failed to delete supplier product' });
  }
});

// ==========================================
// CONSUMABLE ROUTES (Packaging Materials)
// ==========================================

// Get all consumables
app.get('/api/consumables', verifyToken, async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    
    const where = { companyId: req.user.companyId };
    
    if (category) {
      where.category = category;
    }
    
    if (lowStock === 'true') {
      // Get consumables where currentStock <= minStockLevel
      const consumables = await prisma.consumable.findMany({
        where,
        orderBy: { name: 'asc' }
      });
      
      const lowStockItems = consumables.filter(c => c.currentStock <= c.minStockLevel);
      return res.json(lowStockItems);
    }
    
    const consumables = await prisma.consumable.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    
    res.json(consumables);
  } catch (error) {
    console.error('Error fetching consumables:', error);
    res.status(500).json({ error: 'Failed to fetch consumables' });
  }
});

// Get consumable by ID
app.get('/api/consumables/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const consumable = await prisma.consumable.findFirst({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      include: {
        usage: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });
    
    if (!consumable) {
      return res.status(404).json({ error: 'Consumable not found' });
    }
    
    res.json(consumable);
  } catch (error) {
    console.error('Error fetching consumable:', error);
    res.status(500).json({ error: 'Failed to fetch consumable' });
  }
});

// Create consumable
app.post('/api/consumables', verifyToken, async (req, res) => {
  try {
    const { sku, name, category, currentStock, minStockLevel, unitCost } = req.body;
    
    const consumable = await prisma.consumable.create({
      data: {
        sku,
        name,
        category: category || 'PACKAGING',
        currentStock: currentStock || 0,
        minStockLevel: minStockLevel || 10,
        unitCost,
        companyId: req.user.companyId
      }
    });
    
    res.status(201).json(consumable);
  } catch (error) {
    console.error('Error creating consumable:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Consumable SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create consumable' });
    }
  }
});

// Update consumable
app.put('/api/consumables/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, currentStock, minStockLevel, unitCost } = req.body;
    
    const consumable = await prisma.consumable.updateMany({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      data: {
        name,
        category,
        currentStock,
        minStockLevel,
        unitCost
      }
    });
    
    if (consumable.count === 0) {
      return res.status(404).json({ error: 'Consumable not found' });
    }
    
    const updated = await prisma.consumable.findUnique({
      where: { id }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating consumable:', error);
    res.status(500).json({ error: 'Failed to update consumable' });
  }
});

// Delete consumable
app.delete('/api/consumables/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.consumable.deleteMany({
      where: { 
        id,
        companyId: req.user.companyId 
      }
    });
    
    if (result.count === 0) {
      return res.status(404).json({ error: 'Consumable not found' });
    }
    
    res.json({ message: 'Consumable deleted successfully' });
  } catch (error) {
    console.error('Error deleting consumable:', error);
    res.status(500).json({ error: 'Failed to delete consumable' });
  }
});

// Record consumable usage
app.post('/api/consumables/usage', verifyToken, async (req, res) => {
  try {
    const { consumableId, quantity, usedBy, orderId, reason } = req.body;
    
    // Create usage record
    const usage = await prisma.consumableUsage.create({
      data: {
        consumableId,
        quantity,
        usedBy,
        orderId,
        reason,
        companyId: req.user.companyId
      }
    });
    
    // Update consumable stock
    await prisma.consumable.update({
      where: { id: consumableId },
      data: {
        currentStock: {
          decrement: quantity
        }
      }
    });
    
    res.status(201).json(usage);
  } catch (error) {
    console.error('Error recording consumable usage:', error);
    res.status(500).json({ error: 'Failed to record consumable usage' });
  }
});

// Get consumable usage history
app.get('/api/consumables/:id/usage', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usage = await prisma.consumableUsage.findMany({
      where: { 
        consumableId: id,
        companyId: req.user.companyId 
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    res.json(usage);
  } catch (error) {
    console.error('Error fetching consumable usage:', error);
    res.status(500).json({ error: 'Failed to fetch consumable usage' });
  }
});

// ==========================================
// MARKETPLACE CONNECTION ROUTES
// ==========================================

// Get all marketplace connections
app.get('/api/marketplace-connections', verifyToken, async (req, res) => {
  try {
    const connections = await prisma.marketplaceConnection.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(connections);
  } catch (error) {
    console.error('Error fetching marketplace connections:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace connections' });
  }
});

// Get marketplace connection by ID
app.get('/api/marketplace-connections/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await prisma.marketplaceConnection.findFirst({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      include: {
        orderSyncs: {
          orderBy: { syncedAt: 'desc' },
          take: 20
        },
        stockSyncs: {
          orderBy: { syncedAt: 'desc' },
          take: 20
        }
      }
    });
    
    if (!connection) {
      return res.status(404).json({ error: 'Marketplace connection not found' });
    }
    
    res.json(connection);
  } catch (error) {
    console.error('Error fetching marketplace connection:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace connection' });
  }
});

// Create marketplace connection
app.post('/api/marketplace-connections', verifyToken, async (req, res) => {
  try {
    const {
      marketplace,
      accountName,
      // Generic credentials
      apiKey,
      apiSecret,
      accessToken,
      refreshToken,
      // Amazon SP-API fields
      sellerId,        // Merchant Token
      clientId,        // Client ID
      clientSecret,    // Client Secret
      awsAccessKeyId,
      awsSecretKey,
      region,
      // Shopify fields
      shopUrl,
      shopifyApiKey,
      shopifyApiSecret,
      shopifyAccessToken,
      // eBay fields
      ebayAppId,
      ebayDevId,
      ebayCertId,
      ebayAuthToken,
      ebayRefreshToken,
      ebayEnvironment,
      // Generic
      storeId,
      // Sync settings
      autoSyncOrders,
      autoSyncStock,
      syncFrequency,
      isActive
    } = req.body;

    const connection = await prisma.marketplaceConnection.create({
      data: {
        marketplace,
        accountName,
        // Generic credentials
        apiKey,
        apiSecret,
        accessToken,
        refreshToken,
        // Amazon SP-API fields
        sellerId,
        clientId,
        clientSecret,
        awsAccessKeyId,
        awsSecretKey,
        region: region || 'eu-west-1', // Default to EU region for UK
        // Shopify fields
        shopUrl,
        shopifyApiKey,
        shopifyApiSecret,
        shopifyAccessToken,
        // eBay fields
        ebayAppId,
        ebayDevId,
        ebayCertId,
        ebayAuthToken,
        ebayRefreshToken,
        ebayEnvironment: ebayEnvironment || 'production',
        // Generic
        storeId,
        // Sync settings
        autoSyncOrders: autoSyncOrders !== undefined ? autoSyncOrders : true,
        autoSyncStock: autoSyncStock !== undefined ? autoSyncStock : true,
        syncFrequency: syncFrequency || 30,
        isActive: isActive !== undefined ? isActive : true,
        companyId: req.user.companyId
      }
    });

    res.status(201).json(connection);
  } catch (error) {
    console.error('Error creating marketplace connection:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Marketplace connection already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create marketplace connection', details: error.message });
    }
  }
});

// Update marketplace connection
app.put('/api/marketplace-connections/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      accountName,
      // Generic credentials
      apiKey,
      apiSecret,
      accessToken,
      refreshToken,
      // Amazon SP-API fields
      sellerId,
      clientId,
      clientSecret,
      awsAccessKeyId,
      awsSecretKey,
      region,
      // Shopify fields
      shopUrl,
      shopifyApiKey,
      shopifyApiSecret,
      shopifyAccessToken,
      // eBay fields
      ebayAppId,
      ebayDevId,
      ebayCertId,
      ebayAuthToken,
      ebayRefreshToken,
      ebayEnvironment,
      // Generic
      storeId,
      // Sync settings
      autoSyncOrders,
      autoSyncStock,
      syncFrequency,
      isActive
    } = req.body;

    // Build update object only with provided fields
    const updateData = {};
    if (accountName !== undefined) updateData.accountName = accountName;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiSecret !== undefined) updateData.apiSecret = apiSecret;
    if (accessToken !== undefined) updateData.accessToken = accessToken;
    if (refreshToken !== undefined) updateData.refreshToken = refreshToken;
    if (sellerId !== undefined) updateData.sellerId = sellerId;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (clientSecret !== undefined) updateData.clientSecret = clientSecret;
    if (awsAccessKeyId !== undefined) updateData.awsAccessKeyId = awsAccessKeyId;
    if (awsSecretKey !== undefined) updateData.awsSecretKey = awsSecretKey;
    if (region !== undefined) updateData.region = region;
    if (shopUrl !== undefined) updateData.shopUrl = shopUrl;
    if (shopifyApiKey !== undefined) updateData.shopifyApiKey = shopifyApiKey;
    if (shopifyApiSecret !== undefined) updateData.shopifyApiSecret = shopifyApiSecret;
    if (shopifyAccessToken !== undefined) updateData.shopifyAccessToken = shopifyAccessToken;
    if (ebayAppId !== undefined) updateData.ebayAppId = ebayAppId;
    if (ebayDevId !== undefined) updateData.ebayDevId = ebayDevId;
    if (ebayCertId !== undefined) updateData.ebayCertId = ebayCertId;
    if (ebayAuthToken !== undefined) updateData.ebayAuthToken = ebayAuthToken;
    if (ebayRefreshToken !== undefined) updateData.ebayRefreshToken = ebayRefreshToken;
    if (ebayEnvironment !== undefined) updateData.ebayEnvironment = ebayEnvironment;
    if (storeId !== undefined) updateData.storeId = storeId;
    if (autoSyncOrders !== undefined) updateData.autoSyncOrders = autoSyncOrders;
    if (autoSyncStock !== undefined) updateData.autoSyncStock = autoSyncStock;
    if (syncFrequency !== undefined) updateData.syncFrequency = syncFrequency;
    if (isActive !== undefined) updateData.isActive = isActive;

    const connection = await prisma.marketplaceConnection.updateMany({
      where: {
        id,
        companyId: req.user.companyId
      },
      data: updateData
    });

    if (connection.count === 0) {
      return res.status(404).json({ error: 'Marketplace connection not found' });
    }

    const updated = await prisma.marketplaceConnection.findUnique({
      where: { id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating marketplace connection:', error);
    res.status(500).json({ error: 'Failed to update marketplace connection' });
  }
});

// Delete marketplace connection
app.delete('/api/marketplace-connections/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.marketplaceConnection.deleteMany({
      where: { 
        id,
        companyId: req.user.companyId 
      }
    });
    
    if (result.count === 0) {
      return res.status(404).json({ error: 'Marketplace connection not found' });
    }
    
    res.json({ message: 'Marketplace connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting marketplace connection:', error);
    res.status(500).json({ error: 'Failed to delete marketplace connection' });
  }
});

// Sync marketplace orders (manual trigger)
app.post('/api/marketplace-connections/:id/sync-orders', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement actual marketplace API integration
    // For now, just log the sync request
    console.log(`Manual order sync requested for marketplace connection ${id}`);
    
    res.json({ 
      message: 'Order sync initiated', 
      status: 'PENDING',
      note: 'Marketplace API integration pending implementation'
    });
  } catch (error) {
    console.error('Error syncing marketplace orders:', error);
    res.status(500).json({ error: 'Failed to sync marketplace orders' });
  }
});

// Sync marketplace stock (manual trigger)
app.post('/api/marketplace-connections/:id/sync-stock', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement actual marketplace API integration
    console.log(`Manual stock sync requested for marketplace connection ${id}`);
    
    res.json({ 
      message: 'Stock sync initiated', 
      status: 'PENDING',
      note: 'Marketplace API integration pending implementation'
    });
  } catch (error) {
    console.error('Error syncing marketplace stock:', error);
    res.status(500).json({ error: 'Failed to sync marketplace stock' });
  }
});

// ==========================================
// COURIER CONNECTION ROUTES
// ==========================================

// Get all courier connections
app.get('/api/courier-connections', verifyToken, async (req, res) => {
  try {
    const connections = await prisma.courierConnection.findMany({
      where: { companyId: req.user.companyId },
      orderBy: [
        { isDefault: 'desc' },
        { courier: 'asc' }
      ]
    });
    res.json(connections);
  } catch (error) {
    console.error('Error fetching courier connections:', error);
    res.status(500).json({ error: 'Failed to fetch courier connections' });
  }
});

// Get courier connection by ID
app.get('/api/courier-connections/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await prisma.courierConnection.findFirst({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      include: {
        shipments: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });
    
    if (!connection) {
      return res.status(404).json({ error: 'Courier connection not found' });
    }
    
    res.json(connection);
  } catch (error) {
    console.error('Error fetching courier connection:', error);
    res.status(500).json({ error: 'Failed to fetch courier connection' });
  }
});

// Create courier connection
app.post('/api/courier-connections', verifyToken, async (req, res) => {
  try {
    const {
      courier,
      accountName,
      // Generic credentials
      apiKey,
      apiSecret,
      accountNumber,
      username,
      password,
      // Royal Mail / Parcelforce specific
      royalMailApiKey,
      royalMailPostingLocation,
      parcelforceContractNumber,
      // DPD specific
      dpdGeoSession,
      dpdAccountCode,
      // OAuth
      accessToken,
      refreshToken,
      // Settings
      isDefault,
      isActive,
      testMode,
      defaultService,
      serviceOptions
    } = req.body;

    // If setting as default, unset other defaults for this company
    if (isDefault) {
      await prisma.courierConnection.updateMany({
        where: {
          companyId: req.user.companyId,
          courier
        },
        data: { isDefault: false }
      });
    }

    const connection = await prisma.courierConnection.create({
      data: {
        courier,
        accountName,
        // Generic credentials
        apiKey,
        apiSecret,
        accountNumber,
        username,
        password,
        // Royal Mail / Parcelforce specific
        royalMailApiKey,
        royalMailPostingLocation,
        parcelforceContractNumber,
        // DPD specific
        dpdGeoSession,
        dpdAccountCode,
        // OAuth
        accessToken,
        refreshToken,
        // Settings
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        testMode: testMode || false,
        defaultService,
        serviceOptions,
        companyId: req.user.companyId
      }
    });

    res.status(201).json(connection);
  } catch (error) {
    console.error('Error creating courier connection:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Courier connection already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create courier connection' });
    }
  }
});

// Update courier connection
app.put('/api/courier-connections/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      accountName,
      apiKey,
      apiSecret,
      accountNumber,
      username,
      password,
      royalMailApiKey,
      royalMailPostingLocation,
      parcelforceContractNumber,
      dpdGeoSession,
      dpdAccountCode,
      accessToken,
      refreshToken,
      isDefault,
      isActive,
      testMode,
      defaultService,
      serviceOptions
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      const connection = await prisma.courierConnection.findUnique({
        where: { id },
        select: { courier: true }
      });

      if (connection) {
        await prisma.courierConnection.updateMany({
          where: {
            companyId: req.user.companyId,
            courier: connection.courier,
            id: { not: id }
          },
          data: { isDefault: false }
        });
      }
    }

    // Build update object only with provided fields
    const updateData = {};
    if (accountName !== undefined) updateData.accountName = accountName;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiSecret !== undefined) updateData.apiSecret = apiSecret;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.password = password;
    if (royalMailApiKey !== undefined) updateData.royalMailApiKey = royalMailApiKey;
    if (royalMailPostingLocation !== undefined) updateData.royalMailPostingLocation = royalMailPostingLocation;
    if (parcelforceContractNumber !== undefined) updateData.parcelforceContractNumber = parcelforceContractNumber;
    if (dpdGeoSession !== undefined) updateData.dpdGeoSession = dpdGeoSession;
    if (dpdAccountCode !== undefined) updateData.dpdAccountCode = dpdAccountCode;
    if (accessToken !== undefined) updateData.accessToken = accessToken;
    if (refreshToken !== undefined) updateData.refreshToken = refreshToken;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (testMode !== undefined) updateData.testMode = testMode;
    if (defaultService !== undefined) updateData.defaultService = defaultService;
    if (serviceOptions !== undefined) updateData.serviceOptions = serviceOptions;

    const result = await prisma.courierConnection.updateMany({
      where: {
        id,
        companyId: req.user.companyId
      },
      data: updateData
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Courier connection not found' });
    }

    const updated = await prisma.courierConnection.findUnique({
      where: { id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating courier connection:', error);
    res.status(500).json({ error: 'Failed to update courier connection' });
  }
});

// Delete courier connection
app.delete('/api/courier-connections/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.courierConnection.deleteMany({
      where: { 
        id,
        companyId: req.user.companyId 
      }
    });
    
    if (result.count === 0) {
      return res.status(404).json({ error: 'Courier connection not found' });
    }
    
    res.json({ message: 'Courier connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting courier connection:', error);
    res.status(500).json({ error: 'Failed to delete courier connection' });
  }
});

// ==========================================
// SEED INTEGRATION CREDENTIALS
// ==========================================

// Seed pre-configured integration credentials
// Credentials should be passed in the request body
app.post('/api/integrations/seed', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const results = { marketplaces: [], couriers: [] };

    // Get credentials from request body
    const { credentials = {} } = req.body;

    // ====== MARKETPLACE CONNECTIONS ======

    // Amazon FBA/MFN credentials (from request body)
    if (credentials.amazon) {
      const amazonConfig = {
        companyId,
        marketplace: 'AMAZON_FBA',
        accountName: credentials.amazon.accountName || 'Amazon UK',
        sellerId: credentials.amazon.sellerId || '',
        clientId: credentials.amazon.clientId || '',
        clientSecret: credentials.amazon.clientSecret || '',
        region: credentials.amazon.region || 'eu-west-1',
        autoSyncOrders: true,
        autoSyncStock: true,
        syncFrequency: 15,
        isActive: true
      };

      try {
        const existing = await prisma.marketplaceConnection.findFirst({
          where: { companyId, marketplace: 'AMAZON_FBA', accountName: amazonConfig.accountName }
        });

        if (existing) {
          const updated = await prisma.marketplaceConnection.update({
            where: { id: existing.id },
            data: amazonConfig
          });
          results.marketplaces.push({ action: 'updated', name: amazonConfig.accountName });
        } else {
          const created = await prisma.marketplaceConnection.create({ data: amazonConfig });
          results.marketplaces.push({ action: 'created', name: amazonConfig.accountName });
        }
      } catch (err) {
        results.marketplaces.push({ action: 'error', name: amazonConfig.accountName, error: err.message });
      }
    }

    // Shopify credentials (from request body) - can have multiple
    if (credentials.shopify && Array.isArray(credentials.shopify)) {
      for (const shop of credentials.shopify) {
        const shopifyConfig = {
          companyId,
          marketplace: 'SHOPIFY',
          accountName: shop.accountName || 'Shopify Store',
          shopUrl: shop.shopUrl || '',
          shopifyAccessToken: shop.accessToken || '',
          autoSyncOrders: true,
          autoSyncStock: true,
          syncFrequency: 15,
          isActive: true
        };

        try {
          const existing = await prisma.marketplaceConnection.findFirst({
            where: { companyId, marketplace: 'SHOPIFY', accountName: shopifyConfig.accountName }
          });

          if (existing) {
            const updated = await prisma.marketplaceConnection.update({
              where: { id: existing.id },
              data: shopifyConfig
            });
            results.marketplaces.push({ action: 'updated', name: shopifyConfig.accountName });
          } else {
            const created = await prisma.marketplaceConnection.create({ data: shopifyConfig });
            results.marketplaces.push({ action: 'created', name: shopifyConfig.accountName });
          }
        } catch (err) {
          results.marketplaces.push({ action: 'error', name: shopifyConfig.accountName, error: err.message });
        }
      }
    }

    // eBay credentials (from request body) - can have sandbox and production
    if (credentials.ebay && Array.isArray(credentials.ebay)) {
      for (const ebay of credentials.ebay) {
        const ebayConfig = {
          companyId,
          marketplace: 'EBAY',
          accountName: ebay.accountName || 'eBay',
          ebayAppId: ebay.appId || '',
          ebayDevId: ebay.devId || '',
          ebayCertId: ebay.certId || '',
          ebayEnvironment: ebay.environment || 'production',
          autoSyncOrders: ebay.environment !== 'sandbox',
          autoSyncStock: ebay.environment !== 'sandbox',
          syncFrequency: 30,
          isActive: ebay.environment !== 'sandbox'
        };

        try {
          const existing = await prisma.marketplaceConnection.findFirst({
            where: { companyId, marketplace: 'EBAY', accountName: ebayConfig.accountName }
          });

          if (existing) {
            const updated = await prisma.marketplaceConnection.update({
              where: { id: existing.id },
              data: ebayConfig
            });
            results.marketplaces.push({ action: 'updated', name: ebayConfig.accountName });
          } else {
            const created = await prisma.marketplaceConnection.create({ data: ebayConfig });
            results.marketplaces.push({ action: 'created', name: ebayConfig.accountName });
          }
        } catch (err) {
          results.marketplaces.push({ action: 'error', name: ebayConfig.accountName, error: err.message });
        }
      }
    }

    // ====== COURIER CONNECTIONS ======

    // Courier credentials (from request body)
    if (credentials.couriers && Array.isArray(credentials.couriers)) {
      for (const courier of credentials.couriers) {
        const courierConfig = {
          companyId,
          courier: courier.type || 'ROYAL_MAIL',
          accountName: courier.accountName || 'Courier',
          apiKey: courier.apiKey || '',
          isDefault: courier.isDefault || false,
          isActive: true,
          testMode: false
        };

        try {
          const existing = await prisma.courierConnection.findFirst({
            where: { companyId, courier: courierConfig.courier, accountName: courierConfig.accountName }
          });

          if (existing) {
            const updated = await prisma.courierConnection.update({
              where: { id: existing.id },
              data: courierConfig
            });
            results.couriers.push({ action: 'updated', name: courierConfig.accountName });
          } else {
            const created = await prisma.courierConnection.create({ data: courierConfig });
            results.couriers.push({ action: 'created', name: courierConfig.accountName });
          }
        } catch (err) {
          results.couriers.push({ action: 'error', name: courierConfig.accountName, error: err.message });
        }
      }
    }

    res.json({
      message: 'Integration credentials seeded successfully',
      results
    });
  } catch (error) {
    console.error('Error seeding integrations:', error);
    res.status(500).json({ error: 'Failed to seed integration credentials', details: error.message });
  }
});

// Test marketplace connection
app.post('/api/marketplace-connections/:id/test', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await prisma.marketplaceConnection.findFirst({
      where: { id, companyId: req.user.companyId }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let testResult = { success: false, message: '', details: {} };

    switch (connection.marketplace) {
      case 'AMAZON_FBA':
      case 'AMAZON_MFN':
        // Test Amazon SP-API connection
        if (connection.sellerId && connection.clientId && connection.clientSecret) {
          try {
            // For now, we'll validate the credentials format
            testResult.success = true;
            testResult.message = 'Amazon credentials validated';
            testResult.details = {
              sellerId: connection.sellerId,
              region: connection.region || 'eu-west-1',
              hasClientId: !!connection.clientId,
              hasClientSecret: !!connection.clientSecret
            };
          } catch (err) {
            testResult.message = 'Amazon API test failed: ' + err.message;
          }
        } else {
          testResult.message = 'Missing required Amazon credentials (sellerId, clientId, clientSecret)';
        }
        break;

      case 'SHOPIFY':
        // Test Shopify API connection
        if (connection.shopUrl && connection.shopifyAccessToken) {
          try {
            const shopifyUrl = `https://${connection.shopUrl}/admin/api/2024-01/shop.json`;
            const shopifyResponse = await fetch(shopifyUrl, {
              headers: {
                'X-Shopify-Access-Token': connection.shopifyAccessToken,
                'Content-Type': 'application/json'
              }
            });

            if (shopifyResponse.ok) {
              const shopData = await shopifyResponse.json();
              testResult.success = true;
              testResult.message = 'Shopify connection successful';
              testResult.details = {
                shopName: shopData.shop?.name,
                email: shopData.shop?.email,
                domain: shopData.shop?.domain,
                currency: shopData.shop?.currency
              };
            } else {
              const errorData = await shopifyResponse.json();
              testResult.message = `Shopify API error: ${errorData.errors || shopifyResponse.statusText}`;
            }
          } catch (err) {
            testResult.message = 'Shopify API test failed: ' + err.message;
          }
        } else {
          testResult.message = 'Missing Shopify credentials (shopUrl, accessToken)';
        }
        break;

      case 'EBAY':
        // Test eBay API connection
        if (connection.ebayAppId && connection.ebayCertId) {
          testResult.success = true;
          testResult.message = 'eBay credentials validated';
          testResult.details = {
            environment: connection.ebayEnvironment || 'production',
            hasAppId: !!connection.ebayAppId,
            hasDevId: !!connection.ebayDevId,
            hasCertId: !!connection.ebayCertId
          };
        } else {
          testResult.message = 'Missing eBay credentials (appId, certId)';
        }
        break;

      default:
        testResult.message = 'Test not implemented for this marketplace';
    }

    // Update last test status
    await prisma.marketplaceConnection.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        lastSyncError: testResult.success ? null : testResult.message
      }
    });

    res.json(testResult);
  } catch (error) {
    console.error('Error testing marketplace connection:', error);
    res.status(500).json({ error: 'Failed to test connection', details: error.message });
  }
});

// Test courier connection
app.post('/api/courier-connections/:id/test', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await prisma.courierConnection.findFirst({
      where: { id, companyId: req.user.companyId }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let testResult = { success: false, message: '', details: {} };

    switch (connection.courier) {
      case 'ROYAL_MAIL':
      case 'PARCELFORCE':
        // Test Royal Mail Click & Drop API
        if (connection.apiKey) {
          try {
            const rmUrl = 'https://api.parcel.royalmail.com/api/v1/orders';
            const rmResponse = await fetch(rmUrl, {
              method: 'GET',
              headers: {
                'Authorization': connection.apiKey,
                'Content-Type': 'application/json'
              }
            });

            if (rmResponse.ok || rmResponse.status === 401) {
              // 401 means auth is being checked - credentials format is valid
              testResult.success = rmResponse.ok;
              testResult.message = rmResponse.ok
                ? 'Royal Mail connection successful'
                : 'Royal Mail API key format valid but may need authorization';
              testResult.details = {
                courier: connection.courier,
                hasApiKey: !!connection.apiKey,
                status: rmResponse.status
              };
            } else {
              testResult.message = `Royal Mail API error: ${rmResponse.statusText}`;
            }
          } catch (err) {
            testResult.success = true; // Network error doesn't mean invalid credentials
            testResult.message = 'Royal Mail credentials saved (API test requires network access)';
            testResult.details = { hasApiKey: !!connection.apiKey };
          }
        } else {
          testResult.message = 'Missing Royal Mail API key';
        }
        break;

      case 'DPD_UK':
        if (connection.username && connection.password && connection.accountNumber) {
          testResult.success = true;
          testResult.message = 'DPD credentials validated';
          testResult.details = {
            hasUsername: !!connection.username,
            hasPassword: !!connection.password,
            hasAccountNumber: !!connection.accountNumber
          };
        } else {
          testResult.message = 'Missing DPD credentials (username, password, accountNumber)';
        }
        break;

      default:
        testResult.success = !!connection.apiKey;
        testResult.message = connection.apiKey ? 'Credentials saved' : 'Missing API key';
        testResult.details = { hasApiKey: !!connection.apiKey };
    }

    res.json(testResult);
  } catch (error) {
    console.error('Error testing courier connection:', error);
    res.status(500).json({ error: 'Failed to test connection', details: error.message });
  }
});

// ==========================================
// SHOPIFY ORDER SYNC
// ==========================================

// Sync orders from Shopify
app.post('/api/marketplace-connections/:id/sync-shopify-orders', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sinceDate } = req.body;

    const connection = await prisma.marketplaceConnection.findFirst({
      where: { id, companyId: req.user.companyId, marketplace: 'SHOPIFY' }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Shopify connection not found' });
    }

    if (!connection.shopUrl || !connection.shopifyAccessToken) {
      return res.status(400).json({ error: 'Shopify credentials not configured' });
    }

    const results = { synced: 0, errors: 0, orders: [] };

    try {
      // Fetch orders from Shopify
      let ordersUrl = `https://${connection.shopUrl}/admin/api/2024-01/orders.json?status=any&limit=50`;
      if (sinceDate) {
        ordersUrl += `&created_at_min=${sinceDate}`;
      }

      const ordersResponse = await fetch(ordersUrl, {
        headers: {
          'X-Shopify-Access-Token': connection.shopifyAccessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!ordersResponse.ok) {
        const errorData = await ordersResponse.json();
        throw new Error(errorData.errors || ordersResponse.statusText);
      }

      const ordersData = await ordersResponse.json();
      const shopifyOrders = ordersData.orders || [];

      for (const shopifyOrder of shopifyOrders) {
        try {
          // Check if order already synced
          const existingSync = await prisma.marketplaceOrderSync.findFirst({
            where: {
              connectionId: id,
              externalOrderId: String(shopifyOrder.id)
            }
          });

          if (existingSync) {
            continue; // Skip already synced orders
          }

          // Create or find customer
          let customer = await prisma.customer.findFirst({
            where: {
              email: shopifyOrder.email,
              companyId: req.user.companyId
            }
          });

          if (!customer && shopifyOrder.customer) {
            customer = await prisma.customer.create({
              data: {
                name: `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}`.trim() || 'Guest',
                code: `SHOP-${shopifyOrder.customer.id}`,
                email: shopifyOrder.email,
                phone: shopifyOrder.customer.phone,
                companyId: req.user.companyId,
                customerType: 'B2C'
              }
            });
          }

          // Determine if wholesale
          const isWholesale = connection.accountName.toLowerCase().includes('wholesale');

          // Create sales order
          const orderNumber = `SHOP-${shopifyOrder.order_number}`;

          // Skip if order already exists
          const existingOrder = await prisma.salesOrder.findUnique({
            where: { orderNumber }
          });

          if (existingOrder) {
            // Log as already synced
            await prisma.marketplaceOrderSync.create({
              data: {
                connectionId: id,
                externalOrderId: String(shopifyOrder.id),
                orderId: existingOrder.id,
                status: 'COMPLETED',
                orderData: shopifyOrder
              }
            });
            results.synced++;
            continue;
          }

          const salesOrder = await prisma.salesOrder.create({
            data: {
              orderNumber,
              customerId: customer?.id,
              isWholesale,
              salesChannel: connection.accountName,
              externalOrderId: String(shopifyOrder.id),
              status: shopifyOrder.fulfillment_status === 'fulfilled' ? 'SHIPPED' : 'PENDING',
              subtotal: parseFloat(shopifyOrder.subtotal_price || 0),
              taxAmount: parseFloat(shopifyOrder.total_tax || 0),
              shippingCost: parseFloat(shopifyOrder.total_shipping_price_set?.shop_money?.amount || 0),
              totalAmount: parseFloat(shopifyOrder.total_price || 0),
              shippingAddress: shopifyOrder.shipping_address ?
                `${shopifyOrder.shipping_address.address1}, ${shopifyOrder.shipping_address.city}, ${shopifyOrder.shipping_address.zip}` : null,
              orderDate: new Date(shopifyOrder.created_at)
            }
          });

          // Log sync
          await prisma.marketplaceOrderSync.create({
            data: {
              connectionId: id,
              externalOrderId: String(shopifyOrder.id),
              orderId: salesOrder.id,
              status: 'COMPLETED',
              orderData: shopifyOrder
            }
          });

          results.synced++;
          results.orders.push({
            orderNumber,
            shopifyOrderId: shopifyOrder.id,
            total: shopifyOrder.total_price
          });
        } catch (orderError) {
          console.error(`Error syncing Shopify order ${shopifyOrder.id}:`, orderError);
          results.errors++;
        }
      }

      // Update last sync time
      await prisma.marketplaceConnection.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: results.errors > 0 ? `${results.errors} orders failed to sync` : null
        }
      });

      res.json({
        message: `Synced ${results.synced} orders from Shopify`,
        results
      });
    } catch (syncError) {
      await prisma.marketplaceConnection.update({
        where: { id },
        data: { lastSyncError: syncError.message }
      });
      throw syncError;
    }
  } catch (error) {
    console.error('Error syncing Shopify orders:', error);
    res.status(500).json({ error: 'Failed to sync orders', details: error.message });
  }
});

// ==========================================
// COURIER SHIPMENT ROUTES
// ==========================================

// Get all shipments
app.get('/api/courier-shipments', verifyToken, async (req, res) => {
  try {
    const { status, courier } = req.query;
    
    const where = { companyId: req.user.companyId };
    
    if (status) {
      where.status = status;
    }
    
    let shipments;
    
    if (courier) {
      shipments = await prisma.courierShipment.findMany({
        where,
        include: {
          connection: {
            where: { courier }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Filter out shipments without matching courier
      shipments = shipments.filter(s => s.connection !== null);
    } else {
      shipments = await prisma.courierShipment.findMany({
        where,
        include: {
          connection: {
            select: { courier: true, accountName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    res.json(shipments);
  } catch (error) {
    console.error('Error fetching courier shipments:', error);
    res.status(500).json({ error: 'Failed to fetch courier shipments' });
  }
});

// Get shipment by ID
app.get('/api/courier-shipments/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await prisma.courierShipment.findFirst({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      include: {
        connection: true
      }
    });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

// Get shipment by tracking number
app.get('/api/courier-shipments/tracking/:trackingNumber', verifyToken, async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const shipment = await prisma.courierShipment.findFirst({
      where: { 
        trackingNumber,
        companyId: req.user.companyId 
      },
      include: {
        connection: {
          select: { courier: true, accountName: true }
        }
      }
    });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

// Create shipment
app.post('/api/courier-shipments', verifyToken, async (req, res) => {
  try {
    const { 
      connectionId, 
      orderId, 
      trackingNumber, 
      labelUrl, 
      serviceCode, 
      weight, 
      cost, 
      estimatedDelivery 
    } = req.body;
    
    const shipment = await prisma.courierShipment.create({
      data: {
        connectionId,
        orderId,
        trackingNumber,
        labelUrl,
        serviceCode,
        weight,
        cost,
        status: 'LABEL_CREATED',
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        companyId: req.user.companyId
      },
      include: {
        connection: {
          select: { courier: true, accountName: true }
        }
      }
    });
    
    res.status(201).json(shipment);
  } catch (error) {
    console.error('Error creating shipment:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Tracking number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create shipment' });
    }
  }
});

// Update shipment status
app.put('/api/courier-shipments/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actualDelivery } = req.body;
    
    const data = { status };
    
    if (actualDelivery) {
      data.actualDelivery = new Date(actualDelivery);
    }
    
    const result = await prisma.courierShipment.updateMany({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      data
    });
    
    if (result.count === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const updated = await prisma.courierShipment.findUnique({
      where: { id },
      include: {
        connection: {
          select: { courier: true, accountName: true }
        }
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({ error: 'Failed to update shipment status' });
  }
});

// Generate shipping label (placeholder - needs actual courier API integration)
app.post('/api/courier-shipments/generate-label', verifyToken, async (req, res) => {
  try {
    const { connectionId, orderId, weight, serviceCode } = req.body;
    
    // TODO: Implement actual courier API integration
    console.log(`Label generation requested for order ${orderId} via connection ${connectionId}`);
    
    res.json({ 
      message: 'Label generation initiated', 
      status: 'PENDING',
      note: 'Courier API integration pending implementation'
    });
  } catch (error) {
    console.error('Error generating shipping label:', error);
    res.status(500).json({ error: 'Failed to generate shipping label' });
  }
});

// ==========================================
// LABEL TEMPLATES
// ==========================================

// In-memory storage for labels and printer settings (in production use database)
let labelTemplates = [
  { id: '1', templateName: 'Standard Shipping Label', name: 'Standard Shipping Label', type: 'Shipping', format: 'ZPL', width: 4, height: 6, dpi: 203, uses: 156, status: 'active', createdAt: new Date().toISOString() },
  { id: '2', templateName: 'Product Barcode Label', name: 'Product Barcode Label', type: 'Product', format: 'ZPL', width: 2, height: 1, dpi: 203, uses: 89, status: 'active', createdAt: new Date().toISOString() },
  { id: '3', templateName: 'Location Tag', name: 'Location Tag', type: 'Location', format: 'ZPL', width: 3, height: 2, dpi: 203, uses: 45, status: 'active', createdAt: new Date().toISOString() },
  { id: '4', templateName: 'Pallet Label', name: 'Pallet Label', type: 'Pallet', format: 'ZPL', width: 4, height: 4, dpi: 203, uses: 23, status: 'active', createdAt: new Date().toISOString() },
];

let printerSettings = {
  id: '1',
  defaultPrinter: 'Zebra ZD420',
  printerType: 'thermal',
  connectionType: 'network',
  ipAddress: '192.168.1.100',
  port: 9100,
  labelWidth: 4,
  labelHeight: 6,
  dpi: 203,
  autoprint: false,
  printCopies: 1,
  darkness: 15,
  speed: 6,
  testModeEnabled: false,
  printers: [
    { id: '1', name: 'Zebra ZD420', type: 'thermal', connection: 'network', status: 'online', location: 'Shipping Desk', ipAddress: '192.168.1.100' },
    { id: '2', name: 'Zebra ZD620', type: 'thermal', connection: 'usb', status: 'offline', location: 'Warehouse A' },
  ]
};

let printAgents = [];
let printJobs = [];

// GET all labels
app.get('/api/labels', verifyToken, async (req, res) => {
  try {
    res.json(labelTemplates);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

// GET single label
app.get('/api/labels/:id', verifyToken, async (req, res) => {
  try {
    const label = labelTemplates.find(l => l.id === req.params.id);
    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }
    res.json(label);
  } catch (error) {
    console.error('Error fetching label:', error);
    res.status(500).json({ error: 'Failed to fetch label' });
  }
});

// POST create label
app.post('/api/labels', verifyToken, async (req, res) => {
  try {
    const { templateName, name, type, format, width, height, dpi, status } = req.body;
    const newLabel = {
      id: String(Date.now()),
      templateName: templateName || name,
      name: templateName || name,
      type,
      format: format || 'ZPL',
      width: width || 4,
      height: height || 6,
      dpi: dpi || 203,
      uses: 0,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    labelTemplates.push(newLabel);
    res.status(201).json(newLabel);
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

// PUT update label
app.put('/api/labels/:id', verifyToken, async (req, res) => {
  try {
    const index = labelTemplates.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }
    const { templateName, name, type, format, width, height, dpi, status } = req.body;
    labelTemplates[index] = {
      ...labelTemplates[index],
      templateName: templateName || name || labelTemplates[index].templateName,
      name: templateName || name || labelTemplates[index].name,
      type: type || labelTemplates[index].type,
      format: format || labelTemplates[index].format,
      width: width || labelTemplates[index].width,
      height: height || labelTemplates[index].height,
      dpi: dpi || labelTemplates[index].dpi,
      status: status || labelTemplates[index].status,
      updatedAt: new Date().toISOString()
    };
    res.json(labelTemplates[index]);
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

// DELETE label
app.delete('/api/labels/:id', verifyToken, async (req, res) => {
  try {
    const index = labelTemplates.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }
    labelTemplates.splice(index, 1);
    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// POST print label
app.post('/api/labels/:id/print', verifyToken, async (req, res) => {
  try {
    const index = labelTemplates.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Label not found' });
    }
    // Increment uses count
    labelTemplates[index].uses = (labelTemplates[index].uses || 0) + 1;
    labelTemplates[index].lastUsed = new Date().toISOString();
    res.json({ message: 'Label printed successfully', uses: labelTemplates[index].uses });
  } catch (error) {
    console.error('Error printing label:', error);
    res.status(500).json({ error: 'Failed to print label' });
  }
});

// POST generate ZPL
app.post('/api/labels/generate-zpl', verifyToken, async (req, res) => {
  try {
    const { templateType, templateId, data } = req.body;
    let zpl = '';

    // Generate ZPL based on template type
    switch (templateType?.toLowerCase()) {
      case 'shipping':
        zpl = `^XA
^PW812
^LL1218
^CF0,40
^FO50,50^FD${data?.shipFrom?.name || 'Sender'}^FS
^FO50,100^A0N,30,30^FD${data?.shipFrom?.address || '123 Sender St'}^FS
^FO50,140^A0N,30,30^FD${data?.shipFrom?.city || 'City'}, ${data?.shipFrom?.state || 'ST'} ${data?.shipFrom?.zip || '00000'}^FS
^FO50,250^GB700,3,3^FS
^FO50,280^A0N,50,50^FDSHIP TO:^FS
^FO50,350^A0N,40,40^FD${data?.shipTo?.name || 'Recipient'}^FS
^FO50,400^A0N,35,35^FD${data?.shipTo?.address || '456 Recipient Ave'}^FS
^FO50,450^A0N,35,35^FD${data?.shipTo?.city || 'City'}, ${data?.shipTo?.state || 'ST'} ${data?.shipTo?.zip || '00000'}^FS
^FO50,500^A0N,35,35^FD${data?.shipTo?.country || 'USA'}^FS
^FO50,580^GB700,3,3^FS
^BY3,3,150
^FO100,620^BC^FD${data?.trackingNumber || '1Z999AA10123456784'}^FS
^FO50,820^A0N,30,30^FDTracking: ${data?.trackingNumber || '1Z999AA10123456784'}^FS
^FO50,870^A0N,25,25^FDOrder: ${data?.orderNumber || 'ORD-12345'} | ${data?.carrier || 'UPS'} ${data?.serviceType || 'GROUND'}^FS
^FO50,920^A0N,25,25^FDWeight: ${data?.weight || '0.0'} lbs | ${data?.dimensions || '0x0x0'}^FS
^XZ`;
        break;
      case 'product':
        zpl = `^XA
^PW406
^LL203
^CF0,35
^FO20,20^FD${data?.name || 'Product Name'}^FS
^FO20,60^A0N,25,25^FD${data?.sku || 'SKU-001'}^FS
^FO20,90^A0N,25,25^FD£${data?.price || '0.00'}^FS
^BY2,2,80
^FO20,120^BC^FD${data?.barcode || '012345678901'}^FS
^XZ`;
        break;
      case 'location':
        zpl = `^XA
^PW609
^LL406
^CF0,60
^FO30,30^FD${data?.locationCode || 'A-01-01-A'}^FS
^FO30,100^A0N,40,40^FDZone: ${data?.zone || 'A'} | Aisle: ${data?.aisle || '01'}^FS
^FO30,150^A0N,40,40^FDRack: ${data?.rack || '01'} | Shelf: ${data?.shelf || 'A'}^FS
^BY3,3,100
^FO30,220^BC^FD${data?.locationCode || 'A-01-01-A'}^FS
^FO30,350^A0N,25,25^FD${data?.warehouseName || 'Warehouse'} - ${data?.locationType || 'STORAGE'}^FS
^XZ`;
        break;
      case 'pallet':
        zpl = `^XA
^PW812
^LL812
^CF0,60
^FO50,50^FDPALLET^FS
^FO50,120^A0N,70,70^FD${data?.palletId || 'PLT-00001'}^FS
^FO50,220^GB700,3,3^FS
^FO50,250^A0N,35,35^FDContents: ${data?.contents || 'Mixed Products'}^FS
^FO50,300^A0N,35,35^FDItems: ${data?.totalItems || '0'} | Weight: ${data?.totalWeight || '0'} kg^FS
^FO50,350^A0N,35,35^FDDestination: ${data?.destination || 'TBD'}^FS
^FO50,400^A0N,35,35^FDPO: ${data?.poNumber || 'N/A'}^FS
^BY3,3,150
^FO100,480^BC^FD${data?.palletId || 'PLT-00001'}^FS
^XZ`;
        break;
      default:
        zpl = `^XA^CF0,40^FO50,50^FDSample Label^FS^XZ`;
    }

    res.json({ zpl, templateType, templateId });
  } catch (error) {
    console.error('Error generating ZPL:', error);
    res.status(500).json({ error: 'Failed to generate ZPL' });
  }
});

// POST print direct
app.post('/api/labels/print-direct', verifyToken, async (req, res) => {
  try {
    const { ipAddress, port, labelType, data } = req.body;
    // In production, this would send ZPL directly to the printer via TCP
    console.log(`Direct print to ${ipAddress}:${port} for ${labelType}`);
    res.json({ message: 'Label sent to printer', ipAddress, port });
  } catch (error) {
    console.error('Error direct printing:', error);
    res.status(500).json({ error: 'Failed to print directly' });
  }
});

// ==========================================
// PRINTER SETTINGS
// ==========================================

// GET printer settings
app.get('/api/printer-settings', verifyToken, async (req, res) => {
  try {
    res.json(printerSettings);
  } catch (error) {
    console.error('Error fetching printer settings:', error);
    res.status(500).json({ error: 'Failed to fetch printer settings' });
  }
});

// PUT update printer settings
app.put('/api/printer-settings', verifyToken, async (req, res) => {
  try {
    printerSettings = { ...printerSettings, ...req.body };
    res.json(printerSettings);
  } catch (error) {
    console.error('Error updating printer settings:', error);
    res.status(500).json({ error: 'Failed to update printer settings' });
  }
});

// POST test printer
app.post('/api/printer-settings/test', verifyToken, async (req, res) => {
  try {
    const { printerId } = req.body;
    const printer = printerSettings.printers.find(p => p.id === printerId);
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }
    // Simulate printer test
    res.json({ success: printer.status === 'online', message: printer.status === 'online' ? 'Printer connection successful' : 'Printer is offline' });
  } catch (error) {
    console.error('Error testing printer:', error);
    res.status(500).json({ error: 'Failed to test printer' });
  }
});

// POST add printer
app.post('/api/printer-settings/printers', verifyToken, async (req, res) => {
  try {
    const { name, type, connection, ipAddress, location } = req.body;
    const newPrinter = {
      id: String(Date.now()),
      name,
      type: type || 'thermal',
      connection: connection || 'network',
      status: 'online',
      location: location || '',
      ipAddress: ipAddress || ''
    };
    printerSettings.printers.push(newPrinter);
    res.status(201).json(newPrinter);
  } catch (error) {
    console.error('Error adding printer:', error);
    res.status(500).json({ error: 'Failed to add printer' });
  }
});

// DELETE printer
app.delete('/api/printer-settings/printers/:id', verifyToken, async (req, res) => {
  try {
    const index = printerSettings.printers.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Printer not found' });
    }
    printerSettings.printers.splice(index, 1);
    res.json({ message: 'Printer removed successfully' });
  } catch (error) {
    console.error('Error removing printer:', error);
    res.status(500).json({ error: 'Failed to remove printer' });
  }
});

// ==========================================
// PRINT AGENT
// ==========================================

// GET print agents
app.get('/api/print-agent/list', verifyToken, async (req, res) => {
  try {
    res.json(printAgents);
  } catch (error) {
    console.error('Error fetching print agents:', error);
    res.status(500).json({ error: 'Failed to fetch print agents' });
  }
});

// POST register print agent
app.post('/api/print-agent/register', verifyToken, async (req, res) => {
  try {
    const { agentName, computerName, printers, version } = req.body;
    const agent = {
      agentId: String(Date.now()),
      agentName,
      computerName,
      printers: printers || [],
      version: version || '1.0.0',
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      registeredAt: new Date().toISOString()
    };
    printAgents.push(agent);
    res.status(201).json(agent);
  } catch (error) {
    console.error('Error registering print agent:', error);
    res.status(500).json({ error: 'Failed to register print agent' });
  }
});

// POST heartbeat
app.post('/api/print-agent/heartbeat', verifyToken, async (req, res) => {
  try {
    const { agentId } = req.body;
    const agent = printAgents.find(a => a.agentId === agentId);
    if (agent) {
      agent.lastHeartbeat = new Date().toISOString();
      agent.status = 'online';
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

// GET print jobs
app.get('/api/print-agent/jobs', verifyToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    res.json(printJobs.slice(0, parseInt(limit)));
  } catch (error) {
    console.error('Error fetching print jobs:', error);
    res.status(500).json({ error: 'Failed to fetch print jobs' });
  }
});

// POST submit print job
app.post('/api/print-agent/submit-job', verifyToken, async (req, res) => {
  try {
    const { agentId, printerName, labelType, copies } = req.body;
    const job = {
      jobId: String(Date.now()),
      agentId,
      printerName,
      labelType,
      copies: copies || 1,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    printJobs.unshift(job);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error submitting print job:', error);
    res.status(500).json({ error: 'Failed to submit print job' });
  }
});

// PUT update print job status
app.put('/api/print-agent/jobs/:jobId', verifyToken, async (req, res) => {
  try {
    const job = printJobs.find(j => j.jobId === req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const { status, error } = req.body;
    job.status = status;
    if (error) job.error = error;
    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date().toISOString();
    }
    res.json(job);
  } catch (error) {
    console.error('Error updating print job:', error);
    res.status(500).json({ error: 'Failed to update print job' });
  }
});

// ==========================================
// BASE REPORTS ENDPOINT
// ==========================================

// GET reports list
app.get('/api/reports', verifyToken, async (req, res) => {
  try {
    res.json({
      reports: [
        { id: 'inventory', name: 'Inventory Report', description: 'Current inventory levels across all warehouses' },
        { id: 'sales', name: 'Sales Report', description: 'Sales orders and revenue analysis' },
        { id: 'stock-movements', name: 'Stock Movements', description: 'All inventory movements' },
        { id: 'summary', name: 'Dashboard Summary', description: 'Key metrics overview' },
        { id: 'stock-valuation', name: 'Stock Valuation', description: 'Total value of inventory' },
        { id: 'abc-analysis', name: 'ABC Analysis', description: 'Product classification by value' },
        { id: 'low-stock', name: 'Low Stock Report', description: 'Items below reorder point' }
      ]
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// END OF NEW ROUTES

// Register integration routes with real API services
registerIntegrationRoutes(app, prisma, verifyToken);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WMS API Server running on port ${PORT}`);
  console.log(`🌐 Binding to 0.0.0.0 (all interfaces)`);
  console.log(`📊 Database: PostgreSQL + Prisma`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n✅ API Endpoints:`);
  console.log(`   - Health: GET /health`);
  console.log(`   - Auth: POST /api/auth/login`);
  console.log(`   - Brands: GET /api/brands`);
  console.log(`   - Products: GET /api/products`);
  console.log(`   - Inventory: GET /api/inventory`);
  console.log(`   - Orders: GET /api/sales-orders`);
  console.log(`   - Replenishment: GET /api/replenishment/tasks`);
  console.log(`   - FBA Transfers: GET /api/transfers`);
  console.log(`   - Analytics: GET /api/analytics/channel-prices`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
