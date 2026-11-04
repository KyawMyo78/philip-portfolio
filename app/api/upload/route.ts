import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';
import { isUnauthorized, requireAdmin } from '@/lib/admin-auth';
import { enforceRateLimit } from '@/lib/rate-limiter';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: storageBucket,
  });
}

// Get storage instance
const storage = getStorage();

export async function POST(request: NextRequest) {
  const session = requireAdmin(request);
  if (isUnauthorized(session)) return session;
  const rateLimitResponse = enforceRateLimit(request, 'upload', { limit: 30, windowMs: 15 * 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const uploadType: string | null = data.get('uploadType') as string;
    const fileName: string | null = data.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file received' }, { status: 400 });
    }

    // Validate file type based on upload type
    let allowedTypes: string[] = [];
    let maxSize: number = 5 * 1024 * 1024; // Default 5MB

    if (uploadType === 'general') {
      // For CV/documents AND images (achievements, etc.)
      allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 
        'image/png', 
        'image/webp', 
        'image/gif'
      ];
      maxSize = 10 * 1024 * 1024; // 10MB for general uploads
    } else {
      // For images only (profile, projects)
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      maxSize = 5 * 1024 * 1024; // 5MB for images
    }

    if (!allowedTypes.includes(file.type)) {
      const typeMessage = uploadType === 'general' 
        ? 'Invalid file type. Only PDF, DOC, DOCX, JPEG, PNG, WebP, and GIF are allowed.'
        : 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed for images.';
      return NextResponse.json({ 
        success: false, 
        message: typeMessage
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > maxSize) {
      const sizeLimit = uploadType === 'general' ? '10MB' : '5MB';
      return NextResponse.json({ 
        success: false, 
        message: `File too large. Maximum size is ${sizeLimit}.` 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine file path and name for Firebase Storage
    let storagePath = '';
    let finalFileName = '';
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    switch (uploadType) {
      case 'profile':
        storagePath = 'images';
        finalFileName = `profile.${fileExtension}`;
        break;
      case 'project':
        storagePath = 'images/projects';
        finalFileName = fileName || `project-${Date.now()}.${fileExtension}`;
        break;
      case 'general':
        // Determine if it's an image or document
        if (file.type.startsWith('image/')) {
          storagePath = 'images/general';
          finalFileName = fileName || `image-${Date.now()}.${fileExtension}`;
        } else {
          storagePath = 'documents';
          finalFileName = fileName || `cv-${Date.now()}.${fileExtension}`;
        }
        break;
      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid upload type' 
        }, { status: 400 });
    }

    // Upload to Firebase Storage
    if (!bucketName) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Storage bucket not configured' 
      }, { status: 500 });
    }

    // Try to get the default bucket first, then fallback to named bucket
    let bucket;
    try {
      bucket = storage.bucket(); // Use default bucket from initialization
    } catch (error) {
      bucket = storage.bucket(bucketName);
    }
    
    const fileRef = bucket.file(`${storagePath}/${finalFileName}`);
    const downloadToken = randomUUID();
    
    // Upload the file
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadType: uploadType,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          // Firebase's download endpoint uses this token while the bucket stays private.
          firebaseStorageDownloadTokens: downloadToken,
        }
      }
    });

    // Generate a Firebase download URL. Unlike a raw GCS URL, this does not
    // require public bucket/object access and works with Firebase Storage rules.
    const actualBucketName = bucket.name;
    const encodedPath = encodeURIComponent(`${storagePath}/${finalFileName}`);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${actualBucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully',
      url: downloadUrl,
      fileName: finalFileName,
      storagePath: `${storagePath}/${finalFileName}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
