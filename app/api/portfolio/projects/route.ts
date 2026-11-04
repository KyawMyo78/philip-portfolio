import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { callRevalidate } from '@/lib/revalidate';

// GET all projects
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('projects')
      .orderBy('order', 'asc')
      .get();

    const projects = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST new project
export async function POST(request: NextRequest) {
  try {
    const projectData = await request.json();

    // Add metadata
    const newProject = {
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('projects').add(newProject);
  await callRevalidate(['/','/projects']);
    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      id: docRef.id
    });

  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
