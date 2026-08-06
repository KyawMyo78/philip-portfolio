'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Code, 
  Database, 
  Globe, 
  Cpu, 
  Wrench, 
  BookOpen, 
  Star
} from 'lucide-react';
import IconPreview from './IconPreview';
import { SkillCardSkeleton } from './SkeletonLoader';
import ErrorState from './ErrorState';
import { usePortfolioData } from './PortfolioDataProvider';
import { getCachedData, setCachedData, CACHE_KEYS } from '@/hooks/useDataPrefetch';

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency?: number;
  level?: string | number; // Support both string and number for level
  yearsOfExperience?: number;
  description?: string;
  icon?: string;
  featured: boolean;
  order: number;
}

const categoryIcons: { [key: string]: any } = {
  'programming': Code,
  'frameworks': Globe,
  'databases': Database,
  'tools': Wrench,
  'embedded': Cpu,
  'other': BookOpen,
  'default': Code
};



const categoryColors: { [key: string]: string } = {
  'programming': 'from-royal-500 to-royal-600',
  'frameworks': 'from-green-500 to-green-600',
  'databases': 'from-navy-500 to-navy-600',
  'tools': 'from-orange-500 to-orange-600',
  'embedded': 'from-red-500 to-red-600',
  'other': 'from-gray-500 to-gray-600',
  'default': 'from-primary-500 to-primary-600'
};
// Replace default with clover gradient
categoryColors['default'] = 'from-clover-500 to-clover-700';

// Helper function to convert level string to proficiency percentage
const levelToProficiency = (level?: string | number | any): number => {
  if (!level) return 50;
  
  // If it's a number between 1-5 (star rating system), convert to percentage
  if (typeof level === 'number') {
    if (level >= 1 && level <= 5) {
      // Convert 1-5 star system to percentage
      const starToPercentage = {
        1: 20,  // Beginner
        2: 40,  // Novice  
        3: 60,  // Intermediate
        4: 80,  // Advanced
        5: 95   // Expert
      };
      return starToPercentage[level as keyof typeof starToPercentage] || 50;
    }
    // If it's already a percentage (0-100), use it directly
    if (level >= 0 && level <= 100) {
      return level;
    }
  }
  
  // Convert text levels to percentage
  const levelStr = typeof level === 'string' ? level : String(level);
  const levelLower = levelStr.toLowerCase();
  
  if (levelLower.includes('expert')) return 95;
  if (levelLower.includes('advanced')) return 80;
  if (levelLower.includes('intermediate')) return 60;
  if (levelLower.includes('novice')) return 40;
  if (levelLower.includes('beginner') || levelLower.includes('basic')) return 20;
  
  return 50;
};

// Helper function to get proficiency value
const getProficiency = (skill: Skill): number => {
  return skill.proficiency ?? levelToProficiency(skill.level);
};

// Admin edits skills with a 1–5 star rating. Preserve that exact rating when
// present, while mapping legacy percentage/text values to the same scale.
const getStarRating = (skill: Skill): number => {
  if (typeof skill.level === 'number' && skill.level >= 1 && skill.level <= 5) {
    return Math.round(skill.level);
  }
  return Math.min(5, Math.max(1, Math.round(getProficiency(skill) / 20)));
};

// Helper function to get years of experience
const getYearsOfExperience = (skill: Skill): number => {
  return skill.yearsOfExperience ?? 0;
};

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  
  const portfolioData = usePortfolioData();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get cached data first
      const cachedSkills = getCachedData<Skill[]>(CACHE_KEYS.SKILLS);
      const cachedSettings = getCachedData<any>(CACHE_KEYS.SITE_SETTINGS);
      
      if (cachedSkills) {
        console.log('✅ Using cached skills data');
        setSkills(cachedSkills);
        setIsLoading(false);
      }
      
      if (cachedSettings) {
        console.log('✅ Using cached site settings');
        setSiteSettings(cachedSettings);
      }
      
      // If we have both cached data, we can show it immediately
      // but still fetch fresh data in the background
      const shouldFetchFresh = !cachedSkills || !cachedSettings;
      
      if (!shouldFetchFresh) {
        // Data is cached, but fetch in background for freshness
        setTimeout(() => fetchFreshData(), 100);
        return;
      }
      
      // No cache, fetch immediately
      await fetchFreshData();
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Unable to load skills. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      // Fetch both skills and site settings
      const [skillsRes, settingsRes] = await Promise.all([
        fetch('/api/portfolio/skills'),
        fetch('/api/site-settings')
      ]);
      
      const skillsData = await skillsRes.json();
      const settingsData = await settingsRes.json();
      
      if (skillsData.success && Array.isArray(skillsData.data)) {
        const freshSkills = skillsData.data;
        setSkills(freshSkills);
        // Update cache with fresh data
        setCachedData(CACHE_KEYS.SKILLS, freshSkills);
      } else {
        console.error('Failed to fetch skills:', skillsData.error);
        setSkills([]); // Ensure it's always an array
        if (!getCachedData(CACHE_KEYS.SKILLS)) {
          setError('Failed to load skills. Please try again.');
        }
      }
      
      if (settingsData.success) {
        setSiteSettings(settingsData.data);
        // Update cache with fresh data
        setCachedData(CACHE_KEYS.SITE_SETTINGS, settingsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!getCachedData(CACHE_KEYS.SKILLS)) {
        setError('Unable to load skills. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as { [key: string]: Skill[] });

  // Sort categories and skills within categories
  const sortedCategories = Object.keys(skillsByCategory).sort();
  Object.keys(skillsByCategory).forEach(category => {
    skillsByCategory[category].sort((a, b) => a.order - b.order || getProficiency(b) - getProficiency(a));
  });

  if (isLoading) {
    return (
      <section id="skills" className="public-section-shell section-padding">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="h-12 w-48 mx-auto mb-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
            <div className="w-24 h-1 bg-gray-300 mx-auto mb-6 animate-pulse" />
            <div className="h-6 w-96 max-w-full mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="skills" className="public-section-shell section-padding">
        <div className="container-width">
          <ErrorState
            title="Failed to Load Skills"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      </section>
    );
  }

  if (skills.length === 0) {
    return (
      <section id="skills" className="public-section-shell section-padding">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{siteSettings?.skills?.sectionTitle || 'My Skills'}</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-clover mx-auto mb-6"></div>
            <p className="text-xl text-clover-700 max-w-3xl mx-auto mb-8 text-center">
              {siteSettings?.skills?.sectionSubtitle || 'Constantly learning and evolving.'}
            </p>
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🛠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Skills Coming Soon</h3>
              <p className="text-gray-600">Check back later to see my expertise and capabilities.</p>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="skills" className="public-section-shell section-padding">
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
            <span className="text-gradient">{siteSettings?.skills?.sectionTitle || 'My Skills'}</span>
          </h2>
            <div className="w-24 h-1 bg-gradient-clover mx-auto mb-6"></div>
          <p className="text-xl text-clover-700 max-w-3xl mx-auto text-center">
            {siteSettings?.skills?.sectionSubtitle || 'A comprehensive toolkit built through years of hands-on experience and continuous learning.'}
          </p>
        </motion.div>

        {/* Skills Grid */}
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCategories.map((categoryName, categoryIndex) => {
            const categorySkills = skillsByCategory[categoryName];
            const IconComponent = categoryIcons[categoryName] || categoryIcons['default'];
            const colorClass = categoryColors[categoryName] || categoryColors['default'];

            return (
              <motion.div
                key={categoryName}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-clover-100"
              >
                {/* Category Header */}
                <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorClass} flex items-center justify-center mr-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 capitalize">
                      {categoryName.replace('-', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">{categorySkills.length} skills</p>
                  </div>
                </div>

                {/* Skills List */}
                <div className="space-y-4">
                  {categorySkills.map((skill, skillIndex) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: (categoryIndex * 0.1) + (skillIndex * 0.05) }}
                      className="relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {skill.icon ? (
                            <span className="mr-2">
                              <IconPreview name={skill.icon} className="w-4 h-4 text-clover-700" />
                            </span>
                          ) : null}
                          <span className="font-medium text-gray-900">{skill.name}</span>
                          {skill.featured && (
                            <Star className="w-4 h-4 text-yellow-500 ml-2 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div
                            className="flex items-center gap-0.5"
                            role="img"
                            aria-label={`${getStarRating(skill)} out of 5 stars`}
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= getStarRating(skill) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="sr-only">{getStarRating(skill)} out of 5 stars</span>
                          </div>
                          {getYearsOfExperience(skill) > 0 && (
                            <span className="ml-2 text-xs">
                              {getYearsOfExperience(skill)}yr{getYearsOfExperience(skill) !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Description */}
                      {skill.description && (
                        <p className="text-xs text-gray-500 mt-1">{skill.description}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Skills Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="skills-summary-card mt-16 rounded-3xl p-8"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h4 className="text-3xl font-bold text-clover-900 mb-2">
                {skills.length}
              </h4>
              <p className="text-clover-700 font-medium">Technical Skills</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-clover-900 mb-2">
                {Math.round(skills.reduce((sum, skill) => sum + getProficiency(skill), 0) / skills.length) || 0}%
              </h4>
              <p className="text-clover-700 font-medium">Average Proficiency</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-clover-900 mb-2">
                {Math.round(skills.reduce((sum, skill) => sum + getYearsOfExperience(skill), 0) / skills.length * 10) / 10 || 0}
              </h4>
              <p className="text-clover-700 font-medium">Avg Years Experience</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
