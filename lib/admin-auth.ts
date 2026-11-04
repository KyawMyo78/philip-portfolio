import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, isClaudeKey, claudeKeyAllows } from './claude-key';

export interface AdminSession {
  email: string;
  role: 'admin';
}

export function getJwtSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'development-only-admin-secret' : undefined);
}

export function requireAdmin(request: NextRequest): AdminSession | NextResponse {
  // Claude's API key, limited to the same scope the middleware enforces
  const key = bearerToken(request);
  if (key) {
    return isClaudeKey(key) && claudeKeyAllows(request.nextUrl.pathname, request.method)
      ? { email: 'claude-api-key', role: 'admin' }
      : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = request.cookies.get('admin-token')?.value;
  const secret = getJwtSecret();

  if (!token || !secret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== 'object' || payload.role !== 'admin' || typeof payload.email !== 'string') {
      throw new Error('Invalid admin session');
    }
    return { email: payload.email, role: 'admin' };
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}

export function isUnauthorized(result: AdminSession | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
