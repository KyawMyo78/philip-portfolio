'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Share2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import BlogShell from '@/components/home/BlogShell'
import { Reveal, ease, arr } from '@/components/home/ui'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string
  category: string
  tags: string[]
  publishedAt?: string
  author: string
  readTime: number
  views: number
  createdAt: string
}

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '')

export default function BlogPostPage() {
  const params = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!params.slug) return
    fetch(`/api/blog/slug/${params.slug}`)
      .then((r) => r.json())
      .then((r) => {
        if (!r.success || !r.data) return setNotFound(true)
        setPost(r.data)
        // count the view (uses the fetched count, not stale state)
        const views = (r.data.views || 0) + 1
        fetch(`/api/blog/${r.data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ views }) })
          .then(() => setPost((p) => (p ? { ...p, views } : p)))
          .catch(() => {})
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.slug])

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: post?.title, url }) // phones: native share sheet
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* user closed the share sheet, or clipboard blocked */
    }
  }

  return (
    <BlogShell>
      {loading ? (
        <div className="grid min-h-[70vh] place-items-center"><span className="h-2 w-2 animate-pulse rounded-full bg-volt" /></div>
      ) : notFound || !post ? (
        <NotFound />
      ) : (
        <Article post={post} copied={copied} onShare={share} />
      )}
    </BlogShell>
  )
}

function Article({ post, copied, onShare }: { post: BlogPost; copied: boolean; onShare: () => void }) {
  const reduce = useReducedMotion()
  const body = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLDivElement>(null)
  // reading progress across the article body
  const { scrollYProgress } = useScroll({ target: body, offset: ['start 40%', 'end 80%'], layoutEffect: false })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  // cover image zooms out as it scrolls through
  const { scrollYProgress: imgProg } = useScroll({ target: img, offset: ['start end', 'end start'], layoutEffect: false })
  const imgScale = useTransform(imgProg, [0, 1], reduce ? [1, 1] : [1.18, 1])
  const tags = arr(post.tags)
  const ShareBtn = ({ big }: { big?: boolean }) => (
    <button onClick={onShare} className={`inline-flex items-center gap-2 rounded-full border transition-colors ${big ? 'h-12 bg-cream px-6 font-semibold text-ink border-cream' : 'h-10 border-cream/25 px-4 text-sm hover:border-cream'}`}>
      {copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? 'Copied' : big ? 'Share this article' : 'Share'}
    </button>
  )

  return (
    <article>
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-volt" />

      <header className="px-5 pb-12 pt-32 md:px-11 md:pt-44">
        <div className="mx-auto max-w-[1100px]">
          <Link href="/blog" className="mb-10 inline-flex items-center gap-2 text-sm text-cream/60 transition-colors hover:text-cream">
            <ArrowLeft size={16} /> All articles
          </Link>
          <Reveal>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.16em] text-cream/50">
              {post.category && <span className="text-volt">{post.category}</span>}
              <span>{fmt(post.publishedAt || post.createdAt)}</span>
              {post.readTime > 0 && <span>· {post.readTime} min read</span>}
            </div>
          </Reveal>
          <h1 className="mt-5 font-display text-[clamp(48px,8vw,120px)] uppercase leading-[0.92]">
            {post.title.split(' ').map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.04em] align-bottom">
                <motion.span className="inline-block" initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease }}>
                  {w}&nbsp;
                </motion.span>
              </span>
            ))}
          </h1>
          {post.excerpt && (
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-3xl text-xl leading-relaxed text-cream/70">{post.excerpt}</p>
            </Reveal>
          )}
          <Reveal delay={0.3} className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cream/10 pt-6">
            <p className="text-sm text-cream/60">
              By <span className="text-cream">{post.author}</span>
              {post.views > 0 && <span> · {post.views} views</span>}
            </p>
            <ShareBtn />
          </Reveal>
        </div>
      </header>

      {post.featuredImage && (
        <div className="px-5 md:px-11">
          <motion.div
            ref={img}
            initial={{ clipPath: 'inset(10% 10% 10% 10% round 28px)', opacity: 0 }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 28px)', opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease }}
            className="mx-auto aspect-[16/9] max-w-[1300px] overflow-hidden rounded-[28px] bg-cream/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img src={post.featuredImage} alt={post.title} style={{ scale: imgScale }} className="h-full w-full object-cover" />
          </motion.div>
        </div>
      )}

      <div className="px-5 py-16 md:px-11 md:py-24">
        <div ref={body} className="mx-auto max-w-[760px]">
          <div className="rich-text-content text-lg" dangerouslySetInnerHTML={{ __html: post.content }} />

          {tags.length > 0 && (
            <div className="mt-14 flex flex-wrap gap-2 border-t border-cream/10 pt-8">
              {tags.map((t) => <span key={t} className="rounded-full border border-cream/15 px-3 py-1 text-xs text-cream/70">#{t}</span>)}
            </div>
          )}

          <Reveal className="mt-16 rounded-[28px] border border-cream/10 bg-[#091018]/90 p-8 text-center md:p-12">
            <p className="font-display text-4xl uppercase md:text-5xl">Enjoyed this?</p>
            <p className="mx-auto mt-3 max-w-md text-cream/60">Share it with someone who might find it useful.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ShareBtn big />
              <Link href="/blog" className="inline-flex h-12 items-center gap-2 rounded-full border border-cream/25 px-6 text-sm font-medium transition-colors hover:border-cream">
                <ArrowLeft size={16} /> More articles
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </article>
  )
}

function NotFound() {
  return (
    <div className="grid min-h-[80vh] place-items-center px-5 pt-24 text-center">
      <div>
        <p className="font-mono text-sm text-volt">404 · article not found</p>
        <h1 className="mt-4 font-display text-[clamp(56px,10vw,140px)] uppercase leading-[0.9]">Lost in the city</h1>
        <p className="mx-auto mt-4 max-w-md text-cream/60">This article doesn’t exist or has been moved.</p>
        <Link href="/blog" className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-cream px-6 text-sm font-semibold text-ink">
          <ArrowLeft size={16} /> Back to all articles
        </Link>
      </div>
    </div>
  )
}
