import { NextRequest, NextResponse } from 'next/server';

type RateLimitConfig = { limit: number; windowMs: number };
type RateLimitEntry = { count: number; resetAt: number };

const entries = new Map<string, RateLimitEntry>();

export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function enforceRateLimit(
  request: NextRequest,
  namespace: string,
  { limit, windowMs }: RateLimitConfig,
): NextResponse | null {
  const now = Date.now();
  const key = `${namespace}:${getClientIdentifier(request)}`;
  const current = entries.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  entry.count += 1;
  entries.set(key, entry);

  if (entry.count <= limit) return null;
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } },
  );
}
