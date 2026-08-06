import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getCached, setCached, clearCached } from '@/lib/server-cache';
import { isUnauthorized, requireAdmin } from '@/lib/admin-auth';

// Default site settings
const defaultSettings = {
  hero: {
    greetingText: '',
    contactButtonText: 'Get In Touch',
    cvButtonText: 'Download CV',
    cvNotAvailableText: 'CV Not Available',
    scrollIndicatorText: 'Scroll to explore'
  },
  navigation: {
    homeText: 'Home',
    aboutText: 'About',
    skillsText: 'Skills',
    experienceText: 'Experience',
    projectsText: 'Projects',
    contactText: 'Contact'
  },
  about: {
    sectionTitle: 'About Me',
    sectionSubtitle: 'Get to know me better'
    ,
    visible: true
  },
  skills: {
    sectionTitle: 'Skills & Technologies',
    sectionSubtitle: 'Technologies I work with'
    ,
    visible: true
  },
  experience: {
    sectionTitle: 'Experience',
    sectionSubtitle: 'My professional journey'
    ,
    visible: true
  },
  projects: {
    sectionTitle: 'Featured Projects',
    sectionSubtitle: 'Some of my recent work',
    viewProjectText: 'View Project',
    githubLinkText: 'GitHub',
    liveDemoText: 'Live Demo'
    ,
    visible: true
  },
  contact: {
    sectionTitle: 'Get In Touch',
    sectionSubtitle: 'Let\'s work together',
    submitButtonText: 'Send Message',
    nameFieldLabel: 'Full Name',
    emailFieldLabel: 'Email Address',
    messageFieldLabel: 'Message',
    phoneFieldLabel: 'Phone Number',
    subjectFieldLabel: 'Subject'
  },
  footer: {
    copyrightText: '© 2024 Portfolio. All rights reserved.',
    madeWithText: 'Made with ❤️ using Next.js'
  }
  ,
  // Blog visibility (top-level, not a section with many fields)
  blog: {
    visible: true
  }
};

async function getSettings() {
  try {
    const cacheKey = 'siteSettings:main';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const docRef = adminDb.collection('siteSettings').doc('main');
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      setCached(cacheKey, data, 30 * 1000);
      return data;
    } else {
      setCached(cacheKey, defaultSettings, 30 * 1000);
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error reading site settings from Firestore:', error);
    return defaultSettings;
  }
}

async function saveSettings(settings: any) {
  try {
    const docRef = adminDb.collection('siteSettings').doc('main');
    await docRef.set(settings, { merge: true });
  // Clear cache so subsequent GET returns fresh data
  clearCached('siteSettings:main');
    return true;
  } catch (error) {
    console.error('Error saving site settings to Firestore:', error);
    return false;
  }
}

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('GET /api/site-settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = requireAdmin(request);
  if (isUnauthorized(session)) return session;

  try {
    const settings = await request.json();
    const success = await saveSettings(settings);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Site settings saved successfully' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to save site settings (unknown reason)' },
        { status: 500 }
      );
    }
  } catch (error) {
  console.error('PUT /api/site-settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save site settings' },
      { status: 500 }
    );
  }
}
