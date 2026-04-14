/**
 * Centralized API Configuration
 * Manages all API endpoints and base URLs using environment variables
 */

const DEV_WARNING_CACHE = new Set();

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_BASE_URL ||
  import.meta.env.VITE_AUTH_BASE_URL ||
  import.meta.env.VITE_DATA_BASE_URL ||
  import.meta.env.VITE_AI_BASE_URL ||
  'http://localhost:8000';

export const API_CONFIG = {
  BACKEND_BASE_URL: BACKEND_URL,

  // API timeout configuration
  DEFAULT_TIMEOUT: 15000,
  HEALTH_CHECK_TIMEOUT: 5000,

  TRANSLATION_BASE_URL: `${BACKEND_URL}/api/v1/translate`,
  TTS_BASE_URL: `${BACKEND_URL}/api/tts`,
  AMBEE_BASE_URL: `${BACKEND_URL}/api/ambee`,
};

API_CONFIG.AUTH_BASE_URL = API_CONFIG.BACKEND_BASE_URL;
API_CONFIG.DATA_BASE_URL = API_CONFIG.BACKEND_BASE_URL;
API_CONFIG.AI_BASE_URL = API_CONFIG.BACKEND_BASE_URL;

export const warnOnce = (key, message, details) => {
  if (!isDevelopment || DEV_WARNING_CACHE.has(key)) {
    return;
  }

  DEV_WARNING_CACHE.add(key);

  if (details !== undefined) {
    console.warn(message, details);
    return;
  }

  console.warn(message);
};

export const hasConfiguredAmbeeKey = () => true;

export const getWeatherConfigStatus = () => ({
  configured: true,
  message: '',
});

// API endpoints
export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/api/health',

  // Authentication
  AUTH: {
    BASE_PATH: '/api/v1/auth',
    SIGN_UP: '/api/v1/auth/register',
    SIGN_IN: '/api/v1/auth/login',
    PROFILE: '/api/v1/auth/me',
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

  // Market
  MARKET: {
    COMMODITIES: '/api/market/commodities',
    COMMODITY: (slug) => `/api/market/commodities/${slug}`,
    TRENDS: '/api/market/trends',
    TREND: (slug) => `/api/market/trends/${slug}`,
    REGIONS: '/api/market/regions',
    REGION: (region) => `/api/market/regions/${region}`,
  },
};

// Check if running in production
export const isProduction = import.meta.env.MODE === 'production';

// Check if running in development
export const isDevelopment = import.meta.env.MODE === 'development';

// Validate required environment variables
export const validateConfig = () => {
  const warnings = [];

  if (warnings.length > 0 && isDevelopment) {
    warnOnce('api-config-validation', 'API configuration warnings:', warnings);
  }

  return warnings;
};

// Run validation on import (only in development)
if (isDevelopment) {
  validateConfig();
}

export default API_CONFIG;
