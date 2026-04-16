import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import PageTitle from '../components/PageTitle';
import T from '../components/common/T';
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

const ConfidenceDonut = ({ value, label, color = "#10b981" }) => {
  const data = [
    { name: "filled", value: value },
    { name: "empty", value: Math.max(0, 100 - value) },
  ];
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-full" style={{ height: 120 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              innerRadius={38}
              outerRadius={52}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-slate-900">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
};

const AnomalyBar = ({ value, max, unit, positiveColor, negativeColor }) => {
  const clamped = Math.max(-max, Math.min(max, value));
  const widthPct = (Math.abs(clamped) / max) * 50;
  const isPositive = clamped >= 0;
  return (
    <div className="w-full">
      <div className="relative h-3 rounded-full bg-slate-100">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300" />
        <div
          className="absolute top-0 h-3 rounded-full"
          style={{
            background: isPositive ? positiveColor : negativeColor,
            left: isPositive ? "50%" : `${50 - widthPct}%`,
            width: `${widthPct}%`,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>-{max}{unit}</span>
        <span>0</span>
        <span>+{max}{unit}</span>
      </div>
    </div>
  );
};

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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
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
    <>
      <PageTitle title="Subseasonal Forecast" />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 -right-40 w-[500px] h-[500px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
          <T>Subseasonal Agricultural</T>{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            <T>Forecast</T>
          </span>
        </h1>
        <p className="mt-3 text-slate-600 max-w-4xl">
          <T>Extended-range weather forecasts (2-8 weeks ahead) to support strategic agricultural planning. These forecasts help farmers make informed decisions about crop selection, planting schedules, and resource allocation based on longer-term climate patterns.</T>
        </p>

        <div className="mt-4 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg max-w-4xl">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">
              <T>Subseasonal forecasts provide probabilistic outlooks based on climate patterns and are most reliable for identifying general trends rather than specific daily conditions.</T>
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Period Timeline */}
      <div className="mb-8 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <T>Forecast Horizon</T>
          </span>
          <span className="text-xs text-slate-400">
            <T>Click to change period</T>
          </span>
        </div>
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200" />
          <div className="relative grid grid-cols-4 gap-2">
            {Object.entries(forecastPeriods).map(([key, period]) => {
              const active = key === selectedWeek;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedWeek(key)}
                  className="flex flex-col items-center text-center group"
                >
                  <span
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      active
                        ? "bg-emerald-600 border-emerald-600 shadow-md scale-110"
                        : "bg-white border-slate-300 group-hover:border-emerald-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        active ? "bg-white" : "bg-slate-300 group-hover:bg-emerald-400"
                      }`}
                    />
                  </span>
                  <span
                    className={`mt-2 text-xs font-semibold ${
                      active ? "text-emerald-700" : "text-slate-600"
                    }`}
                  >
                    {period.label}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block">
                    {period.days}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forecast Period Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <Clock className="inline mr-1 h-4 w-4" />
            <T>Forecast Period</T>
          </label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <Map className="inline mr-1 h-4 w-4" />
            <T>Region</T>
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <Filter className="inline mr-1 h-4 w-4" />
            <T>View Type</T>
          </label>
          <select
            value={forecastType}
            onChange={(e) => setForecastType(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="overview"><T>Overview</T></option>
            <option value="detailed"><T>Detailed Analysis</T></option>
            <option value="agricultural"><T>Agricultural Focus</T></option>
            <option value="climate"><T>Climate Patterns</T></option>
          </select>
        </div>
      </div>

      {/* Forecast Summary Card */}
      <div className="mb-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {forecastData.period.label} <T>Forecast</T>
              </h2>
              <p className="text-slate-600 text-sm mt-0.5">{forecastData.region} <T>Region</T></p>
              <p className="text-slate-500 text-xs mt-0.5">
                <T>{forecastData.startDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}</T>{" "}
                -{" "}
                <T>{new Date(
                  forecastData.startDate.getTime() + 13 * 24 * 60 * 60 * 1000
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}</T>
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold">
            {getConfidenceIcon(forecastData.confidence)}
            <span>{forecastData.confidence}% <T>Confidence</T></span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temperature Forecast */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="text-lg font-medium text-slate-900">
                    <T>Temperature</T>
                  </h3>
                </div>
                {getTrendIcon(forecastData.temperature.trend)}
              </div>

              <div className="mb-3">
                <AnomalyBar
                  value={forecastData.temperature.anomaly}
                  max={2}
                  unit="°C"
                  positiveColor="#ef4444"
                  negativeColor="#0ea5e9"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600"><T>Trend:</T></span>
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
                  <span className="text-sm text-gray-600"><T>Anomaly:</T></span>
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
                  <span className="text-sm text-gray-600"><T>Confidence:</T></span>
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <CloudRain className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-medium text-slate-900">
                    <T>Rainfall</T>
                  </h3>
                </div>
                {getTrendIcon(forecastData.rainfall.trend)}
              </div>

              <div className="mb-3">
                <AnomalyBar
                  value={forecastData.rainfall.anomaly}
                  max={30}
                  unit="%"
                  positiveColor="#0ea5e9"
                  negativeColor="#f59e0b"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600"><T>Trend:</T></span>
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
                  <span className="text-sm text-gray-600"><T>Anomaly:</T></span>
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
                  <span className="text-sm text-gray-600"><T>Confidence:</T></span>
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
      <div className="mb-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
            <Wind className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              <T>Influencing Climate Patterns</T>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <T>Large-scale climate phenomena affecting the forecast</T>
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forecastData.climatePhenomena.map((phenomenon, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-xl p-4 bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-900">
                    {phenomenon.name}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      phenomenon.impact === "High"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : phenomenon.impact === "Moderate"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {phenomenon.impact}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  {phenomenon.description}
                </p>
                <div className="flex items-center">
                  <span className="text-xs text-slate-500"><T>Status:</T></span>
                  <span
                    className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      phenomenon.status === "strengthening" ||
                      phenomenon.status === "warming" ||
                      phenomenon.status === "active"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : phenomenon.status === "weakening" ||
                          phenomenon.status === "cooling" ||
                          phenomenon.status === "weak"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
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
      <div className="mb-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              <T>Agricultural Impacts & Recommendations</T>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <T>Crop-specific implications of the</T>{" "}
              {forecastData.period.label.toLowerCase()} <T>forecast</T>
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {forecastData.agriculturalImpacts.map((impact, index) => (
              <details
                key={index}
                className="group border border-slate-200 rounded-xl bg-white open:shadow-sm open:border-emerald-300 transition-all"
              >
                <summary className="p-4 cursor-pointer list-none">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-semibold text-slate-900">
                          {impact.crop}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                              impact.impact === "High"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : impact.impact === "Moderate to High"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : impact.impact === "Moderate"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : impact.impact === "Low to Moderate"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {impact.impact} Impact
                          </span>
                          <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" />
                        </div>
                      </div>
                      <div className="mt-2">
                        {(() => {
                          const sev = impact.impact;
                          const pct =
                            sev === "High"
                              ? 100
                              : sev === "Moderate to High"
                              ? 80
                              : sev === "Moderate"
                              ? 60
                              : sev === "Low to Moderate"
                              ? 40
                              : 25;
                          const color =
                            pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : "bg-emerald-500";
                          return (
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full ${color} rounded-full`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-sm text-slate-600 mt-2">
                        {impact.description}
                      </p>
                    </div>
                  </div>
                </summary>
                <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 mb-1">
                        <T>Recommended Actions:</T>
                      </h5>
                      <p className="text-sm text-slate-600">
                        {impact.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Confidence & Uncertainty Information */}
      <div className="mb-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <button
            onClick={() => setShowConfidenceLevel(!showConfidenceLevel)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
                <Target className="h-5 w-5" />
              </span>
              <h3 className="text-xl font-semibold text-slate-900">
                <T>Forecast Confidence & Limitations</T>
              </h3>
            </div>
            {showConfidenceLevel ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Confidence Donut Trio (always visible) */}
        <div className="px-6 py-6 border-b border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ConfidenceDonut value={forecastData.confidence} label="Overall" color="#10b981" />
            <ConfidenceDonut
              value={forecastData.temperature.confidence}
              label="Temperature"
              color="#0ea5e9"
            />
            <ConfidenceDonut
              value={forecastData.rainfall.confidence}
              label="Rainfall"
              color="#14b8a6"
            />
          </div>
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
      <div className="mb-8 flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
        <button className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:border-emerald-600 hover:text-emerald-700 transition-colors">
          <Download className="h-4 w-4" />
          <T>Download Forecast</T>
        </button>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:border-emerald-600 hover:text-emerald-700 transition-colors">
          <Share2 className="h-4 w-4" />
          <T>Share Forecast</T>
        </button>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
          <Calendar className="h-4 w-4" />
          <T>Subscribe to Updates</T>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500">
        <p className="mb-1">
          <T>Subseasonal forecasts are generated using ensemble climate models and historical climate patterns</T>
        </p>
        <p className="mb-1">
          <T>Data sources: ECMWF, NCEP, and regional climate models</T>
        </p>
        <p>
          <T>Last updated:</T>{" "}
          <T>{new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}</T>
        </p>
      </div>
      </div>
      </div>
    </>
  );
};

export default SubseasonalForecast;
