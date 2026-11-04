'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  ExternalLink, 
  Link,
  Download,
  Calendar,
  Tag,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import FileUpload from '../../../components/FileUpload';
import ConfirmDialog from '../../../components/ConfirmDialog';

interface Project {
  id?: string;
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
}

const categories = [
  { id: 'uiux', name: 'UI/UX Design' },
];

const statuses = [
  { id: 'completed', name: 'Completed', color: 'bg-green-100 text-green-700' },
  { id: 'in-progress', name: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'planned', name: 'Planned', color: 'bg-primary-100 text-primary-700' }
];

export default function ProjectsManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    // Extract custom categories from existing projects
    const existingCategories = projects.map(project => project.category);
    const predefinedCategoryIds = categories.map(cat => cat.id);
    const customCats = Array.from(new Set(existingCategories.filter(cat => !predefinedCategoryIds.includes(cat))));
    setCustomCategories(customCats);
  }, [projects]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/portfolio/projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data || []);
      } else {
        toast.error('Failed to load projects');
      }
    } catch (error) {
      toast.error('Error loading projects');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      // Check if the project has a custom category
      const isCustomCategory = !categories.some(cat => cat.id === project.category);
      setShowCustomCategory(isCustomCategory);
    } else {
      setEditingProject({
        title: '',
        description: '',
        longDescription: '',
        category: 'web',
        status: 'in-progress',
        featured: false,
        technologies: [],
        images: [],
        startDate: new Date().toISOString().split('T')[0],
        highlights: [],
        order: projects.length
      });
      setShowCustomCategory(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setShowCustomCategory(false);
  };

  const handleSave = async () => {
    if (!editingProject) return;

    // Validation
    if (!editingProject.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    if (!editingProject.description.trim()) {
      toast.error('Project description is required');
      return;
    }
    if (!editingProject.category.trim()) {
      toast.error('Project category is required');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingProject.id 
        ? `/api/portfolio/projects/${editingProject.id}`
        : '/api/portfolio/projects';
      
      const method = editingProject.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProject),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingProject.id ? 'Project updated successfully' : 'Project created successfully');
        closeModal();
        loadProjects();
      } else {
        toast.error(data.error || 'Failed to save project');
      }
    } catch (error) {
      toast.error('Error saving project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    setProjectToDelete(projectId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/portfolio/projects/${projectToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Project deleted successfully');
        loadProjects();
      } else {
        toast.error(data.error || 'Failed to delete project');
      }
    } catch (error) {
      toast.error('Error deleting project');
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
      setProjectToDelete(null);
    }
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setProjectToDelete(null);
    setIsDeleting(false);
  };

  const updateEditingProject = (field: keyof Project, value: any) => {
    if (!editingProject) return;
    
    setEditingProject({
      ...editingProject,
      [field]: value
    });
  };

  // Filter projects by category
  const filteredProjects = activeCategory === 'all' 
    ? projects 
    : projects.filter(project => project.category === activeCategory);

  const addTechnology = (tech: string) => {
    if (!editingProject || !tech.trim()) return;
    
    const technologies = [...editingProject.technologies];
    if (!technologies.includes(tech.trim())) {
      technologies.push(tech.trim());
      updateEditingProject('technologies', technologies);
    }
  };

  const removeTechnology = (index: number) => {
    if (!editingProject) return;
    
    const technologies = [...editingProject.technologies];
    technologies.splice(index, 1);
    updateEditingProject('technologies', technologies);
  };

  const addHighlight = (highlight: string) => {
    if (!editingProject || !highlight.trim()) return;
    
    const highlights = [...editingProject.highlights, highlight.trim()];
    updateEditingProject('highlights', highlights);
  };

  const removeHighlight = (index: number) => {
    if (!editingProject) return;
    
    const highlights = [...editingProject.highlights];
    highlights.splice(index, 1);
    updateEditingProject('highlights', highlights);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Projects Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your portfolio projects and showcase your work</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors w-full sm:w-auto"
        >
          <Plus size={16} className="sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">Add Project</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-gray-200 pb-2 sm:pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="hidden sm:inline">All Projects</span>
          <span className="sm:hidden">All</span>
          <span className="ml-1">({projects.length})</span>
        </button>
        {categories.map(category => {
          const count = projects.filter(p => p.category === category.id).length;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === category.id
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name} ({count})
            </button>
          );
        })}
        {customCategories.map(category => {
          const count = projects.filter(p => p.category === category).length;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category} ({count})
            </button>
          );
        })}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Project Image */}
              <div className="relative h-48 bg-gray-100">
                {project.images && project.images[0] ? (
                  <Image
                    src={project.images[0]}
                    alt={project.title}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    statuses.find(s => s.id === project.status)?.color
                  }`}>
                    {statuses.find(s => s.id === project.status)?.name}
                  </span>
                  {project.featured && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Project Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{project.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                
                {/* Technologies */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.technologies.slice(0, 3).map((tech, i) => (
                    <span key={i} className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs truncate max-w-[120px]" title={tech}>
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {project.githubUrl?.trim() && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Link size={16} />
                      </a>
                    )}
                    {project.liveUrl?.trim() && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    {project.downloadUrl?.trim() && (
                      <a
                        href={project.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(project)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => project.id && handleDelete(project.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first project to showcase your work.</p>
          <button
            onClick={() => openModal()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add Your First Project
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingProject.id ? 'Edit Project' : 'Add New Project'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Save Reminder Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Save className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Don't Forget to Save</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Remember to click "{editingProject.id ? 'Update' : 'Create'} Project" at the bottom to save your changes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Save Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingProject.id ? 'Update' : 'Create'} Project
                    </>
                  )}
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={editingProject.title}
                    onChange={(e) => updateEditingProject('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter project title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description *
                  </label>
                  <textarea
                    value={editingProject.description}
                    onChange={(e) => updateEditingProject('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief description for project cards"
                  />
                </div>

                {/* Long Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    value={editingProject.longDescription}
                    onChange={(e) => updateEditingProject('longDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Detailed description for featured projects"
                  />
                </div>

                {/* Category and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="space-y-2">
                      {!showCustomCategory ? (
                        <div className="space-y-2">
                          <select
                            value={editingProject.category}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setShowCustomCategory(true);
                                updateEditingProject('category', '');
                              } else {
                                updateEditingProject('category', e.target.value);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select a category</option>
                            {/* Predefined categories */}
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                            {/* Custom categories */}
                            {customCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="custom">+ Add New Category</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={editingProject.category}
                            onChange={(e) => updateEditingProject('category', e.target.value)}
                            placeholder="Enter custom category name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomCategory(false);
                              updateEditingProject('category', 'web');
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Use predefined categories"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editingProject.status}
                      onChange={(e) => updateEditingProject('status', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {statuses.map(status => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editingProject.startDate}
                      onChange={(e) => updateEditingProject('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={editingProject.endDate || ''}
                      onChange={(e) => updateEditingProject('endDate', e.target.value || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* URLs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={editingProject.githubUrl || ''}
                      onChange={(e) => updateEditingProject('githubUrl', e.target.value.trim() || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter project website or related link"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Live Website URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={editingProject.liveUrl || ''}
                      onChange={(e) => updateEditingProject('liveUrl', e.target.value.trim() || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter live website or demo link"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Download Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={editingProject.downloadUrl || ''}
                      onChange={(e) => updateEditingProject('downloadUrl', e.target.value.trim() || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter download or app store link"
                    />
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technologies
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add technology (press Enter)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTechnology(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editingProject.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm"
                        >
                          {tech}
                          <button
                            onClick={() => removeTechnology(index)}
                            className="text-primary-500 hover:text-primary-700"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Project Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Images
                  </label>
                  
                  {/* Current Images */}
                  {editingProject.images && editingProject.images.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-3 gap-3">
                        {editingProject.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Project image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              onClick={() => {
                                const newImages = [...editingProject.images];
                                newImages.splice(index, 1);
                                updateEditingProject('images', newImages);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload New Image */}
                  <FileUpload
                    uploadType="project"
                    onUploadComplete={(url) => {
                      const currentImages = editingProject.images || [];
                      updateEditingProject('images', [...currentImages, url]);
                    }}
                  />
                </div>

                {/* Highlights */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Highlights
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add highlight (press Enter)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addHighlight(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      {editingProject.highlights.map((highlight, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 border border-gray-200 rounded"
                        >
                          <span className="flex-1 text-sm">{highlight}</span>
                          <button
                            onClick={() => removeHighlight(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editingProject.featured}
                    onChange={(e) => updateEditingProject('featured', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Featured Project (appears in featured section)
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingProject.id ? 'Update' : 'Create'} Project
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={closeConfirmDialog}
        onConfirm={confirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and will permanently remove the project from your portfolio."
        confirmText="Delete Project"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
}
