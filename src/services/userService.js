import axios from 'axios';

class UserService {
  constructor() {
    // Auth server for authentication and user management
    this.authBaseURL = 'http://localhost:3003';
    this.authAPI = axios.create({
      baseURL: this.authBaseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Main server for agricultural data and AI services
    this.dataBaseURL = 'http://localhost:3002';
    this.dataAPI = axios.create({
      baseURL: this.dataBaseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth API
    this.authAPI.interceptors.request.use(
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

    // Add request interceptor for data API
    this.dataAPI.interceptors.request.use(
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

    // Add response interceptor for auth API
    this.authAPI.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuthData();
          window.location.href = '/admin-login';
        }
        return Promise.reject(error);
      }
    );

    // Add response interceptor for data API
    this.dataAPI.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuthData();
          window.location.href = '/admin-login';
        }
        return Promise.reject(error);
      }
    );

    // Legacy support - keep this.api pointing to authAPI for backward compatibility
    this.api = this.authAPI;
    this.baseURL = this.authBaseURL;
  }

  // Authentication methods
  async signUp(userData) {
    try {
      console.log('🔐 Attempting sign-up to:', this.authBaseURL + '/sign-up');
      console.log('📝 Sign-up data:', userData);

      const response = await this.api.post('/sign-up', userData);
      console.log('✅ Sign-up response received:', response.status);

      return {
        success: true,
        data: response.data,
        message: 'Account created successfully'
      };
    } catch (error) {
      console.error('❌ Sign-up error:', error);
      console.error('📊 Error response:', error.response?.data);
      console.error('🔍 Error status:', error.response?.status);

      // Enhanced error handling with user-friendly messages
      let userMessage = 'Registration failed. Please try again.';

      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_CONNECTION_REFUSED' || error.message.includes('Network Error')) {
        userMessage = 'Unable to connect to the server. Please check your internet connection or try again later.';
      } else if (error.response?.status === 400) {
        userMessage = error.response?.data?.message || error.response?.data?.error || 'Invalid registration data. Please check your information.';
      } else if (error.response?.status === 409) {
        userMessage = 'An account with this email already exists.';
      } else if (error.response?.status >= 500) {
        userMessage = 'Server is temporarily unavailable. Please try again in a few moments.';
      } else if (error.response?.data?.message) {
        userMessage = error.response.data.message;
      }

      return {
        success: false,
        error: userMessage,
        details: error.response?.data,
        offline: error.code === 'ECONNREFUSED' || error.code === 'ERR_CONNECTION_REFUSED'
      };
    }
  }

  async signIn(credentials) {
    try {
      console.log('🔐 Attempting sign-in to:', this.authBaseURL + '/sign-in');
      console.log('📧 Email:', credentials.email);

      const response = await this.api.post('/sign-in', credentials);
      console.log('✅ Sign-in response received:', response.status);

      if (response.data?.accessToken) {
        console.log('🎟️ Access token received, storing auth data');
        this.setAuthData(response.data.accessToken, response.data.user);
        return {
          success: true,
          data: response.data,
          message: 'Login successful'
        };
      } else {
        console.error('❌ No access token in response:', response.data);
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('❌ Sign-in error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });

      let errorMessage = 'Login failed';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 403) {
        errorMessage = 'Account access denied';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else {
        errorMessage = error.response?.data?.message || error.message;
      }

      return {
        success: false,
        error: errorMessage,
        statusCode: error.response?.status
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
      const token = this.getAuthToken();
      console.log('👤 Getting user profile, token exists:', !!token);

      if (!token) {
        console.log('❌ No token found in localStorage');
        return {
          success: false,
          error: 'No authentication token found'
        };
      }

      // Try to fetch fresh profile from server
      console.log('🌐 Fetching profile from server:', this.authBaseURL + '/user/profile');
      const response = await this.api.get('/user/profile');
      console.log('✅ Profile fetched successfully:', response.status);

      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('❌ Get profile error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Handle specific error cases
      if (error.response?.status === 401) {
        console.log('🔄 Token expired or invalid, clearing auth data');
        this.clearAuthData();
        return {
          success: false,
          error: 'Authentication expired. Please log in again.',
          shouldRedirect: true
        };
      }

      if (error.response?.status === 403) {
        console.log('🚫 Access forbidden');
        return {
          success: false,
          error: 'Access denied'
        };
      }

      // If server is unreachable but we have local user data, try to use it
      const localUser = this.getCurrentUser();
      const token = this.getAuthToken();

      if (token && localUser && (error.code === 'NETWORK_ERROR' || error.response?.status >= 500)) {
        console.log('🔌 Server unreachable, using cached user data');
        return {
          success: true,
          data: localUser,
          cached: true
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
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
    console.log('📤 ========== FRONTEND UPLOAD START ==========');
    console.log('📤 uploadAgriculturalData called with:', {
      dataType,
      isFormData: formData instanceof FormData,
      baseURL: this.dataBaseURL,
      endpoint: '/api/agricultural-data/upload',
      fullURL: this.dataBaseURL + '/api/agricultural-data/upload'
    });

    try {
      // If formData is not a FormData object, handle it as before for file uploads
      if (!(formData instanceof FormData)) {
        console.log('📤 Creating new FormData from object');
        const newFormData = new FormData();
        newFormData.append('file', formData.file);
        newFormData.append('dataType', dataType);
        newFormData.append('title', formData.title || '');
        newFormData.append('description', formData.description || '');
        newFormData.append('tags', JSON.stringify(formData.tags || []));
        formData = newFormData;
      } else {
        // For crop calendar and other form submissions, add dataType
        console.log('📤 FormData already created, adding dataType');
        formData.append('dataType', dataType);
      }

      // Log FormData contents
      console.log('📤 FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`   ${pair[0]}: [FILE] ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(`   ${pair[0]}: ${pair[1]}`);
        }
      }

      // Check authentication token
      const token = this.getAuthToken();
      console.log('📤 Authentication token:', token ? `Present (${token.substring(0, 20)}...)` : 'MISSING');

      console.log('📤 Sending POST request to server...');
      const response = await this.dataAPI.post('/api/agricultural-data/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${progress}%`);
            progressCallback(progress);
          }
        },
      });

      console.log('✅ Upload successful!', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      console.log('📤 ========== FRONTEND UPLOAD END ==========');

      return {
        success: true,
        data: response.data,
        message: 'Agricultural data uploaded and processed successfully'
      };
    } catch (error) {
      console.error('❌ ========== FRONTEND UPLOAD ERROR ==========');
      console.error('❌ Upload failed:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      console.error('❌ ========== FRONTEND UPLOAD ERROR END ==========');

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getAgriculturalData(dataType, filters = {}) {
    try {
      console.log(`🔧 [USER SERVICE] getAgriculturalData called for: ${dataType}`, filters);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const url = `/api/agricultural-data/${dataType}?${params.toString()}`;
      console.log(`🔧 [USER SERVICE] Fetching from URL: ${this.dataBaseURL}${url}`);
      const response = await this.dataAPI.get(url);

      console.log(`🔧 [USER SERVICE] Raw response for ${dataType}:`, {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'N/A',
        sample: Array.isArray(response.data) ? response.data[0] : response.data
      });

      // Ensure data is always an array, regardless of backend response format
      let cleanData = response.data;

      // Handle different response formats from backend
      if (Array.isArray(cleanData)) {
        // Normal array response - clean each item
        console.log(`🔧 [USER SERVICE] Path: Direct array (${cleanData.length} items)`);
        cleanData = cleanData.map(item => this.cleanDataItem(item));
      } else if (cleanData && typeof cleanData === 'object') {
        // DEBUG: Log detailed condition checks
        console.log(`🔧 [USER SERVICE] Object response - checking conditions:`, {
          hasSuccess: 'success' in cleanData,
          successValue: cleanData.success,
          successType: typeof cleanData.success,
          hasData: 'data' in cleanData,
          dataExists: !!cleanData.data,
          isDataArray: Array.isArray(cleanData.data),
          dataLength: Array.isArray(cleanData.data) ? cleanData.data.length : 'N/A'
        });

        // Check if it's a structured API response with data property
        if (cleanData.success && cleanData.data && Array.isArray(cleanData.data)) {
          // Extract the data array from structured response
          console.log(`🔧 [USER SERVICE] Path: Structured response with success flag (${cleanData.data.length} items)`);
          cleanData = cleanData.data.map(item => this.cleanDataItem(item));
        } else if (cleanData.data && Array.isArray(cleanData.data)) {
          // Extract the data array from object response
          console.log(`🔧 [USER SERVICE] Path: Object with data array (${cleanData.data.length} items)`);
          cleanData = cleanData.data.map(item => this.cleanDataItem(item));
        } else {
          // Object response without valid data array - return empty array
          console.warn(`${dataType}: Backend returned object without valid data array`, cleanData);
          cleanData = [];
        }
      } else {
        // Any other response type - return empty array
        console.warn(`${dataType}: Backend returned unexpected data type: ${typeof cleanData}`);
        cleanData = [];
      }

      return {
        success: true,
        data: cleanData
      };
    } catch (error) {
      console.error(`Error fetching ${dataType} data:`, error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: [] // Ensure we always return an empty array on error
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
      await this.dataAPI.delete(`/api/agricultural-data/${dataType}/${recordId}`);
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

  // Create crop calendar manually (without file upload)
  async createCropCalendar(calendarData) {
    try {
      const response = await this.dataAPI.post('/api/crop-calendars/create', calendarData);
      return response.data;
    } catch (error) {
      console.error('Create crop calendar error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create crop calendar');
    }
  }

  // Get crop calendars by district
  async getCropCalendarsByDistrict(district, filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await this.dataAPI.get(`/api/crop-calendars/district/${district}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Get district calendars error:', error);
      throw new Error(error.response?.data?.message || 'Failed to retrieve district calendars');
    }
  }

  // Search crop calendars
  async searchCropCalendars(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await this.dataAPI.get(`/api/crop-calendars/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Search calendars error:', error);
      throw new Error(error.response?.data?.message || 'Failed to search calendars');
    }
  }

  // Get calendar statistics
  async getCropCalendarStats() {
    try {
      const response = await this.dataAPI.get('/api/crop-calendars/stats');
      return response.data;
    } catch (error) {
      console.error('Get calendar stats error:', error);
      throw new Error(error.response?.data?.message || 'Failed to retrieve calendar statistics');
    }
  }

  // Weekly Advisory Upload
  async uploadWeeklyAdvisory(formData, progressCallback) {
    console.log('📤 ========== WEEKLY ADVISORY UPLOAD START ==========');
    console.log('📤 uploadWeeklyAdvisory called');
    console.log('📤 Base URL:', this.dataBaseURL);
    console.log('📤 Endpoint: /api/weekly-advisories/upload');

    try {
      // Log FormData contents
      console.log('📤 FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`   ${pair[0]}: [FILE] ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(`   ${pair[0]}: ${pair[1]}`);
        }
      }

      // Check authentication token
      const token = this.getAuthToken();
      console.log('📤 Authentication token:', token ? `Present (${token.substring(0, 20)}...)` : 'MISSING');

      console.log('📤 Sending POST request to server...');
      const response = await this.dataAPI.post('/api/weekly-advisories/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${progress}%`);
            progressCallback(progress);
          }
        },
      });

      console.log('✅ Weekly advisory upload successful!', {
        status: response.status,
        data: response.data
      });
      console.log('📤 ========== WEEKLY ADVISORY UPLOAD END ==========');

      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Weekly advisory uploaded successfully'
      };
    } catch (error) {
      console.error('❌ ========== WEEKLY ADVISORY UPLOAD ERROR ==========');
      console.error('❌ Upload failed:', {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      console.error('❌ ========== WEEKLY ADVISORY UPLOAD ERROR END ==========');

      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

export default new UserService();