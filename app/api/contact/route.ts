import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Save to Firestore
    const contactData = {
      name,
      email,
      subject,
      message,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('contacts').add(contactData);

    // In a real application, you might also send an email notification here

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      id: docRef.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // This would be protected in a real app - only for admin access
    const snapshot = await adminDb
      .collection('contacts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const contacts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: contacts
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
