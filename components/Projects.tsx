'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ExternalLink, Github, Play, Filter, Search, Calendar, Star, ArrowRight, Download, Link } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { analytics } from '@/lib/analytics';
import { ProjectCardSkeleton } from './SkeletonLoader';
import ErrorState from './ErrorState';
import { getCachedData, setCachedData, CACHE_KEYS } from '@/hooks/useDataPrefetch';

interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  category: string;
  status: 'completed' | 'in-progress' | 'planned';
  featured: boolean;
  technologies: string[];
  images: string[];
  githubUrl?: string;
  liveUrl?: string;
  downloadUrl?: string;
  startDate: string;
  endDate?: string;
  highlights: string[];
  order: number;
  slug?: string;
}

// Helper function to safely format dates
const formatProjectDate = (dateString: string | undefined) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null; // Invalid date
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

// Helper function to generate date range display
const getDateRangeDisplay = (project: Project) => {
  const startDate = formatProjectDate(project.startDate);
  const endDate = formatProjectDate(project.endDate);

  if (!startDate && !endDate) return null; // No valid dates

  if (startDate && !endDate) {
    // Only start date, check if in-progress
    if (project.status === 'in-progress') {
      return `${startDate} - Present`;
    }
    return startDate;
  }

  if (!startDate && endDate) {
    // Only end date
    return endDate;
  }

  // Both dates are valid
  return `${startDate} - ${endDate}`;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const router = useRouter();

  const handleProjectNavigation = (project: Project) => {
    const slug = project.slug || project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    analytics.projectCardClick(project.title);
    router.push(`/projects/${slug}`);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get cached data first
      const cachedProjects = getCachedData<Project[]>(CACHE_KEYS.PROJECTS);
      const cachedSettings = getCachedData<any>(CACHE_KEYS.SITE_SETTINGS);
      
      if (cachedProjects) {
        console.log('✅ Using cached projects data');
        setProjects(cachedProjects);
        setIsLoading(false);
      }
      
      if (cachedSettings) {
        setSiteSettings(cachedSettings);
      }
      
      // If we have cached data, fetch fresh data in background
      if (cachedProjects && cachedSettings) {
        setTimeout(() => fetchFreshData(), 100);
        return;
      }
      
      // No cache, fetch immediately
      await fetchFreshData();
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Unable to load projects. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      // Fetch both projects and site settings
      const [projectsRes, settingsRes] = await Promise.all([
        fetch('/api/portfolio/projects'),
        fetch('/api/site-settings')
      ]);
      
      const projectsData = await projectsRes.json();
      const settingsData = await settingsRes.json();
      
      if (projectsData.success && Array.isArray(projectsData.data)) {
        const freshProjects = projectsData.data;
        setProjects(freshProjects);
        setCachedData(CACHE_KEYS.PROJECTS, freshProjects);
      } else {
        console.error('Failed to fetch projects:', projectsData.error);
        setProjects([]); // Ensure it's always an array
        if (!getCachedData(CACHE_KEYS.PROJECTS)) {
          setError('Failed to load projects. Please try again.');
        }
      }
      
      if (settingsData.success) {
        setSiteSettings(settingsData.data);
        setCachedData(CACHE_KEYS.SITE_SETTINGS, settingsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!getCachedData(CACHE_KEYS.PROJECTS)) {
        setError('Unable to load projects. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  // Generate categories dynamically from projects in database
  const categories = [
    { id: 'all', name: 'All Projects', count: projects.length },
    ...Array.from(new Set(projects.map(p => p.category)))
      .filter(category => category) // Filter out undefined/null
      .map(category => ({
        id: category,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        count: projects.filter(p => p.category === category).length
      }))
  ];

  const filteredProjects = projects.filter(project => {
    const matchesCategory = activeCategory === 'all' || project.category === activeCategory;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.technologies.some((tech: string) => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredProjects = filteredProjects.filter(p => p.featured);
  const otherProjects = filteredProjects.filter(p => !p.featured);

  if (isLoading) {
    return (
      <section id="projects" className="public-section-shell section-padding">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="h-12 w-64 mx-auto mb-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
            <div className="w-24 h-1 bg-gray-300 mx-auto mb-6 animate-pulse" />
            <div className="h-6 w-96 max-w-full mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="projects" className="public-section-shell section-padding">
        <div className="container-width">
          <ErrorState
            title="Failed to Load Projects"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
  <section id="projects" className="public-section-shell section-padding">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{siteSettings?.projects?.sectionTitle || 'My Projects'}</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-clover mx-auto mb-6"></div>
            <p className="text-xl text-clover-700 max-w-3xl mx-auto mb-8 text-center">
              {siteSettings?.projects?.sectionSubtitle || 'Exploring innovative solutions across web development, mobile apps, embedded systems, and AI technologies.'}
            </p>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Projects Coming Soon</h3>
              <p className="text-gray-600">Check back later to see my work and accomplishments.</p>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
  <section id="projects" className="public-section-shell section-padding">
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
            <span className="text-gradient">{siteSettings?.projects?.sectionTitle || 'My Projects'}</span>
          </h2>
            <div className="w-24 h-1 bg-gradient-clover mx-auto mb-6"></div>
          <p className="text-xl text-clover-700 max-w-3xl mx-auto text-center">
            {siteSettings?.projects?.sectionSubtitle || 'Exploring innovative solutions across web development, mobile apps, embedded systems, and AI technologies.'}
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
          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-clover-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-clover-300 rounded-full focus:outline-none focus:ring-2 focus:ring-clover-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-clover-700 text-white shadow-lg'
                    : 'bg-white/60 backdrop-blur-sm text-clover-700 hover:bg-white hover:shadow-md'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
              <h3 className="text-2xl font-bold text-center mb-8 text-clover-700">Featured Projects</h3>
            <div className="grid lg:grid-cols-2 gap-8">
              {featuredProjects.map((project, index) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  featured={true} 
                  index={index}
                  onProjectClick={handleProjectNavigation}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-center mb-8 text-clover-900">All Projects</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProjects.map((project, index) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  featured={false} 
                  index={index}
                  onProjectClick={handleProjectNavigation}
                />
              ))}
            </div>
          </motion.div>
        )}

        {filteredProjects.length === 0 && projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">No projects found</h3>
            <p className="text-gray-600">Try adjusting your search or category filter.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface ProjectCardProps {
  project: Project;
  featured: boolean;
  index: number;
  onProjectClick: (project: Project) => void;
}

function ProjectCard({ project, featured, index, onProjectClick }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    completed: 'bg-emerald-600 text-white shadow-sm',
    'in-progress': 'bg-amber-600 text-white shadow-sm',
    planned: 'bg-slate-900 text-white shadow-sm'
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('.action-button')) {
      return;
    }
    onProjectClick(project);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onClick={handleCardClick}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:scale-[1.02] ${
        featured ? 'lg:col-span-1' : ''
      }`}
    >
      {/* Project Image */}
      <div className={`relative overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
        {project.images && project.images[0] ? (
          <Image
            src={project.images[0]}
            alt={project.title}
            width={featured ? 600 : 400}
            height={featured ? 320 : 240}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-clover flex items-center justify-center">
            <div className="text-white text-6xl opacity-20">📁</div>
          </div>
        )}
        
        {/* Click to view overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span className="text-clover-700 font-medium">Click to view details</span>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {project.githubUrl && project.githubUrl.trim() && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                analytics.projectLinkClick(project.title, 'link');
              }}
              className="action-button w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-clover-700 hover:bg-white transition-colors"
            >
              <Link size={18} />
            </a>
          )}
          {project.liveUrl && project.liveUrl.trim() && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                analytics.projectLinkClick(project.title, 'live');
              }}
              className="action-button w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-clover-700 hover:bg-white transition-colors"
            >
              <ExternalLink size={18} />
            </a>
          )}
          {project.downloadUrl && project.downloadUrl.trim() && (
            <a
              href={project.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                analytics.projectLinkClick(project.title, 'download');
              }}
              className="action-button w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-clover-700 hover:bg-white transition-colors"
            >
              <Download size={18} />
            </a>
          )}
        </div>
      </div>

      {/* Project Content */}
          <div className="p-6">
        <h3 className="text-xl font-bold text-clover-900 mb-2 line-clamp-2">{project.title}</h3>
        <p className={`text-clover-700 mb-4 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
          {isExpanded ? project.longDescription || project.description : project.description}
        </p>

        {/* Technologies */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.slice(0, featured ? 6 : 4).map((tech: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1 bg-clover-100 text-clover-700 rounded-full text-sm font-medium truncate max-w-[150px]"
              title={tech}
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > (featured ? 6 : 4) && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              +{project.technologies.length - (featured ? 6 : 4)}
            </span>
          )}
        </div>

        {/* Highlights (for featured projects) */}
        {featured && project.highlights && project.highlights.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-clover-700 mb-2">Key Highlights:</h4>
            <ul className="space-y-1">
              {project.highlights.slice(0, 3).map((highlight: string, i: number) => (
                <li key={i} className="text-sm text-clover-700 flex items-start">
                  <span className="text-clover-300 mr-2 flex-shrink-0">•</span>
                  <span className="line-clamp-2">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Project Dates */}
        {getDateRangeDisplay(project) && (
          <div className="text-sm text-clover-500 mb-4">
            {getDateRangeDisplay(project)}
          </div>
        )}

        {/* Expand Button (for non-featured projects) */}
        {!featured && project.longDescription && project.longDescription !== project.description && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-clover-700 hover:text-clover-900 text-sm font-medium transition-colors"
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
