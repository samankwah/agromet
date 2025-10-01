import { useState, useMemo, useRef, useEffect } from "react";
import PageTitle from '../components/PageTitle';
import prismaImage from "../assets/images/prisma.png";
import { districtOfGhana } from "../district";
import { FaEye, FaDownload } from "react-icons/fa";
import html2pdf from "html2pdf.js";

const AgroMetAdvisory = () => {
  // Define region-specific crops mapping
  const regionSpecificCrops = {
    OTI: ["Maize", "Rice", "Soyabean"],
    VOLTA: ["Rice", "Maize", "Tomato"],
    NORTHERN: ["Maize", "Rice", "Soyabean", "Sorghum"],
    ASHANTI: ["Maize", "Rice", "Tomato"],
    WESTERN: ["Maize", "Rice", "Tomato"],
    "WESTERN NORTH": ["Maize", "Rice", "Tomato"],
    "GREATER ACCRA": ["Maize", "Rice", "Tomato"],
    EASTERN: ["Maize", "Rice", "Tomato"],
    "UPPER WEST": ["Maize", "Rice", "Sorghum", "Soyabean"],
    "UPPER EAST": ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato"],
    "NORTH EAST": ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato"],
    SAVANNAH: ["Maize", "Rice", "Sorghum", "Soyabean"],
    AHAFO: ["Maize", "Rice"],
    BONO: ["Maize", "Rice", "Tomato"],
    "BONO EAST": ["Maize", "Rice", "Soyabean"],
    CENTRAL: ["Maize", "Rice", "Tomato"],
  };

  // All available crops (used as fallback)
  const allCrops = ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato"];

  const filterData = {
    region: [
      "OTI",
      "VOLTA",
      "NORTHERN",
      "ASHANTI",
      "WESTERN",
      "WESTERN NORTH",
      "GREATER ACCRA",
      "EASTERN",
      "UPPER WEST",
      "UPPER EAST",
      "NORTH EAST",
      "SAVANNAH",
      "AHAFO",
      "BONO",
      "BONO EAST",
      "CENTRAL",
    ],
    month: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    year: ["2024", "2025"],
    week: [
      "1st – 7th",
      "8th – 14th",
      "15th – 21st",
      "22nd – 28th",
      "29th – 31st",
    ],
  };

  const [selected, setSelected] = useState({
    crop: "",
    region: "",
    district: "",
    variety: "",
    month: "",
    year: "",
    week: "",
  });
  const [showAdvisory, setShowAdvisory] = useState(false);
  const pdfExportRef = useRef(null);
  
  // New state for dynamic data from backend
  const [dynamicAdvisories, setDynamicAdvisories] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableCrops, setAvailableCrops] = useState([]);
  const [isUsingDynamicData, setIsUsingDynamicData] = useState(false);
  const [apiStats, setApiStats] = useState(null);
  const [loadingDynamic, setLoadingDynamic] = useState(false);

  // Load dynamic data from backend on component mount
  useEffect(() => {
    const loadDynamicData = async () => {
      setLoadingDynamic(true);
      try {
        // Fetch available districts, crops, and statistics
        const [districtsResult, cropsResult, statsResult] = await Promise.all([
          agriculturalDataService.getDistricts(),
          agriculturalDataService.getCrops(),
          agriculturalDataService.getStatistics()
        ]);
        
        if (districtsResult.success) {
          setAvailableDistricts(districtsResult.data);
        }
        
        if (cropsResult.success) {
          setAvailableCrops(cropsResult.data);
        }
        
        if (statsResult.success) {
          setApiStats(statsResult.data);
          // If we have uploaded agromet advisory data, use dynamic data
          if (statsResult.data.agrometAdvisories > 0) {
            setIsUsingDynamicData(true);
          }
        }
      } catch (error) {
        console.error('Error loading dynamic agricultural data:', error);
      } finally {
        setLoadingDynamic(false);
      }
    };
    
    loadDynamicData();
  }, []);
  
  // Fetch dynamic agromet advisory data when filters change
  useEffect(() => {
    const loadAgrometData = async () => {
      if (!isUsingDynamicData || !selected.district || !selected.crop) return;
      
      setLoadingDynamic(true);
      try {
        const filters = {};
        
        if (selected.district) {
          filters.district = selected.district;
        }
        
        if (selected.crop) {
          filters.crop = selected.crop;
        }
        
        const result = await agriculturalDataService.getAgrometAdvisory(filters);
        
        if (result.success) {
          setDynamicAdvisories(result.data);
        } else {
          setDynamicAdvisories([]);
        }
      } catch (error) {
        console.error('Error loading agromet advisory data:', error);
        setDynamicAdvisories([]);
      } finally {
        setLoadingDynamic(false);
      }
    };
    
    loadAgrometData();
  }, [selected.district, selected.crop, isUsingDynamicData]);

  // Get available crops based on selected region or dynamic data
  const availableCropsForDropdown = useMemo(() => {
    if (isUsingDynamicData && availableCrops.length > 0) {
      return availableCrops;
    }
    if (!selected.region) return allCrops;
    return regionSpecificCrops[selected.region] || allCrops;
  }, [selected.region, isUsingDynamicData, availableCrops]);

  const [data] = useState({
    advisoryTable: {
      parameters: [
        "RAINFALL",
        "TEMPERATURE",
        "EVAPO-TRANSPIRATION",
        "SOIL MOISTURE",
        "HUMIDITY",
        "SOIL TEMPERATURE",
        "DAY LENGTH",
        "WIND DXN",
        "WIND SPEED",
        "PRESSURE",
      ],
      forecast: [
        "50% Prob. of occurrence",
        "35°C (Day) / 24°C (Night)",
        "4 mm/day",
        "Moderate",
        "75%",
        "22°C",
        "12 hours",
        "North-East",
        "15 km/h",
        "1015 hPa",
      ],
      implication: [
        "Favorable for planting; avoid waterlogging.",
        "Optimal for germination and seedling growth.",
        "May increase water stress on plants.",
        "Good for root growth but risks drying out fast.",
        "Promotes disease spread like blight.",
        "Favors seed germination.",
        "Supports photosynthesis and plant growth.",
        "Low risk for wind damage.",
        "Minimal effects on crop canopy.",
        "Stable weather conditions.",
      ],
      advisory: [
        "Use well-drained plots.",
        "Begin sowing crops; monitor heat stress.",
        "Apply irrigation efficiently.",
        "Irrigate if dry spells last more than 2 days.",
        "Apply fungicide; ensure airflow in the field.",
        "Maintain soil cover (mulch).",
        "No special action required.",
        "Monitor for dry winds.",
        "Maintain crop support if required.",
        "Continue normal operations.",
      ],
    },
  });

  const handleFilterChange = (e, field) => {
    const value = e.target.value;

    setSelected((prev) => {
      const newSelected = { ...prev, [field]: value };

      // Reset crop selection if region changes
      if (field === "region") {
        newSelected.crop = "";
        newSelected.district = "";
      }

      return newSelected;
    });
  };

  const summary = useMemo(() => {
    if (!selected.crop || !selected.district || !selected.region) {
      return "";
    }
    
    // If using dynamic data and we have advisories, use them
    if (isUsingDynamicData && dynamicAdvisories.length > 0) {
      const latestAdvisory = dynamicAdvisories[0]; // Most recent advisory
      return `Current agromet advisory for ${selected.crop} farmers in ${selected.district} district: ${latestAdvisory.advisory} Weather conditions: ${latestAdvisory.weatherCondition || 'Variable'}. Recommended action: ${latestAdvisory.action || 'Follow standard practices'}. Priority: ${latestAdvisory.priority || 'Medium'}. ${latestAdvisory.temperature ? `Temperature: ${latestAdvisory.temperature}` : ''} ${latestAdvisory.rainfall ? `Rainfall: ${latestAdvisory.rainfall}` : ''} ${latestAdvisory.humidity ? `Humidity: ${latestAdvisory.humidity}` : ''}`;
    }

    // Generate region and crop specific summary
    const summaries = {
      Maize: {
        default: `This week's weather outlook for maize farmers in the ${selected.district} district of the ${selected.region} region indicates favorable conditions for crop establishment and early growth. Rainfall is expected to be moderate, sufficient for planting activities, while temperatures will support optimal germination and development. However, high humidity may promote fungal diseases; apply fungicides as a preventive measure. Monitor soil moisture closely.`,
        NORTHERN: `This week's weather outlook for maize farmers in the ${selected.district} district of the ${selected.region} region indicates moderate rainfall that will benefit maize at its current vegetative growth stage. The warm temperatures (35°C day / 24°C night) are ideal for rapid growth, but farmers should watch for fall armyworm which thrives in these conditions. The moderate soil moisture levels are adequate, but additional irrigation may be needed if dry conditions persist more than 3 days.`,
      },
      Rice: {
        default: `This week's weather outlook for rice farmers in the ${selected.district} district of the ${selected.region} region shows adequate rainfall patterns suitable for rice paddies. Maintain appropriate water levels in fields. The warm temperatures are favorable for rice development, but be alert for rice blast disease due to the high humidity (75%). Ensure proper water management to maximize yield potential.`,
        VOLTA: `Rice farmers in the ${selected.district} district should expect moderate rainfall which is beneficial for the current growth stage. The high humidity (75%) combined with warm temperatures creates conditions favorable for rice blast development - early preventive fungicide application is advised. Prepare bunds to maintain optimal water levels in the paddies, as rainfall is expected to be sufficient but not excessive.`,
      },
      Sorghum: {
        default: `Sorghum farmers in the ${selected.district} district can expect favorable growing conditions with the forecasted weather. The moderate rainfall and temperatures are ideal for sorghum development. Monitor for sorghum midge in flowering crops. The wind conditions are not concerning for lodging at this stage.`,
        "UPPER WEST": `Sorghum farmers in ${selected.district} district should take advantage of the favorable soil moisture conditions for planting. The forecasted temperature range is optimal for sorghum germination and early growth. Wind speeds are low, reducing risk of seedling damage. Watch for striga weed which may emerge with the current soil temperature and moisture conditions.`,
      },
      Soyabean: {
        default: `Current weather conditions for soyabean farmers in ${selected.district} district are moderately favorable. The rainfall and temperature patterns will support vegetative growth, but watch for foliar diseases due to high humidity. Apply inoculants if planting new fields to maximize nitrogen fixation under the current soil temperature conditions.`,
        NORTHERN: `Soyabean farmers in ${selected.district} district of the ${selected.region} region should expect conditions suitable for pod development. The moderate soil moisture will support pod filling, but irrigation may be necessary during dry spells. The high humidity may increase the risk of cercospora leaf spot - scout fields regularly and apply fungicide preventatively if necessary.`,
      },
      Tomato: {
        default: `Tomato farmers in ${selected.district} district should monitor crops closely as the combination of high humidity and warm temperatures creates favorable conditions for late blight and other fungal diseases. Maintain good airflow through proper spacing and pruning. The moderate soil moisture is adequate for fruit development, but consistent irrigation may be needed.`,
        "GREATER ACCRA": `Tomato farmers in ${selected.district} district of ${selected.region} region should implement trellising to prevent fruit contact with soil given the current humid conditions. Apply fungicides preventatively as the high humidity (75%) and moderate temperatures create ideal conditions for early blight. Irrigate efficiently as the current evapotranspiration rate (4mm/day) indicates moderate water demand.`,
      },
    };

    // Return specific summary for region+crop if available, otherwise return crop default
    return (
      summaries[selected.crop]?.[selected.region] ||
      summaries[selected.crop]?.default ||
      summaries.Maize.default
    );
  }, [selected.crop, selected.district, selected.region, isUsingDynamicData, dynamicAdvisories]);

  const handleViewAdvisories = () => {
    if (!selected.crop || !selected.region || !selected.district) {
      alert("Please select crop, region, and district.");
      return;
    }
    setShowAdvisory(true);
  };

  // PDF export with detailed information
  const downloadPDF = () => {
    if (!showAdvisory) {
      alert("Please view advisories first before downloading.");
      return;
    }

    // Create PDF content
    const pdfContent = document.createElement("div");
    pdfContent.id = "pdf-export-content";
    pdfContent.style.padding = "20px";
    document.body.appendChild(pdfContent);

    // Format the date for the header
    const formattedDate =
      selected.week && selected.month && selected.year
        ? `${selected.week} ${selected.month} ${selected.year}`
        : new Date().toLocaleDateString();

    pdfContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px; padding: 15px; background-color: #22c55e; color: white; border-radius: 8px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">West Africa Food System Resilience Programme</h1>
          <h2 style="margin: 5px 0 0; font-size: 18px;">Agro-Meteorological Forecasts and Advisories</h2>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
          <h3 style="margin-top: 0; color: #1e40af; text-align: center; font-size: 18px;">
            DETAILED WEATHER ADVISORY FOR ${
              selected.crop?.toUpperCase() || "CROPS"
            } FARMERS
          </h3>
          <p style="margin: 0; text-align: center;">
            <strong>Region:</strong> ${selected.region || "N/A"} |
            <strong>District:</strong> ${selected.district || "N/A"} |
            <strong>Period:</strong> ${formattedDate}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 5px;">Weather Parameters & Forecast</h3>
          <ul style="list-style-type: disc; padding-left: 20px;">
            ${data.advisoryTable.parameters
              .map(
                (param, i) => `
              <li style="margin-bottom: 10px;">
                <strong>${param}:</strong> ${data.advisoryTable.forecast[i]}
              </li>
            `
              )
              .join("")}
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">Implications for Farming</h3>
          <ul style="list-style-type: disc; padding-left: 20px;">
            ${data.advisoryTable.parameters
              .map(
                (param, i) => `
              <li style="margin-bottom: 10px;">
                <strong>${param}:</strong> ${data.advisoryTable.implication[i]}
              </li>
            `
              )
              .join("")}
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 5px;">Recommended Actions</h3>
          <ul style="list-style-type: disc; padding-left: 20px;">
            ${data.advisoryTable.parameters
              .map(
                (param, i) => `
              <li style="margin-bottom: 10px;">
                <strong>${param}:</strong> ${data.advisoryTable.advisory[i]}
              </li>
            `
              )
              .join("")}
          </ul>
        </div>

        <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #dcfce7;">
          <h3 style="color: #166534; margin-top: 0;">Summary Outlook & Recommendations</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${
            summary || "No summary available"
          }</p>

          <h4 style="color: #166534; margin-top: 20px;">Key Takeaways:</h4>
          <ul style="list-style-type: disc; padding-left: 20px;">
            <li>Weather conditions are generally favorable for ${
              selected.crop || "crop"
            } cultivation.</li>
            <li>Moderate rainfall provides good planting opportunities.</li>
            <li>Temperature conditions support optimal germination and growth.</li>
            <li>Be vigilant about potential fungal diseases due to high humidity.</li>
            <li>Maintain proper field drainage to prevent waterlogging.</li>
          </ul>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>Generated on ${new Date().toLocaleDateString()} by West Africa Food System Resilience Programme</p>
          <p>For more information, contact your local agricultural extension officer</p>
        </div>
      </div>
    `;

    // Generate PDF from the content
    const opt = {
      margin: 10,
      filename: `agro_advisory_${selected.crop || "crop"}_${
        selected.region || "region"
      }_${selected.district || "district"}_${selected.month || ""}_${
        selected.year || ""
      }.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, logging: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // Use a small timeout to ensure the element is fully in the DOM
    setTimeout(() => {
      html2pdf()
        .from(pdfContent)
        .set(opt)
        .save()
        .then(() => {
          // Clean up by removing the temporary element
          if (document.body.contains(pdfContent)) {
            document.body.removeChild(pdfContent);
          }
        })
        .catch((error) => {
          console.error("PDF generation error:", error);
          alert("Error generating PDF. Please try again.");
          if (document.body.contains(pdfContent)) {
            document.body.removeChild(pdfContent);
          }
        });
    }, 100);
  };

  return (
    <>
      <PageTitle title="Agro-Meteorological Advisory" />
      <div
        className="min-h-screen bg-gray-950 mx-auto px-4 py-2 md:px-8 lg:px-12"
      style={{
        backgroundImage: `url(${prismaImage})`,
        backgroundSize: "1400px 1200px",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        WebkitBackgroundSize: "1200px 800px",
        MozBackgroundSize: "1200px 800px",
      }}
    >
      <div className="container mx-auto p-3 md:p-5 shadow-xl rounded-lg mt-20 md:mt-28 mb-12 bg-white/90 backdrop-blur-md">
        <div className="relative text-center mb-5 bg-gradient-to-r from-green-500 to-blue-600 py-5 rounded-t-lg shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold uppercase text-white">
            Agro-Meteorological Forecasts and Advisories
          </h1>
          <h2 className="text-md md:text-xl font-semibold text-gray-100"></h2>
          {isUsingDynamicData && apiStats && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                <FaDatabase className="mr-1" />
                {apiStats.agrometAdvisories} Dynamic Advisories Available
              </span>
              {apiStats.lastUpdated && (
                <div className="text-sm mt-1 text-white/80">
                  Last updated: {new Date(apiStats.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-200 rounded-lg shadow-lg mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Region selection first */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 capitalize text-gray-800">
                Region
              </label>
              <select
                value={selected.region || ""}
                onChange={(e) => handleFilterChange(e, "region")}
                className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
              >
                <option value="">Select Region</option>
                {filterData.region.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* District selection - dependent on region */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 capitalize text-gray-800">
                District
              </label>
              <select
                value={selected.district || ""}
                onChange={(e) => handleFilterChange(e, "district")}
                className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                disabled={!selected.region}
              >
                <option value="">Select District</option>
                {/* Show dynamic districts if available, otherwise use static */}
                {isUsingDynamicData && availableDistricts.length > 0 ? (
                  availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))
                ) : (
                  selected.region &&
                  districtOfGhana
                    .filter(
                      (d) =>
                        d.region.toLowerCase() === selected.region.toLowerCase()
                    )
                    .map((district) => (
                      <option key={district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))
                )}
              </select>
            </div>

            {/* Crop selection - dependent on region */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 capitalize text-gray-800">
                Commodity
              </label>
              <select
                value={selected.crop || ""}
                onChange={(e) => handleFilterChange(e, "crop")}
                className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                disabled={!selected.region}
              >
                <option value="">Select Crop</option>
                {availableCrops.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
              {selected.region && (
                <p className="text-xs text-gray-600 mt-1">
                  Showing crops specific to {selected.region} region
                </p>
              )}
            </div>

            {/* Other selections */}
            {["month", "year", "week"].map((field) => (
              <div key={field} className="flex flex-col">
                <label className="text-sm font-medium mb-1 capitalize text-gray-800">
                  {field.replace("_", " ")}
                </label>
                <select
                  value={selected[field] || ""}
                  onChange={(e) => handleFilterChange(e, field)}
                  className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                >
                  <option value="">
                    Select {field.charAt(0).toUpperCase() + field.slice(1)}
                  </option>
                  {filterData[field].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {/* Data source indicator */}
          {isUsingDynamicData ? (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="font-medium text-green-800">📊 Displaying advisories from uploaded Excel/CSV files</span>
              <div className="mt-1 text-xs text-green-600">
                {dynamicAdvisories.length} advisories found for current filters
              </div>
            </div>
          ) : (
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="font-medium text-blue-800">📚 Displaying default weather advisory templates</span>
              <div className="mt-1 text-xs text-blue-600">
                Upload Excel/CSV files through the dashboard to see dynamic data
              </div>
            </div>
          )}
          
          <div className="flex justify-center mt-3">
            <button
              onClick={handleViewAdvisories}
              disabled={
                loadingDynamic || !selected.crop || !selected.region || !selected.district
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 shadow-md ${
                loadingDynamic || !selected.crop || !selected.region || !selected.district
                  ? "bg-gray-400 cursor-not-allowed text-gray-100"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {loadingDynamic ? <FaSpinner className="animate-spin" /> : <FaEye className="text-lg" />}
              {loadingDynamic ? 'Loading...' : 'View Advisories'}
            </button>
          </div>
        </div>

        {/* Show no data message for dynamic data */}
        {showAdvisory && isUsingDynamicData && dynamicAdvisories.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow-md mb-5">
            <div className="text-gray-500 text-lg mb-2">No agromet advisory data found</div>
            <p className="text-gray-400">Try adjusting your filters or upload agromet advisory data through the dashboard.</p>
          </div>
        )}
        
        {showAdvisory && (
          <div id="pdf-content">
            {/* Show dynamic advisory data if available */}
            {isUsingDynamicData && dynamicAdvisories.length > 0 && (
              <div className="mb-5 bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-green-600 mb-3 flex items-center">
                  <FaDatabase className="mr-2" />
                  Current Agromet Advisories from Uploaded Data
                </h3>
                <div className="grid gap-4">
                  {dynamicAdvisories.slice(0, 3).map((advisory, index) => (
                    <div key={advisory.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{advisory.weatherCondition || 'Weather Advisory'}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          advisory.priority === 'High' ? 'bg-red-100 text-red-800' :
                          advisory.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {advisory.priority || 'Medium'} Priority
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{advisory.advisory}</p>
                      {advisory.action && (
                        <p className="text-sm text-blue-600 font-medium">
                          Recommended Action: {advisory.action}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                        {advisory.date && <span>Date: {new Date(advisory.date).toLocaleDateString()}</span>}
                        {advisory.temperature && <span>Temp: {advisory.temperature}</span>}
                        {advisory.rainfall && <span>Rainfall: {advisory.rainfall}</span>}
                        {advisory.humidity && <span>Humidity: {advisory.humidity}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {dynamicAdvisories.length > 3 && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Showing 3 of {dynamicAdvisories.length} advisories
                  </p>
                )}
              </div>
            )}
            
            <div className="mb-5 overflow-x-auto">
              <table className="min-w-max mx-auto border-collapse bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
                    <th className="border border-gray-200 p-2.5"></th>
                    {data.advisoryTable.parameters.map((param, index) => (
                      <th
                        key={index}
                        className="border border-gray-200 p-2.5 text-center"
                      >
                        {param}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["forecast", "implication", "advisory"].map((type) => (
                    <tr
                      key={type}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="border border-gray-200 p-3 bg-gray-100 font-semibold text-gray-800">
                        {type.toUpperCase()}
                      </td>
                      {data.advisoryTable[type].map((item, index) => (
                        <td
                          key={index}
                          className="border border-gray-200 p-3 text-left"
                        >
                          <p className="text-sm text-gray-800 whitespace-normal break-words leading-relaxed">
                            {item}
                          </p>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 p-4 bg-white rounded-lg shadow-lg border-2 border-gradient-to-br from-green-500 to-blue-600">
              <p className="text-center text-base md:text-lg font-semibold text-gray-800 mb-2">
                SUMMARY WEATHER OUTLOOK & ADVISORY FOR{" "}
                <span className="text-green-600">
                  {selected.crop.toUpperCase()}
                </span>{" "}
                FARMERS IN THE{" "}
                <span className="text-green-600">
                  {selected.district.toUpperCase()}
                </span>{" "}
                DISTRICT OF THE{" "}
                <span className="text-green-600">{selected.region}</span> REGION
                FOR THE WEEK OF{" "}
                <span className="text-green-600">
                  {selected.week || "CURRENT WEEK"}
                </span>{" "}
                <span className="text-green-600">
                  {selected.month?.toUpperCase() || ""} {selected.year || ""}
                </span>
              </p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {summary}
              </p>
            </div>

            {/* Hidden div for PDF export reference */}
            <div ref={pdfExportRef} className="hidden"></div>

            <div className="flex justify-center mt-4">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all duration-300 shadow-md"
              >
                <FaDownload className="text-lg" />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default AgroMetAdvisory;

// import { useState, useMemo, useRef, useEffect } from "react";
// import prismaImage from "../assets/images/prisma.png";
// import { districtOfGhana } from "../district";
// import {
//   FaEye,
//   FaDownload,
//   FaVolumeUp,
//   FaPause,
//   FaLanguage,
// } from "react-icons/fa";
// import html2pdf from "html2pdf.js";

// const AgroMetAdvisory = () => {
//   // All existing state and logic
//   const regionSpecificCrops = {
//     OTI: ["Maize", "Rice", "Soyabean"],
//     VOLTA: ["Rice", "Maize", "Tomato"],
//     NORTHERN: ["Maize", "Rice", "Soyabean", "Sorghum"],
//     ASHANTI: ["Maize", "Rice", "Tomato"],
//     WESTERN: ["Maize", "Rice", "Tomato"],
//     "WESTERN NORTH": ["Maize", "Rice", "Tomato"],
//     "GREATER ACCRA": ["Maize", "Rice", "Tomato"],
//     EASTERN: ["Maize", "Rice", "Tomato"],
//     "UPPER WEST": ["Maize", "Rice", "Sorghum", "Soyabean"],
//     "UPPER EAST": ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato"],
//     "NORTH EAST": ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato"],
//     SAVANNAH: ["Maize", "Rice", "Sorghum", "Soyabean"],
//     AHAFO: ["Maize", "Rice"],
//     BONO: ["Maize", "Rice", "Tomato"],
//     "BONO EAST": ["Maize", "Rice", "Soyabean"],
//     CENTRAL: ["Maize", "Rice", "Tomato"],
//   };

//   const allCrops = ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato"];

//   const filterData = {
//     region: [
//       "OTI",
//       "VOLTA",
//       "NORTHERN",
//       "ASHANTI",
//       "WESTERN",
//       "WESTERN NORTH",
//       "GREATER ACCRA",
//       "EASTERN",
//       "UPPER WEST",
//       "UPPER EAST",
//       "NORTH EAST",
//       "SAVANNAH",
//       "AHAFO",
//       "BONO",
//       "BONO EAST",
//       "CENTRAL",
//     ],
//     month: [
//       "January",
//       "February",
//       "March",
//       "April",
//       "May",
//       "June",
//       "July",
//       "August",
//       "September",
//       "October",
//       "November",
//       "December",
//     ],
//     year: ["2024", "2025"],
//     week: [
//       "1st – 7th",
//       "8th – 14th",
//       "15th – 21st",
//       "22nd – 28th",
//       "29th – 31st",
//     ],
//   };

//   const [selected, setSelected] = useState({
//     crop: "",
//     region: "",
//     district: "",
//     variety: "",
//     month: "",
//     year: "",
//     week: "",
//   });
//   const [showAdvisory, setShowAdvisory] = useState(false);
//   const pdfExportRef = useRef(null);

//   // New states for GhanaNLP TTS integration
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [audioSrc, setAudioSrc] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [selectedLanguage, setSelectedLanguage] = useState("en");
//   const audioRef = useRef(null);

//   // Available languages for TTS
//   const languages = [
//     { code: "en", name: "English" },
//     { code: "ak", name: "Twi" },
//     { code: "dag", name: "Dagbani" },
//     { code: "ee", name: "Ewe" },
//     { code: "ha", name: "Hausa" },
//   ];

//   // Updated language mapping for both TTS and translation
//   // GhanaNLP TTS speakers mapping
//   const languageSpeakers = {
//     en: ["eng_male_1", "eng_female_1"],
//     ak: ["twi_male_1", "twi_female_1"],
//     dag: ["dag_male_1", "dag_female_1"],
//     ee: ["ewe_male_1", "ewe_female_1"],
//     ha: ["hau_male_1", "hau_female_1"],
//     dga: ["dga_male_1", "dga_female_1"],
//     kpo: ["kpo_male_1", "kpo_female_1"],
//     gur: ["gur_male_1", "gur_female_1"],
//   };

//   // Get available crops based on selected region
//   const availableCrops = useMemo(() => {
//     if (!selected.region) return allCrops;
//     return regionSpecificCrops[selected.region] || allCrops;
//   }, [selected.region]);

//   const [data] = useState({
//     advisoryTable: {
//       parameters: [
//         "RAINFALL",
//         "TEMPERATURE",
//         "EVAPO-TRANSPIRATION",
//         "SOIL MOISTURE",
//         "HUMIDITY",
//         "SOIL TEMPERATURE",
//         "DAY LENGTH",
//         "WIND DXN",
//         "WIND SPEED",
//         "PRESSURE",
//       ],
//       forecast: [
//         "50% Prob. of occurrence",
//         "35°C (Day) / 24°C (Night)",
//         "4 mm/day",
//         "Moderate",
//         "75%",
//         "22°C",
//         "12 hours",
//         "North-East",
//         "15 km/h",
//         "1015 hPa",
//       ],
//       implication: [
//         "Favorable for planting; avoid waterlogging.",
//         "Optimal for germination and seedling growth.",
//         "May increase water stress on plants.",
//         "Good for root growth but risks drying out fast.",
//         "Promotes disease spread like blight.",
//         "Favors seed germination.",
//         "Supports photosynthesis and plant growth.",
//         "Low risk for wind damage.",
//         "Minimal effects on crop canopy.",
//         "Stable weather conditions.",
//       ],
//       advisory: [
//         "Use well-drained plots.",
//         "Begin sowing crops; monitor heat stress.",
//         "Apply irrigation efficiently.",
//         "Irrigate if dry spells last more than 2 days.",
//         "Apply fungicide; ensure airflow in the field.",
//         "Maintain soil cover (mulch).",
//         "No special action required.",
//         "Monitor for dry winds.",
//         "Maintain crop support if required.",
//         "Continue normal operations.",
//       ],
//     },
//   });

//   const handleFilterChange = (e, field) => {
//     const value = e.target.value;

//     setSelected((prev) => {
//       const newSelected = { ...prev, [field]: value };

//       // Reset crop selection if region changes
//       if (field === "region") {
//         newSelected.crop = "";
//         newSelected.district = "";
//       }

//       return newSelected;
//     });
//   };

//   const summary = useMemo(() => {
//     if (!selected.crop || !selected.district || !selected.region) {
//       return "";
//     }

//     // Generate region and crop specific summary
//     const summaries = {
//       Maize: {
//         default: `This week's weather outlook for maize farmers in the ${selected.district} district of the ${selected.region} region indicates favorable conditions for crop establishment and early growth. Rainfall is expected to be moderate, sufficient for planting activities, while temperatures will support optimal germination and development. However, high humidity may promote fungal diseases; apply fungicides as a preventive measure. Monitor soil moisture closely.`,
//         NORTHERN: `This week's weather outlook for maize farmers in the ${selected.district} district of the ${selected.region} region indicates moderate rainfall that will benefit maize at its current vegetative growth stage. The warm temperatures (35°C day / 24°C night) are ideal for rapid growth, but farmers should watch for fall armyworm which thrives in these conditions. The moderate soil moisture levels are adequate, but additional irrigation may be needed if dry conditions persist more than 3 days.`,
//       },
//       Rice: {
//         default: `This week's weather outlook for rice farmers in the ${selected.district} district of the ${selected.region} region shows adequate rainfall patterns suitable for rice paddies. Maintain appropriate water levels in fields. The warm temperatures are favorable for rice development, but be alert for rice blast disease due to the high humidity (75%). Ensure proper water management to maximize yield potential.`,
//         VOLTA: `Rice farmers in the ${selected.district} district should expect moderate rainfall which is beneficial for the current growth stage. The high humidity (75%) combined with warm temperatures creates conditions favorable for rice blast development - early preventive fungicide application is advised. Prepare bunds to maintain optimal water levels in the paddies, as rainfall is expected to be sufficient but not excessive.`,
//       },
//       Sorghum: {
//         default: `Sorghum farmers in the ${selected.district} district can expect favorable growing conditions with the forecasted weather. The moderate rainfall and temperatures are ideal for sorghum development. Monitor for sorghum midge in flowering crops. The wind conditions are not concerning for lodging at this stage.`,
//         "UPPER WEST": `Sorghum farmers in ${selected.district} district should take advantage of the favorable soil moisture conditions for planting. The forecasted temperature range is optimal for sorghum germination and early growth. Wind speeds are low, reducing risk of seedling damage. Watch for striga weed which may emerge with the current soil temperature and moisture conditions.`,
//       },
//       Soyabean: {
//         default: `Current weather conditions for soyabean farmers in ${selected.district} district are moderately favorable. The rainfall and temperature patterns will support vegetative growth, but watch for foliar diseases due to high humidity. Apply inoculants if planting new fields to maximize nitrogen fixation under the current soil temperature conditions.`,
//         NORTHERN: `Soyabean farmers in ${selected.district} district of the ${selected.region} region should expect conditions suitable for pod development. The moderate soil moisture will support pod filling, but irrigation may be necessary during dry spells. The high humidity may increase the risk of cercospora leaf spot - scout fields regularly and apply fungicide preventatively if necessary.`,
//       },
//       Tomato: {
//         default: `Tomato farmers in ${selected.district} district should monitor crops closely as the combination of high humidity and warm temperatures creates favorable conditions for late blight and other fungal diseases. Maintain good airflow through proper spacing and pruning. The moderate soil moisture is adequate for fruit development, but consistent irrigation may be needed.`,
//         "GREATER ACCRA": `Tomato farmers in ${selected.district} district of ${selected.region} region should implement trellising to prevent fruit contact with soil given the current humid conditions. Apply fungicides preventatively as the high humidity (75%) and moderate temperatures create ideal conditions for early blight. Irrigate efficiently as the current evapotranspiration rate (4mm/day) indicates moderate water demand.`,
//       },
//     };

//     // Return specific summary for region+crop if available, otherwise return crop default
//     return (
//       summaries[selected.crop]?.[selected.region] ||
//       summaries[selected.crop]?.default ||
//       summaries.Maize.default
//     );
//   }, [selected.crop, selected.district, selected.region]);

//   const handleViewAdvisories = () => {
//     if (!selected.crop || !selected.region || !selected.district) {
//       alert("Please select crop, region, and district.");
//       return;
//     }
//     setShowAdvisory(true);
//   };

//   // Add an API key state (you would get this from your environment or config)
//   const [apiKey, setApiKey] = useState("");

//   // Add state for offline mode and translation
//   const [isOfflineMode, setIsOfflineMode] = useState(false);
//   const [translatedSummary, setTranslatedSummary] = useState("");
//   const [isTranslating, setIsTranslating] = useState(false);
//   const [translationError, setTranslationError] = useState(false);

//   // Available languages mapping for both TTS and translation
//   const languageInfo = {
//     en: { name: "English", code: "eng_Latn", translateFrom: false },
//     ak: { name: "Twi", code: "tw", translateFrom: true },
//     dag: { name: "Dagbani", code: "dag_Latn", translateFrom: true },
//     ee: { name: "Ewe", code: "ee", translateFrom: true },
//     ga: { name: "Ga", code: "gaa", translateFrom: true },
//   };

//   // Add an effect to check API availability on component mount
//   useEffect(() => {
//     const checkApiAvailability = async () => {
//       try {
//         const response = await fetch(
//           "https://translation-api.ghananlp.org/tts/v1/speakers",
//           {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             // Short timeout to avoid long waits
//             signal: AbortSignal.timeout(5000),
//           }
//         );

//         setIsOfflineMode(!response.ok);
//       } catch (error) {
//         console.warn("GhanaNLP API might be unavailable:", error);
//         setIsOfflineMode(true);
//       }
//     };

//     checkApiAvailability();
//   }, []);

//   // Effect to translate summary when language changes and summary exists
//   useEffect(() => {
//     // Only translate if a language other than English is selected and we have a summary
//     if (selectedLanguage !== "en" && summary && !isOfflineMode) {
//       translateSummary();
//     } else {
//       // Reset translated summary when switching back to English
//       setTranslatedSummary("");
//       setTranslationError(false);
//     }
//   }, [selectedLanguage, summary, isOfflineMode]);

//   // Function to translate the summary text
//   const translateSummary = async () => {
//     // Skip translation if we're in offline mode or the language is English
//     if (isOfflineMode || selectedLanguage === "en" || !summary) {
//       return;
//     }

//     setIsTranslating(true);
//     setTranslationError(false);

//     try {
//       // Get target language code
//       const targetLangCode = languageInfo[selectedLanguage]?.code;

//       if (!targetLangCode) {
//         throw new Error(`Unsupported language code: ${selectedLanguage}`);
//       }

//       // Create AbortController for timeout
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

//       // Prepare headers
//       const headers = {
//         "Content-Type": "application/json",
//       };

//       // Add API key if available
//       if (apiKey) {
//         headers["Authorization"] = `Bearer ${apiKey}`;
//       }

//       // Make the translation API request
//       const response = await fetch(
//         "https://translation-api.ghananlp.org/tts/v1/synthesize",
//         {
//           method: "POST",
//           headers: headers,
//           body: JSON.stringify({
//             text: summary,
//             source_language: "eng_Latn", // English
//             target_language: targetLangCode,
//           }),
//           signal: controller.signal,
//         }
//       );

//       // Clear timeout
//       clearTimeout(timeoutId);

//       if (!response.ok) {
//         throw new Error(`Translation API error: ${response.status}`);
//       }

//       // Parse response
//       const data = await response.json();

//       // Check if we have translated text
//       if (data && data.translated_text) {
//         setTranslatedSummary(data.translated_text);
//       } else {
//         throw new Error("No translation returned");
//       }
//     } catch (error) {
//       console.error("Translation error:", error);
//       setTranslationError(true);

//       // If connection failed, set offline mode
//       if (
//         error.name === "AbortError" ||
//         error.message.includes("NetworkError") ||
//         error.message.includes("Failed to fetch")
//       ) {
//         setIsOfflineMode(true);
//       }
//     } finally {
//       setIsTranslating(false);
//     }
//   };

//   // Modified function to handle TTS - now works with translated text
//   const handleTextToSpeech = async () => {
//     // If already playing, pause all audio
//     if (isPlaying) {
//       if (audioRef.current) {
//         audioRef.current.pause();
//       }
//       // Also cancel any browser speech synthesis if active
//       if (window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//       setIsPlaying(false);
//       return;
//     }

//     // If we have an existing audio source, just play it
//     if (audioSrc && audioRef.current && !isOfflineMode) {
//       audioRef.current.play();
//       setIsPlaying(true);
//       return;
//     }

//     setIsLoading(true);

//     // Determine which text to use - translated or original
//     const textToSpeak =
//       selectedLanguage !== "en" && translatedSummary && !translationError
//         ? translatedSummary
//         : summary;

//     // If we're in offline mode or the API has failed before, use browser TTS
//     if (isOfflineMode) {
//       // Browser's built-in TTS implementation
//       if (!window.speechSynthesis) {
//         alert(
//           "Text-to-speech is not supported in your browser. Please try another browser."
//         );
//         setIsLoading(false);
//         return;
//       }

//       // Cancel any existing speech
//       window.speechSynthesis.cancel();

//       // Create new utterance
//       const utterance = new SpeechSynthesisUtterance(textToSpeak);

//       // Try to match language if possible
//       switch (selectedLanguage) {
//         case "en":
//           utterance.lang = "en-GB";
//           break;
//         case "tw":
//           utterance.lang = "tw"; // If browser supports Akan
//           break;
//         case "ee":
//           utterance.lang = "ee"; // If browser supports Ewe
//           break;
//         case "dag":
//           utterance.lang = "dag"; // If browser supports Dagbani
//           break;
//         case "gaa":
//           utterance.lang = "gaa"; // If browser supports Hausa
//           break;
//         default:
//           utterance.lang = "en-GB";
//       }

//       // Set up event listeners
//       utterance.onstart = () => {
//         setIsPlaying(true);
//         setIsLoading(false);
//       };

//       utterance.onend = () => {
//         setIsPlaying(false);
//       };

//       utterance.onerror = (event) => {
//         console.error("SpeechSynthesis error:", event);
//         setIsPlaying(false);
//         setIsLoading(false);
//         alert("Browser text-to-speech failed. Please try again later.");
//       };

//       // Start speaking
//       window.speechSynthesis.speak(utterance);
//       return;
//     }

//     // Otherwise try the GhanaNLP API
//     try {
//       // Get the appropriate speaker ID based on selected language
//       const speaker =
//         languageSpeakers[selectedLanguage]?.[0] || "twi_speaker_4";

//       // Limit text size
//       const maxTextLength = 800;
//       const textToConvert =
//         textToSpeak.length > maxTextLength
//           ? textToSpeak.substring(0, maxTextLength) + "..."
//           : textToSpeak;

//       // Create AbortController for timeout
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

//       // Prepare the request with headers
//       const headers = {
//         "Content-Type": "application/json",
//       };

//       // Add API key if available
//       if (apiKey) {
//         headers["Authorization"] = `Bearer ${apiKey}`;
//       }

//       // Make the API request
//       const response = await fetch(
//         "https://translation-api.ghananlp.org/tts/v1/tts",
//         {
//           method: "POST",
//           headers: headers,
//           body: JSON.stringify({
//             text: textToConvert,
//             speaker: speaker,
//             audio_format: "mp3",
//           }),
//           signal: controller.signal,
//         }
//       );

//       // Clear timeout
//       clearTimeout(timeoutId);

//       if (!response.ok) {
//         // If unauthorized, try the browser TTS
//         if (response.status === 401 || response.status === 403) {
//           console.warn("API authorization failed, falling back to browser TTS");
//           setIsOfflineMode(true);
//           handleTextToSpeech(); // Call the function again which will now use browser TTS
//           return;
//         }

//         throw new Error(`API error: ${response.status}`);
//       }

//       // Handle the binary audio data
//       const blob = await response.blob();

//       // If we got a very small file, it might be an error response
//       if (blob.size < 100) {
//         throw new Error("Received invalid audio data");
//       }

//       const audioUrl = URL.createObjectURL(blob);
//       setAudioSrc(audioUrl);

//       // Play the audio
//       if (audioRef.current) {
//         audioRef.current.src = audioUrl;
//         audioRef.current.oncanplaythrough = () => {
//           const playPromise = audioRef.current.play();
//           if (playPromise !== undefined) {
//             playPromise
//               .then(() => {
//                 setIsPlaying(true);
//               })
//               .catch((err) => {
//                 console.error("Audio playback error:", err);
//                 setIsOfflineMode(true);
//                 handleTextToSpeech(); // Call the function again which will now use browser TTS
//               });
//           }
//         };

//         // Set timeout for audio loading
//         setTimeout(() => {
//           if (!isPlaying) {
//             console.warn("Audio loading timeout, falling back to browser TTS");
//             setIsOfflineMode(true);
//             handleTextToSpeech(); // Call the function again which will now use browser TTS
//           }
//         }, 3000);
//       }
//     } catch (error) {
//       console.error("GhanaNLP TTS API error:", error);
//       // Set offline mode if connection failed
//       if (
//         error.name === "AbortError" ||
//         error.message.includes("NetworkError") ||
//         error.message.includes("Failed to fetch")
//       ) {
//         setIsOfflineMode(true);
//       }

//       // Use browser TTS
//       setIsOfflineMode(true);
//       handleTextToSpeech(); // Call the function again which will now use browser TTS
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Clean up audio URL object when component unmounts
//   useEffect(() => {
//     return () => {
//       if (audioSrc) {
//         URL.revokeObjectURL(audioSrc);
//       }
//     };
//   }, [audioSrc]);

//   // Handle audio ended event
//   const handleAudioEnded = () => {
//     setIsPlaying(false);
//   };

//   // PDF export with detailed information
//   const downloadPDF = () => {
//     if (!showAdvisory) {
//       alert("Please view advisories first before downloading.");
//       return;
//     }

//     // Create PDF content
//     const pdfContent = document.createElement("div");
//     pdfContent.id = "pdf-export-content";
//     pdfContent.style.padding = "20px";
//     document.body.appendChild(pdfContent);

//     // Format the date for the header
//     const formattedDate =
//       selected.week && selected.month && selected.year
//         ? `${selected.week} ${selected.month} ${selected.year}`
//         : new Date().toLocaleDateString();

//     pdfContent.innerHTML = `
//       <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
//         <div style="text-align: center; margin-bottom: 20px; padding: 15px; background-color: #22c55e; color: white; border-radius: 8px;">
//           <h1 style="margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">West Africa Food System Resilience Programme</h1>
//           <h2 style="margin: 5px 0 0; font-size: 18px;">Agro-Meteorological Forecasts and Advisories</h2>
//         </div>

//         <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
//           <h3 style="margin-top: 0; color: #1e40af; text-align: center; font-size: 18px;">
//             DETAILED WEATHER ADVISORY FOR ${
//               selected.crop?.toUpperCase() || "CROPS"
//             } FARMERS
//           </h3>
//           <p style="margin: 0; text-align: center;">
//             <strong>Region:</strong> ${selected.region || "N/A"} |
//             <strong>District:</strong> ${selected.district || "N/A"} |
//             <strong>Period:</strong> ${formattedDate}
//           </p>
//         </div>

//         <div style="margin-bottom: 20px;">
//           <h3 style="color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 5px;">Weather Parameters & Forecast</h3>
//           <ul style="list-style-type: disc; padding-left: 20px;">
//             ${data.advisoryTable.parameters
//               .map(
//                 (param, i) => `
//               <li style="margin-bottom: 10px;">
//                 <strong>${param}:</strong> ${data.advisoryTable.forecast[i]}
//               </li>
//             `
//               )
//               .join("")}
//           </ul>
//         </div>

//         <div style="margin-bottom: 20px;">
//           <h3 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">Implications for Farming</h3>
//           <ul style="list-style-type: disc; padding-left: 20px;">
//             ${data.advisoryTable.parameters
//               .map(
//                 (param, i) => `
//               <li style="margin-bottom: 10px;">
//                 <strong>${param}:</strong> ${data.advisoryTable.implication[i]}
//               </li>
//             `
//               )
//               .join("")}
//           </ul>
//         </div>

//         <div style="margin-bottom: 20px;">
//           <h3 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 5px;">Recommended Actions</h3>
//           <ul style="list-style-type: disc; padding-left: 20px;">
//             ${data.advisoryTable.parameters
//               .map(
//                 (param, i) => `
//               <li style="margin-bottom: 10px;">
//                 <strong>${param}:</strong> ${data.advisoryTable.advisory[i]}
//               </li>
//             `
//               )
//               .join("")}
//           </ul>
//         </div>

//         <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #dcfce7;">
//           <h3 style="color: #166534; margin-top: 0;">Summary Outlook & Recommendations</h3>
//           <p style="white-space: pre-wrap; line-height: 1.6;">${
//             summary || "No summary available"
//           }</p>

//           <h4 style="color: #166534; margin-top: 20px;">Key Takeaways:</h4>
//           <ul style="list-style-type: disc; padding-left: 20px;">
//             <li>Weather conditions are generally favorable for ${
//               selected.crop || "crop"
//             } cultivation.</li>
//             <li>Moderate rainfall provides good planting opportunities.</li>
//             <li>Temperature conditions support optimal germination and growth.</li>
//             <li>Be vigilant about potential fungal diseases due to high humidity.</li>
//             <li>Maintain proper field drainage to prevent waterlogging.</li>
//           </ul>
//         </div>

//         <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280;">
//           <p>Generated on ${new Date().toLocaleDateString()} by West Africa Food System Resilience Programme</p>
//           <p>For more information, contact your local agricultural extension officer</p>
//         </div>
//       </div>
//     `;

//     // Generate PDF from the content
//     const opt = {
//       margin: 10,
//       filename: `agro_advisory_${selected.crop || "crop"}_${
//         selected.region || "region"
//       }_${selected.district || "district"}_${selected.month || ""}_${
//         selected.year || ""
//       }.pdf`,
//       image: { type: "jpeg", quality: 0.98 },
//       html2canvas: { scale: 2, logging: true },
//       jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
//     };

//     // Use a small timeout to ensure the element is fully in the DOM
//     setTimeout(() => {
//       html2pdf()
//         .from(pdfContent)
//         .set(opt)
//         .save()
//         .then(() => {
//           // Clean up by removing the temporary element
//           if (document.body.contains(pdfContent)) {
//             document.body.removeChild(pdfContent);
//           }
//         })
//         .catch((error) => {
//           console.error("PDF generation error:", error);
//           alert("Error generating PDF. Please try again.");
//           if (document.body.contains(pdfContent)) {
//             document.body.removeChild(pdfContent);
//           }
//         });
//     }, 100);
//   };

//   return (
//     <div
//       className="min-h-screen bg-gray-950 mx-auto px-4 py-2 md:px-8 lg:px-12"
//       style={{
//         backgroundImage: `url(${prismaImage})`,
//         backgroundSize: "1400px 1200px",
//         backgroundPosition: "center",
//         backgroundRepeat: "no-repeat",
//         backgroundAttachment: "fixed",
//         WebkitBackgroundSize: "1200px 800px",
//         MozBackgroundSize: "1200px 800px",
//       }}
//     >
//       <div className="container mx-auto p-3 md:p-5 shadow-xl rounded-lg mt-20 md:mt-28 mb-12 bg-white/90 backdrop-blur-md">
//         <div className="relative text-center mb-5 bg-gradient-to-r from-green-500 to-blue-600 py-5 rounded-t-lg shadow-lg">
//           <h1 className="text-2xl md:text-3xl font-bold uppercase text-white">
//             West Africa Food System Resilience Programme
//           </h1>
//           <h2 className="text-md md:text-xl font-semibold text-gray-100">
//             Agro-Meteorological Forecasts and Advisories
//           </h2>
//         </div>

//         <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-200 rounded-lg shadow-lg mb-5">
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
//             {/* Region selection first */}
//             <div className="flex flex-col">
//               <label className="text-sm font-medium mb-1 capitalize text-gray-800">
//                 Region
//               </label>
//               <select
//                 value={selected.region || ""}
//                 onChange={(e) => handleFilterChange(e, "region")}
//                 className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
//               >
//                 <option value="">Select Region</option>
//                 {filterData.region.map((value) => (
//                   <option key={value} value={value}>
//                     {value}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* District selection - dependent on region */}
//             <div className="flex flex-col">
//               <label className="text-sm font-medium mb-1 capitalize text-gray-800">
//                 District
//               </label>
//               <select
//                 value={selected.district || ""}
//                 onChange={(e) => handleFilterChange(e, "district")}
//                 className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
//                 disabled={!selected.region}
//               >
//                 <option value="">Select District</option>
//                 {selected.region &&
//                   districtOfGhana
//                     .filter(
//                       (d) =>
//                         d.region.toLowerCase() === selected.region.toLowerCase()
//                     )
//                     .map((district) => (
//                       <option key={district.name} value={district.name}>
//                         {district.name}
//                       </option>
//                     ))}
//               </select>
//             </div>

//             {/* Crop selection - dependent on region */}
//             <div className="flex flex-col">
//               <label className="text-sm font-medium mb-1 capitalize text-gray-800">
//                 Commodity
//               </label>
//               <select
//                 value={selected.crop || ""}
//                 onChange={(e) => handleFilterChange(e, "crop")}
//                 className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
//                 disabled={!selected.region}
//               >
//                 <option value="">Select Crop</option>
//                 {availableCrops.map((crop) => (
//                   <option key={crop} value={crop}>
//                     {crop}
//                   </option>
//                 ))}
//               </select>
//               {selected.region && (
//                 <p className="text-xs text-gray-600 mt-1">
//                   Showing crops specific to {selected.region} region
//                 </p>
//               )}
//             </div>

//             {/* Other selections */}
//             {["month", "year", "week"].map((field) => (
//               <div key={field} className="flex flex-col">
//                 <label className="text-sm font-medium mb-1 capitalize text-gray-800">
//                   {field.replace("_", " ")}
//                 </label>
//                 <select
//                   value={selected[field] || ""}
//                   onChange={(e) => handleFilterChange(e, field)}
//                   className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
//                 >
//                   <option value="">
//                     Select {field.charAt(0).toUpperCase() + field.slice(1)}
//                   </option>
//                   {filterData[field].map((value) => (
//                     <option key={value} value={value}>
//                       {value}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             ))}
//           </div>
//           <div className="flex justify-center mt-3">
//             <button
//               onClick={handleViewAdvisories}
//               disabled={
//                 !selected.crop || !selected.region || !selected.district
//               }
//               className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 shadow-md ${
//                 !selected.crop || !selected.region || !selected.district
//                   ? "bg-gray-400 cursor-not-allowed text-gray-100"
//                   : "bg-green-500 text-white hover:bg-green-600"
//               }`}
//             >
//               <FaEye className="text-lg" />
//               View Advisories
//             </button>
//           </div>
//         </div>

//         {showAdvisory && (
//           <div id="pdf-content">
//             <div className="mb-5 overflow-x-auto">
//               <table className="min-w-max mx-auto border-collapse bg-white rounded-lg shadow-md">
//                 <thead>
//                   <tr className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
//                     <th className="border border-gray-200 p-2.5"></th>
//                     {data.advisoryTable.parameters.map((param, index) => (
//                       <th
//                         key={index}
//                         className="border border-gray-200 p-2.5 text-center"
//                       >
//                         {param}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {["forecast", "implication", "advisory"].map((type) => (
//                     <tr
//                       key={type}
//                       className="hover:bg-gray-50 transition-colors duration-200"
//                     >
//                       <td className="border border-gray-200 p-3 bg-gray-100 font-semibold text-gray-800">
//                         {type.toUpperCase()}
//                       </td>
//                       {data.advisoryTable[type].map((item, index) => (
//                         <td
//                           key={index}
//                           className="border border-gray-200 p-3 text-left"
//                         >
//                           <p className="text-sm text-gray-800 whitespace-normal break-words leading-relaxed">
//                             {item}
//                           </p>
//                         </td>
//                       ))}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="mt-5 p-4 bg-white rounded-lg shadow-lg border-2 border-gradient-to-br from-green-500 to-blue-600">
//               <div className="flex justify-between items-center mb-2">
//                 <p className="text-center text-base md:text-lg font-semibold text-gray-800">
//                   SUMMARY WEATHER OUTLOOK & ADVISORY FOR{" "}
//                   <span className="text-green-600">
//                     {selected.crop.toUpperCase()}
//                   </span>{" "}
//                   FARMERS IN THE{" "}
//                   <span className="text-green-600">
//                     {selected.district.toUpperCase()}
//                   </span>{" "}
//                   DISTRICT OF THE{" "}
//                   <span className="text-green-600">{selected.region}</span>{" "}
//                   REGION FOR THE WEEK OF{" "}
//                   <span className="text-green-600">
//                     {selected.week || "CURRENT WEEK"}
//                   </span>{" "}
//                   <span className="text-green-600">
//                     {selected.month?.toUpperCase() || ""} {selected.year || ""}
//                   </span>
//                 </p>

//                 {/* Language selection and Listen button */}
//                 <div className="flex items-center space-x-2">
//                   <div className="relative inline-block">
//                     <label htmlFor="language-select" className="sr-only">
//                       Select Language
//                     </label>
//                     <div className="flex items-center space-x-1">
//                       <FaLanguage className="text-gray-600 text-lg" />
//                       <select
//                         id="language-select"
//                         value={selectedLanguage}
//                         onChange={(e) => {
//                           const newLang = e.target.value;
//                           setSelectedLanguage(newLang);
//                           setAudioSrc(""); // Clear audio src when language changes

//                           // If switching from non-English to English, clear translated summary
//                           if (newLang === "ak") {
//                             setTranslatedSummary("");
//                             setTranslationError(false);
//                           }
//                         }}
//                         className="p-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-green-500"
//                       >
//                         {Object.entries(languageInfo).map(([code, info]) => (
//                           <option key={code} value={code}>
//                             {info.name}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   <button
//                     onClick={handleTextToSpeech}
//                     disabled={isLoading || !summary}
//                     className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all duration-300 text-white ${
//                       isLoading
//                         ? "bg-gray-400 cursor-wait"
//                         : isPlaying
//                         ? "bg-red-500 hover:bg-red-600"
//                         : "bg-blue-500 hover:bg-blue-600"
//                     }`}
//                     title={
//                       isOfflineMode
//                         ? "Using browser text-to-speech (GhanaNLP API unavailable)"
//                         : ""
//                     }
//                   >
//                     {isLoading ? (
//                       <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
//                     ) : isPlaying ? (
//                       <FaPause className="text-sm" />
//                     ) : (
//                       <FaVolumeUp className="text-sm" />
//                     )}
//                     <span>
//                       {isLoading
//                         ? "Loading..."
//                         : isPlaying
//                         ? "Pause"
//                         : "Listen"}
//                     </span>
//                     {isOfflineMode && (
//                       <span className="text-xs ml-1">(Browser TTS)</span>
//                     )}
//                   </button>

//                   {/* Hidden audio element */}
//                   <audio
//                     ref={audioRef}
//                     src={audioSrc}
//                     onEnded={handleAudioEnded}
//                     onError={() => {
//                       console.error("Audio element error");
//                       setIsPlaying(false);
//                       // Try browser TTS as fallback if audio element fails
//                       if (!isOfflineMode) {
//                         setIsOfflineMode(true);
//                         if (!isLoading) useBrowserTTS();
//                       }
//                     }}
//                     className="hidden"
//                   />
//                 </div>
//               </div>

//               <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
//                 {/* Show translated text if available, otherwise show original */}
//                 {selectedLanguage !== "en" &&
//                 translatedSummary &&
//                 !translationError
//                   ? translatedSummary
//                   : summary}

//                 {/* Show translation loading indicator */}
//                 {isTranslating && (
//                   <span className="inline-flex items-center ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
//                     <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent mr-1"></div>
//                     Translating...
//                   </span>
//                 )}

//                 {/* Show translation error */}
//                 {translationError && selectedLanguage !== "en" && (
//                   <span className="block mt-2 text-red-500 text-sm">
//                     Translation to{" "}
//                     {languageInfo[selectedLanguage]?.name || selectedLanguage}{" "}
//                     failed. Showing English text instead.
//                   </span>
//                 )}
//               </p>
//             </div>

//             {/* Hidden div for PDF export reference */}
//             <div ref={pdfExportRef} className="hidden"></div>

//             <div className="flex justify-center mt-4 space-x-4">
//               <button
//                 onClick={downloadPDF}
//                 className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all duration-300 shadow-md"
//               >
//                 <FaDownload className="text-lg" />
//                 Download PDF
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AgroMetAdvisory;
