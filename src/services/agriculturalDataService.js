import axios from 'axios';

/**
 * Agricultural Data Service
 * Frontend service for consuming agricultural data from the backend API
 * Provides access to crop calendars, production calendars, and agromet advisories
 */
class AgriculturalDataService {
  constructor() {
    // Use the main server URL for agricultural data (port 3001)
    this.baseURL = 'http://localhost:3001/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
   * Get crop calendar data with optional filtering
   */
  async getCropCalendar(filters = {}) {
    try {
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
}

export default new AgriculturalDataService();