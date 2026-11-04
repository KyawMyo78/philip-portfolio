'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Briefcase,
  Calendar,
  MapPin,
  Building,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../../components/ConfirmDialog';

interface Experience {
  id?: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  companyUrl?: string;
  order: number;
}

export default function ExperienceManagement() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/portfolio/experience');
      const data = await response.json();
      
      if (data.success) {
        setExperiences(data.data || []);
      } else {
        toast.error('Failed to load experiences');
      }
    } catch (error) {
      toast.error('Error loading experiences');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (experience?: Experience) => {
    if (experience) {
      setEditingExperience({
        ...experience,
        current: experience.current || false // Ensure current is always a boolean
      });
    } else {
      setEditingExperience({
        title: '',
        company: '',
        location: '',
        startDate: new Date().toISOString().split('T')[0],
        current: false,
        description: '',
        responsibilities: [],
        achievements: [],
        technologies: [],
        order: experiences.length
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExperience(null);
  };

  const handleSave = async () => {
    if (!editingExperience) return;

    // Validation
    if (!editingExperience.title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!editingExperience.company.trim()) {
      toast.error('Company name is required');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingExperience.id 
        ? `/api/portfolio/experience/${editingExperience.id}`
        : '/api/portfolio/experience';
      
      const method = editingExperience.id ? 'PUT' : 'POST';
      
      // Prepare data for submission
      const submissionData = { ...editingExperience };
      
      // If this is a current job, remove endDate completely
      if (submissionData.current) {
        delete submissionData.endDate;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingExperience.id ? 'Experience updated successfully' : 'Experience created successfully');
        closeModal();
        loadExperiences();
      } else {
        toast.error(data.error || 'Failed to save experience');
      }
    } catch (error) {
      toast.error('Error saving experience');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (experienceId: string) => {
    setExperienceToDelete(experienceId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!experienceToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/portfolio/experience/${experienceToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Experience deleted successfully');
        loadExperiences();
      } else {
        toast.error(data.error || 'Failed to delete experience');
      }
    } catch (error) {
      toast.error('Error deleting experience');
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
      setExperienceToDelete(null);
    }
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setExperienceToDelete(null);
    setIsDeleting(false);
  };

  const updateEditingExperience = (field: keyof Experience, value: any) => {
    if (!editingExperience) return;
    
    setEditingExperience({
      ...editingExperience,
      [field]: value
    });
  };

  const addArrayItem = (field: 'responsibilities' | 'achievements' | 'technologies', item: string) => {
    if (!editingExperience || !item.trim()) return;
    
    const array = [...editingExperience[field]];
    if (!array.includes(item.trim())) {
      array.push(item.trim());
      updateEditingExperience(field, array);
    }
  };

  const removeArrayItem = (field: 'responsibilities' | 'achievements' | 'technologies', index: number) => {
    if (!editingExperience) return;
    
    const array = [...editingExperience[field]];
    array.splice(index, 1);
    updateEditingExperience(field, array);
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
    
    // Add 1 to include both start and end months in the calculation
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth()) + 1;
    
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
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Experience Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your work experience and career history</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors w-full sm:w-auto"
        >
          <Plus size={16} className="sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">Add Experience</span>
        </button>
      </div>

      {/* Experience Timeline */}
      {experiences.length > 0 ? (
        <div className="space-y-6">
          {experiences.map((experience, index) => (
            <motion.div
              key={experience.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Briefcase className="text-primary-600 flex-shrink-0" size={20} />
                    <h3 className="text-xl font-semibold text-gray-900">{experience.title}</h3>
                    {experience.current && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded flex-shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 mb-2 text-sm">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Building size={16} className="flex-shrink-0" />
                      {experience.companyUrl ? (
                        <a 
                          href={experience.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                        >
                          {experience.company}
                          <ExternalLink size={12} className="flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="font-medium">{experience.company}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <MapPin size={16} className="flex-shrink-0" />
                      <span>{experience.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-wrap">
                      <Calendar size={16} className="flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {formatDate(experience.startDate)} - {experience.current ? 'Present' : (experience.endDate ? formatDate(experience.endDate) : 'Present')}
                      </span>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        ({calculateDuration(experience.startDate, experience.current ? undefined : experience.endDate)})
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openModal(experience)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => experience.id && handleDelete(experience.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{experience.description}</p>

              {/* Responsibilities */}
              {experience.responsibilities.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Responsibilities:</h4>
                  <ul className="space-y-1">
                    {experience.responsibilities.map((responsibility, i) => (
                      <li key={i} className="text-gray-600 flex items-start gap-2">
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Achievements */}
              {experience.achievements.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Achievements:</h4>
                  <ul className="space-y-1">
                    {experience.achievements.map((achievement, i) => (
                      <li key={i} className="text-gray-600 flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies */}
              {experience.technologies.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Technologies Used:</h4>
                  <div className="flex flex-wrap gap-2">
                    {experience.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No work experience yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first work experience.</p>
          <button
            onClick={() => openModal()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add Your First Experience
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingExperience.id ? 'Edit Experience' : 'Add New Experience'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Save Reminder Notice */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Save className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-purple-800">Don't Forget to Save</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Remember to click "{editingExperience.id ? 'Update' : 'Create'} Experience" at the bottom to save your changes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Save Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingExperience.id ? 'Update' : 'Create'} Experience
                    </>
                  )}
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={editingExperience.title}
                    onChange={(e) => updateEditingExperience('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                {/* Company and Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={editingExperience.company}
                      onChange={(e) => updateEditingExperience('company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editingExperience.location}
                      onChange={(e) => updateEditingExperience('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                </div>

                {/* Company URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={editingExperience.companyUrl || ''}
                    onChange={(e) => updateEditingExperience('companyUrl', e.target.value.trim() || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://company.com"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={editingExperience.startDate}
                      onChange={(e) => updateEditingExperience('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {!editingExperience.current && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={editingExperience.endDate || ''}
                        onChange={(e) => updateEditingExperience('endDate', e.target.value || '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>

                {/* Current Job Toggle */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="current"
                    checked={!!editingExperience.current}
                    onChange={(e) => {
                      const isCurrentJob = e.target.checked;
                      
                      setEditingExperience(prev => {
                        if (!prev) return prev;
                        const updated = {
                          ...prev,
                          current: isCurrentJob,
                          endDate: isCurrentJob ? undefined : prev.endDate
                        };
                        return updated;
                      });
                    }}
                    className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="current" className="text-sm font-medium text-gray-700 cursor-pointer">
                    I currently work here
                  </label>
                  {editingExperience.current && (
                    <span className="text-xs text-green-600 ml-2">
                      End date will not be required
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    value={editingExperience.description}
                    onChange={(e) => updateEditingExperience('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief description of your role and the company"
                  />
                </div>

                {/* Responsibilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Responsibilities
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add responsibility (press Enter)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addArrayItem('responsibilities', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      {editingExperience.responsibilities.map((responsibility, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 border border-gray-200 rounded"
                        >
                          <span className="flex-1 text-sm">{responsibility}</span>
                          <button
                            onClick={() => removeArrayItem('responsibilities', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Achievements
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add achievement (press Enter)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addArrayItem('achievements', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      {editingExperience.achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 border border-gray-200 rounded"
                        >
                          <span className="flex-1 text-sm">{achievement}</span>
                          <button
                            onClick={() => removeArrayItem('achievements', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technologies Used
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
                            addArrayItem('technologies', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editingExperience.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm"
                        >
                          {tech}
                          <button
                            onClick={() => removeArrayItem('technologies', index)}
                            className="text-primary-500 hover:text-primary-700"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
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
                      {editingExperience.id ? 'Update' : 'Create'} Experience
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
        title="Delete Experience"
        message="Are you sure you want to delete this work experience? This action cannot be undone and will permanently remove the experience from your portfolio."
        confirmText="Delete Experience"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
}
