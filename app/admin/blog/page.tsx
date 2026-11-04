'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Calendar, Clock, Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../../components/ConfirmDialog'

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

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  // Auto-refresh posts every 30 seconds to update view counts
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog', {
        headers: {
        }
      })
      const result = await response.json()
      if (result.success) {
        setPosts(result.data || [])
        setLastRefresh(new Date())
      } else {
        toast.error('Failed to fetch blog posts')
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      toast.error('Error fetching blog posts. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (id: string) => {
    setPostToDelete(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    if (!postToDelete) return

    const toastId = toast.loading('Deleting blog post...')
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/blog/${postToDelete}`, {
        method: 'DELETE',
        headers: {
        }
      })
      
      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postToDelete))
        toast.success('Blog post deleted successfully!', { id: toastId })
      } else {
        toast.error('Failed to delete post', { id: toastId })
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Error deleting post. Please try again.', { id: toastId })
    } finally {
      setIsDeleting(false)
      setShowConfirmDialog(false)
      setPostToDelete(null)
    }
  }

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false)
    setPostToDelete(null)
    setIsDeleting(false)
  }

  const updatePostStatus = async (id: string, status: string) => {
    const toastId = toast.loading('Updating post status...')

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === id ? { ...post, status: status as any } : post
        ))
        toast.success(`Post status updated to ${status}!`, { id: toastId })
      } else {
        toast.error('Failed to update post status', { id: toastId })
      }
    } catch (error) {
      console.error('Error updating post status:', error)
      toast.error('Error updating post status. Please try again.', { id: toastId })
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(posts.map(post => post.category)))]

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Create and manage your blog posts
            {lastRefresh && (
              <span className="text-xs sm:text-sm ml-2">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="inline-flex items-center justify-center px-3 py-2 sm:px-4 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-2 sm:order-1"
            title="Refresh blog posts"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center justify-center px-3 py-2 sm:px-4 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto order-1 sm:order-2"
          >
            <Plus size={16} className="mr-2" />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">
              {posts.length === 0 ? 'No blog posts yet. Create your first post!' : 'No posts match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={post.status}
                        onChange={(e) => updatePostStatus(post.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="truncate max-w-[100px] inline-block" title={post.category}>
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Eye size={16} className="mr-1 text-gray-400" />
                        {post.views}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-400" />
                        {formatDate(post.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={closeConfirmDialog}
        onConfirm={confirmDelete}
        title="Delete Blog Post"
        message="Are you sure you want to delete this blog post? This action cannot be undone and will permanently remove the post from your blog."
        confirmText="Delete Post"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />
    </div>
  )
}
