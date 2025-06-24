import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  CloudRain,
  Thermometer,
  Wind,
  Sun,
  Droplet,
  Leaf,
  AlertTriangle,
  Map,
  BarChart3,
  Clock,
  Info,
  Download,
  Share2,
  Filter,
  ChevronDown,
  ChevronUp,
  Target,
  Activity,
} from "lucide-react";

const SubseasonalForecast = () => {
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState("week2-3");
  const [selectedRegion, setSelectedRegion] = useState("Greater Accra");
  const [forecastType, setForecastType] = useState("overview");
  const [showConfidenceLevel, setShowConfidenceLevel] = useState(false);
  const [expandedParameter, setExpandedParameter] = useState(null);

  // Define forecast periods
  const forecastPeriods = {
    "week2-3": {
      label: "Week 2-3",
      days: "8-21 days",
      description: "Medium-range outlook",
    },
    "week3-4": {
      label: "Week 3-4",
      days: "15-28 days",
      description: "Extended forecast",
    },
    "week5-6": {
      label: "Week 5-6",
      days: "29-42 days",
      description: "Subseasonal outlook",
    },
    "week7-8": {
      label: "Week 7-8",
      days: "43-56 days",
      description: "Long-range forecast",
    },
  };

  // Define regions
  const regions = [
    "Greater Accra",
    "Ashanti",
    "Western",
    "Eastern",
    "Central",
    "Northern",
    "Upper East",
    "Upper West",
    "Volta",
    "Bono",
    "Bono East",
    "Ahafo",
    "Western North",
    "Oti",
    "North East",
    "Savannah",
  ];

  // Generate forecast data
  const generateForecastData = () => {
    const currentDate = new Date();
    const weekOffset = {
      "week2-3": 14,
      "week3-4": 21,
      "week5-6": 35,
      "week7-8": 49,
    };

    // Generate temperature anomaly (deviation from normal)
    const tempAnomaly = (Math.random() - 0.5) * 4; // -2 to +2 degrees
    const rainfallAnomaly = (Math.random() - 0.5) * 60; // -30% to +30%

    // Confidence decreases with time
    const baseConfidence =
      selectedWeek === "week2-3"
        ? 70
        : selectedWeek === "week3-4"
        ? 60
        : selectedWeek === "week5-6"
        ? 50
        : 40;

    const confidence = baseConfidence + Math.floor(Math.random() * 20) - 10;

    // Regional adjustments
    const isNorthern =
      selectedRegion.includes("Northern") ||
      selectedRegion.includes("Upper") ||
      selectedRegion.includes("Savannah");
    const isWestern =
      selectedRegion.includes("Western") || selectedRegion.includes("Central");

    return {
      period: forecastPeriods[selectedWeek],
      region: selectedRegion,
      confidence: Math.max(20, Math.min(85, confidence)),
      temperature: {
        anomaly: tempAnomaly,
        trend:
          tempAnomaly > 0.5 ? "above" : tempAnomaly < -0.5 ? "below" : "near",
        confidence: Math.max(30, confidence - 5),
      },
      rainfall: {
        anomaly: rainfallAnomaly,
        trend:
          rainfallAnomaly > 10
            ? "above"
            : rainfallAnomaly < -10
            ? "below"
            : "near",
        confidence: Math.max(25, confidence - 10),
      },
      startDate: new Date(
        currentDate.getTime() + weekOffset[selectedWeek] * 24 * 60 * 60 * 1000
      ),
      climatePhenomena: generateClimatePhenomena(),
      agriculturalImpacts: generateAgriculturalImpacts(isNorthern, isWestern),
    };
  };

  const generateClimatePhenomena = () => {
    const phenomena = [
      {
        name: "West African Monsoon",
        status: Math.random() > 0.5 ? "strengthening" : "weakening",
        impact: "Moderate",
        description: "Influences rainfall patterns across the region",
      },
      {
        name: "Atlantic Ocean SST",
        status:
          Math.random() > 0.7
            ? "warming"
            : Math.random() > 0.3
            ? "cooling"
            : "neutral",
        impact: "High",
        description: "Sea surface temperatures affecting moisture transport",
      },
      {
        name: "Saharan Air Layer",
        status: Math.random() > 0.6 ? "active" : "weak",
        impact: "Moderate",
        description: "Dry dusty air mass affecting precipitation",
      },
    ];

    return phenomena;
  };

  const generateAgriculturalImpacts = (isNorthern, isWestern) => {
    const impacts = [];

    if (isNorthern) {
      impacts.push({
        crop: "Cereals (Maize, Sorghum, Millet)",
        impact: "Moderate to High",
        description:
          "Extended dry conditions may affect grain filling stages. Consider drought-tolerant varieties for late plantings.",
        recommendation:
          "Implement water conservation practices and consider supplemental irrigation where available.",
      });
      impacts.push({
        crop: "Legumes (Cowpea, Groundnut)",
        impact: "Moderate",
        description:
          "Heat stress during flowering may reduce pod set. Monitor soil moisture carefully.",
        recommendation:
          "Apply mulching and ensure adequate plant spacing for air circulation.",
      });
    } else if (isWestern) {
      impacts.push({
        crop: "Tree Crops (Cocoa, Oil Palm)",
        impact: "Low to Moderate",
        description:
          "Adequate rainfall expected to support fruit development. Monitor for fungal diseases.",
        recommendation:
          "Maintain regular pruning and disease prevention programs.",
      });
      impacts.push({
        crop: "Root Crops (Cassava, Yam)",
        impact: "Low",
        description: "Favorable conditions for tuber development expected.",
        recommendation:
          "Continue normal management practices with attention to drainage.",
      });
    } else {
      impacts.push({
        crop: "Mixed Cropping Systems",
        impact: "Moderate",
        description:
          "Variable conditions across different crops. Monitor individual crop responses.",
        recommendation:
          "Adjust management practices based on specific crop requirements.",
      });
      impacts.push({
        crop: "Vegetables",
        impact: "Moderate to High",
        description:
          "Potential stress from temperature fluctuations. Market gardens may need protection.",
        recommendation:
          "Consider shade structures and improved irrigation systems.",
      });
    }

    return impacts;
  };

  const forecastData = generateForecastData();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [selectedWeek, selectedRegion]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return "text-green-600";
    if (confidence >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 70) return <Target className="h-4 w-4" />;
    if (confidence >= 50) return <Activity className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getTrendIcon = (trend) => {
    if (trend === "above")
      return <TrendingUp className="h-5 w-5 text-red-500" />;
    if (trend === "below")
      return <TrendingDown className="h-5 w-5 text-blue-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getTrendColor = (trend) => {
    if (trend === "above") return "text-red-600";
    if (trend === "below") return "text-blue-600";
    return "text-gray-600";
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center justify-center">
          {/* <BarChart3 className="mr-2 text-blue-600" /> */}
          Subseasonal Agricultural Forecast
        </h1>
        <p className="mt-2 text-gray-600 max-w-4xl mx-auto">
          Extended-range weather forecasts (2-8 weeks ahead) to support
          strategic agricultural planning. These forecasts help farmers make
          informed decisions about crop selection, planting schedules, and
          resource allocation based on longer-term climate patterns.
        </p>

        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                Subseasonal forecasts provide probabilistic outlooks based on
                climate patterns and are most reliable for identifying general
                trends rather than specific daily conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forecast Period Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline mr-1 h-4 w-4" />
            Forecast Period
          </label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            {Object.entries(forecastPeriods).map(([key, period]) => (
              <option key={key} value={key}>
                {period.label} ({period.days})
              </option>
            ))}
          </select>
        </div>

        {/* Region Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Map className="inline mr-1 h-4 w-4" />
            Region
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* Forecast Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="inline mr-1 h-4 w-4" />
            View Type
          </label>
          <select
            value={forecastType}
            onChange={(e) => setForecastType(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="overview">Overview</option>
            <option value="detailed">Detailed Analysis</option>
            <option value="agricultural">Agricultural Focus</option>
            <option value="climate">Climate Patterns</option>
          </select>
        </div>
      </div>

      {/* Forecast Summary Card */}
      <div className="mb-8 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">
                {forecastData.period.label} Forecast
              </h2>
              <p className="text-blue-100 mt-1">{forecastData.region} Region</p>
              <p className="text-blue-200 text-sm mt-1">
                {forecastData.startDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(
                  forecastData.startDate.getTime() + 13 * 24 * 60 * 60 * 1000
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center">
                {getConfidenceIcon(forecastData.confidence)}
                <span className="ml-1 text-lg font-semibold">
                  {forecastData.confidence}%
                </span>
              </div>
              <p className="text-blue-200 text-sm">Confidence</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temperature Forecast */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Temperature
                  </h3>
                </div>
                {getTrendIcon(forecastData.temperature.trend)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Trend:</span>
                  <span
                    className={`text-sm font-medium ${getTrendColor(
                      forecastData.temperature.trend
                    )}`}
                  >
                    {forecastData.temperature.trend === "above"
                      ? "Above Normal"
                      : forecastData.temperature.trend === "below"
                      ? "Below Normal"
                      : "Near Normal"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Anomaly:</span>
                  <span
                    className={`text-sm font-medium ${getTrendColor(
                      forecastData.temperature.trend
                    )}`}
                  >
                    {forecastData.temperature.anomaly > 0 ? "+" : ""}
                    {forecastData.temperature.anomaly.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span
                    className={`text-sm font-medium ${getConfidenceColor(
                      forecastData.temperature.confidence
                    )}`}
                  >
                    {forecastData.temperature.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {/* Rainfall Forecast */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <CloudRain className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Rainfall
                  </h3>
                </div>
                {getTrendIcon(forecastData.rainfall.trend)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Trend:</span>
                  <span
                    className={`text-sm font-medium ${getTrendColor(
                      forecastData.rainfall.trend
                    )}`}
                  >
                    {forecastData.rainfall.trend === "above"
                      ? "Above Normal"
                      : forecastData.rainfall.trend === "below"
                      ? "Below Normal"
                      : "Near Normal"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Anomaly:</span>
                  <span
                    className={`text-sm font-medium ${getTrendColor(
                      forecastData.rainfall.trend
                    )}`}
                  >
                    {forecastData.rainfall.anomaly > 0 ? "+" : ""}
                    {forecastData.rainfall.anomaly.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span
                    className={`text-sm font-medium ${getConfidenceColor(
                      forecastData.rainfall.confidence
                    )}`}
                  >
                    {forecastData.rainfall.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Climate Phenomena */}
      <div className="mb-8 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Wind className="mr-2 text-blue-600" />
            Influencing Climate Patterns
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Large-scale climate phenomena affecting the forecast
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forecastData.climatePhenomena.map((phenomenon, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">
                    {phenomenon.name}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      phenomenon.impact === "High"
                        ? "bg-red-100 text-red-800"
                        : phenomenon.impact === "Moderate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {phenomenon.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {phenomenon.description}
                </p>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">Status:</span>
                  <span
                    className={`ml-2 text-xs font-medium px-2 py-1 rounded ${
                      phenomenon.status === "strengthening" ||
                      phenomenon.status === "warming" ||
                      phenomenon.status === "active"
                        ? "bg-orange-100 text-orange-800"
                        : phenomenon.status === "weakening" ||
                          phenomenon.status === "cooling" ||
                          phenomenon.status === "weak"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {phenomenon.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agricultural Impacts */}
      <div className="mb-8 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Leaf className="mr-2 text-green-600" />
            Agricultural Impacts & Recommendations
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Crop-specific implications of the{" "}
            {forecastData.period.label.toLowerCase()} forecast
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {forecastData.agriculturalImpacts.map((impact, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setExpandedParameter(
                      expandedParameter === index ? null : index
                    )
                  }
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {impact.crop}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              impact.impact === "High"
                                ? "bg-red-100 text-red-800"
                                : impact.impact === "Moderate to High"
                                ? "bg-orange-100 text-orange-800"
                                : impact.impact === "Moderate"
                                ? "bg-yellow-100 text-yellow-800"
                                : impact.impact === "Low to Moderate"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {impact.impact} Impact
                          </span>
                          {expandedParameter === index ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {impact.description}
                      </p>
                    </div>
                  </div>
                </div>

                {expandedParameter === index && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-1">
                          Recommended Actions:
                        </h5>
                        <p className="text-sm text-gray-700">
                          {impact.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confidence & Uncertainty Information */}
      <div className="mb-8 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setShowConfidenceLevel(!showConfidenceLevel)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Target className="mr-2 text-purple-600" />
              Forecast Confidence & Limitations
            </h3>
            {showConfidenceLevel ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        {showConfidenceLevel && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Confidence Levels
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Overall Forecast:
                    </span>
                    <div className="flex items-center">
                      {getConfidenceIcon(forecastData.confidence)}
                      <span
                        className={`ml-1 text-sm font-medium ${getConfidenceColor(
                          forecastData.confidence
                        )}`}
                      >
                        {forecastData.confidence}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Temperature:</span>
                    <div className="flex items-center">
                      {getConfidenceIcon(forecastData.temperature.confidence)}
                      <span
                        className={`ml-1 text-sm font-medium ${getConfidenceColor(
                          forecastData.temperature.confidence
                        )}`}
                      >
                        {forecastData.temperature.confidence}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rainfall:</span>
                    <div className="flex items-center">
                      {getConfidenceIcon(forecastData.rainfall.confidence)}
                      <span
                        className={`ml-1 text-sm font-medium ${getConfidenceColor(
                          forecastData.rainfall.confidence
                        )}`}
                      >
                        {forecastData.rainfall.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Important Notes
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Forecasts are probabilistic and show trends rather than
                      exact values
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Confidence decreases with longer forecast periods
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Local variations may differ from regional forecasts
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Use in combination with short-term weather forecasts for
                      best planning
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-4 justify-center">
        <button className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Download className="mr-2 h-4 w-4" />
          Download Forecast
        </button>
        <button className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Share2 className="mr-2 h-4 w-4" />
          Share Forecast
        </button>
        <button className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Calendar className="mr-2 h-4 w-4" />
          Subscribe to Updates
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p className="mb-1">
          Subseasonal forecasts are generated using ensemble climate models and
          historical climate patterns
        </p>
        <p className="mb-1">
          Data sources: ECMWF, NCEP, and regional climate models
        </p>
        <p>
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export default SubseasonalForecast;
