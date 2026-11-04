import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET all skills
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('skills')
      .orderBy('order', 'asc')
      .get();

    const skills = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: skills
    });

  } catch (error: any) {
    console.error('Error fetching skills:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch skills',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST new skill
export async function POST(request: NextRequest) {
  try {
    const skillData = await request.json();

    // Add metadata
    const newSkill = {
      ...skillData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('skills').add(newSkill);

    // Trigger on-demand revalidation for important pages
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: process.env.REVALIDATE_SECRET, paths: ['/', '/about'] })
      });
    } catch (e) {
      console.warn('Revalidation call failed', e);
    }
    return NextResponse.json({
      success: true,
      message: 'Skill created successfully',
      id: docRef.id
    });

  } catch (error) {
    console.error('Skill creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}
