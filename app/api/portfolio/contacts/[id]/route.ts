import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  replied: boolean;
  replyMessage?: string | null;
  replyDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET single contact message
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = id;
    
    const portfolioRef = adminDb.collection('portfolio').doc('data');
    const doc = await portfolioRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Contact message not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const contacts = data?.contacts || [];
    const contact = contacts.find((contact: ContactMessage) => contact.id === contactId);

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact message' },
      { status: 500 }
    );
  }
}

// UPDATE contact message (for status updates like read, starred, archived, replied)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = id;
    const updateData = await request.json();

    // Get current portfolio data
    const portfolioRef = adminDb.collection('portfolio').doc('data');
    const doc = await portfolioRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Contact message not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const contacts = data?.contacts || [];
    const contactIndex = contacts.findIndex((contact: ContactMessage) => contact.id === contactId);

    if (contactIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Contact message not found' },
        { status: 404 }
      );
    }

    // Prepare updated contact object with only allowed fields
    const allowedFields = ['isRead', 'isStarred', 'isArchived', 'replied', 'replyMessage', 'replyDate'];
    const updatedContact = {
      ...contacts[contactIndex],
      updatedAt: new Date().toISOString()
    };

    // Only update allowed fields
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        updatedContact[field] = updateData[field];
      }
    }

    // If marking as replied, ensure replyDate is set
    if (updateData.replied && updateData.replyMessage) {
      updatedContact.replyDate = updateData.replyDate || new Date().toISOString();
    }

    // Update the contact in the array
    const updatedContacts = [...contacts];
    updatedContacts[contactIndex] = updatedContact;

    // Update the document
    await portfolioRef.set({
      ...data,
      contacts: updatedContacts,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      data: updatedContact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contact message' },
      { status: 500 }
    );
  }
}

// DELETE contact message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = id;
    
    // Get current portfolio data
    const portfolioRef = adminDb.collection('portfolio').doc('data');
    const doc = await portfolioRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Contact message not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const contacts = data?.contacts || [];
    const contactIndex = contacts.findIndex((contact: ContactMessage) => contact.id === contactId);

    if (contactIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Contact message not found' },
        { status: 404 }
      );
    }

    // Remove the contact from the array
    const updatedContacts = contacts.filter((contact: ContactMessage) => contact.id !== contactId);

    // Update the document
    await portfolioRef.set({
      ...data,
      contacts: updatedContacts,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact message' },
      { status: 500 }
    );
  }
}
