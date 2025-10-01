import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import serverHealthCheck from '../../utils/serverHealthCheck';

/**
 * Server Status Indicator Component
 *
 * Displays real-time server health status and provides user feedback
 * during server outages or connectivity issues.
 */
const ServerStatusIndicator = ({
  compact = false,
  showDetails = false,
  className = "",
  onStatusChange = null
}) => {
  const [healthStatus, setHealthStatus] = useState({
    isHealthy: null,
    lastCheck: null,
    consecutiveFailures: 0,
    isMonitoring: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to health status changes
    const unsubscribe = serverHealthCheck.subscribe((status) => {
      setHealthStatus({
        isHealthy: status.isHealthy,
        lastCheck: status.lastCheck,
        consecutiveFailures: status.consecutiveFailures,
        isMonitoring: true
      });

      // Notify parent component of status changes
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

    // Get initial status
    const currentStatus = serverHealthCheck.getHealthStatus();
    setHealthStatus(currentStatus);

    return unsubscribe;
  }, [onStatusChange]);

  const handleForceCheck = async () => {
    setIsLoading(true);
    try {
      await serverHealthCheck.forceHealthCheck();
    } catch (error) {
      console.error('Force health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (healthStatus.isHealthy === null) {
      return {
        icon: Clock,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        text: 'Checking...',
        description: 'Checking server status'
      };
    }

    if (healthStatus.isHealthy) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: 'Online',
        description: 'Server is responding normally'
      };
    }

    return {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      text: 'Offline',
      description: `Server unavailable (${healthStatus.consecutiveFailures} failures)`
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const lastCheckTime = healthStatus.lastCheck
    ? new Date(healthStatus.lastCheck).toLocaleTimeString()
    : 'Never';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`p-1 rounded-full ${statusInfo.bgColor}`}>
          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
        </div>
        <span className={`text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Server Status</h3>
            <p className={`text-sm ${statusInfo.color}`}>
              {statusInfo.description}
            </p>
          </div>
        </div>

        <button
          onClick={handleForceCheck}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Last Check:</span>
              <p className="font-medium">{lastCheckTime}</p>
            </div>
            <div>
              <span className="text-gray-500">Monitoring:</span>
              <p className="font-medium">
                {healthStatus.isMonitoring ? 'Active' : 'Inactive'}
              </p>
            </div>
            {!healthStatus.isHealthy && healthStatus.consecutiveFailures > 0 && (
              <>
                <div>
                  <span className="text-gray-500">Failures:</span>
                  <p className="font-medium text-red-600">
                    {healthStatus.consecutiveFailures}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Next Retry:</span>
                  <p className="font-medium">~30 seconds</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!healthStatus.isHealthy && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800">Limited Functionality</h4>
              <p className="text-sm text-amber-700 mt-1">
                Some features may not work while the server is offline.
                We're using cached data where possible.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerStatusIndicator;