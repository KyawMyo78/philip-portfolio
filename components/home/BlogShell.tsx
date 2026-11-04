'use client';

// Page frame for the blog: same fonts, header, footer and smooth scrolling as the home page,
// over a static circuit-grid backdrop (no 3D scene, so articles stay light and fast).
import { useEffect, useState } from 'react';
import { display, body, Header, SiteFooter, useSmoothScroll, navLinks } from './ui';

export function useSiteData() {
  const [s, setS] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    fetch('/api/site-settings').then((r) => r.json()).then((r) => r.success && setS(r.data)).catch(() => {});
    fetch('/api/profile').then((r) => r.json()).then((r) => r.success && setProfile(r.data)).catch(() => {});
  }, []);
  return { s, profile };
}

export default function BlogShell({ children }: { children: React.ReactNode }) {
  const { s, profile } = useSiteData();
  useSmoothScroll();
  const name = s?.navigation?.siteName || s?.general?.siteTitle || profile?.name || 'Portfolio';
  return (
    <main className={`${display.variable} ${body.variable} v2 relative min-h-screen bg-ink font-body text-cream antialiased selection:bg-cream selection:text-ink`}>
      {/* backdrop: soft blue glow + faint circuit grid */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,#0c2233_0%,transparent_60%)]" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:linear-gradient(#38c8ff_1px,transparent_1px),linear-gradient(90deg,#38c8ff_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_75%)]" />
      <Header s={s} name={name} links={navLinks(s)} home={false} />
      <div className="relative z-10">{children}</div>
      <div className="relative z-10">
        <SiteFooter s={s} name={profile?.name || name} />
      </div>
    </main>
  );
}
