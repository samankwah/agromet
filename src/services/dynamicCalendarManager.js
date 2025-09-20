import agriculturalDataService from './agriculturalDataService';
import weatherCalendarIntegration from './weatherCalendarIntegration';
import sophisticatedCalendarParser from '../utils/sophisticatedCalendarParser';

/**
 * Dynamic Calendar Data Manager
 *
 * Provides unified calendar data management with intelligent data source selection,
 * seamless switching between uploaded and template data, and performance optimization.
 *
 * Data Source Priority:
 * 1. Uploaded calendar data (highest priority)
 * 2. Computed calendar based on regional climate data
 * 3. Default template data (fallback)
 *
 * @class DynamicCalendarManager
 */
class DynamicCalendarManager {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.fallbackTemplates = null;
    this.isInitialized = false;
    this.calendarParser = sophisticatedCalendarParser;
  }

  /**
   * Initialize the manager with fallback templates
   * @param {Object} templates - Default template data
   */
  async initialize(templates = null) {
    if (this.isInitialized) return;

    this.fallbackTemplates = templates;
    this.isInitialized = true;

    console.log('🚀 Dynamic Calendar Manager initialized');
  }

  /**
   * Get calendar data with intelligent source selection
   * @param {Object} filters - Calendar filters
   * @param {Object} options - Options for data retrieval
   * @param {boolean} options.strictMode - Only return uploaded/computed data, no template fallback
   * @returns {Promise<Object>} Calendar data with metadata
   */
  async getCalendarData(filters = {}, options = {}) {
    const { strictMode = false } = options;
    const cacheKey = this.generateCacheKey('calendar', filters);

    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      console.log('📋 Returning cached calendar data');
      return cachedResult;
    }

    try {
      console.log('🔍 Fetching calendar data with filters:', filters);

      // Priority 1: Try enhanced calendars (uploaded data)
      const enhancedResult = await this.getEnhancedCalendarData(filters);
      if (enhancedResult.success && enhancedResult.data.length > 0) {
        console.log('✅ Using uploaded calendar data');
        enhancedResult.metadata.dataSourceUsed = 'uploaded';
        enhancedResult.metadata.priority = 1;
        enhancedResult.metadata.strictMode = strictMode;

        // Apply weather adjustments if region is provided
        const weatherAdjustedResult = await this.applyWeatherAdjustments(enhancedResult, filters);
        this.setCache(cacheKey, weatherAdjustedResult);
        return weatherAdjustedResult;
      }

      // Excel-only system: No computed calendars or templates
      console.log('🚫 Excel-only system: No uploaded data found for filters');
      return {
        success: false,
        message: 'No uploaded calendar data found for the selected filters',
        data: [],
        metadata: {
          dataSourceUsed: 'no-data',
          priority: 0,
          strictMode: true,
          queryTime: new Date().toISOString(),
          searchedSources: ['uploaded-only']
        }
      };

    } catch (error) {
      console.error('❌ Calendar data fetch error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        metadata: {
          dataSourceUsed: 'error',
          priority: 0,
          queryTime: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get enhanced calendar data from uploaded files
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Enhanced calendar data
   */
  async getEnhancedCalendarData(filters) {
    try {
      const result = await agriculturalDataService.getEnhancedCalendars(filters);

      if (result.success && result.data.length > 0) {
        // Transform enhanced data to standardized format
        const transformedData = this.transformEnhancedToStandard(result.data);

        return {
          ...result,
          data: transformedData,
          metadata: {
            ...result.metadata,
            transformationType: 'enhanced-to-standard',
            originalCount: result.data.length,
            transformedCount: transformedData.length
          }
        };
      }

      return result;
    } catch (error) {
      console.error('Enhanced calendar data error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get computed calendar data based on climate and regional factors
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Computed calendar data
   */
  async getComputedCalendarData(filters) {
    try {
      // Excel-only system - no climate computations
      return {
        success: false,
        data: [],
        metadata: {
          dataSource: 'disabled',
          reason: 'Excel-only system - no computed calendars',
          disabledAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Computed calendar data error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Template calendar data disabled in Excel-only system
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Disabled template message
   */
  async getTemplateCalendarData(filters) {
    console.log('🚫 Template calendar data disabled in Excel-only system');
    return {
      success: false,
      data: [],
      message: 'Template calendar data disabled - Excel-only system',
      metadata: {
        dataSource: 'disabled',
        reason: 'Excel-only system',
        timestamp: new Date().toISOString()
      }
    };
  }


  /**
   * Transform enhanced calendar data to standardized format
   * @param {Array} enhancedData - Enhanced calendar data
   * @returns {Array} Standardized calendar activities
   */
  transformEnhancedToStandard(enhancedData) {
    console.log('🔄 transformEnhancedToStandard called with:', enhancedData?.length, 'calendars');
    console.log('📋 Enhanced data structure:', enhancedData);

    if (!enhancedData || !Array.isArray(enhancedData)) {
      console.error('❌ Invalid enhanced data - not an array:', enhancedData);
      return [];
    }

    const allActivities = enhancedData.flatMap((calendar, index) => {
      console.log(`\n📅 Processing calendar ${index + 1}/${enhancedData.length}:`, {
        id: calendar.id,
        region: calendar.region,
        district: calendar.district,
        crop: calendar.crop,
        hasActivities: !!calendar.activities,
        hasFileData: !!calendar.fileData,
        hasSheets: !!(calendar.fileData && calendar.fileData.sheets)
      });

      // If calendar already has activities, use them directly
      if (calendar.activities && Array.isArray(calendar.activities)) {
        console.log('✅ Calendar has pre-processed activities:', calendar.activities.length);
        return calendar.activities.map(activity => ({
          activity: activity.name || activity.activity || 'Unknown Activity',
          start: this.extractStartTime(activity, calendar),
          end: this.extractEndTime(activity, calendar),
          color: this.generateActivityColor(activity),
          advisory: activity.description || activity.advisory || this.generateBasicAdvisory(activity),
          calendarId: calendar.id,
          commodity: calendar.commodity,
          regionCode: calendar.regionCode,
          districtCode: calendar.districtCode,
          season: calendar.season,
          metadata: {
            source: 'uploaded',
            calendarType: calendar.calendarType,
            originalId: activity.id
          }
        }));
      }

      // If calendar has raw Excel data, parse it
      if (calendar.fileData && calendar.fileData.sheets) {
        console.log('🔧 Calendar has raw Excel data, parsing...', {
          calendarId: calendar.id,
          sheetsCount: Object.keys(calendar.fileData.sheets).length,
          sheetNames: Object.keys(calendar.fileData.sheets)
        });

        const parsedActivities = this.parseExcelDataToActivities(calendar);
        console.log('📊 Excel parsing result:', {
          calendarId: calendar.id,
          activitiesExtracted: parsedActivities.length,
          firstFewActivities: parsedActivities.slice(0, 3)
        });

        return parsedActivities;
      }

      console.warn('⚠️ Calendar has no activities or fileData:', {
        id: calendar.id,
        keys: Object.keys(calendar)
      });
      return [];
    });

    console.log('🎯 Final transformation result:', {
      totalActivities: allActivities.length,
      activitiesSample: allActivities.slice(0, 3)
    });

    return allActivities;
  }

  /**
   * Parse raw Excel data from backend into standardized activities
   * @param {Object} calendar - Calendar with fileData.sheets
   * @returns {Array} Standardized activities
   */
  parseExcelDataToActivities(calendar) {
    console.log('\n🔧 parseExcelDataToActivities called for calendar:', calendar.id);
    console.log('📄 Calendar fileData structure:', {
      hasFileData: !!calendar.fileData,
      hasSheets: !!(calendar.fileData && calendar.fileData.sheets),
      sheetNames: calendar.fileData?.sheets ? Object.keys(calendar.fileData.sheets) : []
    });

    const activities = [];
    const sheets = calendar.fileData.sheets;

    if (!sheets || typeof sheets !== 'object') {
      console.error('❌ Invalid sheets data:', sheets);
      return activities;
    }

    // Process each sheet
    Object.keys(sheets).forEach(sheetName => {
      console.log(`\n📋 Processing sheet: "${sheetName}"`);
      const sheet = sheets[sheetName];

      if (!sheet) {
        console.warn('⚠️ Sheet is null/undefined:', sheetName);
        return;
      }

      if (!sheet.data || !Array.isArray(sheet.data)) {
        console.warn('⚠️ Sheet has no data array:', {
          sheetName,
          hasData: !!sheet.data,
          dataType: typeof sheet.data,
          sheetKeys: Object.keys(sheet)
        });
        return;
      }

      console.log(`📊 Sheet "${sheetName}" has ${sheet.data.length} rows`);
      console.log('🔍 First few rows:', sheet.data.slice(0, 5));

      // Find activity column and month columns
      console.log('🔍 Finding columns in Excel data...');
      const { activityColumnIndex, monthColumns } = this.findColumnsInExcelData(sheet.data);

      console.log('📍 Column detection result:', {
        activityColumnIndex,
        monthColumnsCount: monthColumns.length,
        firstFewMonths: monthColumns.slice(0, 5)
      });

      if (activityColumnIndex === -1) {
        console.warn('❌ Could not find activity column in sheet:', sheetName);
        console.log('🔍 Headers analysis:', sheet.data.slice(0, 3));
        return;
      }

      console.log(`✅ Found activity column at index ${activityColumnIndex}`);

      // Extract activities from rows
      let activitiesFromSheet = 0;
      sheet.data.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
          console.warn(`⚠️ Row ${rowIndex} is not an array:`, row);
          return;
        }

        if (rowIndex < 3) {
          console.log(`⏭️ Skipping header row ${rowIndex}:`, row);
          return; // Skip headers
        }

        const activityName = row[activityColumnIndex];
        console.log(`🔍 Row ${rowIndex} activity cell [${activityColumnIndex}]:`, activityName);

        if (!activityName || typeof activityName !== 'string') {
          console.log(`⏭️ Skipping row ${rowIndex} - invalid activity name:`, activityName);
          return;
        }

        // Skip row numbers and headers
        const lowerActivityName = activityName.toLowerCase();
        const isHeaderRow = lowerActivityName.includes('s/n') ||
                          lowerActivityName.includes('stage') ||
                          lowerActivityName.includes('activity') ||
                          lowerActivityName.includes('calendar') ||
                          /^\d+$/.test(activityName.toString().trim());

        if (isHeaderRow) {
          console.log(`⏭️ Skipping header/number row ${rowIndex}:`, activityName);
          return;
        }

        // Find which months this activity spans
        console.log(`🗓️ Finding timespan for "${activityName}"...`);
        const { startMonth, endMonth } = this.findActivityTimespan(row, monthColumns, activityColumnIndex);

        console.log(`📅 Timespan result:`, { startMonth, endMonth });

        if (startMonth && endMonth) {
          const activity = {
            activity: this.cleanActivityName(activityName),
            start: startMonth,
            end: endMonth,
            color: this.generateActivityColor({ name: activityName }),
            advisory: this.generateBasicAdvisory({ name: activityName }),
            calendarId: calendar.id,
            commodity: calendar.crop || calendar.commodity,
            regionCode: calendar.region || calendar.regionCode,
            districtCode: calendar.district || calendar.districtCode,
            season: 'Major', // Default to Major season
            metadata: {
              source: 'uploaded',
              calendarType: 'seasonal',
              sheet: sheetName,
              row: rowIndex
            }
          };

          activities.push(activity);
          activitiesFromSheet++;
          console.log(`✅ Added activity ${activitiesFromSheet}:`, activity.activity, `(${startMonth} → ${endMonth})`);
        } else {
          console.log(`❌ No valid timespan for "${activityName}"`);
        }
      });

      console.log(`📊 Sheet "${sheetName}" contributed ${activitiesFromSheet} activities`);
    });

    console.log(`🎯 Total extracted ${activities.length} activities from calendar ${calendar.id}`);
    console.log('📋 Activity summary:', activities.map(a => ({ activity: a.activity, start: a.start, end: a.end })));

    return activities;
  }

  /**
   * Find activity and month columns in Excel data
   * @param {Array} data - Excel sheet data
   * @returns {Object} Column indices
   */
  findColumnsInExcelData(data) {
    console.log('\n🔍 findColumnsInExcelData called with', data.length, 'rows');

    let activityColumnIndex = -1;
    const monthColumns = [];

    // Look for headers in first few rows
    const rowsToCheck = Math.min(5, data.length);
    console.log(`📊 Checking first ${rowsToCheck} rows for headers...`);

    for (let rowIndex = 0; rowIndex < rowsToCheck; rowIndex++) {
      const row = data[rowIndex];
      console.log(`\n🔍 Row ${rowIndex}:`, row);

      if (!Array.isArray(row)) {
        console.warn(`⚠️ Row ${rowIndex} is not an array, skipping`);
        continue;
      }

      row.forEach((cell, colIndex) => {
        console.log(`🔍 Cell [${rowIndex},${colIndex}]: value="${cell}", type="${typeof cell}"`);

        if (!cell) {
          console.log(`⏭️ Cell [${rowIndex},${colIndex}] is empty, skipping`);
          return;
        }

        if (typeof cell !== 'string') {
          console.log(`🔄 Cell [${rowIndex},${colIndex}] is not string, converting:`, typeof cell, cell);
          // Convert to string for processing
          cell = String(cell).trim();
        }

        const cellLower = cell.toLowerCase().trim();
        console.log(`🔍 Processing cell [${rowIndex},${colIndex}]: "${cell}" → "${cellLower}"`);

        // Find activity column - be more flexible with matching
        const isActivityColumn = cellLower.includes('activity') ||
                                cellLower.includes('stage') ||
                                cellLower.includes('task') ||
                                cellLower.includes('farming') ||
                                cellLower === 'activities';

        if (isActivityColumn) {
          console.log(`✅ FOUND ACTIVITY COLUMN at index ${colIndex} with text: "${cell}"`);
          activityColumnIndex = colIndex;
        }

        // Find month columns - check exact matches and partial matches
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const fullMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

        let matchingMonth = months.find(month => cellLower === month || cellLower.includes(month));
        if (!matchingMonth) {
          // Check full month names and return the corresponding abbreviation
          const fullMonthIndex = fullMonths.findIndex(month => cellLower === month || cellLower.includes(month));
          if (fullMonthIndex !== -1) {
            matchingMonth = months[fullMonthIndex];
          }
        }

        if (matchingMonth) {
          console.log(`📅 FOUND MONTH "${matchingMonth}" at column ${colIndex} with text: "${cell}"`);

          if (!monthColumns.find(m => m.index === colIndex)) {
            const monthInfo = {
              index: colIndex,
              month: this.getFullMonthName(matchingMonth),
              monthIndex: months.indexOf(matchingMonth)
            };
            monthColumns.push(monthInfo);
            console.log(`➕ ADDED MONTH COLUMN:`, monthInfo);
          } else {
            console.log(`⚠️ Month column ${colIndex} already exists, skipping`);
          }
        } else {
          console.log(`❌ Cell "${cellLower}" is not a month`);
        }
      });
    }

    // Sort month columns by their month index
    monthColumns.sort((a, b) => a.monthIndex - b.monthIndex);

    console.log('\n📋 Final column detection results:', {
      activityColumnIndex,
      monthColumnsCount: monthColumns.length,
      monthColumns: monthColumns.map(m => ({ index: m.index, month: m.month }))
    });

    return { activityColumnIndex, monthColumns };
  }

  /**
   * Find the timespan of an activity based on filled cells
   * @param {Array} row - Excel row data
   * @param {Array} monthColumns - Month column information
   * @param {number} activityColumnIndex - Activity column index
   * @returns {Object} Start and end months
   */
  findActivityTimespan(row, monthColumns, activityColumnIndex) {
    const filledMonths = [];

    // Check each month column for content
    monthColumns.forEach(monthInfo => {
      if (monthInfo.index < row.length) {
        const cellValue = row[monthInfo.index];
        // Consider cell "filled" if it has any non-empty content
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          filledMonths.push(monthInfo.month);
        }
      }
    });

    if (filledMonths.length === 0) {
      return { startMonth: null, endMonth: null };
    }

    return {
      startMonth: filledMonths[0],
      endMonth: filledMonths[filledMonths.length - 1]
    };
  }

  /**
   * Convert month abbreviation to full name
   * @param {string} monthAbbr - Month abbreviation
   * @returns {string} Full month name
   */
  getFullMonthName(monthAbbr) {
    const monthMap = {
      'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
      'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
      'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
    };
    return monthMap[monthAbbr.toLowerCase()] || monthAbbr;
  }

  /**
   * Clean activity name for display
   * @param {string} name - Raw activity name
   * @returns {string} Cleaned name
   */
  cleanActivityName(name) {
    return name.toString().trim()
      .replace(/^\d+\.?\s*/, '') // Remove leading numbers
      .replace(/^\|?\s*/, '')    // Remove leading pipes
      .trim();
  }






  /**
   * Extract start time from activity
   * @param {Object} activity - Activity object
   * @param {Object} calendar - Calendar object
   * @returns {string} Start time
   */
  extractStartTime(activity, calendar) {
    if (activity.startMonth) return activity.startMonth;
    if (activity.start) return activity.start;
    if (calendar.timeline?.startMonth) return calendar.timeline.startMonth;
    return 'January';
  }

  /**
   * Extract end time from activity
   * @param {Object} activity - Activity object
   * @param {Object} calendar - Calendar object
   * @returns {string} End time
   */
  extractEndTime(activity, calendar) {
    if (activity.endMonth) return activity.endMonth;
    if (activity.end) return activity.end;
    if (activity.startMonth) return activity.startMonth;
    if (activity.start) return activity.start;
    return 'January';
  }

  /**
   * Generate activity color
   * @param {Object} activity - Activity object
   * @returns {string} CSS color class
   */
  generateActivityColor(activity) {
    if (activity.color) return activity.color;

    const colorMap = {
      'site': 'bg-[#00B0F0]',
      'land': 'bg-[#BF9000]',
      'plant': 'bg-[#000000]',
      'fertil': 'bg-[#FFFF00]',
      'weed': 'bg-[#FF0000]',
      'pest': 'bg-[#FF0000]',
      'harvest': 'bg-[#008000]',
      'water': 'bg-[#87CEEB]'
    };

    const activityName = (activity.name || activity.activity || '').toLowerCase();

    for (const [key, color] of Object.entries(colorMap)) {
      if (activityName.includes(key)) {
        return color;
      }
    }

    return 'bg-[#808080]'; // Default gray
  }

  /**
   * Generate basic advisory text
   * @param {Object} activity - Activity object
   * @returns {string} Advisory text
   */
  generateBasicAdvisory(activity) {
    const activityName = activity.name || activity.activity || 'Unknown';
    return `Follow best practices for ${activityName.toLowerCase()}. Consult local agricultural extension officers for specific guidance.`;
  }

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  /**
   * Generate cache key
   * @param {string} type - Cache type
   * @param {Object} filters - Filters
   * @returns {string} Cache key
   */
  generateCacheKey(type, filters) {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {});

    return `${type}_${JSON.stringify(sortedFilters)}`;
  }

  /**
   * Get from cache
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null
   */
  getFromCache(key) {
    if (!this.cache.has(key)) return null;

    const cached = this.cache.get(key);
    const now = Date.now();

    if (now - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean old cache entries
    this.cleanCache();
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Calendar cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      expiryMinutes: this.cacheExpiry / (60 * 1000),
      lastCleaned: new Date().toISOString()
    };
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Check if data source is available
   * @param {string} sourceType - Source type (uploaded, computed, template)
   * @returns {Promise<boolean>} Availability status
   */
  async checkDataSourceAvailability(sourceType) {
    try {
      switch (sourceType) {
        case 'uploaded':
          const enhanced = await agriculturalDataService.getEnhancedCalendars({ limit: 1 });
          return enhanced.success && enhanced.data.length > 0;

        case 'computed':
          // Computed calendars disabled in Excel-only system
          return false;

        case 'template':
          return false; // Templates disabled in Excel-only system

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking ${sourceType} availability:`, error);
      return false;
    }
  }

  /**
   * Get data source health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    const status = {
      uploaded: await this.checkDataSourceAvailability('uploaded'),
      computed: await this.checkDataSourceAvailability('computed'),
      template: await this.checkDataSourceAvailability('template'),
      cache: this.cache.size > 0,
      initialized: this.isInitialized
    };

    status.overall = status.uploaded || status.computed || status.template;

    return {
      ...status,
      timestamp: new Date().toISOString(),
      cacheStats: this.getCacheStats()
    };
  }

  /**
   * Refresh data sources
   * @returns {Promise<Object>} Refresh results
   */
  async refreshDataSources() {
    console.log('🔄 Refreshing calendar data sources...');

    this.clearCache();

    const health = await this.getHealthStatus();

    console.log('✅ Data sources refreshed');
    return {
      success: true,
      health,
      refreshedAt: new Date().toISOString()
    };
  }

  /**
   * Apply weather adjustments to calendar data
   * @param {Object} calendarResult - Calendar result with data and metadata
   * @param {Object} filters - Original filters
   * @returns {Promise<Object>} Weather-adjusted calendar result
   */
  async applyWeatherAdjustments(calendarResult, filters) {
    // Only apply weather adjustments if region is specified
    if (!filters.regionCode) {
      return calendarResult;
    }

    try {
      console.log('🌤️ Applying weather adjustments for', filters.regionCode);

      const weatherAdjustedResult = await weatherCalendarIntegration.getWeatherAdjustedCalendar(
        calendarResult.data,
        filters.regionCode,
        {
          enableRainfallAdjustment: true,
          enableTemperatureAdjustment: true,
          enableSeasonalForecasting: true,
          adjustmentSensitivity: 'medium'
        }
      );

      if (weatherAdjustedResult.success) {
        return {
          ...calendarResult,
          data: weatherAdjustedResult.data,
          metadata: {
            ...calendarResult.metadata,
            weatherIntegration: weatherAdjustedResult.metadata,
            originalDataCount: calendarResult.data.length,
            weatherAdjustedDataCount: weatherAdjustedResult.data.length
          }
        };
      }

      // If weather adjustment fails, return original data
      console.warn('⚠️ Weather adjustment failed, returning original calendar data');
      return calendarResult;

    } catch (error) {
      console.error('❌ Weather adjustment error:', error);
      return calendarResult;
    }
  }
}

export default new DynamicCalendarManager();