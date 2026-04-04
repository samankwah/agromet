/**
 * Unified Region & District Data Access Layer
 * 
 * This module provides a centralized, type-safe way to access region and district data
 * across the application, handling multiple data sources and formats seamlessly.
 * 
 * Key Features:
 * - Normalizes data from multiple sources (ghanaCodes.js, districts.js)
 * - Type-safe operations with runtime validation
 * - Error boundaries and fallbacks
 * - Performance optimizations with caching
 * - Developer-friendly error messages
 */

import { 
  getAllRegionNames, 
  getDistrictsByRegionName,
  GHANA_REGIONS 
} from '../data/ghanaCodes';
import { districtOfGhana } from '../districts';

// Cache for performance optimization
const cache = new Map();

/**
 * Data structure types for validation
 */
const DataTypes = {
  STRING: 'string',
  OBJECT_WITH_CODE_NAME: 'object_with_code_name',
  OBJECT_WITH_NAME_REGION: 'object_with_name_region',
  UNKNOWN: 'unknown'
};

/**
 * Detects the data structure type of district data
 * @param {any} data - Data to analyze
 * @returns {string} DataTypes enum value
 */
export const detectDataStructure = (data) => {
  if (!data) return DataTypes.UNKNOWN;
  
  if (typeof data === 'string') {
    return DataTypes.STRING;
  }
  
  if (typeof data === 'object') {
    if (Object.prototype.hasOwnProperty.call(data, 'code') && Object.prototype.hasOwnProperty.call(data, 'name')) {
      return DataTypes.OBJECT_WITH_CODE_NAME;
    }
    if (Object.prototype.hasOwnProperty.call(data, 'name') && Object.prototype.hasOwnProperty.call(data, 'region')) {
      return DataTypes.OBJECT_WITH_NAME_REGION;
    }
  }
  
  return DataTypes.UNKNOWN;
};

/**
 * Normalizes district data to a consistent format
 * @param {any} district - District data in any format
 * @returns {Object} Normalized district object with {code, name, display}
 */
export const normalizeDistrictData = (district) => {
  const type = detectDataStructure(district);
  
  switch (type) {
    case DataTypes.STRING:
      return {
        code: district,
        name: district,
        display: district,
        source: 'legacy'
      };
      
    case DataTypes.OBJECT_WITH_CODE_NAME:
      return {
        code: district.code,
        name: district.name,
        display: district.name,
        source: 'ghanaCodes'
      };
      
    case DataTypes.OBJECT_WITH_NAME_REGION:
      return {
        code: district.name, // Use name as code for legacy compatibility
        name: district.name,
        display: district.name,
        region: district.region,
        source: 'districts'
      };
      
    default:
      console.error('Unknown district data structure:', district);
      return {
        code: 'unknown',
        name: 'Unknown District',
        display: 'Unknown District',
        source: 'error',
        error: true
      };
  }
};

/**
 * Safely gets districts for a region from multiple data sources
 * @param {string} regionName - Name of the region
 * @param {Object} options - Configuration options
 * @returns {Array} Normalized district array
 */
export const getSafeDistrictsByRegion = (regionName, options = {}) => {
  const { 
    preferNewData = true, 
    fallbackToLegacy = true,
    enableCaching = true 
  } = options;
  
  const cacheKey = `districts_${regionName}_${preferNewData}_${fallbackToLegacy}`;
  
  // Check cache first
  if (enableCaching && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  let districts = [];
  let dataSource = 'none';
  
  try {
    // Try new data source first (ghanaCodes.js)
    if (preferNewData) {
      const newFormatDistricts = getDistrictsByRegionName(regionName);
      if (Array.isArray(newFormatDistricts) && newFormatDistricts.length > 0) {
        districts = newFormatDistricts.map(normalizeDistrictData);
        dataSource = 'ghanaCodes';
      }
    }
    
    // Fallback to legacy data source (districts.js) if needed
    if (districts.length === 0 && fallbackToLegacy) {
      const legacyData = districtOfGhana
        .filter(item => item.region === regionName)
        .map(item => item.name);
      
      if (legacyData.length > 0) {
        districts = legacyData.map(normalizeDistrictData);
        dataSource = 'legacy';
      }
    }
    
    // Add metadata
    const result = {
      districts,
      meta: {
        regionName,
        count: districts.length,
        dataSource,
        hasErrors: districts.some(d => d.error),
        timestamp: Date.now()
      }
    };
    
    // Cache the result
    if (enableCaching && districts.length > 0) {
      cache.set(cacheKey, result);
      
      // Auto-cleanup cache after 5 minutes
      setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error getting districts for region:', regionName, error);
    return {
      districts: [],
      meta: {
        regionName,
        count: 0,
        dataSource: 'error',
        hasErrors: true,
        error: error.message,
        timestamp: Date.now()
      }
    };
  }
};

/**
 * Gets all regions in a safe, normalized format
 * @param {Object} options - Configuration options
 * @returns {Array} Array of normalized region objects
 */
export const getSafeRegions = (options = {}) => {
  const { includeDistrictCount = false, enableCaching = true } = options;
  
  const cacheKey = `regions_${includeDistrictCount}`;
  
  if (enableCaching && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  try {
    const regions = getAllRegionNames().map(regionName => {
      const region = {
        name: regionName,
        display: regionName,
        code: Object.values(GHANA_REGIONS).find(r => r.name === regionName)?.code || regionName
      };
      
      if (includeDistrictCount) {
        const { districts } = getSafeDistrictsByRegion(regionName, { enableCaching: false });
        region.districtCount = districts.length;
      }
      
      return region;
    });
    
    const result = {
      regions,
      meta: {
        count: regions.length,
        includesDistrictCount: includeDistrictCount,
        timestamp: Date.now()
      }
    };
    
    if (enableCaching) {
      cache.set(cacheKey, result);
      setTimeout(() => cache.delete(cacheKey), 10 * 60 * 1000); // 10 minute cache
    }
    
    return result;
    
  } catch (error) {
    console.error('Error getting regions:', error);
    return {
      regions: [],
      meta: {
        count: 0,
        includesDistrictCount: false,
        error: error.message,
        timestamp: Date.now()
      }
    };
  }
};

/**
 * Validates region and district combination
 * @param {string} regionName - Region name
 * @param {string} districtName - District name
 * @returns {Object} Validation result
 */
export const validateRegionDistrictPair = (regionName, districtName) => {
  if (!regionName || !districtName) {
    return {
      isValid: false,
      error: 'Both region and district must be provided',
      regionExists: !!regionName,
      districtExists: !!districtName,
      districtInRegion: false
    };
  }
  
  try {
    const { districts, meta } = getSafeDistrictsByRegion(regionName);
    const districtExists = districts.some(d => 
      d.name === districtName || d.code === districtName || d.display === districtName
    );
    
    return {
      isValid: districtExists,
      regionExists: true,
      districtExists: true,
      districtInRegion: districtExists,
      dataSource: meta.dataSource,
      error: districtExists ? null : `District "${districtName}" not found in region "${regionName}"`
    };
    
  } catch (error) {
    return {
      isValid: false,
      regionExists: false,
      districtExists: false,
      districtInRegion: false,
      error: `Validation error: ${error.message}`
    };
  }
};

/**
 * Development helper: logs data source usage statistics
 */
export const getDataSourceStats = () => {
  const stats = {
    cacheSize: cache.size,
    cacheKeys: Array.from(cache.keys()),
    dataSources: {},
    timestamp: Date.now()
  };
  
  // Analyze cached data sources
  for (const [, value] of cache.entries()) {
    if (value.meta && value.meta.dataSource) {
      const source = value.meta.dataSource;
      stats.dataSources[source] = (stats.dataSources[source] || 0) + 1;
    }
  }
  
  return stats;
};

/**
 * Clears all cached data (useful for development/testing)
 */
export const clearCache = () => {
  const size = cache.size;
  cache.clear();
  console.log(`Cleared ${size} cached entries`);
  return size;
};

/**
 * Error boundary utility for React components
 */
export class RegionDistrictError extends Error {
  constructor(message, data = {}) {
    super(message);
    this.name = 'RegionDistrictError';
    this.data = data;
    this.timestamp = Date.now();
  }
}

// Development mode warnings  
try {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    console.log('🗺️  Region/District Helper initialized in development mode');
  
    // Auto-log cache stats every 30 seconds in development
    setInterval(() => {
      const stats = getDataSourceStats();
      if (stats.cacheSize > 0) {
        console.log('📊 Region/District Cache Stats:', stats);
      }
    }, 30000);
  }
} catch (e) {
  // Ignore process access errors in browser environment
}

export default {
  getSafeDistrictsByRegion,
  getSafeRegions,
  normalizeDistrictData,
  validateRegionDistrictPair,
  detectDataStructure,
  getDataSourceStats,
  clearCache,
  RegionDistrictError
};