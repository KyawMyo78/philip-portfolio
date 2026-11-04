// Google Analytics utility functions for tracking events and conversions

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date | Record<string, any>,
      config?: Record<string, any>
    ) => void;
  }
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_location: url,
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Portfolio-specific tracking events
export const analytics = {
  // Contact form events
  contactFormSubmit: () => {
    trackEvent('contact_form_submit', 'engagement', 'contact_form');
  },
  
  contactFormSuccess: () => {
    trackEvent('contact_form_success', 'conversion', 'contact_form');
  },
  
  contactFormError: (error: string) => {
    trackEvent('contact_form_error', 'error', error);
  },

  // Project interactions
  projectView: (projectName: string) => {
    trackEvent('project_view', 'engagement', projectName);
  },
  
  projectLinkClick: (projectName: string, linkType: 'github' | 'live' | 'demo' | 'link' | 'download') => {
    trackEvent('project_link_click', 'engagement', `${projectName}_${linkType}`);
  },

  projectCardClick: (projectName: string) => {
    trackEvent('project_card_click', 'engagement', projectName);
  },

  // CV/Resume events
  cvDownload: () => {
    trackEvent('cv_download', 'engagement', 'resume_download');
  },
  
  cvView: () => {
    trackEvent('cv_view', 'engagement', 'resume_view');
  },

  // Social media clicks
  socialMediaClick: (platform: string) => {
    trackEvent('social_media_click', 'engagement', platform);
  },

  // Admin dashboard events (only track general usage, not sensitive data)
  adminLogin: () => {
    trackEvent('admin_login', 'admin', 'dashboard_access');
  },
  
  adminContentUpdate: (contentType: string) => {
    trackEvent('admin_content_update', 'admin', contentType);
  },

  // Scroll depth tracking
  scrollDepth: (percentage: number) => {
    trackEvent('scroll_depth', 'engagement', `${percentage}%`, percentage);
  },

  // Time on site milestones
  timeOnSite: (seconds: number) => {
    if (seconds === 30 || seconds === 60 || seconds === 120 || seconds === 300) {
      trackEvent('time_on_site', 'engagement', `${seconds}s`, seconds);
    }
  },

  // Section views (when sections come into viewport)
  sectionView: (sectionName: string) => {
    trackEvent('section_view', 'engagement', sectionName);
  },

  // Error tracking
  pageError: (error: string, page: string) => {
    trackEvent('page_error', 'error', `${page}: ${error}`);
  },

  // Performance tracking
  pageLoadTime: (loadTime: number) => {
    trackEvent('page_load_time', 'performance', 'load_time', loadTime);
  },
};
