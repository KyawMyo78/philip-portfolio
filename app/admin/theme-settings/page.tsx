'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ThemeSettings() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ThemeSettingsContent />;
}

function ThemeSettingsContent() {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isChanging, setIsChanging] = useState(false);

  const handleThemeChange = async (themeId: string) => {
    if (themeId === currentTheme.id) return;
    
    setIsChanging(true);
    try {
      setTheme(themeId);
      toast.success('Theme updated successfully!');
    } catch (error) {
      toast.error('Failed to update theme');
      console.error('Theme change error:', error);
    } finally {
      setTimeout(() => setIsChanging(false), 300);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Theme Settings</h1>
          <p className="text-gray-600">
            Choose a color theme for your portfolio. Changes apply instantly and are saved automatically.
          </p>
        </div>

        {/* Current Theme Info */}
        <div className="mb-8 p-6 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-900 mb-1">
                Current Theme: {currentTheme.name}
              </h2>
              <p className="text-primary-700">{currentTheme.description}</p>
            </div>
            <div className="flex gap-2">
              <div 
                className="w-16 h-16 rounded-lg shadow-md border-2 border-white"
                style={{ backgroundColor: currentTheme.colors.primary[700] }}
                title="Primary Color"
              />
              <div 
                className="w-16 h-16 rounded-lg shadow-md border-2 border-white"
                style={{ backgroundColor: currentTheme.colors.secondary[500] }}
                title="Secondary Color"
              />
              <div 
                className="w-16 h-16 rounded-lg shadow-md border-2 border-white"
                style={{ backgroundColor: currentTheme.colors.accent[500] }}
                title="Accent Color"
              />
            </div>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => {
            const isActive = currentTheme.id === theme.id;
            
            return (
              <div
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`
                  relative p-6 border-2 rounded-xl cursor-pointer
                  transition-all duration-300 ease-in-out
                  ${isActive 
                    ? 'border-primary-600 ring-4 ring-primary-200 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                  }
                  ${isChanging ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Active
                  </div>
                )}

                {/* Theme Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {theme.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Color Swatches */}
                <div className="space-y-3">
                  {/* Primary Colors */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Primary</p>
                    <div className="flex gap-1.5">
                      {[100, 300, 500, 700, 900].map((shade) => (
                        <div
                          key={`primary-${shade}`}
                          className="w-8 h-8 rounded shadow-sm border border-gray-200"
                          style={{ 
                            backgroundColor: theme.colors.primary[shade as keyof typeof theme.colors.primary]
                          }}
                          title={`Primary ${shade}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Secondary Colors */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Secondary</p>
                    <div className="flex gap-1.5">
                      {[100, 300, 500, 700, 900].map((shade) => (
                        <div
                          key={`secondary-${shade}`}
                          className="w-8 h-8 rounded shadow-sm border border-gray-200"
                          style={{ 
                            backgroundColor: theme.colors.secondary[shade as keyof typeof theme.colors.secondary]
                          }}
                          title={`Secondary ${shade}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accent Colors */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Accent</p>
                    <div className="flex gap-1.5">
                      {[100, 300, 500, 700, 900].map((shade) => (
                        <div
                          key={`accent-${shade}`}
                          className="w-8 h-8 rounded shadow-sm border border-gray-200"
                          style={{ 
                            backgroundColor: theme.colors.accent[shade as keyof typeof theme.colors.accent]
                          }}
                          title={`Accent ${shade}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hover Instruction */}
                {!isActive && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Click to apply this theme
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">About Themes</h4>
              <p className="text-sm text-blue-700">
                Theme changes are applied instantly and saved to your browser. 
                They also sync across all your admin pages and the public portfolio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
