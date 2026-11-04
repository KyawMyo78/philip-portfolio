import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { callRevalidate } from '@/lib/revalidate';

// GET single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('projects').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });

  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectData = await request.json();

    // Add update timestamp
    const updatedProject = {
      ...projectData,
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection('projects').doc(id).update(updatedProject);

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully'
    });

    // fire-and-forget revalidation
    try { callRevalidate(['/','/projects']); } catch (e) { console.warn(e); }

  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('projects').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

    try { callRevalidate(['/','/projects']); } catch (e) { console.warn(e); }

  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
