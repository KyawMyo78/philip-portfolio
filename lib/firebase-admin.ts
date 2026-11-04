import admin from 'firebase-admin';

// Check if we're in build mode or have placeholder credentials
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const hasPlaceholderCreds = 
  process.env.FIREBASE_PROJECT_ID === 'placeholder-project' ||
  process.env.FIREBASE_CLIENT_EMAIL?.includes('placeholder') ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  process.env.FIREBASE_PRIVATE_KEY.includes('placeholder');

// Initialize Firebase Admin SDK
if (!admin.apps.length && !isBuildTime && !hasPlaceholderCreds) {
  try {
    let privateKey = '';

    // First, support a base64-encoded private key env var (safer for platforms)
    if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
        privateKey = decoded.trim();
        console.log('Using FIREBASE_PRIVATE_KEY_BASE64 for Firebase Admin initialization.');
      } catch (e) {
        console.error('Failed to decode FIREBASE_PRIVATE_KEY_BASE64:', e instanceof Error ? e.message : e);
      }
    }

    // Fallback to FIREBASE_PRIVATE_KEY if base64 not provided or decoding failed
    if (!privateKey && process.env.FIREBASE_PRIVATE_KEY) {
      // Read raw env value
      let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';

      // If key was pasted with surrounding quotes in Vercel UI, remove matching leading/trailing quotes
      if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
        rawKey = rawKey.slice(1, -1);
      }

      // Normalize escaped newlines ("\\n") into real newlines
      privateKey = rawKey.replace(/\\n/g, '\n').trim();
      console.log('Using FIREBASE_PRIVATE_KEY for Firebase Admin initialization.');
    }

    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
      console.warn('Firebase Admin initialization skipped: missing credentials.');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

  } catch (initErr: any) {
    // Log the error with extra context so Vercel logs show whether it's a key parsing/openssl issue
    console.error('Firebase Admin initialization error:', initErr && initErr.message ? initErr.message : initErr);
    // Don't throw during build - just log
    if (!isBuildTime) {
      throw initErr;
    }
  }
} else if (isBuildTime || hasPlaceholderCreds) {
  console.log('Firebase Admin initialization skipped (build time or placeholder credentials)');
}

// Create mock firestore for build time
const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => ({}),
    }),
    get: async () => ({ docs: [], forEach: () => {} }),
    where: () => mockFirestore.collection(),
    orderBy: () => mockFirestore.collection(),
    limit: () => mockFirestore.collection(),
  }),
  batch: () => ({
    set: () => {},
    delete: () => {},
    commit: async () => {},
  }),
} as any;

const mockAuth = {
  createCustomToken: async () => 'mock-token',
  verifyIdToken: async () => ({ uid: 'mock-uid' }),
} as any;

const mockStorage = {
  bucket: () => ({
    file: () => ({
      save: async () => {},
      makePublic: async () => {},
      delete: async () => {},
    }),
  }),
} as any;

// Safe exports that handle uninitialized admin
export const adminDb = admin.apps.length > 0 ? admin.firestore() : mockFirestore;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : mockAuth;
export const adminStorage = admin.apps.length > 0 ? admin.storage() : mockStorage;

export default admin;
