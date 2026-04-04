import agriculturalDataService from './agriculturalDataService';
import weatherCalendarIntegration from './weatherCalendarIntegration';

/**
 * Dynamic Calendar Data Manager
 *
 * Provides a thin compatibility layer for uploaded calendar data.
 * The current application only serves normalized backend calendars;
 * this manager adapts those responses to the shape expected by older pages.
 */
class DynamicCalendarManager {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return { success: true, message: 'Already initialized' };
    }

    this.isInitialized = true;
    return { success: true, message: 'Successfully initialized' };
  }

  async getCalendarData(filters = {}, options = {}) {
    const { strictMode = false } = options;
    const cacheKey = this.generateCacheKey('calendar', filters);
    const cachedResult = this.getFromCache(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const enhancedResult = await this.getEnhancedCalendarData(filters);
      if (enhancedResult.success && enhancedResult.data.length > 0) {
        enhancedResult.metadata.dataSourceUsed = 'uploaded';
        enhancedResult.metadata.priority = 1;
        enhancedResult.metadata.strictMode = strictMode;

        const weatherAdjustedResult = await this.applyWeatherAdjustments(enhancedResult, filters);
        this.setCache(cacheKey, weatherAdjustedResult);
        return weatherAdjustedResult;
      }

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

  async getEnhancedCalendarData(filters) {
    try {
      const result = await agriculturalDataService.getEnhancedCalendars(filters);

      if (!result.success || result.data.length === 0) {
        return result;
      }

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
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  transformEnhancedToStandard(enhancedData) {
    if (!Array.isArray(enhancedData)) {
      return [];
    }

    return enhancedData.flatMap((calendar) => {
      if (Array.isArray(calendar.activities) && calendar.activities.length > 0) {
        return calendar.activities.map((activity) => ({
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

      if (calendar.fileData?.sheets) {
        return this.parseExcelDataToActivities(calendar);
      }

      return [];
    });
  }

  parseExcelDataToActivities(calendar) {
    const activities = [];
    const sheets = calendar.fileData?.sheets;

    if (!sheets || typeof sheets !== 'object') {
      return activities;
    }

    Object.entries(sheets).forEach(([sheetName, sheet]) => {
      if (!sheet?.data || !Array.isArray(sheet.data)) {
        return;
      }

      const { activityColumnIndex, monthColumns } = this.findColumnsInExcelData(sheet.data);
      if (activityColumnIndex === -1) {
        return;
      }

      sheet.data.forEach((row, rowIndex) => {
        if (!Array.isArray(row) || rowIndex < 3) {
          return;
        }

        const activityName = row[activityColumnIndex];
        if (!activityName || typeof activityName !== 'string') {
          return;
        }

        const lowerActivityName = activityName.toLowerCase();
        const isHeaderRow = lowerActivityName.includes('s/n') ||
          lowerActivityName.includes('stage') ||
          lowerActivityName.includes('activity') ||
          lowerActivityName.includes('calendar') ||
          /^\d+$/.test(activityName.trim());

        if (isHeaderRow) {
          return;
        }

        const { startMonth, endMonth } = this.findActivityTimespan(row, monthColumns);
        if (!startMonth || !endMonth) {
          return;
        }

        activities.push({
          activity: this.cleanActivityName(activityName),
          start: startMonth,
          end: endMonth,
          color: this.generateActivityColor({ name: activityName }),
          advisory: this.generateBasicAdvisory({ name: activityName }),
          calendarId: calendar.id,
          commodity: calendar.crop || calendar.commodity,
          regionCode: calendar.region || calendar.regionCode,
          districtCode: calendar.district || calendar.districtCode,
          season: 'Major',
          metadata: {
            source: 'uploaded',
            calendarType: 'seasonal',
            sheet: sheetName,
            row: rowIndex
          }
        });
      });
    });

    return activities;
  }

  findColumnsInExcelData(data) {
    let activityColumnIndex = -1;
    const monthColumns = [];
    const rowsToCheck = Math.min(5, data.length);
    const monthAbbreviations = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const fullMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    for (let rowIndex = 0; rowIndex < rowsToCheck; rowIndex += 1) {
      const row = data[rowIndex];
      if (!Array.isArray(row)) {
        continue;
      }

      row.forEach((rawCell, colIndex) => {
        if (rawCell === null || rawCell === undefined || rawCell === '') {
          return;
        }

        const cell = String(rawCell).trim();
        const cellLower = cell.toLowerCase();

        const isActivityColumn = cellLower.includes('activity') ||
          cellLower.includes('stage') ||
          cellLower.includes('task') ||
          cellLower.includes('farming') ||
          cellLower === 'activities';

        if (isActivityColumn) {
          activityColumnIndex = colIndex;
        }

        let matchingMonth = monthAbbreviations.find((month) => cellLower === month || cellLower.includes(month));
        if (!matchingMonth) {
          const fullMonthIndex = fullMonths.findIndex((month) => cellLower === month || cellLower.includes(month));
          if (fullMonthIndex !== -1) {
            matchingMonth = monthAbbreviations[fullMonthIndex];
          }
        }

        if (matchingMonth && !monthColumns.find((month) => month.index === colIndex)) {
          monthColumns.push({
            index: colIndex,
            month: this.getFullMonthName(matchingMonth),
            monthIndex: monthAbbreviations.indexOf(matchingMonth)
          });
        }
      });
    }

    monthColumns.sort((a, b) => a.monthIndex - b.monthIndex);
    return { activityColumnIndex, monthColumns };
  }

  findActivityTimespan(row, monthColumns) {
    const filledMonths = [];

    monthColumns.forEach((monthInfo) => {
      if (monthInfo.index >= row.length) {
        return;
      }

      const cellValue = row[monthInfo.index];
      if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
        filledMonths.push(monthInfo.month);
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

  getFullMonthName(monthAbbr) {
    const monthMap = {
      jan: 'January',
      feb: 'February',
      mar: 'March',
      apr: 'April',
      may: 'May',
      jun: 'June',
      jul: 'July',
      aug: 'August',
      sep: 'September',
      oct: 'October',
      nov: 'November',
      dec: 'December'
    };

    return monthMap[monthAbbr.toLowerCase()] || monthAbbr;
  }

  cleanActivityName(name) {
    return String(name)
      .trim()
      .replace(/^\d+\.?\s*/, '')
      .replace(/^\|?\s*/, '')
      .trim();
  }

  extractStartTime(activity, calendar) {
    if (activity.startMonth) return activity.startMonth;
    if (activity.start) return activity.start;
    if (calendar.timeline?.startMonth) return calendar.timeline.startMonth;
    return 'January';
  }

  extractEndTime(activity, calendar) {
    if (activity.endMonth) return activity.endMonth;
    if (activity.end) return activity.end;
    if (activity.startMonth) return activity.startMonth;
    if (activity.start) return activity.start;
    return 'January';
  }

  generateActivityColor(activity) {
    if (activity.color) {
      return activity.color;
    }

    const colorMap = {
      site: 'bg-[#00B0F0]',
      land: 'bg-[#BF9000]',
      plant: 'bg-[#000000]',
      fertil: 'bg-[#FFFF00]',
      weed: 'bg-[#FF0000]',
      pest: 'bg-[#FF0000]',
      harvest: 'bg-[#008000]',
      water: 'bg-[#87CEEB]'
    };

    const activityName = (activity.name || activity.activity || '').toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
      if (activityName.includes(key)) {
        return color;
      }
    }

    return 'bg-[#808080]';
  }

  generateBasicAdvisory(activity) {
    const activityName = activity.name || activity.activity || 'Unknown';
    return `Follow best practices for ${activityName.toLowerCase()}. Consult local agricultural extension officers for specific guidance.`;
  }

  generateCacheKey(type, filters) {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {});

    return `${type}_${JSON.stringify(sortedFilters)}`;
  }

  getFromCache(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const cached = this.cache.get(key);
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    this.cleanCache();
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      expiryMinutes: this.cacheExpiry / (60 * 1000),
      lastCleaned: new Date().toISOString()
    };
  }

  async checkDataSourceAvailability(sourceType) {
    try {
      if (sourceType !== 'uploaded') {
        return false;
      }

      const enhanced = await agriculturalDataService.getEnhancedCalendars({ limit: 1 });
      return enhanced.success && enhanced.data.length > 0;
    } catch {
      return false;
    }
  }

  async getHealthStatus() {
    const status = {
      uploaded: await this.checkDataSourceAvailability('uploaded'),
      cache: this.cache.size > 0,
      initialized: this.isInitialized
    };

    status.overall = status.uploaded;

    return {
      ...status,
      timestamp: new Date().toISOString(),
      cacheStats: this.getCacheStats()
    };
  }

  async refreshDataSources() {
    this.clearCache();

    return {
      success: true,
      health: await this.getHealthStatus(),
      refreshedAt: new Date().toISOString()
    };
  }

  async applyWeatherAdjustments(calendarResult, filters) {
    if (!filters.regionCode) {
      return calendarResult;
    }

    try {
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

      if (!weatherAdjustedResult.success) {
        return calendarResult;
      }

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
    } catch {
      return calendarResult;
    }
  }
}

export default new DynamicCalendarManager();
