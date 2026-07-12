import { type NextRequest, NextResponse } from 'next/server';

// Routes that require authentication — prefix match
const PROTECTED_PREFIXES = [
  '/professional/dashboard',
  '/professional/profile',
  '/professional/applications',
  '/professional/shifts',
  '/professional/notifications',
  '/employer/dashboard',
  '/employer/jobs',
  '/employer/applications',
  '/employer/professionals',
  '/employer/shifts',
  '/employer/billing',
  '/employer/profile',
  '/employer/team',
  '/employer/members',
  '/admin',
];

// Routes that should redirect already-authenticated users to dashboard
const AUTH_ONLY_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // The 'zivara_auth' cookie is set by the client after login.
  // Used only for SSR-side redirect logic; actual JWT validation happens in the API.
  const isAuthenticated = request.cookies.has('zivara_auth');

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth-only routes
  const isAuthRoute = AUTH_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/professional/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets, API routes, and Next.js internals
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
