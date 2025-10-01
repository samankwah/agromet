/**
 * Server Health Check Utility
 *
 * Proactively monitors server availability to reduce redundant API calls
 * and provide better user experience during server outages.
 */
class ServerHealthCheck {
  constructor() {
    this.baseURL = 'http://localhost:3002/api'; // Fixed: Use port 3002, not 3003
    this.isServerHealthy = null; // null = unknown, true = healthy, false = unhealthy
    this.lastHealthCheck = null;
    this.healthCheckInterval = 30 * 1000; // 30 seconds
    this.quickCheckTimeout = 5000; // 5 seconds for health checks
    this.retryDelay = 10 * 1000; // 10 seconds before retrying after failure
    this.maxConsecutiveFailures = 5; // Increased: Allow more failures before circuit break
    this.consecutiveFailures = 0;
    this.circuitBreakerOpen = false; // New: Circuit breaker state
    this.circuitBreakerTimeout = null;
    this.circuitBreakerResetDelay = 60 * 1000; // 1 minute before trying again after circuit break
    this.subscribers = new Set(); // Components that want to be notified of health changes
    this.healthCheckCache = new Map();
    this.cacheExpiry = 60 * 1000; // 1 minute cache for endpoint-specific health
  }

  /**
   * Subscribe to health status changes
   * @param {Function} callback - Function to call when health status changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);

    // Immediately notify with current status
    if (this.isServerHealthy !== null) {
      callback({
        isHealthy: this.isServerHealthy,
        lastCheck: this.lastHealthCheck,
        consecutiveFailures: this.consecutiveFailures
      });
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of health status change
   * @param {Object} status - Health status information
   */
  notifySubscribers(status) {
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error notifying health check subscriber:', error);
      }
    });
  }

  /**
   * Perform a quick health check
   * @returns {Promise<Object>} Health check result
   */
  async quickHealthCheck() {
    const now = Date.now();

    // Use cached result if available and recent
    if (this.lastHealthCheck && (now - this.lastHealthCheck) < this.healthCheckInterval) {
      return {
        isHealthy: this.isServerHealthy,
        cached: true,
        lastCheck: this.lastHealthCheck,
        timeSinceLastCheck: now - this.lastHealthCheck
      };
    }

    // Circuit breaker: Don't attempt if circuit is open
    if (this.circuitBreakerOpen) {
      console.log('⏸️ Health check skipped - circuit breaker open');
      return {
        isHealthy: false,
        lastCheck: this.lastHealthCheck,
        circuitBreakerOpen: true
      };
    }

    console.log('🔍 Performing server health check...');

    try {
      // Use the dedicated health endpoint that should always return 200 when server is healthy
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.quickCheckTimeout);

      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      const isHealthy = response.status === 200;

      // Try to parse response to get additional server info
      let serverInfo = {};
      try {
        serverInfo = await response.json();
      } catch (e) {
        // If JSON parsing fails, it's still healthy if status is 200
        serverInfo = { status: 'unknown', error: 'Could not parse response' };
      }

      this.updateHealthStatus(isHealthy, now);

      // Only log health changes, not every check
      if (this.isServerHealthy !== isHealthy) {
        console.log(`✅ Server health status changed: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'} - ${serverInfo.service || 'TriAgro Server'}`);
      }

      return {
        isHealthy,
        cached: false,
        lastCheck: now,
        responseStatus: response.status,
        serverInfo,
        timeSinceLastCheck: 0
      };

    } catch (error) {
      console.warn('⚠️ Server health check failed:', error.message);
      this.updateHealthStatus(false, now);

      return {
        isHealthy: false,
        cached: false,
        lastCheck: now,
        error: error.message,
        timeSinceLastCheck: 0
      };
    }
  }

  /**
   * Update health status and notify subscribers
   * @param {boolean} isHealthy - Current health status
   * @param {number} timestamp - Timestamp of the check
   */
  updateHealthStatus(isHealthy, timestamp) {
    const wasHealthy = this.isServerHealthy;

    this.isServerHealthy = isHealthy;
    this.lastHealthCheck = timestamp;

    if (isHealthy) {
      this.consecutiveFailures = 0;
      // Reset circuit breaker if server becomes healthy
      if (this.circuitBreakerOpen) {
        console.log('✅ Circuit breaker reset - server is healthy again');
        this.circuitBreakerOpen = false;
        if (this.circuitBreakerTimeout) {
          clearTimeout(this.circuitBreakerTimeout);
          this.circuitBreakerTimeout = null;
        }
      }
    } else {
      this.consecutiveFailures++;

      // Engage circuit breaker after max consecutive failures
      if (this.consecutiveFailures >= this.maxConsecutiveFailures && !this.circuitBreakerOpen) {
        console.log(`🚨 Circuit breaker engaged - ${this.consecutiveFailures} consecutive failures`);
        this.circuitBreakerOpen = true;

        // Set timeout to reset circuit breaker
        this.circuitBreakerTimeout = setTimeout(() => {
          console.log('🔄 Circuit breaker reset timeout - will attempt health check again');
          this.circuitBreakerOpen = false;
          this.circuitBreakerTimeout = null;
        }, this.circuitBreakerResetDelay);
      }
    }

    // Notify subscribers if status changed
    if (wasHealthy !== isHealthy) {
      console.log(`🚨 Server health status changed: ${wasHealthy} → ${isHealthy}`);
      this.notifySubscribers({
        isHealthy,
        lastCheck: timestamp,
        consecutiveFailures: this.consecutiveFailures,
        statusChanged: true
      });
    }
  }

  /**
   * Check if a specific endpoint is likely to be available
   * @param {string} endpoint - Endpoint path (e.g., '/agricultural-data/crop-calendar')
   * @returns {Promise<Object>} Endpoint availability result
   */
  async checkEndpointHealth(endpoint) {
    const cacheKey = `endpoint_${endpoint}`;
    const now = Date.now();

    // Check cache first
    if (this.healthCheckCache.has(cacheKey)) {
      const cached = this.healthCheckCache.get(cacheKey);
      if (now - cached.timestamp < this.cacheExpiry) {
        return { ...cached.result, cached: true };
      }
    }

    // If we know the server is generally unhealthy, don't bother checking specific endpoints
    if (this.isServerHealthy === false && this.consecutiveFailures >= this.maxConsecutiveFailures) {
      const result = {
        isAvailable: false,
        reason: 'server-unhealthy',
        cached: false,
        generalHealthy: false
      };

      this.healthCheckCache.set(cacheKey, {
        result,
        timestamp: now
      });

      return result;
    }

    try {
      console.log(`🔍 Checking endpoint health: ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.quickCheckTimeout);

      // Construct endpoint URL
      let endpointUrl = `${this.baseURL}${endpoint}`;

      const response = await fetch(endpointUrl, {
        method: 'HEAD', // Use HEAD to avoid downloading data
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      const isAvailable = response.status < 500; // Anything except server errors
      const result = {
        isAvailable,
        cached: false,
        status: response.status,
        generalHealthy: this.isServerHealthy
      };

      this.healthCheckCache.set(cacheKey, {
        result,
        timestamp: now
      });

      console.log(`✅ Endpoint ${endpoint}: ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} (${response.status})`);

      return result;

    } catch (error) {
      console.warn(`⚠️ Endpoint health check failed for ${endpoint}:`, error.message);

      const result = {
        isAvailable: false,
        cached: false,
        error: error.message,
        generalHealthy: this.isServerHealthy
      };

      this.healthCheckCache.set(cacheKey, {
        result,
        timestamp: now
      });

      return result;
    }
  }

  /**
   * Start automatic health monitoring
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('🚀 Starting server health monitoring...');

    // Perform initial health check
    this.quickHealthCheck();

    // Set up periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.quickHealthCheck();
    }, this.healthCheckInterval);
  }

  /**
   * Stop automatic health monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Stopped server health monitoring');
    }
  }

  /**
   * Get current health status
   * @returns {Object} Current health status
   */
  getHealthStatus() {
    return {
      isHealthy: this.isServerHealthy,
      lastCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      maxFailures: this.maxConsecutiveFailures,
      timeSinceLastCheck: this.lastHealthCheck ? Date.now() - this.lastHealthCheck : null,
      isMonitoring: !!this.monitoringInterval
    };
  }

  /**
   * Force a health check (ignoring cache)
   * @returns {Promise<Object>} Health check result
   */
  async forceHealthCheck() {
    this.lastHealthCheck = null; // Clear cache
    return await this.quickHealthCheck();
  }

  /**
   * Check if we should attempt an API call based on current health
   * @param {string} endpoint - Optional specific endpoint to check
   * @returns {Promise<Object>} Recommendation object
   */
  async shouldAttemptAPICall(endpoint = null) {
    const generalHealth = await this.quickHealthCheck();

    if (endpoint) {
      const endpointHealth = await this.checkEndpointHealth(endpoint);

      return {
        shouldAttempt: endpointHealth.isAvailable,
        reason: endpointHealth.isAvailable ? 'endpoint-available' : 'endpoint-unavailable',
        fallbackRecommended: !endpointHealth.isAvailable,
        serverHealth: generalHealth,
        endpointHealth
      };
    }

    return {
      shouldAttempt: generalHealth.isHealthy,
      reason: generalHealth.isHealthy ? 'server-healthy' : 'server-unhealthy',
      fallbackRecommended: !generalHealth.isHealthy,
      serverHealth: generalHealth
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.healthCheckCache.clear();
    this.lastHealthCheck = null;
    this.isServerHealthy = null;
    console.log('🧹 Server health check cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      generalHealthCached: this.lastHealthCheck !== null,
      endpointCacheSize: this.healthCheckCache.size,
      subscriberCount: this.subscribers.size,
      isMonitoring: !!this.monitoringInterval,
      lastGeneralCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures
    };
  }

  /**
   * Update server URL (useful for development/testing)
   * @param {string} newBaseURL - New base URL
   */
  updateServerURL(newBaseURL) {
    this.baseURL = newBaseURL;
    this.clearCache();
    console.log(`🔄 Server URL updated to: ${newBaseURL}`);
  }
}

// Create singleton instance
export default new ServerHealthCheck();