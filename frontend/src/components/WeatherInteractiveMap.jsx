import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Moon,
  Droplets,
  Wind,
  Eye,
  MapPin,
  RefreshCw,
} from "lucide-react";
import {
  getCurrentWeatherByCoordinates,
  getWeatherBundlesByCoordinates,
} from "../services/openMeteoService";
import T from "./common/T";
import useT from "../hooks/useT";
import { useTheme } from "../contexts/ThemeContext";
import { SkeletonBlock } from "./common/SkeletonLoading";
import {
  getGeometryCenter,
  normalizeDistrictName,
  toLeafletPositions,
} from "../utils/ghanaGeo";

const MAP_TILE_LAYERS = {
  light: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, DeLorme, NAVTEQ",
  },
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, DeLorme, NAVTEQ",
  },
};

const WEATHER_PANEL_MARGIN = 12;
const WEATHER_PANEL_OFFSET = 16;
const WEATHER_PANEL_NARROW_BREAKPOINT = 640;
const WEATHER_PANEL_DEFAULT_SIZE = {
  width: 384,
  height: 260,
};

const clamp = (value, min, max) => {
  const normalizedMax = Math.max(min, max);
  return Math.min(Math.max(value, min), normalizedMax);
};

const getWeatherPanelAnchor = (selectedDistrict, selectedRegion) => {
  if (selectedDistrict?.labelCoordinates?.length >= 2) {
    const [lng, lat] = selectedDistrict.labelCoordinates;
    return {
      key: `district-${selectedDistrict.id || selectedDistrict.name}`,
      latLng: [lat, lng],
    };
  }

  const regionCenter = selectedRegion
    ? GHANA_REGIONS[selectedRegion]?.center
    : null;

  if (!regionCenter) return null;

  return {
    key: `region-${selectedRegion}`,
    latLng: regionCenter,
  };
};

const getWeatherPanelPosition = ({
  anchorPoint,
  mapSize,
  panelSize,
  isMobile,
}) => {
  const mapWidth = mapSize.x;
  const mapHeight = mapSize.y;
  const availableWidth = Math.max(0, mapWidth - WEATHER_PANEL_MARGIN * 2);
  const availableHeight = Math.max(160, mapHeight - WEATHER_PANEL_MARGIN * 2);
  const panelWidth = Math.min(panelSize.width, availableWidth);
  const panelHeight = Math.min(panelSize.height, availableHeight);
  const isNarrow = isMobile || mapWidth < WEATHER_PANEL_NARROW_BREAKPOINT;

  if (isNarrow) {
    const width = Math.min(380, availableWidth);

    return {
      left: Math.round((mapWidth - width) / 2),
      top: Math.round(
        clamp(
          mapHeight - panelHeight - WEATHER_PANEL_MARGIN,
          WEATHER_PANEL_MARGIN,
          mapHeight - panelHeight - WEATHER_PANEL_MARGIN
        )
      ),
      width: Math.round(width),
      maxHeight: Math.round(availableHeight),
      maxWidth: Math.round(availableWidth),
    };
  }

  let left = anchorPoint.x + WEATHER_PANEL_OFFSET;
  if (left + panelWidth + WEATHER_PANEL_MARGIN > mapWidth) {
    left = anchorPoint.x - panelWidth - WEATHER_PANEL_OFFSET;
  }

  return {
    left: Math.round(
      clamp(left, WEATHER_PANEL_MARGIN, mapWidth - panelWidth - WEATHER_PANEL_MARGIN)
    ),
    top: Math.round(
      clamp(
        anchorPoint.y - panelHeight / 2,
        WEATHER_PANEL_MARGIN,
        mapHeight - panelHeight - WEATHER_PANEL_MARGIN
      )
    ),
    maxHeight: Math.round(availableHeight),
    maxWidth: Math.round(availableWidth),
  };
};

const getWeatherIcon = (iconKey) => {
  if (iconKey === "rain" || iconKey === "drizzle" || iconKey === "thunderstorm") {
    return CloudRain;
  }
  if (iconKey === "clear-night") return Moon;
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

  async getWeatherByLocations(locations) {
    const weatherBundles = await getWeatherBundlesByCoordinates(locations, {
      forecastDays: 1,
      timeoutMs: 8000,
    });

    return weatherBundles.map((bundle, index) => ({
      name: locations[index].name,
      weather: {
        ...bundle.current,
        icon: getWeatherIcon(bundle.current.iconKey),
      },
      source: "live",
    }));
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
const UnifiedZoomControl = ({ map, initialCenter, isMobile }) => {
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
    <div
      className="absolute top-[10px] left-[10px] z-[40] flex flex-col shadow-md"
      onClick={(event) => event.stopPropagation()}
    >
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        className="w-[30px] h-[30px] flex items-center justify-center bg-neo-surface hover:bg-neo-surface-strong text-neo-text hover:text-neo-text border border-neo-border rounded-t transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-bold leading-none"
        title={t("Zoom in")}
        aria-label={t("Zoom in")}
      >
        +
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        className="w-[30px] h-[30px] flex items-center justify-center bg-neo-surface hover:bg-neo-surface-strong text-neo-text hover:text-neo-text border-l border-r border-neo-border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-bold leading-none"
        title={t("Zoom out")}
        aria-label={t("Zoom out")}
        style={{ borderTop: 'none' }}
      >
        −
      </button>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-[30px] h-[30px] flex items-center justify-center bg-neo-surface hover:bg-neo-surface-strong text-neo-text hover:text-neo-text border border-neo-border rounded-b transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
  map: PropTypes.object.isRequired,
  initialCenter: PropTypes.array.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

const WeatherPanelPositioner = ({
  selectedRegion,
  selectedDistrict,
  onPanelAnchorChange,
  onMapReady,
}) => {
  const map = useMap();
  const panelAnchor = useMemo(
    () => getWeatherPanelAnchor(selectedDistrict, selectedRegion),
    [selectedDistrict, selectedRegion]
  );

  useEffect(() => {
    onMapReady(map);

    return () => {
      onMapReady(null);
    };
  }, [map, onMapReady]);

  useEffect(() => {
    if (!panelAnchor) {
      onPanelAnchorChange(null);
      return undefined;
    }

    let frameId = null;

    const updateAnchor = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        const mapSize = map.getSize();
        const anchorPoint = map.latLngToContainerPoint(panelAnchor.latLng);

        onPanelAnchorChange({
          key: panelAnchor.key,
          anchorPoint: {
            x: anchorPoint.x,
            y: anchorPoint.y,
          },
          mapSize: {
            x: mapSize.x,
            y: mapSize.y,
          },
        });
      });
    };

    updateAnchor();
    map.on("move zoom resize", updateAnchor);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      map.off("move zoom resize", updateAnchor);
    };
  }, [map, onPanelAnchorChange, panelAnchor]);

  return null;
};

WeatherPanelPositioner.propTypes = {
  selectedRegion: PropTypes.string,
  selectedDistrict: PropTypes.object,
  onPanelAnchorChange: PropTypes.func.isRequired,
  onMapReady: PropTypes.func.isRequired,
};

// Weather info panel component - IMD Style with minimal design
const WeatherInfoPanel = ({
  selectedRegion,
  selectedDistrict,
  onClose,
  realTimeWeather,
  updatedAt,
  isMobile,
  panelAnchorPosition,
}) => {
  const { t } = useT();
  const panelRef = useRef(null);
  const [panelSize, setPanelSize] = useState(WEATHER_PANEL_DEFAULT_SIZE);
  const [panelPosition, setPanelPosition] = useState(null);

  const regionData = selectedRegion ? GHANA_REGIONS[selectedRegion] : null;
  const weatherKey = selectedDistrict ? selectedDistrict.name : selectedRegion;
  const weather = realTimeWeather[weatherKey] || regionData?.weather;
  const IconComponent = weather?.icon;
  const displayUpdatedAt = weather?.updatedAt || updatedAt || new Date();

  useEffect(() => {
    const panelElement = panelRef.current;
    if (!panelElement) {
      return undefined;
    }

    const updateSize = () => {
      const nextSize = {
        width: panelElement.offsetWidth || WEATHER_PANEL_DEFAULT_SIZE.width,
        height: panelElement.offsetHeight || WEATHER_PANEL_DEFAULT_SIZE.height,
      };

      setPanelSize((currentSize) => {
        if (
          currentSize.width === nextSize.width &&
          currentSize.height === nextSize.height
        ) {
          return currentSize;
        }

        return nextSize;
      });
    };

    updateSize();

    if (typeof window.ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new window.ResizeObserver(updateSize);
    observer.observe(panelElement);

    return () => {
      observer.disconnect();
    };
  }, [weather, weatherKey]);

  useEffect(() => {
    if (!panelAnchorPosition) {
      setPanelPosition(null);
      return;
    }

    setPanelPosition(
      getWeatherPanelPosition({
        anchorPoint: panelAnchorPosition.anchorPoint,
        mapSize: panelAnchorPosition.mapSize,
        panelSize,
        isMobile,
      })
    );
  }, [isMobile, panelAnchorPosition, panelSize]);

  if (!selectedRegion && !selectedDistrict) return null;

  const panelStyle = panelPosition
    ? {
        left: panelPosition.left,
        top: panelPosition.top,
        maxHeight: panelPosition.maxHeight,
        maxWidth: panelPosition.maxWidth,
        opacity: 1,
        ...(panelPosition.width ? { width: panelPosition.width } : {}),
      }
    : {
        left: WEATHER_PANEL_MARGIN,
        top: WEATHER_PANEL_MARGIN,
        opacity: 0,
      };

  return (
    <div
      ref={panelRef}
      className="weather-info-panel absolute bg-neo-surface border border-neo-border rounded-lg shadow-xl p-2 sm:p-4 z-[40] w-[280px] sm:max-w-[380px] md:w-96 text-neo-text backdrop-blur-sm bg-neo-surface/95 overflow-y-auto transition-opacity duration-150"
      style={panelStyle}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {/* Header - Mobile Optimized */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-neo-text flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-neo-muted flex-shrink-0" />
            <span className="truncate text-xs sm:text-sm">
              {selectedDistrict ? selectedDistrict.name : selectedRegion}
            </span>
          </h3>
          <p className="text-neo-muted text-xs">
            <T>Updated</T> {formatUpdatedStamp(displayUpdatedAt)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-neo-muted hover:text-neo-text text-lg sm:text-xl p-1 hover:bg-neo-surface-strong rounded-full transition-colors flex-shrink-0 ml-1"
          aria-label={t("Close weather panel")}
        >
          ×
        </button>
      </div>

      {/* Current Weather - IMD Style */}
      {weather && (
        <div className="space-y-1 sm:space-y-3">
          {/* Main Temperature Display - Mobile Optimized */}
          <div className="text-center py-1 sm:py-2 bg-neo-bg-soft border border-neo-border rounded-lg mb-1 sm:mb-2">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
              {IconComponent && (
                <IconComponent className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              )}
              <span className="text-lg sm:text-2xl font-bold text-neo-text">
                {weather.temperature}
              </span>
            </div>
            <p className="text-xs font-medium text-neo-text truncate px-1">
              <T>{weather.condition}</T>
            </p>
            {weather.apparentTemperature && (
              <p className="text-[11px] text-neo-muted">
                <T>Feels like</T> {weather.apparentTemperature}
              </p>
            )}
          </div>

          {/* Weather Summary - More Compact on Mobile */}
          {(weather.conversationalSummary || weather.summary) && (
            <div className="mt-1 sm:mt-2 p-1.5 sm:p-2 bg-neo-bg-soft rounded-md border border-neo-border">
              <p className="text-xs text-neo-text leading-tight sm:leading-relaxed text-center">
                <span className="font-medium text-neo-text">
                  <T>Forecast</T>:
                </span>{" "}
                <T>{weather.conversationalSummary || weather.summary}</T>
              </p>
            </div>
          )}

          {/* Weather Data Grid - Ultra Compact for Mobile */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs">
            <div className="bg-neo-surface-strong/70 border border-neo-border rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Droplets className="w-3 h-3 text-blue-600" />
              </div>
              <p className="text-neo-muted text-xs leading-tight">
                <T>Humidity</T>
              </p>
              <p className="font-semibold text-neo-text text-xs">
                {weather.humidity}
              </p>
            </div>
            <div className="bg-neo-surface-strong/70 border border-neo-border rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Wind className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-neo-muted text-xs leading-tight">
                <T>Wind</T>
              </p>
              <p className="font-semibold text-neo-text text-xs">
                {weather.windSpeed}
              </p>
            </div>
            <div className="bg-neo-surface-strong/70 border border-neo-border rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <CloudRain className="w-3 h-3 text-cyan-600" />
              </div>
              <p className="text-neo-muted text-xs leading-tight">
                <T>Rain</T>
              </p>
              <p className="font-semibold text-neo-text text-xs">
                {weather.rainfall}
              </p>
            </div>
            <div className="bg-neo-surface-strong/70 border border-neo-border rounded-md p-1 sm:p-1.5 text-center">
              <div className="flex items-center justify-center mb-0.5">
                <Eye className="w-3 h-3 text-purple-600" />
              </div>
              <p className="text-neo-muted text-xs leading-tight">
                <T>Visibility</T>
              </p>
              <p className="font-semibold text-neo-text text-xs">
                {weather.visibility}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Info - Ultra Compact */}
      {regionData && (
        <div className="mt-1 pt-1 border-t border-neo-border">
          <div className="bg-neo-bg-soft rounded-md p-1">
            <p className="text-xs text-neo-muted text-center truncate leading-tight">
              <span className="font-medium text-neo-text">
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
  isMobile: PropTypes.bool.isRequired,
  panelAnchorPosition: PropTypes.shape({
    key: PropTypes.string,
    anchorPoint: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }).isRequired,
    mapSize: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }).isRequired,
  }),
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
  const { isDark } = useTheme();
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
  const [mapInstance, setMapInstance] = useState(null);
  const [panelAnchorPosition, setPanelAnchorPosition] = useState(null);
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

  useEffect(() => {
    let isMounted = true;

    const loadRegionWeather = async () => {
      const regionLocations = Object.entries(GHANA_REGIONS).map(
        ([name, region]) => ({
          name,
          lat: region.center[0],
          lng: region.center[1],
        })
      );

      try {
        const regionWeather = await openMeteoWeatherService.getWeatherByLocations(
          regionLocations
        );

        if (!isMounted) return;

        setRealTimeWeather((prev) => ({
          ...prev,
          ...Object.fromEntries(
            regionWeather.map(({ name, weather }) => [name, weather])
          ),
        }));
      } catch (error) {
        console.warn("Open-Meteo region weather unavailable:", error);
      }
    };

    loadRegionWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  // Note: districtsByRegion removed as it was unused

  const closeInfoPanel = useCallback(() => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setHoveredDistrict(null);
  }, []);

  const handleMapReady = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const handlePanelAnchorChange = useCallback((position) => {
    setPanelAnchorPosition(position);
  }, []);

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
  }, [closeInfoPanel, selectedRegion, selectedDistrict]);

  if (loading) {
    return (
      <div className="w-full h-[50vh] min-h-[300px] sm:h-[60vh] md:h-[500px] lg:h-[600px] max-h-[80vh] flex items-center justify-center bg-neo-surface border border-neo-border rounded-lg">
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

  const tooltipDistrict = selectedDistrict ? null : hoveredDistrict;
  const tooltipCoordinates = tooltipDistrict?.labelCoordinates;
  const activeTileLayer = isDark ? MAP_TILE_LAYERS.dark : MAP_TILE_LAYERS.light;
  const districtStrokeColor = isDark ? "#CFE8DD" : "#4B5563";
  const selectedStrokeColor = isDark ? "#F4FFF9" : "#111827";
  const baseFillOpacity = isDark ? 0.22 : 0.12;
  const regionFillOpacity = isDark ? 0.34 : 0.24;
  const selectedFillOpacity = isDark ? 0.5 : 0.42;

  return (
    <div
      data-no-auto-translate="true"
      className="agromet-weather-map relative w-full rounded-lg overflow-hidden shadow-lg bg-neo-surface border border-neo-border"
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
        <TileLayer
          key={isDark ? "weather-map-dark" : "weather-map-light"}
          attribution={activeTileLayer.attribution}
          url={activeTileLayer.url}
        />

        <MapController
          selectedRegion={selectedRegion}
          isMobile={isMobile}
          shouldZoomToRegion={!selectedDistrict}
        />

        <WeatherPanelPositioner
          selectedRegion={selectedRegion}
          selectedDistrict={selectedDistrict}
          onPanelAnchorChange={handlePanelAnchorChange}
          onMapReady={handleMapReady}
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
                color: isSelected ? selectedStrokeColor : districtStrokeColor,
                weight: isSelected ? 2 : isRegionSelected ? 1.25 : 0.8,
                opacity: isSelected ? 0.95 : isDark ? 0.72 : 0.55,
                fillOpacity: isSelected
                  ? selectedFillOpacity
                  : isRegionSelected
                    ? regionFillOpacity
                    : baseFillOpacity,
              }}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  handleDistrictClick(district);
                },
                mouseover: (e) => {
                  setHoveredDistrict(district);
                  e.target.setStyle({
                    fillOpacity: selectedFillOpacity,
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
                      ? selectedFillOpacity
                      : isRegionSelected
                        ? regionFillOpacity
                        : baseFillOpacity,
                    weight: isSelected ? 2 : isRegionSelected ? 1.25 : 0.8,
                    opacity: isSelected ? 0.95 : isDark ? 0.72 : 0.55,
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
              <div className="text-xs font-semibold text-neo-text">
                {tooltipDistrict.name}
              </div>
              <div className="text-[11px] text-neo-muted">
                {tooltipDistrict.region}
              </div>
            </Tooltip>
          </CircleMarker>
        )}

      </MapContainer>
      {/* Unified Zoom Control (Zoom In/Out + Reset) - Only show on non-mobile */}
      {!isMobile && mapInstance && (
        <UnifiedZoomControl
          map={mapInstance}
          initialCenter={mapCenter}
          isMobile={isMobile}
        />
      )}
      <WeatherInfoPanel
        selectedRegion={selectedRegion}
        selectedDistrict={selectedDistrict}
        onClose={closeInfoPanel}
        realTimeWeather={realTimeWeather}
        updatedAt={updatedAt}
        isMobile={isMobile}
        panelAnchorPosition={panelAnchorPosition}
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


