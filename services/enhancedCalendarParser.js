import XLSX from 'xlsx';
import moment from 'moment';

/**
 * Enhanced Agricultural Calendar Parser
 * Handles both seasonal calendars (crops) and flexible production cycles (poultry)
 */

class EnhancedCalendarParser {
  constructor() {
    // Crop types that follow seasonal patterns
    this.seasonalCommodities = [
      'maize', 'rice', 'cassava', 'yam', 'plantain', 'cocoa', 'coffee',
      'tomato', 'pepper', 'onion', 'okra', 'garden egg', 'beans',
      'groundnut', 'soybean', 'cowpea', 'oil palm', 'coconut'
    ];

    // Poultry types that use flexible production cycles  
    this.cycleCommodities = [
      'broiler', 'layer', 'cockerel', 'duck', 'turkey', 'guinea fowl', 'goose'
    ];

    // Standard months mapping
    this.monthMapping = {
      'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
      'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6,
      'jul': 7, 'july': 7, 'aug': 8, 'august': 8, 'sep': 9, 'september': 9,
      'oct': 10, 'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12
    };
  }

  /**
   * Main parsing entry point
   */
  async parseCalendarExcel(buffer, filename, metadata = {}) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON format preserving structure
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        raw: false 
      });

      // Detect calendar type and commodity
      const calendarInfo = this.detectCalendarType(rawData, filename);
      
      // Parse based on detected type
      let parsedCalendar;
      if (calendarInfo.type === 'seasonal') {
        parsedCalendar = this.parseSeasonalCalendar(rawData, calendarInfo, metadata);
      } else if (calendarInfo.type === 'cycle') {
        parsedCalendar = this.parseCycleTemplate(rawData, calendarInfo, metadata);
      } else {
        throw new Error(`Unsupported calendar type: ${calendarInfo.type}`);
      }

      return {
        success: true,
        calendarType: calendarInfo.type,
        commodity: calendarInfo.commodity,
        data: parsedCalendar,
        metadata: {
          filename,
          totalActivities: parsedCalendar.activities?.length || 0,
          processingDate: new Date().toISOString(),
          ...metadata
        }
      };

    } catch (error) {
      console.error('Calendar parsing error:', error);
      return {
        success: false,
        error: error.message,
        filename
      };
    }
  }

  /**
   * Detect calendar type from Excel content
   */
  detectCalendarType(data, filename = '') {
    const title = this.findCalendarTitle(data);
    const headers = this.findTimelineHeaders(data);
    
    // Extract commodity from title or filename
    let commodity = this.extractCommodity(title + ' ' + filename);
    
    // Determine calendar type
    let type = 'unknown';
    
    // Check for seasonal patterns (absolute dates/months)
    const hasAbsoluteDates = this.hasAbsoluteDatePattern(headers);
    const hasMonthHeaders = this.hasMonthPattern(headers);
    
    // Check for cycle patterns (relative weeks)
    const hasRelativeWeeks = this.hasRelativeWeekPattern(headers);
    const hasProductionWeeks = this.hasProductionWeekPattern(data);
    
    // Classify based on commodity and pattern
    if (this.isCropCommodity(commodity) && (hasAbsoluteDates || hasMonthHeaders)) {
      type = 'seasonal';
    } else if (this.isPoultryCommodity(commodity) && (hasRelativeWeeks || hasProductionWeeks)) {
      type = 'cycle';
    } else if (hasRelativeWeeks || hasProductionWeeks) {
      type = 'cycle';
      commodity = commodity || 'broiler'; // Default to broiler if unclear
    } else if (hasAbsoluteDates || hasMonthHeaders) {
      type = 'seasonal';
      commodity = commodity || 'maize'; // Default to maize if unclear
    }

    return {
      type,
      commodity: commodity.toLowerCase(),
      title: title,
      headers: headers
    };
  }

  /**
   * Parse seasonal calendar (crops)
   */
  parseSeasonalCalendar(data, calendarInfo, metadata) {
    const timeline = this.extractTimeline(data);
    const activities = this.extractActivities(data);
    const schedule = this.mapActivitiesToTimeline(data, activities, timeline, 'seasonal');
    
    return {
      type: 'seasonal',
      commodity: calendarInfo.commodity,
      title: calendarInfo.title,
      season: this.extractSeason(calendarInfo.title),
      timeline: {
        type: 'absolute',
        totalWeeks: timeline.weeks?.length || 0,
        startMonth: timeline.startMonth,
        endMonth: timeline.endMonth,
        months: timeline.months,
        weeks: timeline.weeks
      },
      activities: activities,
      schedule: schedule,
      metadata: {
        region: metadata.region,
        district: metadata.district,
        year: this.extractYear(calendarInfo.title) || new Date().getFullYear()
      }
    };
  }

  /**
   * Parse production cycle template (poultry)
   */
  parseCycleTemplate(data, calendarInfo, metadata) {
    const cycleTimeline = this.extractCycleTimeline(data);
    const activities = this.extractActivities(data);
    const schedule = this.mapActivitiesToTimeline(data, activities, cycleTimeline, 'cycle');
    
    return {
      type: 'cycle',
      commodity: calendarInfo.commodity,
      title: calendarInfo.title,
      cycleDuration: cycleTimeline.totalWeeks,
      timeline: {
        type: 'relative',
        totalWeeks: cycleTimeline.totalWeeks,
        weeks: cycleTimeline.weeks,
        flexibleStart: true
      },
      activities: activities,
      schedule: schedule,
      metadata: {
        region: metadata.region,
        district: metadata.district,
        breedType: this.extractBreedType(calendarInfo.title)
      }
    };
  }

  /**
   * Helper methods
   */
  findCalendarTitle(data) {
    // Look for title in first few rows
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      for (let cell of row) {
        if (typeof cell === 'string' && cell.length > 10) {
          const upperCell = cell.toUpperCase();
          if (upperCell.includes('CALENDAR') || 
              upperCell.includes('PRODUCTION') || 
              upperCell.includes('SEASON')) {
            return cell;
          }
        }
      }
    }
    return '';
  }

  findTimelineHeaders(data) {
    const headers = [];
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (this.looksLikeTimelineHeader(row)) {
        headers.push(...row.filter(cell => cell && cell.toString().trim()));
        break;
      }
    }
    return headers;
  }

  looksLikeTimelineHeader(row) {
    if (!Array.isArray(row) || row.length < 3) return false;
    
    const timePatterns = ['week', 'wk', 'month', 'jan', 'feb', 'mar', 'apr', 'may'];
    const timeCount = row.filter(cell => {
      if (!cell) return false;
      const cellStr = cell.toString().toLowerCase();
      return timePatterns.some(pattern => cellStr.includes(pattern));
    }).length;
    
    return timeCount >= 3; // At least 3 time-related headers
  }

  extractCommodity(text) {
    const lowerText = text.toLowerCase();
    
    // Enhanced poultry detection patterns
    const poultryPatterns = {
      'layer': ['layer', 'egg production', 'laying hen', 'hen'],
      'broiler': ['broiler', 'meat production', 'chicken meat', 'fryer'],
      'cockerel': ['cockerel', 'rooster', 'cock'],
      'duck': ['duck', 'waterfowl'],
      'turkey': ['turkey'],
      'guinea fowl': ['guinea fowl', 'guinea', 'fowl'],
      'goose': ['goose']
    };
    
    // Check enhanced poultry patterns first
    for (let [commodity, patterns] of Object.entries(poultryPatterns)) {
      for (let pattern of patterns) {
        if (lowerText.includes(pattern)) {
          return commodity;
        }
      }
    }
    
    // Check for direct commodity mentions (existing logic)
    for (let commodity of [...this.seasonalCommodities, ...this.cycleCommodities]) {
      if (lowerText.includes(commodity)) {
        return commodity;
      }
    }
    
    // Additional poultry indicators
    if (lowerText.includes('poultry') || lowerText.includes('chicken') || lowerText.includes('bird')) {
      // Default to layer if no specific type found but clearly poultry
      return 'layer';
    }
    
    return '';
  }

  isCropCommodity(commodity) {
    return this.seasonalCommodities.includes(commodity.toLowerCase());
  }

  isPoultryCommodity(commodity) {
    return this.cycleCommodities.includes(commodity.toLowerCase());
  }

  hasAbsoluteDatePattern(headers) {
    const datePatterns = /\d{1,2}[-\/]\d{1,2}|\d{4}/;
    return headers.some(header => datePatterns.test(header));
  }

  hasMonthPattern(headers) {
    const monthNames = Object.keys(this.monthMapping);
    return headers.some(header => 
      monthNames.some(month => 
        header.toLowerCase().includes(month)
      )
    );
  }

  hasRelativeWeekPattern(headers) {
    const weekPatterns = /week\s*\d+|wk\s*\d+/i;
    return headers.some(header => weekPatterns.test(header));
  }

  hasProductionWeekPattern(data) {
    const flatText = data.flat().join(' ').toLowerCase();
    
    // Strong poultry indicators
    const poultryIndicators = [
      'production week', 'cycle week', 'brooding', 'layer phase', 
      'starter phase', 'grower phase', 'finisher phase', 'vaccination',
      'feed management', 'housing management', 'egg production'
    ];
    
    // Check for strong poultry indicators
    for (let indicator of poultryIndicators) {
      if (flatText.includes(indicator)) {
        return true;
      }
    }
    
    // Check for relative week numbering without absolute dates
    const hasRelativeWeeks = flatText.includes('week') && 
                            /wk\s*\d+|week\s*\d+/i.test(flatText);
    const hasAbsoluteDates = this.hasAbsoluteDatePattern(data.flat());
    
    // If has relative weeks but no absolute dates, likely a production cycle
    return hasRelativeWeeks && !hasAbsoluteDates;
  }

  extractTimeline(data) {
    // Implementation for extracting seasonal timeline
    const timeline = { weeks: [], months: [], startMonth: null, endMonth: null };
    
    // Find header row with timeline
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (this.looksLikeTimelineHeader(row)) {
        timeline.weeks = row.filter(cell => 
          cell && cell.toString().toLowerCase().includes('wk')
        );
        timeline.months = row.filter(cell => {
          if (!cell) return false;
          const cellStr = cell.toString().toLowerCase();
          return Object.keys(this.monthMapping).some(month => cellStr.includes(month));
        });
        break;
      }
    }
    
    return timeline;
  }

  extractCycleTimeline(data) {
    // Implementation for extracting cycle timeline
    const timeline = { weeks: [], totalWeeks: 0 };
    
    // Count weeks in headers
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (this.looksLikeTimelineHeader(row)) {
        const weeks = row.filter(cell => {
          if (!cell) return false;
          const cellStr = cell.toString().toLowerCase();
          return cellStr.includes('week') || /wk\s*\d+/i.test(cellStr);
        });
        timeline.weeks = weeks;
        timeline.totalWeeks = weeks.length;
        break;
      }
    }
    
    return timeline;
  }

  extractActivities(data) {
    const activities = [];
    
    // Look for activity column (usually first column after S/N)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0) {
        const activityCell = row[1] || row[0]; // Try second column first, then first
        if (activityCell && typeof activityCell === 'string' && 
            activityCell.trim().length > 0 && 
            !this.looksLikeTimelineHeader([activityCell])) {
          
          activities.push({
            id: `activity_${i}`,
            name: activityCell.trim(),
            rowIndex: i
          });
        }
      }
    }
    
    return activities;
  }

  mapActivitiesToTimeline(data, activities, timeline, calendarType) {
    const schedule = [];
    
    activities.forEach(activity => {
      const row = data[activity.rowIndex];
      const activitySchedule = {
        activityId: activity.id,
        activityName: activity.name,
        periods: []
      };
      
      // Check each timeline column for colored/filled cells
      for (let colIndex = 2; colIndex < row.length; colIndex++) {
        const cell = row[colIndex];
        if (this.isCellActive(cell)) {
          const timelineIndex = colIndex - 2;
          let period;
          
          if (calendarType === 'seasonal') {
            period = {
              type: 'seasonal',
              week: timeline.weeks?.[timelineIndex] || `Week ${timelineIndex + 1}`,
              month: timeline.months?.[Math.floor(timelineIndex / 4)] || null
            };
          } else {
            period = {
              type: 'cycle',
              productionWeek: timelineIndex + 1,
              weekLabel: timeline.weeks?.[timelineIndex] || `Week ${timelineIndex + 1}`
            };
          }
          
          activitySchedule.periods.push(period);
        }
      }
      
      if (activitySchedule.periods.length > 0) {
        schedule.push(activitySchedule);
      }
    });
    
    return schedule;
  }

  isCellActive(cell) {
    // Check if cell indicates activity period
    if (!cell) return false;
    
    // Check for non-empty content
    if (typeof cell === 'string') {
      const trimmed = cell.trim();
      return trimmed.length > 0 && trimmed !== '0';
    }
    
    // Check for numeric values
    if (typeof cell === 'number') {
      return cell !== 0;
    }
    
    return !!cell;
  }

  extractSeason(title) {
    if (!title) return 'main';
    
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('major')) return 'major';
    if (lowerTitle.includes('minor')) return 'minor';
    if (lowerTitle.includes('dry')) return 'dry';
    if (lowerTitle.includes('wet')) return 'wet';
    
    return 'main';
  }

  extractYear(title) {
    if (!title) return null;
    
    const yearMatch = title.match(/20\d{2}/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  extractBreedType(title) {
    if (!title) return null;
    
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('cobb')) return 'Cobb 500';
    if (lowerTitle.includes('ross')) return 'Ross 308';
    if (lowerTitle.includes('isa')) return 'Isa Brown';
    if (lowerTitle.includes('lohmann')) return 'Lohmann Brown';
    
    return null;
  }
}

export default EnhancedCalendarParser;