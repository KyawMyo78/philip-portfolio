'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Star,
  Code,
  Database,
  Globe,
  Smartphone,
  Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../../components/ConfirmDialog';
import IconPicker from '../../../components/IconPicker';
import IconPreview from '../../../components/IconPreview';

interface Skill {
  id?: string;
  name: string;
  category: string;
  level: number; // 1-5 scale
  description?: string;
  icon?: string;
  order: number;
  yearsOfExperience?: number;
}



const categories = [
    { id: 'tools', name: 'Tools & Others', icon: Code }
];

const skillLevels = [
  { value: 1, label: 'Beginner', color: 'bg-red-100 text-red-700' },
  { value: 2, label: 'Novice', color: 'bg-orange-100 text-orange-700' },
  { value: 3, label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' },
  { value: 4, label: 'Advanced', color: 'bg-primary-100 text-primary-700' },
  { value: 5, label: 'Expert', color: 'bg-green-100 text-green-700' }
];

export default function SkillsManagement() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    // Extract custom categories from existing skills
    const existingCategories = skills.map(skill => skill.category);
    const predefinedCategoryIds = categories.map(cat => cat.id);
    const customCats = Array.from(new Set(existingCategories.filter(cat => !predefinedCategoryIds.includes(cat))));
    setCustomCategories(customCats);
  }, [skills]);

  const loadSkills = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/portfolio/skills');
      const data = await response.json();
      
      if (data.success) {
        setSkills(data.data || []);
      } else {
        toast.error('Failed to load skills');
      }
    } catch (error) {
      toast.error('Error loading skills');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      // Check if the skill has a custom category
      const isCustomCategory = !categories.some(cat => cat.id === skill.category);
      setShowCustomCategory(isCustomCategory);
    } else {
      setEditingSkill({
        name: '',
        category: 'frontend',
        level: 3,
        description: '',
        icon: 'code',
        order: skills.length,
        yearsOfExperience: 1
      });
      setShowCustomCategory(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSkill(null);
    setShowCustomCategory(false);
  };

  const handleSave = async () => {
    if (!editingSkill) return;

    // Validation
    if (!editingSkill.name.trim()) {
      toast.error('Skill name is required');
      return;
    }

    if (!editingSkill.category.trim()) {
      toast.error('Category is required');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingSkill.id 
        ? `/api/portfolio/skills/${editingSkill.id}`
        : '/api/portfolio/skills';
      
      const method = editingSkill.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSkill),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingSkill.id ? 'Skill updated successfully' : 'Skill created successfully');
        closeModal();
        loadSkills();
      } else {
        toast.error(data.error || 'Failed to save skill');
      }
    } catch (error) {
      toast.error('Error saving skill');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (skillId: string) => {
    setSkillToDelete(skillId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/portfolio/skills/${skillToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Skill deleted successfully');
        loadSkills();
      } else {
        toast.error(data.error || 'Failed to delete skill');
      }
    } catch (error) {
      toast.error('Error deleting skill');
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
      setSkillToDelete(null);
    }
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSkillToDelete(null);
    setIsDeleting(false);
  };

  const updateEditingSkill = (field: keyof Skill, value: any) => {
    if (!editingSkill) return;
    
    setEditingSkill({
      ...editingSkill,
      [field]: value
    });
  };

  const filteredSkills = activeCategory === 'all' 
    ? skills 
    : skills.filter(skill => skill.category === activeCategory);

  const groupedSkills = categories.reduce((acc, category) => {
    acc[category.id] = skills.filter(skill => skill.category === category.id);
    return acc;
  }, {} as Record<string, Skill[]>);

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
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Skills Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your technical skills and expertise levels</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors w-full sm:w-auto"
        >
          <Plus size={16} className="sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">Add Skill</span>
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="hidden sm:inline">All Skills</span>
          <span className="sm:hidden">All</span>
          <span className="ml-1">({skills.length})</span>
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 text-sm rounded-lg transition-colors whitespace-nowrap ${
              activeCategory === category.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <category.icon size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{category.name}</span>
            <span className="sm:hidden">{category.name.split(' ')[0]}</span>
            <span>({groupedSkills[category.id]?.length || 0})</span>
          </button>
        ))}
        {/* Custom Category Filters */}
        {customCategories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Code size={16} />
            {category} ({skills.filter(skill => skill.category === category).length})
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {filteredSkills.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill, index) => {
            const categoryInfo = categories.find(c => c.id === skill.category);
            const levelInfo = skillLevels.find(l => l.value === skill.level);
            const isCustomCategory = !categoryInfo;
            
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {skill.icon ? (
                      <IconPreview name={skill.icon} className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Code size={20} className="text-primary-600" />
                    )}
                    <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(skill)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => skill.id && handleDelete(skill.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Skill Level */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Proficiency</span>
                    <span className={`text-xs px-2 py-1 rounded ${levelInfo?.color}`}>
                      {levelInfo?.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <Star
                        key={level}
                        size={16}
                        className={level <= skill.level ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>

                {/* Experience */}
                {skill.yearsOfExperience && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">
                      {skill.yearsOfExperience} year{skill.yearsOfExperience !== 1 ? 's' : ''} experience
                    </span>
                  </div>
                )}

                {/* Description */}
                {skill.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{skill.description}</p>
                )}

                {/* Category Badge */}
                <div className="mt-3">
                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                    {categoryInfo?.name || skill.category}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No skills yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your technical skills and expertise.</p>
          <button
            onClick={() => openModal()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add Your First Skill
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingSkill.id ? 'Edit Skill' : 'Add New Skill'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Save Reminder Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Save className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Don't Forget to Save</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Make sure to click "{editingSkill.id ? 'Update' : 'Create'} Skill" at the bottom to save your changes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Save Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingSkill.id ? 'Update' : 'Create'} Skill
                    </>
                  )}
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Skill Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    value={editingSkill.name}
                    onChange={(e) => updateEditingSkill('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., React, Python, Arduino"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="space-y-2">
                    {!showCustomCategory ? (
                      <div className="space-y-2">
                        <select
                          value={editingSkill.category}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setShowCustomCategory(true);
                              updateEditingSkill('category', '');
                            } else {
                              updateEditingSkill('category', e.target.value);
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
                          <option value="custom">+ Add Custom Category</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={editingSkill.category}
                          onChange={(e) => updateEditingSkill('category', e.target.value)}
                          placeholder="Enter custom category name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCategory(false);
                            updateEditingSkill('category', 'frontend');
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Use predefined categories"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      You can choose from existing categories or create a custom one
                    </p>
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <IconPicker
                    value={editingSkill.icon}
                    onChange={(iconKey) => updateEditingSkill('icon', iconKey)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Choose an icon that represents this skill
                  </p>
                </div>

                {/* Proficiency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proficiency Level
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => updateEditingSkill('level', level)}
                          className="p-1"
                        >
                          <Star
                            size={20}
                            className={level <= editingSkill.level ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {skillLevels.find(l => l.value === editingSkill.level)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editingSkill.yearsOfExperience || ''}
                    onChange={(e) => updateEditingSkill('yearsOfExperience', e.target.value ? parseInt(e.target.value) : 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 3"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editingSkill.description || ''}
                    onChange={(e) => updateEditingSkill('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief description of your experience with this skill"
                  />
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
                      {editingSkill.id ? 'Update' : 'Create'} Skill
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
        title="Delete Skill"
        message="Are you sure you want to delete this skill? This action cannot be undone and will permanently remove the skill from your portfolio."
        confirmText="Delete Skill"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
}
