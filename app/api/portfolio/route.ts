import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Fetch portfolio data from Firestore
    const [personalInfoSnapshot, skillsSnapshot, experienceSnapshot, projectsSnapshot] = await Promise.all([
      adminDb.collection('personalInfo').limit(1).get(),
      adminDb.collection('skills').orderBy('order', 'asc').get(),
      adminDb.collection('experience').orderBy('order', 'asc').get(),
      adminDb.collection('projects').orderBy('order', 'asc').get(),
    ]);

    const personalInfo = personalInfoSnapshot.docs[0]?.data() || null;
    const skills = skillsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const experience = experienceSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const projects = projectsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      success: true,
      data: {
        personalInfo,
        skills,
        experience,
        projects
      }
    });

  } catch (error) {
    console.error('Portfolio data fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This would be protected with authentication in a real app
    const { type, data } = await request.json();

    let result;
    switch (type) {
      case 'personalInfo':
        result = await adminDb.collection('personalInfo').doc('main').set({
          ...data,
          updatedAt: new Date().toISOString()
        });
        break;
      
      case 'skill':
        result = await adminDb.collection('skills').add({
          ...data,
          createdAt: new Date().toISOString()
        });
        break;
      
      case 'experience':
        result = await adminDb.collection('experience').add({
          ...data,
          createdAt: new Date().toISOString()
        });
        break;
      
      case 'project':
        result = await adminDb.collection('projects').add({
          ...data,
          createdAt: new Date().toISOString()
        });
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid data type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully'
    });

  } catch (error) {
    console.error('Portfolio data save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save data' },
      { status: 500 }
    );
  }
}
