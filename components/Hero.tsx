'use client';

// framer-motion removed for static hero
import { Download, Mail, MapPin, Code2, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getSocialIcon, SocialLink } from '../lib/socialIcons';
import ErrorState from './ErrorState';
import useDataPrefetch from '@/hooks/useDataPrefetch';

interface ProfileData {
  name: string;
  nickname: string;
  title: string;
  specialization: string;
  description: string;
  location: string;
  email: string;
  profileImage: string;
  cvUrl: string;
  socialLinks?: SocialLink[];
  // New fields for complete home page control
  greetingText?: string;
  contactButtonText?: string;
  cvButtonText?: string;
  cvNotAvailableText?: string;
}

export default function Hero({ profile: serverProfile, siteSettings: serverSettings }: { profile?: any; siteSettings?: any }) {
  const [profile, setProfile] = useState<ProfileData | null>(serverProfile || null);
  const [siteSettings, setSiteSettings] = useState<any>(serverSettings || null);
  const [isLoading, setIsLoading] = useState(!serverProfile || !serverSettings);
  const [error, setError] = useState<string | null>(null);

  // Trigger data prefetching for all pages
  useDataPrefetch();

  useEffect(() => {
    // If server props provided, skip client fetching
    if (serverProfile && serverSettings) {
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [serverProfile, serverSettings]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const timestamp = new Date().getTime();

      const [profileResponse, settingsResponse] = await Promise.all([
        fetch(`/api/profile?t=${timestamp}`),
        fetch(`/api/site-settings?t=${timestamp}`)
      ]);

      const profileResult = await profileResponse.json();
      const settingsResult = await settingsResponse.json();

      if (profileResult.success) {
        setProfile(profileResult.data);
      } else {
        setError('Failed to load profile data. Please try again.');
      }

      if (settingsResult.success) {
        setSiteSettings(settingsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Unable to load profile data. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  const handleContactClick = () => {
    // Navigate to contact page since we're now using multi-page layout
    window.location.href = '/contact';
  };

  const handleWorksClick = () => {
    // Navigate to projects page
    window.location.href = '/projects';
  };

  const handleResumeDownload = () => {
    if (profile?.cvUrl) {
      window.open(profile.cvUrl, '_blank');
    } else {
      // Show a friendly message
      alert('Resume not available yet. Please contact me directly for my CV!');
    }
  };

  if (isLoading) {
    return (
      <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden bg-clover-100">
        <div className="container-width text-center">
          <div className="space-y-6">
            <div className="h-48 w-48 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse" />
            <div className="h-12 w-96 max-w-full mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
            <div className="h-6 w-80 max-w-full mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
            <div className="h-16 w-full max-w-2xl mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden bg-clover-100">
        <div className="container-width">
          <ErrorState
            title="Failed to Load Profile"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="public-hero-shell min-h-screen flex items-center justify-center relative overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute left-1/2 bottom-0 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

  <div className="container-width section-padding pb-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image first in DOM for stacking on small screens; moves to right on lg */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end mb-6 lg:mb-0">
            <div className="relative z-10 w-44 h-44 sm:w-56 sm:h-56 md:w-80 md:h-80 lg:w-[420px] lg:h-[420px] rounded-full overflow-hidden border-4 border-white shadow-2xl">
              <Image
                src={profile?.profileImage || '/profile-placeholder.svg'}
                alt={`${profile?.name || 'Your Name'} (${profile?.nickname || 'Your Nickname'})`}
                width={320}
                height={320}
                className="w-full h-full object-cover rounded-full"
                priority
                onError={(e) => {
                  // Next/Image uses an <img> under the hood on client; fallback to the placeholder
                  // Ensure we don't loop if placeholder also errors
                  try {
                    if ((e.currentTarget as HTMLImageElement).src?.includes('profile-placeholder.svg')) return;
                    (e.currentTarget as HTMLImageElement).src = '/profile-placeholder.svg';
                  } catch (err) {
                    // ignore
                  }
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            {/* Greeting */}
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
              <span className="text-clover-700 font-medium">
                {siteSettings?.hero?.greetingText ?? profile?.greetingText ?? ''}
              </span>
            </div>

            {/* Name */}
            <h1 className="font-black mb-4 font-playfair whitespace-nowrap" style={{ fontSize: 'clamp(1.5rem, 8vw, 4rem)', lineHeight: '1.2' }}>
              <span className="text-gradient">{profile?.name || 'Your Name'}</span>
            </h1>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-clover-700 mb-6 break-words">({profile?.nickname || 'Your Nickname'})</h2>

            {/* Title with typing effect */}
            {(profile?.title || profile?.specialization) && (
                <div className="mb-6">
                  {profile?.title && (
                    <h3 className="text-xl md:text-2xl text-clover-700 font-medium mb-2">{profile.title}</h3>
                  )}
                  {profile?.specialization && (
                    <div className="flex items-center justify-center lg:justify-start space-x-2 text-clover-500">
                      <span>{profile.specialization}</span>
                    </div>
                  )}
                </div>
            )}

            {/* Description */}
            <p className="text-base sm:text-lg text-clover-700 mb-8 max-w-2xl text-justify break-words">
              {profile?.description || 'A brief description about yourself goes here. Share your passions, skills, and what makes you unique in the world of your profession.'}
            </p>

            {/* Location */}
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-8 text-clover-700">
              <MapPin size={18} />
              <span>{profile?.location}</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start mb-8">
              <button onClick={handleContactClick} className="btn-primary group w-full sm:w-auto">
                <Mail size={20} className="mr-2 group-hover:rotate-12 transition-transform" />
                <span className="truncate">{siteSettings?.hero?.contactButtonText || profile?.contactButtonText || 'Get In Touch'}</span>
              </button>
              <button onClick={handleWorksClick} className="btn-secondary group w-full sm:w-auto">
                <Briefcase size={20} className="mr-2 group-hover:scale-110 transition-transform" />
                <span className="truncate">View My Projects</span>
              </button>
              <button
                onClick={handleResumeDownload}
                disabled={!profile?.cvUrl}
                className={`btn-secondary group w-full sm:w-auto ${!profile?.cvUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!profile?.cvUrl ? 'CV not available' : 'Download CV'}
              >
                <Download size={20} className="mr-2 group-hover:translate-y-1 transition-transform" />
                <span className="truncate">
                  {profile?.cvUrl ? (siteSettings?.hero?.cvButtonText || profile?.cvButtonText || 'Download CV') : (siteSettings?.hero?.cvNotAvailableText || profile?.cvNotAvailableText || 'CV Not Available')}
                </span>
              </button>
            </div>

            {/* Social Links (static, non-animated) */}
            <div className="flex items-center justify-center lg:justify-start space-x-4">
              {profile?.socialLinks && profile.socialLinks.length > 0 && (
                profile.socialLinks.map((link, index) => {
                  const iconConfig = getSocialIcon(link.icon);
                  const IconComponent = iconConfig?.icon || Mail;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-full bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white transition-all duration-200 ${iconConfig?.color || ''}`}
                      title={link.name}
                    >
                      <IconComponent size={20} />
                    </a>
                  );
                })
              )}
            </div>
          </div>

          {/* Right column: profile image on desktop, centered above on mobile */}
          
        </div>
      </div>
    </section>
  );
}
