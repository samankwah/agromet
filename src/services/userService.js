import axios from 'axios';

class UserService {
  constructor() {
    // Use local authentication server
    this.baseURL = 'http://localhost:3001';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('donatrakAccessToken');
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
        if (error.response?.status === 401) {
          this.clearAuthData();
          window.location.href = '/admin-login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async signUp(userData) {
    try {
      const response = await this.api.post('/sign-up', userData);
      return {
        success: true,
        data: response.data,
        message: 'Account created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  async signIn(credentials) {
    try {
      const response = await this.api.post('/sign-in', credentials);
      
      if (response.data?.accessToken) {
        this.setAuthData(response.data.accessToken, response.data.user);
        return {
          success: true,
          data: response.data,
          message: 'Login successful'
        };
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async signOut() {
    try {
      await this.api.post('/sign-out');
    } catch (error) {
      console.warn('Sign out API call failed:', error.message);
    } finally {
      this.clearAuthData();
    }
  }

  // User profile methods
  async getUserProfile() {
    try {
      // Since the backend might not have a dedicated profile endpoint,
      // we'll check if user data exists in localStorage first
      const user = this.getCurrentUser();
      if (user) {
        return {
          success: true,
          data: user
        };
      }
      
      // If no local user data, try to fetch from server
      // Note: This endpoint may not exist on the backend yet
      const response = await this.api.get('/user/profile');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // If endpoint doesn't exist but we have a token, assume user is valid
      const token = this.getAuthToken();
      const user = this.getCurrentUser();
      
      if (token && user) {
        return {
          success: true,
          data: user
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async updateUserProfile(profileData) {
    try {
      const response = await this.api.put('/user/profile', profileData);
      return {
        success: true,
        data: response.data,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // File upload methods
  async uploadFile(fileData, reportType, progressCallback) {
    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('reportType', reportType);
      formData.append('title', fileData.title || '');
      formData.append('description', fileData.description || '');
      formData.append('tags', JSON.stringify(fileData.tags || []));

      // Try different possible upload endpoints
      const possibleEndpoints = [
        '/user/files/upload',
        '/files/upload', 
        '/upload'
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of possibleEndpoints) {
        try {
          response = await this.api.post(endpoint, formData, {
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
          break; // Success, exit loop
        } catch (error) {
          lastError = error;
          if (error.response?.status !== 404) {
            // If it's not a "not found" error, don't try other endpoints
            throw error;
          }
        }
      }

      if (!response) {
        throw lastError || new Error('All upload endpoints failed');
      }

      return {
        success: true,
        data: response.data,
        message: 'File uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getUserFiles(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`/user/files?${params.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // If endpoint doesn't exist, return empty files array
      if (error.response?.status === 404) {
        return {
          success: true,
          data: []
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async deleteFile(fileId) {
    try {
      await this.api.delete(`/user/files/${fileId}`);
      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async downloadFile(fileId) {
    try {
      const response = await this.api.get(`/user/files/${fileId}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'File downloaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Reports and data methods
  async getUserReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`/user/reports?${params.toString()}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async createReport(reportData) {
    try {
      const response = await this.api.post('/user/reports', reportData);
      return {
        success: true,
        data: response.data,
        message: 'Report created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async updateReport(reportId, reportData) {
    try {
      const response = await this.api.put(`/user/reports/${reportId}`, reportData);
      return {
        success: true,
        data: response.data,
        message: 'Report updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async deleteReport(reportId) {
    try {
      await this.api.delete(`/user/reports/${reportId}`);
      return {
        success: true,
        message: 'Report deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Weather data integration
  async getUserWeatherData(location, dateRange) {
    try {
      const response = await this.api.get('/user/weather', {
        params: { location, ...dateRange }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Notifications and alerts
  async getUserNotifications() {
    try {
      const response = await this.api.get('/user/notifications');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // If endpoint doesn't exist, return empty notifications
      if (error.response?.status === 404) {
        return {
          success: true,
          data: []
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      await this.api.put(`/user/notifications/${notificationId}/read`);
      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Utility methods
  setAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('donatrakAccessToken', token); // Backup storage for compatibility
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('donatrakAccessToken');
    localStorage.removeItem('user');
  }

  getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('donatrakAccessToken');
  }

  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Dashboard statistics
  async getDashboardStats() {
    try {
      const response = await this.api.get('/user/dashboard/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // If endpoint doesn't exist, return default stats
      if (error.response?.status === 404) {
        return {
          success: true,
          data: {
            totalFiles: 0,
            totalReports: 0,
            pendingReports: 0,
            lastActivity: new Date().toISOString()
          }
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Agricultural data upload methods
  async uploadAgriculturalData(formData, dataType, progressCallback) {
    try {
      // If formData is not a FormData object, handle it as before for file uploads
      if (!(formData instanceof FormData)) {
        const newFormData = new FormData();
        newFormData.append('file', formData.file);
        newFormData.append('dataType', dataType);
        newFormData.append('title', formData.title || '');
        newFormData.append('description', formData.description || '');
        newFormData.append('tags', JSON.stringify(formData.tags || []));
        formData = newFormData;
      } else {
        // For crop calendar and other form submissions, add dataType
        formData.append('dataType', dataType);
      }

      const response = await this.api.post('/api/agricultural-data/upload', formData, {
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

      return {
        success: true,
        data: response.data,
        message: 'Agricultural data uploaded and processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getAgriculturalData(dataType, filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`/api/agricultural-data/${dataType}?${params.toString()}`);
      
      // Clean the data to extract only agricultural records and flatten complex objects
      let cleanData = response.data;
      if (Array.isArray(cleanData)) {
        cleanData = cleanData.map(item => this.cleanDataItem(item));
      }
      
      return {
        success: true,
        data: cleanData
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Helper method to clean data items and prevent object rendering issues
  cleanDataItem(item) {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const cleanedItem = {};
    
    for (const [key, value] of Object.entries(item)) {
      // Skip complex metadata objects that could cause rendering issues
      if (key === 'fileData' || key === 'metadata' || key === 'sheets') {
        continue;
      }
      
      // Convert complex objects to strings for display
      if (typeof value === 'object' && value !== null) {
        // Handle arrays
        if (Array.isArray(value)) {
          cleanedItem[key] = value.length > 0 ? value.join(', ') : '';
        } else {
          // Handle objects - convert to a readable string format
          cleanedItem[key] = this.objectToDisplayString(value);
        }
      } else {
        cleanedItem[key] = value;
      }
    }
    
    return cleanedItem;
  }

  // Convert objects to display-friendly strings
  objectToDisplayString(obj) {
    if (obj === null || obj === undefined) return '';
    
    // If it's a simple object with just a few keys, create a readable string
    const keys = Object.keys(obj);
    if (keys.length <= 3) {
      return keys.map(key => `${key}: ${obj[key]}`).join(', ');
    }
    
    // For complex objects, just stringify
    return JSON.stringify(obj);
  }

  async deleteAgriculturalData(dataType, recordId) {
    try {
      await this.api.delete(`/api/agricultural-data/${dataType}/${recordId}`);
      return {
        success: true,
        message: 'Agricultural data deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

export default new UserService();