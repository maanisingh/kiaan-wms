import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that exist under /protected/ and need redirecting
const PROTECTED_ROUTES = [
  'analytics',
  'barcode',
  'clients',
  'companies',
  'contact',
  'customers',
  'dashboard',
  'dashboards',
  'demo',
  'documents',
  'fba-transfers',
  'fulfillment',
  'goods-receiving',
  'inbound',
  'integrations',
  'inventory',
  'labels',
  'notifications',
  'outbound',
  'packing',
  'picking',
  'privacy',
  'products',
  'purchase-orders',
  'replenishment',
  'reports',
  'returns',
  'sales-orders',
  'settings',
  'shipments',
  'suppliers',
  'transfers',
  'users',
  'warehouses',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the first segment of the path (e.g., /warehouses/123 -> warehouses)
  const firstSegment = pathname.split('/')[1];

  // Redirect protected routes from /route to /protected/route
  if (firstSegment && PROTECTED_ROUTES.includes(firstSegment)) {
    const newPath = pathname.replace(`/${firstSegment}`, `/protected/${firstSegment}`);
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Allow all routes (protection is handled client-side)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
