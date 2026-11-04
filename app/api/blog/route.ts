import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'


// shared, build-safe Firebase setup (lib/firebase-admin.ts)
const db = adminDb;

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await db
      .collection('blogPosts')
      .where('status', '==', 'published')
      .get();

    const posts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    // Sort by publishedAt or createdAt on the server side
    posts.sort((a: any, b: any) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    console.error('Error fetching published blog posts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
