'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home, User, Code, Briefcase, FolderOpen, Mail, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation({ siteSettings: serverSettings }: { siteSettings?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [siteSettings, setSiteSettings] = useState<any>(serverSettings || null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);

    // Intersection observer to detect active section
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    const sections = ['home', 'about', 'skills', 'experience', 'projects', 'contact'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    if (serverSettings) {
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }

    const fetchSettings = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/site-settings?t=${timestamp}`);
        const result = await response.json();
        if (result.success) setSiteSettings(result.data);
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    window.addEventListener('scroll', handleScroll);
    fetchSettings();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [serverSettings]);

  // Dynamic navigation items based on site settings - Using hash anchors for single-page
  const navItems = [
    { name: siteSettings?.navigation?.homeText || 'Home', href: '#home', icon: Home, visible: true },
    { name: siteSettings?.navigation?.aboutText || 'About', href: '#about', icon: User, visible: siteSettings?.about?.visible ?? true },
    { name: siteSettings?.navigation?.skillsText || 'Skills', href: '#skills', icon: Code, visible: siteSettings?.skills?.visible ?? true },
    { name: siteSettings?.navigation?.experienceText || 'Experience', href: '#experience', icon: Briefcase, visible: siteSettings?.experience?.visible ?? true },
    { name: siteSettings?.navigation?.projectsText || 'Projects', href: '#projects', icon: FolderOpen, visible: siteSettings?.projects?.visible ?? true },
    { name: siteSettings?.navigation?.blogText || 'Blog', href: '/blog', icon: BookOpen, visible: siteSettings?.blog?.visible ?? true },
    { name: siteSettings?.navigation?.contactText || 'Contact', href: '#contact', icon: Mail, visible: siteSettings?.contact?.visible ?? true },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsOpen(false);
    
    // Handle hash navigation with smooth scroll
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-gradient-to-br from-clover-100/95 to-white/95 backdrop-blur-sm shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, '#home')}
              className="text-2xl font-bold text-gradient cursor-pointer"
            >
              {siteSettings?.general?.siteTitle || siteSettings?.navigation?.siteName || siteSettings?.profile?.name || 'Your Name'}
            </a>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.filter(i => i.visible).map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                    (item.href.startsWith('#') && activeSection === item.href.substring(1)) || 
                    (item.href === '/blog' && false) // Blog still uses routing
                      ? 'text-white bg-clover-700 font-semibold shadow-lg'
                      : 'text-clover-700 hover:text-clover-900 hover:bg-clover-50'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-medium">{item.name}</span>
                </a>
              </motion.div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-clover-700 hover:text-clover-900 hover:bg-clover-100 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
          <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-clover-100"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col space-y-2">
                {navItems.filter(i => i.visible).map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                      (item.href.startsWith('#') && activeSection === item.href.substring(1)) || 
                      (item.href === '/blog' && false)
                        ? 'text-white bg-clover-700 font-semibold shadow-lg'
                        : 'text-clover-700 hover:text-clover-900 hover:bg-clover-50'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
