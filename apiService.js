import axios from "axios";

const API_BASE_URL = "https://agropulse.onrender.com";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  // Sign up user
  register: async (userData) => {
    const response = await apiClient.post("/sign-up", userData);
    return response.data;
  },

  // Sign in user
  login: async (credentials) => {
    const response = await apiClient.post("/sign-in", credentials);
    return response.data;
  },

  // Google OAuth
  googleAuth: () => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/google`;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};

export default apiClient;
