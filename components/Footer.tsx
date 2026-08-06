 'use client';

import { motion } from 'framer-motion';
import { Heart, Mail, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSocialIcon, SocialLink } from '../lib/socialIcons';

interface ProfileData {
  email: string;
  name?: string;
  nickname?: string;
  description?: string;
  socialLinks?: SocialLink[];
}

const quickLinks = [
  { name: 'About', path: '#about' },
  { name: 'Skills', path: '#skills' },
  { name: 'Experience', path: '#experience' },
  { name: 'Projects', path: '#projects' },
  { name: 'Blog', path: '#blog' },
  { name: 'Contact', path: '#contact' }
];

export default function Footer({ profile: serverProfile, siteSettings: serverSettings }: { profile?: any; siteSettings?: any }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileData>({
    email: 'you@example.com',
    name: 'Your Name',
    nickname: 'Your Nickname',
    description: 'A brief description about you, your skills, and what you build.'
  });
  // Allow server-provided siteSettings to be passed in (avoids extra fetch when available)
  const [siteSettings, setSiteSettings] = useState<any | null>(serverSettings || null);

  useEffect(() => {
    // If server provided profile, use it immediately and skip fetch
    if (serverProfile) {
      setProfile({
        email: serverProfile.email || 'you@example.com',
        socialLinks: serverProfile.socialLinks || [],
        name: serverProfile.name || 'Your Name',
        nickname: serverProfile.nickname || 'Your Nickname',
        description: serverProfile.description || 'A brief description about you, your skills, and what you build.'
      });
      return;
    }
    const fetchProfile = async () => {
      try {
        // Add cache busting parameter
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/profile?t=${timestamp}`);
        const result = await response.json();
        if (result.success) {
          setProfile({
            email: result.data.email || 'you@example.com',
            socialLinks: result.data.socialLinks || [],
            name: result.data.name || 'Your Name',
            nickname: result.data.nickname || 'Your Nickname',
            description: result.data.description || 'A brief description about you, your skills, and what you build.'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // ignore profile error; site settings fetch happens below
      }
    };

    fetchProfile();
    // Always fetch site settings for quick links and footer text
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/site-settings');
        const body = await res.json();
        if (body?.success && body.data) setSiteSettings(body.data);
      } catch (e) {
        // ignore
      }
    };
    fetchSettings();
  }, [serverProfile, pathname]);

  // Build social links array from profile data
  const getSocialLinks = () => {
    const links = [];
    
    // Add custom social links only
    if (profile.socialLinks && profile.socialLinks.length > 0) {
      profile.socialLinks.forEach(link => {
        const iconConfig = getSocialIcon(link.icon);
        links.push({
          name: link.name,
          url: link.url,
          icon: iconConfig?.icon || Mail
        });
      });
    }
    
    // Always add email link
    links.push({
      name: 'Email',
      url: `mailto:${profile.email}`,
      icon: Mail
    });
    
    return links;
  };

  const socialLinks = getSocialLinks();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (href: string) => {
    // Normalize to id (strip leading # if present)
    const id = href.startsWith('#') ? href.substring(1) : href;

    // If the element exists on the current page, smooth-scroll to it
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Otherwise, navigate to the home page with the hash so server-rendered page lands at the section
    const target = `/#${id}`;
    // Use location.assign to add a navigation entry
    if (window.location.pathname === '/' || window.location.pathname === '') {
      // If already on home but element wasn't found (maybe not rendered yet), update hash and try again after a short delay
      window.location.hash = `#${id}`;
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } else {
      window.location.href = target;
    }
  };

  return (
    <footer className="bg-clover-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

  <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <h3 className="text-2xl font-bold mb-4 text-secondary-400">{profile.name || 'Your Name'}{profile.nickname ? ` (${profile.nickname})` : ''}</h3>
              <p className="text-clover-200 mb-6 leading-relaxed max-w-md text-justify">
                {profile.description || 'A brief description about you, your skills, and what you build.'}
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <motion.a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 bg-clover-700 rounded-lg flex items-center justify-center hover:bg-clover-500 transition-colors text-white"
                      title={link.name}
                    >
                      <IconComponent size={20} />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-lg font-semibold mb-6 text-clover-100">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks
                  .filter(link => {
                    // Map link name to settings visibility (default to true to match Navigation behavior)
                    const mapping: Record<string, boolean> = {
                      About: siteSettings?.about?.visible ?? true,
                      Skills: siteSettings?.skills?.visible ?? true,
                      Experience: siteSettings?.experience?.visible ?? true,
                      Projects: siteSettings?.projects?.visible ?? true,
                      Blog: siteSettings?.blog?.visible ?? true,
                      Contact: siteSettings?.contact?.visible ?? true,
                    };
                    return mapping[link.name] ?? true;
                  })
                  .map((link) => {
                    // Prefer labels from siteSettings.navigation when available
                    const labelMap: Record<string, string> = {
                      About: siteSettings?.navigation?.aboutText || 'About',
                      Skills: siteSettings?.navigation?.skillsText || 'Skills',
                      Experience: siteSettings?.navigation?.experienceText || 'Experience',
                      Projects: siteSettings?.navigation?.projectsText || 'Projects',
                      Blog: siteSettings?.navigation?.blogText || 'Blog',
                      Contact: siteSettings?.navigation?.contactText || 'Contact',
                    };

                    const label = labelMap[link.name] || link.name;

                    return (
                      <li key={link.name}>
                        <a
                          href={link.path}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(link.path);
                          }}
                          className="text-secondary-300 hover:text-white transition-colors"
                        >
                          {label}
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-lg font-semibold mb-6 text-clover-100">Get In Touch</h4>
              <div className="space-y-3 text-secondary-300">
                <p>Thailand</p>
                <a 
                  href={`mailto:${profile.email || 'you@example.com'}`}
                  className="block hover:text-white transition-colors"
                >
                  {profile.email || 'you@example.com'}
                </a>
                <p className="text-sm">
                  Available for freelance projects and collaborations
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
  <div className="border-t border-clover-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center space-x-2 text-clover-300"
              >
                <span>{
                  siteSettings?.footer?.copyrightYear && siteSettings?.footer?.copyrightName
                    ? `© ${siteSettings.footer.copyrightYear} ${siteSettings.footer.copyrightName} ${siteSettings.footer.copyrightText || 'All Rights Reserved'}`
                    : (siteSettings?.footer?.copyrightText || `© 2025 ${profile.name || 'Your Name'}  All Rights Reserved`)
                }</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-clover-300 text-sm"
              >
                Built with Next.js, TypeScript & Tailwind CSS
                <div className="mt-1">
                  <a href="https://www.kyawmyokhant.com" target="_blank" rel="noopener noreferrer" className="text-clover-300 hover:text-white underline text-sm">
                    Contact the developer
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: showScrollTop ? 1 : 0, 
          scale: showScrollTop ? 1 : 0 
        }}
        onClick={scrollToTop}
  className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 w-12 h-12 bg-clover-700 hover:bg-clover-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-50"
      >
        <ArrowUp size={20} />
      </motion.button>
    </footer>
  );
}
