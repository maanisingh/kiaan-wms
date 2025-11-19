import { faker } from '@faker-js/faker';
import type {
  Product,
  Warehouse,
  Company,
  SalesOrder,
  InventoryItem,
  PurchaseOrder,
  Customer,
  User,
  Category,
  Zone,
  Location,
  DashboardStats,
  ActivityLog,
  Shipment,
  Return,
  PickList,
} from '@/types';

// Seed faker for consistent data generation
faker.seed(12345);

// Generate mock companies
export const generateMockCompanies = (count: number = 5): Company[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `company-${i + 1}`,
    name: faker.company.name(),
    code: `COMP${String(i + 1).padStart(3, '0')}`,
    logo: `https://via.placeholder.com/100?text=${faker.company.name().slice(0, 2)}`,
    billingRules: [],
    settings: {
      allowBackorders: faker.datatype.boolean(),
      autoAllocate: true,
      requireSerialNumbers: false,
      requireBatchNumbers: faker.datatype.boolean(),
    },
    status: 'active' as const,
    createdAt: faker.date.past().toISOString(),
  }));
};

// Generate mock warehouses
export const generateMockWarehouses = (count: number = 10): Warehouse[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `warehouse-${i + 1}`,
    name: `${faker.location.city()} Warehouse ${i + 1}`,
    code: `WH${String(i + 1).padStart(3, '0')}`,
    companyId: `company-${faker.number.int({ min: 1, max: 5 })}`,
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
    },
    type: faker.helpers.arrayElement(['fulfillment', '3pl', 'distribution', 'cold_storage']) as any,
    capacity: {
      total: 100000,
      used: faker.number.int({ min: 30000, max: 80000 }),
      available: 0,
      unit: 'sqft' as const,
    },
    zones: [],
    status: 'active' as const,
    settings: {
      enablePickOptimization: true,
      enableCycleCounts: true,
      lowStockThreshold: 10,
      expiryAlertDays: 30,
    },
    createdAt: faker.date.past().toISOString(),
  })).map(w => ({
    ...w,
    capacity: {
      ...w.capacity,
      available: w.capacity.total - w.capacity.used,
    },
  }));
};

// Generate mock categories
export const generateMockCategories = (): Category[] => {
  return [
    { id: 'cat-1', name: 'Electronics', code: 'ELEC', description: 'Electronic devices and accessories' },
    { id: 'cat-2', name: 'Clothing', code: 'CLTH', description: 'Apparel and accessories' },
    { id: 'cat-3', name: 'Food & Beverage', code: 'FOOD', description: 'Food and drink products' },
    { id: 'cat-4', name: 'Home & Garden', code: 'HOME', description: 'Home improvement and garden supplies' },
    { id: 'cat-5', name: 'Sports & Outdoors', code: 'SPRT', description: 'Sports equipment and outdoor gear' },
    { id: 'cat-6', name: 'Books', code: 'BOOK', description: 'Books and publications' },
    { id: 'cat-7', name: 'Toys & Games', code: 'TOYS', description: 'Toys and gaming products' },
    { id: 'cat-8', name: 'Health & Beauty', code: 'HLTH', description: 'Health and beauty products' },
  ];
};

// Generate mock products
export const generateMockProducts = (count: number = 50): Product[] => {
  const categories = generateMockCategories();

  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i + 1}`,
    sku: `SKU${String(i + 1).padStart(6, '0')}`,
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    barcode: faker.string.numeric(12),
    companyId: `company-${faker.number.int({ min: 1, max: 5 })}`,
    categoryId: faker.helpers.arrayElement(categories).id,
    category: faker.helpers.arrayElement(categories),
    type: faker.helpers.arrayElement(['simple', 'variant', 'bundle']) as any,
    status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive']) as any,
    dimensions: {
      length: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
      width: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
      height: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
      weight: faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 }),
      unit: 'cm' as const,
      weightUnit: 'kg' as const,
    },
    pricing: {
      cost: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
      price: faker.number.float({ min: 20, max: 1000, fractionDigits: 2 }),
      currency: 'USD' as const,
    },
    inventory: {
      reorderPoint: faker.number.int({ min: 10, max: 50 }),
      reorderQuantity: faker.number.int({ min: 50, max: 200 }),
      minStock: faker.number.int({ min: 5, max: 20 }),
      maxStock: faker.number.int({ min: 500, max: 2000 }),
    },
    images: [
      `https://via.placeholder.com/300x300?text=Product${i + 1}`,
      `https://via.placeholder.com/300x300?text=Product${i + 1}-2`,
    ],
    requiresSerial: faker.datatype.boolean({ probability: 0.2 }),
    requiresBatch: faker.datatype.boolean({ probability: 0.3 }),
    isPerishable: faker.datatype.boolean({ probability: 0.2 }),
    shelfLife: faker.datatype.boolean({ probability: 0.2 }) ? faker.number.int({ min: 30, max: 365 }) : undefined,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  }));
};

// Generate mock inventory
export const generateMockInventory = (products: Product[], count: number = 100): InventoryItem[] => {
  return Array.from({ length: count }, (_, i) => {
    const product = faker.helpers.arrayElement(products);
    const quantity = faker.number.int({ min: 0, max: 1000 });
    const reserved = faker.number.int({ min: 0, max: Math.floor(quantity * 0.3) });

    return {
      id: `inv-${i + 1}`,
      productId: product.id,
      product,
      warehouseId: `warehouse-${faker.number.int({ min: 1, max: 10 })}`,
      locationId: `loc-${faker.number.int({ min: 1, max: 100 })}`,
      batchNumber: product.requiresBatch ? `BATCH${faker.string.numeric(8)}` : undefined,
      serialNumber: product.requiresSerial ? `SN${faker.string.alphanumeric(12).toUpperCase()}` : undefined,
      quantity,
      availableQuantity: quantity - reserved,
      reservedQuantity: reserved,
      status: faker.helpers.arrayElement(['available', 'available', 'available', 'reserved', 'quarantine']) as any,
      expiryDate: product.isPerishable ? faker.date.future().toISOString() : undefined,
      receivedDate: faker.date.past().toISOString(),
      lastCountDate: faker.date.recent().toISOString(),
    };
  });
};

// Generate mock customers
export const generateMockCustomers = (count: number = 30): Customer[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `customer-${i + 1}`,
    name: faker.company.name(),
    code: `CUST${String(i + 1).padStart(4, '0')}`,
    email: faker.internet.email(),
    phone: faker.phone.number(),
    companyId: `company-${faker.number.int({ min: 1, max: 5 })}`,
    billingAddress: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
    },
    shippingAddresses: [{
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
    }],
    type: faker.helpers.arrayElement(['b2b', 'b2c', 'marketplace']) as any,
    status: 'active' as const,
    paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 60', 'Prepaid', 'COD']),
    tags: faker.helpers.arrayElements(['VIP', 'Wholesale', 'Retail', 'Online'], faker.number.int({ min: 0, max: 2 })),
    createdAt: faker.date.past().toISOString(),
  }));
};

// Generate mock sales orders
export const generateMockSalesOrders = (products: Product[], customers: Customer[], count: number = 20): SalesOrder[] => {
  return Array.from({ length: count }, (_, i) => {
    const customer = faker.helpers.arrayElement(customers);
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items = Array.from({ length: itemCount }, (_, j) => {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 10 });
      const unitPrice = product.pricing.price;
      const discount = faker.number.float({ min: 0, max: unitPrice * 0.1, fractionDigits: 2 });
      const tax = (unitPrice - discount) * quantity * 0.1;
      const total = (unitPrice - discount) * quantity + tax;

      return {
        id: `so-item-${i}-${j}`,
        productId: product.id,
        product,
        quantity,
        allocatedQuantity: faker.number.int({ min: 0, max: quantity }),
        pickedQuantity: 0,
        packedQuantity: 0,
        shippedQuantity: 0,
        unitPrice,
        discount,
        tax,
        total,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const totalTax = items.reduce((sum, item) => sum + item.tax, 0);
    const shipping = faker.number.float({ min: 5, max: 50, fractionDigits: 2 });
    const total = subtotal - totalDiscount + totalTax + shipping;

    return {
      id: `order-${i + 1}`,
      orderNumber: `SO${String(i + 1).padStart(6, '0')}`,
      companyId: customer.companyId,
      customerId: customer.id,
      customer,
      warehouseId: `warehouse-${faker.number.int({ min: 1, max: 10 })}`,
      channel: faker.helpers.arrayElement(['direct', 'amazon', 'shopify', 'ebay', 'website']) as any,
      status: faker.helpers.arrayElement(['pending', 'confirmed', 'allocated', 'picking', 'packing', 'shipped', 'delivered']) as any,
      priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']) as any,
      orderDate: faker.date.recent({ days: 30 }).toISOString(),
      requiredDate: faker.date.soon({ days: 7 }).toISOString(),
      shippingAddress: customer.shippingAddresses[0],
      items,
      subtotal,
      tax: totalTax,
      shipping,
      discount: totalDiscount,
      total,
      currency: 'USD' as const,
      shippingMethod: faker.helpers.arrayElement(['Standard', 'Express', 'Next Day', 'International']),
      trackingNumber: faker.datatype.boolean() ? `1Z${faker.string.alphanumeric(16).toUpperCase()}` : undefined,
      tags: faker.helpers.arrayElements(['urgent', 'wholesale', 'retail', 'international'], faker.number.int({ min: 0, max: 2 })),
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
      updatedAt: faker.date.recent({ days: 7 }).toISOString(),
    };
  });
};

// Generate mock dashboard stats
export const generateMockDashboardStats = (): DashboardStats => {
  return {
    totalStock: {
      value: faker.number.int({ min: 10000, max: 100000 }),
      change: faker.number.float({ min: -10, max: 20, fractionDigits: 1 }),
      trend: faker.helpers.arrayElement(['up', 'down', 'stable']) as any,
    },
    ordersToday: {
      value: faker.number.int({ min: 50, max: 500 }),
      change: faker.number.float({ min: -15, max: 25, fractionDigits: 1 }),
      trend: faker.helpers.arrayElement(['up', 'down', 'stable']) as any,
    },
    pickBacklog: {
      value: faker.number.int({ min: 10, max: 200 }),
      change: faker.number.float({ min: -20, max: 30, fractionDigits: 1 }),
      trend: faker.helpers.arrayElement(['up', 'down', 'stable']) as any,
    },
    expiryAlerts: {
      value: faker.number.int({ min: 5, max: 50 }),
      change: faker.number.float({ min: -5, max: 10, fractionDigits: 1 }),
      trend: faker.helpers.arrayElement(['up', 'down', 'stable']) as any,
    },
    warehouseUtilization: faker.number.int({ min: 50, max: 90 }),
    ordersByStatus: {
      pending: faker.number.int({ min: 10, max: 50 }),
      confirmed: faker.number.int({ min: 20, max: 80 }),
      picking: faker.number.int({ min: 15, max: 60 }),
      packing: faker.number.int({ min: 10, max: 40 }),
      shipped: faker.number.int({ min: 50, max: 200 }),
    },
    recentActivity: [],
  };
};

// Create singleton instances
export const mockCompanies = generateMockCompanies();
export const mockWarehouses = generateMockWarehouses();
export const mockCategories = generateMockCategories();
export const mockProducts = generateMockProducts();
export const mockInventory = generateMockInventory(mockProducts);
export const mockCustomers = generateMockCustomers();
export const mockSalesOrders = generateMockSalesOrders(mockProducts, mockCustomers);
export const mockDashboardStats = generateMockDashboardStats();
