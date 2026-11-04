import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from './lib/admin-token';
import { bearerToken, isClaudeKey, claudeKeyAllows } from './lib/claude-key';

// API calls anyone may make (the public site, the contact form, login and password reset).
// Everything else under /api needs a valid admin session.
const PUBLIC_API: [string, RegExp][] = [
  ['GET', /^\/api\/(site-settings|profile|og|blog|admin\/theme)$/],
  ['GET', /^\/api\/portfolio(\/(skills|projects|experience|achievements)(\/[^/]+)?)?$/],
  ['GET', /^\/api\/blog\/slug\/[^/]+$/],
  ['PATCH', /^\/api\/blog\/[^/]+$/], // view counter only; the route ignores anything else
  ['POST', /^\/api\/portfolio\/contacts$/], // contact form
  ['POST', /^\/api\/auth(\/(forgot-password|reset-password|verify-reset-token))?$/],
  ['DELETE', /^\/api\/auth$/], // logout
  ['POST', /^\/api\/revalidate$/], // protected by its own REVALIDATE_SECRET
  ['POST', /^\/api\/mcp(\/[^/]+)?$/], // Claude connector; checks CLAUDE_API_KEY itself
  ['GET', /^\/api\/mcp(\/[^/]+)?$/],
];
const PUBLIC_ADMIN_PAGES = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method === 'HEAD' ? 'GET' : request.method;

  if (pathname.startsWith('/api/')) {
    if (method === 'OPTIONS' || PUBLIC_API.some(([m, re]) => m === method && re.test(pathname))) return NextResponse.next();
    // Claude's API key: content editing and reading messages only, never login or credentials
    const key = bearerToken(request);
    if (key) {
      if (!isClaudeKey(key)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      if (!claudeKeyAllows(pathname, method)) return NextResponse.json({ success: false, error: 'Not allowed with the Claude API key' }, { status: 403 });
      console.log(`[claude-key] ${method} ${pathname}`); // shows in Vercel logs
      return NextResponse.next();
    }
    const ok = await verifyAdminToken(request.cookies.get('admin-token')?.value, process.env.NEXTAUTH_SECRET);
    return ok ? NextResponse.next() : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // admin pages: a real, unexpired, correctly signed session is required (not just any cookie)
  if (PUBLIC_ADMIN_PAGES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const ok = await verifyAdminToken(request.cookies.get('admin-token')?.value, process.env.NEXTAUTH_SECRET);
  if (ok) return NextResponse.next();
  const res = NextResponse.redirect(new URL('/admin/login', request.url));
  res.cookies.delete('admin-token');
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
