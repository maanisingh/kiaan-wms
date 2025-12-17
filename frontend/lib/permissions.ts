// Role-based access control configuration

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

// Management roles (can manage operations) - includes warehouse_manager
const MANAGEMENT_ROLES: Role[] = ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager'];

// Operational roles (can perform daily operations) - includes packer, picker
const OPERATIONAL_ROLES: Role[] = ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager', 'picker', 'packer', 'warehouse_staff'];

// View-only access (read-only) - viewer can see everything
const VIEW_ROLES: Role[] = ALL_ROLES;

// Define which roles can access which routes
// CLIENT REQUIREMENT: All logged-in users should be able to view pages based on their role
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  // Dashboard - everyone can access their dashboard
  '/dashboard': ALL_ROLES,
  '/profile': ALL_ROLES,

  // ============================================
  // ADMIN ROUTES (Super Admin, Company Admin, Admin)
  // ============================================
  '/settings': ALL_ROLES,  // Everyone can view settings
  '/settings/carriers': MANAGEMENT_ROLES,
  '/settings/marketplace-api': MANAGEMENT_ROLES,
  '/settings/integrations': MANAGEMENT_ROLES,
  '/settings/scanner': ALL_ROLES,
  '/settings/vat-rates': MANAGEMENT_ROLES,
  '/users': MANAGEMENT_ROLES,
  '/roles': ADMIN_ROLES,

  // Super Admin + Company Admin for companies
  '/companies': ['super_admin', 'company_admin'],

  // ============================================
  // WAREHOUSE MANAGEMENT - Warehouse Manager has full access
  // ============================================
  '/warehouses': ALL_ROLES,
  '/warehouses/zones': ALL_ROLES,
  '/warehouses/locations': ALL_ROLES,

  // ============================================
  // INVENTORY MANAGEMENT - All roles can view
  // ============================================
  '/inventory': ALL_ROLES,
  '/inventory/by-best-before-date': ALL_ROLES,
  '/inventory/by-location': ALL_ROLES,
  '/inventory/movements': ALL_ROLES,
  '/inventory/batches': ALL_ROLES,
  '/inventory/adjustments': OPERATIONAL_ROLES,
  '/inventory/cycle-counts': OPERATIONAL_ROLES,

  // ============================================
  // PRODUCTS - All roles can view
  // ============================================
  '/products': ALL_ROLES,
  '/products/categories': ALL_ROLES,
  '/products/bundles': ALL_ROLES,
  '/products/import': MANAGEMENT_ROLES,

  // ============================================
  // INBOUND (Purchase Orders, Goods Receiving)
  // ============================================
  '/purchase-orders': ALL_ROLES,
  '/goods-receiving': OPERATIONAL_ROLES,
  '/suppliers': ALL_ROLES,

  // ============================================
  // OUTBOUND (Sales Orders, Customers)
  // ============================================
  '/sales-orders': ALL_ROLES,
  '/customers': ALL_ROLES,
  '/clients': ALL_ROLES,

  // ============================================
  // FULFILLMENT (Picking & Packing) - Packer has full access
  // ============================================
  '/picking': ALL_ROLES,
  '/packing': ALL_ROLES,

  // ============================================
  // SHIPPING & LOGISTICS - Packer has full access
  // ============================================
  '/shipments': ALL_ROLES,
  '/returns': ALL_ROLES,
  '/transfers': ALL_ROLES,
  '/fba-transfers': ALL_ROLES,
  '/labels': ALL_ROLES,

  // ============================================
  // REPLENISHMENT
  // ============================================
  '/replenishment': ALL_ROLES,
  '/replenishment/tasks': ALL_ROLES,
  '/replenishment/settings': MANAGEMENT_ROLES,

  // ============================================
  // INTEGRATIONS & CHANNELS
  // ============================================
  '/integrations': ALL_ROLES,
  '/integrations/channels': ALL_ROLES,
  '/integrations/mappings': ALL_ROLES,

  // ============================================
  // ANALYTICS & REPORTS - All roles can view
  // ============================================
  '/analytics': ALL_ROLES,
  '/analytics/pricing-calculator': ALL_ROLES,
  '/analytics/channels': ALL_ROLES,
  '/analytics/optimizer': ALL_ROLES,
  '/analytics/margins': ALL_ROLES,
  '/reports': ALL_ROLES,

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
 * Normalize role to lowercase for comparison
 * Backend may send SUPER_ADMIN, frontend uses super_admin
 */
function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/-/g, '_');
}

/**
 * Check if a user role has permission to access a route
 * CLIENT REQUIREMENT: All logged-in users should be able to access pages
 * Allow access by default for any authenticated user
 */
export function hasRoutePermission(userRole: string, route: string): boolean {
  if (!userRole) return false;

  const normalizedRole = normalizeRole(userRole);

  // Check exact match first
  let allowedRoles = ROUTE_PERMISSIONS[route];

  // If no exact match, check if route starts with any defined route
  if (!allowedRoles) {
    // Find the best matching parent route
    const parentRoutes = Object.keys(ROUTE_PERMISSIONS)
      .filter(r => route.startsWith(r) && r !== '/')
      .sort((a, b) => b.length - a.length); // Sort by length descending to get most specific first

    if (parentRoutes.length > 0) {
      allowedRoles = ROUTE_PERMISSIONS[parentRoutes[0]];
    }
  }

  // PERMISSIVE DEFAULT: If route is not found, allow access for any authenticated user
  // This ensures users don't get unexpectedly redirected to login
  if (!allowedRoles) {
    return true; // Allow access for any authenticated user
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
    'picker': 'Access to picking tasks and sales orders',
    'packer': 'Access to packing tasks and shipments',
    'warehouse_staff': 'General warehouse operations access',
    'viewer': 'Read-only access to view data and reports',
  };
  return descriptions[normalizedRole] || 'Standard user access';
}
