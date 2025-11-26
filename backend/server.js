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
app.use(cors({
  origin: [
    'https://wms.alexandratechlab.com',
    'https://frontend-production-c9100.up.railway.app',
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
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Auth middleware
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

    res.json({
      kpis: {
        totalStock: {
          value: inventoryData._sum.quantity || 0,
          change: 12.5,
          trend: 'up'
        },
        lowStockItems: {
          value: lowStockCount || 0,
          change: -15.2,
          trend: 'down'
        },
        pendingOrders: {
          value: pendingOrders || 0,
          change: 8.3,
          trend: 'up'
        },
        activePickLists: {
          value: activePickLists || 0,
          change: -5.1,
          trend: 'down'
        },
        warehouseUtilization: {
          value: 73.5,
          change: 3.2,
          trend: 'up'
        },
        ordersToday: {
          value: ordersToday || 0,
          change: 18.7,
          trend: 'up'
        },
      },
      totals: {
        products: totalProducts,
        totalInventory: inventoryData._sum.quantity || 0,
        availableInventory: inventoryData._sum.availableQuantity || 0,
        orders: totalOrders,
        warehouses: warehousesCount,
      }
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

    // Get warehouse ID - use provided one or get user's company default warehouse
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWarehouse = await prisma.warehouse.findFirst({
        where: {
          companyId: req.user.companyId,
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

    res.json(cycleCounts);
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

    const cycleCount = await prisma.cycleCount.create({
      data: {
        id: require('crypto').randomUUID(),
        warehouseId: warehouseId || '53c65d84-4606-4b0a-8aa5-6eda9e50c3df',
        name,
        status: 'SCHEDULED',
        type: type || 'FULL',
        scheduledDate: new Date(scheduledDate),
        locations: locations || [],
        items: [],
        variance: {
          total: 0,
          positive: 0,
          negative: 0
        },
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
    const { name, code, description, companyId } = req.body;

    const brand = await prisma.brand.create({
      data: {
        name,
        code,
        description,
        companyId: companyId || req.user.companyId
      }
    });

    res.status(201).json(brand);
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      isPerishable: rawProductData.isPerishable || false,
      requiresBatch: rawProductData.requiresBatch || false,
      requiresSerial: rawProductData.requiresSerial || false,
      shelfLifeDays: rawProductData.shelfLifeDays || null,
      images: rawProductData.images || [],
      companyId: rawProductData.companyId || req.user.companyId,
    };

    const product = await prisma.product.create({
      data: {
        ...productData,
        bundleItems: bundleItems ? {
          create: bundleItems.map(item => ({
            childId: item.productId,
            quantity: item.quantity
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
    res.status(500).json({ error: 'Internal server error' });
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
    if (rawProductData.isPerishable !== undefined) productData.isPerishable = rawProductData.isPerishable;
    if (rawProductData.requiresBatch !== undefined) productData.requiresBatch = rawProductData.requiresBatch;
    if (rawProductData.requiresSerial !== undefined) productData.requiresSerial = rawProductData.requiresSerial;
    if (rawProductData.shelfLifeDays !== undefined) productData.shelfLifeDays = rawProductData.shelfLifeDays;
    if (rawProductData.images !== undefined) productData.images = rawProductData.images;

    // If updating bundle items, delete old ones first
    if (bundleItems !== undefined) {
      await prisma.bundleItem.deleteMany({
        where: { parentId: req.params.id }
      });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...productData,
        bundleItems: bundleItems ? {
          create: bundleItems.map(item => ({
            childId: item.productId,
            quantity: item.quantity
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

app.get('/api/purchase-orders', verifyToken, async (req, res) => {
  try {
    const purchaseOrders = [
      { id: '1', poNumber: 'PO-001', supplier: 'Acme Supplies', status: 'pending', items: 10, total: 5000, createdAt: new Date().toISOString(), expectedDate: new Date(Date.now() + 604800000).toISOString() },
      { id: '2', poNumber: 'PO-002', supplier: 'Global Parts Inc', status: 'approved', items: 25, total: 12500, createdAt: new Date().toISOString(), expectedDate: new Date(Date.now() + 432000000).toISOString() },
      { id: '3', poNumber: 'PO-003', supplier: 'FastShip Co', status: 'received', items: 15, total: 3200, createdAt: new Date(Date.now() - 604800000).toISOString(), expectedDate: new Date().toISOString() },
      { id: '4', poNumber: 'PO-004', supplier: 'Quality Goods Ltd', status: 'partial', items: 50, total: 25000, createdAt: new Date(Date.now() - 259200000).toISOString(), expectedDate: new Date(Date.now() + 172800000).toISOString() }
    ];
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/purchase-orders', verifyToken, async (req, res) => {
  try {
    const { supplier, items, total, expectedDate } = req.body;
    const newPO = {
      id: require('crypto').randomUUID(),
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplier,
      items: parseInt(items) || 0,
      total: parseFloat(total) || 0,
      expectedDate,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    res.status(201).json(newPO);
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET purchase order by ID
app.get('/api/purchase-orders/:id', verifyToken, async (req, res) => {
  try {
    const po = {
      id: req.params.id,
      poNumber: `PO-${req.params.id.slice(0, 6)}`,
      supplier: 'Sample Supplier',
      status: 'pending',
      items: 10,
      total: 5000,
      createdAt: new Date().toISOString(),
      expectedDate: new Date(Date.now() + 604800000).toISOString()
    };
    res.json(po);
  } catch (error) {
    console.error('Get purchase order by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE purchase order
app.put('/api/purchase-orders/:id', verifyToken, async (req, res) => {
  try {
    const { supplier, items, total, expectedDate, status } = req.body;
    const updatedPO = {
      id: req.params.id,
      poNumber: `PO-${req.params.id.slice(0, 6)}`,
      supplier: supplier || 'Sample Supplier',
      status: status || 'pending',
      items: parseInt(items) || 10,
      total: parseFloat(total) || 5000,
      createdAt: new Date().toISOString(),
      expectedDate: expectedDate || new Date(Date.now() + 604800000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    res.json(updatedPO);
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE purchase order
app.delete('/api/purchase-orders/:id', verifyToken, async (req, res) => {
  try {
    res.json({ success: true, message: 'Purchase order deleted' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================================
// GOODS RECEIVING
// ===================================

app.get('/api/goods-receiving', verifyToken, async (req, res) => {
  try {
    const receivings = [
      { id: '1', grNumber: 'GR-001', poNumber: 'PO-001', supplier: 'Acme Supplies', status: 'pending', items: 10, receivedDate: null },
      { id: '2', grNumber: 'GR-002', poNumber: 'PO-002', supplier: 'Global Parts Inc', status: 'in_progress', items: 20, receivedDate: new Date().toISOString() },
      { id: '3', grNumber: 'GR-003', poNumber: 'PO-003', supplier: 'FastShip Co', status: 'completed', items: 15, receivedDate: new Date(Date.now() - 86400000).toISOString() },
      { id: '4', grNumber: 'GR-004', poNumber: 'PO-004', supplier: 'Quality Goods Ltd', status: 'partial', items: 30, receivedDate: new Date().toISOString() }
    ];
    res.json(receivings);
  } catch (error) {
    console.error('Get goods receiving error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/goods-receiving', verifyToken, async (req, res) => {
  try {
    const { poNumber, supplier, items } = req.body;
    const newGR = {
      id: require('crypto').randomUUID(),
      grNumber: `GR-${Date.now().toString().slice(-6)}`,
      poNumber,
      supplier,
      items: parseInt(items) || 0,
      receivedDate: null,
      status: 'pending'
    };
    res.status(201).json(newGR);
  } catch (error) {
    console.error('Create goods receiving error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        type: type || 'MAIN',
        address,
        phone,
        capacity: capacity ? parseInt(capacity) : null,
        status: status || 'ACTIVE',
        companyId: req.user.companyId
      }
    });
    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Create warehouse error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Warehouse code already exists' });
    }
    res.status(500).json({ error: 'Failed to create warehouse' });
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
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to get suppliers' });
  }
});

// GET single supplier
app.get('/api/suppliers/:id', verifyToken, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      }
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to get supplier' });
  }
});

// CREATE supplier
app.post('/api/suppliers', verifyToken, async (req, res) => {
  try {
    const { name, code, email, phone, address } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        email,
        phone,
        address,
        companyId: req.user.companyId
      }
    });
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Supplier code already exists' });
    }
    res.status(500).json({ error: 'Failed to create supplier' });
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

    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
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
