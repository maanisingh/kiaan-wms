import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware to handle redirects for auth pages
// Most route protection is handled client-side via ProtectedRoute component

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
