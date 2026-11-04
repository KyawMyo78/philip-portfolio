// Force dynamic rendering so pages are fresh on each request
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { adminDb } from '@/lib/firebase-admin'
import { getCached, setCached } from '@/lib/server-cache'
import Home from '@/components/home/Home'

// Initialize Firebase Admin SDK for server-side fetches

// shared, build-safe Firebase setup (lib/firebase-admin.ts)
const db = adminDb;

async function getProfileServer() {
  try {
    const cacheKey = 'profile:main';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const doc = await db.collection('profile').doc('main').get();
    if (doc.exists) {
      const data = doc.data();
      setCached(cacheKey, data, 10 * 1000);
      return data;
    }
  } catch (e) {
    console.error('Server getProfile error', e);
  }
  return null;
}

async function getSiteSettingsServer() {
  try {
    const cacheKey = 'siteSettings:main';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const doc = await db.collection('siteSettings').doc('main').get();
    if (doc.exists) {
      const data = doc.data();
      setCached(cacheKey, data, 30 * 1000);
      return data;
    }
  } catch (e) {
    console.error('Server getSiteSettings error', e);
  }
  return null;
}

async function getSkillsServer() {
  try {
    const cacheKey = 'skills:all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const snapshot = await db.collection('skills').orderBy('order', 'asc').get();
    const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    setCached(cacheKey, data, 10 * 1000);
    return data;
  } catch (e) {
    console.error('Server getSkills error', e);
  }
  return [];
}

async function getExperienceServer() {
  try {
    const cacheKey = 'experience:all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // The admin panel stores experience as an array on portfolio/data (same source as /api/portfolio/experience)
    const doc = await db.collection('portfolio').doc('data').get();
    const toIso = (v: any) => v?.toDate?.()?.toISOString() || v;
    const data = (doc.data()?.experience || [])
      .map((e: any, i: number) => ({ id: e.id || `exp-${i}`, ...e, startDate: toIso(e.startDate), endDate: toIso(e.endDate) }))
      .sort((a: any, b: any) =>
        (a.order ?? 0) !== (b.order ?? 0)
          ? (a.order ?? 0) - (b.order ?? 0)
          : new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    setCached(cacheKey, data, 10 * 1000);
    return data;
  } catch (e) {
    console.error('Server getExperience error', e);
  }
  return [];
}

async function getProjectsServer() {
  try {
    const cacheKey = 'projects:all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const snapshot = await db.collection('projects').orderBy('order', 'asc').get();
    const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    setCached(cacheKey, data, 10 * 1000);
    return data;
  } catch (e) {
    console.error('Server getProjects error', e);
  }
  return [];
}

async function getAchievementsServer() {
  try {
    const cacheKey = 'achievements:all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const snapshot = await db.collection('achievements').orderBy('date', 'desc').get();
    const data = snapshot.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data(),
      date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
    }));
    setCached(cacheKey, data, 10 * 1000);
    return data;
  } catch (e) {
    console.error('Server getAchievements error', e);
  }
  return [];
}

export default async function HomePage() {
  const [profile, siteSettings, skills, experience, projects, achievements] = await Promise.all([
    getProfileServer(),
    getSiteSettingsServer(),
    getSkillsServer(),
    getExperienceServer(),
    getProjectsServer(),
    getAchievementsServer(),
  ]);

  return (
    <Home 
      profile={profile} 
      siteSettings={siteSettings}
      skills={skills}
      experience={experience}
      projects={projects}
      achievements={achievements}
    />
  )
}
