import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Layers, ChevronRight, ChevronDown, Play, Square, AlertTriangle } from 'lucide-react';
import userService from '../services/userService';
import { getRegionName, getDistrictName } from '../data/ghanaCodes';

const EnhancedCalendarViewer = () => {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [expandedCalendars, setExpandedCalendars] = useState(new Set());
  const [filters, setFilters] = useState({
    calendarType: '',
    commodity: '',
    regionCode: '',
    year: ''
  });

  useEffect(() => {
    fetchCalendars();
  }, [filters]);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      // Use the new enhanced calendars endpoint
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:3001/api/enhanced-calendars?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setCalendars(result.data || []);
      } else {
        console.error('Failed to fetch calendars:', result);
        setCalendars([]);
      }
    } catch (error) {
      console.error('Error fetching enhanced calendars:', error);
      setCalendars([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandCalendar = (calendarId) => {
    const newExpanded = new Set(expandedCalendars);
    if (newExpanded.has(calendarId)) {
      newExpanded.delete(calendarId);
    } else {
      newExpanded.add(calendarId);
    }
    setExpandedCalendars(newExpanded);
  };

  const getCalendarTypeIcon = (calendarType) => {
    switch (calendarType) {
      case 'seasonal':
        return <Calendar className="h-5 w-5 text-green-600" />;
      case 'cycle':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Layers className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCalendarTypeBadge = (calendarType) => {
    const colors = {
      seasonal: 'bg-green-100 text-green-800 border-green-200',
      cycle: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[calendarType] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {calendarType === 'seasonal' ? 'Seasonal' : 'Production Cycle'}
      </span>
    );
  };

  const formatTimelineInfo = (calendar) => {
    // Extract info from available data
    const majorSeason = calendar.majorSeason;
    const filename = calendar.fileData?.filename || 'Unknown file';
    
    if (calendar.calendarType === 'seasonal') {
      return {
        duration: `${calendar.totalWeeks || 'N/A'} weeks`,
        timing: majorSeason?.startMonth ? `${majorSeason.startMonth} season` : 'Seasonal calendar',
        period: filename.replace('.xlsx', '').replace('.xls', '')
      };
    } else {
      return {
        duration: `${calendar.cycleDuration || calendar.totalWeeks || 'N/A'} weeks`,
        timing: 'Flexible start date',
        period: calendar.breedType ? `Breed: ${calendar.breedType}` : 'Production cycle'
      };
    }
  };

  const getMonthName = (monthNum) => {
    if (!monthNum) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || 'N/A';
  };

  const renderActivityTimeline = (calendar) => {
    // Use sampleActivities from backend or extracted activities
    const activities = calendar.sampleActivities || [];
    
    if (!activities || activities.length === 0) {
      return <p className="text-gray-500 text-sm">No activities timeline available</p>;
    }

    // Filter out header rows and empty activities
    const cleanActivities = activities.filter(activity => 
      activity && 
      typeof activity === 'string' && 
      !activity.includes('|') && // Skip table header rows
      !activity.includes('WK') && // Skip week headers
      !activity.includes('Calendar Date') && // Skip date headers
      activity.trim().length > 0 &&
      !activity.startsWith('MAIZE PRODUCTION') // Skip title rows
    );

    if (cleanActivities.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-gray-500 text-sm mb-2">Raw Excel data detected:</p>
          <div className="bg-gray-50 p-2 rounded text-xs">
            <p className="font-medium mb-1">File: {calendar.fileData?.filename}</p>
            <p>Sheets: {Object.keys(calendar.fileData?.sheets || {}).join(', ')}</p>
            <p>Records: {calendar.fileData?.totalRecords || 0}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {cleanActivities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900">{activity}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  {calendar.calendarType === 'seasonal' ? 'Seasonal timing' : `Activity ${index + 1}`}
                </span>
              </div>
            </div>
          </div>
        ))}
        {cleanActivities.length > 5 && (
          <p className="text-sm text-gray-500 text-center">
            +{cleanActivities.length - 5} more activities
          </p>
        )}
      </div>
    );
  };

  const startProductionCycle = async (calendar) => {
    if (calendar.calendarType !== 'cycle') return;
    
    try {
      const cycleData = {
        calendarId: calendar.id,
        startDate: new Date().toISOString().split('T')[0], // Today
        batchName: `${calendar.commodity} Batch ${Date.now()}`,
        initialQuantity: 100, // Default
        notes: `Started from calendar: ${calendar.title}`
      };

      const response = await fetch('http://localhost:3001/api/production-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('donatrakAccessToken')}`
        },
        body: JSON.stringify(cycleData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Production cycle started successfully! Batch: ${result.data.batchName}`);
      } else {
        alert('Failed to start production cycle: ' + result.message);
      }
    } catch (error) {
      console.error('Error starting production cycle:', error);
      alert('Error starting production cycle');
    }
  };

  const getUniqueValues = (field) => {
    // Map backend field names to what we're looking for
    const fieldMap = {
      commodity: 'crop',
      regionCode: 'region', 
      districtCode: 'district'
    };
    const actualField = fieldMap[field] || field;
    const values = calendars.map(cal => cal[actualField]).filter(Boolean);
    return [...new Set(values)];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Agricultural Calendars</h2>
        <p className="text-gray-600">
          View and manage seasonal crop calendars and production cycle templates.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calendar Type</label>
          <select
            value={filters.calendarType}
            onChange={(e) => setFilters({...filters, calendarType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Types</option>
            <option value="seasonal">Seasonal</option>
            <option value="cycle">Production Cycle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commodity</label>
          <select
            value={filters.commodity}
            onChange={(e) => setFilters({...filters, commodity: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Commodities</option>
            {getUniqueValues('commodity').map(commodity => (
              <option key={commodity} value={commodity}>{commodity}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
          <select
            value={filters.regionCode}
            onChange={(e) => setFilters({...filters, regionCode: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Regions</option>
            {getUniqueValues('regionCode').map(regionCode => (
              <option key={regionCode} value={regionCode}>
                {getRegionName(regionCode) || regionCode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({...filters, year: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Years</option>
            {getUniqueValues('year').sort((a, b) => b - a).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar List */}
      {calendars.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Calendars Found</h3>
          <p className="text-gray-500">
            No enhanced calendars match your current filters. Try adjusting the filters or upload a new calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {calendars.map((calendar) => {
            const timelineInfo = formatTimelineInfo(calendar);
            const isExpanded = expandedCalendars.has(calendar.id);
            
            return (
              <div key={calendar.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      {getCalendarTypeIcon(calendar.calendarType)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {calendar.title || `${calendar.crop} Calendar`}
                          </h3>
                          {getCalendarTypeBadge(calendar.calendarType)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {calendar.region} - {calendar.district}
                          </span>
                          <span>{timelineInfo.duration}</span>
                          <span>{timelineInfo.timing}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {calendar.calendarType === 'cycle' && (
                        <button
                          onClick={() => startProductionCycle(calendar)}
                          className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Cycle
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpandCalendar(calendar.id)}
                        className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Calendar Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Calendar Details</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Commodity:</span>
                            <span className="ml-2 capitalize">{calendar.crop}</span>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <span className="ml-2">{timelineInfo.duration}</span>
                          </div>
                          <div>
                            <span className="font-medium">Period:</span>
                            <span className="ml-2">{timelineInfo.period}</span>
                          </div>
                          <div>
                            <span className="font-medium">Activities:</span>
                            <span className="ml-2">{calendar.sampleActivities?.length || calendar.fileData?.totalRecords || 0} activities</span>
                          </div>
                          {calendar.description && (
                            <div>
                              <span className="font-medium">Description:</span>
                              <p className="ml-2 text-gray-600">{calendar.description}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Activity Timeline */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Activity Timeline</h4>
                        {renderActivityTimeline(calendar)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnhancedCalendarViewer;