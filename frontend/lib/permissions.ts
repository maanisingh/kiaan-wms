// Role-based access control configuration

export type Action = 'create' | 'read' | 'update' | 'delete';

// Role-specific action permissions
export const ROLE_ACTIONS: Record<string, Action[]> = {
  'super_admin': ['create', 'read', 'update', 'delete'],
  'company_admin': ['create', 'read', 'update', 'delete'],
  'warehouse_manager': ['create', 'read', 'update', 'delete'],
  'inventory_manager': ['create', 'read', 'update', 'delete'],
  'admin': ['create', 'read', 'update', 'delete'],
  'manager': ['create', 'read', 'update'], // NO DELETE for managers
  'picker': ['read', 'update'],
  'packer': ['read', 'update'],
  'warehouse_staff': ['create', 'read', 'update'],
  'viewer': ['read'],
};

// Features available by role
export const ROLE_FEATURES: Record<string, string[]> = {
  'super_admin': ['company_management', 'user_management', 'system_settings', 'all_companies', 'delete_records'],
  'company_admin': ['user_management', 'company_settings', 'delete_records'],
  'warehouse_manager': ['user_management', 'warehouse_settings', 'delete_records'],
  'inventory_manager': ['inventory_settings', 'delete_records'],
  'admin': ['user_management', 'system_settings', 'delete_records'],
  'manager': ['daily_operations'], // NO user_management, NO delete_records
  'picker': ['picking_operations'],
  'packer': ['packing_operations'],
  'warehouse_staff': ['warehouse_operations'],
  'viewer': ['view_reports'],
};

export type Role =
  | 'super_admin'
  | 'company_admin'
  | 'warehouse_manager'
  | 'inventory_manager'
  | 'admin'
  | 'manager'
  | 'picker'
  | 'packer'
  | 'warehouse_staff'
  | 'viewer';

// All roles for convenience
const ALL_ROLES: Role[] = ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager', 'picker', 'packer', 'warehouse_staff', 'viewer'];

// Admin roles (can manage system settings)
const ADMIN_ROLES: Role[] = ['super_admin', 'company_admin', 'admin'];

// User management roles - managers cannot manage users
const USER_MANAGEMENT_ROLES: Role[] = ['super_admin', 'company_admin', 'warehouse_manager', 'admin'];

// Management roles (can manage operations) - includes warehouse_manager
const MANAGEMENT_ROLES: Role[] = ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager'];

// Roles that can access full operational features
const FULL_ACCESS_ROLES: Role[] = ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager', 'warehouse_staff'];

// Picker-specific routes ONLY
const PICKER_ROUTES: Role[] = ['picker', ...MANAGEMENT_ROLES];

// Packer-specific routes
const PACKER_ROUTES: Role[] = ['packer', ...MANAGEMENT_ROLES];

// View-only roles (for reports and analytics)
const VIEWER_ROUTES: Role[] = ['viewer', ...MANAGEMENT_ROLES];

// Define which roles can access which routes
// STRICT MODE: Only allow roles explicitly listed
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  // ============================================
  // ROLE-SPECIFIC DASHBOARDS
  // ============================================
  '/dashboards/picker': PICKER_ROUTES,
  '/dashboards/packer': PACKER_ROUTES,
  '/dashboards/manager': MANAGEMENT_ROLES,
  '/dashboards/warehouse-staff': ['warehouse_staff', ...MANAGEMENT_ROLES],

  // Main dashboard - managers and admins only (pickers/packers have their own)
  '/dashboard': FULL_ACCESS_ROLES,
  '/profile': ALL_ROLES,

  // ============================================
  // ADMIN ROUTES (Super Admin, Company Admin, Admin)
  // ============================================
  '/settings': FULL_ACCESS_ROLES,
  '/settings/carriers': MANAGEMENT_ROLES,
  '/settings/marketplace-api': MANAGEMENT_ROLES,
  '/settings/integrations': MANAGEMENT_ROLES,
  '/settings/scanner': ALL_ROLES,
  '/settings/vat-rates': MANAGEMENT_ROLES,
  '/users': USER_MANAGEMENT_ROLES, // Managers cannot access user management
  '/roles': ADMIN_ROLES,

  // Super Admin + Company Admin for companies
  '/companies': ['super_admin', 'company_admin'],

  // ============================================
  // WAREHOUSE MANAGEMENT - Management only
  // ============================================
  '/warehouses': FULL_ACCESS_ROLES,
  '/warehouses/zones': FULL_ACCESS_ROLES,
  '/warehouses/locations': FULL_ACCESS_ROLES,

  // ============================================
  // INVENTORY MANAGEMENT - Management + Staff only
  // ============================================
  '/inventory': FULL_ACCESS_ROLES,
  '/inventory/by-best-before-date': FULL_ACCESS_ROLES,
  '/inventory/by-location': FULL_ACCESS_ROLES,
  '/inventory/movements': FULL_ACCESS_ROLES,
  '/inventory/batches': FULL_ACCESS_ROLES,
  '/inventory/adjustments': MANAGEMENT_ROLES,
  '/inventory/cycle-counts': FULL_ACCESS_ROLES,

  // ============================================
  // PRODUCTS - Management only
  // ============================================
  '/products': FULL_ACCESS_ROLES,
  '/products/categories': FULL_ACCESS_ROLES,
  '/products/bundles': FULL_ACCESS_ROLES,
  '/products/import': MANAGEMENT_ROLES,

  // ============================================
  // INBOUND (Purchase Orders, Goods Receiving)
  // ============================================
  '/purchase-orders': FULL_ACCESS_ROLES,
  '/goods-receiving': FULL_ACCESS_ROLES,
  '/suppliers': FULL_ACCESS_ROLES,

  // ============================================
  // OUTBOUND (Sales Orders, Customers)
  // ============================================
  '/sales-orders': FULL_ACCESS_ROLES,
  '/customers': FULL_ACCESS_ROLES,
  '/clients': FULL_ACCESS_ROLES,

  // ============================================
  // FULFILLMENT (Picking & Packing)
  // ============================================
  '/picking': PICKER_ROUTES,  // Pickers + Management
  '/packing': PACKER_ROUTES,  // Packers + Management

  // ============================================
  // SHIPPING & LOGISTICS - Packers + Management
  // ============================================
  '/shipments': PACKER_ROUTES,
  '/returns': FULL_ACCESS_ROLES,
  '/transfers': FULL_ACCESS_ROLES,
  '/fba-transfers': FULL_ACCESS_ROLES,
  '/labels': PACKER_ROUTES,

  // ============================================
  // REPLENISHMENT
  // ============================================
  '/replenishment': FULL_ACCESS_ROLES,
  '/replenishment/tasks': FULL_ACCESS_ROLES,
  '/replenishment/settings': MANAGEMENT_ROLES,

  // ============================================
  // INTEGRATIONS & CHANNELS
  // ============================================
  '/integrations': MANAGEMENT_ROLES,
  '/integrations/channels': MANAGEMENT_ROLES,
  '/integrations/mappings': MANAGEMENT_ROLES,

  // ============================================
  // ANALYTICS & REPORTS - Viewer can see
  // ============================================
  '/analytics': VIEWER_ROUTES,
  '/analytics/pricing-calculator': VIEWER_ROUTES,
  '/analytics/channels': VIEWER_ROUTES,
  '/analytics/optimizer': VIEWER_ROUTES,
  '/analytics/margins': VIEWER_ROUTES,
  '/reports': VIEWER_ROUTES,

  // ============================================
  // BARCODES - Pickers and Packers need this
  // ============================================
  '/barcode': [...PICKER_ROUTES, 'packer'],
  '/scanner': ALL_ROLES,

  // ============================================
  // AUTH PAGES (public - no restrictions)
  // ============================================
  '/auth/login': ALL_ROLES,
  '/auth/register': ALL_ROLES,
  '/auth/forgot-password': ALL_ROLES,
  '/demo': ALL_ROLES,
  '/about': ALL_ROLES,
  '/contact': ALL_ROLES,
  '/privacy': ALL_ROLES,
  '/terms': ALL_ROLES,
  '/careers': ALL_ROLES,
  '/security': ALL_ROLES,
};

/**
 * Get the default redirect path for a role after login
 */
export function getDefaultRouteForRole(role: string): string {
  const normalizedRole = normalizeRole(role);
  switch (normalizedRole) {
    case 'picker':
      return '/dashboards/picker';
    case 'packer':
      return '/dashboards/packer';
    case 'viewer':
      return '/reports';
    case 'warehouse_staff':
      return '/dashboards/warehouse-staff';
    default:
      return '/dashboard';
  }
}

/**
 * Normalize role to lowercase for comparison
 * Backend may send SUPER_ADMIN, frontend uses super_admin
 */
export function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/-/g, '_');
}

/**
 * Check if a user role has permission to access a route
 * STRICT MODE: Only allow explicitly defined routes for operational roles
 */
export function hasRoutePermission(userRole: string, route: string): boolean {
  if (!userRole) return false;

  const normalizedRole = normalizeRole(userRole) as Role;

  // Check exact match first
  let allowedRoles = ROUTE_PERMISSIONS[route];

  // If no exact match, check if route starts with any defined route
  if (!allowedRoles) {
    // Find the best matching parent route
    const parentRoutes = Object.keys(ROUTE_PERMISSIONS)
      .filter(r => route.startsWith(r) && r !== '/')
      .sort((a, b) => b.length - a.length);

    if (parentRoutes.length > 0) {
      allowedRoles = ROUTE_PERMISSIONS[parentRoutes[0]];
    }
  }

  // For picker and packer roles, be STRICT - only allow explicitly defined routes
  if (normalizedRole === 'picker' || normalizedRole === 'packer' || normalizedRole === 'viewer') {
    if (!allowedRoles) {
      return false; // No permission for undefined routes
    }
    return allowedRoles.some(role => normalizeRole(role) === normalizedRole);
  }

  // For management/admin roles, be permissive for undefined routes
  if (!allowedRoles) {
    return FULL_ACCESS_ROLES.some(role => normalizeRole(role) === normalizedRole);
  }

  return allowedRoles.some(role => normalizeRole(role) === normalizedRole);
}

/**
 * Get all routes accessible by a role
 */
export function getAccessibleRoutes(userRole: string): string[] {
  if (!userRole) return [];
  const normalizedRole = normalizeRole(userRole);

  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([_, roles]) => roles.some(role => normalizeRole(role) === normalizedRole))
    .map(([route]) => route);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: string, roles: Role[]): boolean {
  if (!userRole) return false;
  const normalizedUserRole = normalizeRole(userRole);
  return roles.some(role => normalizeRole(role) === normalizedUserRole);
}

/**
 * Check if user is an admin (super_admin, company_admin, or admin)
 */
export function isAdmin(userRole: string): boolean {
  return hasAnyRole(userRole, ADMIN_ROLES);
}

/**
 * Check if user is management level
 */
export function isManagement(userRole: string): boolean {
  return hasAnyRole(userRole, MANAGEMENT_ROLES);
}

/**
 * Check if user is a picker
 */
export function isPicker(userRole: string): boolean {
  return normalizeRole(userRole) === 'picker';
}

/**
 * Check if user is a packer
 */
export function isPacker(userRole: string): boolean {
  return normalizeRole(userRole) === 'packer';
}

/**
 * Check if user is a viewer
 */
export function isViewer(userRole: string): boolean {
  return normalizeRole(userRole) === 'viewer';
}

/**
 * Check if user has restricted access (picker, packer, viewer)
 */
export function hasRestrictedAccess(userRole: string): boolean {
  const normalized = normalizeRole(userRole);
  return ['picker', 'packer', 'viewer'].includes(normalized);
}

/**
 * Format role name for display
 */
export function formatRole(role: string): string {
  if (!role) return 'Unknown';
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

/**
 * Get role color for tags/badges
 */
export function getRoleColor(role: string): string {
  const normalizedRole = normalizeRole(role);
  const colors: Record<string, string> = {
    'super_admin': 'gold',
    'company_admin': 'blue',
    'warehouse_manager': 'green',
    'inventory_manager': 'purple',
    'admin': 'red',
    'manager': 'cyan',
    'picker': 'orange',
    'packer': 'magenta',
    'warehouse_staff': 'geekblue',
    'viewer': 'default',
  };
  return colors[normalizedRole] || 'default';
}

/**
 * Get role description for display
 */
export function getRoleDescription(role: string): string {
  const normalizedRole = normalizeRole(role);
  const descriptions: Record<string, string> = {
    'super_admin': 'Full system access including all companies',
    'company_admin': 'Full access to company resources and settings',
    'warehouse_manager': 'Manage warehouse operations and staff',
    'inventory_manager': 'Manage inventory, products, and stock',
    'admin': 'Administrative access to system settings',
    'manager': 'Manage daily operations and reports',
    'picker': 'Picking tasks only - simple scan and pick interface',
    'packer': 'Packing and shipping - pack, label, and ship orders',
    'warehouse_staff': 'General warehouse operations access',
    'viewer': 'Read-only access to reports and analytics',
  };
  return descriptions[normalizedRole] || 'Standard user access';
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(userRole: string, action: Action): boolean {
  if (!userRole) return false;
  const normalizedRole = normalizeRole(userRole);
  const allowedActions = ROLE_ACTIONS[normalizedRole];
  if (!allowedActions) return false;
  return allowedActions.includes(action);
}

/**
 * Check if user can delete records
 */
export function canDelete(userRole: string): boolean {
  return canPerformAction(userRole, 'delete');
}

/**
 * Check if user can create records
 */
export function canCreate(userRole: string): boolean {
  return canPerformAction(userRole, 'create');
}

/**
 * Check if user can update records
 */
export function canUpdate(userRole: string): boolean {
  return canPerformAction(userRole, 'update');
}

/**
 * Check if user has a specific feature
 */
export function hasFeature(userRole: string, feature: string): boolean {
  if (!userRole) return false;
  const normalizedRole = normalizeRole(userRole);
  const features = ROLE_FEATURES[normalizedRole];
  if (!features) return false;
  return features.includes(feature);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(userRole: string): boolean {
  return hasFeature(userRole, 'user_management');
}

/**
 * Check if user can delete records (via feature check)
 */
export function canDeleteRecords(userRole: string): boolean {
  return hasFeature(userRole, 'delete_records');
}
