// Authentication and role management utilities

export type UserRole = 'super_admin' | 'company_admin' | 'warehouse_manager' | 'inventory_manager' | 'admin' | 'manager' | 'picker' | 'packer' | 'warehouse_staff' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  warehouseId?: string;
}

// Mock user for development - replace with actual auth logic
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('wms_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Return mock admin user for development
  return {
    id: '1',
    name: 'Admin User',
    email: 'admin@kiaan.com',
    role: 'admin',
  };
};

export const setCurrentUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wms_user', JSON.stringify(user));
  }
};

export const clearCurrentUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wms_user');
    localStorage.removeItem('wms_auth_token');
  }
};

export const getRoleDashboardPath = (role: UserRole): string => {
  // All roles use the main dashboard now
  return '/dashboard';
};

export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  // Normalize the role for comparison
  const normalizedRole = userRole.toLowerCase().replace(/-/g, '_') as UserRole;
  return requiredRoles.some(r => r.toLowerCase().replace(/-/g, '_') === normalizedRole);
};

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  // Import permission check from permissions module
  // This is a simplified version - the full version is in permissions.ts
  const normalizedRole = userRole.toLowerCase().replace(/-/g, '_');

  // Super admin and company admin can access everything
  if (normalizedRole === 'super_admin' || normalizedRole === 'company_admin') {
    return true;
  }

  // Admin can access most routes
  if (normalizedRole === 'admin') {
    const superAdminOnly = ['/companies'];
    return !superAdminOnly.some(r => route.startsWith(r));
  }

  // Warehouse manager
  if (normalizedRole === 'warehouse_manager') {
    const allowedRoutes = [
      '/dashboard', '/profile',
      '/warehouses', '/inventory', '/products',
      '/purchase-orders', '/goods-receiving', '/suppliers',
      '/sales-orders', '/customers', '/clients',
      '/picking', '/packing', '/shipments', '/returns',
      '/transfers', '/fba-transfers', '/labels',
      '/replenishment', '/analytics', '/reports',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  // Manager
  if (normalizedRole === 'manager') {
    const restrictedRoutes = ['/users', '/companies', '/settings', '/integrations'];
    if (restrictedRoutes.some(r => route.startsWith(r))) return false;
    return true;
  }

  // Picker can access picking-related routes
  if (normalizedRole === 'picker') {
    const allowedRoutes = [
      '/dashboard', '/profile',
      '/picking', '/sales-orders', '/inventory',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  // Packer can access packing-related routes
  if (normalizedRole === 'packer') {
    const allowedRoutes = [
      '/dashboard', '/profile',
      '/packing', '/shipments', '/labels', '/sales-orders',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  // Warehouse staff
  if (normalizedRole === 'warehouse_staff') {
    const allowedRoutes = [
      '/dashboard', '/profile',
      '/goods-receiving', '/inventory', '/shipments', '/transfers',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  // Viewer - read-only access
  if (normalizedRole === 'viewer') {
    const allowedRoutes = [
      '/dashboard', '/profile',
      '/inventory', '/products', '/purchase-orders',
      '/suppliers', '/sales-orders', '/customers', '/clients',
      '/shipments', '/returns', '/reports',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  // Inventory manager
  if (normalizedRole === 'inventory_manager') {
    const allowedRoutes = [
      '/dashboard', '/profile',
      '/inventory', '/products', '/purchase-orders',
      '/goods-receiving', '/suppliers', '/sales-orders',
      '/customers', '/transfers', '/reports',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  return false;
};
