import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

// GET - Fetch current theme setting
export async function GET(request: NextRequest) {
  try {
    // Fetch theme from Firestore
    const themeDoc = await adminDb
      .collection('siteSettings')
      .doc('theme')
      .get();

    if (themeDoc.exists) {
      const data = themeDoc.data();
      return NextResponse.json({ 
        themeId: data?.themeId || 'clover-gold',
        updatedAt: data?.updatedAt || null
      });
    }

    // Return default theme if not found
    return NextResponse.json({ 
      themeId: 'clover-gold',
      updatedAt: null 
    });
  } catch (error) {
    console.error('Failed to fetch theme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme', themeId: 'clover-gold' },
      { status: 500 }
    );
  }
}

// POST - Save theme setting
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { themeId } = await request.json();

    if (!themeId || typeof themeId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid theme ID' },
        { status: 400 }
      );
    }

    // Validate theme ID exists (basic validation)
    const validThemeIds = [
      'clover-gold',
      'ocean-blue',
      'purple-sunset',
      'emerald-mint',
      'midnight-rose',
      'amber-earth'
    ];

    if (!validThemeIds.includes(themeId)) {
      return NextResponse.json(
        { error: 'Invalid theme ID' },
        { status: 400 }
      );
    }

    // Save to Firestore
    await adminDb
      .collection('siteSettings')
      .doc('theme')
      .set({
        themeId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      themeId,
      message: 'Theme saved successfully'
    });
  } catch (error) {
    console.error('Failed to save theme:', error);
    return NextResponse.json(
      { error: 'Failed to save theme' },
      { status: 500 }
    );
  }
}
