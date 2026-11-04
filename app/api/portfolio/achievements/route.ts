import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const achievementsRef = adminDb.collection('achievements');
    const snapshot = await achievementsRef.orderBy('order', 'asc').get();
    
    const achievements = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true, 
      data: achievements 
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching achievements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.category || !body.date) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const achievementData = {
      title: body.title,
      description: body.description,
      category: body.category,
      date: body.date,
      issuer: body.issuer || null,
      credentialId: body.credentialId || null,
      credentialUrl: body.credentialUrl || null,
      image: body.image || null,
      featured: body.featured || false,
      order: body.order || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('achievements').add(achievementData);

    return NextResponse.json({
      success: true,
      message: 'Achievement created successfully',
      id: docRef.id
    });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating achievement' },
      { status: 500 }
    );
  }
}
