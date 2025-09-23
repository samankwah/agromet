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
        console.error('❌ Failed to initialize Dynamic Calendar Manager:', error);
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

  // Load dynamic data from backend on component mount
  useEffect(() => {
    const loadDynamicData = async () => {
      setLoading(true);
      setError(null); // Clear previous errors

      try {
        // Fetch available districts and crops with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );

        const [districtsResult, cropsResult, statsResult] = await Promise.race([
          Promise.all([
            agriculturalDataService.getDistricts(),
            agriculturalDataService.getCrops(),
            agriculturalDataService.getStatistics()
          ]),
          timeoutPromise
        ]);

        if (districtsResult.success) {
          setAvailableDistricts(districtsResult.data);

          // Build region-district mapping from uploaded data
          const mapping = {};
          districtsResult.data.forEach(item => {
            if (item.region && item.district) {
              if (!mapping[item.region]) {
                mapping[item.region] = [];
              }
              if (!mapping[item.region].includes(item.district)) {
                mapping[item.region].push(item.district);
              }
            }
          });
          setRegionDistrictMapping(mapping);
        }

        if (cropsResult.success) {
          setAvailableCrops(cropsResult.data);
        }

        if (statsResult.success) {
          setApiStats(statsResult.data);
          // If we have uploaded data, use dynamic data instead of static
          if (statsResult.data.cropCalendars > 0) {
            setIsUsingDynamicData(true);
          }
        }

        // Reset retry count on success
        setRetryCount(0);
      } catch (error) {
        console.error('Error loading dynamic agricultural data:', error);
        setError({
          type: 'data_loading',
          message: 'Failed to load agricultural data',
          details: error.message,
          timestamp: new Date().toISOString(),
          retryable: retryCount < maxRetries
        });
      } finally {
        setLoading(false);
      }
    };

    loadDynamicData();
  }, [retryCount]); // Include retryCount to allow retries

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
        console.error('Error loading crop calendar data:', error);
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
        setError({
          type: 'district_loading',
          message: `Failed to load districts for ${selectedRegion}`,
          details: error.message,
          timestamp: new Date().toISOString(),
          retryable: false
        });
      }
    } else {
      setDistrictData({ districts: [], meta: {} });
    }
  }, [selectedRegion]);

  // Function to parse Excel data from backend into activities
  const parseExcelDataToActivities = (calendar) => {
    console.log('🔧 parseExcelDataToActivities called for calendar:', calendar.id);

    const activities = [];
    const sheets = calendar.fileData.sheets;

    if (!sheets || typeof sheets !== 'object') {
      console.error('❌ Invalid sheets data:', sheets);
      return activities;
    }

    // Process each sheet
    Object.keys(sheets).forEach(sheetName => {
      console.log(`📋 Processing sheet: "${sheetName}"`);
      const sheet = sheets[sheetName];

      if (!sheet || !sheet.data || !Array.isArray(sheet.data)) {
        console.warn('⚠️ Sheet has no data array:', sheetName);
        return;
      }

      console.log(`📊 Sheet "${sheetName}" has ${sheet.data.length} rows`);

      // Find activity column and month columns
      const { activityColumnIndex, monthColumns } = findColumnsInExcelData(sheet.data);

      if (activityColumnIndex === -1) {
        console.warn('❌ Could not find activity column in sheet:', sheetName);
        return;
      }

      console.log(`✅ Found activity column at index ${activityColumnIndex}, ${monthColumns.length} month columns`);

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

        // Find which months this activity spans - pure Excel parsing only
        const { startMonth, endMonth } = findActivityTimespan(row, monthColumns);

        // Skip activities with no timing data - NO FALLBACKS
        if (!startMonth || !endMonth) {
          console.log(`⚠️ No timing data found for "${activityName}" in Excel - skipping (no fallbacks)`);
          return;
        }

        const activity = {
          activity: cleanActivityName(activityName),
          start: startMonth,
          end: endMonth,
          color: generateActivityColor(activityName),
          advisory: `Follow best practices for ${activityName.toLowerCase()}`,
          calendarId: calendar.id,
          commodity: calendar.crop || calendar.commodity,
          regionCode: calendar.region,
          districtCode: calendar.district,
          season: 'Major',
          metadata: {
            source: 'uploaded',
            sheet: sheetName,
            row: rowIndex,
            timingSource: startMonth ? 'excel' : 'fallback'
          }
        };

        activities.push(activity);
        console.log(`✅ Added activity: ${activity.activity} (${finalStartMonth} → ${finalEndMonth}) [${startMonth ? 'excel' : 'fallback'} timing]`);
      });
    });

    console.log(`🎯 Total extracted ${activities.length} activities from calendar ${calendar.id}`);
    return activities;
  };

  // Helper functions for Excel parsing
  const findColumnsInExcelData = (data) => {
    let activityColumnIndex = -1;
    const monthColumns = [];
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // Look primarily in the first 3 rows for Excel structure
    for (let rowIndex = 0; rowIndex < Math.min(3, data.length); rowIndex++) {
      const row = data[rowIndex];
      if (!Array.isArray(row)) continue;

      row.forEach((cell, colIndex) => {
        if (!cell) return;
        const cellLower = String(cell).toLowerCase().trim();

        // Find activity column - more precise matching
        if (cellLower.includes('activity') || cellLower.includes('stage') ||
            cellLower === 'stage of activity' || cellLower === 'activity') {
          activityColumnIndex = colIndex;
          console.log(`🎯 Found activity column "${cell}" at index ${colIndex}`);
        }

        // Find month columns - exact month matching
        const matchingMonth = months.find(month => {
          // Exact match for month abbreviations
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
          console.log(`🗓️ Found month "${cell}" (${fullMonthName}) at column ${colIndex}`);
        }
      });
    }

    // Sort month columns by their position in the year (not Excel column order)
    monthColumns.sort((a, b) => a.monthIndex - b.monthIndex);

    console.log(`🔍 Final structure: Activity column at ${activityColumnIndex}, ${monthColumns.length} month columns found`);

    return { activityColumnIndex, monthColumns };
  };

  const findActivityTimespan = (row, monthColumns) => {
    const filledMonths = [];

    console.log(`🔍 Checking activity timing for row with ${row.length} columns:`, row);

    monthColumns.forEach(monthInfo => {
      if (monthInfo.index < row.length) {
        const cellValue = row[monthInfo.index];
        const hasContent = cellValue !== null && cellValue !== undefined &&
                           cellValue !== '' && String(cellValue).trim() !== '';

        console.log(`   📅 ${monthInfo.month} (col ${monthInfo.index}): "${cellValue}" - ${hasContent ? 'HAS CONTENT' : 'empty'}`);

        if (hasContent) {
          // Look for timing markers: X, x, ✓, •, 1, dates, etc.
          const valueStr = String(cellValue).trim().toLowerCase();
          if (valueStr === 'x' || valueStr === '✓' || valueStr === '•' ||
              valueStr === '1' || valueStr.includes('-') ||
              /^\d+$/.test(valueStr) || valueStr.length === 1) {
            filledMonths.push(monthInfo.month);
            console.log(`   ✅ ${monthInfo.month}: Found timing marker "${cellValue}"`);
          }
        }
      }
    });

    console.log(`🎯 Activity spans ${filledMonths.length} months:`, filledMonths);

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

  const cleanActivityName = (name) => {
    return name.toString().trim()
      .replace(/^\d+\.?\s*/, '') // Remove leading numbers
      .replace(/^\|?\s*/, '')    // Remove leading pipes
      .trim();
  };

  const generateActivityColor = (activityName) => {
    const colorMap = {
      'site': '#3B82F6',      // Site selection - Blue 500
      'land': '#D97706',      // Land preparation - Yellow 600
      'plant': '#059669',     // Planting/sowing - Green 600
      'sowing': '#059669',    // Planting/sowing - Green 600
      'fertil': '#FBBF24',    // Fertilizer application - Yellow 400
      'weed': '#EF4444',      // Weed control - Red 500
      'pest': '#DC2626',      // Pest management - Red 600
      'harvest': '#22C55E',   // Harvesting - Green 500
      'water': '#60A5FA',     // Water management - Blue 400
      'post': '#8B5CF6',      // Post-harvest - Purple 500
      'handling': '#8B5CF6'   // Post-harvest handling - Purple 500
    };

    const name = activityName.toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
      if (name.includes(key)) {
        return color;
      }
    }
    return '#9CA3AF'; // Default fallback - Gray 400
  };


  // Function to transform backend crop calendar data to activity format
  const transformBackendDataToActivities = (cropCalendarData) => {
    console.log('🔧 transformBackendDataToActivities called with data:', cropCalendarData);
    console.log('🔄 Returning raw calendar data for updateFarmingActivities to process');

    // Simply return the raw calendar data - let updateFarmingActivities do the processing
    return cropCalendarData || [];
  };

  // Convert backend pre-parsed activities to calendar format
  const transformBackendActivitiesToCalendarFormat = (backendActivities) => {
    console.log('🔄 Converting backend activities to calendar format:', backendActivities);

    // Excel structure: JAN-SEPT, WK1-WK37 (from API data analysis)
    // Backend activities have week 1-9, need to map to exact Excel week positions
    const excelWeekToMonthMap = {
      // January: WK1-WK5 (weeks 1-5)
      1: 'January',   // WK1 - Site Selection
      2: 'January',   // WK2 - Land Preparation
      3: 'January',   // WK3
      4: 'January',   // WK4
      5: 'January',   // WK5
      // February: WK6-WK9 (weeks 6-9)
      6: 'February',  // WK6 - Planting/Sowing
      7: 'February',  // WK7 - 1st Fertilizer
      8: 'February',  // WK8
      9: 'February',  // WK9
      // March: WK10-WK13 (weeks 10-13)
      10: 'March',    // WK10 - Weed Control
      11: 'March',    // WK11 - 2nd Fertilizer
      12: 'March',    // WK12
      13: 'March',    // WK13
      // April: WK14-WK17 (weeks 14-17)
      14: 'April',    // WK14
      15: 'April',    // WK15
      16: 'April',    // WK16
      17: 'April',    // WK17
      // May: WK18-WK22 (weeks 18-22)
      18: 'May',      // WK18 - Harvesting
      19: 'May',      // WK19 - Post-harvest
      20: 'May',      // WK20
      21: 'May',      // WK21
      22: 'May',      // WK22
      // June: WK23-WK26 (weeks 23-26)
      23: 'June',     // WK23
      24: 'June',     // WK24
      25: 'June',     // WK25
      26: 'June',     // WK26
      // July: WK27-WK31 (weeks 27-31)
      27: 'July',     // WK27
      28: 'July',     // WK28
      29: 'July',     // WK29
      30: 'July',     // WK30
      31: 'July',     // WK31
      // August: WK32-WK35 (weeks 32-35)
      32: 'August',   // WK32
      33: 'August',   // WK33
      34: 'August',   // WK34
      35: 'August',   // WK35
      // September: WK36-WK37 (weeks 36-37)
      36: 'September', // WK36
      37: 'September'  // WK37
    };

    const convertedActivities = backendActivities.map((activity, index) => {
      // Map backend activity week (1-9) to Excel week position
      const excelWeekPosition = activity.week; // Direct mapping since backend uses 1-9
      const monthName = excelWeekToMonthMap[excelWeekPosition] || 'January';
      const activityColor = generateActivityColor(activity.name);

      console.log(`📋 EXACT EXCEL: "${activity.name}" (Backend Week ${activity.week}) -> Excel WK${excelWeekPosition} (${monthName}) with color ${activityColor}`);

      // Generate timeline for 36 weeks (JAN-SEPT, 4 weeks per month)
      const timeline = Array.from({ length: 36 }, (_, weekIndex) => {
        // Check if this calendar week matches the activity's Excel week
        const calendarWeekNumber = weekIndex + 1; // 1-36
        const isActiveWeek = calendarWeekNumber === excelWeekPosition;

        return {
          active: isActiveWeek,
          background: isActiveWeek ? activityColor : 'transparent',
          content: isActiveWeek ? '●' : '',
          week: calendarWeekNumber
        };
      });

      return {
        id: activity.id || `activity_${index}`,
        activity: activity.name, // SmartCalendarRenderer expects 'activity' property
        name: activity.name,     // Keep name for compatibility
        type: activity.name.toLowerCase().includes('harvest') ? 'harvest' :
              activity.name.toLowerCase().includes('plant') ? 'planting' :
              activity.name.toLowerCase().includes('weed') ? 'weeding' :
              activity.name.toLowerCase().includes('fertil') ? 'fertilizer' : 'general',
        month: monthName,
        week: excelWeekPosition,
        duration: 1,
        start: monthName,        // Start month for isActivityActive function
        end: monthName,          // End month for isActivityActive function
        color: activityColor,
        backgroundColor: activityColor, // Add backgroundColor for SmartCalendarRenderer
        description: activity.name,
        priority: activity.week,
        source: 'exact-excel-content', // Mark as exact Excel content
        timeline: timeline // Add timeline data for calendar cells
      };
    });

    console.log(`✅ Converted ${convertedActivities.length} backend activities to calendar format`);
    return convertedActivities;
  };


  useEffect(() => {
    const updateFarmingActivities = async () => {
      // Excel-only calendar system - only show uploaded Excel data
      if (isUsingDynamicData) {
        console.log('🔧 Processing dynamic calendar data - EXCEL-ONLY MODE (No Fallbacks):', dynamicData);

        // Only show calendar if specific district is selected
        if (selectedDistrict === 'All Districts' || !selectedDistrict) {
          console.log('🚫 No specific district selected - hiding calendar');
          setFarmingActivities([]);
          return;
        }

        // Process the backend-filtered dynamic data directly
        if (dynamicData && dynamicData.length > 0) {
          console.log(`🎯 Processing ${dynamicData.length} backend-filtered calendars for district: ${selectedDistrict}`);
          const allActivities = [];

          dynamicData.forEach((calendar, index) => {
            // Add null checks for calendar object
            if (!calendar || typeof calendar !== 'object') {
              console.warn(`⚠️ Invalid calendar object at index ${index}:`, calendar);
              return;
            }

            console.log(`📊 Processing calendar ${index + 1}: ${calendar.id || 'Unknown ID'} for district: ${calendar.district}`);

            // USE BACKEND PRE-PARSED ACTIVITIES (Priority 1)
            if (calendar.activities && Array.isArray(calendar.activities) && calendar.activities.length > 0) {
              console.log(`🎯 Using backend pre-parsed activities (${calendar.activities.length} activities)`);
              const backendActivities = transformBackendActivitiesToCalendarFormat(calendar.activities);
              allActivities.push(...backendActivities);
              console.log(`✅ Converted ${backendActivities.length} backend activities from calendar ${calendar.id}`);

              // Debug: Log first converted activity to verify structure
              if (backendActivities.length > 0) {
                console.log(`🔍 DEBUG: First converted activity:`, {
                  activity: backendActivities[0].activity,
                  month: backendActivities[0].month,
                  start: backendActivities[0].start,
                  end: backendActivities[0].end,
                  color: backendActivities[0].color,
                  hasTimeline: !!backendActivities[0].timeline,
                  timelineLength: backendActivities[0].timeline?.length
                });
              }
            } else {
              console.warn(`⚠️ Calendar ${calendar.id || 'Unknown'} has no pre-parsed activities`);
            }
          });

          console.log(`🎯 Total activities processed: ${allActivities.length}`);
          console.log(`🎨 DEBUG: All activity colors:`, allActivities.map(a => ({ name: a.activity, color: a.color, month: a.month })));
          setFarmingActivities(allActivities);
        } else {
          console.log('📭 No calendar data available for selected filters');
          setFarmingActivities([]); // Show "no data" message
        }
        return;
      }
      
      setLoading(true);

      let baseActivities = [];
      let adjustedActivities = [];

      // Get dynamic calendar data based on the selected crop and location
      try {
        console.log(`🔍 Fetching dynamic calendar data for crop: ${selectedCrop}, region: ${selectedRegion}, district: ${selectedDistrict}`);

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
          console.log(`✅ Using ${calendarResult.metadata.source || 'unknown'} calendar data (priority: ${calendarResult.metadata.dataSourcePriority || 0})`);
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
            console.log('🚫 Strict mode: No uploaded/computed data found for filters');
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
            console.log('⚠️ No calendar data found, using empty activities');
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
        console.error('❌ Error fetching dynamic calendar data:', error);
        baseActivities = [];
        setCalendarMetadata({
          dataSourceUsed: 'no-data',
          priority: 0,
          hasUploadedData: false,
          strictMode: isUsingDynamicData,
          queryTime: new Date().toISOString(),
          error: error.message
        });
        setError({
          type: 'calendar_manager',
          message: 'Failed to fetch calendar activities',
          details: error.message,
          timestamp: new Date().toISOString(),
          retryable: true
        });
      }

      // Adjust activities for the selected season
      adjustedActivities = adjustActivitiesForSeason(
        baseActivities,
        selectedSeason
      );

      // Excel-only calendar system - no climate offset calculations

      if (initialLoad) {
        setFarmingActivities(adjustedActivities); // Default to adjusted activities on initial load
        setInitialLoad(false);
      } else {
        setFarmingActivities(adjustedActivities); // Always use Excel data without climate adjustments
      }

      console.log(
        "Updated activities for crop, region, district, and season:",
        adjustedActivities
      );
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
        alert("Calendar link copied to clipboard!");
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
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  No farming activities found for your current selection.
                </p>
                <p className="text-blue-600 cursor-pointer text-sm md:text-base">
                  📁 Try adjusting your filters or upload calendar data through the dashboard
                </p>
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
