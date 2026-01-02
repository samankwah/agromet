/**
 * Centralized API Configuration
 * Manages all API endpoints and base URLs using environment variables
 */

// Get base URLs from environment variables with fallback to localhost
export const API_CONFIG = {
  // Main data server (agricultural data, AI services)
  DATA_BASE_URL: import.meta.env.VITE_DATA_BASE_URL || 'http://localhost:3002',

  // Auth server (authentication and user management)
  AUTH_BASE_URL: import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:3003',

  // API timeout configuration
  DEFAULT_TIMEOUT: 15000,
  HEALTH_CHECK_TIMEOUT: 5000,

  // GhanaNLP API configuration
  GHANANLP_API_KEY: import.meta.env.VITE_GHANANLP_API_KEY || '',

  // Ambee API configuration
  AMBEE_API_KEY: import.meta.env.VITE_AMBEE_API_KEY || '',
};

// API endpoints
export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/api/health',

  // Authentication
  AUTH: {
    SIGN_UP: '/sign-up',
    SIGN_IN: '/sign-in',
    SIGN_OUT: '/sign-out',
    PROFILE: '/user/profile',
  },

  // Agricultural data
  AGRICULTURAL_DATA: {
    UPLOAD: '/api/agricultural-data/upload',
    GET: (dataType) => `/api/agricultural-data/${dataType}`,
    DELETE: (dataType, recordId) => `/api/agricultural-data/${dataType}/${recordId}`,
  },

  // Crop calendars
  CROP_CALENDARS: {
    CREATE: '/api/crop-calendars/create',
    BY_DISTRICT: (district) => `/api/crop-calendars/district/${district}`,
    SEARCH: '/api/crop-calendars/search',
    STATS: '/api/crop-calendars/stats',
  },

  // Weekly advisories
  WEEKLY_ADVISORIES: {
    UPLOAD: '/api/weekly-advisories/upload',
  },

  // Files
  FILES: {
    UPLOAD: '/user/files/upload',
    GET: '/user/files',
    DELETE: (fileId) => `/user/files/${fileId}`,
    DOWNLOAD: (fileId) => `/user/files/${fileId}/download`,
  },

  // Reports
  REPORTS: {
    GET: '/user/reports',
    CREATE: '/user/reports',
    UPDATE: (reportId) => `/user/reports/${reportId}`,
    DELETE: (reportId) => `/user/reports/${reportId}`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/user/dashboard/stats',
  },

  // Notifications
  NOTIFICATIONS: {
    GET: '/user/notifications',
    MARK_READ: (notificationId) => `/user/notifications/${notificationId}/read`,
  },

  // Weather
  WEATHER: {
    GET: '/user/weather',
  },
};

// Check if running in production
export const isProduction = import.meta.env.MODE === 'production';

// Check if running in development
export const isDevelopment = import.meta.env.MODE === 'development';

// Validate required environment variables
export const validateConfig = () => {
  const warnings = [];

  if (!API_CONFIG.GHANANLP_API_KEY) {
    warnings.push('VITE_GHANANLP_API_KEY is not set');
  }

  if (!API_CONFIG.AMBEE_API_KEY) {
    warnings.push('VITE_AMBEE_API_KEY is not set');
  }

  if (warnings.length > 0 && isDevelopment) {
    console.warn('API Configuration warnings:', warnings);
  }

  return warnings;
};

// Run validation on import (only in development)
if (isDevelopment) {
  validateConfig();
}

export default API_CONFIG;
