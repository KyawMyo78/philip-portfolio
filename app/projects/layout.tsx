import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const doc = await adminDb.collection('siteSettings').doc('main').get();
    const siteSettings = doc.exists ? doc.data() : {};
    
    const siteName = siteSettings?.general?.siteTitle || siteSettings?.navigation?.siteName || 'Portfolio';
    const title = `Projects | ${siteName}`;
    const description = `Explore the portfolio projects by ${siteName}`;

    return {
      title,
      description,
    };
  } catch (error) {
    return {
      title: 'Projects | Portfolio',
      description: 'Explore my portfolio projects',
    };
  }
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
