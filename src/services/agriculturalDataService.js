import axios from 'axios';
import serverHealthCheck from '../utils/serverHealthCheck';

/**
 * Agricultural Data Service
 * Frontend service for consuming agricultural data from the backend API
 * Provides access to crop calendars, production calendars, and agromet advisories
 */
class AgriculturalDataService {
  constructor() {
    // Use the correct server URL for agricultural data (port 3003)
    this.baseURL = 'http://localhost:3003/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize server health monitoring
    serverHealthCheck.updateServerURL('http://localhost:3003/api');
    serverHealthCheck.startMonitoring();

    // Add request interceptor for JWT authentication
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
        console.error('Agricultural Data API Error:', error);
        // Don't redirect on 401 errors - let components handle authentication gracefully
        // This allows public access to agricultural data while preserving admin functionality
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if API call should be attempted based on server health
   * @param {string} endpoint - Optional specific endpoint to check
   * @returns {Promise<boolean>} Should attempt the API call
   */
  async shouldAttemptCall(endpoint = null) {
    const recommendation = await serverHealthCheck.shouldAttemptAPICall(endpoint);

    if (!recommendation.shouldAttempt) {
      console.warn(`🚫 Skipping API call due to server health: ${recommendation.reason}`);
      return false;
    }

    return true;
  }

  /**
   * Enhanced API call wrapper with health checking and fallback handling
   * @param {Function} apiCall - The API call function
   * @param {string} endpoint - Endpoint being called (for health checking)
   * @param {Object} fallbackData - Fallback data structure
   * @returns {Promise<Object>} API result with health metadata
   */
  async healthAwareAPICall(apiCall, endpoint, fallbackData = {}) {
    // Check server health before making the call
    const shouldAttempt = await this.shouldAttemptCall(endpoint);

    if (!shouldAttempt) {
      return {
        success: false,
        error: 'Server temporarily unavailable',
        ...fallbackData,
        metadata: {
          skippedDueToHealth: true,
          serverHealthy: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      const result = await apiCall();
      return {
        ...result,
        metadata: {
          ...result.metadata,
          serverHealthy: true,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      // Update health status on error
      await serverHealthCheck.forceHealthCheck();

      return {
        success: false,
        error: error.response?.data?.error || error.message,
        ...fallbackData,
        metadata: {
          serverHealthy: false,
          errorType: error.code || 'unknown',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get crop calendar data with optional filtering
   */
  async getCropCalendar(filters = {}) {
    return this.healthAwareAPICall(
      async () => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key]) {
            params.append(key, filters[key]);
          }
        });

        const response = await this.api.get(`/agricultural-data/crop-calendar?${params.toString()}`);
        return {
          success: true,
          data: response.data.data || [],
          total: response.data.total || 0,
          filters: response.data.filters || {}
        };
      },
      '/agricultural-data/crop-calendar',
      { data: [], total: 0, filters: {} }
    );
  }

  /**
   * Get production calendar data with optional filtering
   */
  async getProductionCalendar(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`/agricultural-data/production-calendar?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || [],
        total: response.data.total || 0,
        filters: response.data.filters || {}
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get agromet advisory data with optional filtering
   */
  async getAgrometAdvisory(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`/agricultural-data/agromet-advisory?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || [],
        total: response.data.total || 0,
        filters: response.data.filters || {}
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get poultry calendar data with optional filtering
   */
  async getPoultryCalendar(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`/agricultural-data/poultry-calendar?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || [],
        total: response.data.total || 0,
        filters: response.data.filters || {}
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get available districts from uploaded data
   */
  async getDistricts() {
    try {
      const response = await this.api.get('/agricultural-data/crop-calendar');
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: []
      };
    }
  }

  /**
   * Get available crops from uploaded data
   */
  async getCrops() {
    try {
      const response = await this.api.get('/agricultural-data/crop-calendar');
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: []
      };
    }
  }

  /**
   * Get agricultural data statistics
   */
  async getStatistics() {
    try {
      // Since the main server doesn't have a statistics endpoint, 
      // we'll determine statistics by checking each data type
      const [cropCalendars, agrometAdvisories, poultryCalendars] = await Promise.all([
        this.getCropCalendar(),
        this.getAgrometAdvisory(),
        this.getPoultryCalendar()
      ]);

      const stats = {
        cropCalendars: cropCalendars.success ? (cropCalendars.data?.length || 0) : 0,
        productionCalendars: 0, // Not implemented yet
        agrometAdvisories: agrometAdvisories.success ? (agrometAdvisories.data?.length || 0) : 0,
        poultryCalendars: poultryCalendars.success ? (poultryCalendars.data?.length || 0) : 0,
        totalRecords: 0,
        lastUpdated: new Date().toISOString()
      };

      stats.totalRecords = stats.cropCalendars + stats.agrometAdvisories + stats.poultryCalendars;

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: {
          cropCalendars: 0,
          productionCalendars: 0,
          agrometAdvisories: 0,
          poultryCalendars: 0,
          totalRecords: 0,
          lastUpdated: null
        }
      };
    }
  }

  /**
   * Get crop calendar data for a specific district
   */
  async getCropCalendarByDistrict(district) {
    return this.getCropCalendar({ district });
  }

  /**
   * Get production activities for a specific month and district
   */
  async getProductionActivities(district, month) {
    return this.getProductionCalendar({ district, month });
  }

  /**
   * Get current agromet advisories for a district
   */
  async getCurrentAdvisories(district, limit = 10) {
    const filters = { district };
    const result = await this.getAgrometAdvisory(filters);
    
    if (result.success && result.data.length > 0) {
      // Return the most recent advisories (limited)
      result.data = result.data.slice(0, limit);
    }
    
    return result;
  }

  /**
   * Get crop planting recommendations for current season
   */
  async getPlantingRecommendations(district, currentMonth) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonthName = monthNames[currentMonth - 1];
    const result = await this.getCropCalendar({ district });
    
    if (result.success) {
      // Filter crops that should be planted in the current month
      const plantingRecommendations = result.data.filter(crop => {
        return crop.plantingStart === currentMonthName || 
               crop.plantingEnd === currentMonthName ||
               (crop.plantingStart && crop.plantingEnd && 
                this.isMonthInRange(currentMonthName, crop.plantingStart, crop.plantingEnd));
      });
      
      return {
        success: true,
        data: plantingRecommendations,
        total: plantingRecommendations.length
      };
    }
    
    return result;
  }

  /**
   * Get harvest predictions for current season
   */
  async getHarvestPredictions(district, currentMonth) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonthName = monthNames[currentMonth - 1];
    const result = await this.getCropCalendar({ district });
    
    if (result.success) {
      // Filter crops that should be harvested in the current month
      const harvestPredictions = result.data.filter(crop => {
        return crop.harvestStart === currentMonthName || 
               crop.harvestEnd === currentMonthName ||
               (crop.harvestStart && crop.harvestEnd && 
                this.isMonthInRange(currentMonthName, crop.harvestStart, crop.harvestEnd));
      });
      
      return {
        success: true,
        data: harvestPredictions,
        total: harvestPredictions.length
      };
    }
    
    return result;
  }

  /**
   * Utility method to check if a month falls within a range
   */
  isMonthInRange(month, startMonth, endMonth) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthIndex = months.indexOf(month);
    const startIndex = months.indexOf(startMonth);
    const endIndex = months.indexOf(endMonth);
    
    if (startIndex === -1 || endIndex === -1 || monthIndex === -1) {
      return false;
    }
    
    // Handle ranges that cross year boundaries
    if (startIndex <= endIndex) {
      return monthIndex >= startIndex && monthIndex <= endIndex;
    } else {
      return monthIndex >= startIndex || monthIndex <= endIndex;
    }
  }

  /**
   * Format month names to ensure consistency
   */
  formatMonth(month) {
    if (typeof month === 'number') {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return monthNames[month - 1] || '';
    }
    
    if (typeof month === 'string') {
      return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    }
    
    return '';
  }

  /**
   * Get poultry calendar data for a specific district and poultry type
   */
  async getPoultryCalendarByDistrict(district, poultryType = null) {
    const filters = { district };
    if (poultryType) {
      filters.poultryType = poultryType;
    }
    return this.getPoultryCalendar(filters);
  }

  /**
   * Get poultry activities for a specific week range and district
   */
  async getPoultryActivities(district, startWeek, endWeek, poultryType = null) {
    const result = await this.getPoultryCalendarByDistrict(district, poultryType);
    
    if (result.success && result.data.length > 0) {
      // Filter activities that fall within the specified week range
      const filteredActivities = result.data.filter(activity => {
        return (activity.startWeek <= endWeek && activity.endWeek >= startWeek);
      });
      
      return {
        success: true,
        data: filteredActivities,
        total: filteredActivities.length
      };
    }
    
    return result;
  }

  /**
   * Get current poultry activities for current week
   */
  async getCurrentPoultryActivities(district, currentWeek, poultryType = null) {
    return this.getPoultryActivities(district, currentWeek, currentWeek, poultryType);
  }

  /**
   * Search across all agricultural data
   */
  async searchAll(searchTerm, filters = {}) {
    try {
      const [cropCalendar, productionCalendar, agrometAdvisory, poultryCalendar] = await Promise.all([
        this.getCropCalendar({ ...filters, crop: searchTerm }),
        this.getProductionCalendar({ ...filters, activity: searchTerm }),
        this.getAgrometAdvisory({ ...filters, crop: searchTerm }),
        this.getPoultryCalendar({ ...filters, activity: searchTerm })
      ]);

      return {
        success: true,
        data: {
          cropCalendar: cropCalendar.data,
          productionCalendar: productionCalendar.data,
          agrometAdvisory: agrometAdvisory.data,
          poultryCalendar: poultryCalendar.data
        },
        totals: {
          cropCalendar: cropCalendar.total,
          productionCalendar: productionCalendar.total,
          agrometAdvisory: agrometAdvisory.total,
          poultryCalendar: poultryCalendar.total,
          overall: cropCalendar.total + productionCalendar.total + agrometAdvisory.total + poultryCalendar.total
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {
          cropCalendar: [],
          productionCalendar: [],
          agrometAdvisory: [],
          poultryCalendar: []
        },
        totals: {
          cropCalendar: 0,
          productionCalendar: 0,
          agrometAdvisory: 0,
          poultryCalendar: 0,
          overall: 0
        }
      };
    }
  }

  // ========================================================================
  // ENHANCED CALENDAR METHODS - Phase 1.1 Implementation
  // ========================================================================

  /**
   * Get enhanced calendars with advanced filtering and intelligent data source selection
   * @param {Object} filters - Filter parameters (calendarType, commodity, regionCode, districtCode, season, year, breedType)
   * @returns {Promise<Object>} Enhanced calendar data with metadata
   */
  async getEnhancedCalendars(filters = {}) {
    return this.healthAwareAPICall(
      async () => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
            params.append(key, filters[key]);
          }
        });

        const response = await this.api.get(`/enhanced-calendars?${params.toString()}`);
        console.log('🔍 Enhanced calendars API response:', response.data);

        return {
          success: true,
          data: response.data.data || [],  // Backend sends data in response.data.data
          total: response.data.total || 0,
          filters: response.data.filters || {},
          summary: response.data.summary || {},
          metadata: {
            dataSource: 'enhanced-calendars',
            hasUploadedData: (response.data.data || []).length > 0,
            queryTime: new Date().toISOString(),
            ...response.data.metadata
          }
        };
      },
      '/enhanced-calendars',
      {
        data: [],
        total: 0,
        filters: {},
        summary: {},
        metadata: {
          dataSource: 'offline',
          hasUploadedData: false,
          queryTime: new Date().toISOString()
        }
      }
    );
  }

  /**
   * Get calendar activities for a specific calendar with week/month filtering
   * @param {string} calendarId - Calendar ID
   * @param {Object} filters - Activity filters (currentWeek, startWeek, endWeek)
   * @returns {Promise<Object>} Calendar activities data
   */
  async getCalendarActivities(calendarId, filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`/enhanced-calendars/${calendarId}/activities?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || {},
        filters: response.data.filters || {},
        metadata: {
          calendarId,
          activitiesCount: response.data.data?.activities?.length || 0,
          scheduleCount: response.data.data?.schedule?.length || 0
        }
      };
    } catch (error) {
      console.error('Calendar activities fetch error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: {},
        metadata: { calendarId, activitiesCount: 0, scheduleCount: 0 }
      };
    }
  }

  /**
   * Get production cycles with filtering
   * @param {Object} filters - Production cycle filters (status, commodity, limit)
   * @returns {Promise<Object>} Production cycles data
   */
  async getProductionCycles(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`/production-cycles?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || [],
        total: response.data.total || 0,
        summary: response.data.summary || {},
        metadata: {
          dataSource: 'production-cycles',
          queryTime: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Production cycles fetch error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: [],
        total: 0,
        metadata: {
          dataSource: 'error',
          queryTime: new Date().toISOString()
        }
      };
    }
  }


  /**
   * Get calendar data by specific region and district with intelligent data source selection
   * @param {string} regionCode - Region code
   * @param {string} districtCode - District code
   * @param {Object} additionalFilters - Additional filters (commodity, season, year)
   * @returns {Promise<Object>} Calendar data with data source information
   */
  async getCalendarByLocation(regionCode, districtCode, additionalFilters = {}) {
    try {
      const filters = {
        regionCode,
        districtCode,
        ...additionalFilters
      };

      // First try to get enhanced calendars
      const enhancedResult = await this.getEnhancedCalendars(filters);

      if (enhancedResult.success && enhancedResult.data.length > 0) {
        return {
          ...enhancedResult,
          metadata: {
            ...enhancedResult.metadata,
            dataSource: 'uploaded',
            priority: 'high',
            hasRegionalData: true
          }
        };
      }

      // If no uploaded data, try legacy endpoints
      const legacyResult = await this.getCropCalendar({ region: regionCode, district: districtCode });

      return {
        ...legacyResult,
        metadata: {
          dataSource: 'legacy',
          priority: 'medium',
          hasRegionalData: legacyResult.success && legacyResult.data.length > 0,
          queryTime: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Calendar by location fetch error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        metadata: {
          dataSource: 'error',
          priority: 'none',
          hasRegionalData: false,
          queryTime: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get available commodities from enhanced calendars
   * @returns {Promise<Object>} Available commodities list
   */
  async getAvailableCommodities() {
    try {
      const response = await this.getEnhancedCalendars();
      if (response.success) {
        const commodities = [...new Set(response.data.map(item => item.commodity).filter(Boolean))];
        return {
          success: true,
          data: commodities.sort(),
          total: commodities.length
        };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get available regions from enhanced calendars
   * @returns {Promise<Object>} Available regions list
   */
  async getAvailableRegions() {
    try {
      const response = await this.getEnhancedCalendars();
      if (response.success) {
        const regions = [...new Set(response.data.map(item => item.regionCode).filter(Boolean))];
        return {
          success: true,
          data: regions.sort(),
          total: regions.length
        };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get available districts for a specific region from enhanced calendars
   * @param {string} regionCode - Region code
   * @returns {Promise<Object>} Available districts list
   */
  async getAvailableDistricts(regionCode) {
    try {
      const response = await this.getEnhancedCalendars({ regionCode });
      if (response.success) {
        const districts = [...new Set(response.data.map(item => item.districtCode).filter(Boolean))];
        return {
          success: true,
          data: districts.sort(),
          total: districts.length,
          regionCode
        };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        regionCode
      };
    }
  }

  /**
   * Get current week activities for a production cycle
   * @param {string} cycleId - Production cycle ID
   * @returns {Promise<Object>} Current week activities
   */
  async getCurrentCycleActivities(cycleId) {
    try {
      const response = await this.api.get(`/production-cycles/${cycleId}/current-activities`);
      return {
        success: true,
        data: response.data.data || {},
        metadata: {
          cycleId,
          currentWeek: response.data.data?.currentWeek || 0,
          totalWeeks: response.data.data?.totalWeeks || 0,
          progressPercent: response.data.data?.progressPercent || 0
        }
      };
    } catch (error) {
      console.error('Current cycle activities fetch error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: {},
        metadata: { cycleId, currentWeek: 0, totalWeeks: 0, progressPercent: 0 }
      };
    }
  }

  /**
   * Enhanced search across all calendar types with intelligent ranking
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Ranked search results
   */
  async searchEnhancedCalendars(searchTerm, filters = {}) {
    try {
      const enhancedFilters = {
        ...filters,
        search: searchTerm
      };

      const response = await this.getEnhancedCalendars(enhancedFilters);

      if (response.success) {
        // Rank results by relevance
        const rankedResults = response.data.map(item => ({
          ...item,
          relevanceScore: this.calculateRelevanceScore(item, searchTerm)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);

        return {
          ...response,
          data: rankedResults,
          metadata: {
            ...response.metadata,
            searchTerm,
            resultCount: rankedResults.length,
            maxRelevance: rankedResults[0]?.relevanceScore || 0
          }
        };
      }

      return response;
    } catch (error) {
      console.error('Enhanced calendar search error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        metadata: {
          searchTerm,
          resultCount: 0,
          maxRelevance: 0
        }
      };
    }
  }

  /**
   * Calculate relevance score for search results
   * @param {Object} item - Calendar item
   * @param {string} searchTerm - Search term
   * @returns {number} Relevance score (0-100)
   */
  calculateRelevanceScore(item, searchTerm) {
    if (!searchTerm || !item) return 0;

    const term = searchTerm.toLowerCase();
    let score = 0;

    // Exact matches get highest score
    if (item.commodity && item.commodity.toLowerCase() === term) score += 50;
    if (item.title && item.title.toLowerCase().includes(term)) score += 30;

    // Partial matches get medium score
    if (item.commodity && item.commodity.toLowerCase().includes(term)) score += 25;
    if (item.regionCode && item.regionCode.toLowerCase().includes(term)) score += 15;
    if (item.districtCode && item.districtCode.toLowerCase().includes(term)) score += 15;

    // Activity matches get lower score
    if (item.activities && Array.isArray(item.activities)) {
      const activityMatches = item.activities.filter(activity =>
        activity.name && activity.name.toLowerCase().includes(term)
      ).length;
      score += Math.min(activityMatches * 5, 20);
    }

    return Math.min(score, 100);
  }

  /**
   * Get computed calendar data (backend-generated calendars)
   * @param {Object} filters - Filtering criteria
   * @returns {Promise<Object>} Computed calendar data
   */
  async getComputedCalendars(filters = {}) {
    console.log('🚫 Computed calendars disabled in Excel-only system');
    return {
      success: false,
      data: [],
      message: 'Computed calendars disabled - Excel-only system',
      metadata: {
        source: 'disabled',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get calendar metadata for filtering capabilities
   * @returns {Promise<Object>} Available metadata for filters
   */
  async getCalendarMetadata() {
    return this.healthAwareAPICall(
      async () => {
        const response = await this.api.get('/enhanced-calendars/metadata');

        return {
          success: true,
          data: {
            commodities: response.data.commodities || [],
            regions: response.data.regions || [],
            districts: response.data.districts || [],
            calendarTypes: response.data.calendarTypes || ['seasonal', 'production'],
            totalCalendars: response.data.totalCalendars || 0
          }
        };
      },
      '/enhanced-calendars/metadata',
      {
        success: false,
        data: {
          commodities: ['maize', 'rice', 'sorghum', 'tomato', 'soybean'],
          regions: [],
          districts: [],
          calendarTypes: ['seasonal', 'production'],
          totalCalendars: 0
        }
      }
    );
  }

  /**
   * Get current activities for a production cycle
   * @param {string} cycleId - Production cycle ID
   * @returns {Promise<Object>} Current activities data
   */
  async getCurrentActivities(cycleId) {
    return this.healthAwareAPICall(
      async () => {
        const response = await this.api.get(`/production-cycles/${cycleId}/current-activities`);

        return {
          success: true,
          data: response.data.data || [],
          metadata: {
            cycleId,
            timestamp: new Date().toISOString()
          }
        };
      },
      `/production-cycles/${cycleId}/current-activities`,
      { success: false, data: [] }
    );
  }

  /**
   * Create a new production cycle
   * @param {Object} cycleData - Production cycle data
   * @returns {Promise<Object>} Created production cycle
   */
  async createProductionCycle(cycleData) {
    return this.healthAwareAPICall(
      async () => {
        const response = await this.api.post('/production-cycles', cycleData);

        return {
          success: true,
          data: response.data.data || response.data,
          message: 'Production cycle created successfully'
        };
      },
      '/production-cycles',
      { success: false, message: 'Failed to create production cycle' }
    );
  }

  /**
   * Update a production cycle
   * @param {string} cycleId - Production cycle ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated production cycle
   */
  async updateProductionCycle(cycleId, updateData) {
    return this.healthAwareAPICall(
      async () => {
        const response = await this.api.put(`/production-cycles/${cycleId}`, updateData);

        return {
          success: true,
          data: response.data.data || response.data,
          message: 'Production cycle updated successfully'
        };
      },
      `/production-cycles/${cycleId}`,
      { success: false, message: 'Failed to update production cycle' }
    );
  }

  /**
   * Get specific enhanced calendar by ID
   * @param {string} calendarId - Calendar ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Calendar data
   */
  async getEnhancedCalendar(calendarId, options = {}) {
    return this.healthAwareAPICall(
      async () => {
        const params = new URLSearchParams();
        Object.keys(options).forEach(key => {
          if (options[key] !== undefined && options[key] !== null) {
            params.append(key, options[key]);
          }
        });

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await this.api.get(`/enhanced-calendars/${calendarId}${queryString}`);

        return {
          success: true,
          data: response.data.data || response.data,
          metadata: {
            calendarId,
            timestamp: new Date().toISOString()
          }
        };
      },
      `/enhanced-calendars/${calendarId}`,
      { success: false, data: null }
    );
  }
}

export default new AgriculturalDataService();