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

// Define which roles can access which routes
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  // Dashboard - everyone can access
  '/dashboard': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager', 'picker', 'packer', 'warehouse_staff', 'viewer'],
  '/profile': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager', 'picker', 'packer', 'warehouse_staff', 'viewer'],

  // Admin routes
  '/settings': ['super_admin', 'company_admin'],
  '/users': ['super_admin', 'company_admin'],
  '/companies': ['super_admin'],

  // Warehouse management
  '/warehouses': ['super_admin', 'company_admin', 'warehouse_manager'],
  '/zones': ['super_admin', 'company_admin', 'warehouse_manager'],
  '/locations': ['super_admin', 'company_admin', 'warehouse_manager'],

  // Inventory management
  '/inventory': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager', 'viewer'],
  '/stock-adjustments': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager'],
  '/cycle-counts': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager'],

  // Products and brands
  '/products': ['super_admin', 'company_admin', 'inventory_manager', 'admin', 'manager', 'viewer'],
  '/brands': ['super_admin', 'company_admin', 'inventory_manager', 'admin', 'manager'],

  // Purchase orders
  '/purchase-orders': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager', 'viewer'],
  '/goods-receipts': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager'],
  '/suppliers': ['super_admin', 'company_admin', 'admin', 'manager', 'viewer'],

  // Sales and fulfillment
  '/sales-orders': ['super_admin', 'company_admin', 'warehouse_manager', 'admin', 'manager', 'picker', 'packer', 'viewer'],
  '/customers': ['super_admin', 'company_admin', 'admin', 'manager', 'viewer'],

  // Pick and pack
  '/pick-lists': ['super_admin', 'company_admin', 'warehouse_manager', 'admin', 'manager', 'picker'],
  '/packing-tasks': ['super_admin', 'company_admin', 'warehouse_manager', 'admin', 'manager', 'packer'],

  // Shipping and returns
  '/shipments': ['super_admin', 'company_admin', 'warehouse_manager', 'admin', 'manager', 'viewer'],
  '/returns': ['super_admin', 'company_admin', 'warehouse_manager', 'admin', 'manager', 'viewer'],
  '/transfers': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager'],

  // Integrations
  '/marketplace-channels': ['super_admin', 'company_admin', 'admin'],
  '/sku-mappings': ['super_admin', 'company_admin', 'admin'],

  // Reports
  '/reports': ['super_admin', 'company_admin', 'warehouse_manager', 'inventory_manager', 'admin', 'manager', 'viewer'],
};

/**
 * Check if a user role has permission to access a route
 */
export function hasRoutePermission(userRole: string, route: string): boolean {
  const allowedRoles = ROUTE_PERMISSIONS[route];

  // If route is not in permissions config, allow access (default open)
  if (!allowedRoles) {
    return true;
  }

  return allowedRoles.includes(userRole as Role);
}

/**
 * Get all routes accessible by a role
 */
export function getAccessibleRoutes(userRole: string): string[] {
  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(userRole as Role))
    .map(([route]) => route);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: string, roles: Role[]): boolean {
  return roles.includes(userRole as Role);
}

/**
 * Format role name for display
 */
export function formatRole(role: string): string {
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Get role color for tags/badges
 */
export function getRoleColor(role: string): string {
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
  return colors[role] || 'default';
}
