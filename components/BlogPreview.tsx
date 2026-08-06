"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt?: string | Date;
  createdAt?: string | Date;
  readTime: number;
}

export default function BlogPreview({ siteSettings }: { siteSettings?: any }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch('/api/blog');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const sorted = [...result.data].sort((a, b) => {
            const left = new Date(b.publishedAt || b.createdAt || 0).getTime();
            const right = new Date(a.publishedAt || a.createdAt || 0).getTime();
            return left - right;
          });

          setPosts(sorted.slice(0, 3));
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error('Error fetching blog preview:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const formatDate = (date?: string | Date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section id="blog" className="public-section-shell section-padding">
      <div className="container-width">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">{siteSettings?.blog?.sectionTitle || 'Latest Writing'}</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-clover mx-auto mb-6"></div>
          <p className="text-xl text-clover-700 max-w-3xl mx-auto text-center">
            {siteSettings?.blog?.sectionSubtitle || 'Short notes, essays, and updates from the workbench.'}
          </p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-56 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:bg-white/8 transition-all duration-300"
              >
                <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
                  <span className="px-3 py-1 rounded-full bg-white/8 text-slate-200 border border-white/10">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {post.readTime} min
                  </span>
                </div>

                <h3 className="text-2xl font-semibold mb-3 text-white">
                  {post.title}
                </h3>

                <p className="text-slate-300 leading-relaxed mb-6 line-clamp-4">
                  {post.excerpt}
                </p>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-cyan-300 hover:text-white transition-colors font-medium"
                >
                  Read article
                  <ArrowRight size={16} />
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
            <h3 className="text-2xl font-semibold mb-3 text-white">Blog coming soon</h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              I&apos;m still shaping the writing section. The rest of the portfolio is ready now, and this space will grow into the long-form part of the story.
            </p>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/blog" className="btn-secondary group">
            <span>View all posts</span>
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}