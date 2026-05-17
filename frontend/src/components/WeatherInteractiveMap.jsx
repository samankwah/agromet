import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Polygon,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import ghanaRegionsData from "../assets/ghana-regions.json";
import {
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Eye,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { getCurrentWeatherByCoordinates } from "../services/openMeteoService";
import T from "./common/T";
import useT from "../hooks/useT";
import { SkeletonBlock } from "./common/SkeletonLoading";

const getWeatherIcon = (iconKey) => {
  if (iconKey === "rain" || iconKey === "drizzle" || iconKey === "thunderstorm") {
    return CloudRain;
  }
  if (iconKey === "clear") return Sun;
  return Cloud;
};

const formatUpdatedStamp = (timestamp) =>
  new Date(timestamp).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const getSixHourlyUpdatedDate = (date = new Date()) => {
  const updatedAt = new Date(date);
  updatedAt.setMinutes(0, 0, 0);
  updatedAt.setHours(Math.floor(updatedAt.getHours() / 6) * 6);
  return updatedAt;
};

const openMeteoWeatherService = {
  async getWeatherByCoordinates(lat, lng) {
    const weather = await getCurrentWeatherByCoordinates(lat, lng, {
      timeoutMs: 5000,
    });

    return {
      weather: {
        ...weather,
        icon: getWeatherIcon(weather.iconKey),
      },
      source: "live",
    };
  },

};

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

const normalizeDistrictName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/\bkassena\b/g, "kasena")
    .replace(
      /\b(municipal|municipality|metropolitan|metropolis|district|assembly)\b/g,
      ""
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const toLeafletPositions = (geometry) => {
  if (!geometry?.coordinates) return [];

  const convertRing = (ring) => ring.map(([lng, lat]) => [lat, lng]);

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(convertRing);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygon.map(convertRing));
  }

  return [];
};

const flattenCoordinates = (coordinates, result = []) => {
  if (!Array.isArray(coordinates)) return result;

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    result.push(coordinates);
    return result;
  }

  coordinates.forEach((item) => flattenCoordinates(item, result));
  return result;
};

const getGeometryCenter = (geometry) => {
  const points = flattenCoordinates(geometry?.coordinates);

  if (points.length === 0) return null;

  const bounds = points.reduce(
    (acc, [lng, lat]) => ({
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
    }),
    {
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
    }
  );

  return [
    (bounds.minLng + bounds.maxLng) / 2,
    (bounds.minLat + bounds.maxLat) / 2,
  ];
};

const getNearestDistrictMetadata = (center, districtMetadata) => {
  if (!center) return null;

  return districtMetadata.reduce((nearest, current) => {
    const lngDiff = center[0] - current.coordinates[0];
    const latDiff = center[1] - current.coordinates[1];
    const distance = lngDiff * lngDiff + latDiff * latDiff;

    if (!nearest || distance < nearest.distance) {
      return { ...current, distance };
    }

    return nearest;
  }, null);
};

const buildDistrictMetadata = () => {
  const metadata = ghanaRegionsData.features.map((feature) => ({
    name: feature.properties.name,
    region: feature.properties.region,
    coordinates: feature.geometry.coordinates,
  }));

  return {
    metadata,
    byName: new Map(
      metadata.map((district) => [normalizeDistrictName(district.name), district])
    ),
  };
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
const MapController = ({ selectedRegion, isMobile, shouldZoomToRegion }) => {
  const map = useMap();

  useEffect(() => {
    // Only auto-zoom on desktop devices
    if (
      shouldZoomToRegion &&
      !isMobile &&
      selectedRegion &&
      GHANA_REGIONS[selectedRegion]
    ) {
      const region = GHANA_REGIONS[selectedRegion];
      map.setView(region.center, region.zoom);
    }
  }, [selectedRegion, map, isMobile, shouldZoomToRegion]);

  return null;
};

MapController.propTypes = {
  selectedRegion: PropTypes.string,
  isMobile: PropTypes.bool.isRequired,
  shouldZoomToRegion: PropTypes.bool.isRequired,
};

// Custom Unified Zoom Control Component (includes zoom in, zoom out, and reset)
const UnifiedZoomControl = ({ initialCenter, isMobile }) => {
  const map = useMap();
  const { t } = useT();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleReset = () => {
    const zoomLevel = isMobile ? 6 : 7;
    map.setView(initialCenter, zoomLevel, {
      animate: true,
      duration: 0.5
    });
  };

  return (
    <div className="absolute top-[10px] left-[10px] z-[1000] flex flex-col shadow-md">
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        className="w-[30px] h-[30px] flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-t transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-bold leading-none"
        title={t("Zoom in")}
        aria-label={t("Zoom in")}
      >
        +
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        className="w-[30px] h-[30px] flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-l border-r border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-bold leading-none"
        title={t("Zoom out")}
        aria-label={t("Zoom out")}
        style={{ borderTop: 'none' }}
      >
        −
      </button>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-[30px] h-[30px] flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-b transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        title={t("Reset map view")}
        aria-label={t("Reset map to default zoom and position")}
        style={{ borderTop: 'none' }}
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
};

UnifiedZoomControl.propTypes = {
  initialCenter: PropTypes.array.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

// Weather info panel component - IMD Style with minimal design
const WeatherInfoPanel = ({
  selectedRegion,
  selectedDistrict,
  onClose,
  realTimeWeather,
  updatedAt,
}) => {
  const { t } = useT();

  if (!selectedRegion && !selectedDistrict) return null;

  const regionData = selectedRegion ? GHANA_REGIONS[selectedRegion] : null;
  const weatherKey = selectedDistrict ? selectedDistrict.name : selectedRegion;
  const weather = realTimeWeather[weatherKey] || regionData?.weather;
  const IconComponent = weather?.icon;
  const displayUpdatedAt = updatedAt || weather?.updatedAt || new Date();

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
            <T>Updated</T> {formatUpdatedStamp(displayUpdatedAt)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg sm:text-xl p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-1"
          aria-label={t("Close weather panel")}
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
              <T>{weather.condition}</T>
            </p>
            {weather.apparentTemperature && (
              <p className="text-[11px] text-gray-500">
                <T>Feels like</T> {weather.apparentTemperature}
              </p>
            )}
          </div>

          {/* Weather Summary - More Compact on Mobile */}
          {(weather.conversationalSummary || weather.summary) && (
            <div className="mt-1 sm:mt-2 p-1.5 sm:p-2 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-xs text-gray-700 leading-tight sm:leading-relaxed text-center">
                <span className="font-medium text-blue-800">
                  <T>Forecast</T>:
                </span>{" "}
                <T>{weather.conversationalSummary || weather.summary}</T>
              </p>
            </div>
          )}

          {/* Weather Data Grid - Ultra Compact for Mobile */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs">
            <div className="bg-blue-50 rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Droplets className="w-3 h-3 text-blue-600" />
              </div>
              <p className="text-gray-600 text-xs leading-tight">
                <T>Humidity</T>
              </p>
              <p className="font-semibold text-gray-900 text-xs">
                {weather.humidity}
              </p>
            </div>
            <div className="bg-green-50 rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Wind className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-gray-600 text-xs leading-tight">
                <T>Wind</T>
              </p>
              <p className="font-semibold text-gray-900 text-xs">
                {weather.windSpeed}
              </p>
            </div>
            <div className="bg-cyan-50 rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <CloudRain className="w-3 h-3 text-cyan-600" />
              </div>
              <p className="text-gray-600 text-xs leading-tight">
                <T>Rain</T>
              </p>
              <p className="font-semibold text-gray-900 text-xs">
                {weather.rainfall}
              </p>
            </div>
            <div className="bg-purple-50 rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Eye className="w-3 h-3 text-purple-600" />
              </div>
              <p className="text-gray-600 text-xs leading-tight">
                <T>Visibility</T>
              </p>
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
              <span className="font-medium text-gray-800">
                <T>Zone</T>:
              </span>{" "}
              <T>{regionData.agroZone}</T>
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
  updatedAt: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
};

// Main Weather Interactive Map Component
const WeatherInteractiveMap = ({
  onRegionSelect,
  onDistrictSelect,
  initialRegion = null,
  updatedAt = getSixHourlyUpdatedDate(),
}) => {
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [realTimeWeather, setRealTimeWeather] = useState(() =>
    Object.fromEntries(
      Object.entries(GHANA_REGIONS).map(([regionName, regionData]) => [
        regionName,
        regionData.weather,
      ])
    )
  );

  // Load districts data
  useEffect(() => {
    let isMounted = true;

    const loadDistricts = async () => {
      try {
        const { default: ghanaDistrictBoundariesData } = await import(
          "../assets/ghana-district-boundaries.json"
        );
        const { metadata, byName } = buildDistrictMetadata();
        const districtData = ghanaDistrictBoundariesData.features
          .map((feature) => {
            const name = feature.properties.shapeName;
            const polygon = toLeafletPositions(feature.geometry);
            const center = getGeometryCenter(feature.geometry);
            const matchedDistrict =
              byName.get(normalizeDistrictName(name)) ||
              getNearestDistrictMetadata(center, metadata);

            if (polygon.length === 0 || !center) {
              return null;
            }

            return {
              id: feature.properties.shapeID || name,
              name,
              region: matchedDistrict?.region || "Ghana",
              coordinates: matchedDistrict?.coordinates || center,
              labelCoordinates: center,
              polygon,
            };
          })
          .filter(Boolean);

        if (isMounted) {
          setDistricts(districtData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading districts data:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDistricts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Note: districtsByRegion removed as it was unused

  const handleDistrictClick = async (district) => {
    setSelectedDistrict(district);
    setHoveredDistrict(district);
    setSelectedRegion(district.region);

    // Fetch real-time weather data for the district
    if (!realTimeWeather[district.name]) {
      try {
        const weatherData = await openMeteoWeatherService.getWeatherByCoordinates(
          district.coordinates[1],
          district.coordinates[0]
        );

        setRealTimeWeather((prev) => ({
          ...prev,
          [district.name]: weatherData.weather,
        }));
      } catch {
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

    if (onRegionSelect && GHANA_REGIONS[district.region]) {
      onRegionSelect(district.region, GHANA_REGIONS[district.region]);
    }
  };

  const handleMapClick = () => {
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
    setHoveredDistrict(null);
  };

  if (loading) {
    return (
      <div className="w-full h-[50vh] min-h-[300px] sm:h-[60vh] md:h-[500px] lg:h-[600px] max-h-[80vh] flex items-center justify-center bg-white border border-gray-200 rounded-lg">
        <div className="w-full max-w-md space-y-4 px-6">
          <SkeletonBlock className="mx-auto h-32 w-24" rounded="rounded-full" tone="blue" />
          <SkeletonBlock className="mx-auto h-4 w-48" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock key={`weather-map-${index}`} className="h-10" tone="blue" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tooltipDistrict = hoveredDistrict || selectedDistrict;
  const tooltipCoordinates = tooltipDistrict?.labelCoordinates;

  return (
    <div
      data-no-auto-translate="true"
      className="relative w-full rounded-lg overflow-hidden shadow-lg bg-white border border-gray-200"
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-[50vh] min-h-[300px] sm:h-[60vh] md:h-[70vh] lg:h-[75vh] xl:h-[80vh] w-full rounded-lg z-0"
        scrollWheelZoom={false}
        attributionControl={false}
        onClick={handleMapClick}
        zoomControl={false}
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
          isMobile={isMobile}
          shouldZoomToRegion={!selectedDistrict}
        />

        {/* Unified Zoom Control (Zoom In/Out + Reset) - Only show on non-mobile */}
        {!isMobile && (
          <UnifiedZoomControl
            initialCenter={mapCenter}
            isMobile={isMobile}
          />
        )}

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

        {/* Render selectable district areas */}
        {districts.map((district, index) => {
          const regionInfo = GHANA_REGIONS[district.region];
          const isSelected = selectedDistrict?.name === district.name;
          const isRegionSelected = selectedRegion === district.region;
          const districtColor = regionInfo?.color || "#0F766E";

          return (
            <Polygon
              key={district.id || `${district.name}-${index}`}
              positions={district.polygon}
              pathOptions={{
                fillColor: districtColor,
                color: isSelected ? "#111827" : "#4B5563",
                weight: isSelected ? 2 : isRegionSelected ? 1.25 : 0.8,
                opacity: isSelected ? 0.95 : 0.55,
                fillOpacity: isSelected ? 0.42 : isRegionSelected ? 0.24 : 0.12,
              }}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  handleDistrictClick(district);
                },
                mouseover: (e) => {
                  setHoveredDistrict(district);
                  e.target.setStyle({
                    fillOpacity: 0.42,
                    weight: 2,
                    opacity: 0.95,
                  });
                },
                mouseout: (e) => {
                  setHoveredDistrict((current) =>
                    current?.id === district.id ? null : current
                  );
                  e.target.setStyle({
                    fillOpacity: isSelected
                      ? 0.42
                      : isRegionSelected
                        ? 0.24
                        : 0.12,
                    weight: isSelected ? 2 : isRegionSelected ? 1.25 : 0.8,
                    opacity: isSelected ? 0.95 : 0.55,
                  });
                },
              }}
            />
          );
        })}

        {tooltipDistrict && tooltipCoordinates && (
          <CircleMarker
            key={`tooltip-${tooltipDistrict.id || tooltipDistrict.name}`}
            center={[tooltipCoordinates[1], tooltipCoordinates[0]]}
            radius={0}
            interactive={false}
            pathOptions={{
              opacity: 0,
              fillOpacity: 0,
            }}
          >
            <Tooltip
              direction="top"
              permanent
              offset={[0, -6]}
              opacity={0.95}
            >
              <div className="text-xs font-semibold text-gray-900">
                {tooltipDistrict.name}
              </div>
              <div className="text-[11px] text-gray-600">
                {tooltipDistrict.region}
              </div>
            </Tooltip>
          </CircleMarker>
        )}

      </MapContainer>
      <WeatherInfoPanel
        selectedRegion={selectedRegion}
        selectedDistrict={selectedDistrict}
        onClose={closeInfoPanel}
        realTimeWeather={realTimeWeather}
        updatedAt={updatedAt}
      />
    </div>
  );
};

WeatherInteractiveMap.propTypes = {
  onRegionSelect: PropTypes.func,
  onDistrictSelect: PropTypes.func,
  initialRegion: PropTypes.string,
  updatedAt: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
};

export default WeatherInteractiveMap;


