'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { hasRoutePermission, getDefaultRouteForRole } from '@/lib/permissions';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for store to hydrate from localStorage before checking auth
    if (!_hasHydrated) {
      return;
    }

    // If not authenticated after hydration, redirect to login
    if (!isAuthenticated || !user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role-based route permission using the permissions system
    // This ensures pickers/packers can't access admin pages via URL
    const routeToCheck = pathname.replace('/protected', '') || '/dashboard';
    const hasPermission = hasRoutePermission(user.role, routeToCheck);

    // Also check explicit allowedRoles if provided
    const passesExplicitRoles = !allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(user.role);

    if (!hasPermission || !passesExplicitRoles) {
      console.warn(`Access denied: ${user.role} cannot access ${routeToCheck}`);
      // Redirect to user's default dashboard instead of generic unauthorized
      const defaultRoute = getDefaultRouteForRole(user.role);
      router.push(`/protected${defaultRoute}`);
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  }, [_hasHydrated, isAuthenticated, user, allowedRoles, router, pathname]);

  // Show loading while hydrating or checking auth
  if (!_hasHydrated || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Checking permissions..." />
      </div>
    );
  }

  // If not authorized, show redirecting message
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Redirecting to your dashboard..." />
      </div>
    );
  }

  return <>{children}</>;
}
