import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Query Firestore for the reset token
    const resetTokensRef = adminDb.collection('password-resets');
    const query = resetTokensRef.where('token', '==', token);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if any token matches and is not expired
    let validToken = false;
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt > new Date()) {
        validToken = true;
      }
    });

    if (!validToken) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error('Error verifying reset token:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
