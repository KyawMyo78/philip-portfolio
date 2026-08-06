import { Metadata } from 'next'
import { adminDb } from '@/lib/firebase-admin'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const doc = await adminDb.collection('siteSettings').doc('main').get();
    const siteSettings = doc.exists ? doc.data() : {};
    
    const siteName = siteSettings?.general?.siteTitle || siteSettings?.navigation?.siteName || 'Portfolio';
    const title = `Blog | ${siteName}`;
    const description = 'Latest articles and insights';

    return {
      title,
      description,
    };
  } catch (error) {
    return {
      title: 'Blog | Portfolio',
      description: 'Latest articles and insights',
    };
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
