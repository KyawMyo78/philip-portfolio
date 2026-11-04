import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { GoogleAnalytics } from '@next/third-parties/google'
import { adminDb } from '../lib/firebase-admin';
import { getCached, setCached } from '../lib/server-cache';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] })

const defaultMetadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.SITE_URL || 'https://example.com'),
  title: 'Portfolio',
  description: 'Portfolio website showcasing projects, skills, and contact information.',
  keywords: ['portfolio', 'developer', 'programming', 'web development'],
  authors: [{ name: 'Portfolio Owner' }],
  openGraph: {
    title: 'Portfolio',
    description: 'Portfolio website showcasing projects and skills in programming and web development.',
    url: '/',
    siteName: 'Portfolio',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg', // You'll need to add this image
        width: 1200,
        height: 630,
        alt: 'Portfolio Open Graph Image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  title: 'Portfolio',
  description: 'Portfolio website showcasing projects and skills in programming and web development.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Server-side metadata generator using Firestore site settings
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Try in-memory server cache first
    const cacheKey = 'siteSettings:main';
    let s: any = getCached(cacheKey);
    if (!s) {
      const doc = await adminDb.collection('siteSettings').doc('main').get();
      s = doc.exists ? doc.data() : {};
      // cache for 30 seconds
      setCached(cacheKey, s, 30 * 1000);
    }

    const siteTitle = s?.general?.siteTitle || defaultMetadata.title;
    const siteDescription = s?.general?.siteDescription || defaultMetadata.description;
    const siteKeywords = Array.isArray(s?.general?.siteKeywords) && s.general.siteKeywords.length > 0 ? s.general.siteKeywords : defaultMetadata.keywords;
    let defaultAuthorName: string | undefined = undefined;
    if (Array.isArray(defaultMetadata.authors)) {
      defaultAuthorName = (defaultMetadata.authors[0] as any)?.name;
    } else if (defaultMetadata.authors) {
      defaultAuthorName = (defaultMetadata.authors as any).name;
    }
    const authorName = s?.general?.authorName || defaultAuthorName;
    const ogSiteName = s?.navigation?.siteName || defaultMetadata.openGraph?.siteName;

    return {
      ...defaultMetadata,
      title: siteTitle,
      description: siteDescription,
      keywords: siteKeywords,
      authors: authorName ? [{ name: authorName }] : defaultMetadata.authors,
      openGraph: {
        ...(defaultMetadata.openGraph || {}),
        title: siteTitle,
        description: siteDescription,
        siteName: ogSiteName,
      },
      twitter: {
        ...(defaultMetadata.twitter || {}),
        title: siteTitle,
        description: siteDescription,
      },
    } as Metadata;
  } catch (error) {
    console.error('generateMetadata error:', error);
  return defaultMetadata;
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
            },
            success: {
              style: {
                background: '#059669',
              },
            },
            error: {
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
