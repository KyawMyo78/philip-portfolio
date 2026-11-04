import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'


// shared, build-safe Firebase setup (lib/firebase-admin.ts)
const db = adminDb;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Check if this is a view increment request
    if (body.views !== undefined) {
      // Get current post data
      const doc = await db.collection('blogPosts').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json(
          { success: false, error: 'Blog post not found' },
          { status: 404 }
        );
      }

      // Only increment views for published posts
      const currentData = doc.data();
      if (currentData?.status !== 'published') {
        return NextResponse.json(
          { success: false, error: 'Cannot increment views for unpublished posts' },
          { status: 400 }
        );
      }

      // Update only the views field
      // +1 on the server; the number the visitor sends is ignored so it can't be faked
      await db.collection('blogPosts').doc(id).update({ views: FieldValue.increment(1) });

      return NextResponse.json({ success: true });
    }

    // For other PATCH requests, return unauthorized
    return NextResponse.json(
      { success: false, error: 'Unauthorized operation' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update blog post' },
      { status: 500 }
    );
  }
}