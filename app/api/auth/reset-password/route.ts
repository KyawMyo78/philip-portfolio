import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
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

    // Check if any token matches and is not expired
    let validTokenDoc = null;
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt > new Date()) {
        validTokenDoc = doc;
      }
    });

    if (!validTokenDoc) {
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
        email: email,
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
      newHash: hashedPassword // Return the hash for manual env update
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
