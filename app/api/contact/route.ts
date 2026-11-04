import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { enforceRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request, 'contact', { limit: 5, windowMs: 15 * 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { name, email, subject, message } = await request.json();

    const validEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validFields = typeof name === 'string' && name.trim().length <= 100 &&
      typeof subject === 'string' && subject.trim().length <= 200 &&
      typeof message === 'string' && message.trim().length <= 5000;
    if (!validEmail || !validFields) {
      return NextResponse.json(
        { success: false, error: 'Please provide valid contact details.' },
        { status: 400 }
      );
    }

    // Save to Firestore
    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
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
