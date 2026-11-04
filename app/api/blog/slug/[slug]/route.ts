import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'


// shared, build-safe Firebase setup (lib/firebase-admin.ts)
const db = adminDb;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const snapshot = await db
      .collection('blogPosts')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const post = {
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    };

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
