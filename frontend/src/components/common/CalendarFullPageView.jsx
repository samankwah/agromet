/**
 * Calendar Full Page View Component
 * 
 * Displays parsed Excel calendar data in full-page format that exactly matches
 * the original Excel spreadsheet layout with proper colors, structure, and formatting
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CalendarFullPageView = ({ 
  calendarData, 
  loading = false, 
  error = null,
  onBack = null
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mr-4"></div>
            <span className="text-xl text-gray-600">Parsing calendar...</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !calendarData?.success) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          
          <div className="border border-red-200 bg-red-50 rounded-lg p-6">
            <div className="flex items-center text-red-600 mb-2">
              <FaInfoCircle className="mr-2" />
              <span className="font-semibold">Calendar Parsing Error</span>
            </div>
            <p className="text-red-700">
              {error || calendarData?.error || 'Unable to parse the Excel file. Please check the format and try again.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle no data
  if (!calendarData?.data?.calendarGrid) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          
          <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
            <p>No calendar data to display</p>
          </div>
        </div>
      </div>
    );
  }

  const { data } = calendarData;
  const { calendarGrid, timeline, activities } = data;

  // Get activity-specific colors based on activity name (matching target image exactly)
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

  // Generate month headers from actual parsed timeline data
  const getMonthHeaders = () => {
    console.log('🗓️ Generating month headers from timeline:', { 
      totalColumns: timeline?.columns?.length,
      timelineMonths: timeline?.months?.length,
      sampleColumns: timeline?.columns?.slice(0, 10),
      timelineStructure: timeline
    });
    
    if (!timeline?.columns?.length) {
      console.log('⚠️ No timeline columns found, using fallback');
      return [{ name: 'TIMELINE', startIndex: 0, colspan: 1 }];
    }
    
    // Try to use the months array from sophisticated parser first
    if (timeline.months && timeline.months.length > 0) {
      console.log('✅ Using timeline.months from parser:', timeline.months);
      return timeline.months.map(month => ({
        name: month.name,
        startIndex: month.startIndex || month.startColumn || 0,
        colspan: month.colspan || ((month.endColumn || month.endWeekIndex) - (month.startColumn || month.startWeekIndex) + 1) || 4
      }));
    }
    
    // Build month headers from timeline columns
    const months = [];
    let currentMonth = null;
    let currentStartIndex = 0;
    let currentColspan = 0;
    
    timeline.columns.forEach((col, index) => {
      const monthLabel = col.monthLabel;
      
      if (monthLabel && monthLabel !== currentMonth) {
        // Start new month
        if (currentMonth) {
          months.push({
            name: currentMonth,
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
        name: currentMonth,
        startIndex: currentStartIndex,
        colspan: currentColspan
      });
    }
    
    // Enhanced fallback: if no proper month structure, create reasonable distribution
    if (months.length === 0) {
      const totalCols = timeline.columns.length;
      console.log('⚠️ Creating fallback month structure for', totalCols, 'columns');
      
      // Try to detect month pattern from column labels
      const detectedMonths = new Set();
      timeline.columns.forEach(col => {
        if (col.monthLabel) {
          detectedMonths.add(col.monthLabel);
        }
      });
      
      if (detectedMonths.size > 0) {
        const monthArray = Array.from(detectedMonths);
        const colsPerMonth = Math.floor(totalCols / monthArray.length);
        monthArray.forEach((month, i) => {
          months.push({
            name: month,
            startIndex: i * colsPerMonth,
            colspan: i === monthArray.length - 1 ? totalCols - (i * colsPerMonth) : colsPerMonth
          });
        });
      } else {
        // If we have 37 columns, create the exact 9-month structure
        if (totalCols === 37) {
          console.log('✅ Creating exact 9-month structure for 37 columns');
          const exactStructure = [
            { name: 'JAN', colspan: 5 },   // WK1-WK5
            { name: 'FEB', colspan: 4 },   // WK6-WK9  
            { name: 'MAR', colspan: 4 },   // WK10-WK13
            { name: 'APR', colspan: 4 },   // WK14-WK17
            { name: 'MAY', colspan: 4 },   // WK18-WK21
            { name: 'JUN', colspan: 4 },   // WK22-WK25
            { name: 'JUL', colspan: 4 },   // WK26-WK29
            { name: 'AUG', colspan: 4 },   // WK30-WK33
            { name: 'SEPT', colspan: 4 }   // WK34-WK37
          ];
          
          let currentIndex = 0;
          exactStructure.forEach(monthDef => {
            months.push({
              name: monthDef.name,
              startIndex: currentIndex,
              colspan: monthDef.colspan
            });
            currentIndex += monthDef.colspan;
          });
        } else {
          // Fallback for other column counts
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
      }
    }

    console.log('🗓️ Final months structure:', months, 'Total columns:', timeline.columns.length);
    return months;
  };

  // Generate week headers from actual timeline data
  const getWeekHeaders = () => {
    if (!timeline?.columns?.length) {
      console.log('⚠️ No timeline columns for weeks');
      return [];
    }
    
    const weeks = timeline.columns.map((col, index) => ({
      label: col.weekLabel || col.label || `W${index + 1}`,
      originalIndex: index,
      monthLabel: col.monthLabel,
      dateRange: col.dateRange
    }));

    console.log('📅 Generated weeks from timeline:', { 
      totalWeeks: weeks.length,
      sampleWeeks: weeks.slice(0, 10)
    });
    return weeks;
  };

  // Generate date ranges from actual timeline data
  const getDateRanges = () => {
    if (!timeline?.columns?.length) {
      console.log('⚠️ No timeline columns for dates');
      return [];
    }
    
    const dates = timeline.columns.map((col, index) => 
      col.dateRange || `W${index + 1}`
    );

    console.log('📆 Generated date ranges from timeline:', { 
      totalDates: dates.length,
      sampleDates: dates.slice(0, 10)
    });
    return dates;
  };

  const monthHeaders = getMonthHeaders();
  const calendarTitle = data.title || `${data.commodity?.toUpperCase() || 'CROP'} PRODUCTION-${data.type === 'seasonal' ? 'MAJOR SEASON' : 'PRODUCTION CYCLE'}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="max-w-full mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Form
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="px-6 py-8">
        <div className="max-w-full mx-auto">
          {/* Calendar Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 uppercase">
              {calendarTitle}
            </h1>
          </div>

          {/* Calendar Table with enhanced horizontal scroll */}
          <div className="overflow-x-auto shadow-lg" style={{ maxHeight: '90vh' }}>
            <div className="min-w-max"> {/* Ensure table maintains its width */}
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
                  {getWeekHeaders().map((week, index) => (
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
                  {getDateRanges().map((dateRange, index) => (
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
                {calendarGrid.rows.map((row, rowIndex) => {
                  console.log(`🔄 Rendering activity row ${rowIndex + 1}: "${row.activity}" with ${row.cells?.length || 0} cells`);
                  
                  // Use actual timeline length instead of hardcoded 28
                  const cells = [];
                  const totalCells = timeline?.columns?.length || row.cells?.length || 28;
                  console.log(`  📏 Using ${totalCells} cells for this row`);
                  
                  for (let i = 0; i < totalCells; i++) {
                    const cellData = row.cells?.[i] || { active: false, value: '', background: null };
                    cells.push(cellData);
                  }
                  
                  return (
                    <tr key={rowIndex}>
                      {/* Activity Name Column - Enhanced for full name display */}
                      <td className="border border-gray-400 bg-gray-50 px-4 py-2 text-sm font-medium sticky left-0 z-10 min-w-[300px] max-w-[350px]">
                        <div className="flex items-start">
                          <span className="mr-2 text-gray-600 flex-shrink-0">{rowIndex + 1}</span>
                          <span className="break-words leading-tight" title={row.activity}>
                            {row.activity}
                          </span>
                        </div>
                      </td>

                      {/* Timeline Cells - Always 28 cells */}
                      {cells.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-gray-400 text-center text-xs h-8 min-w-[60px]"
                          style={{
                            backgroundColor: getCellBackgroundColor(cell, row.activity),
                            color: getCellTextColor(cell)
                          }}
                        >
                          {/* No content - show solid colors only, no white dots */}
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
            {calendarData.fileName && (
              <p>Source File: {calendarData.fileName}</p>
            )}
            <p className="mt-1">
              Generated from Excel calendar • {activities?.length || 0} activities • {timeline?.totalSpan || 0} time periods
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

CalendarFullPageView.propTypes = {
  calendarData: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onBack: PropTypes.func
};

export default CalendarFullPageView;