'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, ArrowLeft, Tag, Share2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

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

export default function BlogPostPage() {
  const params = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (params.slug) {
      fetchPost(params.slug as string)
    }
  }, [params.slug])

  const fetchPost = async (slug: string) => {
    try {
      const response = await fetch(`/api/blog/slug/${slug}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setPost(result.data)
        // Increment view count with the actual current count
        incrementViews(result.data.id, result.data.views || 0)
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error('Error fetching blog post:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const incrementViews = async (postId: string, currentViews: number) => {
    try {
      const newViewCount = currentViews + 1
      await fetch(`/api/blog/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ views: newViewCount })
      })
      // Update local state to reflect new view count
      setPost(prev => prev ? ({ ...prev, views: newViewCount }) : prev)
    } catch (error) {
      console.error('Error incrementing views:', error)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const copyToClipboard = async () => {
    try {
      const url = window.location.href
      
      // Modern browser support
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      setCopied(true)
      toast.success('Link copied to clipboard!')
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.error('Failed to copy link')
    }
  }

  if (loading) {
    return (
      <main className="public-shell min-h-screen">
        <Navigation />
        <div className="pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading article...</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (notFound || !post) {
    return (
      <main className="public-shell min-h-screen">
        <Navigation />
        <div className="pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-8">The article you're looking for doesn't exist or has been moved.</p>
            <Link
              href="/blog"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="public-shell min-h-screen">
      <Navigation />
      
      {/* Article Header */}
      <article className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Blog
          </Link>

          {/* Article Meta */}
          <div className="mb-8">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                {post.category}
              </span>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{post.readTime} min read</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 break-words">
              {post.title}
            </h1>

            <p className="text-xl text-gray-600 mb-6 break-words">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <p className="text-gray-600 truncate max-w-[200px]" title={post.author}>
                  By <span className="font-medium">{post.author}</span>
                </p>
                <p className="text-sm text-gray-500">
                  {post.views} views
                </p>
              </div>
              
              {/* Share Button */}
              <button
                onClick={copyToClipboard}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  copied
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700'
                }`}
                title="Copy link to share"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span className="text-sm font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span className="text-sm font-medium">Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="rich-text-content mb-8 max-w-none break-words overflow-wrap-anywhere">
            <div 
              className="prose prose-lg max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="border-t pt-8 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={20} className="text-gray-500" />
                <span className="font-medium text-gray-700">Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm truncate max-w-[200px]"
                    title={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="border-t pt-8">
            <div className="bg-primary-50 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enjoyed this article?
              </h3>
              <p className="text-gray-600 mb-4">
                Share it with others who might find it useful!
              </p>
              <button
                onClick={copyToClipboard}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    <span className="font-medium">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={18} />
                    <span className="font-medium">Copy Link to Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
