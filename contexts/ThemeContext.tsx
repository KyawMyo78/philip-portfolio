'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeColors, themes, defaultTheme } from '@/lib/themes';

interface ThemeContextType {
  currentTheme: ThemeColors;
  setTheme: (themeId: string) => void;
  themes: ThemeColors[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(defaultTheme);

  useEffect(() => {
    
    // Try to load theme from localStorage first
    const savedThemeId = localStorage.getItem('app-theme');
    if (savedThemeId) {
      const theme = themes.find(t => t.id === savedThemeId);
      if (theme) {
        setCurrentTheme(theme);
        applyThemeToDocument(theme);
        return;
      }
    }
    
    // If no saved theme, fetch from backend
    fetchThemeFromBackend();
  }, []);

  const fetchThemeFromBackend = async () => {
    try {
      const response = await fetch('/api/admin/theme');
      if (response.ok) {
        const data = await response.json();
        if (data.themeId) {
          const theme = themes.find(t => t.id === data.themeId);
          if (theme) {
            setCurrentTheme(theme);
            applyThemeToDocument(theme);
            localStorage.setItem('app-theme', data.themeId);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch theme from backend:', error);
    }
    
    // Fallback to default theme
    applyThemeToDocument(defaultTheme);
  };

  const applyThemeToDocument = (theme: ThemeColors) => {
    const root = document.documentElement;
    
    // Apply primary colors
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });
    
    // Apply secondary colors
    Object.entries(theme.colors.secondary).forEach(([key, value]) => {
      root.style.setProperty(`--color-secondary-${key}`, value);
    });
    
    // Apply accent colors
    Object.entries(theme.colors.accent).forEach(([key, value]) => {
      root.style.setProperty(`--color-accent-${key}`, value);
    });

    // Also set clover colors for backward compatibility
    root.style.setProperty('--color-clover-900', theme.colors.primary[900]);
    root.style.setProperty('--color-clover-700', theme.colors.primary[700]);
    root.style.setProperty('--color-clover-500', theme.colors.primary[500]);
    root.style.setProperty('--color-clover-300', theme.colors.primary[300]);
    root.style.setProperty('--color-clover-100', theme.colors.primary[100]);
  };

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      applyThemeToDocument(theme);
      localStorage.setItem('app-theme', themeId);
      
      // Save to backend
      fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      }).catch(error => {
        console.error('Failed to save theme to backend:', error);
      });
    }
  };

  // Always render the same tree: swapping wrappers after mount made React rebuild the whole page
  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
