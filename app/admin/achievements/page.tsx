'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Award,
  Calendar,
  ExternalLink,
  Medal,
  Trophy,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../../components/ConfirmDialog';
import FileUpload from '../../../components/FileUpload';
import IconPickerModal from '../../../components/IconPickerModal';
import IconPreview from '../../../components/IconPreview';

interface Achievement {
  id?: string;
  title: string;
  description: string;
  category: string;
  date: string;
  issuer?: string;
  credentialId?: string;
  credentialUrl?: string;
  image?: string;
  icon?: string;
  featured: boolean;
  order: number;
}

const categories = [
  { id: 'certification', name: 'Certification', icon: Award },
  { id: 'award', name: 'Award', icon: Trophy },
  { id: 'recognition', name: 'Recognition', icon: Medal },
  { id: 'achievement', name: 'Achievement', icon: Star },
  { id: 'other', name: 'Other', icon: Award }
];

export default function AchievementsManagement() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, []);

  useEffect(() => {
    // Extract custom categories from existing achievements
    const existingCategories = achievements.map(achievement => achievement.category);
    const predefinedCategoryIds = categories.map(cat => cat.id);
    const customCats = Array.from(new Set(existingCategories.filter(cat => !predefinedCategoryIds.includes(cat))));
    setCustomCategories(customCats);
  }, [achievements]);

  const loadAchievements = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/portfolio/achievements');
      const result = await response.json();
      
      if (result.success) {
        setAchievements(result.data || []);
      } else {
        toast.error('Error loading achievements');
      }
    } catch (error) {
      toast.error('Error loading achievements');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (achievement?: Achievement) => {
    if (achievement) {
      setEditingAchievement(achievement);
      // Check if the achievement has a custom category
      const predefinedCategoryIds = categories.map(cat => cat.id);
      const isCustomCategory = !predefinedCategoryIds.includes(achievement.category);
      setShowCustomCategory(isCustomCategory);
    } else {
      setEditingAchievement({
        title: '',
        description: '',
        category: 'certification',
        date: new Date().toISOString().split('T')[0],
        icon: 'award',
        featured: false,
        order: achievements.length
      });
      setShowCustomCategory(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAchievement(null);
    setShowCustomCategory(false);
  };

  const handleSave = async () => {
    if (!editingAchievement) return;

    // Validation
    if (!editingAchievement.title.trim()) {
      toast.error('Achievement title is required');
      return;
    }
    if (!editingAchievement.description.trim()) {
      toast.error('Achievement description is required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAchievement.id) {
        // Update existing
        const response = await fetch(`/api/portfolio/achievements/${editingAchievement.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingAchievement)
        });
        
        const result = await response.json();
        if (result.success) {
          // Reload achievements from server to ensure we have the latest data
          await loadAchievements();
          toast.success('Achievement updated successfully');
        } else {
          toast.error('Error updating achievement');
        }
      } else {
        // Add new
        const response = await fetch('/api/portfolio/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingAchievement)
        });
        
        const result = await response.json();
        if (result.success) {
          const newAchievement = { ...editingAchievement, id: result.id };
          setAchievements(prev => [...prev, newAchievement]);
          toast.success('Achievement created successfully');
        } else {
          toast.error('Error creating achievement');
        }
      }
      
      closeModal();
    } catch (error) {
      toast.error('Error saving achievement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (achievementId: string) => {
    setAchievementToDelete(achievementId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!achievementToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/portfolio/achievements/${achievementToDelete}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        setAchievements(prev => prev.filter(achievement => achievement.id !== achievementToDelete));
        toast.success('Achievement deleted successfully');
      } else {
        toast.error('Error deleting achievement');
      }
    } catch (error) {
      toast.error('Error deleting achievement');
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
      setAchievementToDelete(null);
    }
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setAchievementToDelete(null);
    setIsDeleting(false);
  };

  const updateEditingAchievement = (field: keyof Achievement, value: any) => {
    if (!editingAchievement) return;
    
    setEditingAchievement({
      ...editingAchievement,
      [field]: value
    });
  };

  const handleRemoveImage = async () => {
    if (!editingAchievement?.image) return;

    try {
      await fetch('/api/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: editingAchievement.image }),
      });
      updateEditingAchievement('image', undefined);
      toast.success('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Error removing image');
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
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
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Achievements Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your certifications, awards, and recognitions</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors w-full sm:w-auto"
        >
          <Plus size={16} className="sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">Add Achievement</span>
        </button>
      </div>

      {/* Achievements Grid */}
      {achievements.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {achievements.map((achievement, index) => {
            const categoryInfo = getCategoryInfo(achievement.category);
            const CategoryIcon = categoryInfo.icon;
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Achievement Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <CategoryIcon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-primary-600 capitalize">
                          {categoryInfo.name}
                        </span>
                        {achievement.featured && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(achievement)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => achievement.id && handleDelete(achievement.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {achievement.image && (
                    <div className="mb-3 -mx-6 -mt-6">
                      <img 
                        src={achievement.image} 
                        alt={achievement.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{achievement.description}</p>
                  
                  {/* Achievement Details */}
                  <div className="space-y-2 text-sm">
                    {achievement.image && (
                      <div className="text-green-600 flex items-center">
                        <span className="text-xs">📸 Image attached</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-500">
                      <Calendar size={14} className="mr-2" />
                      {new Date(achievement.date).toLocaleDateString()}
                    </div>
                    
                    {achievement.issuer && (
                      <div className="text-gray-600">
                        <strong>Issued by:</strong> {achievement.issuer}
                      </div>
                    )}
                    
                    {achievement.credentialId && (
                      <div className="text-gray-600">
                        <strong>ID:</strong> {achievement.credentialId}
                      </div>
                    )}
                    
                    {achievement.credentialUrl && (
                      <a
                        href={achievement.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        View Credential
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No achievements yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first achievement, certification, or award.</p>
          <button
            onClick={() => openModal()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add Your First Achievement
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingAchievement.id ? 'Edit Achievement' : 'Add New Achievement'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Save Reminder Notice */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Save className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-800">Don't Forget to Save</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Remember to click "{editingAchievement.id ? 'Update' : 'Create'} Achievement" at the bottom to save your changes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Save Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingAchievement.id ? 'Update' : 'Create'} Achievement
                    </>
                  )}
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Achievement Title *
                  </label>
                  <input
                    type="text"
                    value={editingAchievement.title}
                    onChange={(e) => updateEditingAchievement('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter achievement title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={editingAchievement.description}
                    onChange={(e) => updateEditingAchievement('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe the achievement"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Achievement Image or Certificate
                  </label>
                  <FileUpload
                    uploadType="general"
                    currentImage={editingAchievement.image}
                    onUploadComplete={(url) => updateEditingAchievement('image', url)}
                    acceptedTypes="image/*,.pdf"
                    maxSize={10}
                  />
                  {editingAchievement.image && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove File
                    </button>
                  )}
                </div>

                {/* Category and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="space-y-2">
                      {!showCustomCategory ? (
                        <div className="space-y-2">
                          <select
                            value={editingAchievement.category}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setShowCustomCategory(true);
                                updateEditingAchievement('category', '');
                              } else {
                                updateEditingAchievement('category', e.target.value);
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
                            value={editingAchievement.category}
                            onChange={(e) => updateEditingAchievement('category', e.target.value)}
                            placeholder="Enter custom category name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomCategory(false);
                              updateEditingAchievement('category', 'certification');
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
                      Date Achieved
                    </label>
                    <input
                      type="date"
                      value={editingAchievement.date}
                      onChange={(e) => updateEditingAchievement('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Achievement Icon
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                      <IconPreview name={editingAchievement.icon || 'award'} className="w-6 h-6 text-gray-700" />
                    </div>
                    <IconPickerModal 
                      value={editingAchievement.icon || 'award'} 
                      onChange={(key: string) => updateEditingAchievement('icon', key)} 
                    />
                  </div>
                </div>

                {/* Issuer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    value={editingAchievement.issuer || ''}
                    onChange={(e) => updateEditingAchievement('issuer', e.target.value.trim() || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Who issued this achievement?"
                  />
                </div>

                {/* Credential Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credential ID
                    </label>
                    <input
                      type="text"
                      value={editingAchievement.credentialId || ''}
                      onChange={(e) => updateEditingAchievement('credentialId', e.target.value.trim() || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Certificate/License number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credential URL
                    </label>
                    <input
                      type="url"
                      value={editingAchievement.credentialUrl || ''}
                      onChange={(e) => updateEditingAchievement('credentialUrl', e.target.value.trim() || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://verify.example.com"
                    />
                  </div>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editingAchievement.featured}
                    onChange={(e) => updateEditingAchievement('featured', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Featured Achievement (appears prominently on portfolio)
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
                      {editingAchievement.id ? 'Update' : 'Create'} Achievement
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
        title="Delete Achievement"
        message="Are you sure you want to delete this achievement? This action cannot be undone and will permanently remove the achievement from your portfolio."
        confirmText="Delete Achievement"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
}
