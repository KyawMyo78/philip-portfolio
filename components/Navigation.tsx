'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, User, Code, Briefcase, FolderOpen, Mail, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation({ siteSettings: serverSettings }: { siteSettings?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [siteSettings, setSiteSettings] = useState<any>(serverSettings || null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrolled(scrollTop > 24);
      setScrollProgress(scrollable > 0 ? Math.min(100, (scrollTop / scrollable) * 100) : 0);

      if (pathname !== '/') return;

      const sectionOrder = ['home', 'about', 'skills', 'experience', 'projects', 'blog', 'contact'];
      const checkpoint = scrollTop + window.innerHeight * 0.35;
      let current = 'home';

      for (const sectionId of sectionOrder) {
        const element = document.getElementById(sectionId);
        if (element && element.offsetTop <= checkpoint) {
          current = sectionId;
        }
      }

      setActiveSection(current);
    };

    if (serverSettings) {
      handleScroll();
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
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
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [serverSettings]);

  // Dynamic navigation items based on site settings
  const navItems = [
    { name: siteSettings?.navigation?.homeText || 'Home', href: '#home', icon: Home, visible: true },
    { name: siteSettings?.navigation?.aboutText || 'About', href: '#about', icon: User, visible: siteSettings?.about?.visible ?? true },
    { name: siteSettings?.navigation?.skillsText || 'Skills', href: '#skills', icon: Code, visible: siteSettings?.skills?.visible ?? true },
    { name: siteSettings?.navigation?.experienceText || 'Experience', href: '#experience', icon: Briefcase, visible: siteSettings?.experience?.visible ?? true },
    { name: siteSettings?.navigation?.projectsText || 'Projects', href: '#projects', icon: FolderOpen, visible: siteSettings?.projects?.visible ?? true },
    { name: siteSettings?.navigation?.blogText || 'Blog', href: '#blog', icon: BookOpen, visible: siteSettings?.blog?.visible ?? true },
    { name: siteSettings?.navigation?.contactText || 'Contact', href: '#contact', icon: Mail, visible: siteSettings?.contact?.visible ?? true },
  ];

  const handleNavClick = (href: string) => {
    const id = href.startsWith('#') ? href.substring(1) : href.replace(/^\//, '').replace(/^#/, '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${id}`);
    } else if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.hash = `#${id}`;
    } else {
      window.location.href = `/#${id}`;
    }
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-slate-950/70 backdrop-blur-xl border-white/10 shadow-[0_20px_80px_rgba(2,6,23,0.35)]'
          : 'bg-transparent border-transparent'
      }`}
    >
      <motion.div
        className="absolute left-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent origin-left"
        style={{ scaleX: scrollProgress / 100 }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/"
              onClick={(event) => {
                event.preventDefault();
                handleNavClick('#home');
              }}
              className="text-2xl font-bold text-white tracking-tight"
            >
              {siteSettings?.general?.siteTitle || siteSettings?.navigation?.siteName || siteSettings?.profile?.name || 'Your Name'}
            </Link>
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
                <Link
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    handleNavClick(item.href);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 border ${
                    activeSection === item.href.replace('#', '')
                      ? 'text-white bg-white/10 border-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.25)]'
                      : 'text-slate-300 border-transparent hover:border-white/10 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </motion.div>
            ))}
            
          </div>

          {/* Mobile Menu Button & Chat Icon */}
          <div className="md:hidden flex items-center space-x-2">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950/95 border-t border-white/10 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col space-y-2">
                {navItems.filter(i => i.visible).map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-left transition-all duration-200 border ${
                      activeSection === item.href.replace('#', '')
                        ? 'text-white bg-white/10 border-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.25)]'
                        : 'text-slate-300 border-transparent hover:border-white/10 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
