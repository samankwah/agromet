import { useState, useEffect } from "react";
import { districtOfGhana } from "../districts";
import { FaDownload, FaShareAlt, FaSpinner, FaExclamationTriangle, FaSync, FaFolder } from "react-icons/fa";
import agriculturalDataService from '../services/agriculturalDataService';
import dynamicCalendarManager from '../services/dynamicCalendarManager';
import PageTitle from '../components/PageTitle';
import { InlineOfflineWarning } from '../components/common/OfflineNotification';
import SmartCalendarRenderer from '../components/common/SmartCalendarRenderer';
import { getSafeDistrictsByRegion } from '../utils/regionDistrictHelpers';
import { SafeDistrictOptions } from '../components/common/SafeSelectOptions';
import { getAllRegionNames } from '../data/ghanaCodes';
import toast from 'react-hot-toast';

// DownloadButton Component
const DownloadButton = ({ onDownload }) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleClick = () => {
    setIsTooltipOpen(!isTooltipOpen);
    if (onDownload) onDownload();
  };

  const handleTooltipClose = () => {
    setTimeout(() => setIsTooltipOpen(false), 2000); // Auto-close after 2 seconds
  };

  return (
    <div className="relative group z-20">
      <button
        onClick={handleClick}
        onMouseLeave={handleTooltipClose}
        className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 focus:ring-2 focus:ring-green-300 transition-colors duration-200 w-12 h-12 flex items-center justify-center"
        aria-label="Download Calendar"
      >
        <FaDownload size={20} />
      </button>
      <span
        className={`
          absolute bg-gray-800 text-white rounded py-1.5 px-3 opacity-0 transition-opacity duration-200
          ${isTooltipOpen ? "opacity-100" : "opacity-0"}
          md:group-hover:opacity-100
          md:top-[-40px] md:left-1/2 md:-translate-x-1/2 md:text-xs
          top-full left-1/2 -translate-x-1/2 mt-2 text-sm
          min-w-[80px] text-center
        `}
      >
        Download
      </span>
    </div>
  );
};

// ShareButton Component
const ShareButton = ({ onShare }) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleClick = () => {
    setIsTooltipOpen(!isTooltipOpen);
    if (onShare) onShare();
  };

  const handleTooltipClose = () => {
    setTimeout(() => setIsTooltipOpen(false), 2000); // Auto-close after 2 seconds
  };

  return (
    <div className="relative group z-20">
      <button
        onClick={handleClick}
        onMouseLeave={handleTooltipClose}
        className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition-colors duration-200 w-12 h-12 flex items-center justify-center"
        aria-label="Share Calendar"
      >
        <FaShareAlt size={20} />
      </button>
      <span
        className={`
          absolute bg-gray-800 text-white rounded py-1.5 px-3 opacity-0 transition-opacity duration-200
          ${isTooltipOpen ? "opacity-100" : "opacity-0"}
          md:group-hover:opacity-100
          md:top-[-40px] md:left-1/2 md:-translate-x-1/2 md:text-xs
          top-full left-1/2 -translate-x-1/2 mt-2 text-sm
          min-w-[60px] text-center
        `}
      >
        Share
      </span>
    </div>
  );
};

// All hardcoded activities removed - now using dynamic calendar manager

// Hardcoded activity arrays removed - now using dynamic calendar manager

// Get regions dynamically from ghanaCodes to ensure consistency
const regionsOfGhana = getAllRegionNames();

// Helper function to generate user-friendly error messages
const getUserFriendlyErrorMessage = (error, context) => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || error?.response?.status;

  const commonSuggestions = [
    "Please check your internet connection",
    "Try refreshing the page",
    "Contact support if the problem persists"
  ];

  switch (context) {
    case 'calendar_fetch':
      if (errorMessage.includes('network') || errorCode === 'NETWORK_ERROR') {
        return {
          message: "Unable to connect to the server",
          details: "Please check your internet connection and try again",
          suggestions: ["Check your internet connection", "Try again in a few moments"]
        };
      }
      if (errorCode === 404) {
        return {
          message: "No calendar data found",
          details: "No calendar data is available for the selected filters",
          suggestions: ["Try different crop or location selections", "Upload calendar data in the dashboard"]
        };
      }
      if (errorCode >= 500) {
        return {
          message: "Server is temporarily unavailable",
          details: "The server is experiencing issues. Please try again later",
          suggestions: ["Try again in a few minutes", "Contact support if the issue persists"]
        };
      }
      return {
        message: "Failed to load calendar data",
        details: errorMessage || "An unexpected error occurred",
        suggestions: commonSuggestions
      };

    case 'region_fetch':
      return {
        message: "Failed to load regions",
        details: "Unable to load the list of regions",
        suggestions: ["Refresh the page", "Try selecting a specific region manually"]
      };

    case 'district_fetch':
      return {
        message: "Failed to load districts",
        details: "Unable to load districts for the selected region",
        suggestions: ["Try selecting a different region", "Refresh the page"]
      };

    default:
      return {
        message: "An unexpected error occurred",
        details: errorMessage || "Please try again",
        suggestions: commonSuggestions
      };
  }
};

// Year and season options
const yearSeasonOptions = [
  { label: "2024 Minor Season", year: 2024, season: "Minor" },
  { label: "2025 Major Season", year: 2025, season: "Major" },
  { label: "2025 Minor Season", year: 2025, season: "Minor" },
];

// Function to generate weeks for each month (4 weeks per month)
const generateWeeks = (season) => {
  const weeks = [];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Days in each month (non-leap year)

  let startMonth, endMonth;
  if (season === "Major") {
    startMonth = 0; // January (month index 0) - match Excel JAN start
    endMonth = 8; // September (month index 8) - match Excel SEPT end
  } else {
    startMonth = 8; // September (month index 8)
    endMonth = 11; // December (month index 11)
  }

  for (let month = startMonth; month <= endMonth; month++) {
    const days = daysInMonth[month];
    const daysPerWeek = Math.ceil(days / 4);

    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const startDay = (weekNum - 1) * daysPerWeek + 1;
      const endDay = Math.min(weekNum * daysPerWeek, days);
      const dateRange = `${String(startDay).padStart(2, "0")}-${String(
        endDay
      ).padStart(2, "0")}`;
      weeks.push({
        month: new Date(0, month).toLocaleString("default", { month: "long" }),
        monthIndex: month,
        week: `Week ${weekNum}`,
        dateRange,
      });
    }
  }

  return weeks;
};

// Function to adjust activities for the selected season
const adjustActivitiesForSeason = (baseActivities, season) => {
  const months = [
    { month: "January", monthNo: 1 },
    { month: "February", monthNo: 2 },
    { month: "March", monthNo: 3 },
    { month: "April", monthNo: 4 },
    { month: "May", monthNo: 5 },
    { month: "June", monthNo: 6 },
    { month: "July", monthNo: 7 },
    { month: "August", monthNo: 8 },
    { month: "September", monthNo: 9 },
    { month: "October", monthNo: 10 },
    { month: "November", monthNo: 11 },
    { month: "December", monthNo: 12 },
  ];

  if (season === "Major") {
    return baseActivities; // Major season activities are already set from February to October
  }

  // For Minor Season (September to December), compress the timeline
  const majorSeasonMonths = baseActivities.map(
    (activity) => months.find((m) => m?.month === activity.start).monthNo
  );
  const minMajorMonth = Math.min(...majorSeasonMonths);
  const maxMajorMonth = Math.max(...majorSeasonMonths);
  const majorSeasonDuration = maxMajorMonth - minMajorMonth + 1;

  const minorSeasonStartMonth = 9; // September
  const minorSeasonEndMonth = 12; // December
  const minorSeasonDuration = minorSeasonEndMonth - minorSeasonStartMonth + 1;

  return baseActivities.map((activity) => {
    const activityStartMonth = months.find(
      (m) => m?.month === activity.start
    ).monthNo;
    const activityEndMonth = months.find(
      (m) => m?.month === activity.end
    ).monthNo;

    // Calculate the relative position of the activity in the Major Season timeline
    const startRatio =
      (activityStartMonth - minMajorMonth) / majorSeasonDuration;
    const endRatio = (activityEndMonth - minMajorMonth) / majorSeasonDuration;

    // Map to the Minor Season timeline
    const newStartMonthNo = Math.round(
      minorSeasonStartMonth + startRatio * minorSeasonDuration
    );
    const newEndMonthNo = Math.round(
      minorSeasonStartMonth + endRatio * minorSeasonDuration
    );

    const newStartMonth = months.find(
      (m) => m.monthNo === newStartMonthNo
    )?.month;
    const newEndMonth = months.find((m) => m.monthNo === newEndMonthNo)?.month;

    return {
      ...activity,
      start: newStartMonth,
      end: newEndMonth,
    };
  });
};


const CropCalendar = () => {
  const [selectedCrop, setSelectedCrop] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedYearSeason, setSelectedYearSeason] =
    useState("2025 Major Season"); // Default to 2025 Major Season
  const [farmingActivities, setFarmingActivities] = useState([]); // Default state for activities
  const [loading, setLoading] = useState(false); // Loading state for filtering
  const [initialLoad, setInitialLoad] = useState(true); // Track if initial load
  const [districtData, setDistrictData] = useState({ districts: [], meta: {} }); // Safe district data
  const [hoveredActivity, setHoveredActivity] = useState(null); // To track the hovered activity
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // Track position of the tooltip
  const [weeksData, setWeeksData] = useState([]); // Dynamic weeks data based on season
  
  // New state for dynamic data from backend
  const [dynamicData, setDynamicData] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableCrops, setAvailableCrops] = useState([]);
  const [isUsingDynamicData, setIsUsingDynamicData] = useState(false);
  const [apiStats, setApiStats] = useState(null);
  const [regionDistrictMapping, setRegionDistrictMapping] = useState({});
  const [calendarMetadata, setCalendarMetadata] = useState({});
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Get the selected year and season details
  const selectedOption = yearSeasonOptions.find(
    (option) => option.label === selectedYearSeason
  );
  const selectedYear = selectedOption?.year || 2025;
  const selectedSeason = selectedOption?.season || "Major";

  // Update weeks data based on the selected season
  useEffect(() => {
    const weeks = generateWeeks(selectedSeason);
    setWeeksData(weeks);
  }, [selectedSeason]);

  // Initialize dynamic calendar manager on component mount
  useEffect(() => {
    const initializeCalendarManager = async () => {
      try {
        // Excel-only calendar system - no template initialization needed
        console.log('📄 Excel-only calendar system - no template initialization');
        console.log('✅ Dynamic Calendar Manager initialized successfully');
        setError(null); // Clear any previous errors
      } catch (error) {
        // Only log in development mode to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to initialize Dynamic Calendar Manager:', error);
        }
        setError({
          type: 'initialization',
          message: 'Failed to initialize calendar system',
          details: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    initializeCalendarManager();
  }, []); // Run once on mount

  // Load dynamic data from backend on component mount with caching and optimization
  useEffect(() => {
    const loadDynamicData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use Promise.allSettled for better error handling and partial success
        const apiCalls = [
          agriculturalDataService.getDistricts(),
          agriculturalDataService.getCrops(),
          agriculturalDataService.getStatistics()
        ];

        const results = await Promise.race([
          Promise.allSettled(apiCalls),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 15000) // Increased timeout
          )
        ]);

        const [districtsResult, cropsResult, statsResult] = results;

        // Handle districts result (even if partially successful)
        if (districtsResult.status === 'fulfilled' && districtsResult.value.success) {
          const districts = districtsResult.value.data;
          setAvailableDistricts(districts);

          // Build region-district mapping more efficiently
          const mapping = districts.reduce((acc, item) => {
            if (item.region && item.district) {
              if (!acc[item.region]) {
                acc[item.region] = new Set();
              }
              acc[item.region].add(item.district);
            }
            return acc;
          }, {});

          // Convert Sets to arrays for final storage
          const finalMapping = {};
          Object.keys(mapping).forEach(region => {
            finalMapping[region] = Array.from(mapping[region]);
          });
          setRegionDistrictMapping(finalMapping);
        } else if (districtsResult.status === 'rejected') {
          console.warn('Districts API failed:', districtsResult.reason);
        }

        // Handle crops result
        if (cropsResult.status === 'fulfilled' && cropsResult.value.success) {
          setAvailableCrops(cropsResult.value.data);
        } else if (cropsResult.status === 'rejected') {
          console.warn('Crops API failed:', cropsResult.reason);
        }

        // Handle stats result
        if (statsResult.status === 'fulfilled' && statsResult.value.success) {
          const stats = statsResult.value.data;
          setApiStats(stats);
          // Only use dynamic data if we have uploaded calendars
          if (stats.cropCalendars > 0) {
            setIsUsingDynamicData(true);
          }
        } else if (statsResult.status === 'rejected') {
          console.warn('Stats API failed:', statsResult.reason);
        }

        // Check if all requests failed
        const allFailed = results.every(result =>
          result.status === 'rejected' || !result.value?.success
        );

        if (allFailed) {
          throw new Error('All API requests failed');
        }

        setRetryCount(0);
      } catch (error) {
        // Only log API errors in development to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading dynamic agricultural data:', error);
        }

        const userFriendlyMessage = getUserFriendlyErrorMessage(error, 'calendar_fetch');
        setError({
          type: 'data_loading',
          message: userFriendlyMessage.message,
          details: userFriendlyMessage.details,
          suggestions: userFriendlyMessage.suggestions,
          timestamp: new Date().toISOString(),
          retryable: retryCount < maxRetries
        });

        if (retryCount < maxRetries) {
          toast.error(`Loading failed, retrying... (${retryCount + 1}/${maxRetries})`);
        } else {
          toast.error(userFriendlyMessage.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Add debouncing for retry attempts
    const timeoutId = setTimeout(loadDynamicData, retryCount * 1000);
    return () => clearTimeout(timeoutId);
  }, [retryCount]);

  // Fetch dynamic crop calendar data when filters change
  useEffect(() => {
    const loadCropCalendarData = async () => {
      if (!isUsingDynamicData) return;

      setLoading(true);
      setError(null); // Clear filter-specific errors

      try {
        const filters = {};

        if (selectedDistrict !== 'All Districts') {
          filters.district = selectedDistrict;
        }

        if (selectedCrop !== 'all') {
          filters.commodity = selectedCrop;
        }

        if (selectedSeason) {
          filters.season = selectedSeason;
        }

        if (selectedYear) {
          filters.year = selectedYear;
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Calendar data request timeout')), 8000)
        );

        const result = await Promise.race([
          agriculturalDataService.getCropCalendar(filters),
          timeoutPromise
        ]);

        if (result.success && result.data.length > 0) {
          // Transform backend data to match the expected format
          const transformedData = transformBackendDataToActivities(result.data);
          setDynamicData(transformedData);
        } else {
          setDynamicData([]);
        }
      } catch (error) {
        // Only log in development to reduce production console noise
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading crop calendar data:', error);
        }
        setError({
          type: 'calendar_data',
          message: 'Failed to load calendar data for current filters',
          details: error.message,
          timestamp: new Date().toISOString(),
          retryable: true
        });
        setDynamicData([]);
      } finally {
        setLoading(false);
      }
    };

    if (isUsingDynamicData) {
      loadCropCalendarData();
    }
  }, [selectedCrop, selectedDistrict, selectedSeason, selectedYear, isUsingDynamicData]);

  // Load districts safely when region changes
  useEffect(() => {
    if (selectedRegion && selectedRegion !== "All Regions") {
      try {
        const result = getSafeDistrictsByRegion(selectedRegion, {
          preferNewData: true,
          excelDataOnly: true,
          enableCaching: true
        });

        setDistrictData(result);

        // Log any data source issues in development
        if (process.env.NODE_ENV === 'development' && result.meta.hasErrors) {
          console.warn('District data has errors:', result.meta);
        }
      } catch (error) {
        console.error('Error loading districts for region:', selectedRegion, error);
        setDistrictData({ districts: [], meta: { error: error.message } });

        const userFriendlyMessage = getUserFriendlyErrorMessage(error, 'district_fetch');
        setError({
          type: 'district_loading',
          message: `Failed to load districts for ${selectedRegion}`,
          details: userFriendlyMessage.details,
          suggestions: userFriendlyMessage.suggestions,
          timestamp: new Date().toISOString(),
          retryable: false
        });
        toast.error(`Failed to load districts for ${selectedRegion}`);
      }
    } else {
      setDistrictData({ districts: [], meta: {} });
    }
  }, [selectedRegion]);

  // Function to parse Excel data from backend into activities
  const parseExcelDataToActivities = (calendar) => {
    const activities = [];
    const sheets = calendar.fileData.sheets;

    if (!sheets || typeof sheets !== 'object') {
      console.error('Invalid sheets data for calendar:', calendar.id);
      return activities;
    }

    // Process each sheet
    Object.keys(sheets).forEach(sheetName => {
      const sheet = sheets[sheetName];

      if (!sheet || !sheet.data || !Array.isArray(sheet.data)) {
        console.warn(`Sheet "${sheetName}" has no data array`);
        return;
      }

      // Find activity column and month columns
      const { activityColumnIndex, monthColumns } = findColumnsInExcelData(sheet.data);

      if (activityColumnIndex === -1) {
        console.warn(`Could not find activity column in sheet: ${sheetName}`);
        return;
      }

      // Extract activities from rows
      sheet.data.forEach((row, rowIndex) => {
        if (!Array.isArray(row) || rowIndex < 3) {
          return; // Skip headers and invalid rows
        }

        const activityName = row[activityColumnIndex];
        if (!activityName || typeof activityName !== 'string') {
          return;
        }

        // Skip row numbers and headers
        const lowerActivityName = activityName.toLowerCase();
        if (lowerActivityName.includes('s/n') ||
            lowerActivityName.includes('stage') ||
            lowerActivityName.includes('activity') ||
            /^\d+$/.test(activityName.toString().trim())) {
          return;
        }

        // Find which months this activity spans
        const { startMonth, endMonth } = findActivityTimespan(row, monthColumns);

        // Skip activities with no timing data
        if (!startMonth || !endMonth) {
          return;
        }

        const normalizedName = normalizeActivityName(activityName);
        const activity = {
          activity: normalizedName,
          start: startMonth,
          end: endMonth,
          color: generateColorFromActivityName(normalizedName),
          advisory: `Follow best practices for ${normalizedName.toLowerCase()}`,
          calendarId: calendar.id,
          commodity: calendar.crop || calendar.commodity,
          regionCode: calendar.region,
          districtCode: calendar.district,
          season: 'Major',
          metadata: {
            source: 'uploaded',
            sheet: sheetName,
            row: rowIndex,
            timingSource: 'excel'
          }
        };

        activities.push(activity);
      });
    });

    return activities;
  };

  // Helper functions for Excel parsing
  const findColumnsInExcelData = (data) => {
    let activityColumnIndex = -1;
    const monthColumns = [];
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // Look in the first 3 rows for Excel structure
    for (let rowIndex = 0; rowIndex < Math.min(3, data.length); rowIndex++) {
      const row = data[rowIndex];
      if (!Array.isArray(row)) continue;

      row.forEach((cell, colIndex) => {
        if (!cell) return;
        const cellLower = String(cell).toLowerCase().trim();

        // Find activity column
        if (cellLower.includes('activity') || cellLower.includes('stage') ||
            cellLower === 'stage of activity' || cellLower === 'activity') {
          activityColumnIndex = colIndex;
        }

        // Find month columns
        const matchingMonth = months.find(month => {
          return cellLower === month || cellLower === month.toUpperCase() ||
                 cellLower === getFullMonthName(month).toLowerCase();
        });

        if (matchingMonth && !monthColumns.find(m => m.index === colIndex)) {
          const fullMonthName = getFullMonthName(matchingMonth);
          monthColumns.push({
            index: colIndex,
            month: fullMonthName,
            monthIndex: months.indexOf(matchingMonth),
            abbreviation: matchingMonth.toUpperCase()
          });
        }
      });
    }

    // Sort month columns by their position in the year
    monthColumns.sort((a, b) => a.monthIndex - b.monthIndex);

    return { activityColumnIndex, monthColumns };
  };

  const findActivityTimespan = (row, monthColumns) => {
    const filledMonths = [];

    monthColumns.forEach(monthInfo => {
      if (monthInfo.index < row.length) {
        const cellValue = row[monthInfo.index];
        const hasContent = cellValue !== null && cellValue !== undefined &&
                           cellValue !== '' && String(cellValue).trim() !== '';

        if (hasContent) {
          // Look for timing markers: X, x, ✓, •, 1, dates, etc.
          const valueStr = String(cellValue).trim().toLowerCase();
          if (valueStr === 'x' || valueStr === '✓' || valueStr === '•' ||
              valueStr === '1' || valueStr.includes('-') ||
              /^\d+$/.test(valueStr) || valueStr.length === 1) {
            filledMonths.push(monthInfo.month);
          }
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
  };

  const getFullMonthName = (monthAbbr) => {
    const monthMap = {
      'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
      'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
      'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
    };
    return monthMap[monthAbbr.toLowerCase()] || monthAbbr;
  };



  // Function to normalize and clean activity names
  const normalizeActivityName = (rawName) => {
    if (!rawName || typeof rawName !== 'string') {
      return 'Unknown Activity';
    }

    let cleanName = rawName.trim();

    // Handle numeric activity names - convert to meaningful names
    if (/^\d+$/.test(cleanName)) {
      const activityNumber = parseInt(cleanName);
      const numericMapping = {
        1: 'Site Selection',
        2: 'Land Preparation',
        3: 'Planting/Sowing',
        4: 'First Fertilizer Application',
        5: 'First Weeding',
        6: 'Second Fertilizer Application',
        7: 'Second Weeding/Pest Control',
        8: 'Harvesting',
        9: 'Post-Harvest Activities',
        10: 'Marketing',
        11: 'Storage',
        12: 'Processing'
      };

      if (numericMapping[activityNumber]) {
        return numericMapping[activityNumber];
      }
    }

    // Handle common Excel formatting issues
    cleanName = cleanName
      .replace(/^\d+\.?\s*/, '') // Remove leading numbers and dots
      .replace(/^\|?\s*/, '')    // Remove leading pipes
      .replace(/^[-_\s]+/, '')   // Remove leading dashes, underscores, spaces
      .replace(/[_-]+/g, ' ')    // Replace underscores and dashes with spaces
      .trim();

    // Handle common abbreviations and expand them
    const abbreviationMap = {
      'prep': 'Preparation',
      'fert': 'Fertilizer',
      'fertil': 'Fertilizer',
      'harv': 'Harvest',
      'weed': 'Weeding',
      'pest': 'Pest Control',
      'irrig': 'Irrigation',
      'maint': 'Maintenance',
      'mgmt': 'Management',
      'ctrl': 'Control',
      'app': 'Application',
      'applic': 'Application'
    };

    // Apply abbreviation expansions
    let expandedName = cleanName.toLowerCase();
    Object.entries(abbreviationMap).forEach(([abbrev, full]) => {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      expandedName = expandedName.replace(regex, full);
    });

    // Capitalize first letter of each word
    cleanName = expandedName.replace(/\w\S*/g, (word) =>
      word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
    );

    // Handle specific agricultural activity patterns
    const patterns = [
      { pattern: /(\d+)(?:st|nd|rd|th)?\s*(weed|fertilizer|spray)/i,
        replacement: (match, num, activity) => `${getOrdinal(num)} ${activity.charAt(0).toUpperCase() + activity.slice(1)}` },
      { pattern: /land\s+prep/i, replacement: 'Land Preparation' },
      { pattern: /site\s+select/i, replacement: 'Site Selection' },
      { pattern: /post\s*harvest/i, replacement: 'Post-Harvest Activities' },
      { pattern: /pest\s+control/i, replacement: 'Pest Control' },
      { pattern: /weed\s+control/i, replacement: 'Weed Control' }
    ];

    patterns.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        cleanName = cleanName.replace(pattern, replacement);
      } else {
        cleanName = cleanName.replace(pattern, replacement);
      }
    });

    return cleanName || 'Unknown Activity';
  };

  // Helper function to get ordinal numbers
  const getOrdinal = (num) => {
    const n = parseInt(num);
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };

  // Function to normalize and fix activity colors
  const normalizeActivityColor = (color, activityName) => {
    // If no color provided, generate one based on activity type
    if (!color) {
      return generateColorFromActivityName(activityName);
    }

    // Convert string color to consistent format
    const normalizedColor = String(color).trim();

    // Fix problematic colors
    const problematicColors = [
      '#000000', '#000', 'black', 'Black', 'BLACK',
      '#FFFFFF', '#FFF', 'white', 'White', 'WHITE'
    ];

    if (problematicColors.includes(normalizedColor)) {
      return generateColorFromActivityName(activityName);
    }

    // Ensure color has # prefix if it's a hex color
    if (/^[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
      return `#${normalizedColor}`;
    }

    // Return as-is if it's already a valid color format
    return normalizedColor;
  };

  // Generate appropriate colors based on activity name
  const generateColorFromActivityName = (activityName) => {
    if (!activityName) return '#6B7280'; // Default gray

    const name = activityName.toLowerCase();

    // Define color mapping for different activity types
    const colorMap = {
      // Site and preparation activities
      'site': '#3B82F6',      // Blue
      'selection': '#3B82F6',  // Blue
      'preparation': '#F59E0B', // Amber
      'land': '#F59E0B',       // Amber
      'clearing': '#F59E0B',   // Amber

      // Planting activities
      'plant': '#10B981',      // Emerald
      'sowing': '#10B981',     // Emerald
      'seed': '#10B981',       // Emerald

      // Fertilizer activities
      'fertil': '#FBBF24',     // Yellow
      'nutrient': '#FBBF24',   // Yellow
      'compost': '#FBBF24',    // Yellow
      'manure': '#FBBF24',     // Yellow

      // Weeding and pest control
      'weed': '#EF4444',       // Red
      'pest': '#DC2626',       // Dark red
      'spray': '#DC2626',      // Dark red
      'control': '#DC2626',    // Dark red

      // Water management
      'water': '#06B6D4',      // Cyan
      'irrigat': '#06B6D4',    // Cyan
      'drain': '#0891B2',      // Dark cyan

      // Harvesting
      'harvest': '#059669',    // Dark green
      'pick': '#059669',       // Dark green
      'collect': '#059669',    // Dark green

      // Post-harvest
      'dry': '#D97706',        // Orange
      'stor': '#D97706',       // Orange
      'process': '#D97706',    // Orange
      'market': '#7C3AED',     // Purple

      // General maintenance
      'maintain': '#6B7280',   // Gray
      'check': '#6B7280',      // Gray
      'monitor': '#6B7280'     // Gray
    };

    // Find matching color based on activity name
    for (const [key, color] of Object.entries(colorMap)) {
      if (name.includes(key)) {
        return color;
      }
    }

    // Default color based on hash of activity name for consistency
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#F97316'];
    return colors[Math.abs(hash) % colors.length];
  };

  // Function to transform backend crop calendar data to activity format
  const transformBackendDataToActivities = (cropCalendarData) => {
    // Return the raw calendar data for processing
    return cropCalendarData || [];
  };

  // Convert backend pre-parsed activities to calendar format
  const transformBackendActivitiesToCalendarFormat = (backendActivities) => {
    const convertedActivities = backendActivities.map((activity, index) => {
      // Handle both possible activity structures
      const rawActivityName = activity.activityName || activity.activity || activity.name || `Activity ${index + 1}`;

      // Normalize and clean activity name
      let activityName = normalizeActivityName(rawActivityName);

      const activityId = activity.activityId || activity.id || `activity_${index}`;

      // Extract and normalize primary background color from Excel data
      let primaryBackgroundColor = activity.backgroundColor ||
                                    activity.color ||
                                    activity.periods?.[0]?.backgroundColor;

      // Normalize and fix problematic colors
      primaryBackgroundColor = normalizeActivityColor(primaryBackgroundColor, activityName);

      // Build timeline from periods data
      const timeline = [];
      const activeWeeks = new Set();
      let startMonth = null;
      let endMonth = null;

      // Process periods to build timeline
      if (activity.periods && Array.isArray(activity.periods) && activity.periods.length > 0) {
        activity.periods.forEach((period, periodIndex) => {
          const weekIndex = period.timelineIndex || periodIndex;
          const month = period.month || 'Unknown';
          let backgroundColor = period.backgroundColor || period.color || primaryBackgroundColor;

          // Normalize color for timeline
          backgroundColor = normalizeActivityColor(backgroundColor, activityName);

          activeWeeks.add(weekIndex);

          // Track month range
          if (!startMonth) startMonth = month;
          endMonth = month;

          // Ensure timeline array is large enough
          while (timeline.length <= weekIndex) {
            timeline.push({
              active: false,
              background: 'transparent',
              content: '',
              week: timeline.length + 1,
              backgroundColor: null
            });
          }

          // Set active period with converted color
          timeline[weekIndex] = {
            active: true,
            background: backgroundColor,
            backgroundColor: backgroundColor,
            content: period.cellValue || period.content || '●',
            week: weekIndex + 1,
            month: month,
            monthIndex: period.monthIndex || 0
          };
        });
      } else {
        // Fallback: create a simple activity spanning first few weeks
        for (let i = 0; i < 4; i++) {
          timeline.push({
            active: i < 2, // Active for first 2 weeks as fallback
            background: i < 2 ? primaryBackgroundColor : 'transparent',
            backgroundColor: i < 2 ? primaryBackgroundColor : null,
            content: i < 2 ? '●' : '',
            week: i + 1,
            month: 'January',
            monthIndex: 0
          });
          if (i < 2) activeWeeks.add(i);
        }
        startMonth = 'January';
        endMonth = 'January';
      }

      // Fill remaining timeline slots up to 36 weeks if needed
      while (timeline.length < 36) {
        timeline.push({
          active: false,
          background: 'transparent',
          content: '',
          week: timeline.length + 1,
          backgroundColor: null
        });
      }

      const convertedActivity = {
        id: activityId,
        activity: activityName,
        name: activityName,
        type: activityName.toLowerCase().includes('harvest') ? 'harvest' :
              activityName.toLowerCase().includes('plant') ? 'planting' :
              activityName.toLowerCase().includes('weed') ? 'weeding' :
              activityName.toLowerCase().includes('fertil') ? 'fertilizer' : 'general',
        start: startMonth || 'January',
        end: endMonth || startMonth || 'January',
        color: primaryBackgroundColor,
        backgroundColor: primaryBackgroundColor,
        exactColor: primaryBackgroundColor,
        description: activityName,
        source: 'enhanced-excel-extraction',
        timeline: timeline,
        periods: activity.periods,
        activeWeeks: Array.from(activeWeeks).sort((a, b) => a - b),
        calendarType: 'seasonal'
      };

      return convertedActivity;
    });

    return convertedActivities;
  };


  useEffect(() => {
    const updateFarmingActivities = async () => {
      // Excel-only calendar system - only show uploaded Excel data
      if (isUsingDynamicData) {
        // Only show calendar if specific district is selected
        if (selectedDistrict === 'All Districts' || !selectedDistrict) {
          setFarmingActivities([]);
          return;
        }

        // Process the backend-filtered dynamic data directly
        if (dynamicData && dynamicData.length > 0) {
          const allActivities = [];

          dynamicData.forEach((calendar, index) => {
            // Add null checks for calendar object
            if (!calendar || typeof calendar !== 'object') {
              console.warn(`Invalid calendar object at index ${index}:`, calendar);
              return;
            }

            // Use enhanced parser schedule data (Priority 1)
            if (calendar.schedule && Array.isArray(calendar.schedule) && calendar.schedule.length > 0) {
              const enhancedActivities = transformBackendActivitiesToCalendarFormat(calendar.schedule);
              allActivities.push(...enhancedActivities);
            }
            // Fallback: Use backend pre-parsed activities (Priority 2)
            else if (calendar.activities && Array.isArray(calendar.activities) && calendar.activities.length > 0) {
              const backendActivities = transformBackendActivitiesToCalendarFormat(calendar.activities);
              allActivities.push(...backendActivities);
            } else {
              console.warn(`Calendar ${calendar.id || 'Unknown'} has no pre-parsed activities or schedule data`);
            }
          });

          setFarmingActivities(allActivities);
        } else {
          setFarmingActivities([]); // Show "no data" message
        }
        return;
      }
      
      setLoading(true);

      let baseActivities = [];
      let adjustedActivities = [];

      // Get dynamic calendar data based on the selected crop and location
      try {
        const filters = {
          commodity: selectedCrop === "all" ? "maize" : selectedCrop, // Default to maize for "all"
          regionCode: selectedRegion !== "All Regions" ? selectedRegion : undefined,
          districtCode: selectedDistrict !== "All Districts" ? selectedDistrict : undefined,
          season: selectedSeason
        };

        // Excel-only mode - only show uploaded calendar data
        const options = {
          strictMode: isUsingDynamicData
        };

        const calendarResult = await dynamicCalendarManager.getCalendarData(filters, options);

        if (calendarResult.success && calendarResult.data.length > 0) {
          baseActivities = calendarResult.data;

          // Map metadata field names for compatibility
          const mappedMetadata = {
            ...calendarResult.metadata,
            dataSourceUsed: calendarResult.metadata.dataSourceUsed || calendarResult.metadata.source,
            priority: calendarResult.metadata.priority || calendarResult.metadata.dataSourcePriority,
            hasUploadedData: (calendarResult.metadata.dataSourceUsed || calendarResult.metadata.source) === 'uploaded'
          };
          setCalendarMetadata(mappedMetadata);
        } else {
          // Handle strict mode "no data" vs general "no data"
          const isStrictModeNoData = calendarResult.metadata && calendarResult.metadata.strictMode;

          if (isStrictModeNoData) {
            baseActivities = [];
            setCalendarMetadata({
              dataSourceUsed: 'no-data',
              priority: 0,
              hasUploadedData: false,
              strictMode: true,
              message: calendarResult.message || 'No Excel calendar data uploaded for selected filters',
              queryTime: new Date().toISOString()
            });
          } else {
            baseActivities = [];
            setCalendarMetadata({
              dataSourceUsed: 'no-data',
              priority: 0,
              hasUploadedData: false,
              strictMode: false,
              message: 'No Excel calendar data available for this selection',
              queryTime: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error fetching dynamic calendar data:', error);
        baseActivities = [];
        setCalendarMetadata({
          dataSourceUsed: 'no-data',
          priority: 0,
          hasUploadedData: false,
          strictMode: isUsingDynamicData,
          queryTime: new Date().toISOString(),
          error: error.message
        });
        const userFriendlyMessage = getUserFriendlyErrorMessage(error, 'calendar_fetch');
        setError({
          type: 'calendar_manager',
          message: userFriendlyMessage.message,
          details: userFriendlyMessage.details,
          suggestions: userFriendlyMessage.suggestions,
          timestamp: new Date().toISOString(),
          retryable: true
        });
        toast.error(userFriendlyMessage.message);
      }

      // Adjust activities for the selected season
      adjustedActivities = adjustActivitiesForSeason(
        baseActivities,
        selectedSeason
      );

      if (initialLoad) {
        setFarmingActivities(adjustedActivities);
        setInitialLoad(false);
      } else {
        setFarmingActivities(adjustedActivities);
      }

      setLoading(false);
    };

    updateFarmingActivities().catch(console.error);
  }, [
    selectedCrop,
    selectedRegion,
    selectedDistrict,
    selectedYearSeason,
    selectedSeason,
    initialLoad,
    isUsingDynamicData,
    dynamicData,
  ]);

  const handleRegionChange = (event) => {
    setSelectedRegion(event.target.value);
    setSelectedDistrict("All Districts"); // Reset district when changing region
  };

  const handleCropChange = (event) => {
    setSelectedCrop(event.target.value);
    setSelectedRegion("All Regions"); // Reset region on crop change
    setSelectedDistrict("All Districts"); // Reset district on crop change
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
  };

  const handleYearSeasonChange = (e) => {
    setSelectedYearSeason(e.target.value);
  };


  const handleMouseEnter = (activity, e) => {
    setHoveredActivity(activity);
    setTooltipPosition({ x: e.pageX, y: e.pageY });
  };

  const handleMouseLeave = () => {
    setHoveredActivity(null);
  };

  const handleDownload = () => {
    try {
      if (!farmingActivities.length) {
        setError({
          type: 'download',
          message: 'No calendar data available to download',
          details: 'Please select different filters to see calendar activities',
          timestamp: new Date().toISOString(),
          retryable: false
        });
        return;
      }

      const headers = [
        "Activity",
        ...weeksData.map(
          (week) => `${week?.month} ${week.week} (${week.dateRange})`
        ),
      ];
      const csvRows = [headers.join(",")];

      farmingActivities.forEach((activity) => {
        const row = [
          activity.activity,
          ...weeksData.map((week) => {
            const month = week?.month;
            const isActive = month >= activity.start && month <= activity.end;
            return isActive ? "✔️" : "";
          }),
        ];
        csvRows.push(row.join(","));
      });
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `crop_calendar_${selectedYearSeason}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clear any download-related errors on success
      if (error?.type === 'download') {
        setError(null);
      }
    } catch (error) {
      console.error('Download error:', error);
      setError({
        type: 'download',
        message: 'Failed to download calendar data',
        details: error.message,
        timestamp: new Date().toISOString(),
        retryable: true
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `Crop Calendar - ${selectedYearSeason} (${selectedYear})`,
        text: `Check out this crop calendar for ${selectedYearSeason} in ${selectedYear}!`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        console.log("Share successful!");
        // Clear any share-related errors on success
        if (error?.type === 'share') {
          setError(null);
        }
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Calendar link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      setError({
        type: 'share',
        message: 'Failed to share calendar',
        details: error.message,
        timestamp: new Date().toISOString(),
        retryable: true
      });
    }
  };

  // Retry function for failed operations
  const handleRetry = () => {
    if (error?.retryable) {
      setError(null);
      if (error.type === 'data_loading') {
        setRetryCount(prev => prev + 1);
      } else if (error.type === 'download') {
        handleDownload();
      } else if (error.type === 'share') {
        handleShare();
      }
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Error Display Component
  const ErrorDisplay = ({ error, onRetry, onClear }) => {
    if (!error) return null;

    const getErrorIcon = (type) => {
      switch (type) {
        case 'initialization':
        case 'calendar_manager':
          return <FaExclamationTriangle className="text-red-500" />;
        case 'data_loading':
        case 'calendar_data':
          return <FaSpinner className="text-yellow-500" />;
        case 'download':
          return <FaDownload className="text-blue-500" />;
        case 'share':
          return <FaShareAlt className="text-purple-500" />;
        default:
          return <FaExclamationTriangle className="text-gray-500" />;
      }
    };

    const getErrorColor = (type) => {
      switch (type) {
        case 'initialization':
        case 'calendar_manager':
          return 'border-red-200 bg-red-50';
        case 'data_loading':
        case 'calendar_data':
          return 'border-yellow-200 bg-yellow-50';
        case 'download':
          return 'border-blue-200 bg-blue-50';
        case 'share':
          return 'border-purple-200 bg-purple-50';
        default:
          return 'border-gray-200 bg-gray-50';
      }
    };

    return (
      <div className={`border rounded-lg p-4 mb-6 ${getErrorColor(error.type)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1">{getErrorIcon(error.type)}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">{error.message}</h4>
              <p className="text-sm text-gray-600 mb-2">{error.details}</p>

              {/* Show suggestions if available */}
              {error.suggestions && error.suggestions.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Try these solutions:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    {error.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs text-gray-500">
                {new Date(error.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {error.retryable && (
              <button
                onClick={onRetry}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                title="Retry operation"
              >
                <FaSync size={12} />
                <span>Retry</span>
              </button>
            )}
            <button
              onClick={onClear}
              className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300 transition-colors"
              title="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageTitle title="Crop Calendar" />
      <div className="min-h-screen bg-gray-100 pt-20 lg:pt-24">
        {/* Main Container */}
        <div className="px-4 md:px-8 py-6 md:py-8">
          <InlineOfflineWarning
            message="Calendar data may be limited while server is offline"
            className="mb-6"
          />

          {/* Error Display */}
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onClear={clearError}
          />

          {/* Header Card - Separate White Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 md:px-8 py-6 md:py-8 mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-bold mb-3">
                  <span className="text-green-600">Agricultural </span>
                  <span className="text-blue-600">Calendar</span>
                </h1>
                <p className="text-gray-500 text-base md:text-lg">
                  Select your location and crop to view farming activities
                </p>
              </div>

              <div className="flex items-center gap-3 md:gap-4 justify-center md:justify-start">
                <div>
                  <DownloadButton onDownload={handleDownload} />
                </div>
                <div>
                  <ShareButton onShare={handleShare} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Card - Separate White Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 md:px-8 py-6 md:py-8 mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6 flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              Filter Options
            </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Year & Season
              </label>
              <select
                value={selectedYearSeason}
                onChange={handleYearSeasonChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
              {yearSeasonOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Crop Type
              </label>
              <select
                value={selectedCrop}
                onChange={handleCropChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
              <option value="all">All Crops</option>
              {/* Show dynamic crops if available */}
              {isUsingDynamicData && availableCrops.length > 0 ? (
                availableCrops.map((crop) => (
                  <option key={crop} value={crop.toLowerCase()}>
                    {crop}
                  </option>
                ))
              ) : (
                // Fallback to static crops
                <>
                  <option value="maize">Maize</option>
                  <option value="rice">Rice</option>
                  <option value="sorghum">Sorghum</option>
                  <option value="tomato">Tomato</option>
                  <option value="soybean">Soybean</option>
                </>
              )}
            </select>
          </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRegion}
                onChange={handleRegionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
              <option value="All Regions">All Regions</option>
              {regionsOfGhana.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={selectedRegion === "All Regions"}
              >
              <option value="All Districts">All Districts</option>
              {/* Show dynamic districts if available */}
              {isUsingDynamicData && availableDistricts.length > 0 ? (
                availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))
              ) : (
                // Fallback to static districts
                <SafeDistrictOptions
                  districts={districtData.districts}
                  placeholder=""
                  includeEmpty={false}
                />
              )}
            </select>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-red-500 text-sm">
              <span className="text-red-500">*</span> Both region and district must be selected to view calendar data
            </p>
          </div>
        </div>

          {/* Content Area - Gray Background (No Card) */}

          {/* Clean Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-transparent border-t-blue-600 animate-spin"></div>
                </div>
                <p className="text-gray-600">Loading agricultural data...</p>
              </div>
            </div>
          )}

          {/* No Data State - Gray Background */}
          {!loading && farmingActivities.length === 0 && (
            <div className="py-8 md:py-16 text-center px-4">
              <div className="max-w-md mx-auto">
                {/* Simple Plant Icon - Matching Target */}
                <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="text-2xl">🌱</div>
                </div>

                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">No Calendar Data</h3>

                {/* Enhanced messaging based on user selection and server status */}
                {error && error.type === 'calendar_manager' ? (
                  <div className="text-gray-600 mb-6 text-sm md:text-base">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 font-medium mb-2">🚨 Server Connection Issue</p>
                      <p className="text-red-700 mb-2">{error.message}</p>
                      {error.suggestions && (
                        <div className="mt-3">
                          <p className="text-red-700 font-medium text-xs">Troubleshooting Steps:</p>
                          <ul className="list-disc list-inside space-y-1 mt-1 text-xs text-red-600">
                            {error.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-700">
                        <p className="font-medium">🔧 Quick Fix:</p>
                        <p>Ensure server is running on port 3002, check network connection, or contact system administrator.</p>
                      </div>
                    </div>
                  </div>
                ) : selectedDistrict === 'All Districts' ? (
                  <div className="text-gray-600 mb-6 text-sm md:text-base">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800 font-medium mb-2">📍 District Selection Required</p>
                      <p className="text-amber-700 mb-2">Please select a specific district to view calendar data.</p>
                      <p className="text-amber-600 text-sm">
                        Calendar data is organized by individual districts. Choose any district from the dropdown above to see available farming activities.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600 mb-6 text-sm md:text-base">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-blue-800 font-medium mb-2">📊 No Data for {selectedDistrict}</p>
                      <p className="text-blue-700 mb-3">
                        No Excel calendar file has been uploaded for <strong>{selectedDistrict}</strong> district.
                      </p>
                      <div className="bg-white border border-blue-300 rounded p-3 text-blue-800 text-sm">
                        <p className="font-medium mb-2">💡 Available Options:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Upload calendar data via the <strong>Dashboard → Create Calendar</strong></li>
                          <li>Try different districts (some may have existing data)</li>
                          <li>Check other crop types or seasons</li>
                          <li>Contact your agricultural extension officer</li>
                        </ul>
                      </div>
                    </div>

                    {/* Server Status Indicator */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-xs">
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="font-medium">Server Status: Connected</span>
                      </div>
                      <p className="text-green-600">System is online and ready to display calendar data when available.</p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Calendar Content - Gray Background */}
          {farmingActivities.length > 0 && (
            <div className="mt-8">
              <SmartCalendarRenderer
                activities={farmingActivities}
                weeksData={weeksData}
                metadata={{
                  ...calendarMetadata,
                  activitiesCount: farmingActivities.length,
                  selectedCrop,
                  selectedRegion,
                  selectedDistrict,
                  selectedSeason
                }}
                loading={loading}
                error={calendarMetadata.error}
                onActivityHover={handleMouseEnter}
                onActivityLeave={handleMouseLeave}
                onDownload={handleDownload}
                viewMode="fullpage"
                showDataSourceIndicator={true}
                showMetadata={true}
                className="w-full"
                calendarTitle={`${selectedCrop?.toUpperCase() || 'CROP'} PRODUCTION-${selectedSeason === 'Major' ? 'MAJOR SEASON' : 'PRODUCTION CYCLE'}`}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CropCalendar;
