'use client';

import { useAuthStore } from '@/store/authStore';
import {
  canDelete,
  canCreate,
  canUpdate,
  canManageUsers,
  hasFeature,
  hasRoutePermission,
  isAdmin,
  isManagement,
  normalizeRole,
  ROLE_ACTIONS,
  ROLE_FEATURES,
  type Action
} from '@/lib/permissions';

/**
 * Custom hook for permission checks
 * Use this in components to conditionally render based on user permissions
 */
export function usePermissions() {
  const { user } = useAuthStore();
  const role = user?.role || '';

  return {
    // Action permissions
    canDelete: () => canDelete(role),
    canCreate: () => canCreate(role),
    canUpdate: () => canUpdate(role),

    // Feature permissions
    canManageUsers: () => canManageUsers(role),
    hasFeature: (feature: string) => hasFeature(role, feature),

    // Route permissions
    canAccessRoute: (route: string) => hasRoutePermission(role, route),

    // Role checks
    isAdmin: () => isAdmin(role),
    isManagement: () => isManagement(role),

    // Get current role
    role: normalizeRole(role),

    // Get all allowed actions for current role
    allowedActions: ROLE_ACTIONS[normalizeRole(role)] || [],

    // Get all features for current role
    features: ROLE_FEATURES[normalizeRole(role)] || [],
  };
}

export default usePermissions;
