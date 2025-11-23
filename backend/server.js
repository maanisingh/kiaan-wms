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

// Health check
app.get('/health', (req, res) => {
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

    // Get low stock items
    const lowStockCount = await prisma.inventory.count({
      where: {
        availableQuantity: {
          lte: prisma.raw('reorderPoint')
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
    const limit = parseInt(req.query.limit as string) || 5;

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
    const limit = parseInt(req.query.limit as string) || 10;

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
    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent audit logs if AuditLog table exists
    // For now, return mock data
    const activities = [
      { id: 1, action: 'Order Created', user: user?.name || 'User', entity: 'SO-001238', time: '2 mins ago', type: 'order' },
      { id: 2, action: 'Pick List Completed', user: 'System', entity: 'PL-00512', time: '15 mins ago', type: 'picklist' },
      { id: 3, action: 'Stock Adjusted', user: user?.name || 'User', entity: 'PRD-045', time: '1 hour ago', type: 'inventory' },
      { id: 4, action: 'Transfer Created', user: 'System', entity: 'TR-00234', time: '2 hours ago', type: 'transfer' },
      { id: 5, action: 'Goods Received', user: user?.name || 'User', entity: 'GR-00892', time: '3 hours ago', type: 'goods' },
    ];

    res.json(activities.slice(0, limit));
  } catch (error) {
    console.error('Get activity error:', error);
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WMS API Server running on port ${PORT}`);
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
