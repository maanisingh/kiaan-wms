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
    { id: user.id, email: user.email, role: user.role },
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
    const { type, reason, notes, items } = req.body;

    if (!type || !reason || !items || items.length === 0) {
      return res.status(400).json({ error: 'Type, reason, and items are required' });
    }

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        id: require('crypto').randomUUID(),
        type,
        status: 'PENDING',
        warehouseId: '53c65d84-4606-4b0a-8aa5-6eda9e50c3df', // Default warehouse
        reason,
        notes,
        requestedBy: req.user.id,
        createdAt: new Date(),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            locationId: item.locationId,
            batchNumber: item.batchNumber,
            quantity: item.quantity,
            unitCost: item.unitCost || 0
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json(adjustment);
  } catch (error) {
    console.error('Create adjustment error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    const { bundleItems, ...productData } = req.body;

    const product = await prisma.product.create({
      data: {
        ...productData,
        companyId: productData.companyId || req.user.companyId,
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
    const { bundleItems, ...productData } = req.body;

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
