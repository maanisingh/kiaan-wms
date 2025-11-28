// Application constants

export const APP_NAME = 'Kiaan WMS';
export const APP_VERSION = '1.0.0';
// Ensure API URL always ends with /api
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wms-api.alexandratechlab.com';
export const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

// Order statuses
export const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'orange' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'blue' },
  { value: 'ALLOCATED', label: 'Allocated', color: 'cyan' },
  { value: 'PICKING', label: 'Picking', color: 'purple' },
  { value: 'PACKING', label: 'Packing', color: 'purple' },
  { value: 'SHIPPED', label: 'Shipped', color: 'green' },
  { value: 'DELIVERED', label: 'Delivered', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
];

// Inventory statuses
export const INVENTORY_STATUSES = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'reserved', label: 'Reserved', color: 'blue' },
  { value: 'quarantine', label: 'Quarantine', color: 'orange' },
  { value: 'damaged', label: 'Damaged', color: 'red' },
  { value: 'expired', label: 'Expired', color: 'red' },
];

// Priority levels
export const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'gray' },
  { value: 'MEDIUM', label: 'Medium', color: 'blue' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
];

// User roles
export const USER_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Warehouse Manager' },
  { value: 'warehouse_staff', label: 'Warehouse Staff' },
  { value: 'picker', label: 'Picker' },
  { value: 'packer', label: 'Packer' },
];

// Warehouse types
export const WAREHOUSE_TYPES = [
  { value: 'fulfillment', label: 'Fulfillment Center' },
  { value: '3pl', label: '3PL Warehouse' },
  { value: 'distribution', label: 'Distribution Center' },
  { value: 'cold_storage', label: 'Cold Storage' },
];

// Zone types
export const ZONE_TYPES = [
  { value: 'receiving', label: 'Receiving' },
  { value: 'storage', label: 'Storage' },
  { value: 'picking', label: 'Picking' },
  { value: 'packing', label: 'Packing' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'returns', label: 'Returns' },
];

// Temperature zones
export const TEMPERATURE_ZONES = [
  { value: 'ambient', label: 'Ambient' },
  { value: 'chilled', label: 'Chilled (2-8°C)' },
  { value: 'frozen', label: 'Frozen (-18°C)' },
];

// Product types
export const PRODUCT_TYPES = [
  { value: 'simple', label: 'Simple Product' },
  { value: 'variant', label: 'Product with Variants' },
  { value: 'bundle', label: 'Product Bundle' },
];

// Marketplace channels
export const MARKETPLACE_CHANNELS = [
  { value: 'amazon', label: 'Amazon', icon: '🛒' },
  { value: 'shopify', label: 'Shopify', icon: '🛍️' },
  { value: 'ebay', label: 'eBay', icon: '📦' },
  { value: 'walmart', label: 'Walmart', icon: '🏪' },
  { value: 'custom', label: 'Custom API', icon: '⚙️' },
];

// Carriers
export const CARRIERS = [
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'usps', label: 'USPS' },
  { value: 'dhl', label: 'DHL' },
  { value: 'other', label: 'Other' },
];

// Return reasons
export const RETURN_REASONS = [
  { value: 'defective', label: 'Defective/Damaged' },
  { value: 'wrong_item', label: 'Wrong Item Sent' },
  { value: 'customer_remorse', label: 'Customer Remorse' },
  { value: 'damaged', label: 'Damaged in Transit' },
  { value: 'other', label: 'Other' },
];

// Report types
export const REPORT_TYPES = [
  { value: 'inventory', label: 'Inventory Report' },
  { value: 'orders', label: 'Orders Report' },
  { value: 'shipping', label: 'Shipping Report' },
  { value: 'financial', label: 'Financial Report' },
  { value: 'custom', label: 'Custom Report' },
];

// Currencies
export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
];

// Units of measure
export const UNITS_OF_MEASURE = [
  { value: 'ea', label: 'Each' },
  { value: 'box', label: 'Box' },
  { value: 'case', label: 'Case' },
  { value: 'pallet', label: 'Pallet' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'lb', label: 'Pound' },
];

// Dimension units
export const DIMENSION_UNITS = [
  { value: 'cm', label: 'Centimeters' },
  { value: 'in', label: 'Inches' },
];

// Weight units
export const WEIGHT_UNITS = [
  { value: 'kg', label: 'Kilograms' },
  { value: 'lb', label: 'Pounds' },
];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Chart colors
export const CHART_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  purple: '#722ed1',
  cyan: '#13c2c2',
  orange: '#fa8c16',
  green: '#52c41a',
  blue: '#1890ff',
  red: '#f5222d',
};

export const CHART_COLOR_PALETTE = [
  '#1890ff',
  '#52c41a',
  '#faad14',
  '#f5222d',
  '#722ed1',
  '#13c2c2',
  '#fa8c16',
  '#2f54eb',
  '#eb2f96',
  '#a0d911',
];

// Notification types
export const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Information', color: 'blue' },
  { value: 'warning', label: 'Warning', color: 'orange' },
  { value: 'error', label: 'Error', color: 'red' },
  { value: 'success', label: 'Success', color: 'green' },
];

// Activity types
export const ACTIVITY_TYPES = [
  'created',
  'updated',
  'deleted',
  'approved',
  'rejected',
  'shipped',
  'received',
  'cancelled',
  'completed',
];

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIME_FORMAT = 'HH:mm:ss';

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = [
  { key: '/', description: 'Focus search' },
  { key: 'g d', description: 'Go to Dashboard' },
  { key: 'g o', description: 'Go to Orders' },
  { key: 'g p', description: 'Go to Products' },
  { key: 'g i', description: 'Go to Inventory' },
  { key: 'c o', description: 'Create Order' },
  { key: 'c p', description: 'Create Product' },
  { key: '?', description: 'Show shortcuts' },
];

// Table column widths
export const COLUMN_WIDTHS = {
  checkbox: 50,
  action: 100,
  id: 100,
  sku: 120,
  name: 200,
  status: 120,
  date: 150,
  quantity: 100,
  price: 120,
};

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'wms_auth_token',
  USER: 'wms_user',
  THEME: 'wms_theme',
  SIDEBAR_COLLAPSED: 'wms_sidebar_collapsed',
  SELECTED_WAREHOUSE: 'wms_selected_warehouse',
  SELECTED_COMPANY: 'wms_selected_company',
  TABLE_PREFERENCES: 'wms_table_preferences',
};

// API endpoints (for reference)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: '/users',
  COMPANIES: '/companies',
  WAREHOUSES: '/warehouses',
  PRODUCTS: '/products',
  INVENTORY: '/inventory',
  PURCHASE_ORDERS: '/purchase-orders',
  SALES_ORDERS: '/sales-orders',
  SHIPMENTS: '/shipments',
  RETURNS: '/returns',
  TRANSFERS: '/transfers',
  REPORTS: '/reports',
  NOTIFICATIONS: '/notifications',
};
