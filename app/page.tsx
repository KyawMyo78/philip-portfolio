// Force dynamic rendering so pages are fresh on each request
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import IconScroller from '@/components/IconScroller'
import About from '@/components/About'
import Skills from '@/components/Skills'
import Experience from '@/components/Experience'
import Projects from '@/components/Projects'
import BlogPreview from '@/components/BlogPreview'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import { adminDb } from '@/lib/firebase-admin'
import { getCached, setCached } from '@/lib/server-cache'

async function getProfileServer() {
  try {
    const cacheKey = 'profile:main';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const doc = await adminDb.collection('profile').doc('main').get();
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

    const doc = await adminDb.collection('siteSettings').doc('main').get();
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

export default async function HomePage() {
  const [profile, siteSettings] = await Promise.all([
    getProfileServer(),
    getSiteSettingsServer(),
  ]);

  return (
    <main className="public-shell min-h-screen">
      <Navigation siteSettings={siteSettings} />
      <Hero profile={profile} siteSettings={siteSettings} />
      <IconScroller profile={profile} siteSettings={siteSettings} />
      <About profile={profile} />
      <Skills />
      <Experience />
      <Projects />
      {siteSettings?.blog?.visible !== false && (
        <BlogPreview siteSettings={siteSettings} />
      )}
      <Contact />
      <Footer profile={profile} siteSettings={siteSettings} />
    </main>
  )
}
