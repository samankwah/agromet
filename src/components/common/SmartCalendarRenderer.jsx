import React, { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaInfoCircle, FaCalendarAlt, FaDownload, FaExpand, FaChevronDown, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import calendarExportService from '../../services/calendarExportService';

/**
 * Smart Calendar Renderer Component
 *
 * Intelligently renders different types of calendar data:
 * - Seasonal crops (monthly activities)
 * - Production cycles (weekly activities)
 * - Enhanced calendar data from uploads
 * - Excel-only data source
 *
 * Supports multiple view modes and data source indicators
 */
const SmartCalendarRenderer = ({
  activities = [],
  weeksData = [],
  metadata = {},
  loading = false,
  error = null,
  onActivityHover = null,
  onActivityLeave = null,
  onDownload = null,
  className = "",
  viewMode = "timeline", // timeline, list, cards, fullpage
  showDataSourceIndicator = true,
  showMetadata = true,
  calendarTitle = null
}) => {
  const [hoveredActivity, setHoveredActivity] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const timelineScrollRef = useRef(null);

  // Reset internal error when activities change
  useEffect(() => {
    setInternalError(null);
  }, [activities, metadata]);

  // Get activity-specific colors based on activity name (matching CalendarFullPageView exactly)
  const getActivityColor = (activityName) => {
    const activity = activityName.toLowerCase();

    // POULTRY-SPECIFIC COLOR MAPPINGS
    if (activity.includes('brooding') || activity.includes('chick brooding')) {
      return '#FFB6C1'; // Light Pink - for brooding phase
    } else if (activity.includes('starter phase') || activity.includes('starter feed')) {
      return '#87CEEB'; // Sky Blue - for starter phase
    } else if (activity.includes('grower phase') || activity.includes('grower feed')) {
      return '#98FB98'; // Pale Green - for grower phase
    } else if (activity.includes('finisher phase') || activity.includes('finisher feed')) {
      return '#DDA0DD'; // Plum - for finisher phase
    } else if (activity.includes('layer phase') || activity.includes('layer feed') || activity.includes('egg production')) {
      return '#F0E68C'; // Khaki - for layer phase
    } else if (activity.includes('breeder phase') || activity.includes('breeding')) {
      return '#CD853F'; // Peru - for breeder phase
    } else if (activity.includes('vaccination') || activity.includes('vaccine')) {
      return '#FF6347'; // Tomato Red - for vaccination
    } else if (activity.includes('health management') || activity.includes('health check')) {
      return '#20B2AA'; // Light Sea Green - for health management
    } else if (activity.includes('feed management') || activity.includes('feeding')) {
      return '#DAA520'; // Goldenrod - for feed management
    } else if (activity.includes('housing management') || activity.includes('housing')) {
      return '#708090'; // Slate Gray - for housing management
    } else if (activity.includes('processing') || activity.includes('slaughter')) {
      return '#8B0000'; // Dark Red - for processing
    } else if (activity.includes('biosecurity') || activity.includes('disinfection')) {
      return '#4169E1'; // Royal Blue - for biosecurity
    } else if (activity.includes('environmental control') || activity.includes('ventilation')) {
      return '#00CED1'; // Dark Turquoise - for environmental control
    } else if (activity.includes('stress management') || activity.includes('comfort')) {
      return '#9370DB'; // Medium Purple - for stress management

    // CROP-SPECIFIC COLOR MAPPINGS (existing)
    } else if (activity.includes('site selection') || activity.includes('site select')) {
      return '#00B0F0'; // Light blue
    } else if (activity.includes('land preparation') || activity.includes('land prep')) {
      return '#BF9000'; // Dark orange/gold
    } else if (activity.includes('planting') || activity.includes('sowing')) {
      return '#000000'; // Black
    } else if (activity.includes('1st fertilizer') || activity.includes('first fertilizer')) {
      return '#FFFF00'; // Yellow
    } else if (activity.includes('2nd fertilizer') || activity.includes('second fertilizer') || activity.includes('urea') || activity.includes('soa')) {
      return '#000000'; // Black
    } else if (activity.includes('first weed') || (activity.includes('weed') && (activity.includes('first') || activity.includes('1st') || activity.includes('army worm')))) {
      return '#FF0000'; // Red
    } else if (activity.includes('second weed') || (activity.includes('weed') && (activity.includes('second') || activity.includes('2nd') || activity.includes('pest') || activity.includes('disease')))) {
      return '#FF0000'; // Red
    } else if (activity.includes('harvest') && !activity.includes('post')) {
      return '#008000'; // Green
    } else if (activity.includes('post harvest') || activity.includes('post-harvest')) {
      return '#800080'; // Purple
    } else if (activity.includes('irrigation') || activity.includes('watering')) {
      return '#4169E1'; // Royal Blue
    } else {
      // Enhanced fallback based on common keywords
      if (activity.includes('fertilizer') || activity.includes('fertiliser')) return '#FF0000'; // Red
      if (activity.includes('weed')) return '#FF0000'; // Red
      if (activity.includes('pest') || activity.includes('disease')) return '#DC143C'; // Crimson
      return '#32CD32'; // Default Lime Green only as last resort
    }
  };

  const getCellBackgroundColor = (cell, activityName) => {
    // Priority 1: Use cell's explicit background color
    if (cell.background && cell.background !== 'transparent') {
      return cell.background;
    }

    // Priority 2: If cell is active, use activity-based color
    if (cell.active) {
      const activityColor = getActivityColor(activityName);
      return activityColor;
    }

    // Priority 3: Default transparent
    return 'transparent';
  };

  const getCellTextColor = (cell) => {
    if (cell.active) {
      return '#FFFFFF'; // White text for colored cells
    }
    return '#374151'; // Dark gray for inactive cells
  };

  // Enhanced activity color generation with better mapping
  const generateActivityColor = (activityName, exactColor = null) => {
    // If exact color is provided (from database), use it directly
    if (exactColor && exactColor !== '#FFFFFF') {
      return null; // Will use inline style instead
    }

    const colorMap = {
      // Site preparation and land management
      'site': 'bg-blue-500',
      'land': 'bg-yellow-600',
      'prep': 'bg-yellow-600',
      'clear': 'bg-yellow-600',

      // Planting activities
      'plant': 'bg-gray-800',
      'sow': 'bg-gray-800',
      'seed': 'bg-gray-800',

      // Fertilizer activities
      'fertil': 'bg-yellow-400',
      'manure': 'bg-yellow-400',
      'compost': 'bg-yellow-400',
      'npk': 'bg-yellow-400',
      'urea': 'bg-orange-400',

      // Pest and weed management
      'weed': 'bg-red-500',
      'pest': 'bg-red-500',
      'disease': 'bg-red-600',
      'spray': 'bg-red-400',
      'control': 'bg-red-500',

      // Harvesting activities
      'harvest': 'bg-green-600',
      'harv': 'bg-green-600',
      'reap': 'bg-green-600',

      // Post-harvest activities
      'post': 'bg-purple-600',
      'dry': 'bg-purple-500',
      'store': 'bg-purple-600',
      'process': 'bg-purple-500',

      // Water management
      'water': 'bg-blue-300',
      'irrig': 'bg-blue-300',
      'drain': 'bg-blue-400',

      // Other activities
      'thin': 'bg-indigo-400',
      'prun': 'bg-indigo-500',
      'support': 'bg-gray-600'
    };

    const name = (activityName || '').toLowerCase();

    // Try exact word matching first for better precision
    const words = name.split(/\s+/);
    for (const word of words) {
      if (colorMap[word]) return colorMap[word];
    }

    // Then try substring matching
    for (const [key, color] of Object.entries(colorMap)) {
      if (name.includes(key)) return color;
    }

    return 'bg-gray-500';
  };

  // Generate month headers from weeks data
  const getMonthHeaders = () => {
    if (!weeksData.length) {
      return [{ name: 'TIMELINE', startIndex: 0, colspan: 1 }];
    }

    const months = [];
    let currentMonth = null;
    let currentStartIndex = 0;
    let currentColspan = 0;

    weeksData.forEach((week, index) => {
      const monthLabel = week.month;

      if (monthLabel && monthLabel !== currentMonth) {
        // Start new month
        if (currentMonth) {
          months.push({
            name: currentMonth.toUpperCase(),
            startIndex: currentStartIndex,
            colspan: currentColspan
          });
        }
        currentMonth = monthLabel;
        currentStartIndex = index;
        currentColspan = 1;
      } else if (currentMonth) {
        currentColspan++;
      }
    });

    // Add the last month
    if (currentMonth) {
      months.push({
        name: currentMonth.toUpperCase(),
        startIndex: currentStartIndex,
        colspan: currentColspan
      });
    }

    // Fallback if no months found
    if (months.length === 0) {
      const totalCols = weeksData.length;
      const estimatedMonths = Math.ceil(totalCols / 4);
      for (let i = 0; i < estimatedMonths; i++) {
        const startIndex = i * 4;
        const colspan = Math.min(4, totalCols - startIndex);
        months.push({
          name: `MONTH${i + 1}`,
          startIndex: startIndex,
          colspan: colspan
        });
      }
    }

    return months;
  };

  // Generate week headers from weeks data
  const getWeekHeaders = () => {
    if (!weeksData.length) {
      return [];
    }

    return weeksData.map((week, index) => ({
      label: week.week || `W${index + 1}`,
      originalIndex: index,
      monthLabel: week.month,
      dateRange: week.dateRange
    }));
  };

  // Generate date ranges from weeks data
  const getDateRanges = () => {
    if (!weeksData.length) {
      return [];
    }

    return weeksData.map((week, index) =>
      week.dateRange || `W${index + 1}`
    );
  };

  // Generate basic advisory
  const generateBasicAdvisory = (activity) => {
    const activityName = activity.activity || activity.name || 'Unknown';
    return `Follow best practices for ${activityName.toLowerCase()}. Consult local agricultural extension officers for specific guidance.`;
  };

  // Process activities for different calendar types with enhanced error handling
  const processedActivities = useMemo(() => {
    if (!activities || !Array.isArray(activities)) {
      console.warn('SmartCalendarRenderer: Invalid activities data', activities);
      return [];
    }

    if (!activities.length) return [];

    try {
      return activities.map((activity, index) => {
        if (!activity || typeof activity !== 'object') {
          console.warn(`SmartCalendarRenderer: Invalid activity at index ${index}`, activity);
          return null;
        }

        const activityName = activity.activity || activity.name || `Activity ${index + 1}`;
        const exactColor = activity.backgroundColor || activity.primaryColor;

        return {
          id: activity.id || `activity-${index}`,
          activity: activityName,
          start: activity.start || activity.startMonth || activity.startWeek,
          end: activity.end || activity.endMonth || activity.endWeek,
          color: activity.color || generateActivityColor(activityName, exactColor),
          exactColor: exactColor,
          timeline: activity.timeline || null, // Support for exact color timeline
          advisory: activity.advisory || activity.description || generateBasicAdvisory(activity),
          calendarType: activity.metadata?.calendarType || metadata.calendarType || 'seasonal',
          originalData: activity
        };
      }).filter(Boolean); // Remove any null entries
    } catch (error) {
      console.error('SmartCalendarRenderer: Error processing activities', error);
      setInternalError('Failed to process calendar activities');
      return [];
    }
  }, [activities, metadata]);

  // Handle mouse events
  const handleMouseEnter = (activity, event) => {
    setHoveredActivity(activity);
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY
    });
    if (onActivityHover) onActivityHover(activity, event);
  };

  const handleMouseLeave = () => {
    setHoveredActivity(null);
    if (onActivityLeave) onActivityLeave();
  };

  // Handle advanced export
  const handleExport = async (format) => {
    try {
      console.log(`📤 Exporting calendar data as ${format.toUpperCase()}`);
      setShowExportMenu(false);

      const exportResult = await calendarExportService.exportCalendar(
        processedActivities,
        metadata,
        format,
        {
          filename: `calendar_${metadata.commodity || 'activities'}_${new Date().toISOString().split('T')[0]}`,
          includeWeatherData: true,
          includeMetadata: true,
          includeAdvisory: true
        }
      );

      if (exportResult.success) {
        console.log(`✅ Calendar exported successfully as ${exportResult.format}`);

        // Call original onDownload callback if provided
        if (onDownload) {
          onDownload(exportResult);
        }
      } else {
        console.error('❌ Export failed:', exportResult.error);
      }

    } catch (error) {
      console.error('❌ Export error:', error);
      setShowExportMenu(false);
    }
  };

  // Check if activity is active for given time period
  const isActivityActive = (activity, timeUnit) => {
    const { start, end, calendarType } = activity;

    if (calendarType === 'production' || typeof start === 'number') {
      // Production cycle (week-based)
      const weekNum = timeUnit.weekNum || timeUnit.week;
      return weekNum >= start && weekNum <= end;
    } else {
      // Seasonal crop (month-based) - work with month names
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Get the month name from timeUnit (could be in timeUnit.month or derived from monthIndex)
      let currentMonth = timeUnit.month;
      if (!currentMonth && typeof timeUnit.monthIndex !== 'undefined') {
        currentMonth = monthNames[timeUnit.monthIndex];
      }

      if (!currentMonth) return false;

      // Check if activity should be active in this month
      const startMonth = typeof start === 'string' ? start : monthNames[start - 1] || start;
      const endMonth = typeof end === 'string' ? end : monthNames[end - 1] || end;

      // Simple month name comparison for single month activities
      if (startMonth === endMonth) {
        return currentMonth === startMonth;
      }

      // For multi-month activities, check if current month is in range
      const startIndex = monthNames.indexOf(startMonth);
      const endIndex = monthNames.indexOf(endMonth);
      const currentIndex = monthNames.indexOf(currentMonth);

      if (startIndex === -1 || endIndex === -1 || currentIndex === -1) {
        return false;
      }

      // Handle year-crossing activities (e.g., December to February)
      if (startIndex <= endIndex) {
        return currentIndex >= startIndex && currentIndex <= endIndex;
      } else {
        return currentIndex >= startIndex || currentIndex <= endIndex;
      }
    }
  };

  // Loading state with enhanced spinner
  if (loading) {
    return (
      <div className={`border border-gray-200 rounded-lg p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center">
            <FaSpinner className="animate-spin h-8 w-8 text-green-600 mr-3" />
            <span className="text-gray-600 font-medium">Loading calendar data...</span>
          </div>
          <div className="text-xs text-gray-500 text-center">
            <p>Processing agricultural calendar information</p>
            {metadata.commodity && (
              <p className="mt-1">Commodity: {metadata.commodity}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state (handling both external error and internal error)
  const currentError = error || internalError;
  if (currentError) {
    return (
      <div className={`border border-red-200 bg-red-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-red-600 mb-2">
          <FaExclamationTriangle className="mr-2" />
          <span className="font-semibold">Calendar Error</span>
        </div>
        <p className="text-red-700 text-sm">{currentError}</p>
        <div className="mt-3 text-xs text-red-600">
          <button
            onClick={() => setInternalError(null)}
            className="underline hover:text-red-800"
          >
            Clear error and retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!processedActivities.length) {
    return (
      <div className={`border border-gray-200 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Calendar Data Available</h3>
          <p className="text-gray-600 mb-4">
            No calendar activities found for the selected criteria.
            {metadata.dataSourceUsed === 'no-data' &&
              ' Upload Excel calendar data through the dashboard to see calendar activities.'}
          </p>
          {showDataSourceIndicator && metadata.dataSourceUsed && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
              <span>Data source: {metadata.dataSourceUsed}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Data source indicator
  const DataSourceIndicator = () => {
    if (!showDataSourceIndicator || !metadata.dataSourceUsed) return null;

    const sourceConfig = {
      uploaded: { color: 'bg-green-100 text-green-800', label: 'Uploaded Data', priority: 'High Priority' },
      computed: { color: 'bg-blue-100 text-blue-800', label: 'Computed Data', priority: 'Medium Priority' },
      'no-data': { color: 'bg-gray-100 text-gray-800', label: 'No Data Available', priority: 'Excel Upload Required' },
      offline: { color: 'bg-gray-100 text-gray-800', label: 'Offline Mode', priority: 'Fallback' }
    };

    const config = sourceConfig[metadata.dataSourceUsed] || sourceConfig.offline;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${config.color} mb-4`}>
        <FaInfoCircle className="mr-1" />
        <span>{config.label} • {config.priority}</span>
        {metadata.confidence && (
          <span className="ml-2">• Confidence: {metadata.confidence}</span>
        )}
      </div>
    );
  };

  // View mode selector (hidden in fullpage mode)
  const ViewModeSelector = () => {
    if (currentViewMode === 'fullpage') return null;

    return (
      <div className="flex space-x-2 mb-4">
        {['timeline', 'list', 'cards'].map(mode => (
          <button
            key={mode}
            onClick={() => setCurrentViewMode(mode)}
            className={`px-3 py-1 rounded text-sm capitalize ${
              currentViewMode === mode
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    );
  };

  // Timeline view (table format)
  const TimelineView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 p-3 text-left font-semibold">
              Activity
            </th>
            {weeksData.map((week, index) => (
              <th key={index} className="border border-gray-300 p-2 text-xs text-center min-w-[80px]">
                <div className="font-medium text-gray-700">{week.month || 'Month'}</div>
                <div className="text-gray-600">{week.week || `Week ${index + 1}`}</div>
                <div className="text-gray-500">{week.dateRange || ''}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processedActivities.map((activity, index) => (
            <tr key={activity.id || index}>
              <td className="border border-gray-300 p-3 font-medium">
                {activity.activity}
              </td>
              {weeksData.map((week, weekIndex) => {
                const isActive = isActivityActive(activity, week);

                // Check for exact color from timeline data (for exact color support)
                let cellStyle = {};
                let cellClassName = `border border-gray-300 p-2 cursor-pointer min-w-[80px] w-[80px]`;

                if (isActive) {
                  // Check if activity has timeline data with exact colors
                  if (activity.timeline && activity.timeline[weekIndex]) {
                    const weekData = activity.timeline[weekIndex];
                    if (weekData.backgroundColor && weekData.backgroundColor !== '#FFFFFF') {
                      cellStyle.backgroundColor = weekData.backgroundColor;
                    } else {
                      cellClassName += ` ${activity.color}`;
                    }
                  } else if (activity.exactColor && activity.exactColor !== '#FFFFFF') {
                    cellStyle.backgroundColor = activity.exactColor;
                  } else {
                    cellClassName += ` ${activity.color}`;
                  }
                }

                return (
                  <td
                    key={weekIndex}
                    className={cellClassName}
                    style={cellStyle}
                    onMouseEnter={(e) => handleMouseEnter(activity, e)}
                    onMouseLeave={handleMouseLeave}
                    title={`${activity.activity} - ${week.week || `Week ${weekIndex + 1}`}`}
                  >
                    {isActive && (
                      <div className="w-full h-6 rounded-sm opacity-80 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow-sm">●</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // List view
  const ListView = () => (
    <div className="space-y-3">
      {processedActivities.map((activity, index) => (
        <div
          key={activity.id || index}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
          onMouseEnter={(e) => handleMouseEnter(activity, e)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded ${activity.color}`}></div>
              <h4 className="font-semibold">{activity.activity}</h4>
            </div>
            <div className="text-sm text-gray-600">
              {activity.start} - {activity.end}
            </div>
          </div>
          {activity.advisory && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">
              {activity.advisory}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  // Cards view
  const CardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {processedActivities.map((activity, index) => (
        <div
          key={activity.id || index}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onMouseEnter={(e) => handleMouseEnter(activity, e)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center space-x-2 mb-3">
            <div className={`w-4 h-4 rounded ${activity.color}`}></div>
            <h4 className="font-semibold text-sm">{activity.activity}</h4>
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {activity.start} - {activity.end}
          </div>
          {activity.advisory && (
            <p className="text-xs text-gray-700 line-clamp-3">
              {activity.advisory}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  // Full-page view (CalendarFullPageView style)
  const FullPageView = () => {
    const monthHeaders = getMonthHeaders();
    const weekHeaders = getWeekHeaders();
    const dateRanges = getDateRanges();
    const title = calendarTitle || `${metadata.selectedCrop?.toUpperCase() || 'CROP'} PRODUCTION-${metadata.selectedSeason === 'Major' ? 'MAJOR SEASON' : 'PRODUCTION CYCLE'}`;

    return (
      <>
        {/* Calendar Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 uppercase">
            {title}
          </h1>
        </div>

        {/* Calendar Table with enhanced horizontal scroll */}
        <div className="overflow-x-auto shadow-lg" style={{ maxHeight: '90vh' }}>
          <div className="min-w-max">
            <table className="border-collapse border border-gray-400" style={{ minWidth: 'max-content' }}>
              {/* Month Headers */}
              <thead>
                <tr>
                  <th className="border border-gray-400 bg-gray-100 px-4 py-2 text-left font-semibold text-sm sticky left-0 z-10 min-w-[300px] max-w-[350px]">
                    S/N STAGE OF ACTIVITY
                  </th>
                  {monthHeaders.map((month, index) => (
                    <th
                      key={index}
                      className="border border-gray-400 bg-blue-100 px-2 py-2 text-center font-bold text-sm min-w-[240px]"
                      colSpan={month.colspan}
                    >
                      {month.name}
                    </th>
                  ))}
                </tr>

                {/* Week Headers */}
                <tr>
                  <th className="border border-gray-400 bg-gray-100 px-4 py-2 sticky left-0 z-10 min-w-[300px] max-w-[350px]"></th>
                  {weekHeaders.map((week, index) => (
                    <th
                      key={index}
                      className="border border-gray-400 bg-gray-50 px-1 py-1 text-center text-xs font-medium min-w-[60px]"
                    >
                      {week.label}
                    </th>
                  ))}
                </tr>

                {/* Date Headers */}
                <tr>
                  <th className="border border-gray-400 bg-gray-100 px-4 py-1 text-xs font-medium sticky left-0 z-10 min-w-[300px] max-w-[350px]">
                    Calendar Date
                  </th>
                  {dateRanges.map((dateRange, index) => (
                    <th
                      key={index}
                      className="border border-gray-400 bg-white px-1 py-1 text-center text-xs"
                    >
                      {dateRange}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Activity Rows */}
              <tbody>
                {processedActivities.map((activity, rowIndex) => {
                  const totalCells = weeksData.length || 28;
                  const cells = [];

                  for (let i = 0; i < totalCells; i++) {
                    const isActive = isActivityActive(activity, weeksData[i] || { week: i + 1 });
                    const cellData = { active: isActive, value: '', background: null };
                    cells.push(cellData);
                  }

                  return (
                    <tr key={rowIndex}>
                      {/* Activity Name Column */}
                      <td className="border border-gray-400 bg-gray-50 px-4 py-2 text-sm font-medium sticky left-0 z-10 min-w-[300px] max-w-[350px]">
                        <div className="flex items-start">
                          <span className="mr-2 text-gray-600 flex-shrink-0">{rowIndex + 1}</span>
                          <span className="break-words leading-tight" title={activity.activity}>
                            {activity.activity}
                          </span>
                        </div>
                      </td>

                      {/* Timeline Cells */}
                      {cells.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-gray-400 text-center text-xs h-8 min-w-[60px]"
                          style={{
                            backgroundColor: getCellBackgroundColor(cell, activity.activity),
                            color: getCellTextColor(cell)
                          }}
                          onMouseEnter={(e) => onActivityHover && onActivityHover(activity, e)}
                          onMouseLeave={() => onActivityLeave && onActivityLeave()}
                          title={`${activity.activity} - ${weeksData[cellIndex]?.week || `Week ${cellIndex + 1}`}`}
                        >
                          {/* No content - show solid colors only */}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* File Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mt-1">
            Generated from calendar data • {processedActivities.length} activities • {weeksData.length} time periods
          </p>
        </div>
      </>
    );
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentViewMode) {
      case 'fullpage':
        return <FullPageView />;
      case 'list':
        return <ListView />;
      case 'cards':
        return <CardsView />;
      case 'timeline':
      default:
        return <TimelineView />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header - hidden in fullpage mode */}
      {currentViewMode !== 'fullpage' && (
        <div className="flex justify-between items-start mb-4">
        <div>
          <DataSourceIndicator />
          {showMetadata && metadata && (
            <div className="text-xs text-gray-600">
              {metadata.activitiesCount && (
                <span>Activities: {metadata.activitiesCount} • </span>
              )}
              {metadata.queryTime && (
                <span>Updated: {new Date(metadata.queryTime).toLocaleTimeString()}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <ViewModeSelector />
          {onDownload && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                title="Export Calendar"
              >
                <FaDownload size={14} />
                <FaChevronDown size={10} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    <div className="text-xs text-gray-600 font-semibold mb-2 px-2">Export Format</div>
                    {calendarExportService.getSupportedFormatsSync().map((format) => (
                      <button
                        key={format.value}
                        onClick={() => handleExport(format.value)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-between"
                      >
                        <span className="font-medium">{format.label}</span>
                        <span className="text-xs text-gray-500">
                          {format.value === 'csv' && '📊'}
                          {format.value === 'pdf' && '📄'}
                          {format.value === 'excel' && '📈'}
                          {format.value === 'json' && '🔧'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 p-2">
                    <div className="text-xs text-gray-500 px-2">
                      Includes weather data and agricultural advisories
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay to close menu when clicking outside */}
              {showExportMenu && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                ></div>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Calendar Content with Error Boundary */}
      <div className="calendar-content">
        {(() => {
          try {
            return renderCurrentView();
          } catch (error) {
            console.error('SmartCalendarRenderer: Error rendering view', error);
            return (
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center text-yellow-600 mb-2">
                  <FaExclamationTriangle className="mr-2" />
                  <span className="font-semibold">Rendering Error</span>
                </div>
                <p className="text-yellow-700 text-sm">
                  Unable to render calendar view. Please try refreshing or switching view modes.
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => setCurrentViewMode('list')}
                    className="text-xs text-yellow-600 underline hover:text-yellow-800 mr-3"
                  >
                    Switch to List View
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-yellow-600 underline hover:text-yellow-800"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            );
          }
        })()}
      </div>

      {/* Tooltip */}
      {hoveredActivity && (
        <div
          className="absolute bg-gray-800 w-[280px] text-white text-sm p-3 rounded shadow-lg z-50"
          style={{
            top: tooltipPosition.y + 10,
            left: tooltipPosition.x + 10,
          }}
        >
          <p className="font-semibold mb-2">{hoveredActivity.activity}</p>
          <div className="text-xs text-gray-300 mb-2">
            <span>Period: {hoveredActivity.start} - {hoveredActivity.end}</span>
            {hoveredActivity.calendarType && (
              <span className="ml-2">• Type: {hoveredActivity.calendarType}</span>
            )}
          </div>
          {hoveredActivity.advisory && (
            <p className="text-xs text-gray-100 leading-relaxed">
              {hoveredActivity.advisory}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

SmartCalendarRenderer.propTypes = {
  activities: PropTypes.array,
  weeksData: PropTypes.array,
  metadata: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onActivityHover: PropTypes.func,
  onActivityLeave: PropTypes.func,
  onDownload: PropTypes.func,
  className: PropTypes.string,
  viewMode: PropTypes.oneOf(['timeline', 'list', 'cards', 'fullpage']),
  showDataSourceIndicator: PropTypes.bool,
  showMetadata: PropTypes.bool,
  calendarTitle: PropTypes.string
};

export default SmartCalendarRenderer;