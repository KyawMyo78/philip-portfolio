import { NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { verifyAdminToken } from '@/lib/admin-token'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Admin session check (the middleware also enforces this; kept here as a second lock)
async function isAuthorized(req: Request) {
  const token = req.headers.get('cookie')?.match(/(?:^|;\s*)admin-token=([^;]+)/)?.[1];
  return verifyAdminToken(token, process.env.NEXTAUTH_SECRET);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const doc = await db.collection('blogPosts').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const post = {
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data()?.publishedAt?.toDate(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Get current post data
    const doc = await db.collection('blogPosts').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const currentData = doc.data();
    const now = new Date();

    // Prepare update data
    const updateData: any = {
      ...body,
      updatedAt: now,
    };

    // If changing status to published and no publishedAt date, set it now
    if (body.status === 'published' && currentData?.status !== 'published') {
      updateData.publishedAt = now;
    }

    // If changing slug, check if it's unique
    if (body.slug && body.slug !== currentData?.slug) {
      const existingPost = await db
        .collection('blogPosts')
        .where('slug', '==', body.slug)
        .limit(1)
        .get();

      if (!existingPost.empty && existingPost.docs[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'A post with this slug already exists' },
          { status: 400 }
        );
      }
    }

    await db.collection('blogPosts').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Get current post data
    const doc = await db.collection('blogPosts').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const currentData = doc.data();
    const now = new Date();

    // Prepare update data
    const updateData: any = {
      ...body,
      updatedAt: now,
    };

    // If changing status to published and no publishedAt date, set it now
    if (body.status === 'published' && !currentData?.publishedAt) {
      updateData.publishedAt = now;
    }

    // If changing slug, check if it's unique
    if (body.slug && body.slug !== currentData?.slug) {
      const existingPost = await db
        .collection('blogPosts')
        .where('slug', '==', body.slug)
        .limit(1)
        .get();

      if (!existingPost.empty && existingPost.docs[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'A post with this slug already exists' },
          { status: 400 }
        );
      }
    }

    await db.collection('blogPosts').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if post exists
    const doc = await db.collection('blogPosts').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    await db.collection('blogPosts').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
