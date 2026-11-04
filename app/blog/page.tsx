'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowUpRight, ArrowLeft } from 'lucide-react'
import BlogShell from '@/components/home/BlogShell'
import { Reveal, TypeOnScroll, ease, arr } from '@/components/home/ui'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string
  category: string
  tags: string[]
  publishedAt?: string
  createdAt: string
  author: string
  readTime: number
  featured: boolean
}

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '')

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('all')

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((r) => setPosts(r.success ? arr(r.data) : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const cats = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))
  const shown = posts.filter((p) => cat === 'all' || p.category === cat)
  const lead = shown.find((p) => p.featured) || shown[0]
  const rest = shown.filter((p) => p !== lead)

  return (
    <BlogShell>
      <section className="px-5 pb-16 pt-32 md:px-11 md:pb-24 md:pt-44">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <div className="mb-5 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.2em] text-cream/60">
              <span>Journal</span>
              <span className="h-px w-10 bg-cream/30" />
              <span>{loading ? '…' : `${posts.length} ${posts.length === 1 ? 'article' : 'articles'}`}</span>
            </div>
          </Reveal>
          <h1 className="overflow-hidden pb-2 font-display text-[clamp(64px,14vw,200px)] uppercase leading-[0.88]">
            {'Writing'.split('').map((ch, i) => (
              <motion.span key={i} className="inline-block" initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 0.9, delay: 0.1 + i * 0.04, ease }}>
                {ch}
              </motion.span>
            ))}
          </h1>
          <TypeOnScroll text="Notes, tutorials and things I learned while building." offset={['start 100%', 'end 70%']} className="mt-6 max-w-2xl text-lg text-cream/70 md:text-xl" />

          {cats.length > 1 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {['all', ...cats].map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${cat === c ? 'bg-cream text-ink' : 'border border-cream/15 text-cream/70 hover:border-cream/40'}`}>
                  {c === 'all' ? 'All' : c} <span className="opacity-50">{c === 'all' ? posts.length : posts.filter((p) => p.category === c).length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-5 pb-28 md:px-11 md:pb-40">
        <div className="mx-auto max-w-[1400px]">
          {loading ? (
            <div className="grid place-items-center py-24"><span className="h-2 w-2 animate-pulse rounded-full bg-volt" /></div>
          ) : !lead ? (
            <Empty />
          ) : (
            <>
              <LeadPost post={lead} />
              {rest.length > 0 && <PostList posts={rest} />}
            </>
          )}
        </div>
      </section>
    </BlogShell>
  )
}

// The newest (or featured) article as a big card
function LeadPost({ post }: { post: BlogPost }) {
  return (
    <Reveal>
      <Link href={`/blog/${post.slug}`} className="group grid overflow-hidden rounded-[28px] border border-cream/10 bg-[#091018]/90 transition-colors hover:border-cream/30 md:grid-cols-[1.3fr_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden bg-cream/5 md:aspect-auto md:min-h-[420px]">
          {post.featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.featuredImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,200,255,.25),transparent_60%)] font-display text-[140px] text-cream/10">01</div>
          )}
          {post.featured && <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-[11px] uppercase tracking-[0.14em] backdrop-blur">Featured</span>}
        </div>
        <div className="flex flex-col p-6 md:p-10">
          <Meta post={post} />
          <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] md:text-6xl">{post.title}</h2>
          {post.excerpt && <p className="mt-5 line-clamp-4 leading-relaxed text-cream/70">{post.excerpt}</p>}
          <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-volt">
            Read article <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </Reveal>
  )
}

function Meta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.16em] text-cream/50">
      {post.category && <span className="text-volt">{post.category}</span>}
      <span>{fmt(post.publishedAt || post.createdAt)}</span>
      {post.readTime > 0 && <span>· {post.readTime} min read</span>}
    </div>
  )
}

// Editorial list; on desktop the post's image floats beside the cursor while you hover a row
function PostList({ posts }: { posts: BlogPost[] }) {
  const [hover, setHover] = useState<BlogPost | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 24 }), sy = useSpring(y, { stiffness: 220, damping: 24 })
  const onMove = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    x.set(e.clientX - r.left)
    y.set(e.clientY - r.top)
  }
  return (
    <div ref={box} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="relative mt-16 md:mt-24">
      <p className="mb-6 text-xs uppercase tracking-[0.2em] text-cream/50">More articles</p>
      <ul>
        {posts.map((p, i) => (
          <motion.li key={p.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay: (i % 6) * 0.05, ease }} className="border-t border-cream/10 last:border-b">
            <Link href={`/blog/${p.slug}`} onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(p)} className="group relative grid grid-cols-[1fr_auto] items-center gap-4 overflow-hidden py-6 md:grid-cols-[9rem_1fr_auto] md:gap-8 md:py-8">
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-cream transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-y-100" />
              <span className="relative hidden text-xs uppercase tracking-[0.14em] text-cream/50 transition-colors group-hover:text-ink/60 md:block md:pl-4">{fmt(p.publishedAt || p.createdAt)}</span>
              <span className="relative min-w-0 transition-colors group-hover:text-ink">
                <span className="block font-display text-3xl uppercase leading-none transition-transform duration-500 group-hover:translate-x-2 md:text-5xl">{p.title}</span>
                <span className="mt-2 block text-xs uppercase tracking-[0.14em] text-cream/50 group-hover:text-ink/60 md:hidden">{fmt(p.publishedAt || p.createdAt)}{p.readTime ? ` · ${p.readTime} min` : ''}</span>
              </span>
              <span className="relative flex items-center gap-4 md:pr-4">
                {/* phones get a small thumbnail instead of the floating preview */}
                {p.featuredImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.featuredImage} alt="" className="h-14 w-14 rounded-xl object-cover md:hidden" />
                )}
                <span className="hidden text-xs uppercase tracking-[0.14em] text-volt transition-colors group-hover:text-ink md:block">{p.category}</span>
                <ArrowUpRight size={22} className="hidden shrink-0 transition-colors group-hover:text-ink md:block" />
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
      <AnimatePresence>
        {hover?.featuredImage && (
          <motion.div
            key={hover.id}
            style={{ x: sx, y: sy }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hover.featuredImage} alt="" className="ml-8 h-48 w-72 -translate-y-1/2 rounded-2xl object-cover shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Empty() {
  return (
    <Reveal className="rounded-[28px] border border-dashed border-cream/15 px-6 py-20 text-center md:py-28">
      <p className="font-mono text-sm text-volt">&gt; ls ./articles<span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-volt" /></p>
      <h2 className="mt-6 font-display text-5xl uppercase md:text-7xl">Nothing published yet</h2>
      <p className="mx-auto mt-4 max-w-md text-cream/60">The first articles are on their way. Check back soon.</p>
      <Link href="/" className="mt-10 inline-flex h-12 items-center gap-2 rounded-full border border-cream/25 px-6 text-sm font-medium transition-colors hover:border-cream">
        <ArrowLeft size={16} /> Back to home
      </Link>
    </Reveal>
  )
}
