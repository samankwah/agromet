/**
 * Calendar Preview Table Component
 * 
 * Displays parsed Excel calendar data in a visual format similar to the original spreadsheet
 * with activities, timeline, and color coding
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaExpand, FaCompress, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';

const CalendarPreviewTable = ({ 
  calendarData, 
  loading = false, 
  error = null,
  className = "",
  showSummary = true,
  allowFullscreen = true 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // Handle loading state
  if (loading) {
    return (
      <div className={`border border-gray-200 rounded-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
          <span className="text-gray-600">Parsing calendar...</span>
        </div>
      </div>
    );
  }

  // Handle error state with more detailed feedback
  if (error || !calendarData?.success) {
    return (
      <div className={`border border-red-200 bg-red-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-red-600 mb-2">
          <FaInfoCircle className="mr-2" />
          <span className="font-semibold">Calendar Parsing Error</span>
        </div>
        <p className="text-red-700 text-sm mb-3">
          {error || calendarData?.error || 'Unable to parse the Excel file. Please check the format and try again.'}
        </p>
        <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
          <strong>Possible causes:</strong>
          <ul className="mt-1 ml-4 list-disc">
            <li>Excel file structure doesn&apos;t match expected format</li>
            <li>Missing timeline headers or activity names</li>
            <li>File may be corrupted or password protected</li>
            <li>Unsupported Excel version or format</li>
          </ul>
        </div>
      </div>
    );
  }

  // Handle no calendar grid data with fallback display
  if (!calendarData?.data?.calendarGrid) {
    // Try to display raw data if available
    if (calendarData?.data) {
      return (
        <div className={`border border-yellow-200 bg-yellow-50 rounded-lg p-6 ${className}`}>
          <div className="text-center text-yellow-700 mb-4">
            <FaInfoCircle className="mx-auto text-3xl mb-2" />
            <p className="font-semibold">Partial Calendar Data Detected</p>
            <p className="text-sm">The Excel file was read but calendar structure couldn&apos;t be fully parsed.</p>
          </div>
          {calendarData.data.activities && (
            <div className="text-left">
              <h4 className="font-semibold mb-2">Detected Activities:</h4>
              <ul className="text-sm space-y-1">
                {calendarData.data.activities.slice(0, 10).map((activity, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    {activity.name} ({activity.activePeriods?.length || 0} periods)
                  </li>
                ))}
              </ul>
              {calendarData.data.activities.length > 10 && (
                <p className="text-sm text-gray-600 mt-2">
                  ... and {calendarData.data.activities.length - 10} more
                </p>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className={`border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <FaCalendarAlt className="mx-auto text-3xl mb-2" />
          <p>No calendar data to display</p>
        </div>
      </div>
    );
  }

  const { data } = calendarData;
  const { calendarGrid, timeline, activities, summary } = data;
  
  // Ensure we have minimum required data with fallbacks
  const safeTimeline = timeline || { columns: [], totalSpan: 0 };
  const safeActivities = activities || [];
  const safeSummary = summary || { totalActivities: safeActivities.length };
  const safeCalendarGrid = calendarGrid || { rows: [] };

  const handleCellClick = (rowIndex, colIndex, cellData) => {
    setSelectedCell({
      rowIndex,
      colIndex,
      cellData,
      activity: activities[rowIndex]?.name,
      timeLabel: timeline.columns[colIndex - 1]?.label // -1 because first col is activity
    });
  };

  const getCellBackgroundColor = (cell) => {
    if (cell.background) {
      return cell.background;
    }
    if (cell.active) {
      // Default colors based on activity presence
      return '#E8F5E8'; // Light green for active periods
    }
    return 'transparent';
  };

  const getCellTextColor = (cell) => {
    if (cell.active) {
      return '#2D5A2D'; // Dark green for active cells
    }
    return '#374151'; // Default gray
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const fullscreenClass = isFullscreen ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : '';

  return (
    <div className={`${fullscreenClass} ${className}`}>
      {/* Calendar Header */}
      <div className="flex justify-between items-start mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
            <FaCalendarAlt className="mr-2 text-green-600" />
            {calendarData.title || 'Calendar Preview'}
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center space-x-4">
              <span><strong>Type:</strong> {data.type === 'seasonal' ? 'Seasonal Calendar' : 'Production Cycle'}</span>
              <span><strong>Commodity:</strong> {data.commodity}</span>
            </div>
            {calendarData.fileName && (
              <div><strong>File:</strong> {calendarData.fileName}</div>
            )}
          </div>
        </div>
        
        {allowFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        )}
      </div>

      {/* Summary Statistics */}
      {showSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-blue-600 font-semibold text-lg">{safeSummary.totalActivities || safeActivities.length}</div>
            <div className="text-blue-700">Activities</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-green-600 font-semibold text-lg">{safeTimeline.totalSpan || safeTimeline.columns.length}</div>
            <div className="text-green-700">Time Periods</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-yellow-600 font-semibold text-lg">
              {safeActivities.reduce((sum, act) => sum + (act.activePeriods?.length || 0), 0)}
            </div>
            <div className="text-yellow-700">Active Periods</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-purple-600 font-semibold text-lg">{data.type === 'seasonal' ? 'Seasonal' : 'Cycle'}</div>
            <div className="text-purple-700">Calendar Type</div>
          </div>
        </div>
      )}

      {/* Calendar Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-100 z-10 min-w-[200px]">
                  Activity / Stage
                </th>
                {safeTimeline.columns.map((timeCol, index) => (
                  <th
                    key={index}
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[80px]"
                    title={timeCol.label}
                  >
                    <div className="truncate">
                      {timeCol.label}
                    </div>
                    {timeCol.isMonth && (
                      <div className="text-xs text-blue-600 mt-1">Month</div>
                    )}
                    {timeCol.isWeek && (
                      <div className="text-xs text-green-600 mt-1">Week</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {safeCalendarGrid.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {/* Activity Name Column */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-white z-10">
                    <div className="flex items-center">
                      <span className="truncate" title={row.activity}>
                        {row.activity}
                      </span>
                    </div>
                  </td>

                  {/* Timeline Cells */}
                  {row.cells.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-2 py-3 text-sm text-center border-r border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: getCellBackgroundColor(cell),
                        color: getCellTextColor(cell)
                      }}
                      onClick={() => handleCellClick(rowIndex, cellIndex + 1, cell)}
                      title={`${row.activity} - ${cell.timeLabel}${cell.value ? ': ' + cell.value : ''}`}
                    >
                      <div className="min-h-[24px] flex items-center justify-center">
                        {cell.active && (
                          <div className="w-full h-6 rounded flex items-center justify-center">
                            {cell.value || '●'}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">
          <strong>Legend:</strong>
        </div>
        <div className="flex flex-wrap items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 rounded border"></div>
            <span>Active Period</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span>Inactive Period</span>
          </div>
          <div className="text-gray-500">
            Click on cells for details
          </div>
        </div>
      </div>

      {/* Cell Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setSelectedCell(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-semibold mb-3">Activity Detail</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Activity:</strong> {selectedCell.activity}</div>
              <div><strong>Time Period:</strong> {selectedCell.timeLabel}</div>
              <div><strong>Status:</strong> {selectedCell.cellData.active ? 'Active' : 'Inactive'}</div>
              {selectedCell.cellData.value && (
                <div><strong>Value:</strong> {selectedCell.cellData.value}</div>
              )}
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={toggleFullscreen}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
          >
            Exit Fullscreen
          </button>
        </div>
      )}
    </div>
  );
};

CalendarPreviewTable.propTypes = {
  calendarData: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  showSummary: PropTypes.bool,
  allowFullscreen: PropTypes.bool
};

export default CalendarPreviewTable;