import { useState, useEffect } from "react";
import { FaDownload, FaShareAlt, FaSpinner, FaExclamationTriangle, FaSync, FaDatabase } from "react-icons/fa";
import agriculturalDataService from '../services/agriculturalDataService';
import dynamicCalendarManager from '../services/dynamicCalendarManager';
import PageTitle from '../components/PageTitle';
import { InlineOfflineWarning } from '../components/common/OfflineNotification';
import SmartCalendarRenderer from '../components/common/SmartCalendarRenderer';
import { getSafeDistrictsByRegion } from '../utils/regionDistrictHelpers';
import { SafeDistrictOptions } from '../components/common/SafeSelectOptions';
import { getAllRegionNames } from '../data/ghanaCodes';
import toast from 'react-hot-toast';

// Get regions data with fallback
const regionsOfGhana = getAllRegionNames() || [
  "Greater Accra", "Ashanti", "Northern", "Eastern", "Western", "Volta",
  "Upper East", "Upper West", "Central", "Bono", "Western North",
  "Ahafo", "Savannah", "Oti", "Bono East", "North East"
];

// Poultry type options for selection
const poultryTypeOptions = [
  { value: "layers", label: "Layers" },
  { value: "broilers", label: "Broilers" }
];

// Utility function to get user-friendly error messages
const getUserFriendlyErrorMessage = (error, context) => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || error?.response?.status;

  const commonSuggestions = [
    "Please check your internet connection",
    "Try refreshing the page",
    "Contact support if the problem persists"
  ];

  switch (context) {
    case 'poultry_fetch':
      if (errorMessage.includes('network') || errorCode === 'NETWORK_ERROR') {
        return {
          message: "Unable to connect to the server",
          details: "Please check your internet connection and try again",
          suggestions: ["Check your internet connection", "Try again in a few moments"]
        };
      }
      if (errorCode === 404) {
        return {
          message: "No poultry calendar data found",
          details: "No poultry calendar data is available for the selected filters",
          suggestions: ["Try different poultry type or location selections", "Upload poultry calendar data in the dashboard"]
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
        message: "Failed to load poultry calendar data",
        details: errorMessage || "An unexpected error occurred",
        suggestions: commonSuggestions
      };

    case 'district_fetch':
      return {
        message: "Failed to load districts",
        details: "Unable to load districts for the selected region",
        suggestions: ["Try selecting a different region", "Refresh the page"]
      };

    default:
      return {
        message: "Something went wrong",
        details: errorMessage || "An unexpected error occurred",
        suggestions: commonSuggestions
      };
  }
};

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

// Base poultry production activities for layers and broilers
const basePoultryActivities = {
  layers: [
    {
      activity: "Site selection/Construction of appropriate housing",
      start: 1,
      end: 1,
      color: "bg-[#00B0F0]",
      advisory:
        "Choose a well-drained, accessible location \naway from potential contaminants. \nEnsure adequate shelter and ventilation.\nAvoid areas prone to flooding and \nthose near other livestock to minimize disease risks.",
    },
    {
      activity: "Preparation of day-old chicks",
      start: 1,
      end: 1,
      color: "bg-[#375623]",
      advisory:
        "Prepare the brooding area to be warm and draft-free.\nProvide clean bedding, accessible feeders and drinkers, \nand monitor the chicks closely during the first 24 hours for any signs of distress or illness.",
    },
    {
      activity: "Brooder management",
      start: 1,
      end: 3,
      color: "bg-[#000000]",
      advisory:
        "Ensure the brooding temperature is maintained at optimal levels \nbetween 90-95°F (32-35°C) for the first week, reducing gradually.\nCheck temperature, ventilation, and humidity regularly, and adjust based on chick behavior (e.g., huddling indicates cold).",
    },
    {
      activity: "Feeding and Water for Starters",
      start: 1,
      end: 7,
      color: "bg-[#FFFF00]",
      advisory:
        "Provide a balanced starter feed with the necessary protein, vitamins, and minerals to support growth.\nEnsure fresh, clean water is always available.\nMonitor feed intake daily to assess chick health and development.",
    },
    {
      activity: "Vaccination (Gumboro, Newcastle)",
      start: 1,
      end: 4,
      color: "bg-[#FF0000]",
      advisory:
        "Administer vaccinations at the correct times and doses to protect against Gumboro and Newcastle diseases.\nFollow vaccine storage and handling guidelines to ensure efficacy, and minimize stress during the vaccination process.",
    },
    {
      activity: "Feeding and Water for Growers",
      start: 8,
      end: 15,
      color: "bg-[#FFFF00]",
      advisory:
        "Transition to a grower feed with lower protein content than starter feed but balanced for continued growth.\nEnsure the water supply is clean, uninterrupted, and regularly check the condition and cleanliness of drinkers.",
    },
    {
      activity: "Deworming",
      start: 7,
      end: 7,
      color: "bg-[#0070C0]",
      advisory:
        "Administer a suitable deworming treatment to control intestinal parasites, which can impact growth and health.\nObserve withdrawal times as per product instructions, and monitor birds for signs of parasitic infections.",
    },
    {
      activity: "Fowl pox vaccination",
      start: 8,
      end: 12,
      color: "bg-[#FF0000]",
      advisory:
        "Vaccinate against fowl pox using the \nrecommended method (usually wing web).\nEnsure proper handling and disposal of the vaccine, \nand monitor birds for any adverse reactions post-vaccination.",
    },
    {
      activity: "Feed (Layer mash)",
      start: 16,
      end: 20,
      color: "bg-[#FFFF00]",
      advisory:
        "Switch to a layer feed with sufficient calcium, \nphosphorus, and other nutrients \nessential for egg production.\nMaintain fresh water access, and inspect \nbirds for signs of malnutrition or dietary imbalance.",
    },
    {
      activity: "Egg Collection",
      start: 16,
      end: 20,
      color: "bg-gray-300",
      advisory:
        "Collect eggs at least twice daily to prevent \nbreakage and contamination.\nHandle eggs carefully to \navoid cracks, and store them in a clean, cool \nplace until they are ready for sale or consumption.",
    },
    {
      activity: "Coccidiosis prevention",
      start: 1,
      end: 20,
      color: "bg-[#C6E0B4]",
      advisory:
        "Implement regular cleaning of drinkers \nand feeders, maintain dry bedding, and use \nmedicated feed if necessary.\nWatch for symptoms such as diarrhea, lethargy, \nand weight loss, and respond \npromptly to any outbreaks.",
    },
    {
      activity: "Biosecurity measures",
      start: 1,
      end: 20,
      color: "bg-[#1F497D]",
      advisory:
        "Restrict visitor access to the poultry \narea, sanitize equipment regularly, and \nenforce clothing changes and handwashing for all personnel.\nMonitor birds daily for signs of \ndisease or unusual behavior, and \nisolate sick birds immediately.",
    },
  ],
  broilers: [
    {
      activity: "Construction of appropriate housing",
      start: 1,
      end: 1,
      color: "bg-[#00B0F0]",
      advisory:
        "Select a well-drained location away from contaminants.\nConstruct housing to provide shelter and ventilation.",
    },
    {
      activity: "Arrival of day-old chicks",
      start: 1,
      end: 1,
      color: "bg-[#375623]",
      advisory:
        "Prepare the brooding area and ensure it is warm and clean\nbefore chicks arrive.",
    },
    {
      activity: "Brooder management",
      start: 1,
      end: 4,
      color: "bg-[#000000]",
      advisory:
        "Maintain a warm, controlled environment with proper ventilation\nand lighting.\nCheck temperature regularly to avoid chick huddling or overheating.",
    },
    {
      activity: "Feed (Starter Diet) ",
      start: 1,
      end: 4,
      color: "bg-[#FFFF00]",
      advisory:
        "Provide high-quality starter feed and ensure access to clean water.\nMonitor feed intake to assess early growth and health.",
    },
    {
      activity: "1st Gumboro vaccine ",
      start: 1,
      end: 1,
      color: "bg-[#FF0000]",
      advisory:
        "Administer the 1st Gumboro vaccine if day-old chicks have low maternal antibodies.\nPipe-borne water must be dechlorinated before use.",
    },
    {
      activity: "1st Newcastle HB1 (Hitchner)",
      start: 2,
      end: 2,
      color: "bg-[#FF0000]",
      advisory:
        "Administer Newcastle HB1 vaccine through water.\nEnsure water is dechlorinated before use.",
    },
    {
      activity: "2nd Gumboro vaccine",
      start: 3,
      end: 3,
      color: "bg-[#FF0000]",
      advisory:
        "Administer the 2nd Gumboro vaccine through water.\nEnsure water is dechlorinated before use.",
    },
    {
      activity: "Feed (Grower Diet) ",
      start: 5,
      end: 8,
      color: "bg-[#FFFF00]",
      advisory:
        "Transition to grower feed to support continued growth.\nEnsure constant access to clean water and monitor intake.",
    },
    {
      activity: "2nd Newcastle (Lasota) ",
      start: 6,
      end: 6,
      color: "bg-[#FF0000]",
      advisory:
        "Administer the 2nd Newcastle (Lasota) vaccine through clean, dechlorinated water.",
    },
    {
      activity: "Coccidiosis prevention",
      start: 1,
      end: 5,
      color: "bg-[#C6E0B4]",
      advisory:
        "Administer coccidiostat in water continuously for 3 days a week, from week 1 to week 5.\nProvide clean water for 2 days after medication before any vaccination.",
    },
    {
      activity: "Biosecurity measures",
      start: 1,
      end: 8,
      color: "bg-[#1F497D]",
      advisory:
        "Observe strict biosecurity measures.\nLimit access to housing, sanitize equipment regularly,\nand monitor birds daily.",
    },
    {
      activity: "Harvesting/live bird market",
      start: 8,
      end: 8,
      color: "bg-[#00B050]",
      advisory:
        "Prepare for humane and hygienic harvesting and transport to live bird market.",
    },
    {
      activity: "Processing",
      start: 8,
      end: 8,
      color: "bg-[#993366]",
      advisory:
        "Process birds in a hygienic facility to ensure food safety and quality.",
    },
  ],
};

// Year and season options (matching crop calendar)
const seasonOptions = [
  { label: "Major Season", value: "major" },
  { label: "Minor Season", value: "minor" },
];

/**
 * Build weeksData with real month names from calendar sheet headers.
 * Headers pattern: ['', 'TITLE', 'JANUARY', '', '', '', 'FEBRUARY', ...]
 * Non-empty entries from index 2+ are month names; gaps are weeks in that month.
 */
const ALL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MAJOR_SEASON_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
const MINOR_SEASON_MONTHS = ['August', 'September', 'October', 'November', 'December'];

/**
 * Determine which season a calendar belongs to based on its Excel month headers.
 * If the majority of months fall within Jan-Jul → "major", Aug-Dec → "minor".
 */
const inferCalendarSeason = (calendarData) => {
  const headers = calendarData?.fileData?.sheets?.[0]?.headers || [];
  const months = [];
  for (let i = 2; i < headers.length; i++) {
    const h = (headers[i] || '').trim();
    if (h) months.push(h.charAt(0).toUpperCase() + h.slice(1).toLowerCase());
  }
  if (months.length === 0) return null;
  const majorCount = months.filter(m => MAJOR_SEASON_MONTHS.includes(m)).length;
  const minorCount = months.filter(m => MINOR_SEASON_MONTHS.includes(m)).length;
  return majorCount >= minorCount ? 'major' : 'minor';
};

const buildWeeksDataFromCalendar = (calendarData, season = '') => {
  const headers = calendarData?.fileData?.sheets?.[0]?.headers || [];
  const totalWeeks = calendarData?.totalWeeks || 15;

  // Extract month names starting from column index 2 (skip S/N and Activity columns)
  const monthEntries = [];
  for (let i = 2; i < headers.length; i++) {
    const h = (headers[i] || '').trim();
    if (h) {
      monthEntries.push({ name: h.charAt(0) + h.slice(1).toLowerCase(), startCol: i });
    }
  }

  if (monthEntries.length === 0) {
    // Fallback: no month info available
    return Array.from({ length: totalWeeks }, (_, i) => ({
      week: i + 1,
      label: `Week ${i + 1}`,
      month: null,
    }));
  }

  // Assign each timeline column to its parent month (from Excel data)
  const weeks = [];
  for (let weekIdx = 0; weekIdx < totalWeeks; weekIdx++) {
    const col = weekIdx + 2; // offset by 2 (S/N + Activity columns)
    let month = monthEntries[0]?.name || '';
    for (const entry of monthEntries) {
      if (entry.startCol <= col) month = entry.name;
      else break;
    }
    weeks.push({
      week: weekIdx + 1,
      label: `Week ${weekIdx + 1}`,
      month,
    });
  }

  // Extend with remaining season months that aren't in the Excel data
  const seasonMonths = season === 'minor' ? MINOR_SEASON_MONTHS : MAJOR_SEASON_MONTHS;
  const existingMonths = new Set(monthEntries.map(e => e.name));
  const lastMonth = monthEntries[monthEntries.length - 1]?.name || '';
  const lastMonthIdx = ALL_MONTHS.indexOf(lastMonth);

  for (const month of seasonMonths) {
    if (existingMonths.has(month)) continue;
    // Only add months that come after the last data month
    const monthIdx = ALL_MONTHS.indexOf(month);
    if (monthIdx <= lastMonthIdx) continue;
    // Add 4 empty weeks per trailing month
    for (let w = 0; w < 4; w++) {
      weeks.push({
        week: weeks.length + 1,
        label: `Week ${weeks.length + 1}`,
        month,
      });
    }
  }

  return weeks;
};

// Poultry calendar data is loaded from uploaded backend calendars
const generateRegionPoultryActivities = async () => {
  // Legacy placeholder kept for compatibility with older view logic
  return {};
};

// Declare poultry production calendars for each region (will be populated asynchronously)
let poultryCalendars = {};

// Normalize poultry activity names for consistency
const normalizePoultryActivityName = (name) => {
  if (!name || typeof name !== 'string') return 'Unknown Activity';

  return name
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-\/]/g, '')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Get poultry-specific colors based on activity name
const getPoultryActivityColor = (activityName) => {
  const activity = activityName.toLowerCase();

  // POULTRY-SPECIFIC COLOR MAPPINGS
  if (activity.includes('brooding') || activity.includes('chick brooding')) {
    return '#FF6B35'; // Orange-red for brooding
  }
  if (activity.includes('vaccination') || activity.includes('vaccin')) {
    return '#4ECDC4'; // Teal for vaccination
  }
  if (activity.includes('feeding') || activity.includes('feed')) {
    return '#45B7D1'; // Blue for feeding
  }
  if (activity.includes('housing') || activity.includes('construction')) {
    return '#8B4513'; // Brown for housing/construction
  }
  if (activity.includes('egg') || activity.includes('laying')) {
    return '#F7DC6F'; // Yellow for egg production
  }
  if (activity.includes('medication') || activity.includes('treatment')) {
    return '#E74C3C'; // Red for medication
  }
  if (activity.includes('management') || activity.includes('routine')) {
    return '#9B59B6'; // Purple for management
  }
  if (activity.includes('marketing') || activity.includes('sale')) {
    return '#27AE60'; // Green for marketing
  }

  // Default color based on hash of activity name for consistency
  let hash = 0;
  for (let i = 0; i < activityName.length; i++) {
    const char = activityName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#F97316'];
  return colors[Math.abs(hash) % colors.length];
};

// Normalize poultry activity colors
const normalizePoultryActivityColor = (color, activityName) => {
  if (!color || color === 'undefined' || color === 'null') {
    return getPoultryActivityColor(activityName);
  }

  if (typeof color === 'string') {
    const cleanColor = color.trim().toUpperCase();

    // Only reject white — keep all other colors including black
    if (cleanColor === '#FFFFFF') {
      return getPoultryActivityColor(activityName);
    }

    if (cleanColor.startsWith('#') && cleanColor.length === 7) {
      return cleanColor;
    }
  }

  return getPoultryActivityColor(activityName);
};

// Transform backend poultry data to activity format
const transformBackendDataToPoultryActivities = (poultryData) => {
  return poultryData || [];
};

// Convert backend pre-parsed activities to poultry calendar format
const transformBackendActivitiesToPoultryCalendarFormat = (backendActivities) => {
  const convertedActivities = backendActivities.map((activity, index) => {
    const rawActivityName = activity.activityName || activity.activity || activity.name || `Activity ${index + 1}`;

    let activityName = normalizePoultryActivityName(rawActivityName);
    const activityId = activity.activityId || activity.id || `activity_${index}`;

    let primaryBackgroundColor = activity.backgroundColor ||
                                activity.color ||
                                activity.periods?.[0]?.backgroundColor;

    primaryBackgroundColor = normalizePoultryActivityColor(primaryBackgroundColor, activityName);

    const timeline = [];
    const activeWeeks = new Set();
    let startWeek = null;
    let endWeek = null;

    if (activity.periods && Array.isArray(activity.periods) && activity.periods.length > 0) {
      activity.periods.forEach((period, periodIndex) => {
        const weekIndex = period.timelineIndex || periodIndex;
        const week = period.week || `Week ${weekIndex + 1}`;
        let backgroundColor = period.backgroundColor || period.color || primaryBackgroundColor;

        backgroundColor = normalizePoultryActivityColor(backgroundColor, activityName);
        activeWeeks.add(weekIndex);

        if (startWeek === null) startWeek = weekIndex + 1;
        endWeek = weekIndex + 1;

        while (timeline.length <= weekIndex) {
          timeline.push({
            active: false,
            background: 'transparent',
            content: '',
            week: timeline.length + 1,
            backgroundColor: null
          });
        }

        timeline[weekIndex] = {
          active: true,
          background: backgroundColor,
          backgroundColor: backgroundColor,
          content: period.cellValue || period.content || '●',
          week: weekIndex + 1,
          weekLabel: week
        };
      });
    } else {
      // Fallback for activities without periods
      for (let i = 0; i < 8; i++) {
        timeline.push({
          active: i < 4,
          background: i < 4 ? primaryBackgroundColor : 'transparent',
          backgroundColor: i < 4 ? primaryBackgroundColor : null,
          content: i < 4 ? '●' : '',
          week: i + 1,
          weekLabel: `Week ${i + 1}`
        });
        if (i < 4) activeWeeks.add(i);
      }
      startWeek = 1;
      endWeek = 4;
    }

    return {
      id: activityId,
      activity: activityName,
      activityName: activityName,
      timeline: timeline,
      start: startWeek,
      end: endWeek,
      activeWeeks: Array.from(activeWeeks),
      backgroundColor: primaryBackgroundColor,
      color: primaryBackgroundColor,
      totalPeriods: activeWeeks.size,
      advisory: activity.advisory || `${activityName} activity for poultry production`
    };
  });

  return convertedActivities;
};

const PoultryCalendar = () => {
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedPoultry, setSelectedPoultry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [poultryActivities, setPoultryActivities] = useState([]); // Default state for activities
  const [loading, setLoading] = useState(false); // Loading state for filtering
  const [initialLoad, setInitialLoad] = useState(true); // Track if initial load
  const [districtData, setDistrictData] = useState({ districts: [], meta: {} }); // Safe district data
  const [hoveredActivity, setHoveredActivity] = useState(null); // To track the hovered activity
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // Track position of the tooltip
  const [weeksData, setWeeksData] = useState([]); // Dynamic weeks data based on poultry cycle

  // New state for dynamic data from backend
  const [dynamicData, setDynamicData] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availablePoultryTypes, setAvailablePoultryTypes] = useState([]);
  const [isUsingDynamicData, setIsUsingDynamicData] = useState(false);
  const [apiStats, setApiStats] = useState(null);
  const [regionDistrictMapping, setRegionDistrictMapping] = useState({});
  const [calendarMetadata, setCalendarMetadata] = useState({});
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Load dynamic data from backend on component mount
  useEffect(() => {
    const loadDynamicData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Initialize calendar manager
        console.log('🐔 Initializing poultry calendar manager...');
        const initResult = await dynamicCalendarManager.initialize();

        if (!initResult || !initResult.success) {
          const errorMsg = initResult?.error || 'Unknown initialization error';
          throw new Error(`Calendar manager initialization failed: ${errorMsg}`);
        }

        // Fetch comprehensive data (skip calendar fetch if no poultry type selected)
        const [districtsResult, statsResult, enhancedCalendarsResult] = await Promise.all([
          agriculturalDataService.getDistricts(),
          agriculturalDataService.getStatistics(),
          selectedPoultry
            ? agriculturalDataService.getPoultryCalendar({ poultryType: selectedPoultry })
            : Promise.resolve({ success: true, data: [] })
        ]);

        // Process districts data
        if (districtsResult.success) {
          setAvailableDistricts(districtsResult.data || []);

          // Build region-district mapping
          const mapping = {};
          (districtsResult.data || []).forEach(district => {
            if (district.region) {
              if (!mapping[district.region]) {
                mapping[district.region] = [];
              }
              mapping[district.region].push(district.name || district);
            }
          });
          setRegionDistrictMapping(mapping);
        }

        // Process statistics
        if (statsResult.success) {
          setApiStats(statsResult.data);
        }

        // Process enhanced calendars
        if (enhancedCalendarsResult.success && enhancedCalendarsResult.data.length > 0) {
          console.log(`✅ Found ${enhancedCalendarsResult.data.length} enhanced poultry calendars`);

          const transformedData = enhancedCalendarsResult.data.map(calendar => {
            if (calendar.activities && Array.isArray(calendar.activities)) {
              return transformBackendActivitiesToPoultryCalendarFormat(calendar.activities);
            }
            return [];
          }).flat();

          setDynamicData(enhancedCalendarsResult.data);

          if (transformedData.length > 0) {
            setPoultryActivities(transformedData);
            setIsUsingDynamicData(true);

            // Build weeksData from first calendar's sheet headers (real month names)
            const firstCalendar = enhancedCalendarsResult.data[0];
            if (firstCalendar) {
              setWeeksData(buildWeeksDataFromCalendar(firstCalendar, selectedSeason));
            }

            // Set metadata
            setCalendarMetadata({
              source: 'enhanced',
              totalCalendars: enhancedCalendarsResult.data.length,
              totalActivities: transformedData.length,
              lastUpdated: new Date().toISOString(),
              poultryTypes: [...new Set(enhancedCalendarsResult.data.map(c => c.commodity).filter(Boolean))]
            });
          }
        } else {
          // Fallback to regular poultry calendar data
          const poultryResult = await agriculturalDataService.getPoultryCalendar({
            poultryType: selectedPoultry,
            district: selectedDistrict !== 'All Districts' ? selectedDistrict : null
          });

          if (poultryResult.success && poultryResult.data.length > 0) {
            const transformedData = transformBackendActivitiesToPoultryCalendarFormat(poultryResult.data);
            setPoultryActivities(transformedData);
            setIsUsingDynamicData(true);

            setCalendarMetadata({
              source: 'standard',
              totalActivities: transformedData.length,
              lastUpdated: new Date().toISOString()
            });
          } else {
            // Initialize static fallback calendars
            console.log('🐔 Initializing static poultry calendars...');
            poultryCalendars = await generateRegionPoultryActivities();
            setPoultryActivities([]);
            setIsUsingDynamicData(false);
          }
        }

        // Only set default weeksData if not already set from calendar data above
        if (weeksData.length === 0) {
          const fallbackWeeks = Array.from({ length: 20 }, (_, i) => ({
            week: i + 1,
            label: `Week ${i + 1}`,
            month: null,
          }));
          setWeeksData(fallbackWeeks);
        }

      } catch (error) {
        console.error('Error loading poultry calendar data:', error);
        const userFriendlyError = getUserFriendlyErrorMessage(error, 'poultry_fetch');
        setError({
          type: 'data_loading',
          message: userFriendlyError.message,
          details: userFriendlyError.details,
          suggestions: userFriendlyError.suggestions,
          timestamp: new Date().toISOString(),
          retryable: true
        });
        setPoultryActivities([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    loadDynamicData();
  }, [retryCount]); // Re-run when retry is triggered

  // Handle region change and load district data
  useEffect(() => {
    if (selectedRegion && selectedRegion !== "All Regions") {
      const loadDistrictsForRegion = async () => {
        try {
          const safeDistricts = await getSafeDistrictsByRegion(selectedRegion);
          setDistrictData(safeDistricts);
        } catch (error) {
          console.error('Error loading districts for region:', error);
          const userFriendlyError = getUserFriendlyErrorMessage(error, 'district_fetch');
          setError({
            type: 'district_fetch',
            message: userFriendlyError.message,
            details: userFriendlyError.details,
            suggestions: userFriendlyError.suggestions,
            timestamp: new Date().toISOString(),
            retryable: false
          });
        }
      };

      loadDistrictsForRegion();
    } else {
      setDistrictData({ districts: [], meta: {} });
    }
  }, [selectedRegion]);

  // Load poultry calendar data when filters change
  useEffect(() => {
    if (!selectedPoultry || selectedRegion === 'All Regions' || selectedDistrict === 'All Districts') return;

    let cancelled = false;
    const loadPoultryData = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters = {
          calendarType: 'cycle',
          commodity: selectedPoultry,
          regionCode: selectedRegion !== 'All Regions' ? selectedRegion : undefined,
          districtCode: selectedDistrict !== 'All Districts' ? selectedDistrict : undefined
        };

        const result = await agriculturalDataService.getPoultryCalendar({
          poultryType: selectedPoultry,
          region: selectedRegion,
          district: selectedDistrict
        });

        if (cancelled) return;

        // Filter calendars by season — only show calendars whose months match the selected season
        const seasonFiltered = (result.success && result.data.length > 0 && selectedSeason)
          ? result.data.filter(cal => inferCalendarSeason(cal) === selectedSeason)
          : result.data || [];

        if (seasonFiltered.length > 0) {
          const transformedData = seasonFiltered.map(calendar => {
            if (calendar.activities && Array.isArray(calendar.activities)) {
              return transformBackendActivitiesToPoultryCalendarFormat(calendar.activities);
            }
            return [];
          }).flat();

          setPoultryActivities(transformedData);

          // Rebuild weeksData from the filtered calendar's real month headers
          const firstCalendar = seasonFiltered[0];
          if (firstCalendar) {
            setWeeksData(buildWeeksDataFromCalendar(firstCalendar, selectedSeason));
          }

          setCalendarMetadata({
            source: 'filtered',
            filters,
            totalCalendars: seasonFiltered.length,
            totalActivities: transformedData.length,
            lastUpdated: new Date().toISOString()
          });
        } else {
          setPoultryActivities([]);
          setCalendarMetadata({
            source: 'none',
            message: 'No data available for selected filters'
          });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading filtered poultry data:', error);
        const userFriendlyError = getUserFriendlyErrorMessage(error, 'poultry_fetch');
        setError({
          type: 'poultry_fetch',
          message: userFriendlyError.message,
          details: userFriendlyError.details,
          suggestions: userFriendlyError.suggestions,
          timestamp: new Date().toISOString(),
          retryable: true
        });
        setPoultryActivities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPoultryData();
    return () => { cancelled = true; };
  }, [selectedSeason, selectedPoultry, selectedRegion, selectedDistrict]);

  // Event handlers with validation and error handling
  const handleRegionChange = (event) => {
    const newRegion = event.target.value;
    setSelectedRegion(newRegion);

    // Reset district when region changes
    if (newRegion === "All Regions") {
      setSelectedDistrict("All Districts");
    } else {
      setSelectedDistrict("All Districts");
    }

    setError(null); // Clear any existing errors
  };

  const handleSeasonChange = (event) => {
    setSelectedSeason(event.target.value);
    setError(null);
  };

  const handlePoultryChange = (event) => {
    const newPoultryType = event.target.value;
    setSelectedPoultry(newPoultryType);
    setError(null); // Clear any existing errors
  };

  const handleDistrictChange = (event) => {
    setSelectedDistrict(event.target.value);
    setError(null); // Clear any existing errors
  };

  const handleMouseEnter = (activity, event) => {
    if (activity && activity.advisory) {
      setHoveredActivity(activity);
      setTooltipPosition({
        x: event.clientX + 10,
        y: event.clientY + 10
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredActivity(null);
  };

  // Enhanced download function
  const handleDownload = async () => {
    try {
      setError(null);

      if (!poultryActivities || poultryActivities.length === 0) {
        throw new Error('No poultry calendar data available to download');
      }

      // Use the SmartCalendarRenderer's download functionality
      toast.success('Preparing poultry calendar download...');

      const calendarTitle = `${selectedPoultry.toUpperCase()} PRODUCTION-CYCLE CALENDAR`;
      const filters = {
        poultryType: selectedPoultry,
        region: selectedRegion,
        district: selectedDistrict
      };

      // Create download data structure
      const downloadData = {
        title: calendarTitle,
        subtitle: `${selectedRegion} Region, ${selectedDistrict}`,
        activities: poultryActivities,
        weeksData: weeksData,
        metadata: {
          ...calendarMetadata,
          filters: filters,
          generatedAt: new Date().toISOString(),
          poultryType: selectedPoultry
        }
      };

      // Simulate download preparation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create CSV content
      const headers = ["Activity", ...weeksData.map(w => w.label || `Week ${w.week}`)];
      const csvRows = [headers.join(",")];

      poultryActivities.forEach((activity) => {
        const row = [
          `"${activity.activity}"`,
          ...weeksData.map(weekData => {
            const isActive = activity.activeWeeks?.includes(weekData.week - 1) ||
                           (weekData.week >= activity.start && weekData.week <= activity.end);
            return isActive ? "✔️" : "";
          })
        ];
        csvRows.push(row.join(","));
      });

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `poultry_${selectedPoultry}_calendar_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Poultry calendar downloaded successfully!');

    } catch (error) {
      console.error("Error downloading calendar:", error);
      setError({
        type: 'download',
        message: 'Failed to download poultry calendar',
        details: error.message,
        timestamp: new Date().toISOString(),
        retryable: true
      });
      toast.error('Download failed. Please try again.');
    }
  };

  // Enhanced share function
  const handleShare = async () => {
    try {
      const shareTitle = `Ghana Poultry Calendar - ${selectedPoultry}`;
      const shareText = `Check out the ${selectedPoultry} production calendar for ${selectedRegion}${selectedDistrict !== 'All Districts' ? `, ${selectedDistrict}` : ''}!`;

      const shareData = {
        title: shareTitle,
        text: shareText,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Poultry calendar shared successfully!');
      } else {
        // Fallback: Copy to clipboard
        const textToCopy = `${shareTitle}\n${shareText}\n${window.location.href}`;
        await navigator.clipboard.writeText(textToCopy);
        toast.success('Calendar link copied to clipboard!');
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
      if (error.type === 'data_loading' || error.type === 'poultry_fetch') {
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
        case 'poultry_fetch':
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
        case 'poultry_fetch':
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
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <FaSync className="text-xs" />
                <span>Retry</span>
              </button>
            )}
            <button
              onClick={onClear}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
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
      <PageTitle title="Poultry Calendar" />
      <div className="min-h-screen bg-gray-100 pt-20 lg:pt-24">
        {/* Main Container */}
        <div className="px-4 md:px-8 py-6 md:py-8">
          <InlineOfflineWarning
            message="Poultry calendar data may be limited while server is offline"
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
                  <span className="text-green-600">Poultry Production </span>
                  <span className="text-blue-600">Calendar</span>
                </h1>
                <p className="text-gray-500 text-base md:text-lg">
                  Production cycle management and advisory for poultry operations across Ghana
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

          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Season</label>
                  <select
                    value={selectedSeason}
                    onChange={handleSeasonChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="">Select Season</option>
                    {seasonOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Poultry Type <span className="text-red-400">*</span></label>
                  <select
                    value={selectedPoultry}
                    onChange={handlePoultryChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="">Select Poultry</option>
                    <option value="broilers">Broilers</option>
                    <option value="layers">Layers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Region <span className="text-red-400">*</span></label>
                  <select
                    value={selectedRegion}
                    onChange={handleRegionChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="All Regions">Select Region</option>
                    {regionsOfGhana.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">District <span className="text-red-400">*</span></label>
                  <select
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={selectedRegion === "All Regions"}
                  >
                    <option value="All Districts">Select District</option>
                    <SafeDistrictOptions
                      districts={districtData.districts}
                      placeholder=""
                      includeEmpty={false}
                    />
                  </select>
                </div>
              </div>
            </div>
            {(!selectedSeason || !selectedPoultry || selectedRegion === "All Regions" || selectedDistrict === "All Districts") && (
              <p className="mt-3 text-xs text-amber-600 font-medium">
                Select season, poultry type, region, and district to view calendar data
              </p>
            )}
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
                <p className="text-gray-600">Loading poultry calendar data...</p>
              </div>
            </div>
          )}

          {/* No Data State - Gray Background */}
          {!loading && selectedSeason && selectedPoultry && selectedRegion !== "All Regions" && selectedDistrict !== "All Districts" && poultryActivities.length === 0 && (
            <div className="py-8 md:py-16 text-center px-4">
              <div className="max-w-md mx-auto">
                {/* Simple Plant Icon - Matching Target */}
                <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="text-2xl">🐔</div>
                </div>

                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">No Poultry Calendar Data</h3>

                {/* Enhanced messaging based on user selection and server status */}
                {error && error.type === 'calendar_manager' ? (
                  <div className="text-gray-600 mb-6 text-sm md:text-base">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-700 mb-2">
                        <FaExclamationTriangle />
                        <span className="font-medium">System Error</span>
                      </div>
                      <p className="text-red-600">Calendar system initialization failed. Please try refreshing the page.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600 mb-6 text-sm md:text-base">
                    {selectedRegion === 'All Regions' && selectedDistrict === 'All Districts' ? (
                      <p>Select a specific region and district to view poultry calendar data.</p>
                    ) : selectedRegion !== 'All Regions' && selectedDistrict === 'All Districts' ? (
                      <p>Select a specific district in {selectedRegion} to view poultry calendar data.</p>
                    ) : (
                      <p>No poultry calendar data available for {selectedPoultry} in {selectedDistrict}, {selectedRegion}.</p>
                    )}
                  </div>
                )}

                {/* System Status Indicator */}
                {apiStats && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <FaDatabase />
                      <span className="font-medium">Server Status: Connected</span>
                    </div>
                    <p className="text-green-600">System is online and ready to display calendar data when available.</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Calendar Content - Gray Background */}
          {poultryActivities.length > 0 && selectedSeason && selectedPoultry && selectedRegion !== "All Regions" && selectedDistrict !== "All Districts" && (
            <div className="mt-8">
              <SmartCalendarRenderer
                activities={poultryActivities}
                weeksData={weeksData}
                metadata={{
                  ...calendarMetadata,
                  activitiesCount: poultryActivities.length,
                  selectedPoultry,
                  selectedRegion,
                  selectedDistrict
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
                calendarTitle={`${selectedPoultry?.toUpperCase() || 'POULTRY'} PRODUCTION-CYCLE CALENDAR`}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PoultryCalendar;
