import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import userService from '../services/userService';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('🔐 ProtectedRoute: Starting authentication check');
        const token = userService.getAuthToken();

        if (!token) {
          console.log('❌ ProtectedRoute: No token found');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        console.log('🎟️ ProtectedRoute: Token found, verifying with server');
        // Verify token is still valid by making a request to user profile
        const result = await userService.getUserProfile();

        if (result.success) {
          console.log('✅ ProtectedRoute: Authentication successful');
          setIsAuthenticated(true);
        } else {
          console.log('❌ ProtectedRoute: Authentication failed:', result.error);

          // Check if we should redirect due to expired token
          if (result.shouldRedirect) {
            console.log('🔄 ProtectedRoute: Token expired, clearing auth data');
          }

          // Token is invalid, clear auth data
          userService.clearAuthData();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ ProtectedRoute: Authentication check failed:', error);
        userService.clearAuthData();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;