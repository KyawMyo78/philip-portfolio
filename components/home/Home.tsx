'use client';

// The public home page: a fixed 3D circuit-city scene behind dark editorial sections, with the profile photo as a holographic ID card.
// All content comes from the same server props as before (Firestore via app/page.tsx).
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useScroll, useSpring, useInView, useTransform, useReducedMotion, useMotionValue, useMotionValueEvent, useMotionTemplate, useVelocity, useAnimationFrame, animate, MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowUpRight, Download, Github, ExternalLink, Play, MapPin, Star, X, Send, Check, Mail, Phone } from 'lucide-react';
import { getSocialIcon } from '@/lib/socialIcons';
import { analytics } from '@/lib/analytics';
import IconPreview from '../IconPreview';
import { display, body, ease, arr, Reveal, TypeOnScroll, Header, SiteFooter, useSmoothScroll, navLinks } from './ui';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

type Props = {
  profile: any;
  siteSettings: any;
  skills?: any[];
  experience?: any[];
  projects?: any[];
  achievements?: any[];
};

const fmtMonth = (d?: string) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '');

// Big section title that slides sideways as it scrolls through the viewport.
function SectionHead({ n, label, title, subtitle, className = 'mb-14 md:mb-20' }: { n: string; label: string; title: string; subtitle?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'], layoutEffect: false });
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['14%', '-8%']);
  const line = useTransform(scrollYProgress, [0.1, 0.45], ['0px', '40px']);
  return (
    <div ref={ref} className={className}>
      <Reveal>
        <div className="mb-5 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.2em] text-cream/60">
          <span>{n}</span>
          <motion.span style={{ width: line }} className="h-px bg-cream/30" />
          <span>{label}</span>
        </div>
      </Reveal>
      <div className="overflow-hidden pb-2">
        <motion.h2 style={{ x }} className="whitespace-nowrap font-display text-[clamp(44px,8vw,112px)] uppercase leading-[0.92] tracking-[-0.01em] max-sm:whitespace-normal">
          {title}
        </motion.h2>
      </div>
      {subtitle && <TypeOnScroll text={subtitle} className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/65" />}
    </div>
  );
}

// Text that lights up word by word as you scroll past it.
function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 50%'], layoutEffect: false });
  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} p={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>
      ))}
    </p>
  );
}
function Word({ p, range, children }: { p: MotionValue<number>; range: [number, number]; children: string }) {
  const opacity = useTransform(p, range, [0.15, 1]);
  return <motion.span style={{ opacity }}>{children} </motion.span>;
}

function Counter({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const c = animate(0, value, { duration: 1.6, ease, onUpdate: (v) => ref.current && (ref.current.textContent = String(Math.round(v))) });
    return () => c.stop();
  }, [inView, value]);
  return (
    <div className="border-t border-cream/15 pt-5">
      <span ref={ref} className="font-display text-6xl md:text-7xl">0</span>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cream/55">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------- hero
const SLICES = 7;

// One horizontal band of the photo. On scroll the bands slide apart sideways like a glitch, and come back when you scroll up.
function PhotoSlice({ src, i, prog, jolt, alt }: { src: string; i: number; prog: MotionValue<number>; jolt: MotionValue<number>; alt: string }) {
  const reduce = useReducedMotion();
  const dir = i % 2 ? 1 : -1;
  const shift = useTransform(prog, [0.08, 0.85], reduce ? [0, 0] : [0, dir * (18 + i * 9)]);
  const x = useTransform([shift, jolt], ([s, j]: number[]) => `${s + j * dir * (6 + ((i * 37) % 11))}%`);
  const top = (i * 100) / SLICES, bottom = 100 - ((i + 1) * 100) / SLICES;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <motion.img
      src={src}
      alt={i === 0 ? alt : ''}
      aria-hidden={i === 0 ? undefined : true}
      draggable={false}
      style={{ x, clipPath: `inset(${top}% 0 ${bottom - 0.2}% 0)` }}
      className="absolute inset-0 h-full w-full select-none object-cover"
    />
  );
}

// The profile photo as a holographic ID card: tilts toward the pointer (or a finger drag), glitches when tapped,
// reveals itself with a scan on load, and tilts back and slices apart as you scroll away.
function PortraitCard({ src, name, location, ready, prog }: { src: string; name: string; location?: string; ready: boolean; prog: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 140, damping: 16 }), sry = useSpring(ry, { stiffness: 140, damping: 16 });
  const scrollTilt = useTransform(prog, [0, 1], reduce ? [0, 0] : [0, 32]);
  const rotateX = useTransform([srx, scrollTilt], ([a, b]: number[]) => a + b);
  const scale = useTransform(prog, [0, 1], reduce ? [1, 1] : [1, 0.8]);
  const y = useTransform(prog, [0, 1], reduce ? [0, 0] : [0, -60]);
  const fade = useTransform(prog, [0.55, 0.95], [1, 0]);
  const glareX = useMotionValue(50), glareY = useMotionValue(30);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,.28), transparent 55%)`;
  const jolt = useMotionValue(0);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 18);
    rx.set(-py * 18);
    glareX.set((px + 0.5) * 100);
    glareY.set((py + 0.5) * 100);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };
  const onTap = () => {
    if (reduce) return;
    jolt.set(1);
    animate(jolt, 0, { duration: 0.6, ease: 'easeOut' });
  };

  return (
    <motion.div style={{ y, scale, opacity: fade, rotateX, rotateY: sry, transformPerspective: 1100 }} className="pointer-events-auto relative">
      <div className="relative">
      {/* viewfinder corners */}
      {['left-0 top-0 border-l border-t', 'right-0 top-0 border-r border-t', 'left-0 bottom-0 border-l border-b', 'right-0 bottom-0 border-r border-b'].map((c) => (
        <motion.span key={c} initial={{ opacity: 0, scale: 1.3 }} animate={ready ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.8, delay: 0.2, ease }} className={`absolute h-6 w-6 border-volt ${c}`} />
      ))}
      <div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerDown={onTap}
        data-no-ripple
        className="relative m-3 aspect-[4/5] w-[min(56vw,30svh)] touch-pan-y overflow-hidden rounded-[22px] border border-volt/30 bg-ink shadow-[0_30px_80px_rgba(0,0,0,.6),0_0_60px_rgba(56,200,255,.15)] md:w-[min(30vw,52svh,400px)]"
      >
        {/* scan reveal on load */}
        <motion.div initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={ready ? { clipPath: 'inset(0 0 0% 0)' } : {}} transition={{ duration: 1.4, delay: 0.3, ease }} className="absolute inset-0">
          {Array.from({ length: SLICES }, (_, i) => <PhotoSlice key={i} i={i} src={src} prog={prog} jolt={jolt} alt={name} />)}
          {/* blue tint washes out to full colour */}
          <motion.div initial={{ opacity: 0.85 }} animate={ready ? { opacity: 0 } : {}} transition={{ duration: 1.6, delay: 1.2 }} className="absolute inset-0 bg-volt mix-blend-color" />
        </motion.div>
        <motion.div initial={{ top: '0%' }} animate={ready ? { top: '100%' } : {}} transition={{ duration: 1.4, delay: 0.3, ease }} className="absolute inset-x-0 h-px bg-volt shadow-[0_0_18px_4px_rgba(56,200,255,.7)]" />
        {/* slow scanning band + fine scanlines */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 animate-scan bg-gradient-to-b from-transparent via-volt/15 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,.18)_0px,rgba(0,0,0,.18)_1px,transparent_1px,transparent_3px)]" />
        <motion.div style={{ background: glare }} className="pointer-events-none absolute inset-0 mix-blend-overlay" />
        {/* ID strip */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink/90 to-transparent px-4 pb-3 pt-10 font-mono text-[10px] uppercase tracking-[0.18em] text-cream/80">
          <span className="truncate">{name}</span>
          <span className="flex shrink-0 items-center gap-1.5 text-volt"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-volt" />Online</span>
        </div>
      </div>
      </div>
      {location && <p className="mx-3 mt-1 flex items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.12em] text-cream/85 md:justify-start"><MapPin size={13} className="text-volt" />{location}</p>}
    </motion.div>
  );
}

function Hero({ p, s, ready }: { p: any; s: any; ready: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const socials = arr(p?.socialLinks);
  const greeting = s?.hero?.greetingText ?? p?.greetingText;
  const name: string = p?.name || 'Your Name';

  // as you scroll away, the words lift and fade, and the name's letters spread apart
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'], layoutEffect: false });
  const heroY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -140]);
  const heroFade = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const spread = useTransform(scrollYProgress, [0, 1], reduce ? ['-0.012em', '-0.012em'] : ['-0.012em', '0.12em']);

  return (
    <section id="home" ref={ref} className="relative h-[100svh] min-h-[620px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent md:bg-gradient-to-r md:from-ink/75 md:via-ink/25" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2.5svh] px-5 pb-14 pt-20 md:flex-row md:justify-between md:gap-10 md:px-11 md:pb-0 md:pt-0">
        <motion.div style={{ y: heroY, opacity: heroFade }} className="pointer-events-none order-2 text-center md:order-1 md:max-w-[56%] md:text-left">
          {greeting && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-volt md:mb-4">
              {greeting}
            </motion.p>
          )}
          {/* every letter rises into place when the page is ready */}
          <motion.h1 style={{ letterSpacing: spread }} aria-label={name} className="font-display text-[clamp(46px,min(13vw,8svh),168px)] uppercase leading-[0.88] md:text-[clamp(64px,min(8.2vw,18svh),168px)]">
            {name.split(' ').map((word, w) => (
              <span key={w} className="inline-block overflow-hidden pb-[0.04em] align-bottom">
                {word.split('').map((ch, i) => (
                  <motion.span key={i} aria-hidden="true" className="inline-block" initial={{ y: '110%' }} animate={ready ? { y: '0%' } : {}} transition={{ duration: 0.9, delay: 0.5 + (w * 4 + i) * 0.035, ease }}>
                    {ch}
                  </motion.span>
                ))}
                {w < name.split(' ').length - 1 && <span className="inline-block w-[0.25em]" />}
              </span>
            ))}
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ duration: 1, delay: 1.1 }}>
            <p className="mt-[min(1.5rem,2.5svh)] max-w-xl text-base leading-snug text-cream/85 md:text-xl">
              {p?.title}
              {p?.specialization && <><br /><span className="text-cream/55">{p.specialization}</span></>}
            </p>
            <div className="pointer-events-auto mt-[min(2rem,3.5svh)] flex items-center justify-center gap-3 md:justify-start">
              <a href="#projects" aria-label="See my work" className="grid h-[52px] w-[52px] place-items-center rounded-full border-[1.5px] border-cream transition-colors duration-300 hover:bg-cream hover:text-ink md:h-[56px] md:w-[56px]">
                <ArrowRight size={22} strokeWidth={1.6} />
              </a>
              {p?.cvUrl && (
                <a href={p.cvUrl} target="_blank" rel="noreferrer" className="inline-flex h-[52px] items-center gap-2 whitespace-nowrap rounded-full border border-cream/25 px-6 text-sm font-medium transition-colors hover:border-cream md:h-[56px]">
                  <Download size={16} /> {s?.hero?.cvButtonText || p?.cvButtonText || 'Download CV'}
                </a>
              )}
              {socials.map((l: any) => {
                const Icon = getSocialIcon(l.icon)?.icon || Mail;
                return (
                  <a key={l.id || l.url} href={l.url} target="_blank" rel="noopener noreferrer" title={l.name} aria-label={l.name} className="hidden h-11 w-11 place-items-center rounded-full text-cream/70 transition hover:bg-cream/10 hover:text-cream sm:grid">
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
        {p?.profileImage && (
          <div className="order-1 md:order-2">
            <PortraitCard src={p.profileImage} name={name} location={p?.location} ready={ready} prog={scrollYProgress} />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-5 left-0 right-0 flex items-center justify-center gap-4 text-[11px] font-medium uppercase tracking-[0.18em] text-cream/60 md:bottom-10 md:justify-between md:px-11">
        <span className="hidden md:inline">Tap the city · tilt the card</span>
        <span className="animate-pulse">Scroll to explore</span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- about
function About({ p, s, stats }: { p: any; s: any; stats: { value: number; label: string }[] }) {
  const description: string = p?.aboutDescription || p?.description || '';
  const interests = arr(p?.interests);
  return (
    <section id="about" className="px-5 py-28 md:px-11 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <SectionHead n="01" label="About" title={s?.about?.sectionTitle || 'About me'} subtitle={s?.about?.sectionSubtitle} />
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {p?.subtitle && <TypeOnScroll text={p.subtitle} offset={['start 85%', 'end 45%']} className="mb-10 text-3xl font-medium leading-tight tracking-tight md:text-[42px]" />}
            {description.split('\n\n').map((para, i) => (
              <ScrollWords key={i} text={para} className="mb-5 text-lg leading-relaxed text-cream/80" />
            ))}
            <Reveal className="mt-10 flex flex-wrap items-center gap-6">
              {p?.cvUrl && (
                <a href={p.cvUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-cream px-6 text-sm font-semibold text-ink transition-transform hover:-translate-y-px">
                  <Download size={16} /> Resume
                </a>
              )}
              {p?.location && <span className="flex items-center gap-2 text-sm text-cream/60"><MapPin size={15} />{p.location}</span>}
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              {stats.map((st) => <Counter key={st.label} {...st} />)}
            </div>
            {interests.length > 0 && (
              <div className="mt-14 flex flex-wrap gap-3">
                {interests.map((it: any) => (
                  <span key={it.label} title={it.description} className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-4 py-2 text-sm text-cream/80 transition-colors hover:border-cream/40">
                    {typeof it.icon === 'string' && <IconPreview name={it.icon} className="h-4 w-4" />}
                    {it.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- skills
const levelName = (sk: any): string => {
  const l = sk.level;
  if (typeof l === 'string' && l && isNaN(Number(l))) return l;
  const n = typeof sk.proficiency === 'number' ? sk.proficiency : Number(l);
  if (!n) return '';
  const pct = n <= 5 ? n * 20 : n;
  return pct >= 90 ? 'Expert' : pct >= 75 ? 'Advanced' : pct >= 55 ? 'Intermediate' : 'Learning';
};

const levelDots = (sk: any): number => {
  const n = typeof sk.proficiency === 'number' ? sk.proficiency : Number(sk.level);
  if (n) return Math.max(1, Math.min(5, Math.round(n <= 5 ? n : n / 20)));
  const l = String(sk.level || '').toLowerCase();
  return l.includes('expert') ? 5 : l.includes('advanced') ? 4 : l.includes('intermediate') ? 3 : l ? 2 : 0;
};
const wrap = (min: number, max: number, v: number) => ((((v - min) % (max - min)) + (max - min)) % (max - min)) + min;

// Endless ribbon of skill names; scrolling speeds it up and scrolling up reverses it.
function Marquee({ items, dir, outline }: { items: string[]; dir: 1 | -1; outline?: boolean }) {
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-1000, 0, 1000], [-5, 0, 5], { clamp: false });
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`);
  const heading = useRef<number>(dir);
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < 0) heading.current = -dir;
    else if (b > 0) heading.current = dir;
    base.set(base.get() - heading.current * 1.6 * (delta / 1000) * (1 + Math.abs(b)));
  });
  // repeat short lists so one copy is always wider than the screen
  const row = Array.from({ length: Math.ceil(10 / Math.max(items.length, 1)) }, () => items).flat();
  return (
    <div className="overflow-hidden whitespace-nowrap py-1" aria-hidden="true">
      <motion.div style={{ x }} className="flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {row.map((name, i) => (
              <span key={i} className="flex items-center font-display text-[clamp(52px,9vw,150px)] uppercase leading-none">
                <span className={outline ? 'text-transparent [-webkit-text-stroke:1px_rgba(245,239,226,.45)]' : ''}>{name}</span>
                <span className="mx-[0.4em] h-[0.12em] w-[0.12em] shrink-0 rounded-full bg-volt" />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function Skills({ skills, s }: { skills: any[]; s: any }) {
  const sorted = [...skills].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (a.order ?? 0) - (b.order ?? 0));
  const cats = Array.from(new Set(sorted.map((k) => k.category || 'other')));
  const [cat, setCat] = useState('all');
  const shown = sorted.filter((k) => cat === 'all' || (k.category || 'other') === cat);
  if (!skills.length) return null;
  const names = sorted.map((k) => k.name);
  const half = Math.ceil(names.length / 2);
  const years = Math.max(0, ...skills.map((k) => Number(k.yearsOfExperience) || 0));
  const count = (c: string) => (c === 'all' ? skills.length : skills.filter((k) => (k.category || 'other') === c).length);

  return (
    <section id="skills" className="py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-11">
        <SectionHead n="02" label="Toolkit" title={s?.skills?.sectionTitle || 'Skills'} subtitle={s?.skills?.sectionSubtitle} />
      </div>

      <div className="my-10 overflow-hidden py-6 md:my-16">
        <div className="-mx-4 -rotate-[1.5deg]">
          <Marquee items={names.slice(0, half)} dir={1} />
          <Marquee items={names.slice(half).length ? names.slice(half) : names} dir={-1} outline />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 md:px-11 lg:grid-cols-12 lg:gap-16">
        {/* category index: sticky on desktop, a swipeable row on phones */}
        <aside className="min-w-0 lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-cream/50">Browse by area</p>
            <div className="-mx-5 flex gap-6 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
              {['all', ...cats].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`flex shrink-0 items-start gap-2 text-left font-display text-3xl uppercase leading-[1.05] transition-opacity md:text-5xl ${cat === c ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}
                >
                  <span>{c === 'all' ? 'Everything' : c.replace('-', ' ')}</span>
                  <sup className="mt-2 font-body text-xs tracking-normal">{String(count(c)).padStart(2, '0')}</sup>
                  {cat === c && <motion.span layoutId="skill-cat" className="mt-4 hidden h-2 w-2 rounded-full bg-volt lg:block" />}
                </button>
              ))}
            </div>
            <div className="mt-10 hidden gap-10 border-t border-cream/10 pt-6 lg:flex">
              <div><p className="font-display text-5xl">{skills.length}</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-cream/50">Technologies</p></div>
              {years > 0 && <div><p className="font-display text-5xl">{years}+</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-cream/50">Years coding</p></div>}
            </div>
          </div>
        </aside>

        {/* skill rows: hovering a row floods it with cream */}
        <motion.ul key={cat} className="min-w-0 lg:col-span-8" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
          {shown.map((k, i) => {
            const dots = levelDots(k);
            return (
              <motion.li
                key={k.id}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
                className="group relative overflow-hidden border-t border-cream/10 last:border-b"
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-cream transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-y-100" />
                <div className="relative grid grid-cols-[2rem_1fr_auto] items-center gap-4 px-1 py-5 transition-colors duration-300 group-hover:text-ink md:grid-cols-[3rem_2.5rem_1fr_auto] md:gap-6 md:px-4 md:py-7">
                  <span className="text-xs text-cream/40 transition-colors group-hover:text-ink/50">{String(i + 1).padStart(2, '0')}</span>
                  <span className="hidden opacity-60 md:block">{k.icon && <IconPreview name={k.icon} className="h-6 w-6" />}</span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-3 font-display text-3xl uppercase leading-none transition-transform duration-500 group-hover:translate-x-2 md:text-5xl">
                      <span className="truncate">{k.name}</span>
                      {k.featured && <Star size={14} className="shrink-0 fill-current text-[#e0a84a]" />}
                    </p>
                    {k.description && <p className="mt-2 text-sm text-cream/55 group-hover:text-ink/70">{k.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {dots > 0 && (
                      <div className="flex gap-1" aria-label={`${dots} of 5`}>
                        {[1, 2, 3, 4, 5].map((d) => (
                          <span key={d} className={`h-1.5 w-4 rounded-full bg-current md:w-6 ${d <= dots ? '' : 'opacity-15'}`} />
                        ))}
                      </div>
                    )}
                    <span className="text-[11px] uppercase tracking-[0.14em] text-cream/50 group-hover:text-ink/60">
                      {[levelName(k), k.yearsOfExperience ? `${k.yearsOfExperience} yr${k.yearsOfExperience !== 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- pinned sideways scroller
// The section stays pinned while you scroll down; its cards travel sideways instead.
function HorizontalPin({ id, head, backdrop, children }: { id: string; head: React.ReactNode; backdrop?: (p: MotionValue<number>) => React.ReactNode; children: React.ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [dist, setDist] = useState(0);
  useEffect(() => {
    const measure = () => track.current && setDist(Math.max(0, track.current.scrollWidth - window.innerWidth));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'], layoutEffect: false });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const pinned = !reduce && dist > 0;
  return (
    <section id={id} ref={section} style={pinned ? { height: `calc(100svh + ${dist}px)` } : undefined} className="relative">
      <div className={pinned ? 'sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-16' : 'py-28 md:py-40'}>
        {backdrop && pinned && backdrop(scrollYProgress)}
        <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-11">{head}</div>
        <motion.div ref={track} style={pinned ? { x } : undefined} className={`relative flex gap-5 px-5 pb-6 md:px-11 ${pinned ? 'w-max' : 'overflow-x-auto'}`}>
          {children}
        </motion.div>
        {pinned && (
          <div className="relative mx-5 mt-4 h-px bg-cream/10 md:mx-11">
            <motion.div style={{ scaleX: scrollYProgress }} className="h-px origin-left bg-volt" />
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- experience
// Roles slide past like train cars; a giant year in the background changes as each one passes.
function Experience({ items, s }: { items: any[]; s: any }) {
  if (!items.length) return null;
  const years = items.map((e) => (e.startDate ? String(new Date(e.startDate).getFullYear()) : ''));
  return (
    <HorizontalPin
      id="experience"
      head={<SectionHead n="03" label="Journey" title={s?.experience?.sectionTitle || 'Experience'} subtitle={s?.experience?.sectionSubtitle} className="mb-8 md:mb-12" />}
      backdrop={(prog) => <YearBackdrop prog={prog} years={years} />}
    >
      {items.map((e) => (
        <article key={e.id} className="flex max-h-[calc(100svh-15rem)] w-[300px] shrink-0 flex-col overflow-hidden rounded-3xl [&>*]:shrink-0 border border-cream/10 bg-ink/80 p-6 backdrop-blur md:w-[460px] md:p-8">
          <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-cream/55">
            <span>{fmtMonth(e.startDate)} — {e.current || !e.endDate ? 'Present' : fmtMonth(e.endDate)}</span>
            {e.current && <span className="flex items-center gap-1.5 text-volt"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-volt" />Now</span>}
          </div>
          <h3 className="font-display text-3xl uppercase leading-none md:text-5xl">{e.title}</h3>
          <p className="mt-3 text-cream/80">
            {e.companyUrl ? (
              <a href={e.companyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">{e.company} <ArrowUpRight size={15} /></a>
            ) : e.company}
            {e.location && <span className="text-cream/45"> · {e.location}</span>}
          </p>
          {e.description && <p className="mt-5 line-clamp-4 text-sm leading-relaxed text-cream/65">{e.description}</p>}
          {arr(e.achievements).length > 0 && (
            <ul className="mt-4 space-y-2">
              {arr(e.achievements).slice(0, 3).map((a: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-cream/80"><Check size={14} className="mt-0.5 shrink-0 text-volt" />{a}</li>
              ))}
            </ul>
          )}
          {arr(e.technologies).length > 0 && (
            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              {arr(e.technologies).map((t: string) => <span key={t} className="rounded-full border border-cream/15 px-3 py-1 text-xs text-cream/70">{t}</span>)}
            </div>
          )}
        </article>
      ))}
    </HorizontalPin>
  );
}

function YearBackdrop({ prog, years }: { prog: MotionValue<number>; years: string[] }) {
  const year = useTransform(prog, (v) => years[Math.min(years.length - 1, Math.floor(v * years.length))] || '');
  return (
    <motion.span aria-hidden="true" className="pointer-events-none absolute bottom-[4svh] right-4 select-none font-display text-[clamp(140px,30vw,420px)] leading-none text-transparent [-webkit-text-stroke:1px_rgba(56,200,255,.25)] md:right-11">
      {year}
    </motion.span>
  );
}

// ---------------------------------------------------------------- projects
const catLabel: Record<string, string> = { web: 'Web', mobile: 'Mobile', embedded: 'Embedded', ai: 'AI & Robotics', other: 'Other' };

const projectLink = (p: any, url: string, kind: 'github' | 'live' | 'demo', Icon: any, label: string) => (
  <a key={kind} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.stopPropagation(); analytics.projectLinkClick(p.title, kind); }} className="inline-flex h-11 items-center gap-2 rounded-full border border-cream/20 px-5 text-sm transition-colors hover:border-cream hover:bg-cream hover:text-ink">
    <Icon size={15} /> {label}
  </a>
);
type Labels = { live: string; code: string; open: string };
const projectLinks = (p: any, t: Labels) => [
  p.liveUrl && projectLink(p, p.liveUrl, 'live', ExternalLink, t.live),
  p.githubUrl && projectLink(p, p.githubUrl, 'github', Github, t.code),
  p.downloadUrl && projectLink(p, p.downloadUrl, 'demo', Play, 'Demo'),
];

// Each card pins to the screen; the next one slides up over it while the previous shrinks back.
function ProjectCard({ p, i, n, prog, onOpen, t }: { p: any; i: number; n: number; prog: MotionValue<number>; onOpen: () => void; t: Labels }) {
  const reduce = useReducedMotion();
  const scale = useTransform(prog, [i / n, 1], reduce ? [1, 1] : [1, 1 - (n - i) * 0.045]);
  const shade = useTransform(prog, [i / n, Math.min(1, (i + 1) / n)], [0, i === n - 1 ? 0 : 0.55]);
  const img = arr(p.images)[0];
  return (
    <div className="sticky top-0 flex h-[100svh] items-center justify-center px-5 md:px-11" style={{ paddingTop: `calc(5.5rem + ${i * 14}px)` }}>
      <motion.article
        style={{ scale }}
        onClick={onOpen}
        className="group relative grid h-[min(76svh,640px)] w-full max-w-[1300px] origin-top cursor-pointer grid-rows-[42%_1fr] overflow-hidden rounded-[28px] border border-cream/10 bg-[#091018] shadow-[0_-20px_60px_rgba(0,0,0,.5)] md:grid-cols-[1.25fr_1fr] md:grid-rows-1"
      >
        <div className="relative overflow-hidden bg-cream/5">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={p.title} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center font-display text-[120px] text-cream/10">{String(i + 1).padStart(2, '0')}</div>
          )}
          {p.status && <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-[11px] uppercase tracking-[0.14em] backdrop-blur">{String(p.status).replace('-', ' ')}</span>}
        </div>
        <div className="flex min-h-0 flex-col p-6 md:p-10">
          <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-cream/50">
            <span className="text-volt">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            {p.featured && <span className="rounded-full bg-cream/10 px-2 py-0.5 text-cream/80">Featured</span>}
            {p.startDate && <span>{new Date(p.startDate).getFullYear()}</span>}
          </div>
          <h3 className="line-clamp-3 font-display text-3xl uppercase leading-[0.95] md:text-[clamp(2.25rem,3.6vw,3.75rem)]">{p.title}</h3>
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-cream/70 md:line-clamp-5 md:text-base">{p.description}</p>
          {arr(p.technologies).length > 0 && (
            <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
              {arr(p.technologies).slice(0, 6).map((t: string) => <span key={t} className="rounded-full bg-cream/[0.07] px-3 py-1 text-xs text-cream/75">{t}</span>)}
            </div>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
            <span className="inline-flex h-11 items-center gap-2 rounded-full bg-cream px-5 text-sm font-semibold text-ink">
              {t.open} <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
            <span className="hidden md:contents">{projectLinks(p, t)}</span>
          </div>
        </div>
        <motion.div style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-ink" />
      </motion.article>
    </div>
  );
}

// Full-screen project view, opened by tapping a card.
function ProjectModal({ p, onClose, t }: { p: any; onClose: () => void; t: Labels }) {
  const images = arr(p.images);
  const [img, setImg] = useState(0);
  useEffect(() => {
    const lenis = (window as any).__lenis;
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${display.variable} ${body.variable} v2 fixed inset-0 z-[80] overflow-y-auto bg-ink/90 font-body text-cream backdrop-blur-xl`}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.6, ease }}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto max-w-[1100px] px-5 py-20 md:px-11"
      >
        <div className="sticky top-5 z-10 -mt-14 mb-2 flex justify-end">
          <button onClick={onClose} aria-label="Close" className="grid h-12 w-12 place-items-center rounded-full bg-cream text-ink shadow-lg">
            <X size={20} />
          </button>
        </div>
        {images[img] && (
          // eslint-disable-next-line @next/next/no-img-element
          <motion.img key={images[img]} src={images[img]} alt={p.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-[16/10] w-full rounded-3xl object-cover" />
        )}
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((src: string, k: number) => (
              <button key={src + k} onClick={() => setImg(k)} aria-label={`Image ${k + 1}`} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition ${k === img ? 'border-cream' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <h2 className="mt-10 font-display text-5xl uppercase leading-[0.95] md:text-7xl">{p.title}</h2>
        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-cream/75">{p.longDescription || p.description}</p>
        {arr(p.highlights).length > 0 && (
          <ul className="mt-8 space-y-3">
            {arr(p.highlights).map((h: string, k: number) => <li key={k} className="flex gap-3 text-cream/80"><Check size={16} className="mt-1 shrink-0 text-volt" />{h}</li>)}
          </ul>
        )}
        {arr(p.technologies).length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {arr(p.technologies).map((t: string) => <span key={t} className="rounded-full bg-cream/[0.07] px-3 py-1 text-sm text-cream/80">{t}</span>)}
          </div>
        )}
        <div className="mt-10 flex flex-wrap gap-3">{projectLinks(p, t)}</div>
      </motion.div>
    </motion.div>
  );
}

function Projects({ projects, s }: { projects: any[]; s: any }) {
  const cats = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState<any>(null);
  const stack = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stack, offset: ['start start', 'end end'], layoutEffect: false });
  const shown = projects
    .filter((p) => cat === 'all' || p.category === cat)
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  const t: Labels = { live: s?.projects?.liveDemoText || 'Live site', code: s?.projects?.githubLinkText || 'Code', open: s?.projects?.viewProjectText || 'Open project' };
  if (!projects.length) return null;
  return (
    <section id="projects" className="py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-11">
        <SectionHead n="04" label="Selected work" title={s?.projects?.sectionTitle || 'Projects'} subtitle={s?.projects?.sectionSubtitle} className="mb-8 md:mb-12" />
        {cats.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {['all', ...cats].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${cat === c ? 'bg-cream text-ink' : 'border border-cream/15 text-cream/70 hover:border-cream/40'}`}>
                {c === 'all' ? 'All' : catLabel[c] || c} <span className="opacity-50">{c === 'all' ? projects.length : projects.filter((p) => p.category === c).length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div ref={stack} key={cat}>
        {shown.map((p, i) => <ProjectCard key={p.id} p={p} i={i} n={shown.length} prog={scrollYProgress} onOpen={() => setOpen(p)} t={t} />)}
      </div>
      {/* rendered on <body> so it sits above the fixed header */}
      {typeof document !== 'undefined' && createPortal(<AnimatePresence>{open && <ProjectModal p={open} onClose={() => setOpen(null)} t={t} />}</AnimatePresence>, document.body)}
    </section>
  );
}

// ---------------------------------------------------------------- achievements
function Achievements({ items }: { items: any[] }) {
  if (!items.length) return null;
  const sorted = [...items].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
  return (
    <HorizontalPin id="achievements" head={<SectionHead n="05" label="Milestones" title="Achievements" className="mb-8 md:mb-12" />}>
      {sorted.map((a) => (
        <div key={a.id} className="group max-h-[calc(100svh-15rem)] w-[280px] shrink-0 overflow-hidden rounded-3xl border border-cream/10 bg-ink/80 backdrop-blur transition-colors hover:border-cream/30 md:w-[360px]">
          {a.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.image} alt={a.title} className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="grid aspect-[16/6] place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,200,255,.25),transparent_60%)]">
              <Star size={32} className="text-cream/40" />
            </div>
          )}
          <div className="p-6">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-cream/50">
              {a.date && <span>{new Date(a.date).getFullYear()}</span>}
              {a.issuer && <span>· {a.issuer}</span>}
              {a.featured && <Star size={12} className="ml-auto fill-current text-[#ffb547]" />}
            </div>
            <h3 className="text-xl font-semibold leading-snug">{a.title}</h3>
            {a.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cream/60">{a.description}</p>}
            {a.credentialUrl && (
              <a href={a.credentialUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-sm text-cream/80 hover:text-cream">
                View credential <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>
      ))}
    </HorizontalPin>
  );
}

// ---------------------------------------------------------------- contact
type Form = { name: string; email: string; phone?: string; subject: string; message: string };

function Contact({ p, s }: { p: any; s: any }) {
  const c = s?.contact || {};
  const email = c.primaryEmail || p?.email;
  const phone = c.primaryPhone || p?.phone;
  const why: string[] = Array.isArray(c.whyWorkWithMe)
    ? c.whyWorkWithMe
    : typeof c.whyWorkWithMe === 'string'
      ? c.whyWorkWithMe.split(/\r?\n/).map((x: string) => x.trim()).filter(Boolean)
      : [];
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>();

  const onSubmit = async (data: Form) => {
    setSending(true);
    analytics.contactFormSubmit();
    try {
      const res = await fetch('/api/portfolio/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const r = await res.json();
      if (r.success) {
        analytics.contactFormSuccess();
        toast.success('Message sent! I’ll get back to you soon.');
        reset();
      } else {
        analytics.contactFormError(r.error || 'API Error');
        toast.error(r.error || 'Failed to send message. Please try again.');
      }
    } catch {
      analytics.contactFormError('Network Error');
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const field = 'w-full border-b border-cream/20 bg-transparent py-4 text-lg outline-none transition-colors placeholder:text-cream/30 focus:border-cream';
  const err = (m?: string) => m && <p className="mt-1 text-sm text-[#ff9fb8]">{m}</p>;

  return (
    <section id="contact" className="relative overflow-hidden px-5 py-28 md:px-11 md:py-40">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#0e4d6e]/30 blur-[120px]" />
      <div className="relative mx-auto max-w-[1400px]">
        <SectionHead n="06" label="Contact" title={c.connectTitle || 'Let’s talk'} subtitle={c.connectIntro} />
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            {p?.profileImage && (
              <Reveal className="mb-8 flex items-center gap-4">
                <span className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.profileImage} alt="" className="h-16 w-16 rounded-full border border-volt/40 object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink bg-volt"><span className="absolute inset-0 animate-ping rounded-full bg-volt" /></span>
                </span>
                <span className="text-sm text-cream/60">{p?.name}<br /><span className="text-volt">Open to new work</span></span>
              </Reveal>
            )}
            {email && (
              <a href={`mailto:${email}`} className="group inline-flex items-center gap-3 break-all text-2xl font-medium md:text-3xl">
                {email} <ArrowUpRight className="shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </a>
            )}
            <div className="mt-8 space-y-3 text-cream/65">
              {phone && <a href={`tel:${phone}`} className="flex items-center gap-3 hover:text-cream"><Phone size={16} />{phone}</a>}
              {(c.location || p?.location) && <p className="flex items-center gap-3"><MapPin size={16} />{c.location || p.location}</p>}
              {c.responseTime && <p className="text-sm text-cream/45">Replies {c.responseTime.toLowerCase()}</p>}
            </div>
            {why.length > 0 && (
              <ul className="mt-12 space-y-3">
                {why.map((w) => <li key={w} className="flex gap-3 text-cream/75"><Check size={16} className="mt-1 shrink-0 text-volt" />{w}</li>)}
              </ul>
            )}
            {arr(p?.socialLinks).length > 0 && (
              <div className="mt-12 flex flex-wrap gap-3">
                {arr(p.socialLinks).map((l: any) => {
                  const Icon = getSocialIcon(l.icon)?.icon || Mail;
                  return (
                    <motion.a key={l.id || l.url} href={l.url} target="_blank" rel="noopener noreferrer" whileHover={{ y: -3 }} className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-4 py-2 text-sm text-cream/80 hover:border-cream/50">
                      <Icon size={15} /> {l.name}
                    </motion.a>
                  );
                })}
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2 lg:col-span-7" noValidate>
            <div className="grid gap-2 md:grid-cols-2 md:gap-8">
              <label>
                <span className="sr-only">Full name</span>
                <input className={field} placeholder="Your name *" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })} />
                {err(errors.name?.message)}
              </label>
              <label>
                <span className="sr-only">Email</span>
                <input type="email" className={field} placeholder="Email *" {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} />
                {err(errors.email?.message)}
              </label>
              <label>
                <span className="sr-only">Phone</span>
                <input type="tel" className={field} placeholder="Phone" {...register('phone')} />
              </label>
              <label>
                <span className="sr-only">Subject</span>
                <input className={field} placeholder="Subject *" {...register('subject', { required: 'Subject is required', minLength: { value: 5, message: 'Subject must be at least 5 characters' } })} />
                {err(errors.subject?.message)}
              </label>
            </div>
            <label>
              <span className="sr-only">Message</span>
              <textarea rows={5} className={`${field} resize-none`} placeholder="Tell me about your project *" {...register('message', { required: 'Message is required', minLength: { value: 20, message: 'Message must be at least 20 characters' } })} />
              {err(errors.message?.message)}
            </label>
            <button type="submit" disabled={sending} className="mt-8 inline-flex h-14 w-fit items-center gap-3 rounded-full bg-cream px-8 font-semibold text-ink transition-transform hover:-translate-y-px disabled:opacity-50">
              {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" /> : <Send size={17} />}
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- page
export default function Home({ profile, siteSettings: s, skills, experience, projects, achievements }: Props) {
  const p = profile || {};
  const [ready, setReady] = useState(false);

  useSmoothScroll();
  // never leave visitors on a black screen if the 3D scene is slow or unsupported
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 6000);
    return () => clearTimeout(t);
  }, []);
  const show = (k: string) => s?.[k]?.visible ?? true;
  const name = s?.navigation?.siteName || s?.general?.siteTitle || p.name || 'Portfolio';
  const sk = show('skills') ? arr(skills) : [];
  const ex = show('experience') ? arr(experience) : [];
  const pr = show('projects') ? arr(projects) : [];
  const ac = arr(achievements);

  const links = navLinks(s, { skills: sk.length > 0, experience: ex.length > 0, projects: pr.length > 0 });

  const stats = [
    { value: pr.length, label: 'Projects' },
    { value: ex.length, label: 'Roles' },
    { value: sk.length, label: 'Skills' },
    { value: ac.length, label: 'Achievements' },
  ].filter((x) => x.value > 0);

  return (
    <main className={`${display.variable} ${body.variable} v2 min-h-screen font-body text-cream antialiased selection:bg-cream selection:text-ink`}>
      <Scene onReady={() => setReady(true)} />
      <div className={`pointer-events-none fixed inset-0 z-[90] grid place-items-center bg-ink transition-opacity duration-1000 ${ready ? 'opacity-0' : 'opacity-100'}`}>
        <span className="h-2 w-2 animate-pulse rounded-full bg-volt" />
      </div>
      <Header s={s} name={name} links={links} />
      <div className="relative z-10">
      <Hero p={p} s={s} ready={ready} />
      {/* darker glass over the city for the reading sections */}
      <div className="bg-ink/60">
      {show('about') && <About p={p} s={s} stats={stats} />}
      <Skills skills={sk} s={s} />
      <Experience items={ex} s={s} />
      <Projects projects={pr} s={s} />
      <Achievements items={ac} />
      {show('contact') && <Contact p={p} s={s} />}
      </div>
      <SiteFooter s={s} name={p.name || name} />
      </div>
    </main>
  );
}
