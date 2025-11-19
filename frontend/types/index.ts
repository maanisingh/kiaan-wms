// Core entity types for the WMS

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'warehouse_staff' | 'picker' | 'packer';
  companyId: string;
  warehouseId?: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive';
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  logo?: string;
  billingRules: BillingRule[];
  settings: CompanySettings;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface BillingRule {
  id: string;
  type: 'storage' | 'receiving' | 'picking' | 'packing' | 'shipping';
  rate: number;
  unit: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface CompanySettings {
  allowBackorders: boolean;
  autoAllocate: boolean;
  requireSerialNumbers: boolean;
  requireBatchNumbers: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  companyId: string;
  address: Address;
  type: 'fulfillment' | '3pl' | 'distribution' | 'cold_storage';
  capacity: {
    total: number;
    used: number;
    available: number;
    unit: 'sqft' | 'cbm' | 'pallets';
  };
  zones: Zone[];
  status: 'active' | 'inactive';
  settings: WarehouseSettings;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Zone {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'returns';
  temperature?: 'ambient' | 'chilled' | 'frozen';
  locations: Location[];
}

export interface Location {
  id: string;
  zoneId: string;
  aisle: string;
  rack: string;
  bin: string;
  barcode: string;
  capacity: number;
  used: number;
  type: 'pallet' | 'shelf' | 'floor';
  status: 'available' | 'occupied' | 'reserved' | 'blocked';
}

export interface WarehouseSettings {
  enablePickOptimization: boolean;
  enableCycleCounts: boolean;
  lowStockThreshold: number;
  expiryAlertDays: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  barcode?: string;
  companyId: string;
  categoryId?: string;
  category?: Category;
  type: 'simple' | 'variant' | 'bundle';
  status: 'active' | 'inactive' | 'discontinued';
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
    unit: 'cm' | 'in';
    weightUnit: 'kg' | 'lb';
  };
  pricing: {
    cost: number;
    price: number;
    currency: 'USD' | 'EUR' | 'GBP';
  };
  inventory: {
    reorderPoint: number;
    reorderQuantity: number;
    minStock: number;
    maxStock: number;
  };
  images: string[];
  variants?: ProductVariant[];
  bundleItems?: BundleItem[];
  requiresSerial: boolean;
  requiresBatch: boolean;
  isPerishable: boolean;
  shelfLife?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  barcode?: string;
  price: number;
  stock: number;
}

export interface BundleItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  children?: Category[];
  description?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  product?: Product;
  warehouseId: string;
  locationId?: string;
  location?: Location;
  batchNumber?: string;
  serialNumber?: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  status: 'available' | 'reserved' | 'quarantine' | 'damaged' | 'expired';
  expiryDate?: string;
  receivedDate: string;
  lastCountDate?: string;
}

export interface StockAdjustment {
  id: string;
  type: 'increase' | 'decrease' | 'transfer' | 'damage' | 'lost' | 'found';
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'completed';
  warehouseId: string;
  items: AdjustmentItem[];
  reason: string;
  notes?: string;
  requestedBy: string;
  approvedBy?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AdjustmentItem {
  productId: string;
  product?: Product;
  locationId?: string;
  batchNumber?: string;
  quantity: number;
  unitCost?: number;
}

export interface CycleCount {
  id: string;
  warehouseId: string;
  name: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: 'full' | 'partial' | 'spot';
  scheduledDate: string;
  completedDate?: string;
  locations: string[];
  items: CountItem[];
  assignedTo?: string;
  variance: {
    total: number;
    positive: number;
    negative: number;
  };
  createdAt: string;
}

export interface CountItem {
  productId: string;
  product?: Product;
  locationId: string;
  expectedQuantity: number;
  countedQuantity?: number;
  variance?: number;
  status: 'pending' | 'counted' | 'adjusted';
  batchNumber?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  companyId: string;
  warehouseId: string;
  supplierId: string;
  supplier?: Supplier;
  status: 'draft' | 'submitted' | 'approved' | 'receiving' | 'completed' | 'cancelled';
  expectedDate: string;
  items: POItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: 'USD' | 'EUR' | 'GBP';
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: Address;
  paymentTerms: string;
  leadTime: number;
  rating: number;
  status: 'active' | 'inactive';
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  warehouseId: string;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  supplierId?: string;
  supplier?: Supplier;
  status: 'receiving' | 'qc' | 'putaway' | 'completed';
  receivedDate: string;
  items: GRNItem[];
  receivedBy: string;
  qcBy?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GRNItem {
  id: string;
  productId: string;
  product?: Product;
  expectedQuantity?: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  damagedQuantity: number;
  batchNumber?: string;
  expiryDate?: string;
  qcStatus: 'pending' | 'passed' | 'failed' | 'partial';
  locationId?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  companyId: string;
  billingAddress: Address;
  shippingAddresses: Address[];
  type: 'b2b' | 'b2c' | 'marketplace';
  status: 'active' | 'inactive';
  creditLimit?: number;
  paymentTerms: string;
  tags: string[];
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  companyId: string;
  customerId: string;
  customer?: Customer;
  warehouseId: string;
  channel: 'direct' | 'amazon' | 'shopify' | 'ebay' | 'website';
  status: 'pending' | 'confirmed' | 'allocated' | 'picking' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'on_hold';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  orderDate: string;
  requiredDate?: string;
  shippingAddress: Address;
  items: SOItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: 'USD' | 'EUR' | 'GBP';
  shippingMethod: string;
  trackingNumber?: string;
  notes?: string;
  tags: string[];
  allocations?: Allocation[];
  pickLists?: PickList[];
  shipments?: Shipment[];
  createdAt: string;
  updatedAt: string;
}

export interface SOItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  allocatedQuantity: number;
  pickedQuantity: number;
  packedQuantity: number;
  shippedQuantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface Allocation {
  id: string;
  orderItemId: string;
  productId: string;
  locationId: string;
  location?: Location;
  batchNumber?: string;
  quantity: number;
  status: 'allocated' | 'picked' | 'cancelled';
  allocatedAt: string;
}

export interface PickList {
  id: string;
  pickNumber: string;
  warehouseId: string;
  type: 'single' | 'batch' | 'wave' | 'zone';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  orders: string[];
  items: PickItem[];
  assignedTo?: string;
  sequence: number;
  optimizedRoute?: string[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PickItem {
  id: string;
  orderNumber: string;
  productId: string;
  product?: Product;
  locationId: string;
  location?: Location;
  quantity: number;
  pickedQuantity: number;
  batchNumber?: string;
  sequenceNumber: number;
  status: 'pending' | 'picked' | 'short_picked' | 'skipped';
  notes?: string;
}

export interface PackingTask {
  id: string;
  packNumber: string;
  orderNumber: string;
  orderId: string;
  order?: SalesOrder;
  warehouseId: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  items: PackItem[];
  packages: Package[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PackItem {
  orderItemId: string;
  productId: string;
  product?: Product;
  quantity: number;
  packedQuantity: number;
  packageId?: string;
}

export interface Package {
  id: string;
  type: 'box' | 'envelope' | 'pallet' | 'custom';
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  items: PackItem[];
  trackingNumber?: string;
  labelUrl?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  warehouseId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  orders: string[];
  packages: Package[];
  shippingAddress: Address;
  cost: number;
  currency: 'USD' | 'EUR' | 'GBP';
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingEvents: TrackingEvent[];
  labelUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
  description: string;
}

export interface Return {
  id: string;
  rmaNumber: string;
  orderId?: string;
  order?: SalesOrder;
  customerId: string;
  customer?: Customer;
  warehouseId: string;
  status: 'requested' | 'approved' | 'rejected' | 'receiving' | 'inspecting' | 'completed';
  reason: string;
  type: 'defective' | 'wrong_item' | 'customer_remorse' | 'damaged' | 'other';
  items: ReturnItem[];
  refundAmount: number;
  restockingFee: number;
  resolution: 'refund' | 'exchange' | 'store_credit';
  notes?: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
}

export interface ReturnItem {
  orderItemId?: string;
  productId: string;
  product?: Product;
  quantity: number;
  receivedQuantity?: number;
  condition: 'new' | 'opened' | 'damaged' | 'defective';
  inspectionNotes?: string;
  disposition: 'restock' | 'scrap' | 'return_to_supplier' | 'repair';
  locationId?: string;
}

export interface Transfer {
  id: string;
  transferNumber: string;
  type: 'warehouse' | 'location';
  status: 'pending' | 'in_transit' | 'receiving' | 'completed' | 'cancelled';
  fromWarehouseId?: string;
  toWarehouseId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  items: TransferItem[];
  requestedBy: string;
  approvedBy?: string;
  shipmentDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface TransferItem {
  productId: string;
  product?: Product;
  quantity: number;
  receivedQuantity?: number;
  batchNumber?: string;
  serialNumber?: string;
}

export interface MarketplaceChannel {
  id: string;
  companyId: string;
  type: 'amazon' | 'shopify' | 'ebay' | 'walmart' | 'custom';
  name: string;
  status: 'active' | 'inactive' | 'error';
  credentials: Record<string, string>;
  settings: {
    autoImportOrders: boolean;
    autoUpdateInventory: boolean;
    importFrequency: number;
  };
  lastSync?: string;
  createdAt: string;
}

export interface SKUMapping {
  id: string;
  companyId: string;
  channelId: string;
  channelSKU: string;
  productId: string;
  product?: Product;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'inventory' | 'orders' | 'shipping' | 'financial' | 'custom';
  description?: string;
  template?: ReportTemplate;
  parameters: Record<string, any>;
  schedule?: ReportSchedule;
  format: 'pdf' | 'excel' | 'csv';
  createdBy: string;
  createdAt: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  fields: string[];
  filters: Record<string, any>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  enabled: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Statistics and KPI types
export interface DashboardStats {
  totalStock: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  ordersToday: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  pickBacklog: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  expiryAlerts: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  warehouseUtilization: number;
  ordersByStatus: Record<string, number>;
  recentActivity: ActivityLog[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

// Pagination and filter types
export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  warehouseId?: string;
  companyId?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationParams;
}

export interface ListResponse<T> {
  items: T[];
  pagination: PaginationParams;
}
