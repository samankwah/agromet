import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';

/**
 * Custom hook for managing authentication state
 * Provides authentication status, user data, and auth methods
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const token = userService.getAuthToken();

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Verify token is still valid
      const result = await userService.getUserProfile();

      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.data);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        userService.clearAuthData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      userService.clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login method
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const result = await userService.login(credentials);
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.data.user);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout method
  const logout = useCallback(() => {
    userService.clearAuthData();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // Check if user has admin role
  const isAdmin = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'administrator';
  }, [user]);

  // Check auth status on hook initialization
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    checkAuth,
    isAdmin: isAdmin(),
  };
};

export default useAuth;