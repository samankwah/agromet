import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaInfoCircle, FaCalendarAlt, FaDownload, FaExpand, FaChevronDown } from 'react-icons/fa';
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
  viewMode = "timeline", // timeline, list, cards
  showDataSourceIndicator = true,
  showMetadata = true
}) => {
  const [hoveredActivity, setHoveredActivity] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Generate activity colors
  const generateActivityColor = (activityName) => {
    const colorMap = {
      'site': 'bg-blue-500',
      'land': 'bg-yellow-600',
      'plant': 'bg-black',
      'sow': 'bg-black',
      'fertil': 'bg-yellow-400',
      'weed': 'bg-red-500',
      'pest': 'bg-red-500',
      'harvest': 'bg-green-500',
      'water': 'bg-blue-300',
      'irrig': 'bg-blue-300'
    };

    const name = (activityName || '').toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
      if (name.includes(key)) return color;
    }
    return 'bg-gray-500';
  };

  // Generate basic advisory
  const generateBasicAdvisory = (activity) => {
    const activityName = activity.activity || activity.name || 'Unknown';
    return `Follow best practices for ${activityName.toLowerCase()}. Consult local agricultural extension officers for specific guidance.`;
  };

  // Process activities for different calendar types
  const processedActivities = useMemo(() => {
    if (!activities.length) return [];

    return activities.map((activity, index) => ({
      id: activity.id || index,
      activity: activity.activity || activity.name || 'Unknown Activity',
      start: activity.start || activity.startMonth || activity.startWeek,
      end: activity.end || activity.endMonth || activity.endWeek,
      color: activity.color || generateActivityColor(activity.activity || activity.name),
      advisory: activity.advisory || activity.description || generateBasicAdvisory(activity),
      calendarType: activity.metadata?.calendarType || metadata.calendarType || 'seasonal',
      originalData: activity
    }));
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

  // Loading state
  if (loading) {
    return (
      <div className={`border border-gray-200 rounded-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
          <span className="text-gray-600">Loading calendar data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`border border-red-200 bg-red-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-red-600 mb-2">
          <FaInfoCircle className="mr-2" />
          <span className="font-semibold">Calendar Error</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
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

  // View mode selector
  const ViewModeSelector = () => (
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
                return (
                  <td
                    key={weekIndex}
                    className={`border border-gray-300 p-2 cursor-pointer ${
                      isActive ? activity.color : ""
                    }`}
                    onMouseEnter={(e) => handleMouseEnter(activity, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {isActive && (
                      <div className="w-full h-6 rounded-sm opacity-80"></div>
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

  // Render current view
  const renderCurrentView = () => {
    switch (currentViewMode) {
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
      {/* Header */}
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

      {/* Calendar Content */}
      {renderCurrentView()}

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
  viewMode: PropTypes.oneOf(['timeline', 'list', 'cards']),
  showDataSourceIndicator: PropTypes.bool,
  showMetadata: PropTypes.bool
};

export default SmartCalendarRenderer;