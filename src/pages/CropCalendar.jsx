import { useState, useEffect } from "react";
import { districtOfGhana } from "../districts";
import { FaDownload, FaShareAlt, FaSpinner } from "react-icons/fa";
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

// List of crops for the slider
const cropsForSlider = ["Maize", "Rice", "Sorghum", "Tomato", "Soybean"];

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
    startMonth = 1; // February (month index 1)
    endMonth = 9; // October (month index 9)
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
  const [currentSlide, setCurrentSlide] = useState(0); // State for the slider
  const [weeksData, setWeeksData] = useState([]); // Dynamic weeks data based on season
  
  // New state for dynamic data from backend
  const [dynamicData, setDynamicData] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableCrops, setAvailableCrops] = useState([]);
  const [isUsingDynamicData, setIsUsingDynamicData] = useState(false);
  const [apiStats, setApiStats] = useState(null);
  const [regionDistrictMapping, setRegionDistrictMapping] = useState({});
  const [calendarMetadata, setCalendarMetadata] = useState({});

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
      } catch (error) {
        console.error('❌ Failed to initialize Dynamic Calendar Manager:', error);
      }
    };

    initializeCalendarManager();
  }, []); // Run once on mount

  // Load dynamic data from backend on component mount
  useEffect(() => {
    const loadDynamicData = async () => {
      setLoading(true);
      try {
        // Fetch available districts and crops
        const [districtsResult, cropsResult, statsResult] = await Promise.all([
          agriculturalDataService.getDistricts(),
          agriculturalDataService.getCrops(), 
          agriculturalDataService.getStatistics()
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
      } catch (error) {
        console.error('Error loading dynamic agricultural data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDynamicData();
  }, []);

  // Fetch dynamic crop calendar data when filters change
  useEffect(() => {
    const loadCropCalendarData = async () => {
      if (!isUsingDynamicData) return;
      
      setLoading(true);
      try {
        const filters = {};
        
        if (selectedDistrict !== 'All Districts') {
          filters.district = selectedDistrict;
        }
        
        if (selectedCrop !== 'all') {
          filters.crop = selectedCrop;
        }
        
        if (selectedSeason) {
          filters.season = selectedSeason;
        }
        
        if (selectedYear) {
          filters.year = selectedYear;
        }
        
        const result = await agriculturalDataService.getCropCalendar(filters);
        
        if (result.success && result.data.length > 0) {
          // Transform backend data to match the expected format
          const transformedData = transformBackendDataToActivities(result.data);
          setDynamicData(transformedData);
        } else {
          setDynamicData([]);
        }
      } catch (error) {
        console.error('Error loading crop calendar data:', error);
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
      }
    } else {
      setDistrictData({ districts: [], meta: {} });
    }
  }, [selectedRegion]);

  // Function to transform backend crop calendar data to activity format
  const transformBackendDataToActivities = (cropCalendarData) => {
    const activities = [];
    const monthColors = [
      'bg-[#00B0F0]', 'bg-[#BF9000]', 'bg-[#000000]', 'bg-[#FFFF00]',
      'bg-[#FF0000]', 'bg-[#008000]', 'bg-[#993366]', 'bg-[#800080]',
      'bg-[#FF00FF]', 'bg-[#87CEEB]', 'bg-[#FF7F00]', 'bg-[#808080]'
    ];
    
    cropCalendarData.forEach((crop, index) => {
      // Create planting activity
      if (crop.plantingStart && crop.plantingEnd) {
        activities.push({
          activity: `Planting ${crop.crop} - ${crop.district}`,
          start: crop.plantingStart,
          end: crop.plantingEnd,
          color: monthColors[index % monthColors.length],
          advisory: `Plant ${crop.crop} in ${crop.district} during ${crop.season} season. ${crop.variety ? `Recommended variety: ${crop.variety}.` : ''} ${crop.notes || ''}`
        });
      }
      
      // Create harvesting activity
      if (crop.harvestStart && crop.harvestEnd) {
        activities.push({
          activity: `Harvesting ${crop.crop} - ${crop.district}`,
          start: crop.harvestStart,
          end: crop.harvestEnd,
          color: 'bg-[#008000]', // Green for harvest
          advisory: `Harvest ${crop.crop} in ${crop.district} during ${crop.season} season. ${crop.notes || ''}`
        });
      }
    });
    
    return activities;
  };

  // Slider effect to cycle through crops
  useEffect(() => {
    // Only start slider if we have crops to display
    if (cropsForSlider.length === 0) return;
    
    const slideInterval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % cropsForSlider.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(slideInterval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    const updateFarmingActivities = async () => {
      // Excel-only calendar system - only show uploaded Excel data
      if (isUsingDynamicData) {
        setFarmingActivities(dynamicData); // Will be empty if no match, showing "no data" message
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
  };

  const handleShare = async () => {
    const shareData = {
      title: `Crop Calendar - ${selectedYearSeason} (${selectedYear})`,
      text: `Check out this crop calendar for ${selectedYearSeason} in ${selectedYear}!`,
      url: "https://your-website-url.com",
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log("Share successful!");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Sharing not supported in this browser.");
    }
  };

  return (
    <>
      <PageTitle title="Crop Calendar" />
      <div className="bg-gradient-to-br from-blue-50 to-gray-200 min-h-screen p-0 lg:pt-20 pt-14">
      <div className="container mx-auto bg-white rounded-lg shadow-lg p-6">
        <InlineOfflineWarning
          message="Calendar data may be limited while server is offline"
          className="mb-6"
        />
        <div className="flex flex-col md:flex-row justify-between items-center my-6 mb-10 gap-4">
          <div>
            <h1 className="text-gray-800 text-3xl font-bold text-center md:text-left">
              Production Calendar
            </h1>
            {isUsingDynamicData && apiStats && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Dynamic Data: {apiStats.cropCalendars} records
                </span>
                {apiStats.lastUpdated && (
                  <div className="text-xs mt-1">
                    Last updated: {new Date(apiStats.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Slider with year and season */}
          <div className="relative overflow-hidden w-full md:w-1/2 h-16">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {cropsForSlider.map((crop, index) => (
                <div
                  key={index}
                  className="min-w-full text-red-600 text-2xl font-bold text-center"
                >
                  Crop Calendar for {selectedRegion} ({selectedDistrict}) -{" "}
                  {selectedCrop}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DownloadButton onDownload={handleDownload} />
            <ShareButton onShare={handleShare} />
          </div>
        </div>

        {/* Dropdowns for Region, District, Crop, and Year/Season */}
        <div className="flex flex-col md:flex-row mb-4 justify-between my-10 gap-4">
          <div className="w-full md:w-1/4">
            <label className="text-lg font-semibold block mb-1">
              Select Year & Season
            </label>
            <select
              value={selectedYearSeason}
              onChange={handleYearSeasonChange}
              className="border border-gray-300 rounded p-2 w-full"
            >
              {yearSeasonOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/4">
            <label className="text-lg font-semibold block mb-1">
              Select Crop
            </label>
            <select
              value={selectedCrop}
              onChange={handleCropChange}
              className="border border-gray-300 rounded p-2 w-full"
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

          <div className="w-full md:w-1/4">
            <label className="text-lg font-semibold block mb-1">
              Select Region
            </label>
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              className="border border-gray-300 rounded p-2 w-full"
            >
              <option value="All Regions">All Regions</option>
              {regionsOfGhana.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/4">
            <label className="text-lg font-semibold block mb-1">
              Select District
            </label>
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="border border-gray-300 rounded p-2 w-full"
              disabled={selectedRegion === "All Regions"}
            >
              <option value="All Districts">All Districts</option>
              <SafeDistrictOptions
                districts={districtData.districts}
                placeholder=""
                includeEmpty={false}
              />
            </select>
            {districtData.meta.hasErrors && (
              <p className="text-orange-500 text-xs mt-1">
📄 No uploaded data available
              </p>
            )}
          </div>
        </div>


        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin mr-2" />
            <span className="text-blue-500">Loading agricultural data...</span>
          </div>
        )}
        
        {/* Data source indicator */}
        {!loading && farmingActivities.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            {calendarMetadata.dataSourceUsed === 'uploaded' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <span className="font-medium text-green-800">📊 Displaying data from uploaded Excel/CSV files</span>
                <div className="mt-1 text-xs text-green-600">
                  {farmingActivities.length} activities found for current filters
                </div>
              </div>
            ) : calendarMetadata.dataSourceUsed === 'computed' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <span className="font-medium text-yellow-800">⚡ Displaying computed calendar data</span>
                <div className="mt-1 text-xs text-yellow-600">
                  Generated based on climate and regional data
                </div>
              </div>
            ) : calendarMetadata.dataSourceUsed === 'no-data' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="font-medium text-gray-800">📄 No calendar data available for this selection</span>
                <div className="mt-1 text-xs text-gray-600">
                  Upload Excel/CSV files through the dashboard to see calendar data
                </div>
              </div>
            ) : null}
          </div>
        )}
        
        {/* No data message */}
        {!loading && farmingActivities.length === 0 && (
          <div className="text-center py-8">
            {isUsingDynamicData && calendarMetadata.strictMode ? (
              // Strict mode: No uploaded data for specific filters
              <div>
                <div className="text-gray-500 text-lg mb-2">📂 No uploaded data found</div>
                <p className="text-gray-400 mb-3">
                  {calendarMetadata.message || "No uploaded calendar data matches your current filter selection."}
                </p>
                <p className="text-sm text-blue-600">
                  Try adjusting your filters or upload calendar data for this crop/region combination.
                </p>
              </div>
            ) : (
              // General no data message
              <div>
                <div className="text-gray-500 text-lg mb-2">No crop calendar data found</div>
                <p className="text-gray-400">Try adjusting your filters or upload crop calendar data through the dashboard.</p>
              </div>
            )}
          </div>
        )}

        {/* Smart Calendar Renderer */}
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
          viewMode="timeline"
          showDataSourceIndicator={true}
          showMetadata={true}
          className="bg-white rounded-lg border border-gray-200"
        />
      </div>
    </div>
    </>
  );
};

export default CropCalendar;
