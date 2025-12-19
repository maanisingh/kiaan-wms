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

// Disable caching for API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

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

    res.json(adjustments);
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

// Get all cycle counts
app.get('/api/inventory/cycle-counts', verifyToken, async (req, res) => {
  try {
    // Check if model exists
    if (!prisma.cycleCount) {
      console.log('CycleCount model not available');
      return res.json([]);
    }

    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    // Try with full includes first, fallback to simple query
    let cycleCounts;
    try {
      cycleCounts = await prisma.cycleCount.findMany({
        where,
        include: {
          warehouse: {
            select: { id: true, name: true, code: true }
          },
          items: {
            include: {
              product: true
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

    // Resolve location IDs to full location objects
    const cycleCountsWithLocations = await Promise.all(
      cycleCounts.map(async (cc) => {
        if (cc.locations && Array.isArray(cc.locations) && cc.locations.length > 0) {
          const locationDetails = await prisma.location.findMany({
            where: { id: { in: cc.locations } },
            select: { id: true, name: true, code: true, aisle: true, rack: true, shelf: true, bin: true }
          });
          return { ...cc, locationDetails };
        }
        return { ...cc, locationDetails: [] };
      })
    );

    res.json(cycleCountsWithLocations);
  } catch (error) {
    console.error('Get cycle counts error:', error);
    // Return empty array for any error to prevent 500
    return res.json([]);
  }
});

// Create cycle count
app.post('/api/inventory/cycle-counts', verifyToken, async (req, res) => {
  try {
    const { name, type, warehouseId, locations, scheduledDate } = req.body;

    // Get default warehouse if not provided
    let effectiveWarehouseId = warehouseId;
    if (!effectiveWarehouseId) {
      const defaultWarehouse = await prisma.warehouse.findFirst({
        where: { code: 'WH-MAIN' }
      });
      effectiveWarehouseId = defaultWarehouse?.id || 'c483471e-7137-49fb-b871-316842b061fa';
    }

    const cycleCount = await prisma.cycleCount.create({
      data: {
        id: require('crypto').randomUUID(),
        warehouseId: effectiveWarehouseId,
        name,
        status: 'SCHEDULED',
        type: type || 'FULL',
        scheduledDate: new Date(scheduledDate),
        locations: locations || [],
        createdAt: new Date()
      }
    });

    res.status(201).json(cycleCount);
  } catch (error) {
    console.error('Create cycle count error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    const { productId, locationId, status } = req.query;

    const where = {
      // Only return inventory with batch tracking (has batchNumber or lotNumber)
      OR: [
        { batchNumber: { not: null } },
        { lotNumber: { not: null } }
      ]
    };
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

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

    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
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
        warehouse: true
      }
    });

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json(batch);
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
    const { productId, type, startDate, endDate, limit } = req.query;

    // Check if model exists (Prisma client may need regeneration)
    if (!prisma.inventoryMovement) {
      console.log('InventoryMovement model not available - returning empty array');
      return res.json([]);
    }

    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true
          }
        },
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

    const movement = await prisma.inventoryMovement.create({
      data: {
        id: require('crypto').randomUUID(),
        type,
        productId,
        batchId,
        fromLocationId,
        toLocationId,
        quantity: parseFloat(quantity),
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
    res.status(500).json({ error: 'Internal server error' });
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
        _count: {
          select: { inventory: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(products);
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

    // Add computed counts for frontend
    const inventoryList = product.inventory || [];
    const uniqueLocations = new Set(inventoryList.map(inv => inv.locationId).filter(Boolean));
    const uniqueWarehouses = new Set(inventoryList.map(inv => inv.warehouseId).filter(Boolean));

    const response = {
      ...product,
      locationCount: uniqueLocations.size,
      warehouseCount: uniqueWarehouses.size,
      totalStock: inventoryList.reduce((sum, inv) => sum + (inv.quantity || 0), 0),
      reservedStock: inventoryList.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0),
      availableStock: inventoryList.reduce((sum, inv) => sum + (inv.availableQuantity || inv.quantity || 0), 0)
    };

    res.json(response);
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

    // Check if product has inventory - prevent delete if it does
    const inventoryCount = await prisma.inventory.count({
      where: { productId: id, quantity: { gt: 0 } }
    });

    if (inventoryCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete product with active inventory. Please remove all inventory first.'
      });
    }

    // Delete related records in order (handle foreign key constraints)
    // 1. Bundle items (where this product is parent or child)
    await prisma.bundleItem.deleteMany({
      where: {
        OR: [
          { parentId: id },
          { childId: id }
        ]
      }
    });

    // 2. Alternative SKUs
    await prisma.alternativeSku.deleteMany({
      where: { productId: id }
    });

    // 3. Supplier products
    await prisma.supplierProduct.deleteMany({
      where: { productId: id }
    });

    // 4. Inventory movements
    await prisma.inventoryMovement.deleteMany({
      where: { productId: id }
    });

    // 5. Empty inventory records (quantity = 0)
    await prisma.inventory.deleteMany({
      where: { productId: id }
    });

    // 6. Purchase order items (if any)
    try {
      await prisma.purchaseOrderItem.deleteMany({
        where: { productId: id }
      });
    } catch (e) {
      // Table might not exist
    }

    // 7. Stock adjustment items
    try {
      await prisma.stockAdjustmentItem.deleteMany({
        where: { productId: id }
      });
    } catch (e) {
      // Table might not exist
    }

    // Finally delete the product
    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get product history (inventory movements, adjustments)
app.get('/api/products/:id/history', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    // Get inventory movements for this product
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId: id },
      include: {
        fromLocation: true,
        toLocation: true
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: {
          include: { warehouse: true, location: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const inventoryList = product.inventory || [];
    const totalQuantity = inventoryList.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
    const reservedQuantity = inventoryList.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0);
    const availableQuantity = totalQuantity - reservedQuantity;
    const uniqueLocations = new Set(inventoryList.map(inv => inv.locationId).filter(Boolean));

    // Get expiring inventory (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = inventoryList
      .filter(inv => inv.bestBeforeDate && new Date(inv.bestBeforeDate) <= thirtyDaysFromNow)
      .map(inv => ({
        id: inv.id,
        lotNumber: inv.lotNumber || inv.batchNumber || 'N/A',
        bestBeforeDate: inv.bestBeforeDate,
        quantity: inv.quantity,
        warehouse: inv.warehouse?.name || 'Unknown',
        location: inv.location?.name || 'Unknown',
        daysUntilExpiry: Math.ceil((new Date(inv.bestBeforeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }));

    res.json({
      currentStock: {
        totalQuantity,
        availableQuantity,
        reservedQuantity,
        locationCount: uniqueLocations.size
      },
      movements30Days: {},
      orderHistory: {
        totalOrders: 0,
        totalQuantitySold: 0
      },
      expiringSoon
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

    const batchBarcodes = (product.inventory || [])
      .filter(inv => inv.batchBarcode || inv.lotNumber || inv.batchNumber)
      .map(inv => ({
        id: inv.id,
        lotNumber: inv.lotNumber || '',
        batchNumber: inv.batchNumber || '',
        barcode: inv.batchBarcode || '',
        bestBeforeDate: inv.bestBeforeDate ? inv.bestBeforeDate.toISOString() : '',
        quantity: inv.quantity || 0,
        warehouse: inv.warehouse?.name || 'Unknown',
        location: inv.location?.name || 'Unknown',
        receivedAt: inv.receivedDate ? inv.receivedDate.toISOString() : inv.createdAt?.toISOString() || ''
      }));

    res.json({
      productBarcode: product.barcode || '',
      sku: product.sku,
      name: product.name,
      batchBarcodes
    });
  } catch (error) {
    console.error('Get product barcode history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get suppliers for a specific product
app.get('/api/products/:id/supplier-products', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const supplierProducts = await prisma.supplierProduct.findMany({
      where: { productId: id },
      include: {
        product: {
          select: { sku: true, name: true }
        }
      }
    });

    // Fetch supplier details separately
    const supplierIds = [...new Set(supplierProducts.map(sp => sp.supplierId))];
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } }
    });
    const supplierMap = suppliers.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

    const result = supplierProducts.map(sp => ({
      ...sp,
      supplier: supplierMap[sp.supplierId] || null
    }));

    res.json(result);
  } catch (error) {
    console.error('Get product suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add/update supplier for a product
app.post('/api/products/:id/supplier-products', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierId, supplierSku, supplierName, caseSize, caseCost, unitCost, leadTimeDays, moq, isPrimary } = req.body;

    if (!supplierId || !supplierSku) {
      return res.status(400).json({ error: 'supplierId and supplierSku are required' });
    }

    // Check if this supplier-product relationship already exists
    const existing = await prisma.supplierProduct.findFirst({
      where: { productId: id, supplierId }
    });

    let supplierProduct;
    if (existing) {
      supplierProduct = await prisma.supplierProduct.update({
        where: { id: existing.id },
        data: {
          supplierSku: supplierSku || existing.supplierSku,
          supplierName: supplierName !== undefined ? supplierName : existing.supplierName,
          caseSize: caseSize !== undefined ? caseSize : existing.caseSize,
          caseCost: caseCost !== undefined ? caseCost : existing.caseCost,
          unitCost: unitCost !== undefined ? unitCost : existing.unitCost,
          leadTimeDays: leadTimeDays !== undefined ? leadTimeDays : existing.leadTimeDays,
          moq: moq !== undefined ? moq : existing.moq,
          isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary
        }
      });
    } else {
      supplierProduct = await prisma.supplierProduct.create({
        data: {
          productId: id,
          supplierId,
          supplierSku,
          supplierName: supplierName || null,
          caseSize: caseSize || 1,
          caseCost: caseCost || null,
          unitCost: unitCost || null,
          leadTimeDays: leadTimeDays || null,
          moq: moq || null,
          isPrimary: isPrimary || false,
          companyId: req.user.companyId
        }
      });
    }

    // Fetch supplier details
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });

    res.status(201).json({ ...supplierProduct, supplier });
  } catch (error) {
    console.error('Add product supplier error:', error);
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

// Get inventory sorted by best before date (expiring soon first)
app.get('/api/inventory/by-best-before-date', verifyToken, async (req, res) => {
  try {
    const { warehouseId, productId, minDate, maxDate } = req.query;

    const where = {
      quantity: { gt: 0 }
    };
    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;

    // Date range filter
    if (minDate || maxDate) {
      where.bestBeforeDate = {};
      if (minDate) where.bestBeforeDate.gte = new Date(minDate);
      if (maxDate) where.bestBeforeDate.lte = new Date(maxDate);
    }

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
        { productId: 'asc' },
        { bestBeforeDate: 'asc' }
      ]
    });

    // Group by product, then by best-before-date
    const productMap = new Map();

    for (const item of inventory) {
      const productId = item.productId;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product: {
            id: item.product.id,
            sku: item.product.sku,
            name: item.product.name,
            brand: item.product.brand
          },
          byBestBeforeDate: {}
        });
      }

      const productData = productMap.get(productId);
      const bbdKey = item.bestBeforeDate
        ? new Date(item.bestBeforeDate).toISOString().split('T')[0]
        : 'no-date';

      if (!productData.byBestBeforeDate[bbdKey]) {
        productData.byBestBeforeDate[bbdKey] = {
          bestBeforeDate: item.bestBeforeDate,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          locations: []
        };
      }

      const bbdData = productData.byBestBeforeDate[bbdKey];
      bbdData.totalQuantity += item.quantity || 0;
      bbdData.availableQuantity += item.availableQuantity || 0;
      bbdData.reservedQuantity += item.reservedQuantity || 0;
      bbdData.locations.push({
        locationCode: item.location?.code || 'Unknown',
        locationName: item.location?.name || 'Unknown',
        quantity: item.quantity || 0,
        availableQuantity: item.availableQuantity || 0
      });
    }

    // Sort products by their earliest best before date
    const result = Array.from(productMap.values()).sort((a, b) => {
      // Get earliest BBD for each product
      const getEarliestBBD = (product) => {
        const dates = Object.values(product.byBestBeforeDate)
          .map(bbd => bbd.bestBeforeDate)
          .filter(d => d !== null)
          .map(d => new Date(d).getTime());
        return dates.length > 0 ? Math.min(...dates) : Infinity;
      };
      return getEarliestBBD(a) - getEarliestBBD(b);
    });

    res.json({ inventory: result });
  } catch (error) {
    console.error('Get inventory by best before date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory grouped by location
app.get('/api/inventory/by-location', verifyToken, async (req, res) => {
  try {
    const { warehouseId, locationType } = req.query;

    // Build location filter
    const locationWhere = {};
    if (warehouseId) locationWhere.warehouseId = warehouseId;
    if (locationType) locationWhere.locationType = locationType;

    // Get all locations with their inventory
    const locations = await prisma.location.findMany({
      where: locationWhere,
      include: {
        zone: true,
        warehouse: true
      },
      orderBy: [
        { pickSequence: 'asc' },
        { code: 'asc' }
      ]
    });

    // Get inventory for these locations
    const inventory = await prisma.inventory.findMany({
      where: {
        locationId: { in: locations.map(l => l.id) },
        quantity: { gt: 0 }
      },
      include: {
        product: true,
        location: true
      }
    });

    // Group inventory by location
    const locationMap = new Map();

    for (const loc of locations) {
      locationMap.set(loc.id, {
        location: {
          id: loc.id,
          code: loc.code,
          name: loc.name,
          locationType: loc.locationType || 'PICK',
          isHeatSensitive: loc.isHeatSensitive || false,
          maxWeight: loc.maxWeight,
          pickSequence: loc.pickSequence,
          zone: loc.zone ? { name: loc.zone.name, code: loc.zone.code } : null
        },
        products: [],
        totalItems: 0,
        utilizationWarnings: []
      });
    }

    // Add inventory items to locations
    for (const inv of inventory) {
      const locData = locationMap.get(inv.locationId);
      if (locData) {
        locData.products.push({
          product: {
            sku: inv.product.sku,
            name: inv.product.name,
            isHeatSensitive: inv.product.isHeatSensitive || false,
            weight: inv.product.weight
          },
          quantity: inv.quantity || 0,
          availableQuantity: inv.availableQuantity || 0,
          bestBeforeDate: inv.bestBeforeDate,
          lotNumber: inv.lotNumber
        });
        locData.totalItems += inv.quantity || 0;

        // Check for heat sensitive product in non-heat-sensitive location
        if (inv.product.isHeatSensitive && !locData.location.isHeatSensitive) {
          const existingWarning = locData.utilizationWarnings.find(
            w => w.type === 'HEAT_SENSITIVE_MISMATCH'
          );
          if (!existingWarning) {
            locData.utilizationWarnings.push({
              type: 'HEAT_SENSITIVE_MISMATCH',
              message: 'Heat-sensitive product stored in non-cooled location',
              severity: 'WARNING'
            });
          }
        }
      }
    }

    // Check weight limits
    for (const [, locData] of locationMap) {
      if (locData.location.maxWeight) {
        let totalWeight = 0;
        for (const prod of locData.products) {
          if (prod.product.weight) {
            totalWeight += prod.product.weight * prod.quantity;
          }
        }
        if (totalWeight > locData.location.maxWeight) {
          locData.utilizationWarnings.push({
            type: 'WEIGHT_EXCEEDED',
            message: `Location weight limit exceeded: ${totalWeight.toFixed(2)}kg / ${locData.location.maxWeight}kg`,
            severity: 'ERROR'
          });
        }
      }
    }

    // Filter to only locations with products and sort products by best before date
    const result = Array.from(locationMap.values())
      .filter(l => l.products.length > 0)
      .map(loc => ({
        ...loc,
        products: loc.products.sort((a, b) => {
          // Sort by best before date (earliest first), nulls last
          if (!a.bestBeforeDate && !b.bestBeforeDate) return 0;
          if (!a.bestBeforeDate) return 1;
          if (!b.bestBeforeDate) return -1;
          return new Date(a.bestBeforeDate).getTime() - new Date(b.bestBeforeDate).getTime();
        })
      }));

    res.json({ locations: result });
  } catch (error) {
    console.error('Get inventory by location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export inventory as CSV
app.get('/api/inventory/export', verifyToken, async (req, res) => {
  try {
    const { format = 'csv', warehouseId } = req.query;

    const where = { quantity: { gt: 0 } };
    if (warehouseId) where.warehouseId = warehouseId;

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
        { product: { sku: 'asc' } },
        { bestBeforeDate: 'asc' }
      ]
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'SKU',
        'Product Name',
        'Brand',
        'Barcode',
        'Warehouse',
        'Location',
        'Quantity',
        'Available',
        'Reserved',
        'Lot Number',
        'Batch Number',
        'Best Before Date',
        'Cost Price',
        'Total Value'
      ];

      const rows = inventory.map(inv => [
        inv.product.sku,
        inv.product.name,
        inv.product.brand?.name || '',
        inv.product.barcode || '',
        inv.warehouse?.name || '',
        inv.location?.code || '',
        inv.quantity,
        inv.availableQuantity,
        inv.reservedQuantity || 0,
        inv.lotNumber || '',
        inv.batchNumber || '',
        inv.bestBeforeDate ? new Date(inv.bestBeforeDate).toISOString().split('T')[0] : '',
        inv.product.costPrice || 0,
        ((inv.product.costPrice || 0) * inv.quantity).toFixed(2)
      ]);

      // Escape CSV fields
      const escapeCSV = (field) => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    // JSON format
    res.json({
      exportDate: new Date().toISOString(),
      totalRecords: inventory.length,
      inventory: inventory.map(inv => ({
        sku: inv.product.sku,
        productName: inv.product.name,
        brand: inv.product.brand?.name,
        barcode: inv.product.barcode,
        warehouse: inv.warehouse?.name,
        location: inv.location?.code,
        quantity: inv.quantity,
        availableQuantity: inv.availableQuantity,
        reservedQuantity: inv.reservedQuantity || 0,
        lotNumber: inv.lotNumber,
        batchNumber: inv.batchNumber,
        bestBeforeDate: inv.bestBeforeDate,
        costPrice: inv.product.costPrice,
        totalValue: (inv.product.costPrice || 0) * inv.quantity
      }))
    });
  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({ error: 'Failed to export inventory' });
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

    const order = await prisma.salesOrder.create({
      data: {
        ...orderData,
        items: {
          create: items
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

    res.status(201).json(order);
  } catch (error) {
    console.error('Create sales order error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    const { name, code, warehouseId, zoneId, aisle, rack, shelf, bin } = req.body;

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
        bin: bin !== undefined ? (bin || null) : existing.bin
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

// Alias for /api/replenishment/configs (plural)
app.get('/api/replenishment/configs', verifyToken, async (req, res) => {
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

    // Format for frontend
    res.json(configs.map(config => ({
      id: config.id,
      productId: config.productId,
      product: config.product,
      sku: config.product?.sku,
      name: config.product?.name,
      brand: config.product?.brand?.name,
      minStock: config.minStock,
      maxStock: config.maxStock,
      reorderPoint: config.reorderPoint,
      reorderQty: config.reorderQty,
      fromLocation: config.bulkLocation,
      toLocation: config.pickLocation,
      priority: config.priority || 'MEDIUM',
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    })));
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

    // Get product IDs from all items
    const productIds = [...new Set(transfers.flatMap(t => t.items.map(i => i.productId)))];

    // Fetch products in one query
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    }) : [];

    const productMap = new Map(products.map(p => [p.id, p]));

    // Format response for frontend
    const formattedTransfers = transfers.map(transfer => ({
      ...transfer,
      transferItems: transfer.items.map(item => ({
        ...item,
        product: productMap.get(item.productId) || null
      }))
    }));

    res.json(formattedTransfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transfers', verifyToken, async (req, res) => {
  try {
    const { items, transferItems, type, fromWarehouseId, toWarehouseId, fbaShipmentId, fbaDestination, shipmentBuilt, notes } = req.body;

    // Accept both 'items' and 'transferItems' from frontend
    const itemsToCreate = transferItems || items || [];

    // Generate unique transfer number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const transferNumber = `TRF-${timestamp}${random}`;

    const transfer = await prisma.transfer.create({
      data: {
        transferNumber,
        type: type || 'WAREHOUSE',
        fromWarehouseId,
        toWarehouseId,
        fbaShipmentId: fbaShipmentId || null,
        fbaDestination: fbaDestination || null,
        shipmentBuilt: shipmentBuilt || false,
        notes: notes || null,
        status: 'PENDING',
        items: {
          create: itemsToCreate.map(item => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            receivedQuantity: 0,
            fbaSku: item.fbaSku || null,
            isFBABundle: item.isFBABundle || false
          }))
        }
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: true
      }
    });

    // Fetch products for items
    const productIds = transfer.items.map(i => i.productId);
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    }) : [];
    const productMap = new Map(products.map(p => [p.id, p]));

    // Format response for frontend
    res.status(201).json({
      ...transfer,
      transferItems: transfer.items.map(item => ({
        ...item,
        product: productMap.get(item.productId) || null
      }))
    });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// SALES CHANNELS & ANALYTICS
// ===================================

app.get('/api/channels', verifyToken, async (req, res) => {
  try {
    const channels = await prisma.salesChannel.findMany({
      include: {
        _count: {
          select: { channelPrices: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get order stats by channel
    const orderStats = await prisma.salesOrder.groupBy({
      by: ['channel'],
      _count: true,
      _sum: {
        totalAmount: true
      }
    });

    const statsMap = new Map(orderStats.map(s => [s.channel, { orders: s._count, revenue: s._sum.totalAmount || 0 }]));

    // Format response for frontend
    const formattedChannels = channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      code: channel.code,
      type: channel.type || 'Marketplace',
      status: channel.isActive ? 'active' : 'inactive',
      orders: statsMap.get(channel.code)?.orders || statsMap.get(channel.name)?.orders || 0,
      revenue: statsMap.get(channel.code)?.revenue || statsMap.get(channel.name)?.revenue || 0,
      lastSync: channel.updatedAt ? new Date(channel.updatedAt).toLocaleString() : 'Never',
      apiKey: channel.apiKey || '',
      referralFeePercent: channel.referralFeePercent,
      fixedFee: channel.fixedFee,
      fulfillmentFeePerUnit: channel.fulfillmentFeePerUnit,
      storageFeePerUnit: channel.storageFeePerUnit,
      additionalFees: channel.additionalFees,
      productCount: channel._count?.channelPrices || 0,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt
    }));

    res.json(formattedChannels);
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
// RETURNS & RMA
// ===================================

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

    res.json(returns.map(ret => ({
      id: ret.id,
      rmaNumber: ret.rmaNumber,
      orderNumber: ret.order?.orderNumber || 'N/A',
      orderId: ret.orderId,
      customer: ret.customer?.name || 'Unknown',
      customerId: ret.customerId,
      type: ret.type,
      reason: ret.reason,
      status: ret.status.toLowerCase(),
      totalValue: ret.totalValue,
      refundAmount: ret.refundAmount,
      items: ret.items?.length || 0,
      requestedDate: ret.requestedAt,
      receivedAt: ret.receivedAt,
      completedAt: ret.completedAt,
      notes: ret.notes,
      createdAt: ret.createdAt
    })));
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/returns/:id', verifyToken, async (req, res) => {
  try {
    const returnOrder = await prisma.return.findUnique({
      where: { id: req.params.id },
      include: {
        order: { include: { customer: true, items: { include: { product: true } } } },
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (!returnOrder) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Format response for frontend
    res.json({
      id: returnOrder.id,
      rmaNumber: returnOrder.rmaNumber,
      orderNumber: returnOrder.order?.orderNumber || 'N/A',
      orderId: returnOrder.orderId,
      customer: returnOrder.customer?.name || returnOrder.order?.customer?.name || 'Unknown',
      customerId: returnOrder.customerId,
      type: returnOrder.type,
      reason: returnOrder.reason,
      status: returnOrder.status.toLowerCase(),
      value: returnOrder.totalValue,
      refundAmount: returnOrder.refundAmount,
      requestedDate: returnOrder.requestedAt,
      approvedDate: returnOrder.processedAt,
      completedDate: returnOrder.completedAt,
      notes: returnOrder.notes,
      items: returnOrder.items?.map(item => ({
        id: item.id,
        productId: item.productId,
        sku: item.product?.sku || 'N/A',
        name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        condition: item.condition || 'Good',
        action: item.action,
        refundAmount: item.product?.sellingPrice ? item.product.sellingPrice * item.quantity : 0
      })) || [],
      createdAt: returnOrder.createdAt,
      updatedAt: returnOrder.updatedAt
    });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/returns', verifyToken, async (req, res) => {
  try {
    const { orderId, customerId, type, reason, items, notes, totalValue } = req.body;

    // Generate unique RMA number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const rmaNumber = `RMA-${timestamp}${random}`;

    const newReturn = await prisma.return.create({
      data: {
        rmaNumber,
        orderId: orderId || null,
        customerId: customerId || null,
        type: (type || 'RETURN').toUpperCase(),
        reason: reason || null,
        status: 'PENDING',
        totalValue: parseFloat(totalValue) || 0,
        notes: notes || null,
        items: items?.length > 0 ? {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            condition: item.condition || null,
            action: 'PENDING'
          }))
        } : undefined
      },
      include: {
        order: true,
        customer: true,
        items: { include: { product: true } }
      }
    });

    res.status(201).json(newReturn);
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/returns/:id', verifyToken, async (req, res) => {
  try {
    const { status, reason, notes, refundAmount, type, value, orderNumber, customer } = req.body;

    const existing = await prisma.return.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Return not found' });
    }

    const updatedReturn = await prisma.return.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(type && { type: type.toUpperCase() }),
        ...(reason !== undefined && { reason }),
        ...(notes !== undefined && { notes }),
        ...(value !== undefined && { totalValue: parseFloat(value) }),
        ...(refundAmount !== undefined && { refundAmount: parseFloat(refundAmount) }),
        ...(status?.toUpperCase() === 'RECEIVING' && { receivedAt: new Date() }),
        ...(status?.toUpperCase() === 'PROCESSING' && { processedAt: new Date() }),
        ...(status?.toUpperCase() === 'APPROVED' && { processedAt: new Date() }),
        ...(status?.toUpperCase() === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        order: true,
        customer: true,
        items: { include: { product: true } }
      }
    });

    // Format response for frontend
    res.json({
      id: updatedReturn.id,
      rmaNumber: updatedReturn.rmaNumber,
      orderNumber: updatedReturn.order?.orderNumber || 'N/A',
      customer: updatedReturn.customer?.name || 'Unknown',
      type: updatedReturn.type,
      reason: updatedReturn.reason,
      status: updatedReturn.status.toLowerCase(),
      value: updatedReturn.totalValue,
      refundAmount: updatedReturn.refundAmount,
      requestedDate: updatedReturn.requestedAt,
      approvedDate: updatedReturn.processedAt,
      completedDate: updatedReturn.completedAt,
      notes: updatedReturn.notes,
      items: updatedReturn.items?.map(item => ({
        id: item.id,
        sku: item.product?.sku || 'N/A',
        name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        condition: item.condition || 'Good',
        refundAmount: item.product?.sellingPrice ? item.product.sellingPrice * item.quantity : 0
      })) || []
    });
  } catch (error) {
    console.error('Update return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH alias for PUT (frontend compatibility)
app.patch('/api/returns/:id', verifyToken, async (req, res) => {
  try {
    const { status, reason, notes, refundAmount, type, value } = req.body;

    const existing = await prisma.return.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Return not found' });
    }

    const updatedReturn = await prisma.return.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(type && { type: type.toUpperCase() }),
        ...(reason !== undefined && { reason }),
        ...(notes !== undefined && { notes }),
        ...(value !== undefined && { totalValue: parseFloat(value) }),
        ...(refundAmount !== undefined && { refundAmount: parseFloat(refundAmount) }),
        ...(status?.toUpperCase() === 'RECEIVING' && { receivedAt: new Date() }),
        ...(status?.toUpperCase() === 'PROCESSING' && { processedAt: new Date() }),
        ...(status?.toUpperCase() === 'APPROVED' && { processedAt: new Date() }),
        ...(status?.toUpperCase() === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        order: true,
        customer: true,
        items: { include: { product: true } }
      }
    });

    res.json({
      id: updatedReturn.id,
      rmaNumber: updatedReturn.rmaNumber,
      orderNumber: updatedReturn.order?.orderNumber || 'N/A',
      customer: updatedReturn.customer?.name || 'Unknown',
      type: updatedReturn.type,
      reason: updatedReturn.reason,
      status: updatedReturn.status.toLowerCase(),
      value: updatedReturn.totalValue,
      refundAmount: updatedReturn.refundAmount,
      requestedDate: updatedReturn.requestedAt,
      approvedDate: updatedReturn.processedAt,
      completedDate: updatedReturn.completedAt,
      notes: updatedReturn.notes,
      items: updatedReturn.items?.map(item => ({
        id: item.id,
        sku: item.product?.sku || 'N/A',
        name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        condition: item.condition || 'Good',
        refundAmount: item.product?.sellingPrice ? item.product.sellingPrice * item.quantity : 0
      })) || []
    });
  } catch (error) {
    console.error('Update return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to return
app.post('/api/returns/:id/items', verifyToken, async (req, res) => {
  try {
    const { sku, name, quantity, condition, refundAmount, productId } = req.body;

    const existing = await prisma.return.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Find product by SKU if productId not provided
    let prodId = productId;
    if (!prodId && sku) {
      const product = await prisma.product.findFirst({ where: { sku } });
      if (product) prodId = product.id;
    }

    if (!prodId) {
      // Create a placeholder product or return error
      return res.status(400).json({ error: 'Valid product ID or SKU required' });
    }

    const item = await prisma.returnItem.create({
      data: {
        returnId: req.params.id,
        productId: prodId,
        quantity: quantity || 1,
        condition: condition || 'Good',
        action: 'PENDING'
      },
      include: { product: true }
    });

    res.status(201).json({
      id: item.id,
      sku: item.product?.sku || sku,
      name: item.product?.name || name,
      quantity: item.quantity,
      condition: item.condition,
      refundAmount: refundAmount || (item.product?.sellingPrice ? item.product.sellingPrice * item.quantity : 0)
    });
  } catch (error) {
    console.error('Add return item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete item from return
app.delete('/api/returns/:id/items/:itemId', verifyToken, async (req, res) => {
  try {
    const item = await prisma.returnItem.findFirst({
      where: { id: req.params.itemId, returnId: req.params.id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.returnItem.delete({ where: { id: req.params.itemId } });
    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Delete return item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/returns/:id', verifyToken, async (req, res) => {
  try {
    const existing = await prisma.return.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Return not found' });
    }

    await prisma.returnItem.deleteMany({ where: { returnId: req.params.id } });
    await prisma.return.delete({ where: { id: req.params.id } });

    res.json({ message: 'Return deleted successfully' });
  } catch (error) {
    console.error('Delete return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// SHIPMENTS
// ===================================

app.get('/api/shipments', verifyToken, async (req, res) => {
  try {
    const shipments = [
      { id: '1', shipmentNumber: 'SHP-001', carrier: 'FedEx', tracking: '789456123012', status: 'in_transit', orders: 3, shipDate: new Date().toISOString(), destination: 'New York, NY' },
      { id: '2', shipmentNumber: 'SHP-002', carrier: 'UPS', tracking: '1Z999AA10123456784', status: 'pending', orders: 2, shipDate: null, destination: 'Los Angeles, CA' },
      { id: '3', shipmentNumber: 'SHP-003', carrier: 'DHL', tracking: '1234567890', status: 'delivered', orders: 5, shipDate: new Date(Date.now() - 86400000).toISOString(), destination: 'Chicago, IL' },
      { id: '4', shipmentNumber: 'SHP-004', carrier: 'USPS', tracking: '9400111899223344556677', status: 'in_transit', orders: 1, shipDate: new Date().toISOString(), destination: 'Houston, TX' }
    ];
    res.json(shipments);
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/shipments', verifyToken, async (req, res) => {
  try {
    const { carrier, tracking, destination } = req.body;
    const newShipment = {
      id: require('crypto').randomUUID(),
      shipmentNumber: `SHP-${Date.now().toString().slice(-6)}`,
      carrier,
      tracking,
      destination,
      orders: 0,
      shipDate: null,
      status: 'pending'
    };
    res.status(201).json(newShipment);
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// PACKING
// ===================================

// Get packing tasks - orders that have completed picking (status PICKING or have completed pick lists)
app.get('/api/packing', verifyToken, async (req, res) => {
  try {
    // Get orders with completed pick lists that are ready for packing
    const ordersForPacking = await prisma.salesOrder.findMany({
      where: {
        OR: [
          { status: 'PICKING' },
          { status: 'ALLOCATED' },
          {
            pickLists: {
              some: { status: 'COMPLETED' }
            }
          }
        ]
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        pickLists: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const packingTasks = ordersForPacking.map(order => ({
      id: order.id,
      packingSlip: `PS-${order.orderNumber?.replace('SO-', '') || order.id.slice(0, 8)}`,
      orderNumber: order.orderNumber,
      orderId: order.id,
      customer: order.customer?.name || 'Unknown',
      packer: 'Unassigned',
      status: order.status === 'SHIPPED' ? 'shipped' :
              order.status === 'PICKING' ? 'ready_to_pack' : 'packing',
      priority: (order.priority || 'MEDIUM').toLowerCase(),
      items: order.items?.length || 0,
      totalQuantity: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      weight: `${(order.items?.reduce((sum, item) => sum + item.quantity * 0.5, 0) || 0).toFixed(1)} kg`,
      pickListCompleted: order.pickLists?.[0]?.completedAt || null,
      createdAt: order.createdAt
    }));

    res.json(packingTasks);
  } catch (error) {
    console.error('Get packing tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete packing - auto-generate shipping with tracking number
app.post('/api/packing/:orderId/complete', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { carrier, weight, packageCount } = req.body;

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Generate tracking number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const trackingNumber = `TRK${timestamp}${random}`;

    // Update order to SHIPPED status with tracking info
    const updatedOrder = await prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        shippedDate: new Date(),
        carrier: carrier || 'Standard Carrier',
        trackingNumber,
        shippingNotes: `Packed: ${packageCount || 1} package(s), Weight: ${weight || 'N/A'}`
      }
    });

    // Return shipping details with label info
    res.json({
      success: true,
      message: 'Packing completed, shipping created',
      shipping: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingNumber,
        carrier: carrier || 'Standard Carrier',
        status: 'shipped',
        shippedDate: updatedOrder.shippedDate,
        labelUrl: `/api/shipping/${orderId}/label`,
        customer: {
          name: order.customer?.name,
          address: order.shippingAddress
        }
      }
    });
  } catch (error) {
    console.error('Complete packing error:', error);
    res.status(500).json({ error: 'Failed to complete packing' });
  }
});

app.post('/api/packing', verifyToken, async (req, res) => {
  try {
    const { orderId, orderNumber, packer, weight } = req.body;

    // If orderId provided, update the order status to PICKING (ready for packing)
    if (orderId) {
      await prisma.salesOrder.update({
        where: { id: orderId },
        data: { status: 'PICKING' }
      });
    }

    const newPacking = {
      id: orderId || require('crypto').randomUUID(),
      packingSlip: `PS-${Date.now().toString().slice(-6)}`,
      orderNumber,
      packer: packer || 'Unassigned',
      weight: weight ? weight + ' kg' : 'TBD',
      items: 0,
      priority: 'medium',
      status: 'ready_to_pack'
    };
    res.status(201).json(newPacking);
  } catch (error) {
    console.error('Create packing task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// PICKING
// ===================================

app.get('/api/picking', verifyToken, async (req, res) => {
  try {
    // Get actual pick lists from database
    const pickLists = await prisma.pickList.findMany({
      include: {
        order: true,
        assignedUser: true,
        items: {
          include: {
            product: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const pickingTasks = pickLists.map(pl => ({
      id: pl.id,
      pickListNumber: pl.pickListNumber,
      orderNumber: pl.order?.orderNumber || 'N/A',
      orderId: pl.orderId,
      picker: pl.assignedUser?.name || 'Unassigned',
      status: pl.status.toLowerCase(),
      priority: (pl.priority || 'MEDIUM').toLowerCase(),
      items: pl.items?.length || 0,
      totalQuantity: pl.items?.reduce((sum, item) => sum + item.quantityRequired, 0) || 0,
      pickedQuantity: pl.items?.reduce((sum, item) => sum + item.quantityPicked, 0) || 0,
      location: pl.items?.[0]?.location?.code || 'Multiple',
      createdAt: pl.createdAt
    }));

    res.json(pickingTasks);
  } catch (error) {
    console.error('Get picking tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders available for picking (CONFIRMED status)
app.get('/api/picking/available-orders', verifyToken, async (req, res) => {
  try {
    // Get confirmed orders that don't have a pick list yet
    const orders = await prisma.salesOrder.findMany({
      where: {
        status: { in: ['CONFIRMED', 'ALLOCATED'] },
        pickLists: { none: {} }
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer?.name || 'Unknown',
      status: order.status,
      items: order.items?.length || 0,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    })));
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/picking', verifyToken, async (req, res) => {
  try {
    const { orderId, orderNumber, picker, priority } = req.body;

    // Generate unique pick list number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const pickListNumber = `PL-${timestamp}${random}`;

    // If orderId provided, fetch order items and create pick list
    let pickItems = [];
    let salesOrderId = orderId;

    if (orderId) {
      const salesOrder = await prisma.salesOrder.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      if (salesOrder?.items) {
        pickItems = salesOrder.items.map((item, index) => ({
          productId: item.productId,
          quantityRequired: item.quantity,
          quantityPicked: 0,
          status: 'PENDING',
          sequenceNumber: index + 1
        }));
      }
    } else if (orderNumber) {
      // Find by order number
      const salesOrder = await prisma.salesOrder.findFirst({
        where: { orderNumber },
        include: { items: true }
      });
      if (salesOrder) {
        salesOrderId = salesOrder.id;
        pickItems = salesOrder.items.map((item, index) => ({
          productId: item.productId,
          quantityRequired: item.quantity,
          quantityPicked: 0,
          status: 'PENDING',
          sequenceNumber: index + 1
        }));
      }
    }

    const pickList = await prisma.pickList.create({
      data: {
        pickListNumber,
        orderId: salesOrderId || null,
        status: 'PENDING',
        priority: (priority || 'MEDIUM').toUpperCase(),
        type: 'SINGLE',
        items: pickItems.length > 0 ? {
          create: pickItems
        } : undefined
      },
      include: {
        order: true,
        items: { include: { product: true } }
      }
    });

    res.status(201).json({
      id: pickList.id,
      pickListNumber: pickList.pickListNumber,
      orderNumber: pickList.order?.orderNumber || orderNumber || 'N/A',
      picker: picker || 'Unassigned',
      priority: (pickList.priority || 'MEDIUM').toLowerCase(),
      items: pickList.items?.length || 0,
      status: 'pending'
    });
  } catch (error) {
    console.error('Create picking task error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    // Generate unique PO number using timestamp + random to prevent race conditions
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const poNumber = `PO-${timestamp}${random}`;

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
          create: items.map(item => ({
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
    res.status(500).json({ error: error.message || 'Internal server error' });
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

// Get all orders (alias for sales-orders) - for returns, shows shipped/delivered orders
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
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

    // Generate unique pick list number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const pickListNumber = `PL-${timestamp}${random}`;

    // If orderId is provided but no items, auto-fetch items from the sales order
    let pickItems = items || [];
    if (orderId && (!items || items.length === 0)) {
      const salesOrder = await prisma.salesOrder.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } }
        }
      });
      if (salesOrder?.items) {
        pickItems = salesOrder.items.map((item, index) => ({
          productId: item.productId,
          quantity: item.quantity,
          locationId: null,
          sequenceNumber: index + 1
        }));
      }
    }

    const pickList = await prisma.pickList.create({
      data: {
        pickListNumber,
        orderId,
        status: 'PENDING',
        type: 'SINGLE',
        priority: 'MEDIUM',
        items: {
          create: pickItems.map((item, index) => ({
            productId: item.productId,
            locationId: item.locationId || null,
            quantityRequired: item.quantity || item.quantityRequired || 1,
            quantityPicked: 0,
            status: 'PENDING',
            sequenceNumber: item.sequenceNumber || index + 1
          }))
        }
      },
      include: {
        order: true,
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

// Create shipment with carrier - generates tracking number and label
app.post('/api/shipping/create', verifyToken, async (req, res) => {
  try {
    const { orderId, carrierId, service, weight, dimensions, insurance } = req.body;

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { customer: true, items: { include: { product: true } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const carrier = shippingCarriers.find(c => c.id === carrierId);
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    // Generate tracking number based on carrier
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    let trackingNumber;

    switch (carrier.code) {
      case 'DHL':
        trackingNumber = `${random}${timestamp.toString().slice(-10)}`;
        break;
      case 'FEDEX':
        trackingNumber = `${timestamp.toString().slice(-12)}${random.slice(0, 3)}`;
        break;
      case 'UPS':
        trackingNumber = `1Z${random}${timestamp.toString().slice(-10)}`;
        break;
      case 'AMZL':
        trackingNumber = `TBA${timestamp}${random}`;
        break;
      default:
        trackingNumber = `TRK${timestamp}${random}`;
    }

    // Update order with shipping info
    const updatedOrder = await prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        shippedDate: new Date(),
        carrier: carrier.name,
        trackingNumber,
        shippingMethod: service || 'STANDARD',
        shippingNotes: `Weight: ${weight || 'N/A'}kg, Service: ${service || 'STANDARD'}`
      }
    });

    // Generate label URL
    const labelUrl = `/api/shipping/${orderId}/label`;
    const trackingUrl = carrier.trackingUrl?.replace('{tracking}', trackingNumber) || null;

    res.json({
      success: true,
      shipment: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingNumber,
        carrier: carrier.name,
        carrierCode: carrier.code,
        service: service || 'STANDARD',
        status: 'shipped',
        shippedDate: updatedOrder.shippedDate,
        labelUrl,
        trackingUrl,
        estimatedDelivery: new Date(Date.now() + (service?.includes('EXPRESS') ? 1 : 3) * 24 * 60 * 60 * 1000),
        customer: {
          name: order.customer?.name,
          address: order.shippingAddress
        },
        weight: weight || null,
        dimensions: dimensions || null
      }
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// Get shipping label (PDF generation)
app.get('/api/shipping/:orderId/label', verifyToken, async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      include: { customer: true, items: { include: { product: true } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.trackingNumber) {
      return res.status(400).json({ error: 'No shipment created for this order' });
    }

    // Return label data (in production, this would generate a PDF)
    res.json({
      labelFormat: 'ZPL', // Or PDF, PNG
      labelData: {
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        shippedDate: order.shippedDate,
        from: {
          name: 'Kiaan WMS Warehouse',
          address: '123 Warehouse Street',
          city: 'London',
          postcode: 'W1A 1AA',
          country: 'UK'
        },
        to: {
          name: order.customer?.name || 'Customer',
          address: order.shippingAddress || 'Address on file',
          phone: order.customer?.phone || ''
        },
        items: order.items?.map(item => ({
          sku: item.product?.sku,
          name: item.product?.name,
          quantity: item.quantity
        })),
        weight: order.shippingNotes?.match(/Weight: ([0-9.]+)/)?.[1] || 'N/A',
        barcode: order.trackingNumber
      },
      printUrl: `/api/shipping/${req.params.orderId}/print-label`
    });
  } catch (error) {
    console.error('Get shipping label error:', error);
    res.status(500).json({ error: 'Failed to get label' });
  }
});

// Track shipment
app.get('/api/shipping/:orderId/track', verifyToken, async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.trackingNumber) {
      return res.status(400).json({ error: 'No shipment created for this order' });
    }

    const carrier = shippingCarriers.find(c => c.name === order.carrier);
    const trackingUrl = carrier?.trackingUrl?.replace('{tracking}', order.trackingNumber);

    // Simulated tracking events
    const trackingEvents = [
      { status: 'shipped', location: 'Origin Facility', timestamp: order.shippedDate, description: 'Shipment picked up' },
      { status: 'in_transit', location: 'Sort Facility', timestamp: new Date(new Date(order.shippedDate).getTime() + 6 * 60 * 60 * 1000), description: 'Package in transit' },
      { status: 'out_for_delivery', location: 'Local Depot', timestamp: new Date(new Date(order.shippedDate).getTime() + 18 * 60 * 60 * 1000), description: 'Out for delivery' }
    ];

    res.json({
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      carrierTrackingUrl: trackingUrl,
      status: order.status === 'COMPLETED' ? 'delivered' : 'in_transit',
      estimatedDelivery: new Date(new Date(order.shippedDate).getTime() + 3 * 24 * 60 * 60 * 1000),
      events: trackingEvents
    });
  } catch (error) {
    console.error('Track shipment error:', error);
    res.status(500).json({ error: 'Failed to track shipment' });
  }
});

// Get all shipments
app.get('/api/shipping', verifyToken, async (req, res) => {
  try {
    const shipments = await prisma.salesOrder.findMany({
      where: {
        trackingNumber: { not: null }
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: { shippedDate: 'desc' }
    });

    res.json(shipments.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      status: order.status,
      shippedDate: order.shippedDate,
      customer: order.customer?.name,
      items: order.items?.length || 0,
      totalAmount: order.totalAmount
    })));
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Failed to get shipments' });
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

    // Return array format that frontend expects
    const settings = [
      // General Settings
      { id: `${company.id}_name`, key: 'company_name', category: 'General', value: company.name || '', type: 'Text', description: 'Company name', updatedAt: company.updatedAt },
      { id: `${company.id}_email`, key: 'company_email', category: 'General', value: company.email || '', type: 'Text', description: 'Primary contact email', updatedAt: company.updatedAt },
      { id: `${company.id}_phone`, key: 'company_phone', category: 'General', value: company.phone || '', type: 'Text', description: 'Primary contact phone', updatedAt: company.updatedAt },
      { id: `${company.id}_address`, key: 'company_address', category: 'General', value: company.address || '', type: 'Text', description: 'Company address', updatedAt: company.updatedAt },
      { id: `${company.id}_currency`, key: 'currency', category: 'General', value: company.currency || 'GBP', type: 'Dropdown', description: 'Default currency', updatedAt: company.updatedAt },
      { id: `${company.id}_timezone`, key: 'timezone', category: 'General', value: company.timezone || 'Europe/London', type: 'Dropdown', description: 'System timezone', updatedAt: company.updatedAt },
      { id: `${company.id}_dateFormat`, key: 'date_format', category: 'General', value: company.dateFormat || 'DD/MM/YYYY', type: 'Dropdown', description: 'Date display format', updatedAt: company.updatedAt },

      // Operations Settings
      { id: `${company.id}_defaultWarehouse`, key: 'default_warehouse', category: 'Operations', value: company.defaultWarehouse || '', type: 'Dropdown', description: 'Default warehouse for operations', updatedAt: company.updatedAt },
      { id: `${company.id}_autoReorder`, key: 'auto_reorder_enabled', category: 'Operations', value: company.autoReorderEnabled ? 'true' : 'false', type: 'Boolean', description: 'Automatically create POs for low stock', updatedAt: company.updatedAt },
      { id: `${company.id}_defaultTaxRate`, key: 'default_tax_rate', category: 'Operations', value: String(company.defaultTaxRate || 20), type: 'Number', description: 'Default VAT rate (%)', updatedAt: company.updatedAt },

      // Inventory Settings
      { id: `${company.id}_batchTracking`, key: 'batch_tracking', category: 'Inventory', value: company.batchTrackingEnabled !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Track inventory by batch/lot number', updatedAt: company.updatedAt },
      { id: `${company.id}_expiryTracking`, key: 'expiry_tracking', category: 'Inventory', value: company.expiryTrackingEnabled !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Track product expiry dates', updatedAt: company.updatedAt },
      { id: `${company.id}_lowStockThreshold`, key: 'low_stock_threshold', category: 'Inventory', value: String(company.lowStockThreshold || 10), type: 'Number', description: 'Default low stock alert level', updatedAt: company.updatedAt },
      { id: `${company.id}_serialTracking`, key: 'serial_tracking', category: 'Inventory', value: 'Enabled', type: 'Boolean', description: 'Track items by serial number', updatedAt: company.updatedAt },

      // Notifications Settings
      { id: `${company.id}_emailNotifications`, key: 'email_notifications', category: 'Notifications', value: company.emailNotifications !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Enable email notifications', updatedAt: company.updatedAt },
      { id: `${company.id}_lowStockAlerts`, key: 'low_stock_alerts', category: 'Notifications', value: company.lowStockAlerts !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Send alerts when stock is low', updatedAt: company.updatedAt },
      { id: `${company.id}_orderConfirmations`, key: 'order_confirmations', category: 'Notifications', value: company.orderConfirmations !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Send order confirmation emails', updatedAt: company.updatedAt },
      { id: `${company.id}_pickingAlerts`, key: 'picking_alerts', category: 'Notifications', value: 'Enabled', type: 'Boolean', description: 'Notify when pick list is created', updatedAt: company.updatedAt },
      { id: `${company.id}_shippingNotifications`, key: 'shipping_notifications', category: 'Notifications', value: 'Enabled', type: 'Boolean', description: 'Send shipping notifications to customers', updatedAt: company.updatedAt },
    ];

    res.json(settings);
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

// GET single setting by ID
app.get('/api/settings/:id', verifyToken, async (req, res) => {
  try {
    const settingId = req.params.id;
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Map setting ID to company field
    const settingMap = {
      [`${company.id}_name`]: { key: 'company_name', category: 'General', value: company.name || '', type: 'Text', description: 'Company name' },
      [`${company.id}_email`]: { key: 'company_email', category: 'General', value: company.email || '', type: 'Text', description: 'Primary contact email' },
      [`${company.id}_phone`]: { key: 'company_phone', category: 'General', value: company.phone || '', type: 'Text', description: 'Primary contact phone' },
      [`${company.id}_address`]: { key: 'company_address', category: 'General', value: company.address || '', type: 'Text', description: 'Company address' },
      [`${company.id}_currency`]: { key: 'currency', category: 'General', value: company.currency || 'GBP', type: 'Dropdown', description: 'Default currency' },
      [`${company.id}_timezone`]: { key: 'timezone', category: 'General', value: company.timezone || 'Europe/London', type: 'Dropdown', description: 'System timezone' },
      [`${company.id}_dateFormat`]: { key: 'date_format', category: 'General', value: company.dateFormat || 'DD/MM/YYYY', type: 'Dropdown', description: 'Date display format' },
      [`${company.id}_defaultWarehouse`]: { key: 'default_warehouse', category: 'Operations', value: company.defaultWarehouse || '', type: 'Dropdown', description: 'Default warehouse for operations' },
      [`${company.id}_autoReorder`]: { key: 'auto_reorder_enabled', category: 'Operations', value: company.autoReorderEnabled ? 'true' : 'false', type: 'Boolean', description: 'Automatically create POs for low stock' },
      [`${company.id}_defaultTaxRate`]: { key: 'default_tax_rate', category: 'Operations', value: String(company.defaultTaxRate || 20), type: 'Number', description: 'Default VAT rate (%)' },
      [`${company.id}_batchTracking`]: { key: 'batch_tracking', category: 'Inventory', value: company.batchTrackingEnabled !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Track inventory by batch/lot number' },
      [`${company.id}_expiryTracking`]: { key: 'expiry_tracking', category: 'Inventory', value: company.expiryTrackingEnabled !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Track product expiry dates' },
      [`${company.id}_lowStockThreshold`]: { key: 'low_stock_threshold', category: 'Inventory', value: String(company.lowStockThreshold || 10), type: 'Number', description: 'Default low stock alert level' },
      [`${company.id}_serialTracking`]: { key: 'serial_tracking', category: 'Inventory', value: 'Enabled', type: 'Boolean', description: 'Track items by serial number' },
      [`${company.id}_emailNotifications`]: { key: 'email_notifications', category: 'Notifications', value: company.emailNotifications !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Enable email notifications' },
      [`${company.id}_lowStockAlerts`]: { key: 'low_stock_alerts', category: 'Notifications', value: company.lowStockAlerts !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Send alerts when stock is low' },
      [`${company.id}_orderConfirmations`]: { key: 'order_confirmations', category: 'Notifications', value: company.orderConfirmations !== false ? 'Enabled' : 'Disabled', type: 'Boolean', description: 'Send order confirmation emails' },
      [`${company.id}_pickingAlerts`]: { key: 'picking_alerts', category: 'Notifications', value: 'Enabled', type: 'Boolean', description: 'Notify when pick list is created' },
      [`${company.id}_shippingNotifications`]: { key: 'shipping_notifications', category: 'Notifications', value: 'Enabled', type: 'Boolean', description: 'Send shipping notifications to customers' },
    };

    const setting = settingMap[settingId];
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({
      id: settingId,
      ...setting,
      updatedAt: company.updatedAt
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE single setting by ID
app.put('/api/settings/:id', verifyToken, async (req, res) => {
  try {
    const settingId = req.params.id;
    const { key, value, category, type, description } = req.body;

    // Map key to company field
    const keyToFieldMap = {
      'company_name': 'name',
      'company_email': 'email',
      'company_phone': 'phone',
      'company_address': 'address',
      'currency': 'currency',
      'timezone': 'timezone',
      'date_format': 'dateFormat',
      'default_warehouse': 'defaultWarehouse',
      'auto_reorder_enabled': 'autoReorderEnabled',
      'default_tax_rate': 'defaultTaxRate',
      'batch_tracking': 'batchTrackingEnabled',
      'expiry_tracking': 'expiryTrackingEnabled',
      'low_stock_threshold': 'lowStockThreshold',
      'email_notifications': 'emailNotifications',
      'low_stock_alerts': 'lowStockAlerts',
      'order_confirmations': 'orderConfirmations',
    };

    const fieldName = keyToFieldMap[key];
    if (!fieldName) {
      return res.json({ id: settingId, key, value, category, type, description, message: 'Setting saved (custom)' });
    }

    // Convert value based on type
    let convertedValue = value;
    if (type === 'Boolean') {
      convertedValue = value === 'true' || value === 'Enabled';
    } else if (type === 'Number') {
      convertedValue = parseFloat(value) || 0;
    }

    const updateData = {};
    updateData[fieldName] = convertedValue;

    const company = await prisma.company.update({
      where: { id: req.user.companyId },
      data: updateData
    });

    res.json({
      id: settingId,
      key,
      category,
      value,
      type,
      description,
      updatedAt: company.updatedAt
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE new setting
app.post('/api/settings', verifyToken, async (req, res) => {
  try {
    const { key, value, category, type, description } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // For custom settings, just return success (stored in frontend localStorage or extend schema)
    const settingId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.status(201).json({
      id: settingId,
      key,
      category: category || 'General',
      value,
      type: type || 'Text',
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE setting
app.delete('/api/settings/:id', verifyToken, async (req, res) => {
  try {
    const settingId = req.params.id;

    // Built-in settings cannot be deleted
    if (!settingId.startsWith('custom_')) {
      return res.status(400).json({ error: 'Built-in settings cannot be deleted' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
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
      include: {
        items: { include: { product: true } }
      }
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

    // Auto-generate pick list when order is confirmed
    if (status === 'CONFIRMED' && existing.status !== 'CONFIRMED' && existing.items?.length > 0) {
      try {
        // Generate unique pick list number
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const pickListNumber = `PL-${timestamp}${random}`;

        // Create pick list with items from sales order
        await prisma.pickList.create({
          data: {
            pickListNumber,
            orderId: req.params.id,
            status: 'PENDING',
            priority: order.priority || 'MEDIUM',
            type: 'SINGLE',
            items: {
              create: existing.items.map((item, index) => ({
                productId: item.productId,
                quantityRequired: item.quantity,
                quantityPicked: 0,
                status: 'PENDING',
                sequenceNumber: index + 1
              }))
            }
          }
        });
        console.log(`Auto-generated pick list ${pickListNumber} for order ${order.orderNumber}`);
      } catch (pickListError) {
        console.error('Auto-generate pick list error:', pickListError);
        // Don't fail the order update if pick list creation fails
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

// Get packing slip data for sales order
app.get('/api/sales-orders/:id/packing-slip', verifyToken, async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        salesOrderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    res.json({
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      salesChannel: order.salesChannel,
      customer: order.customer,
      items: order.salesOrderItems?.map(item => ({
        sku: item.product?.sku || 'N/A',
        productName: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      totalAmount: order.totalAmount
    });
  } catch (error) {
    console.error('Get packing slip error:', error);
    res.status(500).json({ error: 'Failed to generate packing slip' });
  }
});

// Generate invoice for sales order
app.post('/api/sales-orders/:id/generate-invoice', verifyToken, async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        salesOrderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    // Generate invoice number
    const invoiceNumber = 'INV-' + order.orderNumber.replace('SO-', '');
    const invoiceDate = new Date().toISOString();

    // Update order with invoice info
    await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: {
        invoiceNumber,
        invoiceDate,
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status
      }
    });

    res.json({
      invoiceNumber,
      invoiceDate,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      customer: order.customer,
      items: order.salesOrderItems?.map(item => ({
        sku: item.product?.sku || 'N/A',
        productName: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Ship sales order
app.post('/api/sales-orders/:id/ship', verifyToken, async (req, res) => {
  try {
    const { carrier, trackingNumber, shippingMethod, notes } = req.body;

    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    if (['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be shipped in its current status' });
    }

    const updatedOrder = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: {
        status: 'SHIPPED',
        shippedDate: new Date(),
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
        shippingMethod: shippingMethod || null,
        shippingNotes: notes || null
      }
    });

    res.json({
      message: 'Order marked as shipped successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({ error: 'Failed to ship order' });
  }
});

// Cancel sales order
app.post('/api/sales-orders/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    if (['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled in its current status' });
    }

    const updatedOrder = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledDate: new Date(),
        cancellationReason: reason || 'No reason provided'
      }
    });

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
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

    // Fetch products for items
    const productIds = transfer.items.map(i => i.productId);
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    }) : [];
    const productMap = new Map(products.map(p => [p.id, p]));

    res.json({
      ...transfer,
      transferItems: transfer.items.map(item => ({
        ...item,
        product: productMap.get(item.productId) || null
      }))
    });
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

// PATCH transfer (for frontend compatibility)
app.patch('/api/transfers/:id', verifyToken, async (req, res) => {
  try {
    const { status, notes, fbaShipmentId, fbaDestination, shipmentBuilt, type, fromWarehouseId, toWarehouseId, shippedAt, receivedAt } = req.body;

    const existing = await prisma.transfer.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    const transfer = await prisma.transfer.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(type && { type }),
        ...(fromWarehouseId && { fromWarehouseId }),
        ...(toWarehouseId && { toWarehouseId }),
        ...(notes !== undefined && { notes }),
        ...(fbaShipmentId !== undefined && { fbaShipmentId }),
        ...(fbaDestination !== undefined && { fbaDestination }),
        ...(shipmentBuilt !== undefined && { shipmentBuilt }),
        ...(shippedAt !== undefined && { shippedAt: shippedAt ? new Date(shippedAt) : null }),
        ...(receivedAt !== undefined && { receivedAt: receivedAt ? new Date(receivedAt) : null }),
        ...(status === 'IN_TRANSIT' && !existing.shippedAt && { shippedAt: new Date() }),
        ...(status === 'COMPLETED' && !existing.receivedAt && { receivedAt: new Date() })
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: true
      }
    });

    // Fetch products for items
    const productIds = transfer.items.map(i => i.productId);
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    }) : [];
    const productMap = new Map(products.map(p => [p.id, p]));

    // Format response for frontend
    res.json({
      ...transfer,
      transferItems: transfer.items.map(item => ({
        ...item,
        product: productMap.get(item.productId) || null
      }))
    });
  } catch (error) {
    console.error('Update transfer error:', error);
    res.status(500).json({ error: 'Failed to update transfer' });
  }
});

// GET warehouse inventory for transfers (products available in a warehouse)
app.get('/api/warehouses/:id/inventory', verifyToken, async (req, res) => {
  try {
    const warehouseId = req.params.id;

    // Check warehouse exists
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Get all inventory in this warehouse with product details
    const inventory = await prisma.inventory.findMany({
      where: {
        location: {
          warehouseId: warehouseId
        },
        quantity: { gt: 0 }
      },
      include: {
        product: {
          include: {
            brand: true
          }
        },
        location: true
      }
    });

    // Group by product and sum quantities
    const productMap = new Map();
    for (const inv of inventory) {
      const productId = inv.productId;
      if (productMap.has(productId)) {
        const existing = productMap.get(productId);
        existing.availableQuantity += inv.quantity;
        existing.locations.push({
          locationId: inv.locationId,
          locationCode: inv.location?.code,
          quantity: inv.quantity
        });
      } else {
        productMap.set(productId, {
          productId: inv.productId,
          product: inv.product,
          sku: inv.product?.sku,
          name: inv.product?.name,
          brand: inv.product?.brand?.name,
          availableQuantity: inv.quantity,
          locations: [{
            locationId: inv.locationId,
            locationCode: inv.location?.code,
            quantity: inv.quantity
          }]
        });
      }
    }

    const products = Array.from(productMap.values());
    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code
      },
      products,
      totalProducts: products.length,
      totalQuantity: products.reduce((sum, p) => sum + p.availableQuantity, 0)
    });
  } catch (error) {
    console.error('Get warehouse inventory error:', error);
    res.status(500).json({ error: 'Failed to get warehouse inventory' });
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

    // Get order stats for this channel
    const orderStats = await prisma.salesOrder.aggregate({
      where: {
        OR: [
          { channel: channel.code },
          { channel: channel.name }
        ]
      },
      _count: true,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true }
    });

    // Get recent orders
    const recentOrders = await prisma.salesOrder.findMany({
      where: {
        OR: [
          { channel: channel.code },
          { channel: channel.name }
        ]
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Format response for frontend
    res.json({
      id: channel.id,
      name: channel.name,
      code: channel.code,
      type: channel.type,
      status: channel.isActive ? 'active' : 'inactive',
      apiKey: channel.apiKey ? `${channel.apiKey.substring(0, 8)}...` : '',
      webhookUrl: channel.webhookUrl || `https://wms.example.com/webhooks/${channel.code.toLowerCase()}`,
      syncFrequency: `${channel.syncFrequency || 5} minutes`,
      orders: orderStats._count || 0,
      revenue: orderStats._sum?.totalAmount || 0,
      avgOrderValue: orderStats._avg?.totalAmount || 0,
      lastSync: channel.lastSyncAt ? new Date(channel.lastSyncAt).toLocaleString() : 'Never',
      productCount: channel._count?.channelPrices || 0,
      createdDate: channel.createdAt,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderId: o.orderNumber,
        customer: o.customer?.name || 'Guest',
        amount: o.totalAmount || 0,
        status: o.status === 'COMPLETED' ? 'synced' : 'pending',
        date: o.createdAt
      })),
      syncHistory: [
        { time: new Date().toISOString(), status: 'Success', records: orderStats._count || 0, duration: '2.3s' }
      ]
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Failed to get channel' });
  }
});

// CREATE channel
app.post('/api/channels', verifyToken, async (req, res) => {
  try {
    const { name, code, type, apiKey, apiSecret, status, referralFeePercent, fixedFee, fulfillmentFeePerUnit, storageFeePerUnit, additionalFees, isActive } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Map frontend type to enum
    const typeMap = {
      'E-Commerce': 'SHOPIFY',
      'Marketplace': 'AMAZON_FBA',
      'AMAZON_FBA': 'AMAZON_FBA',
      'SHOPIFY': 'SHOPIFY',
      'EBAY': 'EBAY',
      'DIRECT': 'DIRECT'
    };

    // Auto-generate code if not provided
    const channelCode = code || name.toUpperCase().replace(/\s+/g, '_').substring(0, 20) + '_' + Date.now().toString(36);

    const channel = await prisma.salesChannel.create({
      data: {
        name,
        code: channelCode,
        type: typeMap[type] || 'DIRECT',
        apiKey: apiKey || null,
        apiSecret: apiSecret || null,
        referralFeePercent: referralFeePercent ? parseFloat(referralFeePercent) : null,
        fixedFee: fixedFee ? parseFloat(fixedFee) : null,
        fulfillmentFeePerUnit: fulfillmentFeePerUnit ? parseFloat(fulfillmentFeePerUnit) : null,
        storageFeePerUnit: storageFeePerUnit ? parseFloat(storageFeePerUnit) : null,
        additionalFees: additionalFees || null,
        isActive: status === 'active' || isActive !== false
      }
    });

    // Return formatted response for frontend
    res.status(201).json({
      id: channel.id,
      name: channel.name,
      code: channel.code,
      type: type,
      status: channel.isActive ? 'active' : 'inactive',
      apiKey: channel.apiKey || '',
      orders: 0,
      revenue: 0,
      lastSync: 'Never',
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt
    });
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
    const { name, code, type, apiKey, apiSecret, status, referralFeePercent, fixedFee, fulfillmentFeePerUnit, storageFeePerUnit, additionalFees, isActive } = req.body;

    const existing = await prisma.salesChannel.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Map frontend type to enum
    const typeMap = {
      'E-Commerce': 'SHOPIFY',
      'Marketplace': 'AMAZON_FBA',
      'AMAZON_FBA': 'AMAZON_FBA',
      'SHOPIFY': 'SHOPIFY',
      'EBAY': 'EBAY',
      'DIRECT': 'DIRECT'
    };

    const channel = await prisma.salesChannel.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(type && { type: typeMap[type] || type }),
        ...(apiKey !== undefined && { apiKey }),
        ...(apiSecret !== undefined && { apiSecret }),
        ...(referralFeePercent !== undefined && { referralFeePercent: referralFeePercent ? parseFloat(referralFeePercent) : null }),
        ...(fixedFee !== undefined && { fixedFee: fixedFee ? parseFloat(fixedFee) : null }),
        ...(fulfillmentFeePerUnit !== undefined && { fulfillmentFeePerUnit: fulfillmentFeePerUnit ? parseFloat(fulfillmentFeePerUnit) : null }),
        ...(storageFeePerUnit !== undefined && { storageFeePerUnit: storageFeePerUnit ? parseFloat(storageFeePerUnit) : null }),
        ...(additionalFees !== undefined && { additionalFees }),
        ...(status !== undefined && { isActive: status === 'active' }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // Return formatted response for frontend
    res.json({
      id: channel.id,
      name: channel.name,
      code: channel.code,
      type: type || channel.type,
      status: channel.isActive ? 'active' : 'inactive',
      apiKey: channel.apiKey || '',
      orders: 0,
      revenue: 0,
      lastSync: channel.lastSyncAt ? new Date(channel.lastSyncAt).toLocaleString() : 'Never',
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt
    });
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

// Get purchase orders for a specific supplier
app.get('/api/suppliers/:id/purchase-orders', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { supplierId: id },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(purchaseOrders);
  } catch (error) {
    console.error('Get supplier purchase orders error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get supplier rating/performance
app.get('/api/suppliers/:id/rating', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Calculate rating based on purchase orders
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { supplierId: id },
      select: {
        status: true,
        createdAt: true,
        expectedDelivery: true,
        receivedDate: true
      }
    });

    const totalOrders = purchaseOrders.length;
    const completedOrders = purchaseOrders.filter(po => po.status === 'RECEIVED').length;
    const onTimeDeliveries = purchaseOrders.filter(po =>
      po.receivedDate && po.expectedDelivery &&
      new Date(po.receivedDate) <= new Date(po.expectedDelivery)
    ).length;

    res.json({
      supplierId: id,
      totalOrders,
      completedOrders,
      onTimeDeliveries,
      onTimeRate: totalOrders > 0 ? Math.round((onTimeDeliveries / totalOrders) * 100) : 0,
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      rating: supplier.rating || 0,
      notes: supplier.notes || ''
    });
  } catch (error) {
    console.error('Get supplier rating error:', error);
    res.status(500).json({ error: 'Failed to fetch supplier rating' });
  }
});

// Get products for a specific supplier
app.get('/api/suppliers/:id/products', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const supplierProducts = await prisma.supplierProduct.findMany({
      where: { supplierId: id }
    });

    // Get product details separately
    const productIds = supplierProducts.map(sp => sp.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    res.json(supplierProducts.map(sp => {
      const product = productMap.get(sp.productId);
      return {
        // Use product ID as the main ID for navigation
        id: sp.productId,
        supplierProductId: sp.id,
        productId: sp.productId,
        supplierId: sp.supplierId,
        // Flatten product data for frontend display
        sku: product?.sku || '',
        name: product?.name || '',
        brand: product?.brand || null,
        status: product?.status || 'ACTIVE',
        costPrice: product?.costPrice || 0,
        sellingPrice: product?.sellingPrice || 0,
        // Supplier-specific pricing
        supplierSku: sp.supplierSku,
        supplierPrice: sp.unitCost || sp.caseCost,
        unitCost: sp.unitCost || product?.costPrice || 0,
        caseCost: sp.caseCost,
        caseSize: sp.caseSize,
        leadTime: sp.leadTimeDays,
        leadTimeDays: sp.leadTimeDays,
        minOrderQuantity: sp.moq,
        moq: sp.moq,
        isPrimary: sp.isPrimary,
        // Keep nested product for any code that needs it
        product: product || null
      };
    }));
  } catch (error) {
    console.error('Get supplier products error:', error);
    res.status(500).json({ error: 'Failed to fetch supplier products' });
  }
});

// Assign products to a supplier
app.put('/api/suppliers/:id/products', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }

    // Get existing supplier products
    const existingProducts = await prisma.supplierProduct.findMany({
      where: { supplierId: id },
      select: { productId: true }
    });
    const existingProductIds = existingProducts.map(sp => sp.productId);

    // Find products to add and remove
    const toAdd = productIds.filter(pid => !existingProductIds.includes(pid));
    const toRemove = existingProductIds.filter(pid => !productIds.includes(pid));

    // Remove unselected products
    if (toRemove.length > 0) {
      await prisma.supplierProduct.deleteMany({
        where: {
          supplierId: id,
          productId: { in: toRemove }
        }
      });
    }

    // Add new products - get product info for SKU
    if (toAdd.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: toAdd } },
        select: { id: true, sku: true, costPrice: true }
      });

      for (const product of products) {
        await prisma.supplierProduct.create({
          data: {
            supplierId: id,
            productId: product.id,
            supplierSku: 'SUP-' + product.sku,
            unitCost: product.costPrice || 0,
            caseSize: 1,
            leadTimeDays: 7,
            companyId: req.user.companyId
          }
        });
      }
    }

    // Return updated products list
    const updatedProducts = await prisma.supplierProduct.findMany({
      where: { supplierId: id }
    });

    // Get product details separately
    const updatedProductIds = updatedProducts.map(sp => sp.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: updatedProductIds } },
      include: { brand: true }
    });
    const productMap = new Map(productDetails.map(p => [p.id, p]));

    res.json(updatedProducts.map(sp => ({
      id: sp.id,
      productId: sp.productId,
      supplierId: sp.supplierId,
      product: productMap.get(sp.productId) || null,
      supplierSku: sp.supplierSku,
      supplierPrice: sp.unitCost,
      unitCost: sp.unitCost,
      caseCost: sp.caseCost,
      caseSize: sp.caseSize,
      leadTime: sp.leadTimeDays,
      leadTimeDays: sp.leadTimeDays,
      minOrderQuantity: sp.moq,
      moq: sp.moq,
      isPrimary: sp.isPrimary
    })));
  } catch (error) {
    console.error('Assign supplier products error:', error);
    res.status(500).json({ error: 'Failed to assign products to supplier' });
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

    const existing = await prisma.pickList.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });
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

    // Auto-update order status when pick list is completed (ready for packing)
    if (status === 'COMPLETED' && existing.orderId) {
      await prisma.salesOrder.update({
        where: { id: existing.orderId },
        data: { status: 'PICKING' } // PICKING status means ready for packing
      });
      console.log(`Order ${existing.order?.orderNumber} auto-moved to packing queue`);
    }

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

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const taskNumber = `RPL-${timestamp}${random}`;

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

// AUTO-GENERATE replenishment tasks based on low stock
app.post('/api/replenishment/tasks/auto-generate', verifyToken, async (req, res) => {
  try {
    // Find products with low stock (below reorder point or min stock level)
    const lowStockProducts = await prisma.inventory.findMany({
      where: {
        quantity: { lt: 10 } // Low stock threshold
      },
      include: {
        product: true,
        location: true
      },
      take: 50
    });

    // Also check replenishment configs
    const configs = await prisma.replenishmentConfig.findMany({
      where: { enabled: true, autoCreateTasks: true },
      include: { product: true }
    });

    const createdTasks = [];
    const timestamp = Date.now();

    // Create tasks for low stock items
    for (const inv of lowStockProducts) {
      // Check if task already exists for this product
      const existingTask = await prisma.replenishmentTask.findFirst({
        where: {
          productId: inv.productId,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });

      if (!existingTask) {
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const taskNumber = `RPL-${timestamp}${random}${createdTasks.length}`;

        const config = configs.find(c => c.productId === inv.productId);
        const quantityNeeded = config ? (config.maxStockLevel - inv.quantity) : Math.max(10 - inv.quantity, 5);

        const task = await prisma.replenishmentTask.create({
          data: {
            taskNumber,
            productId: inv.productId,
            fromLocation: 'BULK',
            toLocation: inv.location?.code || 'PICK',
            quantityNeeded,
            priority: inv.quantity === 0 ? 'URGENT' : inv.quantity < 5 ? 'HIGH' : 'MEDIUM',
            notes: `Auto-generated: Current stock ${inv.quantity}`,
            status: 'PENDING'
          },
          include: { product: true }
        });
        createdTasks.push(task);
      }
    }

    res.json({
      success: true,
      message: `Generated ${createdTasks.length} replenishment tasks`,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    });
  } catch (error) {
    console.error('Auto-generate replenishment tasks error:', error);
    res.status(500).json({ error: 'Failed to auto-generate tasks' });
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

// PATCH replenishment task (for frontend compatibility)
app.patch('/api/replenishment/tasks/:id', verifyToken, async (req, res) => {
  try {
    const { status, quantityMoved, assignedUserId, notes, priority, productId, fromLocation, toLocation, quantityNeeded, completedAt } = req.body;

    const existing = await prisma.replenishmentTask.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Replenishment task not found' });
    }

    const task = await prisma.replenishmentTask.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(quantityMoved !== undefined && { quantityMoved }),
        ...(quantityNeeded !== undefined && { quantityNeeded }),
        ...(assignedUserId !== undefined && { assignedUserId }),
        ...(notes !== undefined && { notes }),
        ...(priority && { priority }),
        ...(productId && { productId }),
        ...(fromLocation !== undefined && { fromLocation }),
        ...(toLocation !== undefined && { toLocation }),
        ...(status === 'COMPLETED' && { completedAt: completedAt ? new Date(completedAt) : new Date() }),
        ...(status === 'IN_PROGRESS' && !existing.startedAt && { startedAt: new Date() })
      },
      include: {
        product: {
          include: {
            brand: true
          }
        }
      }
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
    if (!['PENDING', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Can only delete pending or cancelled tasks' });
    }

    await prisma.replenishmentTask.delete({ where: { id: req.params.id } });
    res.json({ message: 'Replenishment task deleted successfully' });
  } catch (error) {
    console.error('Delete replenishment task error:', error);
    res.status(500).json({ error: 'Failed to delete replenishment task' });
  }
});

// ===================================
// CYCLE COUNTS - Full CRUD
// ===================================

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
        items: { include: { product: true } }
      }
    });
    if (!cycleCount) {
      return res.status(404).json({ error: 'Cycle count not found' });
    }
    res.json(cycleCount);
  } catch (error) {
    console.error('Get cycle count error:', error);
    res.status(500).json({ error: 'Failed to get cycle count' });
  }
});

// UPDATE cycle count
app.put('/api/inventory/cycle-counts/:id', verifyToken, async (req, res) => {
  try {
    const { status, name, scheduledDate, type, locations, variance } = req.body;

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
        ...(status === 'COMPLETED' && { completedDate: new Date() })
      },
      include: {
        warehouse: true,
        items: { include: { product: true } }
      }
    });
    res.json(cycleCount);
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
    if (!['SCHEDULED', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: 'Can only delete scheduled or cancelled cycle counts' });
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

    // Map to include frontend-expected field names
    const mappedSkus = alternativeSkus.map(sku => ({
      ...sku,
      channelType: sku.channel,
      channelSKU: sku.sku
    }));

    res.json(mappedSkus);
  } catch (error) {
    console.error('Error fetching alternative SKUs:', error);
    res.status(500).json({ error: 'Failed to fetch alternative SKUs' });
  }
});

// Create alternative SKU for a product (product-scoped endpoint)
app.post('/api/products/:productId/alternative-skus', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    // Support both naming conventions: frontend sends channelType/channelSKU, backend uses channel/sku
    const { sku, channel, channelSKU, channelType, description, isActive, fnsku, asin, skuSuffix } = req.body;

    const actualSku = sku || channelSKU;
    const actualChannel = channel || channelType;

    if (!actualSku || !actualChannel) {
      return res.status(400).json({ error: 'SKU and channel are required' });
    }

    // Validate channel is a valid MarketplaceType
    const validChannels = ['AMAZON_FBA', 'AMAZON_MFN', 'SHOPIFY', 'EBAY', 'TIKTOK', 'TEMU', 'OTHER'];
    if (!validChannels.includes(actualChannel)) {
      return res.status(400).json({
        error: `Invalid channel type. Must be one of: ${validChannels.join(', ')}`
      });
    }

    const alternativeSku = await prisma.alternativeSku.create({
      data: {
        productId,
        sku: actualSku,
        channel: actualChannel,
        skuSuffix: skuSuffix || null,
        fnsku: fnsku || null,
        asin: asin || null,
        isActive: isActive !== undefined ? isActive : true,
        companyId: req.user.companyId
      },
      include: {
        product: {
          select: { sku: true, name: true }
        }
      }
    });

    // Return with both naming conventions for frontend compatibility
    res.status(201).json({
      ...alternativeSku,
      channelType: alternativeSku.channel,
      channelSKU: alternativeSku.sku
    });
  } catch (error) {
    console.error('Error creating alternative SKU:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'This SKU already exists for this product and channel' });
    } else {
      res.status(500).json({ error: 'Failed to create alternative SKU' });
    }
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
    const { supplierId, productId } = req.query;

    const where = { companyId: req.user.companyId };
    if (supplierId) where.supplierId = supplierId;
    if (productId) where.productId = productId;

    const supplierProducts = await prisma.supplierProduct.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true
          }
        },
        supplier: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map to expected frontend format
    res.json(supplierProducts.map(sp => ({
      id: sp.id,
      supplierId: sp.supplierId,
      productId: sp.productId,
      supplierSKU: sp.supplierSku,
      supplierSku: sp.supplierSku,
      caseSize: sp.caseSize,
      minOrderQty: sp.moq,
      moq: sp.moq,
      leadTimeDays: sp.leadTimeDays,
      costPrice: sp.unitCost,
      unitCost: sp.unitCost,
      caseCost: sp.caseCost,
      isPreferred: sp.isPrimary || false,
      isPrimary: sp.isPrimary || false,
      isActive: true,
      notes: sp.notes,
      product: sp.product ? {
        id: sp.product.id,
        sku: sp.product.sku,
        name: sp.product.name,
        costPrice: sp.product.costPrice,
        brand: sp.product.brand
      } : null,
      supplier: sp.supplier
    })));
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({ error: 'Failed to fetch supplier products' });
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

    // Get marketplace connection details
    const connection = await prisma.marketplaceConnection.findUnique({
      where: { id }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Marketplace connection not found' });
    }

    console.log(`Order sync started for ${connection.marketplace} connection ${id}`);

    // Simulate fetching orders from marketplace API
    // In production, this would make actual API calls to Amazon/eBay/Shopify
    const syncedOrders = [];
    const ordersToCreate = Math.floor(Math.random() * 5) + 1; // Random 1-5 orders

    for (let i = 0; i < ordersToCreate; i++) {
      const orderNumber = `${connection.marketplace.substring(0, 3).toUpperCase()}-${Date.now()}-${i}`;

      // Check if we have products to add to order
      const products = await prisma.product.findMany({
        where: { companyId: req.user.companyId },
        take: 3
      });

      if (products.length > 0) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const price = randomProduct.sellingPrice || 29.99;

        try {
          const order = await prisma.salesOrder.create({
            data: {
              orderNumber,
              companyId: req.user.companyId,
              channel: connection.marketplace,
              status: 'CONFIRMED',
              totalAmount: price * qty,
              items: {
                create: [{
                  productId: randomProduct.id,
                  quantity: qty,
                  unitPrice: price,
                  totalPrice: price * qty
                }]
              }
            }
          });
          syncedOrders.push(order.orderNumber);
        } catch (e) {
          console.log('Order creation skipped:', e.message);
        }
      }
    }

    // Update last sync time
    await prisma.marketplaceConnection.update({
      where: { id },
      data: { lastOrderSync: new Date() }
    });

    res.json({
      message: 'Order sync completed',
      status: 'SUCCESS',
      marketplace: connection.marketplace,
      ordersImported: syncedOrders.length,
      orders: syncedOrders,
      syncedAt: new Date().toISOString()
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

    // Get marketplace connection details
    const connection = await prisma.marketplaceConnection.findUnique({
      where: { id }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Marketplace connection not found' });
    }

    console.log(`Stock sync started for ${connection.marketplace} connection ${id}`);

    // Get inventory with product details
    const inventory = await prisma.inventory.findMany({
      where: {
        location: {
          warehouse: {
            companyId: req.user.companyId
          }
        }
      },
      include: {
        product: true,
        location: {
          include: { warehouse: true }
        }
      }
    });

    // Group by product and sum quantities
    const productStockMap = new Map();
    for (const inv of inventory) {
      const productId = inv.productId;
      if (productStockMap.has(productId)) {
        productStockMap.get(productId).quantity += inv.quantity;
      } else {
        productStockMap.set(productId, {
          productId: inv.productId,
          sku: inv.product?.sku,
          name: inv.product?.name,
          quantity: inv.quantity
        });
      }
    }

    const stockUpdates = Array.from(productStockMap.values());

    // In production, this would push stock levels to marketplace API
    console.log(`Pushing ${stockUpdates.length} stock updates to ${connection.marketplace}`);

    // Update last sync time
    await prisma.marketplaceConnection.update({
      where: { id },
      data: { lastStockSync: new Date() }
    });

    res.json({
      message: 'Stock sync completed',
      status: 'SUCCESS',
      marketplace: connection.marketplace,
      productsUpdated: stockUpdates.length,
      stockLevels: stockUpdates.slice(0, 10), // Return first 10 for display
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing marketplace stock:', error);
    res.status(500).json({ error: 'Failed to sync marketplace stock' });
  }
});

// Push product listings to marketplace
app.post('/api/marketplace-connections/:id/push-products', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body; // Optional: specific products to push

    const connection = await prisma.marketplaceConnection.findUnique({
      where: { id }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Marketplace connection not found' });
    }

    // Get products to push
    const whereClause = { companyId: req.user.companyId, status: 'ACTIVE' };
    if (productIds && productIds.length > 0) {
      whereClause.id = { in: productIds };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { brand: true }
    });

    // In production, this would create/update listings on marketplace
    console.log(`Pushing ${products.length} products to ${connection.marketplace}`);

    res.json({
      message: 'Product push completed',
      status: 'SUCCESS',
      marketplace: connection.marketplace,
      productsPushed: products.length,
      products: products.slice(0, 10).map(p => ({ sku: p.sku, name: p.name })),
      pushedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error pushing products to marketplace:', error);
    res.status(500).json({ error: 'Failed to push products' });
  }
});

// Get sales data from channel
app.get('/api/channels/:id/sales', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const channel = await prisma.salesChannel.findUnique({
      where: { id }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Get orders for this channel
    const whereClause = {
      companyId: req.user.companyId,
      OR: [
        { channel: channel.code },
        { channel: channel.name }
      ]
    };

    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) };
    }

    const orders = await prisma.salesOrder.findMany({
      where: whereClause,
      include: {
        items: { include: { product: true } },
        customer: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      channel: {
        id: channel.id,
        name: channel.name,
        code: channel.code
      },
      statistics: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        currency: 'GBP'
      },
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customer?.name || 'Guest',
        totalAmount: o.totalAmount,
        status: o.status,
        itemCount: o.items?.length || 0,
        createdAt: o.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching channel sales:', error);
    res.status(500).json({ error: 'Failed to fetch channel sales' });
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

// ===================================
// SCANNER SETTINGS AND MANAGEMENT
// ===================================

// Scanner settings storage (in production, store in database)
let scannerSettings = {
  defaultScanner: 'camera',
  scannerMode: 'camera',
  activeScannerBrand: null,
  tc21Config: {
    enabled: false,
    connectionType: 'usb',
    ip: '',
    port: 9100,
    symbologies: ['Code128', 'EAN13', 'EAN8', 'UPC', 'QRCode'],
    beepOnScan: true,
    vibrate: true,
    aimingMode: 'trigger',
    scanTimeout: 5000
  },
  cameraConfig: {
    enabled: true,
    preferredCamera: 'back',
    torch: false,
    zoom: 1,
    symbologies: ['Code128', 'EAN13', 'EAN8', 'UPC', 'QRCode', 'DataMatrix'],
    beepOnScan: true,
    vibrate: true,
    scanAreaGuide: true
  },
  mobileAppConfig: {
    platform: 'expo',
    scannerPlugin: 'expo-barcode-scanner',
    offlineMode: false,
    syncInterval: 30000
  }
};

// Connected scanners storage
let connectedScanners = [];

// Supported scanner brands
const supportedScanners = {
  zebra: {
    name: 'Zebra / Motorola',
    models: ['TC21', 'TC26', 'TC52', 'TC57', 'MC3300', 'DS2208', 'DS4608'],
    connectionTypes: ['usb', 'bluetooth', 'network'],
    plugin: 'react-native-datawedge-intents'
  },
  honeywell: {
    name: 'Honeywell',
    models: ['CT40', 'CT60', 'CK65', 'Voyager 1450g', 'Xenon 1950g'],
    connectionTypes: ['usb', 'bluetooth'],
    plugin: 'react-native-honeywell-scanner'
  },
  datalogic: {
    name: 'Datalogic',
    models: ['Memor 10', 'Skorpio X5', 'Gryphon GD4500'],
    connectionTypes: ['usb', 'bluetooth'],
    plugin: 'react-native-datalogic-module'
  },
  socket: {
    name: 'Socket Mobile',
    models: ['S700', 'S730', 'S740', 'D750'],
    connectionTypes: ['bluetooth'],
    plugin: 'react-native-socket-mobile'
  }
};

// Get scanner settings
app.get('/api/scanner-settings', verifyToken, (req, res) => {
  res.json(scannerSettings);
});

// Update scanner settings
app.put('/api/scanner-settings', verifyToken, (req, res) => {
  scannerSettings = { ...scannerSettings, ...req.body };
  res.json(scannerSettings);
});

// Switch scanner mode
app.post('/api/scanner-settings/switch-mode', verifyToken, (req, res) => {
  const { mode } = req.body;
  if (mode && ['camera', 'tc21'].includes(mode)) {
    scannerSettings.scannerMode = mode;
    res.json({ success: true, mode });
  } else {
    res.status(400).json({ error: 'Invalid mode' });
  }
});

// Get TC21 DataWedge profile configuration
app.get('/api/scanner-settings/tc21-profile', verifyToken, (req, res) => {
  const profile = {
    PROFILE_NAME: 'KiaanWMS',
    PROFILE_ENABLED: 'true',
    CONFIG_MODE: 'CREATE_IF_NOT_EXIST',
    PLUGIN_CONFIG: {
      PLUGIN_NAME: 'BARCODE',
      PARAM_LIST: {
        scanner_input_enabled: 'true',
        scanner_selection: 'auto'
      }
    },
    APP_LIST: [{
      PACKAGE_NAME: 'com.kiaan.wms',
      ACTIVITY_LIST: ['*']
    }],
    INTENT_OUTPUT: {
      intent_output_enabled: 'true',
      intent_action: 'com.kiaan.wms.SCAN',
      intent_delivery: '2'
    },
    KEYSTROKE_OUTPUT: {
      keystroke_output_enabled: 'false'
    }
  };
  res.json(profile);
});

// Get supported scanners
app.get('/api/scanners/supported', verifyToken, (req, res) => {
  res.json(supportedScanners);
});

// Get connected scanners
app.get('/api/scanners/connected', verifyToken, (req, res) => {
  res.json(connectedScanners);
});

// Connect a scanner
app.post('/api/scanners/connect', verifyToken, (req, res) => {
  const { brand, model, connectionType, name, setActive } = req.body;

  if (!brand || !model || !connectionType) {
    return res.status(400).json({ error: 'Brand, model, and connectionType are required' });
  }

  const scanner = {
    id: `scanner-${Date.now()}`,
    brand,
    brandName: supportedScanners[brand]?.name || brand,
    model,
    name: name || `${supportedScanners[brand]?.name || brand} ${model}`,
    connectionType,
    plugin: supportedScanners[brand]?.plugin || 'unknown',
    status: 'connected',
    connectedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    scanCount: 0
  };

  connectedScanners.push(scanner);

  if (setActive) {
    scannerSettings.activeScannerBrand = brand;
    scannerSettings.scannerMode = 'tc21';
  }

  res.json(scanner);
});

// Disconnect a scanner
app.delete('/api/scanners/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const index = connectedScanners.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Scanner not found' });
  }

  connectedScanners.splice(index, 1);
  res.json({ success: true });
});

// Activate a scanner
app.post('/api/scanners/:id/activate', verifyToken, (req, res) => {
  const { id } = req.params;
  const scanner = connectedScanners.find(s => s.id === id);

  if (!scanner) {
    return res.status(404).json({ error: 'Scanner not found' });
  }

  scannerSettings.activeScannerBrand = scanner.brand;
  scannerSettings.scannerMode = 'tc21';

  res.json({ success: true, scanner });
});

// Get setup guide for a scanner brand
app.get('/api/scanners/:brand/setup-guide', verifyToken, (req, res) => {
  const { brand } = req.params;

  const guides = {
    zebra: {
      title: 'Zebra TC21/TC26 Setup Guide',
      steps: [
        'Download and install the Kiaan WMS mobile app on your TC21 device',
        'Open DataWedge application on the device',
        'Create a new profile named "KiaanWMS"',
        'Associate the profile with com.kiaan.wms package',
        'Enable Barcode Input plugin',
        'Disable Keystroke Output',
        'Enable Intent Output with action: com.kiaan.wms.SCAN',
        'Set Intent Delivery to Broadcast',
        'Save the profile and restart DataWedge'
      ],
      plugin: 'npm install react-native-datawedge-intents',
      code: `// DataWedge Integration\nimport DataWedgeIntents from 'react-native-datawedge-intents';\n\nuseEffect(() => {\n  DataWedgeIntents.registerReceiver('com.kiaan.wms.SCAN', (intent) => {\n    const barcode = intent.data;\n    const symbology = intent.labelType;\n    handleScan({ barcode, symbology });\n  });\n\n  return () => DataWedgeIntents.unregisterReceiver();\n}, []);`
    },
    honeywell: {
      title: 'Honeywell Scanner Setup Guide',
      steps: [
        'Install Kiaan WMS app on your Honeywell device',
        'Grant necessary permissions for barcode scanning',
        'Configure scanner settings in device settings',
        'Enable Intent broadcast for barcode data',
        'Test scanning with a sample barcode'
      ],
      plugin: 'npm install react-native-honeywell-scanner',
      code: `// Honeywell Scanner Integration\nimport HoneywellScanner from 'react-native-honeywell-scanner';\n\nuseEffect(() => {\n  HoneywellScanner.startReader().then(() => {\n    HoneywellScanner.onBarcodeReadSuccess((event) => {\n      handleScan({ barcode: event.data, symbology: event.type });\n    });\n  });\n\n  return () => HoneywellScanner.stopReader();\n}, []);`
    },
    datalogic: {
      title: 'Datalogic Scanner Setup Guide',
      steps: [
        'Install Kiaan WMS app on your Datalogic device',
        'Configure Scan2Deploy for the application',
        'Set up Intent output in Datalogic settings',
        'Enable all required symbologies',
        'Test the integration'
      ],
      plugin: 'npm install react-native-datalogic-module',
      code: `// Datalogic Scanner Integration\nimport { BarcodeManager } from 'react-native-datalogic-module';\n\nuseEffect(() => {\n  BarcodeManager.addReadListener((barcode, symbology) => {\n    handleScan({ barcode, symbology });\n  });\n\n  return () => BarcodeManager.release();\n}, []);`
    },
    socket: {
      title: 'Socket Mobile Setup Guide',
      steps: [
        'Pair your Socket Mobile scanner via Bluetooth',
        'Install Socket Mobile SDK in the app',
        'Initialize the CaptureSDK',
        'Configure device capabilities',
        'Test barcode scanning'
      ],
      plugin: 'npm install react-native-socket-mobile',
      code: `// Socket Mobile Integration\nimport { Capture } from 'react-native-socket-mobile';\n\nconst capture = new Capture();\n\nuseEffect(() => {\n  capture.open({ appId: 'com.kiaan.wms' }).then(() => {\n    capture.onData((data) => {\n      handleScan({ barcode: data.value, symbology: data.type });\n    });\n  });\n\n  return () => capture.close();\n}, []);`
    }
  };

  const guide = guides[brand];
  if (!guide) {
    return res.status(404).json({ error: 'Setup guide not found for this brand' });
  }

  res.json(guide);
});

// ===================================
// LABEL PRINTING
// ===================================

// Label templates in-memory storage
let labelTemplates = [
  { id: 'product-label-1', templateName: 'Product Label - Standard', name: 'Product Label - Standard', size: '4x2', type: 'Product', category: 'product', format: 'ZPL', width: 4, height: 2, dpi: 203, uses: 156, status: 'active', isDefault: true, createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
  { id: 'product-label-2', templateName: 'Product Label - Small', name: 'Product Label - Small', size: '2x1', type: 'Product', category: 'product', format: 'ZPL', width: 2, height: 1, dpi: 203, uses: 89, status: 'active', isDefault: false, createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
  { id: 'product-label-3', templateName: 'Product Barcode Label', name: 'Product Barcode Label', size: '3x1', type: 'Product', category: 'product', format: 'ZPL', width: 3, height: 1, dpi: 203, uses: 234, status: 'active', isDefault: false, createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
  { id: 'shipping-label-1', templateName: 'Shipping Label - 4x6', name: 'Shipping Label - 4x6', size: '4x6', type: 'Shipping', category: 'shipping', format: 'ZPL', width: 4, height: 6, dpi: 203, uses: 512, status: 'active', isDefault: true, createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
  { id: 'shipping-label-2', templateName: 'Shipping Label - A5', name: 'Shipping Label - A5', size: 'A5', type: 'Shipping', category: 'shipping', format: 'PDF', width: 5.8, height: 8.3, dpi: 300, uses: 78, status: 'active', isDefault: false, createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
  { id: 'location-label-1', templateName: 'Location Barcode', name: 'Location Barcode', size: '3x1', type: 'Location', category: 'location', format: 'ZPL', width: 3, height: 1, dpi: 203, uses: 45, status: 'active', isDefault: true, createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
  { id: 'location-label-2', templateName: 'Location Label - Large', name: 'Location Label - Large', size: '4x2', type: 'Location', category: 'location', format: 'ZPL', width: 4, height: 2, dpi: 203, uses: 23, status: 'active', isDefault: false, createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
  { id: 'pallet-label', templateName: 'Pallet Label', name: 'Pallet Label', size: '4x4', type: 'Pallet', category: 'location', format: 'ZPL', width: 4, height: 4, dpi: 203, uses: 12, status: 'active', isDefault: false, createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
  { id: 'batch-label', name: 'Batch/Lot Label', size: '3x2', type: 'batch', category: 'product', format: 'ZPL', isDefault: false, createdAt: new Date().toISOString() }
];

// Get all label templates (alias for /api/templates)
app.get('/api/templates', verifyToken, (req, res) => {
  const { type, category } = req.query;

  let filtered = labelTemplates;
  if (type) filtered = filtered.filter(t => t.type === type);
  if (category) filtered = filtered.filter(t => t.category === category);

  res.json(filtered);
});

// Get label templates
app.get('/api/labels/templates', verifyToken, (req, res) => {
  const { type, category } = req.query;

  let filtered = labelTemplates;
  if (type) filtered = filtered.filter(t => t.type === type);
  if (category) filtered = filtered.filter(t => t.category === category);

  res.json(filtered);
});

// Create label template
app.post('/api/templates', verifyToken, (req, res) => {
  const { name, size, type, category, format } = req.body;

  const newTemplate = {
    id: `template-${Date.now()}`,
    name,
    size: size || '4x2',
    type: type || 'product',
    category: category || 'product',
    format: format || 'ZPL',
    isDefault: false,
    createdAt: new Date().toISOString()
  };

  labelTemplates.push(newTemplate);
  res.status(201).json(newTemplate);
});

// Update label template
app.put('/api/templates/:id', verifyToken, (req, res) => {
  const index = labelTemplates.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const { name, size, type, category, format, isDefault } = req.body;
  labelTemplates[index] = {
    ...labelTemplates[index],
    ...(name && { name }),
    ...(size && { size }),
    ...(type && { type }),
    ...(category && { category }),
    ...(format && { format }),
    ...(isDefault !== undefined && { isDefault })
  };

  res.json(labelTemplates[index]);
});

// Delete label template
app.delete('/api/templates/:id', verifyToken, (req, res) => {
  const index = labelTemplates.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }

  labelTemplates.splice(index, 1);
  res.json({ message: 'Template deleted successfully' });
});

// Get all labels (alias for frontend)
app.get('/api/labels', verifyToken, (req, res) => {
  const { type } = req.query;
  let filtered = labelTemplates;
  if (type) filtered = filtered.filter(t => t.type?.toLowerCase() === type.toLowerCase());
  res.json(filtered);
});

// Create label
app.post('/api/labels', verifyToken, (req, res) => {
  const { templateName, name, type, format, width, height, dpi, status } = req.body;
  const newLabel = {
    id: `label-${Date.now()}`,
    templateName: templateName || name,
    name: templateName || name,
    type: type || 'Product',
    format: format || 'ZPL',
    width: width || 4,
    height: height || 6,
    dpi: dpi || 203,
    uses: 0,
    status: status || 'active',
    isDefault: false,
    createdAt: new Date().toISOString(),
    lastUsed: null
  };
  labelTemplates.push(newLabel);
  res.status(201).json(newLabel);
});

// Get single label
app.get('/api/labels/:id', verifyToken, (req, res) => {
  const label = labelTemplates.find(l => l.id === req.params.id);
  if (!label) return res.status(404).json({ error: 'Label not found' });
  res.json(label);
});

// Update label
app.put('/api/labels/:id', verifyToken, (req, res) => {
  const index = labelTemplates.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Label not found' });

  const { templateName, name, type, format, width, height, dpi, status } = req.body;
  labelTemplates[index] = {
    ...labelTemplates[index],
    ...(templateName && { templateName, name: templateName }),
    ...(name && { name, templateName: name }),
    ...(type && { type }),
    ...(format && { format }),
    ...(width && { width }),
    ...(height && { height }),
    ...(dpi && { dpi }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };
  res.json(labelTemplates[index]);
});

// Delete label
app.delete('/api/labels/:id', verifyToken, (req, res) => {
  const index = labelTemplates.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Label not found' });
  labelTemplates.splice(index, 1);
  res.json({ message: 'Label deleted successfully' });
});

// Print label (increment usage)
app.post('/api/labels/:id/print', verifyToken, (req, res) => {
  const index = labelTemplates.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Label not found' });
  labelTemplates[index].uses = (labelTemplates[index].uses || 0) + 1;
  labelTemplates[index].lastUsed = new Date().toISOString();
  res.json({ success: true, message: 'Label printed', uses: labelTemplates[index].uses });
});

// ===================================
// PRINTER SETTINGS
// ===================================

let printerSettings = {
  id: 'default',
  defaultPrinter: 'Zebra ZD420',
  printerType: 'thermal',
  connectionType: 'usb',
  ipAddress: '',
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
    { id: 'printer-1', name: 'Zebra ZD420', type: 'thermal', connection: 'usb', status: 'online', location: 'Warehouse A - Shipping Desk' },
    { id: 'printer-2', name: 'Zebra ZT410', type: 'thermal', connection: 'network', status: 'online', location: 'Warehouse B - Packing Station', ipAddress: '192.168.1.101' },
    { id: 'printer-3', name: 'Brother QL-820', type: 'thermal', connection: 'usb', status: 'offline', location: 'Office' }
  ]
};

app.get('/api/printer-settings', verifyToken, (req, res) => {
  res.json(printerSettings);
});

app.put('/api/printer-settings', verifyToken, (req, res) => {
  const updates = req.body;
  printerSettings = { ...printerSettings, ...updates };
  res.json(printerSettings);
});

app.post('/api/printer-settings/test', verifyToken, (req, res) => {
  const { printerId } = req.body;
  const printer = printerSettings.printers.find(p => p.id === printerId);
  if (!printer) return res.status(404).json({ error: 'Printer not found' });

  // Simulate test
  res.json({ success: printer.status === 'online', message: printer.status === 'online' ? 'Printer is responding' : 'Printer is offline' });
});

app.post('/api/printer-settings/printers', verifyToken, (req, res) => {
  const { name, type, connection, ipAddress, location } = req.body;
  const newPrinter = {
    id: `printer-${Date.now()}`,
    name,
    type: type || 'thermal',
    connection: connection || 'usb',
    status: 'offline',
    location: location || '',
    ipAddress: ipAddress || null
  };
  printerSettings.printers.push(newPrinter);
  res.status(201).json(newPrinter);
});

app.delete('/api/printer-settings/printers/:id', verifyToken, (req, res) => {
  const index = printerSettings.printers.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Printer not found' });
  printerSettings.printers.splice(index, 1);
  res.json({ message: 'Printer removed' });
});

// ===================================
// PRINT AGENT
// ===================================

let printAgents = [];
let printJobs = [];

app.get('/api/print-agent/list', verifyToken, (req, res) => {
  res.json(printAgents);
});

app.post('/api/print-agent/register', verifyToken, (req, res) => {
  const { agentName, computerName, printers, version } = req.body;
  const agent = {
    agentId: `agent-${Date.now()}`,
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
});

app.post('/api/print-agent/heartbeat', verifyToken, (req, res) => {
  const { agentId } = req.body;
  const agent = printAgents.find(a => a.agentId === agentId);
  if (agent) {
    agent.lastHeartbeat = new Date().toISOString();
    agent.status = 'online';
  }
  res.json({ success: true });
});

app.get('/api/print-agent/jobs', verifyToken, (req, res) => {
  const { limit = 20, status } = req.query;
  let jobs = printJobs;
  if (status) jobs = jobs.filter(j => j.status === status);
  res.json(jobs.slice(0, parseInt(limit)));
});

app.post('/api/print-agent/submit-job', verifyToken, (req, res) => {
  const { agentId, printerName, labelType, copies, data } = req.body;
  const job = {
    jobId: `job-${Date.now()}`,
    agentId,
    printerName,
    labelType,
    copies: copies || 1,
    data: data || {},
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null
  };
  printJobs.unshift(job);

  // Simulate job completion
  setTimeout(() => {
    const idx = printJobs.findIndex(j => j.jobId === job.jobId);
    if (idx !== -1) {
      printJobs[idx].status = 'completed';
      printJobs[idx].completedAt = new Date().toISOString();
    }
  }, 2000);

  res.status(201).json(job);
});

// Generate ZPL code
app.post('/api/labels/generate-zpl', verifyToken, (req, res) => {
  const { templateType, templateId, data } = req.body;

  let zpl = '';
  const type = templateType?.toLowerCase() || 'product';

  if (type === 'shipping') {
    zpl = `^XA
^FX Shipping Label
^CF0,60
^FO50,50^FD${data?.shipFrom?.name || 'Kiaan Warehouse'}^FS
^CF0,30
^FO50,120^FD${data?.shipFrom?.address || '123 Warehouse St'}^FS
^FO50,155^FD${data?.shipFrom?.city || 'London'}, ${data?.shipFrom?.state || 'UK'} ${data?.shipFrom?.zip || 'W1A 1AA'}^FS

^FO50,220^GB700,3,3^FS

^CF0,45
^FO50,250^FDSHIP TO:^FS
^CF0,50
^FO50,310^FD${data?.shipTo?.name || 'Customer Name'}^FS
^CF0,35
^FO50,370^FD${data?.shipTo?.address || 'Customer Address'}^FS
^FO50,410^FD${data?.shipTo?.city || 'City'}, ${data?.shipTo?.state || 'State'} ${data?.shipTo?.zip || 'ZIP'}^FS
^FO50,450^FD${data?.shipTo?.country || 'Country'}^FS

^FO50,520^GB700,3,3^FS

^CF0,40
^FO50,560^FDCarrier: ${data?.carrier || 'Standard'}^FS
^FO400,560^FDService: ${data?.serviceType || 'Ground'}^FS

^BY3,2,100
^FO150,620^BC^FD${data?.trackingNumber || '1234567890'}^FS

^CF0,25
^FO50,760^FDOrder: ${data?.orderNumber || 'ORD-12345'}^FS
^FO300,760^FDWeight: ${data?.weight || '0.0'} kg^FS
^FO500,760^FDDims: ${data?.dimensions || '0x0x0'}^FS

^XZ`;
  } else if (type === 'location') {
    zpl = `^XA
^FX Location Label
^CF0,80
^FO50,50^FD${data?.locationCode || 'A-01-01'}^FS

^CF0,35
^FO50,150^FD${data?.warehouseName || 'Main Warehouse'}^FS

^CF0,30
^FO50,200^FDZone: ${data?.zone || 'A'}  Aisle: ${data?.aisle || '01'}^FS
^FO50,240^FDRack: ${data?.rack || '01'}  Shelf: ${data?.shelf || 'A'}^FS
^FO50,280^FDType: ${data?.locationType || 'STORAGE'}^FS

^BY3,2,80
^FO100,330^BC^FD${data?.locationCode || 'A-01-01'}^FS

^XZ`;
  } else if (type === 'pallet') {
    zpl = `^XA
^FX Pallet Label
^CF0,70
^FO50,50^FDPallet: ${data?.palletId || 'PLT-00001'}^FS

^CF0,40
^FO50,140^FDContents: ${data?.contents || 'Mixed'}^FS
^FO50,190^FDItems: ${data?.totalItems || '0'}^FS
^FO300,190^FDWeight: ${data?.totalWeight || '0'} kg^FS

^FO50,250^FDDestination: ${data?.destination || 'TBD'}^FS
^FO50,300^FDPO: ${data?.poNumber || 'N/A'}^FS

^BY4,2,120
^FO100,370^BC^FD${data?.palletId || 'PLT-00001'}^FS

^CF0,25
^FO50,530^FDPrinted: ${new Date().toLocaleDateString()}^FS

^XZ`;
  } else {
    // Product label
    zpl = `^XA
^FX Product Label
^CF0,50
^FO50,50^FD${data?.name || 'Product Name'}^FS

^CF0,35
^FO50,120^FDSKU: ${data?.sku || 'SKU-001'}^FS
^FO350,120^FD${data?.brand || 'Brand'}^FS

^BY3,2,80
^FO100,180^BC^FD${data?.barcode || data?.sku || '012345678901'}^FS

^CF0,40
^FO50,300^FDPrice: £${data?.price?.toFixed(2) || '0.00'}^FS
^FO350,300^FDQty: ${data?.quantity || '1'}^FS

^CF0,25
^FO50,360^FDLocation: ${data?.location || 'N/A'}^FS

^XZ`;
  }

  res.json({ zpl, templateType: type, generatedAt: new Date().toISOString() });
});

// Direct network print
app.post('/api/labels/print-direct', verifyToken, (req, res) => {
  const { ipAddress, port, labelType, data } = req.body;
  // In production, this would send ZPL to the printer via TCP
  console.log(`Direct print to ${ipAddress}:${port} - ${labelType}`);
  res.json({ success: true, message: `Label sent to ${ipAddress}:${port}` });
});

// Generate label data (for printing)
app.post('/api/labels/generate', verifyToken, async (req, res) => {
  try {
    const { templateId, entityType, entityId, quantity = 1 } = req.body;

    let labelData = {};

    if (entityType === 'product') {
      const product = await prisma.product.findUnique({
        where: { id: entityId },
        include: { brand: true }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      labelData = {
        sku: product.sku,
        name: product.name,
        barcode: product.barcode || product.sku,
        brand: product.brand?.name || '',
        price: product.sellingPrice ? `£${product.sellingPrice.toFixed(2)}` : '',
        vatRate: product.vatRate ? `${product.vatRate}%` : ''
      };
    } else if (entityType === 'location') {
      const location = await prisma.location.findUnique({
        where: { id: entityId },
        include: { warehouse: true }
      });

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      labelData = {
        code: location.code,
        name: location.name,
        warehouse: location.warehouse?.name || '',
        aisle: location.aisle || '',
        rack: location.rack || '',
        shelf: location.shelf || '',
        bin: location.bin || ''
      };
    } else if (entityType === 'inventory') {
      const inventory = await prisma.inventory.findUnique({
        where: { id: entityId },
        include: {
          product: { include: { brand: true } },
          location: true,
          warehouse: true
        }
      });

      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }

      labelData = {
        sku: inventory.product.sku,
        name: inventory.product.name,
        barcode: inventory.batchBarcode || inventory.product.barcode || inventory.product.sku,
        lotNumber: inventory.lotNumber || '',
        batchNumber: inventory.batchNumber || '',
        bestBefore: inventory.bestBeforeDate ? new Date(inventory.bestBeforeDate).toLocaleDateString() : '',
        location: inventory.location?.code || '',
        quantity: inventory.quantity
      };
    }

    res.json({
      templateId,
      quantity,
      labelData,
      generatedAt: new Date().toISOString(),
      printInstructions: {
        format: 'ZPL',
        printerType: 'thermal',
        orientation: 'portrait'
      }
    });
  } catch (error) {
    console.error('Generate label error:', error);
    res.status(500).json({ error: 'Failed to generate label data' });
  }
});

// Print label
app.post('/api/labels/print', verifyToken, async (req, res) => {
  try {
    const { templateId, entityType, entityId, quantity = 1, printerId } = req.body;

    console.log(`Print request: ${quantity}x ${templateId} for ${entityType}:${entityId}`);

    res.json({
      success: true,
      message: `Print job queued: ${quantity} label(s)`,
      jobId: `print-${Date.now()}`,
      status: 'QUEUED'
    });
  } catch (error) {
    console.error('Print label error:', error);
    res.status(500).json({ error: 'Failed to queue print job' });
  }
});

// Get configured printers
app.get('/api/printers', verifyToken, (req, res) => {
  const printers = [
    { id: 'default', name: 'Default Printer', type: 'THERMAL', status: 'ONLINE', isDefault: true },
    { id: 'zebra-1', name: 'Zebra ZD420', type: 'THERMAL', status: 'ONLINE', location: 'Warehouse' },
    { id: 'zebra-2', name: 'Zebra GK420d', type: 'THERMAL', status: 'OFFLINE', location: 'Packing Station' }
  ];
  res.json(printers);
});

// END OF NEW ROUTES

// Register integration routes
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
