import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminDb } from '../../../lib/firebase-admin';

// Admin credentials: Firebase first (changed by the password-reset flow), then environment variables
async function getAdminCredentials() {
  try {
    const doc = await adminDb.collection('admin-settings').doc('credentials').get();
    if (doc.exists) {
      const data = doc.data();
      return { email: data?.email as string | undefined, passwordHash: data?.passwordHash as string | undefined };
    }
  } catch {
    /* fall back to env */
  }
  return { email: process.env.ADMIN_EMAIL, passwordHash: process.env.ADMIN_PASSWORD_HASH };
}

// Slow down password guessing: 5 failed attempts per IP per 15 minutes.
// ponytail: in-memory, so it is per server instance; move to Firestore/Redis if attacks become real.
const failures = new Map<string, { count: number; until: number }>();
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 5;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const rec = failures.get(ip);
  if (rec && rec.until > Date.now() && rec.count >= MAX_FAILS) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }
  const fail = () => {
    const r = rec && rec.until > Date.now() ? rec : { count: 0, until: Date.now() + WINDOW };
    r.count++;
    failures.set(ip, r);
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  };

  try {
    const { email, password } = await request.json();
    const secret = process.env.NEXTAUTH_SECRET;
    const { email: adminEmail, passwordHash } = await getAdminCredentials();
    if (!secret || !adminEmail || !passwordHash) {
      console.error('Admin login is not configured (NEXTAUTH_SECRET / admin credentials missing)');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }
    if (typeof email !== 'string' || typeof password !== 'string') return fail();
    if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) return fail();
    if (!(await bcrypt.compare(password, passwordHash))) return fail();

    failures.delete(ip);
    const token = jwt.sign({ email: adminEmail, role: 'admin' }, secret, { algorithm: 'HS256', expiresIn: '24h' });
    const response = NextResponse.json({ success: true, message: 'Login successful', user: { email: adminEmail, role: 'admin' } });
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logout successful' });
  response.cookies.set('admin-token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(0) });
  return response;
}
