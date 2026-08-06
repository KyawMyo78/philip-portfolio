'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getCachedData, CACHE_KEYS } from '@/hooks/useDataPrefetch'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: Date
  author: string
  readTime: number
  views: number
  featured: boolean
  createdAt: Date
  updatedAt?: Date
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [siteSettings, setSiteSettings] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    fetchPosts()
    
    // Fetch settings and profile from cache or API
    const cachedSettings = getCachedData(CACHE_KEYS.SITE_SETTINGS);
    const cachedProfile = getCachedData(CACHE_KEYS.PROFILE);
    
    if (cachedSettings) setSiteSettings(cachedSettings);
    if (cachedProfile) setProfile(cachedProfile);

    if (!cachedSettings) {
      fetch('/api/site-settings')
        .then(res => res.json())
        .then(result => {
          if (result.success) setSiteSettings(result.data);
        })
        .catch(err => console.error('Error fetching site settings:', err));
    }

    if (!cachedProfile) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(result => {
          if (result.success) setProfile(result.data);
        })
        .catch(err => console.error('Error fetching profile:', err));
    }
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog')
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setPosts(result.data)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  // Ensure posts is always an array before filtering
  const safePostsArray = Array.isArray(posts) ? posts : [];

  const filteredPosts = safePostsArray.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    return matchesCategory
  })

  const categories = [
    { id: 'all', name: 'All Articles', count: safePostsArray.length },
    ...Array.from(new Set(safePostsArray.map(post => post.category))).map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count: safePostsArray.filter(post => post.category === category).length
    }))
  ]

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <main className="public-shell min-h-screen">
      <Navigation siteSettings={siteSettings} />
      
      <section id="blog" className="section-padding">
        <div className="container-width">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              My <span className="text-gradient">Blog</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-primary mx-auto mb-6"></div>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              Thoughts, insights, and tutorials from my journey.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 max-w-xs truncate ${
                    selectedCategory === category.id
                      ? 'bg-gradient-primary text-white shadow-lg'
                      : 'bg-white/60 backdrop-blur-sm text-primary-600 hover:bg-white hover:shadow-md'
                  }`}
                  title={`${category.name} (${category.count})`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </motion.div>

          {/* Blog Posts Grid */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center py-12"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-primary-600">Loading articles...</p>
            </motion.div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-primary-800 mb-2">No articles found</h3>
              <p className="text-primary-600">
                {selectedCategory !== 'all' 
                  ? 'Try selecting a different category or check back later for new content.' 
                  : 'Check back soon for new blog posts and insights.'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="project-card group"
                  >
                    {post.featuredImage && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="p-6">
                      {/* Category & Date */}
                      <div className="flex items-center justify-between text-sm text-primary-500 mb-3 gap-2">
                        <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full truncate max-w-[150px] flex-shrink-0" title={post.category}>
                          {post.category}
                        </span>
                        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                          <Calendar size={14} />
                          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-primary-800 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>

                      {/* Excerpt */}
                      <p className="text-primary-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Meta & Read More */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col text-sm text-primary-500 gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{post.readTime} min read</span>
                          </div>
                          <span className="break-words" title={post.author}>By {post.author}</span>
                        </div>
                        
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          Read more
                          <ArrowRight size={16} className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>


      <Footer profile={profile} siteSettings={siteSettings} />
    </main>
  )
}
