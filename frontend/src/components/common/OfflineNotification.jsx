import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X, AlertTriangle } from 'lucide-react';
import serverHealthCheck from '../../utils/serverHealthCheck';

/**
 * Offline Notification Banner
 *
 * Displays a prominent notification when the server is offline
 * and provides options for users to retry or dismiss.
 */
const OfflineNotification = ({
  autoHide = false,
  autoHideDelay = 10000,
  showRetry = true,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Subscribe to health status changes
    const unsubscribe = serverHealthCheck.subscribe((status) => {
      if (status.isHealthy === false && !isDismissed) {
        setIsVisible(true);
      } else if (status.isHealthy === true) {
        setIsVisible(false);
        setIsDismissed(false);
        setRetryCount(0);
      }
    });

    return unsubscribe;
  }, [isDismissed]);

  useEffect(() => {
    if (isVisible && autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHide, autoHideDelay]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      const result = await serverHealthCheck.forceHealthCheck();

      if (result.isHealthy) {
        setIsVisible(false);
        setIsDismissed(false);
      } else {
        // Show retry feedback
        setTimeout(() => {
          setIsRetrying(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setTimeout(() => {
        setIsRetrying(false);
      }, 2000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                Server Connection Lost
              </p>
              <p className="text-sm text-red-100">
                Some features may not work properly. Using cached data where available.
                {retryCount > 0 && ` (Retry ${retryCount})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:bg-red-800 rounded-md text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-red-700 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Offline Warning
 *
 * A smaller inline component to show offline warnings within sections
 */
export const InlineOfflineWarning = ({
  message = "This data may be outdated - server offline",
  className = ""
}) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = serverHealthCheck.subscribe((status) => {
      setIsOffline(status.isHealthy === false);
    });

    // Check initial status
    const currentStatus = serverHealthCheck.getHealthStatus();
    setIsOffline(currentStatus.isHealthy === false);

    return unsubscribe;
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md ${className}`}>
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800">{message}</p>
    </div>
  );
};

export default OfflineNotification;