import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_API_PREFIXES = ['/api/admin', '/api/portfolio/contacts'];
const ADMIN_READ_PATHS = ['/api/contact', '/api/debug', '/api/debug-env', '/api/debug-profile', '/api/firebase-debug', '/api/test-cookie'];
const PUBLIC_AUTH_PATHS = ['/api/auth', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/verify-reset-token', '/api/revalidate'];

function getJwtSecret(): Uint8Array | undefined {
  const secret = process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'development-only-admin-secret' : undefined);
  return secret ? new TextEncoder().encode(secret) : undefined;
}

function requiresAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { method } = request;
  if (pathname.startsWith('/admin')) return !['/admin/login', '/admin/forgot-password', '/admin/reset-password'].includes(pathname);
  if (!pathname.startsWith('/api/')) return false;
  if (ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (ADMIN_READ_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  if (pathname === '/api/contact') return method !== 'POST';
  if (PUBLIC_AUTH_PATHS.includes(pathname)) return false;
  return !['GET', 'HEAD', 'OPTIONS'].includes(method);
}

export async function middleware(request: NextRequest) {
  if (!requiresAdmin(request)) return NextResponse.next();

  const token = request.cookies.get('admin-token')?.value;
  const secret = getJwtSecret();
  let valid = false;
  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, secret);
      valid = payload.role === 'admin' && typeof payload.email === 'string';
    } catch {
      valid = false;
    }
  }
  if (valid) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
