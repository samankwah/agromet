import axios from 'axios';

/**
 * Enhanced User Service V2
 * Compatible with the new database-enabled auth-server-v2.js
 */

class UserServiceV2 {
  constructor() {
    // Use the new auth server port
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.triagro-ai.com'  // Production URL
      : 'http://localhost:3002';       // Development URL
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // Increased timeout for file processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle authentication errors
        if (error.response?.status === 401) {
          console.log('Authentication failed, redirecting to login...');
          this.clearAuthData();
          
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes('admin-login')) {
            window.location.href = '/admin-login';
          }
        }
        
        // Handle network errors
        if (!error.response) {
          console.error('Network error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // =============================================================================
  // AUTHENTICATION METHODS
  // =============================================================================

  async signUp(userData) {
    try {
      const response = await this.api.post('/sign-up', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        organization: userData.organization,
        role: userData.role || 'user'
      });

      if (response.data.success && response.data.token) {
        this.setAuthData(response.data.token, response.data.user);
        return {
          success: true,
          data: response.data.user,
          token: response.data.token,
          message: response.data.message || 'Account created successfully'
        };
      } else {
        throw new Error(response.data.error || 'Sign up failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Sign up failed'
      };
    }
  }

  async signIn(credentials) {
    try {
      const response = await this.api.post('/sign-in', {
        email: credentials.email,
        password: credentials.password
      });

      if (response.data.success && response.data.token) {
        this.setAuthData(response.data.token, response.data.user);
        return {
          success: true,
          data: response.data.user,
          token: response.data.token,
          message: response.data.message || 'Login successful'
        };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  }

  async signOut() {
    try {
      // Note: Backend doesn't have a sign-out endpoint yet, so we just clear local data
      this.clearAuthData();
      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error) {
      console.warn('Sign out error:', error);
      this.clearAuthData(); // Clear anyway
      return {
        success: true,
        message: 'Signed out'
      };
    }
  }

  // =============================================================================
  // USER PROFILE METHODS
  // =============================================================================

  async getUserProfile() {
    try {
      const response = await this.api.get('/user/profile');
      
      if (response.data.success) {
        // Update local storage with fresh user data
        this.setAuthData(this.getAuthToken(), response.data.user);
        return {
          success: true,
          data: response.data.user
        };
      } else {
        throw new Error(response.data.error || 'Failed to get profile');
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get profile'
      };
    }
  }

  async updateUserProfile(profileData) {
    try {
      const response = await this.api.put('/user/profile', {
        name: profileData.name,
        organization: profileData.organization
      });

      if (response.data.success) {
        // Update local storage with updated user data
        this.setAuthData(this.getAuthToken(), response.data.user);
        return {
          success: true,
          data: response.data.user,
          message: response.data.message || 'Profile updated successfully'
        };
      } else {
        throw new Error(response.data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Profile update failed'
      };
    }
  }

  // =============================================================================
  // FILE UPLOAD METHODS
  // =============================================================================

  async uploadFile(file, options = {}, progressCallback = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add optional metadata
      if (options.title) formData.append('title', options.title);
      if (options.description) formData.append('description', options.description);
      if (options.tags) formData.append('tags', JSON.stringify(options.tags));

      const response = await this.api.post('/user/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            progressCallback(progress);
          }
        },
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.file,
          userStats: response.data.userStats,
          message: response.data.message || 'File uploaded successfully'
        };
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'File upload failed'
      };
    }
  }

  async uploadMultipleFiles(files, options = {}, progressCallback = null) {
    try {
      const formData = new FormData();
      
      // Add all files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Add optional metadata
      if (options.title) formData.append('title', options.title);
      if (options.description) formData.append('description', options.description);

      const response = await this.api.post('/user/files/upload-batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            progressCallback(progress);
          }
        },
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.results,
          summary: response.data.summary,
          userStats: response.data.userStats,
          message: response.data.message || 'Files uploaded successfully'
        };
      } else {
        throw new Error(response.data.error || 'Batch upload failed');
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Batch upload failed',
        summary: error.response?.data?.summary
      };
    }
  }

  // =============================================================================
  // FILE MANAGEMENT METHODS
  // =============================================================================

  async getUserFiles(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.status) params.append('status', options.status);
      if (options.contentType) params.append('contentType', options.contentType);
      if (options.search) params.append('search', options.search);

      const response = await this.api.get(`/user/files?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.files
        };
      } else {
        throw new Error(response.data.error || 'Failed to get files');
      }
    } catch (error) {
      console.error('Get files error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get files'
      };
    }
  }

  async deleteFile(fileId) {
    try {
      const response = await this.api.delete(`/user/files/${fileId}`);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'File deleted successfully'
        };
      } else {
        throw new Error(response.data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete file error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'File deletion failed'
      };
    }
  }

  // =============================================================================
  // AGRICULTURAL DATA METHODS
  // =============================================================================

  async getCropCalendar(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await this.api.get(`/api/crop-calendar?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.total,
          filters: response.data.filters
        };
      } else {
        throw new Error(response.data.error || 'Failed to get crop calendar');
      }
    } catch (error) {
      console.error('Get crop calendar error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get crop calendar'
      };
    }
  }

  async getProductionCalendar(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await this.api.get(`/api/production-calendar?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.total,
          filters: response.data.filters
        };
      } else {
        throw new Error(response.data.error || 'Failed to get production calendar');
      }
    } catch (error) {
      console.error('Get production calendar error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get production calendar'
      };
    }
  }

  async getAgrometAdvisory(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await this.api.get(`/api/agromet-advisory?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.total,
          filters: response.data.filters
        };
      } else {
        throw new Error(response.data.error || 'Failed to get agromet advisory');
      }
    } catch (error) {
      console.error('Get agromet advisory error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get agromet advisory'
      };
    }
  }

  async getCommodityAdvisory(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await this.api.get(`/api/commodity-advisory?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.total,
          filters: response.data.filters
        };
      } else {
        throw new Error(response.data.error || 'Failed to get commodity advisory');
      }
    } catch (error) {
      console.error('Get commodity advisory error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get commodity advisory'
      };
    }
  }

  // =============================================================================
  // REFERENCE DATA METHODS
  // =============================================================================

  async getRegions(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.zone) params.append('zone', filters.zone);

      const response = await this.api.get(`/api/regions?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Failed to get regions');
      }
    } catch (error) {
      console.error('Get regions error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get regions'
      };
    }
  }

  async getDistricts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.regionId) params.append('regionId', filters.regionId);
      if (filters.regionCode) params.append('regionCode', filters.regionCode);

      const response = await this.api.get(`/api/districts-detailed?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Failed to get districts');
      }
    } catch (error) {
      console.error('Get districts error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get districts'
      };
    }
  }

  async getCommodities(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);

      const response = await this.api.get(`/api/commodities?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Failed to get commodities');
      }
    } catch (error) {
      console.error('Get commodities error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get commodities'
      };
    }
  }

  async searchData(query, limit = 50) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('limit', limit);

      const response = await this.api.get(`/api/search?${params.toString()}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          query: response.data.query
        };
      } else {
        throw new Error(response.data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Search failed'
      };
    }
  }

  // =============================================================================
  // STATISTICS AND ADMIN METHODS
  // =============================================================================

  async getStatistics() {
    try {
      const response = await this.api.get('/api/statistics');
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Failed to get statistics');
      }
    } catch (error) {
      console.error('Get statistics error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get statistics'
      };
    }
  }

  // =============================================================================
  // AUTHENTICATION UTILITY METHODS
  // =============================================================================

  setAuthData(token, user) {
    if (token) {
      localStorage.setItem('donatrakAccessToken', token);
      localStorage.setItem('token', token); // Backup
    }
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  getAuthToken() {
    return localStorage.getItem('donatrakAccessToken') || localStorage.getItem('token');
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing current user:', error);
      return null;
    }
  }

  isAuthenticated() {
    const token = this.getAuthToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  clearAuthData() {
    localStorage.removeItem('donatrakAccessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/statistics`, { timeout: 5000 });
      return {
        success: true,
        status: 'connected',
        message: 'Server connection successful'
      };
    } catch (error) {
      return {
        success: false,
        status: 'disconnected',
        error: error.message
      };
    }
  }
}

// Create and export a singleton instance
const userServiceV2 = new UserServiceV2();
export default userServiceV2;