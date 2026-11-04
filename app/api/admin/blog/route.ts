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

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await db
      .collection('blogPosts')
      .orderBy('createdAt', 'desc')
      .get();

    const posts = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        views: data.views || 0, // Ensure views is always a number
        publishedAt: data.publishedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    console.error('Error fetching all blog posts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      tags,
      status,
      author,
      readTime,
      featured
    } = body;

    // Validate required fields
    if (!title || !slug || !excerpt || !content || !category || !author) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await db
      .collection('blogPosts')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existingPost.empty) {
      return NextResponse.json(
        { success: false, error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }

    const now = new Date();
    const postData = {
      title,
      slug,
      excerpt,
      content,
      featuredImage: featuredImage || null,
      category,
      tags: tags || [],
      status: status || 'draft',
      publishedAt: status === 'published' ? now : null,
      author,
      readTime: readTime || 5,
      views: 0,
      featured: featured || false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('blogPosts').add(postData);

    return NextResponse.json({ 
      success: true, 
      data: { id: docRef.id, ...postData } 
    });
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
