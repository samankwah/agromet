import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  useMap,
  Polygon,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import ghanaRegionsData from "../assets/ghana-regions.json";
import {
  Cloud,
  CloudRain,
  Sun,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Gauge,
  MapPin,
} from "lucide-react";

// Ambee Weather API configuration
const AMBEE_API_KEY =
  import.meta.env.VITE_AMBEE_API_KEY || import.meta.env.VITE_BASE_AMBEE_API_KEY;
const AMBEE_BASE_URL = "/api/ambee";

// Ambee Weather API service
const ambeeWeatherService = {
  async getWeatherByCoordinates(lat, lng) {
    // Check if API key is available and not the placeholder
    if (!AMBEE_API_KEY || AMBEE_API_KEY === "your-ambee-api-key-here") {
      console.info("Ambee API key not configured, using mock weather data");
      return this.getMockWeatherData(lat, lng);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `${AMBEE_BASE_URL}/weather/latest/by-lat-lng?lat=${lat}&lng=${lng}`,
        {
          headers: {
            "Content-type": "application/json",
            "x-api-key": AMBEE_API_KEY,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.data) {
        return this.formatWeatherData(data.data);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.warn("Ambee API unavailable, using mock data:", error.message);
      return this.getMockWeatherData(lat, lng);
    }
  },

  formatWeatherData(data) {
    // Convert Fahrenheit to Celsius
    const tempCelsius = Math.round(((data.temperature - 32) * 5) / 9);

    return {
      temperature: `${tempCelsius}°C`,
      condition: this.getWeatherCondition(data.summary),
      summary: data.summary || "No detailed forecast available",
      humidity: `${data.humidity}%`,
      windSpeed: `${Math.round(data.windSpeed * 3.6)} km/h`, // Convert m/s to km/h
      rainfall: `${(
        data.precipIntensity ||
        data.precipitationIntensity ||
        0
      ).toFixed(1)}mm`,
      visibility: `${Math.round(data.visibility || 10)}km`, // Already in km
      pressure: `${Math.round(data.pressure)} hPa`,
      icon: this.getWeatherIcon(data.summary),
    };
  },

  getWeatherCondition(summary) {
    const summaryLower = (summary || "").toLowerCase();
    if (summaryLower.includes("rain") || summaryLower.includes("shower"))
      return "Rainy";
    if (summaryLower.includes("cloud")) return "Cloudy";
    if (summaryLower.includes("clear") || summaryLower.includes("sunny"))
      return "Sunny";
    if (summaryLower.includes("storm")) return "Stormy";
    if (summaryLower.includes("fog") || summaryLower.includes("mist"))
      return "Foggy";
    return "Partly Cloudy";
  },

  getWeatherIcon(summary) {
    const summaryLower = (summary || "").toLowerCase();
    if (summaryLower.includes("rain") || summaryLower.includes("shower"))
      return CloudRain;
    if (summaryLower.includes("cloud")) return Cloud;
    if (summaryLower.includes("clear") || summaryLower.includes("sunny"))
      return Sun;
    return Cloud;
  },

  getMockWeatherData(lat, lng) {
    // Fallback mock data when API is unavailable
    // Generate realistic temperature based on latitude and time of day
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour < 6 || hour > 18;

    // Base temperature varies by latitude (northern regions are hotter)
    const baseTemp = lat > 9 ? 30 : lat > 7 ? 28 : 26;
    const tempVariation = isNight ? -3 : 2; // Cooler at night
    const finalTemp = baseTemp + tempVariation + Math.random() * 4;

    const humidity = 60 + Math.random() * 30;

    // Time-based weather conditions - more realistic for Ghana
    const timeBasedConditions = isNight
      ? ["Clear", "Partly Cloudy", "Cloudy"]
      : ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"];

    const condition =
      timeBasedConditions[
        Math.floor(Math.random() * timeBasedConditions.length)
      ];
    const icons = {
      Sunny: Sun,
      Clear: Sun,
      "Partly Cloudy": Cloud,
      Cloudy: Cloud,
      "Light Rain": CloudRain,
    };

    // Generate realistic weather summaries
    const summaries = {
      Sunny: "Clear skies with bright sunshine throughout the day",
      Clear: "Clear night skies with good visibility",
      "Partly Cloudy": "Mix of sun and clouds with occasional shade",
      Cloudy: "Overcast skies with thick cloud cover",
      "Light Rain": "Light rainfall with cloudy conditions",
    };

    return {
      temperature: `${Math.round(finalTemp)}°C`,
      condition: condition,
      summary:
        summaries[condition] || "Typical West African weather conditions",
      humidity: `${Math.round(humidity)}%`,
      windSpeed: `${Math.round(5 + Math.random() * 20)} km/h`,
      rainfall:
        condition === "Light Rain"
          ? `${(2 + Math.random() * 8).toFixed(1)}mm`
          : `${(Math.random() * 2).toFixed(1)}mm`,
      visibility: `${Math.round(8 + Math.random() * 12)}km`,
      pressure: `${Math.round(1010 + Math.random() * 20)} hPa`,
      icon: icons[condition] || Cloud,
    };
  },
};

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Ghana regions with weather-style data
const GHANA_REGIONS = {
  "Greater Accra": {
    center: [5.6037, -0.187],
    zoom: 10,
    color: "#3B82F6",
    weatherColor: "rgba(59, 130, 246, 0.3)",
    population: "5.4M",
    agroZone: "Coastal Plains",
    majorCrops: ["Maize", "Vegetables", "Cassava", "Coconut"],
    description:
      "Urban agricultural zone with focus on market gardening and urban farming",
    weather: {
      temperature: "27°C",
      condition: "Partly Cloudy",
      summary: "Mix of sun and clouds with occasional coastal breeze",
      humidity: "78%",
      windSpeed: "15 km/h",
      rainfall: "2.5mm",
      visibility: "10km",
      pressure: "1013 hPa",
      icon: Cloud,
    },
  },
  Ashanti: {
    center: [6.7924, -1.618],
    zoom: 9,
    color: "#10B981",
    weatherColor: "rgba(16, 185, 129, 0.3)",
    population: "5.8M",
    agroZone: "Forest Zone",
    majorCrops: ["Cocoa", "Plantain", "Cassava", "Yam", "Maize"],
    description: "Rich forest soils ideal for tree crops and root vegetables",
    weather: {
      temperature: "25°C",
      condition: "Rainy",
      summary: "Steady rainfall with humid forest conditions",
      humidity: "85%",
      windSpeed: "12 km/h",
      rainfall: "8.2mm",
      visibility: "8km",
      pressure: "1011 hPa",
      icon: CloudRain,
    },
  },
  Western: {
    center: [5.5599, -2.6967],
    zoom: 9,
    color: "#8B5CF6",
    weatherColor: "rgba(139, 92, 246, 0.3)",
    population: "2.6M",
    agroZone: "Forest Zone",
    majorCrops: ["Cocoa", "Oil Palm", "Rubber", "Coconut", "Plantain"],
    description: "Major cocoa and oil palm production region",
    weather: {
      temperature: "26°C",
      condition: "Cloudy",
      humidity: "82%",
      windSpeed: "10 km/h",
      rainfall: "5.1mm",
      visibility: "9km",
      pressure: "1012 hPa",
      icon: Cloud,
    },
  },
  Central: {
    center: [5.4518, -1.3955],
    zoom: 10,
    color: "#06B6D4",
    weatherColor: "rgba(6, 182, 212, 0.3)",
    population: "2.9M",
    agroZone: "Forest Zone",
    majorCrops: ["Cassava", "Maize", "Plantain", "Vegetables"],
    description: "Coastal and forest zone agriculture with fishing communities",
    weather: {
      temperature: "28°C",
      condition: "Sunny",
      humidity: "75%",
      windSpeed: "18 km/h",
      rainfall: "1.2mm",
      visibility: "12km",
      pressure: "1014 hPa",
      icon: Sun,
    },
  },
  Eastern: {
    center: [6.2187, -0.7079],
    zoom: 9,
    color: "#F59E0B",
    weatherColor: "rgba(245, 158, 11, 0.3)",
    population: "2.9M",
    agroZone: "Forest Zone",
    majorCrops: ["Cocoa", "Coffee", "Yam", "Plantain", "Vegetables"],
    description: "Mountainous region with diverse crop production",
    weather: {
      temperature: "24°C",
      condition: "Light Rain",
      humidity: "88%",
      windSpeed: "8 km/h",
      rainfall: "4.5mm",
      visibility: "7km",
      pressure: "1010 hPa",
      icon: CloudRain,
    },
  },
  Volta: {
    center: [6.6014, 0.4197],
    zoom: 9,
    color: "#EC4899",
    weatherColor: "rgba(236, 72, 153, 0.3)",
    population: "2.1M",
    agroZone: "Forest Zone",
    majorCrops: ["Rice", "Maize", "Cassava", "Yam"],
    description: "River valley agriculture with significant rice production",
    weather: {
      temperature: "26°C",
      condition: "Partly Cloudy",
      humidity: "80%",
      windSpeed: "14 km/h",
      rainfall: "3.8mm",
      visibility: "11km",
      pressure: "1013 hPa",
      icon: Cloud,
    },
  },
  Northern: {
    center: [9.5084, -0.927],
    zoom: 8,
    color: "#EF4444",
    weatherColor: "rgba(239, 68, 68, 0.3)",
    population: "2.5M",
    agroZone: "Guinea Savannah",
    majorCrops: ["Maize", "Rice", "Yam", "Soybeans", "Groundnuts"],
    description: "Guinea savannah zone with cereals and legume production",
    weather: {
      temperature: "32°C",
      condition: "Hot & Sunny",
      summary: "Very hot and dry savannah conditions with clear skies",
      humidity: "65%",
      windSpeed: "20 km/h",
      rainfall: "0.1mm",
      visibility: "15km",
      pressure: "1015 hPa",
      icon: Sun,
    },
  },
  "Upper East": {
    center: [10.7889, -0.8667],
    zoom: 9,
    color: "#F97316",
    weatherColor: "rgba(249, 115, 22, 0.3)",
    population: "1.3M",
    agroZone: "Sudan Savannah",
    majorCrops: ["Millet", "Sorghum", "Groundnuts", "Cowpea"],
    description: "Drought-resistant crops in Sudan savannah conditions",
    weather: {
      temperature: "35°C",
      condition: "Very Hot",
      summary: "Extremely hot and dry with strong harmattan winds",
      humidity: "55%",
      windSpeed: "25 km/h",
      rainfall: "0.0mm",
      visibility: "20km",
      pressure: "1016 hPa",
      icon: Sun,
    },
  },
  "Upper West": {
    center: [10.328, -2.3174],
    zoom: 9,
    color: "#84CC16",
    weatherColor: "rgba(132, 204, 22, 0.3)",
    population: "0.9M",
    agroZone: "Sudan Savannah",
    majorCrops: ["Millet", "Sorghum", "Groundnuts", "Cowpea"],
    description: "Semi-arid agriculture with traditional farming systems",
    weather: {
      temperature: "34°C",
      condition: "Hot & Dry",
      humidity: "50%",
      windSpeed: "22 km/h",
      rainfall: "0.0mm",
      visibility: "18km",
      pressure: "1017 hPa",
      icon: Sun,
    },
  },
  "Brong-Ahafo": {
    center: [7.7139, -1.6225],
    zoom: 8,
    color: "#6366F1",
    weatherColor: "rgba(99, 102, 241, 0.3)",
    population: "2.3M",
    agroZone: "Forest-Savannah Transition",
    majorCrops: ["Yam", "Maize", "Cassava", "Plantain"],
    description: "Transition zone agriculture with diverse crop systems",
    weather: {
      temperature: "28°C",
      condition: "Partly Cloudy",
      humidity: "72%",
      windSpeed: "16 km/h",
      rainfall: "2.1mm",
      visibility: "13km",
      pressure: "1014 hPa",
      icon: Cloud,
    },
  },
  "Western North": {
    center: [6.2094, -2.9907],
    zoom: 9,
    color: "#14B8A6",
    weatherColor: "rgba(20, 184, 166, 0.3)",
    population: "0.7M",
    agroZone: "Forest Zone",
    majorCrops: ["Cocoa", "Coffee", "Plantain", "Cassava"],
    description: "Newly created region with focus on tree crop production",
    weather: {
      temperature: "25°C",
      condition: "Light Showers",
      humidity: "87%",
      windSpeed: "9 km/h",
      rainfall: "6.3mm",
      visibility: "6km",
      pressure: "1009 hPa",
      icon: CloudRain,
    },
  },
  Ahafo: {
    center: [6.8756, -2.328],
    zoom: 9,
    color: "#F59E0B",
    weatherColor: "rgba(245, 158, 11, 0.3)",
    population: "0.5M",
    agroZone: "Forest Zone",
    majorCrops: ["Cocoa", "Plantain", "Cassava", "Maize"],
    description: "Forest zone with intensive cocoa cultivation",
    weather: {
      temperature: "26°C",
      condition: "Overcast",
      humidity: "83%",
      windSpeed: "11 km/h",
      rainfall: "3.2mm",
      visibility: "9km",
      pressure: "1011 hPa",
      icon: Cloud,
    },
  },
  Bono: {
    center: [7.8169, -2.4937],
    zoom: 9,
    color: "#8B5CF6",
    weatherColor: "rgba(139, 92, 246, 0.3)",
    population: "0.8M",
    agroZone: "Forest-Savannah Transition",
    majorCrops: ["Yam", "Maize", "Cassava", "Soybeans"],
    description: "Major yam production area in transition zone",
    weather: {
      temperature: "29°C",
      condition: "Partly Sunny",
      humidity: "70%",
      windSpeed: "17 km/h",
      rainfall: "1.8mm",
      visibility: "14km",
      pressure: "1015 hPa",
      icon: Sun,
    },
  },
  "Bono East": {
    center: [7.757, -0.9319],
    zoom: 9,
    color: "#059669",
    weatherColor: "rgba(5, 150, 105, 0.3)",
    population: "1.2M",
    agroZone: "Forest-Savannah Transition",
    majorCrops: ["Yam", "Maize", "Rice", "Plantain"],
    description: "Diverse agriculture in forest-savannah transition",
    weather: {
      temperature: "30°C",
      condition: "Clear",
      humidity: "68%",
      windSpeed: "19 km/h",
      rainfall: "0.5mm",
      visibility: "16km",
      pressure: "1016 hPa",
      icon: Sun,
    },
  },
  Oti: {
    center: [8.1378, 0.4707],
    zoom: 9,
    color: "#0EA5E9",
    weatherColor: "rgba(14, 165, 233, 0.3)",
    population: "1.1M",
    agroZone: "Guinea Savannah",
    majorCrops: ["Rice", "Yam", "Maize", "Soybeans"],
    description: "River basin agriculture with rice cultivation focus",
    weather: {
      temperature: "31°C",
      condition: "Warm & Sunny",
      humidity: "62%",
      windSpeed: "21 km/h",
      rainfall: "0.8mm",
      visibility: "17km",
      pressure: "1015 hPa",
      icon: Sun,
    },
  },
  "North East": {
    center: [10.4734, -0.3729],
    zoom: 9,
    color: "#DC2626",
    weatherColor: "rgba(220, 38, 38, 0.3)",
    population: "0.6M",
    agroZone: "Sudan Savannah",
    majorCrops: ["Millet", "Sorghum", "Rice", "Groundnuts"],
    description: "Northern savannah agriculture with drought adaptation",
    weather: {
      temperature: "36°C",
      condition: "Very Hot & Dry",
      humidity: "45%",
      windSpeed: "28 km/h",
      rainfall: "0.0mm",
      visibility: "25km",
      pressure: "1018 hPa",
      icon: Sun,
    },
  },
  Savannah: {
    center: [8.7642, -1.8094],
    zoom: 8,
    color: "#7C2D12",
    weatherColor: "rgba(124, 45, 18, 0.3)",
    population: "0.7M",
    agroZone: "Guinea Savannah",
    majorCrops: ["Yam", "Maize", "Rice", "Soybeans"],
    description: "Guinea savannah with mixed farming systems",
    weather: {
      temperature: "33°C",
      condition: "Hot",
      humidity: "58%",
      windSpeed: "24 km/h",
      rainfall: "0.2mm",
      visibility: "19km",
      pressure: "1016 hPa",
      icon: Sun,
    },
  },
};

// West Africa countries data for extended coverage
const WEST_AFRICA_COUNTRIES = {
  Senegal: { center: [14.4974, -14.4524], color: "#059669" },
  Gambia: { center: [13.4432, -15.3101], color: "#0EA5E9" },
  "Guinea-Bissau": { center: [11.8037, -15.1804], color: "#8B5CF6" },
  Guinea: { center: [9.9456, -9.6966], color: "#EC4899" },
  "Sierra Leone": { center: [8.460555, -11.779889], color: "#F59E0B" },
  Liberia: { center: [6.4281, -9.4295], color: "#84CC16" },
  Mali: { center: [17.5707, -3.9962], color: "#EF4444" },
  "Burkina Faso": { center: [12.2383, -1.5616], color: "#6366F1" },
  Niger: { center: [17.6078, 8.0817], color: "#F97316" },
  Nigeria: { center: [9.082, 8.6753], color: "#10B981" },
  Benin: { center: [9.3077, 2.3158], color: "#3B82F6" },
  Togo: { center: [8.6195, 0.8248], color: "#8B5CF6" },
  "Ivory Coast": { center: [7.54, -5.5471], color: "#06B6D4" },
  Mauritania: { center: [21.0079, -10.9408], color: "#DC2626" },
};

// Weather overlay polygons for West Africa region
// const WEATHER_OVERLAYS = [
//   {
//     id: "sahel-zone",
//     coordinates: [
//       [12.0, -17.0],
//       [12.0, 15.0],
//       [18.0, 15.0],
//       [18.0, -17.0],
//     ],
//     color: "rgba(239, 68, 68, 0.15)",
//     label: "Sahel Zone",
//   },
//   {
//     id: "sudan-savannah",
//     coordinates: [
//       [8.0, -17.0],
//       [8.0, 15.0],
//       [12.0, 15.0],
//       [12.0, -17.0],
//     ],
//     color: "rgba(245, 158, 11, 0.15)",
//     label: "Sudan Savannah",
//   },
//   {
//     id: "guinea-savannah",
//     coordinates: [
//       [6.0, -17.0],
//       [6.0, 15.0],
//       [8.0, 15.0],
//       [8.0, -17.0],
//     ],
//     color: "rgba(132, 204, 22, 0.15)",
//     label: "Guinea Savannah",
//   },
//   {
//     id: "forest-zone",
//     coordinates: [
//       [4.0, -17.0],
//       [4.0, 15.0],
//       [6.0, 15.0],
//       [6.0, -17.0],
//     ],
//     color: "rgba(16, 185, 129, 0.15)",
//     label: "Forest Zone",
//   },
//   {
//     id: "coastal-zone",
//     coordinates: [
//       [3.0, -17.0],
//       [3.0, 15.0],
//       [4.0, 15.0],
//       [4.0, -17.0],
//     ],
//     color: "rgba(59, 130, 246, 0.15)",
//     label: "Coastal Zone",
//   },
// ];

// Map control component for zooming to regions
const MapController = ({ selectedRegion, onRegionSelect, isMobile }) => {
  const map = useMap();

  useEffect(() => {
    // Only auto-zoom on desktop devices
    if (!isMobile && selectedRegion && GHANA_REGIONS[selectedRegion]) {
      const region = GHANA_REGIONS[selectedRegion];
      map.setView(region.center, region.zoom);
    }
  }, [selectedRegion, map, isMobile]);

  return null;
};

MapController.propTypes = {
  selectedRegion: PropTypes.string,
  onRegionSelect: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

// Weather info panel component - IMD Style with minimal design
const WeatherInfoPanel = ({
  selectedRegion,
  selectedDistrict,
  onClose,
  realTimeWeather,
}) => {
  if (!selectedRegion && !selectedDistrict) return null;

  const regionData = selectedRegion ? GHANA_REGIONS[selectedRegion] : null;
  const weatherKey = selectedDistrict ? selectedDistrict.name : selectedRegion;
  const weather = realTimeWeather[weatherKey] || regionData?.weather;
  const IconComponent = weather?.icon;

  return (
    <div className="weather-info-panel absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 sm:p-4 z-[1000] w-[280px] max-w-[calc(100vw-1rem)] sm:max-w-[380px] md:w-96 text-gray-800 backdrop-blur-sm bg-white/95 max-h-[70vh] overflow-y-auto">
      {/* Header - Mobile Optimized */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
            <span className="truncate text-xs sm:text-sm">
              {selectedDistrict ? selectedDistrict.name : selectedRegion}
            </span>
          </h3>
          <p className="text-gray-500 text-xs">
            {new Date().toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg sm:text-xl p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-1"
          aria-label="Close weather panel"
        >
          ×
        </button>
      </div>

      {/* Current Weather - IMD Style */}
      {weather && (
        <div className="space-y-1 sm:space-y-3">
          {/* Main Temperature Display - Mobile Optimized */}
          <div className="text-center py-1 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-1 sm:mb-2">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
              {IconComponent && (
                <IconComponent className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              )}
              <span className="text-lg sm:text-2xl font-bold text-gray-900">
                {weather.temperature}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-700 truncate px-1">
              {weather.condition}
            </p>
          </div>

          {/* Weather Summary - More Compact on Mobile */}
          {weather.summary && (
            <div className="mt-1 sm:mt-2 p-1.5 sm:p-2 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-xs text-gray-700 leading-tight sm:leading-relaxed text-center">
                <span className="font-medium text-blue-800">Forecast:</span>{" "}
                {weather.summary}
              </p>
            </div>
          )}

          {/* Weather Data Grid - Ultra Compact for Mobile */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs">
            <div className="bg-blue-50 rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Droplets className="w-3 h-3 text-blue-600" />
              </div>
              <p className="text-gray-600 text-xs leading-tight">Humidity</p>
              <p className="font-semibold text-gray-900 text-xs">
                {weather.humidity}
              </p>
            </div>
            <div className="bg-green-50 rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Wind className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-gray-600 text-xs leading-tight">Wind</p>
              <p className="font-semibold text-gray-900 text-xs">
                {weather.windSpeed}
              </p>
            </div>
            <div className="bg-cyan-50 rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <CloudRain className="w-3 h-3 text-cyan-600" />
              </div>
              <p className="text-gray-600 text-xs leading-tight">Rain</p>
              <p className="font-semibold text-gray-900 text-xs">
                {weather.rainfall}
              </p>
            </div>
            <div className="bg-purple-50 rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Eye className="w-3 h-3 text-purple-600" />
              </div>
              <p className="text-gray-600 text-xs leading-tight">Visibility</p>
              <p className="font-semibold text-gray-900 text-xs">
                {weather.visibility}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Info - Ultra Compact */}
      {regionData && (
        <div className="mt-1 pt-1 border-t border-gray-200">
          <div className="bg-gray-50 rounded-md p-1">
            <p className="text-xs text-gray-600 text-center truncate leading-tight">
              <span className="font-medium text-gray-800">Zone:</span>{" "}
              {regionData.agroZone}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

WeatherInfoPanel.propTypes = {
  selectedRegion: PropTypes.string,
  selectedDistrict: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  realTimeWeather: PropTypes.object.isRequired,
};

// Main Weather Interactive Map Component
const WeatherInteractiveMap = ({
  onRegionSelect,
  onDistrictSelect,
  initialRegion = null,
}) => {
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);
  // const [showWeatherOverlays] = useState(true);
  const [mapCenter] = useState([7.9465, -1.0232]); // Center of West Africa
  const [mapZoom] = useState(() => {
    // Safe window access for SSR compatibility
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      return isMobile ? 6 : 7;
    }
    return 7; // Default zoom for server-side rendering
  });

  // Check if device is mobile for zoom controls
  const [isMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [realTimeWeather, setRealTimeWeather] = useState({});

  // Load weather data for all Ghana regions on component mount
  useEffect(() => {
    const loadAllRegionsWeather = async () => {
      setLoadingWeather(true);
      const weatherPromises = Object.entries(GHANA_REGIONS).map(
        async ([regionName, regionData]) => {
          try {
            const weatherData =
              await ambeeWeatherService.getWeatherByCoordinates(
                regionData.center[0],
                regionData.center[1]
              );
            return { regionName, weatherData };
          } catch (error) {
            console.warn(
              `Failed to fetch weather for ${regionName}:`,
              error.message
            );
            return { regionName, weatherData: regionData.weather }; // Fallback to static data
          }
        }
      );

      try {
        const results = await Promise.allSettled(weatherPromises);
        const weatherDataMap = {};

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            const { regionName, weatherData } = result.value;
            weatherDataMap[regionName] = weatherData;
          }
        });

        setRealTimeWeather(weatherDataMap);
        console.log(
          "✅ Loaded weather data for",
          Object.keys(weatherDataMap).length,
          "regions"
        );
      } catch (error) {
        console.error("Error loading regional weather data:", error);
      } finally {
        setLoadingWeather(false);
      }
    };

    loadAllRegionsWeather();
  }, []);

  // Load districts data
  useEffect(() => {
    try {
      const districtData = ghanaRegionsData.features.map((feature) => ({
        name: feature.properties.name,
        region: feature.properties.region,
        coordinates: feature.geometry.coordinates,
        radius: feature.properties.radius || 3000,
      }));
      setDistricts(districtData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading districts data:", error);
      setLoading(false);
    }
  }, []);

  // Note: districtsByRegion removed as it was unused

  const handleRegionClick = async (regionName) => {
    setSelectedRegion(regionName);
    setSelectedDistrict(null);

    // Prevent map zooming on mobile when region is clicked
    if (isMobile) {
      return; // Exit early to prevent map view changes
    }

    // Fetch real-time weather data for the region
    const regionData = GHANA_REGIONS[regionName];
    if (regionData && !realTimeWeather[regionName]) {
      try {
        const weatherData = await ambeeWeatherService.getWeatherByCoordinates(
          regionData.center[0],
          regionData.center[1]
        );

        // Ensure component is still mounted before updating state
        setRealTimeWeather((prev) => ({
          ...prev,
          [regionName]: weatherData,
        }));
      } catch (error) {
        console.warn(
          "Failed to fetch weather data for",
          regionName,
          ":",
          error.message
        );
        // Use fallback weather data from static data
        if (regionData.weather) {
          setRealTimeWeather((prev) => ({
            ...prev,
            [regionName]: regionData.weather,
          }));
        }
      }
    }

    if (onRegionSelect) {
      onRegionSelect(regionName, GHANA_REGIONS[regionName]);
    }

    // Only update map view on desktop
    if (!isMobile && GHANA_REGIONS[regionName]) {
      // Auto-zoom functionality for desktop only
      const region = GHANA_REGIONS[regionName];
      // Note: MapController will handle the actual zoom
    }
  };

  const handleDistrictClick = async (district) => {
    setSelectedDistrict(district);
    setSelectedRegion(district.region);

    // Fetch real-time weather data for the district
    if (!realTimeWeather[district.name]) {
      try {
        const weatherData = await ambeeWeatherService.getWeatherByCoordinates(
          district.coordinates[1],
          district.coordinates[0]
        );

        // Ensure component is still mounted before updating state
        setRealTimeWeather((prev) => ({
          ...prev,
          [district.name]: weatherData,
        }));
      } catch (error) {
        console.warn(
          "Failed to fetch weather data for",
          district.name,
          ":",
          error.message
        );
        // Use fallback weather data from region
        const regionData = GHANA_REGIONS[district.region];
        if (regionData && regionData.weather) {
          setRealTimeWeather((prev) => ({
            ...prev,
            [district.name]: regionData.weather,
          }));
        }
      }
    }

    if (onDistrictSelect) {
      onDistrictSelect(district);
    }
  };

  const handleMapClick = (e) => {
    // Close info panel when clicking anywhere on the map
    closeInfoPanel();
  };

  // Add effect to close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close popup when clicking anywhere outside the weather panel
      if (selectedRegion || selectedDistrict) {
        const weatherPanel = event.target.closest(".weather-info-panel");
        if (!weatherPanel) {
          closeInfoPanel();
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [selectedRegion, selectedDistrict]);

  const closeInfoPanel = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
  };

  if (loading) {
    return (
      <div className="w-full h-[50vh] min-h-[300px] sm:h-[60vh] md:h-[500px] lg:h-[600px] max-h-[80vh] flex items-center justify-center bg-white border border-gray-200 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            Loading Ghana weather map...
          </p>
          {loadingWeather && (
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              Fetching live weather data...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden shadow-lg bg-white border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-[50vh] min-h-[300px] sm:h-[60vh] md:h-[70vh] lg:h-[75vh] xl:h-[80vh] w-full rounded-lg z-0"
        scrollWheelZoom={false}
        attributionControl={false}
        onClick={handleMapClick}
        zoomControl={!isMobile}
        doubleClickZoom={!isMobile}
        touchZoom={false}
        dragging={!isMobile}
        boxZoom={false}
        keyboard={false}
      >
        {/* Clean light tile layer for IMD style */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapController
          selectedRegion={selectedRegion}
          onRegionSelect={handleRegionClick}
          isMobile={isMobile}
        />

        {/* Weather overlays */}
        {/* {showWeatherOverlays &&
          WEATHER_OVERLAYS.map((overlay) => (
            <Polygon
              key={overlay.id}
              positions={overlay.coordinates}
              pathOptions={{
                fillColor: overlay.color,
                color: overlay.color,
                weight: 1,
                opacity: 0.6,
                fillOpacity: 0.3,
              }}
            />
          ))} */}

        {/* Render district markers - IMD style */}
        {districts.map((district, index) => {
          const regionInfo = GHANA_REGIONS[district.region];
          const isSelected = selectedDistrict?.name === district.name;
          const isRegionSelected = selectedRegion === district.region;

          return (
            <CircleMarker
              key={index}
              center={[district.coordinates[1], district.coordinates[0]]}
              radius={isSelected ? 10 : isRegionSelected ? 7 : 5}
              fillColor={regionInfo?.color || "#2563EB"}
              color="#ffffff"
              weight={isSelected ? 1 : 1}
              opacity={1}
              fillOpacity={isSelected ? 1 : isRegionSelected ? 0.8 : 0.6}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  handleDistrictClick(district);
                },
                mouseover: (e) => {
                  e.target.setStyle({
                    radius: 8,
                    fillOpacity: 1,
                    weight: 2,
                  });
                },
                mouseout: (e) => {
                  e.target.setStyle({
                    radius: isSelected ? 10 : isRegionSelected ? 7 : 5,
                    fillOpacity: isSelected ? 1 : isRegionSelected ? 0.8 : 0.6,
                    weight: isSelected ? 2 : 1,
                  });
                },
              }}
            ></CircleMarker>
          );
        })}

        {/* Ghana regional center markers - IMD style */}
        {Object.entries(GHANA_REGIONS).map(([regionName, regionData]) => {
          return (
            <Marker
              key={regionName}
              position={regionData.center}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  handleRegionClick(regionName);
                },
              }}
              icon={L.divIcon({
                html: `
                  <div class="flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-400 rounded-full shadow-lg">
                    <div class="w-4 h-4 text-gray-700 text-sm">
                      📍
                    </div>
                  </div>
                `,
                className: "imd-marker",
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })}
            ></Marker>
          );
        })}

        {/* West African country markers */}
        {Object.entries(WEST_AFRICA_COUNTRIES).map(
          ([countryName, countryData]) => {
            return (
              <Marker
                key={countryName}
                position={countryData.center}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    console.log(
                      `${countryName} clicked - weather data coming soon`
                    );
                  },
                }}
                icon={L.divIcon({
                  html: `
                  <div class="flex items-center justify-center w-6 h-6 bg-white border border-gray-300 rounded-full shadow-md">
                    <div class="w-3 h-3" style="background-color: ${countryData.color}; border-radius: 50%;"></div>
                  </div>
                `,
                  className: "imd-marker west-africa-marker",
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              ></Marker>
            );
          }
        )}
      </MapContainer>

      {/* Weather Info Panel - IMD Style */}
      <WeatherInfoPanel
        selectedRegion={selectedRegion}
        selectedDistrict={selectedDistrict}
        onClose={closeInfoPanel}
        realTimeWeather={realTimeWeather}
      />
    </div>
  );
};

WeatherInteractiveMap.propTypes = {
  onRegionSelect: PropTypes.func,
  onDistrictSelect: PropTypes.func,
  initialRegion: PropTypes.string,
};

export default WeatherInteractiveMap;
