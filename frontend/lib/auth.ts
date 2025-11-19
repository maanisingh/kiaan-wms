// Authentication and role management utilities

export type UserRole = 'admin' | 'manager' | 'warehouse_staff' | 'picker' | 'packer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
  const dashboardPaths: Record<UserRole, string> = {
    admin: '/dashboard',
    manager: '/dashboards/manager',
    warehouse_staff: '/dashboards/warehouse-staff',
    picker: '/dashboards/picker',
    packer: '/dashboards/packer',
  };

  return dashboardPaths[role] || '/dashboard';
};

export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  // Admin can access everything
  if (userRole === 'admin') return true;

  // Manager can access most routes except user management
  if (userRole === 'manager') {
    const restrictedRoutes = ['/users', '/companies', '/settings'];
    return !restrictedRoutes.some(r => route.startsWith(r));
  }

  // Warehouse staff can access operational routes
  if (userRole === 'warehouse_staff') {
    const allowedRoutes = [
      '/dashboards/warehouse-staff',
      '/goods-receiving',
      '/inventory',
      '/shipments',
      '/transfers',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  // Picker can only access picking-related routes
  if (userRole === 'picker') {
    const allowedRoutes = [
      '/dashboards/picker',
      '/picking',
      '/sales-orders',
      '/inventory',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  // Packer can only access packing-related routes
  if (userRole === 'packer') {
    const allowedRoutes = [
      '/dashboards/packer',
      '/packing',
      '/shipments',
      '/labels',
    ];
    return allowedRoutes.some(r => route.startsWith(r));
  }

  return false;
};
