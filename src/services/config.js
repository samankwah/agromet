import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3002";

export const apiClient = axios.create({
  baseURL: baseUrl,
  timeout: 30000,
  withCredentials: true,
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = window.localStorage.getItem("donatrakAccessToken")
      ? window.localStorage.getItem("donatrakAccessToken")
      : null;

    // If a token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure proper headers for CORS
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle CORS errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: Unable to connect to server. Please check if the server is running.');
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('Authentication failed, clearing auth data...');
      localStorage.removeItem('donatrakAccessToken');
      localStorage.removeItem('currentUser');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('admin-login')) {
        window.location.href = '/admin-login';
      }
    }
    
    return Promise.reject(error);
  }
);
