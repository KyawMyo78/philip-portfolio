import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET single skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('skills').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });

  } catch (error) {
    console.error('Skill fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skill' },
      { status: 500 }
    );
  }
}

// PUT update skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const skillData = await request.json();

    // Add update timestamp
    const updatedSkill = {
      ...skillData,
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection('skills').doc(id).update(updatedSkill);

    return NextResponse.json({
      success: true,
      message: 'Skill updated successfully'
    });

  } catch (error) {
    console.error('Skill update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update skill' },
      { status: 500 }
    );
  }
}

// DELETE skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('skills').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Skill deleted successfully'
    });

  } catch (error) {
    console.error('Skill deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}
