 'use client';

import { motion } from 'framer-motion';
import Achievements from './Achievements';
import FeaturedAchievements from './FeaturedAchievements';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, Building, ExternalLink, Briefcase } from 'lucide-react';
import { ExperienceCardSkeleton } from './SkeletonLoader';
import ErrorState from './ErrorState';
import { getCachedData, setCachedData, CACHE_KEYS } from '@/hooks/useDataPrefetch';
import { StaggerContainer, StaggerItem } from './StaggerAnimation';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  responsibilities?: string[];
  achievements?: string[];
  technologies?: string[];
  companyUrl?: string;
  order: number;
}

type Props = { experience?: Experience[] };

export default function Experience({ experience: serverExperience }: Props) {
  const [experiences, setExperiences] = useState<Experience[]>(serverExperience || []);
  const [isLoading, setIsLoading] = useState(!serverExperience);
  const [error, setError] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    if (!serverExperience) {
      fetchData();
    }
  }, [serverExperience]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get cached data first
      const cachedExperience = getCachedData<Experience[]>(CACHE_KEYS.EXPERIENCE);
      const cachedSettings = getCachedData<any>(CACHE_KEYS.SITE_SETTINGS);
      
      if (cachedExperience) {
        console.log('✅ Using cached experience data');
        setExperiences(cachedExperience);
        setIsLoading(false);
      }
      
      if (cachedSettings) {
        setSiteSettings(cachedSettings);
      }
      
      // If we have cached data, fetch fresh data in background
      if (cachedExperience && cachedSettings) {
        setTimeout(() => fetchFreshData(), 100);
        return;
      }
      
      // No cache, fetch immediately
      await fetchFreshData();
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Unable to load experience data. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      // Fetch both experiences and site settings
      const [experiencesRes, settingsRes] = await Promise.all([
        fetch('/api/portfolio/experience'),
        fetch('/api/site-settings')
      ]);
      
      const experiencesData = await experiencesRes.json();
      const settingsData = await settingsRes.json();
      
      if (experiencesData.success && Array.isArray(experiencesData.data)) {
        // Sort by order and start date (most recent first)
        const sortedExperiences = experiencesData.data.sort((a: Experience, b: Experience) => {
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
        setExperiences(sortedExperiences);
        setCachedData(CACHE_KEYS.EXPERIENCE, sortedExperiences);
      } else {
        console.error('Failed to fetch experiences:', experiencesData.error);
        setExperiences([]); // Ensure it's always an array
        if (!getCachedData(CACHE_KEYS.EXPERIENCE)) {
          setError('Failed to load experience data. Please try again.');
        }
      }
      
      if (settingsData.success) {
        setSiteSettings(settingsData.data);
        setCachedData(CACHE_KEYS.SITE_SETTINGS, settingsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!getCachedData(CACHE_KEYS.EXPERIENCE)) {
        setError('Unable to load experience data. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  const ExperienceCard = ({ experience }: { experience: Experience }) => (
    <>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{experience.title}</h3>
          {experience.current && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              Current
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-3">
                <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            {experience.companyUrl ? (
              <a 
                href={experience.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-clover-700 hover:text-clover-900 font-medium flex items-center gap-1 transition-colors"
              >
                {experience.company}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="font-medium">{experience.company}</span>
            )}
          </div>
          
          {experience.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{experience.location}</span>
            </div>
          )}
          
                <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
            <span>
              {formatDate(experience.startDate)} - {experience.current ? 'Present' : (experience.endDate ? formatDate(experience.endDate) : 'Present')}
            </span>
            <span className="text-sm text-gray-500">
              ({calculateDuration(experience.startDate, experience.current ? undefined : experience.endDate)})
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 leading-relaxed text-justify">{experience.description}</p>

      {/* Responsibilities */}
      {experience.responsibilities && experience.responsibilities.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Responsibilities:</h4>
          <ul className="space-y-1">
            {experience.responsibilities.map((responsibility, i) => (
                <li key={i} className="text-gray-600 flex items-start gap-2 text-sm">
                <span className="text-clover-700 mt-1.5 w-1 h-1 bg-current rounded-full flex-shrink-0"></span>
                <span>{responsibility}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievements */}
      {experience.achievements && experience.achievements.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Achievements:</h4>
          <ul className="space-y-1">
            {experience.achievements.map((achievement, i) => (
              <li key={i} className="text-gray-600 flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-1">✓</span>
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technologies */}
      {experience.technologies && experience.technologies.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Technologies Used:</h4>
          <div className="flex flex-wrap gap-2">
            {experience.technologies.map((tech, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-clover-100 text-clover-700 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (isLoading) {
    return (
      <section id="experience" className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="h-12 w-56 mx-auto mb-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
            <div className="w-24 h-1 bg-gray-300 mx-auto mb-6 animate-pulse" />
            <div className="h-6 w-96 max-w-full mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
          </motion.div>
          
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <ExperienceCardSkeleton key={i} />
            ))}
          </div>
        </div>
        
        {/* Always show global achievements below the loading state */}
        <div className="container-width mt-16">
          <Achievements />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="experience" className="section-padding bg-gray-50">
        <div className="container-width">
          <ErrorState
            title="Failed to Load Experience"
            message={error}
            onRetry={handleRetry}
          />
        </div>
        
        {/* Always show global achievements even on error */}
        <div className="container-width mt-16">
          <Achievements />
        </div>
      </section>
    );
  }

  if (experiences.length === 0) {
    return (
      <section id="experience" className="section-padding bg-gray-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{siteSettings?.experience?.sectionTitle || 'Experience'}</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-clover mx-auto mb-6"></div>
            <p className="text-xl text-clover-700 max-w-3xl mx-auto mb-8 text-center">
              {siteSettings?.experience?.sectionSubtitle || 'Building expertise through hands-on experience and continuous learning.'}
            </p>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💼</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Experience Coming Soon</h3>
              <p className="text-gray-600">Check back later to see my journey and achievements.</p>
            </div>
          </motion.div>
        </div>
        {/* Show global achievements even when no experiences exist */}
        <div className="container-width">
          <Achievements />
        </div>
      </section>
    );
  }

  return (
    <section id="experience" className="section-padding bg-gray-50">
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
            <span className="text-gradient">{siteSettings?.experience?.sectionTitle || 'Work Experience'}</span>
          </h2>
            <div className="w-24 h-1 bg-gradient-clover mx-auto mb-6"></div>
          <p className="text-xl text-clover-700 max-w-3xl mx-auto text-center">
            {siteSettings?.experience?.sectionSubtitle || 'My professional journey showcasing growth, achievements, and the impact I\'ve made across different roles.'}
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line - Only show on large screens */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-8 bottom-8 w-0.5 bg-gradient-to-b from-clover-500 to-clover-300 hidden xl:block"></div>

          {/* Experience Items */}
          <StaggerContainer className="space-y-8" staggerDelay={0.15}>
            {experiences.map((experience, index) => (
              <StaggerItem key={experience.id}>
              <div className="relative">
                {/* Mobile/Tablet Layout (up to xl) - Simple left-aligned */}
                <div className="xl:hidden flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full border-4 border-clover-500 flex items-center justify-center shadow-lg">
                    <Briefcase className="w-4 h-4 text-clover-700" />
                    {experience.current && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <motion.div
                    whileHover={{ 
                      y: -4,
                      scale: 1.01,
                      transition: { duration: 0.3, ease: 'easeOut' }
                    }}
                    className="flex-1 bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300 border border-gray-100"
                  >
                    <ExperienceCard experience={experience} />
                  </motion.div>
                </div>

                {/* Desktop Layout (xl and above) - Alternating timeline */}
                <div className="hidden xl:flex items-start gap-8">
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 flex-shrink-0 w-16 h-16 bg-white rounded-full border-4 border-clover-500 flex items-center justify-center shadow-lg z-10">
                    <Briefcase className="w-6 h-6 text-clover-700" />
                    {experience.current && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 max-w-lg ${
                    index % 2 === 0 ? 'mr-16' : 'ml-16 xl:order-2'
                  }`}>
                    <motion.div
                      whileHover={{ 
                        y: -4,
                        scale: 1.01,
                        transition: { duration: 0.3, ease: 'easeOut' }
                      }}
                      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300 border border-gray-100"
                    >
                      <ExperienceCard experience={experience} />
                    </motion.div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className={`flex-1 max-w-lg ${
                    index % 2 === 0 ? 'xl:order-2' : 'mr-16'
                  }`}></div>
                </div>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Experience Summary */}
          <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
         className="mt-16 bg-gradient-to-r from-clover-100 to-clover-100 rounded-3xl p-8"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h4 className="text-3xl font-bold text-clover-900 mb-2">
                {experiences.length}
              </h4>
              <p className="text-clover-700 font-medium">Professional Roles</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-clover-900 mb-2">
                {experiences.filter(exp => exp.current).length}
              </h4>
              <p className="text-clover-700 font-medium">Current Positions</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-clover-900 mb-2">
                {new Set(experiences.flatMap(exp => exp.technologies || [])).size}
              </h4>
              <p className="text-clover-700 font-medium">Technologies Used</p>
            </div>
          </div>
        </motion.div>
        {/* Featured Achievements (top) */}
        <div className="mt-4">
          <FeaturedAchievements maxItems={3} />
        </div>

        {/* Global Achievements Section (exclude featured) */}
        <div className="mt-8">
          <Achievements excludeFeatured />
        </div>
      </div>
    </section>
  );
}
