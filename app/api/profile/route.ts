import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getCached, setCached, clearCached } from '@/lib/server-cache';
import { isUnauthorized, requireAdmin } from '@/lib/admin-auth';

// Default profile data
const defaultProfile = {
  name: 'Your Name',
  nickname: 'Your Nickname',
  title: 'Developer',
  specialization: 'Your Specialization',
  description: 'A short bio about you. Replace this in the admin panel or via Firestore.',
  // Detailed About page description (long form)
  aboutDescription: 'A longer About description. Update this via the admin dashboard or Firestore to describe your background, projects, and motivations.',
  location: 'Your Location',
  email: 'your-email@example.com',
  github: '',
  linkedin: '',
  profileImage: '/profile.jpg',
  cvUrl: '',
  socialLinks: [],
  // New editable fields for home page
  greetingText: '',
  contactButtonText: 'Get In Touch',
  cvButtonText: 'Download CV',
  cvNotAvailableText: 'CV Not Available'
  ,
  // About section editable content
  aboutHighlights: [
    {
      id: 'h1',
      iconKey: 'graduation',
      title: 'Academic Excellence',
      description: 'Brief note about academic achievements.'
    },
  ],
  // aboutStats removed - use aboutHighlights only
};

async function getProfile() {
  try {
    const cacheKey = 'profile:main';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const docRef = adminDb.collection('profile').doc('main');
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      setCached(cacheKey, data, 10 * 1000);
      return data;
    } else {
      setCached(cacheKey, defaultProfile, 10 * 1000);
      return defaultProfile;
    }
  } catch (error) {
    console.error('Error reading profile from Firestore:', error);
    return defaultProfile;
  }
}

async function saveProfile(profileData: any) {
  try {
    const docRef = adminDb.collection('profile').doc('main');
    await docRef.set(profileData, { merge: true });
  // Clear cache so subsequent GET returns fresh data
  clearCached('profile:main');
    return true;
  } catch (error) {
    console.error('Error saving profile to Firestore:', error);
    return false;
  }
}

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json({ 
      success: true, 
      data: profile 
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = requireAdmin(request);
  if (isUnauthorized(session)) return session;

  try {
    const profileData = await request.json();
    
    const success = await saveProfile(profileData);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Profile updated successfully',
        data: profileData 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save profile' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update profile' 
    }, { status: 500 });
  }
}
