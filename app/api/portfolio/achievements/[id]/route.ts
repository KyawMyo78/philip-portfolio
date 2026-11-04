import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = adminDb.collection('achievements').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, message: 'Achievement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    console.error('Error fetching achievement:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching achievement' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      updatedAt: new Date().toISOString()
    };

    const docRef = adminDb.collection('achievements').doc(id);
    await docRef.update(achievementData);

    return NextResponse.json({
      success: true,
      message: 'Achievement updated successfully',
      data: { id, ...achievementData }
    });
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating achievement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = adminDb.collection('achievements').doc(id);
    
    // Check if achievement exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, message: 'Achievement not found' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting achievement' },
      { status: 500 }
    );
  }
}
