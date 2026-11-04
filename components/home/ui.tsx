'use client';

// Pieces shared by the home page and the blog: fonts, header, footer, reveal/typing helpers and smooth scrolling.
import { Antonio, Manrope } from 'next/font/google';
import { motion, useScroll, useSpring, useReducedMotion, useMotionValueEvent } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export const display = Antonio({ subsets: ['latin'], variable: '--font-display' });
export const body = Manrope({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
export const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const arr = (v: any) => (Array.isArray(v) ? v : []);

// weighted smooth scrolling (mouse wheel / trackpad); touch keeps its native feel
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.09, anchors: true, autoRaf: true });
    (window as any).__lenis = lenis;
    return () => {
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);
}

// main nav links, respecting the visibility switches in the admin panel
export function navLinks(s: any, has: { skills?: boolean; experience?: boolean; projects?: boolean } = {}) {
  const show = (k: string) => s?.[k]?.visible ?? true;
  return [
    show('about') && { href: '#about', label: s?.navigation?.aboutText || 'About' },
    show('skills') && has.skills !== false && { href: '#skills', label: s?.navigation?.skillsText || 'Skills' },
    show('experience') && has.experience !== false && { href: '#experience', label: s?.navigation?.experienceText || 'Experience' },
    show('projects') && has.projects !== false && { href: '#projects', label: s?.navigation?.projectsText || 'Work' },
    show('blog') && { href: '/blog', label: s?.navigation?.blogText || 'Blog' },
  ].filter(Boolean) as { href: string; label: string }[];
}

export function SiteFooter({ s, name }: { s: any; name: string }) {
  const f = s?.footer || {};
  const copyright = f.copyrightYear && f.copyrightName
    ? `© ${f.copyrightYear} ${f.copyrightName} ${f.copyrightText || 'All rights reserved'}`
    : f.copyrightText || `© ${new Date().getFullYear()} ${name}`;
  return (
    <footer className="border-t border-cream/10 px-5 py-10 md:px-11">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 text-sm text-cream/50 md:flex-row">
        <span>{copyright}</span>
        <a href="#" onClick={(e) => { e.preventDefault(); (window as any).__lenis ? (window as any).__lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="uppercase tracking-[0.16em] hover:text-cream">Back to top ↑</a>
      </div>
    </footer>
  );
}

export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

// Text that types itself as you scroll down (and un-types when you scroll back up).
export function TypeOnScroll({ text, className, offset = ['start 92%', 'end 60%'] }: { text: string; className?: string; offset?: any }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const typed = useRef<HTMLSpanElement>(null);
  const rest = useRef<HTMLSpanElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset, layoutEffect: false });
  const apply = (v: number) => {
    if (!typed.current || !rest.current || !caret.current) return;
    const n = reduce ? text.length : Math.round(Math.min(1, Math.max(0, v) * 1.1) * text.length);
    typed.current.textContent = text.slice(0, n);
    rest.current.textContent = text.slice(n); // invisible, keeps the final layout so nothing jumps
    caret.current.style.opacity = n > 0 && n < text.length ? '1' : '0';
  };
  useMotionValueEvent(scrollYProgress, 'change', apply);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => apply(scrollYProgress.get()), [text]);
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span ref={typed} aria-hidden="true" />
      <span ref={caret} aria-hidden="true" className="ml-[1px] inline-block h-[0.95em] w-[0.08em] translate-y-[0.12em] animate-pulse bg-volt opacity-0" />
      <span ref={rest} aria-hidden="true" className="opacity-0">{text}</span>
    </p>
  );
}

// ---------------------------------------------------------------- header
export function Header({ s, name, links, home = true }: { s: any; name: string; links: { href: string; label: string }[]; home?: boolean }) {
  // on other pages (the blog) section links point back to the home page
  const to = (h: string) => (home || !h.startsWith('#') ? h : `/${h}`);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-50% 0px -50% 0px' }
    );
    document.querySelectorAll('main section[id]').forEach((el) => io.observe(el));
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${scrolled || open ? 'bg-ink/70 backdrop-blur-xl' : ''}`}>
      <motion.div style={{ scaleX: progress }} className="absolute inset-x-0 bottom-0 h-px origin-left bg-cream/50" />
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 md:px-11 md:py-6">
        <a href={home ? '#home' : '/'} className="text-xl font-semibold tracking-tight md:text-[26px]">{name}</a>
        <nav aria-label="Main" className="flex items-center gap-8">
          <div className="hidden items-center gap-9 text-[13px] font-medium uppercase tracking-[0.16em] lg:flex">
            {links.map((l) => (
              <a key={l.href} href={to(l.href)} className={`relative py-1 transition-opacity hover:opacity-100 ${(home ? active === l.href.slice(1) : l.href === '/blog') ? 'opacity-100' : 'opacity-60'}`}>
                {l.label}
                {(home ? active === l.href.slice(1) : l.href === '/blog') && <motion.span layoutId="nav-dot" className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-cream" />}
              </a>
            ))}
          </div>
          <a href={to('#contact')} className="inline-flex h-10 items-center rounded-full bg-cream px-5 text-[13px] font-semibold text-ink transition-transform hover:-translate-y-px md:h-[46px] md:px-6">
            {s?.navigation?.contactText || 'Let’s talk'}
          </a>
          <button className="lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>
      {open && (
        <div className="flex flex-col gap-1 px-5 pb-6 lg:hidden">
          {links.map((l) => (
            <a key={l.href} href={to(l.href)} onClick={() => setOpen(false)} className="font-display py-2 text-4xl uppercase">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
