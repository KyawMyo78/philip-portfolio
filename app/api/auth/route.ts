import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminDb } from '../../../lib/firebase-admin';
import { getJwtSecret } from '@/lib/admin-auth';
import { enforceRateLimit } from '@/lib/rate-limiter';

async function getAdminCredentials() {
  try {
    const credentialsDoc = await adminDb.collection('admin-settings').doc('credentials').get();
    if (credentialsDoc.exists) {
      const data = credentialsDoc.data();
      return { email: data?.email, passwordHash: data?.passwordHash, source: 'firebase' };
    }
  } catch {
    // Local development can fall back to environment credentials.
  }

  return {
    email: process.env.ADMIN_EMAIL,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
    source: 'environment',
  };
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request, 'admin-login', { limit: 5, windowMs: 15 * 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const credentials = await getAdminCredentials();
    if (!credentials.email || !credentials.passwordHash) {
      console.error(`Admin credentials are unavailable (${credentials.source}).`);
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    if (email !== credentials.email || !(await bcrypt.compare(password, credentials.passwordHash))) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const secret = getJwtSecret();
    if (!secret) {
      console.error('NEXTAUTH_SECRET is required in production.');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const token = jwt.sign({ email, role: 'admin' }, secret, { expiresIn: '24h' });
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { email, role: 'admin' },
    });
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
  response.cookies.set('admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  });
  return response;
}
