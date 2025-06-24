import { useState, useEffect } from "react";
import { districtOfGhana } from "../districts";
import { FaDownload, FaShareAlt, FaDatabase, FaInfoCircle } from "react-icons/fa";
import agriculturalDataService from "../services/agriculturalDataService";

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

// Regions of Ghana
const regionsOfGhana = [
  "Greater Accra",
  "Ashanti",
  "Northern",
  "Eastern",
  "Western",
  "Volta",
  "Upper East",
  "Upper West",
  "Central",
  "Bono",
  "Western North",
  "Ahafo",
  "Savannah",
  "Oti",
  "Bono East",
  "North East",
];

// Function to generate region-specific poultry activity times based on climate
const generateRegionPoultryActivities = () => {
  const regions = {};

  // Example climate offset data
  const climateOffsets = {
    "Greater Accra": 0, // No offset
    Ashanti: 1, // Starts 1 week later
    Northern: 4, // Starts 2 weeks later
    Eastern: 1, // Starts 1 week earlier
    Western: 3, // Starts 3 weeks later
    Volta: 1, // Slightly later
    "Upper East": 4, // Late planting
    "Upper West": 3, // Late planting
    Central: 2, // Neutral
    Bono: 3, // Neutral
    "Western North": 1, // Slightly earlier
    Ahafo: 1, // Slightly earlier
    Savannah: 3, // Late planting
    Oti: 2, // Neutral
    "Bono East": 1, // Neutral
    "North East": 4, // Late planting
  };

  // Helper function to adjust the week based on climate offset
  const adjustWeek = (week, offset) => {
    let newWeek = week + offset;
    if (newWeek < 1) newWeek += 22; // Wrap around the year if it goes negative
    if (newWeek > 22) newWeek -= 22; // Wrap around if it exceeds 52 weeks
    return newWeek;
  };

  // Generate activities for each region and poultry type
  regionsOfGhana.forEach((region) => {
    const offset = climateOffsets[region] || 0; // Default to 0 if no specific offset
    regions[region] = {
      layers: basePoultryActivities.layers.map((activity) => ({
        ...activity,
        start: adjustWeek(activity.start, offset),
        end: adjustWeek(activity.end, offset),
      })),
      broilers: basePoultryActivities.broilers.map((activity) => ({
        ...activity,
        start: adjustWeek(activity.start, offset),
        end: adjustWeek(activity.end, offset),
      })),
    };
  });

  return regions;
};

// Declare poultry production calendars for each region
const poultryCalendars = generateRegionPoultryActivities();

const PoultryCalendar = () => {
  const [selectedPoultry, setSelectedPoultry] = useState("layers");
  const [selectedRegion, setSelectedRegion] = useState("Greater Accra");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [hoveredAdvisory, setHoveredAdvisory] = useState(null); // For displaying advisories
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Dynamic data state
  const [dynamicPoultryData, setDynamicPoultryData] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [isUsingDynamicData, setIsUsingDynamicData] = useState(false);
  const [apiStats, setApiStats] = useState(null);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState('');

  // Load dynamic data from backend on component mount
  useEffect(() => {
    const loadDynamicData = async () => {
      setLoadingDynamic(true);
      try {
        // Fetch available districts and statistics
        const [districtsResult, statsResult] = await Promise.all([
          agriculturalDataService.getDistricts(),
          agriculturalDataService.getStatistics()
        ]);

        if (districtsResult.success) {
          setAvailableDistricts(districtsResult.data);
        }

        if (statsResult.success) {
          setApiStats(statsResult.data);
          const hasPoultryData = statsResult.data.poultryCalendars > 0;
          
          if (hasPoultryData) {
            // Load poultry calendar data
            const poultryResult = await agriculturalDataService.getPoultryCalendar();
            
            if (poultryResult.success && poultryResult.data.length > 0) {
              setDynamicPoultryData(poultryResult.data);
              setIsUsingDynamicData(true);
              setDataSourceInfo(`Using uploaded data (${poultryResult.total} records)`);
            } else {
              setDataSourceInfo('Using default calendar data');
            }
          } else {
            setDataSourceInfo('Using default calendar data');
          }
        }
      } catch (error) {
        console.error('Error loading dynamic poultry data:', error);
        setDataSourceInfo('Using default calendar data');
      } finally {
        setLoadingDynamic(false);
      }
    };

    loadDynamicData();
  }, []);

  // Convert dynamic data to calendar format
  const convertDynamicDataToCalendar = (data, district, poultryType) => {
    return data
      .filter(record => {
        const districtMatch = district === 'All Districts' || 
          record.district.toLowerCase().includes(district.toLowerCase());
        const typeMatch = record.poultryType.toLowerCase() === poultryType.toLowerCase();
        return districtMatch && typeMatch;
      })
      .map(record => ({
        activity: record.activity,
        start: record.startWeek,
        end: record.endWeek,
        color: record.color || 'bg-blue-500',
        advisory: record.advisory || record.notes || `${record.activity} activity for ${record.poultryType}`
      }));
  };

  // Get poultry activities - use dynamic data if available, otherwise fall back to static
  const getPoultryActivities = () => {
    if (isUsingDynamicData && dynamicPoultryData.length > 0) {
      return convertDynamicDataToCalendar(dynamicPoultryData, selectedDistrict, selectedPoultry);
    }
    
    // Fallback to static data
    return poultryCalendars[selectedRegion][selectedPoultry] || [];
  };

  const poultryActivities = getPoultryActivities();

  const handleRegionChange = (event) => {
    setSelectedRegion(event.target.value);
  };

  const handlePoultryChange = (event) => {
    setSelectedPoultry(event.target.value);
    setSelectedRegion("Greater Accra"); // Reset to the first region on poultry type change
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
  };

  const handleMouseEnter = (advisory, event) => {
    setHoveredAdvisory(advisory);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredAdvisory(null);
  };

  // Function to handle downloading the poultry calendar
  const handleDownload = () => {
    const headers = [
      "Activity",
      ...Array.from({ length: 20 }, (_, i) => `Week ${i + 1}`),
    ];
    const csvRows = [headers.join(",")];

    poultryActivities.forEach((activity) => {
      const row = [
        activity.activity,
        ...Array.from({ length: 20 }, (_, i) => {
          const week = i + 1;
          return week >= activity.start && week <= activity.end ? "✔️" : "";
        }),
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "poultry_calendar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle sharing the poultry calendar
  const handleShare = () => {
    const shareData = {
      title: "Ghana Poultry Calendar",
      text: `Check out the poultry production calendar for ${selectedPoultry} in the ${selectedRegion} region!`,
      url: window.location.href, // Optionally include the current URL
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => console.log("Share successful"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      alert("Share feature is not supported in this browser.");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-gray-200 min-h-screen p-0 lg:pt-20 pt-14">
      <div className="container mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-center my-6 mb-10 gap-4">
          <div>
            <h1 className="text-gray-800 text-3xl font-bold text-center md:text-left">
              Production Calendar
            </h1>
            {/* Data Source Indicator */}
            <div className="flex items-center gap-2 mt-2 text-sm">
              {isUsingDynamicData ? (
                <>
                  <FaDatabase className="text-green-600" />
                  <span className="text-green-600 font-medium">{dataSourceInfo}</span>
                </>
              ) : (
                <>
                  <FaInfoCircle className="text-blue-600" />
                  <span className="text-blue-600">{dataSourceInfo}</span>
                </>
              )}
              {loadingDynamic && (
                <span className="text-gray-500">Loading dynamic data...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DownloadButton onDownload={handleDownload} />
            <ShareButton onShare={handleShare} />
          </div>
        </div>
        {/* Dropdown for Poultry and Region Selection - Same Row */}
        <div className="flex flex-col md:flex-row mb-4 justify-between my-10 gap-4">
          {/* Dropdown for Poultry Type Selection */}
          <div className="w-full md:w-1/3">
            <label className="text-lg font-semibold block mb-1">
              Select Poultry Type:
            </label>
            <select
              value={selectedPoultry}
              onChange={handlePoultryChange}
              className="border border-gray-300 rounded p-2 w-full"
            >
              <option value="layers">Layers</option>
              <option value="broilers">Broilers</option>
            </select>
          </div>

          {/* Dropdown for Region Selection */}
          <div className="w-full md:w-1/3">
            <label className="text-lg font-semibold block mb-1">
              Select Region:
            </label>
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              className="border border-gray-300 rounded p-2 w-full"
            >
              {regionsOfGhana.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown for District Selection */}
          <div className="w-full md:w-1/3">
            <label className="text-lg font-semibold block mb-1">
              Select District:
            </label>
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="border border-gray-300 rounded p-2 w-full"
            >
              {isUsingDynamicData && availableDistricts.length > 0 ? (
                <>
                  <option value="All Districts">All Districts</option>
                  {availableDistricts.map((district, index) => (
                    <option key={index} value={district}>
                      {district}
                    </option>
                  ))}
                </>
              ) : (
                districtOfGhana
                  .filter((d) => d.region === selectedRegion)
                  .map((district, index) => (
                    <option key={index} value={district.name}>
                      {district.name}
                    </option>
                  ))
              )}
            </select>
          </div>
        </div>

        {/* Calendar Table (Weeks) */}
        <div className="overflow-x-auto">
          <table className="min-w-max border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-left">
                  Stage of Activity
                </th>
                {Array.from({ length: 20 }, (_, i) => (
                  <th
                    key={i}
                    className="border border-gray-300 px-6 text-nowrap"
                  >
                    Week {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {poultryActivities.map((activity, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">
                    {activity.activity}
                  </td>
                  {Array.from({ length: 20 }, (_, i) => {
                    const week = i + 1;
                    const isActive =
                      week >= activity.start && week <= activity.end;
                    return (
                      <td
                        key={i}
                        className={`border border-gray-300 p-2 ${
                          isActive ? activity.color : ""
                        }`}
                        onMouseEnter={(event) =>
                          handleMouseEnter(activity.advisory, event)
                        }
                        onMouseLeave={handleMouseLeave}
                      ></td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tooltip for advisory */}
        {hoveredAdvisory && (
          <div
            className="absolute bg-gray-800 w-[220px] text-white text-sm p-2 rounded"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y + 10,
            }}
          >
            {hoveredAdvisory}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoultryCalendar;
