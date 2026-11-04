import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { enforceRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request, 'password-reset-confirm', { limit: 5, windowMs: 60 * 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Token, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Verify the reset token
    const resetTokensRef = adminDb.collection('password-resets');
    const query = resetTokensRef.where('token', '==', token);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if any token matches and is not expired.
    const validTokenDoc = snapshot.docs.find((doc: any) => {
      const data = doc.data();
      return new Date(data.expiresAt) > new Date();
    });

    if (!validTokenDoc) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const resetEmail = validTokenDoc.id;
    if (email.trim().toLowerCase() !== resetEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the password hash in Firebase
    try {
      await adminDb.collection('admin-settings').doc('credentials').set({
        email: resetEmail,
        passwordHash: hashedPassword,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      console.log('✅ Password hash updated successfully in Firebase');
    } catch (error) {
      console.error('❌ Failed to update password hash in Firebase:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Delete all reset tokens for this email
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successful',
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
