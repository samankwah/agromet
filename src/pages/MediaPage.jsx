import { useMemo, useState, useEffect, useRef } from "react";
import prismaImage from "../assets/images/prisma.png";
import { districtOfGhana } from "../district";
import { FaEye, FaDownload } from "react-icons/fa";
import html2pdf from "html2pdf.js";

const MediaPage = () => {
  // Get current date information automatically
  const [currentDate, setCurrentDate] = useState({
    month: "",
    year: "",
    week: "",
    weekRange: "",
  });

  // Filter data - only crop and region/district needed since dates are automatic
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
    crop: ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato"],
  };

  // User selections
  const [selected, setSelected] = useState({
    region: "",
    district: "",
    crop: "",
  });

  // Display states
  const [showAdvisory, setShowAdvisory] = useState(false);
  const pdfContentRef = useRef(null);

  // Mock data similar to original component
  const [data] = useState({
    productionCalendar: {
      Maize: {
        January: ["Land preparation", "Gathering inputs"],
        February: ["Soil treatment", "Early planting for early varieties"],
        March: ["Main planting season", "Apply basal fertilizer"],
        April: ["Weed control", "First top-dressing of fertilizer"],
        May: ["Pest monitoring", "Second fertilizer application"],
        June: ["Disease monitoring", "Prepare for possible drought"],
        July: ["Tasseling stage care", "Prepare for harvest (early varieties)"],
        August: ["Early harvest", "Post-harvest handling"],
        September: ["Main harvest season", "Storage preparation"],
        October: ["Marketing", "Land preparation for second season"],
        November: ["Second season planting", "Input preparation"],
        December: ["Crop maintenance", "End of year evaluation"],
      },
      Rice: {
        January: ["Nursery preparation", "Irrigation system check"],
        February: ["Land preparation (lowland)", "Seed selection"],
        March: ["Transplanting", "Water management"],
        April: ["Weed control", "First fertilizer application"],
        May: ["Pest monitoring", "Second fertilizer application"],
        June: ["Disease control", "Water level management"],
        July: ["Heading stage care", "Bird control"],
        August: ["Prepare for harvest", "Drainage planning"],
        September: ["Main harvest season", "Drying activities"],
        October: ["Post-harvest handling", "Marketing"],
        November: ["Land preparation (second season)", "Input gathering"],
        December: ["Irrigation maintenance", "Planning for next season"],
      },
      Sorghum: {
        January: ["Seed selection", "Input sourcing"],
        February: ["Land preparation", "Soil testing"],
        March: ["Early planting", "Soil amendment application"],
        April: ["Main planting season", "Weed control"],
        May: ["Thinning", "First fertilizer application"],
        June: ["Pest monitoring", "Stalk borer control"],
        July: ["Bird scaring", "Disease management"],
        August: ["Prepare for harvest", "Labor organization"],
        September: ["Main harvest", "Threshing"],
        October: ["Storage", "Marketing"],
        November: ["Land preparation (dry areas)", "Input gathering"],
        December: ["Planning for next season", "Tool maintenance"],
      },
      Soyabean: {
        January: ["Seed selection", "Inoculant sourcing"],
        February: ["Land preparation", "Input gathering"],
        March: ["Early planting", "Soil amendment"],
        April: ["Main planting season", "Weed control"],
        May: ["Pest monitoring", "Fertilizer application"],
        June: ["Disease control", "Canopy management"],
        July: ["Pod development phase", "Pest control"],
        August: ["Prepare for harvest", "Maturity checking"],
        September: ["Main harvest", "Threshing and cleaning"],
        October: ["Storage", "Marketing"],
        November: ["Land preparation (southern zones)", "Input gathering"],
        December: ["Planning for next season", "Equipment maintenance"],
      },
      Tomato: {
        January: ["Nursery preparation", "Input sourcing"],
        February: ["Transplanting (dry season)", "Irrigation setup"],
        March: ["Field maintenance", "Staking"],
        April: ["Flowering stage care", "Pest control"],
        May: ["Harvesting (dry season crop)", "Marketing"],
        June: ["Land preparation (wet season)", "Nursery setup"],
        July: ["Transplanting (wet season)", "Disease prevention"],
        August: ["Trellising", "Pest and disease management"],
        September: ["Fruiting stage care", "Irrigation management"],
        October: ["Main harvest (wet season)", "Post-harvest handling"],
        November: ["Late season maintenance", "Marketing"],
        December: ["Field clearing", "Planning for next season"],
      },
    },
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
        "Affects herbicide efficacy and timing of weed control operations.",
        "Accelerates weed growth; influences fertilizer uptake rates.",
        "Increases rate of fertilizer dissolution in soil.",
        "Determines nutrient mobility and weed competition intensity.",
        "High humidity may reduce herbicide effectiveness.",
        "Influences microbial activity affecting fertilizer breakdown.",
        "Longer days intensify weed-crop competition for light.",
        "May cause herbicide drift during application.",
        "Can affect spray pattern distribution during application.",
        "Minimal impact on weed management activities.",
      ],
      advisory: [
        "Schedule herbicide application 24-48 hours after rainfall for optimal absorption.",
        "Apply fertilizer in early morning; manage weeds before they set seed.",
        "Use appropriate fertilizer formulations based on water availability.",
        "Prioritize weed control in areas with optimal moisture for maximum effectiveness.",
        "Apply contact herbicides during lower humidity periods for better efficacy.",
        "Time fertilizer application to coincide with optimal soil temperature.",
        "Use selective herbicides targeting problem weeds in the crop's critical period.",
        "Apply herbicides when wind direction minimizes drift to sensitive areas.",
        "Avoid herbicide application during windy conditions; use drift reduction nozzles.",
        "Continue normal weed management operations.",
      ],
    },
  });

  // Calculate current month, year, and week on component mount
  useEffect(() => {
    const now = new Date();

    // Get month name
    const monthNames = [
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
    ];
    const currentMonth = monthNames[now.getMonth()];

    // Get year
    const currentYear = now.getFullYear().toString();

    // Calculate week of month
    const date = now.getDate();
    let weekNumber;
    let weekRange;

    if (date <= 7) {
      weekNumber = 1;
      weekRange = "1st – 7th";
    } else if (date <= 14) {
      weekNumber = 2;
      weekRange = "8th – 14th";
    } else if (date <= 21) {
      weekNumber = 3;
      weekRange = "15th – 21st";
    } else if (date <= 28) {
      weekNumber = 4;
      weekRange = "22nd – 28th";
    } else {
      weekNumber = 5;
      weekRange = "29th – 31st";
    }

    setCurrentDate({
      month: currentMonth,
      year: currentYear,
      week: weekNumber,
      weekRange: weekRange,
    });
  }, []);

  const handleFilterChange = (e, field) => {
    setSelected((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // Generate activities based on crop and current month
  const activities = useMemo(() => {
    if (!selected.crop || !currentDate.month) return [];

    return data.productionCalendar[selected.crop]?.[currentDate.month] || [];
  }, [selected.crop, currentDate.month, data.productionCalendar]);

  // Generate comprehensive summary based on selected criteria, activities and weather data
  const comprehensiveSummary = useMemo(() => {
    if (
      !selected.crop ||
      !selected.district ||
      !selected.region ||
      !currentDate.month
    ) {
      return "";
    }

    // Extract key weather information
    const rainfall = data.advisoryTable.forecast[0];
    const temperature = data.advisoryTable.forecast[1];
    const humidity = data.advisoryTable.forecast[4];
    const soilMoisture = data.advisoryTable.forecast[3];

    // Combine implications and advisories into relevant sections
    const rainfallImplication = data.advisoryTable.implication[0];
    const rainfallAdvisory = data.advisoryTable.advisory[0];

    const temperatureImplication = data.advisoryTable.implication[1];
    const temperatureAdvisory = data.advisoryTable.advisory[1];

    const humidityImplication = data.advisoryTable.implication[4];
    const humidityAdvisory = data.advisoryTable.advisory[4];

    const soilMoistureImplication = data.advisoryTable.implication[3];
    const soilMoistureAdvisory = data.advisoryTable.advisory[3];

    // Format activities
    const activityText =
      activities.length > 0
        ? `Key activities for this period include: ${activities.join(" and ")}.`
        : "";

    // Customize summary to focus on weed management and fertilizer application
    return `FARM ADVISORY CALENDAR: ${currentDate.month} ${
      currentDate.year
    }, Week ${currentDate.weekRange}

SUMMARY WEATHER OUTLOOK & ADVISORY FOR ${selected.crop.toUpperCase()} FARMERS IN THE ${selected.district.toUpperCase()} DISTRICT OF THE ${
      selected.region
    } REGION

${activityText}

WEED MANAGEMENT & FERTILIZER APPLICATION RECOMMENDATIONS:

1. RAINFALL: Expected at ${rainfall}. ${rainfallImplication} Recommendation: ${rainfallAdvisory}

2. TEMPERATURE: Forecast at ${temperature}. ${temperatureImplication} Recommendation: ${temperatureAdvisory}

3. HUMIDITY: Expected at ${humidity}. ${humidityImplication} Recommendation: ${humidityAdvisory}

4. SOIL MOISTURE: ${soilMoisture}. ${soilMoistureImplication} Recommendation: ${soilMoistureAdvisory}

Overall assessment: Current weather conditions are particularly important for weed management and fertilizer application operations. Farmers should optimize the timing of herbicide application and fertilizer placement based on these weather parameters to maximize effectiveness and minimize waste. Monitor weed pressure closely and implement integrated weed management strategies for best results.`;
  }, [
    selected.crop,
    selected.district,
    selected.region,
    currentDate,
    activities,
    data.advisoryTable.forecast,
    data.advisoryTable.implication,
    data.advisoryTable.advisory,
  ]);

  // Simple summary for display in the UI (shorter version)
  const simpleSummary = useMemo(() => {
    if (
      !selected.crop ||
      !selected.district ||
      !selected.region ||
      !currentDate.month
    ) {
      return "";
    }

    const activityText =
      activities.length > 0
        ? `Key activities for this period include: ${activities.join(" and ")}.`
        : "";

    return `This week's weather outlook for ${selected.crop} farmers in the ${selected.district} district of the ${selected.region} region during ${currentDate.weekRange} ${currentDate.month} ${currentDate.year} indicates conditions that require specific attention to weed management and fertilizer application. ${activityText} Current rainfall patterns will affect herbicide effectiveness - schedule applications carefully. Temperature conditions will influence both weed growth rates and fertilizer uptake. Apply fertilizers during early morning hours when temperature and humidity are optimal for absorption and minimized volatilization losses.`;
  }, [
    selected.crop,
    selected.district,
    selected.region,
    currentDate,
    activities,
  ]);

  const handleViewAdvisories = () => {
    if (!selected.crop || !selected.region || !selected.district) {
      alert("Please select crop, region, and district.");
      return;
    }
    setShowAdvisory(true);
  };

  const downloadPDF = () => {
    // Create a PDF-specific element to ensure proper formatting
    const pdfContent = document.createElement("div");
    pdfContent.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1e7e34; margin-bottom: 5px; font-size: 24px;">West Africa Food System Resilience Programme</h1>
          <h2 style="color: #2b5797; font-size: 20px;">Media Advisory</h2>
        </div>
        
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.5;">
          ${comprehensiveSummary}
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Issued on: ${new Date().toLocaleDateString()}</p>
          <p>For more information, contact the District Agriculture Office</p>
        </div>
      </div>
    `;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `farm_advisory_${selected.crop}_${selected.district}_${currentDate.month}_${currentDate.year}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().from(pdfContent).set(opt).save();
  };

  return (
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
            Media Advisory - {currentDate.month} {currentDate.year}, Week{" "}
            {currentDate.weekRange}
          </h1>
          <h2 className="text-md md:text-xl font-semibold text-gray-100"></h2>
        </div>

        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-200 rounded-lg shadow-lg mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
                {districtOfGhana
                  .filter(
                    (d) =>
                      d.region.toLowerCase() === selected.region.toLowerCase()
                  )
                  .map((district) => (
                    <option key={district.name} value={district.name}>
                      {district.name}
                    </option>
                  ))}
              </select>
            </div>
            {/* Only show crop and location filters */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 capitalize text-gray-800">
                Commodity
              </label>
              <select
                value={selected.crop || ""}
                onChange={(e) => handleFilterChange(e, "crop")}
                className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all duration-300"
              >
                <option value="">Select Crop</option>
                {filterData.crop.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* <div className="flex justify-center mt-3">
            <button
              onClick={handleViewAdvisories}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-all duration-300 shadow-md"
            >
              <FaEye className="text-lg" />
              View Advisories
            </button>
          </div> */}

          <div className="flex justify-center mt-3">
            <button
              onClick={handleViewAdvisories}
              disabled={
                !selected.crop || !selected.region || !selected.district
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 shadow-md ${
                !selected.crop || !selected.region || !selected.district
                  ? "bg-gray-400 cursor-not-allowed text-gray-100"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              <FaEye className="text-lg" />
              View Advisories
            </button>
          </div>
        </div>

        {showAdvisory && (
          <div ref={pdfContentRef}>
            {/* Production Calendar Activities */}
            <div className="mb-5 p-4 bg-white rounded-lg shadow-lg border-2 border-green-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
                SEASONAL ACTIVITIES FOR {selected.crop.toUpperCase()} IN{" "}
                {currentDate.month.toUpperCase()}
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {activities.map((activity, index) => (
                  <li key={index} className="text-gray-800">
                    {activity}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weather Advisory Table - Updated header to reflect focus */}
            <div className="mb-5 overflow-x-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
                WEED MANAGEMENT & FERTILIZER APPLICATION ADVISORY
              </h3>
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

            {/* Summary Section - Updated to focus on weed management and fertilizer application */}
            <div className="mt-5 p-4 bg-white rounded-lg shadow-lg border-2 border-gradient-to-br from-green-500 to-blue-600">
              <p className="text-center text-base md:text-lg font-semibold text-gray-800 mb-2">
                WEED MANAGEMENT & FERTILIZER APPLICATION ADVISORY FOR{" "}
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
                <span className="text-green-600">{currentDate.weekRange}</span>{" "}
                <span className="text-green-600">
                  {currentDate.month.toUpperCase()} {currentDate.year}
                </span>
              </p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {simpleSummary}
              </p>
            </div>

            {/* Download Button - Only visible in UI, not in PDF */}
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
  );
};

export default MediaPage;
