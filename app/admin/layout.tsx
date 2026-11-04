'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LogOut, 
  User, 
  Briefcase, 
  Award, 
  Code, 
  FolderOpen, 
  Mail,
  Menu,
  X,
  Home,
  ChevronLeft,
  Settings,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { id: 'overview', label: 'Dashboard', icon: Home, path: '/admin/dashboard' },
    { id: 'profile', label: 'Profile', icon: User, path: '/admin/profile' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, path: '/admin/projects' },
    { id: 'experience', label: 'Experience', icon: Briefcase, path: '/admin/experience' },
    { id: 'skills', label: 'Skills', icon: Code, path: '/admin/skills' },
    { id: 'blog', label: 'Blog', icon: BookOpen, path: '/admin/blog' },
    { id: 'contacts', label: 'Messages', icon: Mail, path: '/admin/contacts' },
    { id: 'achievements', label: 'Achievements', icon: Award, path: '/admin/achievements' },
    { id: 'settings', label: 'Site Settings', icon: Settings, path: '/admin/site-settings' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      toast.success('Logged out successfully');
      router.push('/admin/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  // Fetch site settings for admin title
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/site-settings');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setSiteSettings(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    fetchSiteSettings();
  }, []);

  // Set document title for admin pages
  useEffect(() => {
    const siteName = siteSettings?.general?.siteTitle || siteSettings?.navigation?.siteName || 'Portfolio';
    
    // Get page-specific title based on pathname
    let pageType = 'Admin';
    if (pathname.includes('/dashboard')) pageType = 'Admin Dashboard';
    else if (pathname.includes('/profile')) pageType = 'Admin Profile';
    else if (pathname.includes('/projects')) pageType = 'Admin Projects';
    else if (pathname.includes('/experience')) pageType = 'Admin Experience';
    else if (pathname.includes('/skills')) pageType = 'Admin Skills';
    else if (pathname.includes('/blog')) pageType = 'Admin Blog';
    else if (pathname.includes('/contacts')) pageType = 'Admin Messages';
    else if (pathname.includes('/achievements')) pageType = 'Admin Achievements';
    else if (pathname.includes('/site-settings')) pageType = 'Admin Settings';
    
    const pageTitle = `${siteName} | ${pageType}`;
    document.title = pageTitle;
  }, [siteSettings, pathname]);

  // Prefetch admin pages to speed up client-side navigation
  useEffect(() => {
    // Prefetch in background after mount
    navigationItems.forEach((item) => {
      try {
        // router.prefetch is available in next/navigation client router
        // It's a void-returning call in this runtime; wrap in try/catch to avoid uncaught exceptions
        router.prefetch?.(item.path as any);
      } catch (e) {
        // ignore prefetch errors
      }
    });
  }, []); // run once on mount

  // Don't show layout on login page
  // Don't show layout on login, forgot-password, or reset-password pages
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname === '/admin/reset-password'
  ) {
    return <>{children}</>;
  }

  const currentPage = navigationItems.find(item => item.path === pathname);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-primary-900 shadow-lg border-b border-primary-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-white hover:text-secondary-300"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <h1 className="text-xl font-semibold text-white">
                {currentPage?.label || 'Admin Panel'}
              </h1>
              <span className="hidden sm:block text-sm text-secondary-300">Welcome back!</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-200 hover:text-white text-sm hidden sm:block"
              >
                View Portfolio
              </a>
              {/* Visibility toggle for current page (quick admin control) */}
              {(() => {
                // Map pathname to settings key
                const pageKeyMap: Record<string, string> = {
                  '/admin/about': 'about',
                  '/admin/skills': 'skills',
                  '/admin/experience': 'experience',
                  '/admin/projects': 'projects',
                  '/admin/blog': 'blog',
                  '/admin/contact': 'contact',
                };
                const matching = Object.keys(pageKeyMap).find(p => pathname.startsWith(p));
                const settingsKey = matching ? pageKeyMap[matching] : null;

                if (!settingsKey) return null;

                const isVisible = siteSettings?.[settingsKey]?.visible ?? true;

                const toggleVisibility = async () => {
                  try {
                    const next = { ...(siteSettings || {}), [settingsKey]: { ...(siteSettings?.[settingsKey] || {}), visible: !isVisible } };
                    const res = await fetch('/api/site-settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(next),
                    });
                    const body = await res.json();
                    if (res.ok && body.success) {
                      setSiteSettings(next);
                      toast.success('Visibility updated');
                    } else {
                      toast.error('Failed to update visibility');
                    }
                  } catch (e) {
                    console.error('Error toggling visibility', e);
                    toast.error('Error toggling visibility');
                  }
                };

                return (
                  <button
                    onClick={toggleVisibility}
                    title={isVisible ? 'Hide from public site' : 'Show on public site'}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {isVisible ? 'Visible' : 'Hidden'}
                  </button>
                );
              })()}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-secondary-200 hover:text-white"
              >
                <LogOut size={16} />
                <span className="text-sm hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:w-64 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  onMouseEnter={() => { try { router.prefetch?.(item.path as any); } catch(e){} }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-primary-800 text-white shadow-lg border border-primary-700'
                      : 'bg-white text-primary-800 hover:bg-primary-50 shadow-sm border border-primary-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Mobile Sidebar */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div 
                className="bg-primary-900 w-64 h-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-primary-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Navigation</h2>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-secondary-200 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                
                <nav className="p-4 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        onMouseEnter={() => { try { router.prefetch?.(item.path as any); } catch(e){} }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                          isActive
                            ? 'bg-primary-800 text-white shadow-lg border border-primary-700'
                            : 'bg-primary-700 text-secondary-100 hover:bg-primary-600'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          )}

          {/* Main Content */}
          <main className="flex-1 relative">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              {children}
            </motion.div>
          </main>
        </div>
        
      </div>
    </div>
  );
}
