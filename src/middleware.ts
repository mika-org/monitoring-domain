import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'viorecert-super-secret-jwt-key-2026-secure'
);

const AUTH_COOKIE_NAME = 'viorecert_session';

async function isTokenValid(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = await isTokenValid(token);

  // Allow static files, favicon, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Handle /login page
  if (pathname === '/login') {
    if (authenticated) {
      // Redirect authenticated user to dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Agent ingestion endpoints are protected by Bearer token in route handlers
  if (pathname.startsWith('/api/agent/')) {
    return NextResponse.next();
  }

  // Handle protected API routes
  if (pathname.startsWith('/api/')) {
    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Protect main dashboard and other pages
  if (!authenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
