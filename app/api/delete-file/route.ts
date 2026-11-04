import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { isUnauthorized, requireAdmin } from '@/lib/admin-auth';

// Initialize Firebase Admin SDK

// shared, build-safe Firebase setup (lib/firebase-admin.ts)
const storage = adminStorage;
const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export async function DELETE(request: NextRequest) {
  const session = requireAdmin(request);
  if (isUnauthorized(session)) return session;

  try {
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json({ 
        success: false, 
        message: 'Storage path is required' 
      }, { status: 400 });
    }

    if (!bucketName) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Storage bucket not configured' 
      }, { status: 500 });
    }

    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(storagePath);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return NextResponse.json({ 
        success: false, 
        message: 'File not found' 
      }, { status: 404 });
    }

    // Delete the file
    await fileRef.delete();

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully' 
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Delete failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
