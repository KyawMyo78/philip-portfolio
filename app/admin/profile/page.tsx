'use client';

import { useState, useEffect } from 'react';
import { User, Camera, Save, Eye, FileText, Plus, X, ExternalLink } from 'lucide-react';
import IconPicker from '../../../components/IconPicker';
import IconPickerModal from '../../../components/IconPickerModal';
import IconPreview from '../../../components/IconPreview';
import FileUpload from '../../../components/FileUpload';
import { socialIcons, getSocialIcon, SocialLink } from '../../../lib/socialIcons';

interface ProfileData {
  name: string;
  nickname: string;
  title: string;
  specialization: string;
  description: string;
  subtitle?: string;
  location: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  profileImage: string;
  cvUrl: string;
  socialLinks?: SocialLink[];
  aboutDescription?: string;
  skills?: Array<{ name: string; level: number }>;
  interests?: Array<{ label: string; description: string; icon?: string }>;
  iconScroller?: Array<{ id: string; type: 'library' | 'svg'; key?: string; svgData?: string; title?: string }>;
}

export default function ProfileManager() {
  const [profile, setProfile] = useState<ProfileData>({
    name: 'John Doe',
    nickname: 'Johnny',
    title: 'Software Engineer',
    specialization: 'Frontend & Backend Development',
    description: 'Experienced developer with a passion for building scalable web applications and mentoring junior engineers.',
  aboutDescription: 'A longer About Me description for the About page. Use this to add more depth, stories, and project summaries.',
  subtitle: 'A short subtitle about you',
  skills: [
    { name: 'React/Next.js', level: 90 },
    { name: 'TypeScript', level: 85 },
  ],
  interests: [
    { label: 'Coding', description: 'Building useful apps', icon: 'code' },
    { label: 'Coffee', description: 'Keeps me going', icon: 'coffee' },
  ],
    location: 'San Francisco, CA',
    email: 'john.doe@example.com',
    phone: '+1 (555) 987-6543',
    github: 'https://github.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe',
    profileImage: '/example-profile.jpg',
    cvUrl: 'https://example.com/johndoe-cv.pdf',
    socialLinks: [
      {
        id: '1',
        name: 'Twitter',
        url: 'https://twitter.com/johndoe',
        icon: 'twitter'
      },
      {
        id: '2',
        name: 'Portfolio',
        url: 'https://johndoe.dev',
        icon: 'external'
      }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newSocialLink, setNewSocialLink] = useState<SocialLink>({
    id: '',
    name: '',
    url: '',
    icon: 'external'
  });

  // About section editable lists
  // new inputs for skills and interests
  const [newSkill, setNewSkill] = useState({ name: '', level: 50 });
  const [newInterest, setNewInterest] = useState({ label: '', description: '', icon: 'heart' });
  // Icon scroller management
  const [newScrollerItemType, setNewScrollerItemType] = useState<'library' | 'svg'>('library');
  const [newScrollerLibraryKey, setNewScrollerLibraryKey] = useState('external');
  const [newScrollerSvgData, setNewScrollerSvgData] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const result = await response.json();
        if (result.success) {
          setProfile(result.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (url: string, fileName: string) => {
    setProfile(prev => ({
      ...prev,
      profileImage: url
    }));
  };

  const handleAddSocialLink = () => {
    if (newSocialLink.name && newSocialLink.url) {
      const linkWithId = {
        ...newSocialLink,
        id: Date.now().toString()
      };
      setProfile(prev => ({
        ...prev,
        socialLinks: [...(prev.socialLinks || []), linkWithId]
      }));
      setNewSocialLink({ id: '', name: '', url: '', icon: 'external' });
    }
  };

  const handleAddSkill = () => {
    if (newSkill.name) {
      setProfile(prev => ({ ...prev, skills: [...(prev.skills || []), { ...newSkill }] }));
      setNewSkill({ name: '', level: 50 });
    }
  };

  const handleRemoveSkill = (name: string) => {
    setProfile(prev => ({ ...prev, skills: prev.skills?.filter(s => s.name !== name) || [] }));
  };

  const handleAddInterest = () => {
    if (newInterest.label) {
      setProfile(prev => ({ ...prev, interests: [...(prev.interests || []), { ...newInterest }] }));
      setNewInterest({ label: '', description: '', icon: 'heart' });
    }
  };

  const handleRemoveInterest = (label: string) => {
    setProfile(prev => ({ ...prev, interests: prev.interests?.filter(i => i.label !== label) || [] }));
  };

  // Remove by index to avoid relying on mutable labels as identifiers
  const handleRemoveInterestByIndex = (index: number) => {
    setProfile(prev => ({ ...prev, interests: (prev.interests || []).filter((_, i) => i !== index) }));
  };

  // stats removed - using highlights only


  const handleRemoveSocialLink = (id: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks?.filter(link => link.id !== id) || []
    }));
  };

  type ScrollerItem = { id: string; type: 'library' | 'svg'; key?: string; svgData?: string; title?: string };
  const handleAddScrollerItem = () => {
    const id = Date.now().toString();
    const item: ScrollerItem = newScrollerItemType === 'library'
      ? { id, type: 'library', key: newScrollerLibraryKey, title: newScrollerLibraryKey }
      : { id, type: 'svg', svgData: newScrollerSvgData, title: 'Custom SVG' };
    setProfile(prev => ({ ...prev, iconScroller: ([...(prev.iconScroller || [])] as ScrollerItem[]).concat(item) }));
    // reset
    setNewScrollerSvgData('');
    setNewScrollerLibraryKey('external');
    setNewScrollerItemType('library');
  };

  const handleRemoveScrollerItem = (id: string) => {
    setProfile(prev => ({ ...prev, iconScroller: (prev.iconScroller || []).filter((it: any) => it.id !== id) }));
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSocialLink(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        console.error('Failed to save profile:', result.message);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Profile Management</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handlePreview}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto order-2 sm:order-1"
          >
            <Eye size={16} />
            <span>Preview</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-primary-900 text-white px-3 py-2 sm:px-4 text-sm rounded-md hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto order-1 sm:order-2"
          >
            <Save size={16} />
            <span className="whitespace-nowrap">{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Profile updated successfully!
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Save Reminder Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-start">
          <Save className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Remember to Save Your Changes
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Don't forget to click "Save Changes" after making any modifications to ensure your updates are preserved.
            </p>
          </div>
        </div>
      </div>

  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Profile Image Upload */}
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <Camera className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Profile Picture</h2>
          </div>
          
          {/* Current Image Preview */}
          {profile.profileImage && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Image
              </label>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                <img
                  src={profile.profileImage}
                  alt="Current profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <FileUpload
            uploadType="profile"
            onUploadComplete={handleImageUpload}
            currentImage={profile.profileImage}
          />
        </div>

        {/* Basic Information */}
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                placeholder="Full name (e.g., Jane Doe)"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional Title
              </label>
              <input
                type="text"
                name="title"
                value={profile.title}
                onChange={handleInputChange}
                placeholder="Professional title (e.g., Senior Frontend Engineer)"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <input
                type="text"
                name="specialization"
                value={profile.specialization}
                onChange={handleInputChange}
                placeholder="Primary skills or specialization (e.g., React, Embedded)"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleInputChange}
                placeholder="City • Country or timezone (e.g., London, UK)"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                placeholder="example@example.com"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                placeholder="+123456789"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

  {/* About Section Editor */}
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About Section</h2>

          {/* About content: subtitle, interests */}
          <div className="mb-6">

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={(profile as any).subtitle || ''}
                  onChange={handleInputChange}
                  placeholder="Short subtitle (e.g., Passionate about building beautiful UIs)"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Interests editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <div className="space-y-4">
                  {(profile.interests || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-3 p-3 border border-gray-200 rounded-lg sm:flex-row sm:items-center sm:gap-2">
                      <input 
                        placeholder="Interest" 
                        className="p-2 border rounded w-full sm:w-32" 
                        value={it.label} 
                        onChange={(e) => setProfile(prev => ({ ...prev, interests: (prev.interests || []).map((item: any, i: number) => i === idx ? { ...item, label: e.target.value } : item) }))} 
                      />
                      <input 
                        placeholder="Short description" 
                        className="p-2 border rounded w-full sm:flex-1" 
                        value={it.description} 
                        onChange={(e) => setProfile(prev => ({ ...prev, interests: (prev.interests || []).map((item: any, i: number) => i === idx ? { ...item, description: e.target.value } : item) }))} 
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                          <IconPreview name={it.icon || 'heart'} className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="flex-1 sm:flex-none">
                          <IconPickerModal value={it.icon || 'heart'} onChange={(key: string) => setProfile(prev => ({ ...prev, interests: (prev.interests || []).map((item: any, i: number) => i === idx ? { ...item, icon: key } : item) }))} />
                        </div>
                        <button 
                          onClick={() => handleRemoveInterestByIndex(idx)} 
                          className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors whitespace-nowrap"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg sm:flex-row sm:items-center sm:gap-2 mt-4">
                    <input 
                      value={newInterest.label} 
                      onChange={(e) => setNewInterest(prev => ({ ...prev, label: e.target.value }))} 
                      placeholder="Interest" 
                      className="p-2 border rounded w-full sm:w-32" 
                    />
                    <input 
                      value={newInterest.description} 
                      onChange={(e) => setNewInterest(prev => ({ ...prev, description: e.target.value }))} 
                      placeholder="Description" 
                      className="p-2 border rounded w-full sm:flex-1" 
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                        <IconPreview name={newInterest.icon || 'heart'} className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <IconPickerModal value={newInterest.icon} onChange={(key: string) => setNewInterest(prev => ({ ...prev, icon: key }))} />
                      </div>
                      <button 
                        onClick={handleAddInterest} 
                        className="bg-primary-900 text-white px-3 py-2 rounded hover:bg-primary-800 transition-colors whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About Description</h2>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">Short Description (used on Home & Footer)</label>
          <textarea
            name="description"
            value={profile.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            placeholder="Short description for home and footer..."
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">Long About Description (used on About page)</label>
          <textarea
            name="aboutDescription"
            value={(profile as any).aboutDescription || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, aboutDescription: e.target.value }))}
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Detailed About Me for About page..."
          />
        </div>

        {/* Social Links */}
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <ExternalLink className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Social & Contact Links</h2>
          </div>
          
          <div className="space-y-4">
            {/* Add New Social Link */}
            <div className="grid grid-cols-1 gap-4 p-2 sm:p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newSocialLink.name}
                    onChange={handleSocialLinkChange}
                    placeholder="e.g., Twitter, Instagram, Portfolio"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={newSocialLink.url}
                    onChange={handleSocialLinkChange}
                    placeholder="https://..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <select
                    name="icon"
                    value={newSocialLink.icon}
                    onChange={(e) => setNewSocialLink(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {socialIcons.map((iconOption) => (
                      <option key={iconOption.key} value={iconOption.key}>
                        {iconOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={handleAddSocialLink}
                  disabled={!newSocialLink.name || !newSocialLink.url}
                  className="px-6 py-3 bg-primary-900 text-white rounded-md hover:bg-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </button>
              </div>
            </div>

            {/* Existing Social Links */}
            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-md font-medium text-gray-800">Current Links</h3>
                {profile.socialLinks.map((link) => {
                  const iconConfig = getSocialIcon(link.icon);
                  const IconComponent = iconConfig?.icon || ExternalLink;
                  return (
                    <div key={link.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2 sm:p-4 rounded-lg border border-gray-200 gap-2">
                      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                        <div className="shrink-0 p-2 bg-gray-100 rounded-lg">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{link.name}</p>
                          <p className="text-sm text-gray-600 truncate max-w-md">{link.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveSocialLink(link.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove link"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CV Link */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">CV/Resume Link</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV/Resume URL
              </label>
              <input
                type="url"
                name="cvUrl"
                value={profile.cvUrl}
                onChange={handleInputChange}
                placeholder="https://drive.google.com/file/d/your-cv-file-id/view or any public CV link"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {profile.cvUrl && (
              <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <FileText className="h-8 w-8 shrink-0 text-primary-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">Current CV Link</p>
                      <p className="text-xs text-gray-500 truncate max-w-md">{profile.cvUrl}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={profile.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
                    >
                      <Eye size={14} />
                      <span>Test Link</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p className="mb-2"><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Upload your CV to Google Drive, Dropbox, or any cloud storage</li>
              <li>Make sure the file is publicly accessible</li>
              <li>Copy the public/shareable link and paste it above</li>
              <li>For Google Drive: Right-click → Share → Copy link (make sure "Anyone with link" can view)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-2 sm:-mx-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <button
            onClick={handlePreview}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto order-2 sm:order-1"
          >
            <Eye size={16} />
            <span>Preview Changes</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-primary-900 text-white px-4 py-2 text-sm rounded-md hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto order-1 sm:order-2"
          >
            <Save size={16} />
            <span className="whitespace-nowrap">{loading ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
