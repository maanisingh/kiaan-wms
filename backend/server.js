const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');

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
    const { name, code, warehouseId, zoneId, aisle, rack, shelf, bin } = req.body;

    if (!name || !code || !warehouseId) {
      return res.status(400).json({ error: 'Name, code, and warehouseId are required' });
    }

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Check for duplicate code in same warehouse
    const existing = await prisma.location.findFirst({
      where: { warehouseId, code }
    });

    if (existing) {
      return res.status(400).json({ error: 'Location code already exists in this warehouse' });
    }

    const location = await prisma.location.create({
      data: {
        name,
        code,
        warehouseId,
        zoneId: zoneId || null,
        aisle: aisle || null,
        rack: rack || null,
        shelf: shelf || null,
        bin: bin || null
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

app.post('/api/transfers', verifyToken, async (req, res) => {
  try {
    const { items, ...transferData } = req.body;

    const transfer = await prisma.transfer.create({
      data: {
        ...transferData,
        items: {
          create: items
        }
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: true
      }
    });

    res.status(201).json(transfer);
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
// RETURNS & RMA
// ===================================

app.get('/api/returns', verifyToken, async (req, res) => {
  try {
    // Return mock data since we don't have a Returns table yet
    const returns = [
      { id: '1', rmaNumber: 'RMA-001', orderNumber: 'ORD-1001', customer: 'John Smith', type: 'Return', reason: 'Damaged', requestedDate: new Date().toISOString(), value: 150, status: 'pending' },
      { id: '2', rmaNumber: 'RMA-002', orderNumber: 'ORD-1002', customer: 'Jane Doe', type: 'Exchange', reason: 'Wrong Item', requestedDate: new Date().toISOString(), value: 89.99, status: 'processing' },
      { id: '3', rmaNumber: 'RMA-003', orderNumber: 'ORD-1003', customer: 'Bob Wilson', type: 'Refund', reason: 'Defective', requestedDate: new Date().toISOString(), value: 299, status: 'approved' },
      { id: '4', rmaNumber: 'RMA-004', orderNumber: 'ORD-1004', customer: 'Alice Brown', type: 'Return', reason: 'Changed Mind', requestedDate: new Date().toISOString(), value: 45, status: 'completed' }
    ];
    res.json(returns);
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/returns', verifyToken, async (req, res) => {
  try {
    const { orderNumber, customer, type, reason, value } = req.body;
    const newReturn = {
      id: require('crypto').randomUUID(),
      rmaNumber: `RMA-${Date.now().toString().slice(-6)}`,
      orderNumber,
      customer,
      type,
      reason,
      value: parseFloat(value),
      requestedDate: new Date().toISOString(),
      status: 'pending'
    };
    res.status(201).json(newReturn);
  } catch (error) {
    console.error('Create return error:', error);
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

app.get('/api/packing', verifyToken, async (req, res) => {
  try {
    const packingTasks = [
      { id: '1', packingSlip: 'PS-001', orderNumber: 'ORD-1001', packer: 'Mike Johnson', status: 'ready_to_pack', priority: 'high', items: 5, weight: '2.5 kg' },
      { id: '2', packingSlip: 'PS-002', orderNumber: 'ORD-1002', packer: 'Sarah Lee', status: 'packing', priority: 'medium', items: 3, weight: '1.2 kg' },
      { id: '3', packingSlip: 'PS-003', orderNumber: 'ORD-1003', packer: 'Tom Davis', status: 'packed', priority: 'low', items: 8, weight: '4.8 kg' },
      { id: '4', packingSlip: 'PS-004', orderNumber: 'ORD-1004', packer: 'Mike Johnson', status: 'ready_to_ship', priority: 'high', items: 2, weight: '0.8 kg' }
    ];
    res.json(packingTasks);
  } catch (error) {
    console.error('Get packing tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/packing', verifyToken, async (req, res) => {
  try {
    const { orderNumber, packer, weight } = req.body;
    const newPacking = {
      id: require('crypto').randomUUID(),
      packingSlip: `PS-${Date.now().toString().slice(-6)}`,
      orderNumber,
      packer,
      weight: weight + ' kg',
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
    const pickingTasks = [
      { id: '1', pickListNumber: 'PL-001', orderNumber: 'ORD-1001', picker: 'John Picker', status: 'pending', priority: 'high', items: 5, location: 'A-01-01' },
      { id: '2', pickListNumber: 'PL-002', orderNumber: 'ORD-1002', picker: 'Jane Picker', status: 'in_progress', priority: 'medium', items: 3, location: 'B-02-03' },
      { id: '3', pickListNumber: 'PL-003', orderNumber: 'ORD-1003', picker: 'Bob Picker', status: 'completed', priority: 'low', items: 8, location: 'C-01-02' },
      { id: '4', pickListNumber: 'PL-004', orderNumber: 'ORD-1004', picker: 'John Picker', status: 'pending', priority: 'high', items: 2, location: 'A-03-01' }
    ];
    res.json(pickingTasks);
  } catch (error) {
    console.error('Get picking tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/picking', verifyToken, async (req, res) => {
  try {
    const { orderNumber, picker, priority } = req.body;
    const newPicking = {
      id: require('crypto').randomUUID(),
      pickListNumber: `PL-${Date.now().toString().slice(-6)}`,
      orderNumber,
      picker,
      priority: priority || 'medium',
      items: 0,
      location: 'TBD',
      status: 'pending'
    };
    res.status(201).json(newPicking);
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

    // Generate PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    const nextNumber = lastPO ? parseInt(lastPO.poNumber.split('-')[1] || '0') + 1 : 1;
    const poNumber = `PO-${String(nextNumber).padStart(6, '0')}`;

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

    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
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

// END OF NEW ROUTES
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
