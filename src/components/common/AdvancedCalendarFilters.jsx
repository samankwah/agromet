import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaFilter, FaUndo, FaCalendarAlt, FaMapMarkerAlt, FaSeedling, FaCloudRain } from 'react-icons/fa';
import { getAllRegionNames, getDistrictsByRegionName } from '../../data/ghanaCodes';

const AdvancedCalendarFilters = ({
  onFiltersChange,
  initialFilters = {},
  showWeatherIntegration = false,
  showSeasonalFilters = true,
  showCropTypeFilters = true,
  showActivityFilters = true,
  className = ""
}) => {
  // Filter state
  const [filters, setFilters] = useState({
    region: initialFilters.region || 'All Regions',
    district: initialFilters.district || 'All Districts',
    cropType: initialFilters.cropType || 'All Crops',
    season: initialFilters.season || 'All Seasons',
    activityType: initialFilters.activityType || 'All Activities',
    monthRange: initialFilters.monthRange || { start: '', end: '' },
    climateZone: initialFilters.climateZone || 'All Zones',
    ...initialFilters
  });

  // Data for filter options
  const [districtOptions, setDistrictOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Static filter options
  const regionOptions = useMemo(() => {
    const regions = getAllRegionNames();
    return ['All Regions', ...regions];
  }, []);

  const cropTypeOptions = [
    'All Crops', 'Maize', 'Rice', 'Sorghum', 'Tomato', 'Soybean', 'Yam', 'Cassava', 'Plantain', 'Cocoa'
  ];

  const seasonOptions = [
    'All Seasons', 'Major Season', 'Minor Season', 'Dry Season', 'Rainy Season'
  ];

  const activityTypeOptions = [
    'All Activities', 'Site Selection', 'Land Preparation', 'Planting',
    'Fertilizer Application', 'Weeding', 'Pest Control', 'Harvesting',
    'Water Management', 'Post Harvest'
  ];

  const climateZoneOptions = [
    'All Zones', 'Forest Zone', 'Savannah Zone', 'Coastal Zone', 'Transition Zone'
  ];

  const monthOptions = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load districts when region changes
  useEffect(() => {
    if (filters.region && filters.region !== 'All Regions') {
      setIsLoading(true);
      try {
        const districts = getDistrictsByRegionName(filters.region);
        setDistrictOptions(['All Districts', ...districts.map(d => d.name || d)]);
      } catch (error) {
        console.warn('Error loading districts:', error);
        setDistrictOptions(['All Districts']);
      } finally {
        setIsLoading(false);
      }
    } else {
      setDistrictOptions(['All Districts']);
    }
  }, [filters.region]);

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };

    // Reset dependent filters
    if (filterKey === 'region') {
      newFilters.district = 'All Districts';
    }

    setFilters(newFilters);

    // Notify parent component
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  // Reset all filters
  const handleReset = () => {
    const defaultFilters = {
      region: 'All Regions',
      district: 'All Districts',
      cropType: 'All Crops',
      season: 'All Seasons',
      activityType: 'All Activities',
      monthRange: { start: '', end: '' },
      climateZone: 'All Zones'
    };

    setFilters(defaultFilters);
    if (onFiltersChange) {
      onFiltersChange(defaultFilters);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.region !== 'All Regions' ||
           filters.district !== 'All Districts' ||
           filters.cropType !== 'All Crops' ||
           filters.season !== 'All Seasons' ||
           filters.activityType !== 'All Activities' ||
           filters.monthRange.start ||
           filters.monthRange.end ||
           filters.climateZone !== 'All Zones';
  }, [filters]);

  // Filter input component
  const FilterSelect = ({ label, value, options, onChange, icon: Icon, disabled = false }) => (
    <div className="flex flex-col space-y-1">
      <label className="text-xs font-medium text-gray-700 flex items-center">
        {Icon && <Icon className="mr-1 text-gray-500" size={12} />}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  // Month range component
  const MonthRangeFilter = () => (
    <div className="flex flex-col space-y-1">
      <label className="text-xs font-medium text-gray-700 flex items-center">
        <FaCalendarAlt className="mr-1 text-gray-500" size={12} />
        Month Range
      </label>
      <div className="flex space-x-2">
        <select
          value={filters.monthRange.start}
          onChange={(e) => handleFilterChange('monthRange', { ...filters.monthRange, start: e.target.value })}
          className="p-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent flex-1"
        >
          <option value="">Start</option>
          {monthOptions.slice(1).map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        <select
          value={filters.monthRange.end}
          onChange={(e) => handleFilterChange('monthRange', { ...filters.monthRange, end: e.target.value })}
          className="p-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent flex-1"
        >
          <option value="">End</option>
          {monthOptions.slice(1).map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-green-600" />
          <h3 className="font-semibold text-gray-800">Advanced Filters</h3>
          {hasActiveFilters && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
          disabled={!hasActiveFilters}
        >
          <FaUndo size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Location Filters */}
        <FilterSelect
          label="Region"
          value={filters.region}
          options={regionOptions}
          onChange={(value) => handleFilterChange('region', value)}
          icon={FaMapMarkerAlt}
        />

        <FilterSelect
          label="District"
          value={filters.district}
          options={districtOptions}
          onChange={(value) => handleFilterChange('district', value)}
          icon={FaMapMarkerAlt}
          disabled={filters.region === 'All Regions'}
        />

        {/* Crop & Activity Filters */}
        {showCropTypeFilters && (
          <FilterSelect
            label="Crop Type"
            value={filters.cropType}
            options={cropTypeOptions}
            onChange={(value) => handleFilterChange('cropType', value)}
            icon={FaSeedling}
          />
        )}

        {showActivityFilters && (
          <FilterSelect
            label="Activity Type"
            value={filters.activityType}
            options={activityTypeOptions}
            onChange={(value) => handleFilterChange('activityType', value)}
            icon={FaFilter}
          />
        )}

        {/* Seasonal Filters */}
        {showSeasonalFilters && (
          <>
            <FilterSelect
              label="Season"
              value={filters.season}
              options={seasonOptions}
              onChange={(value) => handleFilterChange('season', value)}
              icon={FaCalendarAlt}
            />

            <FilterSelect
              label="Climate Zone"
              value={filters.climateZone}
              options={climateZoneOptions}
              onChange={(value) => handleFilterChange('climateZone', value)}
              icon={FaCloudRain}
            />
          </>
        )}

        {/* Month Range Filter */}
        <MonthRangeFilter />
      </div>

      {/* Weather Integration Notice */}
      {showWeatherIntegration && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="flex items-center space-x-2 text-blue-800">
            <FaCloudRain />
            <span className="font-medium">Weather Integration</span>
          </div>
          <p className="text-blue-700 mt-1">
            Real-time weather data will be incorporated into calendar recommendations when available.
          </p>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Active Filters: </span>
            {Object.entries(filters)
              .filter(([key, value]) => {
                if (key === 'monthRange') {
                  return value.start || value.end;
                }
                return value && value !== `All ${key.charAt(0).toUpperCase() + key.slice(1)}s` &&
                       value !== 'All Regions' && value !== 'All Districts' && value !== 'All Zones';
              })
              .map(([key, value]) => {
                if (key === 'monthRange') {
                  const range = [];
                  if (value.start) range.push(`From ${value.start}`);
                  if (value.end) range.push(`To ${value.end}`);
                  return range.join(', ');
                }
                return `${key}: ${value}`;
              })
              .join(' • ')}
          </div>
        </div>
      )}
    </div>
  );
};

AdvancedCalendarFilters.propTypes = {
  onFiltersChange: PropTypes.func.isRequired,
  initialFilters: PropTypes.object,
  showWeatherIntegration: PropTypes.bool,
  showSeasonalFilters: PropTypes.bool,
  showCropTypeFilters: PropTypes.bool,
  showActivityFilters: PropTypes.bool,
  className: PropTypes.string
};

export default AdvancedCalendarFilters;