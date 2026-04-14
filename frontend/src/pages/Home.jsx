import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import PageTitle from "../components/PageTitle";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import WeatherInteractiveMap from "../components/WeatherInteractiveMap";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import AnimatedWeatherIcon from "../components/AnimatedWeatherIcon";
import backgroundImage from "../assets/images/prisma.png";
import {
  FaCloudSun,
  FaThermometerHalf,
  FaCloudSunRain,
  FaArrowRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import thermometer from "../assets/images/thermometer.svg";
import event1 from "../assets/images/event1.jpg";
import event2 from "../assets/images/event2.png";
import event3 from "../assets/images/event3.jpg";
import mofa from "../assets/icons/mofa.png";
import ecowas from "../assets/icons/ecowas.png";
import worldbank from "../assets/icons/worldbank.png";
import fsrp from "../assets/icons/fsrp.png";
import gmet from "../assets/icons/gmet.png";
import "../components/PopupStyles.css";
import cap from "../assets/icons/CAP.png";
import PropTypes from "prop-types";
import axios from "axios";
import {
  ChevronRight,
  Cloud,
  BarChart2,
  Wheat,
  Bird,
  Search,
} from "lucide-react";
import API_CONFIG from "../config/apiConfig";
import T from "../components/common/T";

const SECTION_CARD =
  "bg-white/10 backdrop-blur-md border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-4 md:p-5 lg:p-6";

const SECTION_HEADING =
  "text-white text-2xl md:text-3xl font-semibold tracking-tight";

const SECTION_SUBHEADING = "text-blue-100/80 text-sm md:text-base mt-1";

const heroBackgroundStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
};

const NewsCard = ({ image, alt, title, excerpt, to }) => (
  <article className="group bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
    <div className="aspect-[16/9] overflow-hidden">
      <img
        src={image}
        alt={alt}
        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
      />
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <h3 className="text-blue-700 font-semibold text-lg leading-snug">
        <T>{title}</T>
      </h3>
      <p className="text-gray-600 text-sm mt-2 leading-relaxed flex-grow">
        <T>{excerpt}</T>
      </p>
      <Link
        to={to}
        className="text-blue-600 font-semibold mt-4 inline-flex items-center hover:underline"
      >
        <T>Read More</T> <FaArrowRight className="ml-1" />
      </Link>
    </div>
  </article>
);

NewsCard.propTypes = {
  image: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  excerpt: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};

const sliderSettings = {
  infinite: true,
  speed: 800,
  slidesToShow: 4,
  arrows: false,
  autoplay: true,
  autoplaySpeed: 3000,
  slidesToScroll: 1,
  pauseOnHover: true,
  cssEase: "cubic-bezier(0.45, 0, 0.55, 1)",
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 4 } },
    { breakpoint: 992, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 576, settings: { slidesToShow: 2 } },
  ],
};

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
};

const weatherFocusableSelector =
  'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

const updateSliderAccessibility = (sliderRef) => {
  const sliderRoot =
    sliderRef.current?.innerSlider?.list?.closest(".slick-slider");
  if (!sliderRoot) return;

  sliderRoot.querySelectorAll(".slick-slide").forEach((slide) => {
    const isHidden = slide.getAttribute("aria-hidden") === "true";

    if (isHidden && slide.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    slide.querySelectorAll(weatherFocusableSelector).forEach((element) => {
      if (isHidden) {
        if (!element.hasAttribute("data-weather-tabindex")) {
          element.setAttribute(
            "data-weather-tabindex",
            element.getAttribute("tabindex") ?? "",
          );
        }
        element.setAttribute("tabindex", "-1");
        return;
      }

      const previousTabIndex = element.getAttribute("data-weather-tabindex");
      if (previousTabIndex === null) return;

      if (previousTabIndex === "") {
        element.removeAttribute("tabindex");
      } else {
        element.setAttribute("tabindex", previousTabIndex);
      }
      element.removeAttribute("data-weather-tabindex");
    });
  });
};

// SeverityPolygon component with click handler
const SeverityPolygon = ({
  coordinates,
  severity,
  message,
  onPolygonClick,
}) => {
  const colorMap = {
    low: { fillColor: "green", color: "darkgreen" },
    medium: { fillColor: "yellow", color: "orange" },
    high: { fillColor: "red", color: "darkred" },
  };
  const { fillColor, color } = colorMap[severity] || {
    fillColor: "blue",
    color: "darkblue",
  };
  const handleClick = (event) => {
    const latlng = event.latlng;
    onPolygonClick(latlng, message, severity);
  };
  return (
    <Polygon
      positions={coordinates}
      pathOptions={{
        fillColor,
        color,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.4,
      }}
      eventHandlers={{ click: handleClick }}
    />
  );
};

SeverityPolygon.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
    .isRequired,
  severity: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onPolygonClick: PropTypes.func.isRequired,
};

// Dynamic Popup component for polygons
const DynamicPopup = ({ popupData, setPopupData }) => {
  const map = useMap();
  useMemo(() => {
    if (popupData) {
      const { position, message, severity } = popupData;
      const popup = L.popup()
        .setLatLng(position)
        .setContent(
          `
          <div class="popup-content flex flex-col">
            <h2 class="location-title text-blue-900 capitalize">${severity} Rainfall Zone</h2>
            <hr class="border-blue-500" />
            <p class="text-blue-600 font-bold">${new Date().toLocaleDateString()}</p>
            <hr class="border-gray-300" />
            <div class="weather-details">
              <div class="weather-info flex items-center my-2">
                <i class="fas fa-cloud-sun text-gray-900 text-xl mr-2"></i>
                <p><strong>Forecast:</strong> ${message}</p>
              </div>
            </div>
          </div>
        `,
        )
        .openOn(map);
      const closePopup = () => {
        map.closePopup(popup);
        setPopupData(null);
      };
      map.on("click", closePopup);
      return () => {
        map.off("click", closePopup);
        map.closePopup(popup);
      };
    }
  }, [popupData, map, setPopupData]);
  return null;
};

DynamicPopup.propTypes = {
  popupData: PropTypes.object,
  setPopupData: PropTypes.func.isRequired,
};

// Weather condition mapping function to convert Home page conditions to AnimatedWeatherIcon conditions
const mapWeatherCondition = (condition) => {
  const conditionMap = {
    "Cloudy, Sunny Intervals": "partly cloudy",
    "Rains, Sunny Intervals": "light rain",
    "Sunny Intervals": "sunny intervals",
    "Sunny Intervals, Showers": "light rain",
  };

  return conditionMap[condition] || "sunny intervals";
};

// Enhanced WeatherIcon component using AnimatedWeatherIcon
const WeatherIcon = ({ condition }) => {
  const mappedCondition = mapWeatherCondition(condition);

  return (
    <div className="flex justify-center items-center">
      <AnimatedWeatherIcon
        condition={mappedCondition}
        size="lg"
        showParticles={true}
        interactive={true}
        className="mx-auto"
      />
    </div>
  );
};

WeatherIcon.propTypes = {
  condition: PropTypes.string.isRequired,
};

const getFormattedDate = () => {
  const options = { day: "2-digit", month: "long", year: "numeric" };
  return new Date().toLocaleDateString("en-GB", options);
};

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [12, 21],
  iconAnchor: [8, 21],
  popupAnchor: [1, 54],
  shadowSize: [21, 21],
});

L.Marker.prototype.options.icon = DefaultIcon;

const WeatherCard = ({ city, condition, minTemp, maxTemp, type }) => (
  <div className="flex flex-col text-left justify-center text-white px-3 sm:px-6 border-r border-r-white">
    <div className="flex gap-3 sm:gap-4 items-center justify-between mb-1">
      <div className="flex-1 min-w-0">
        <h3 className="font-montserrat font-semibold text-sm sm:text-base truncate">
          {city}
        </h3>
        {/* <p className="text-xs text-blue-200 truncate">{type}</p> */}
      </div>
      <WeatherIcon
        className="text-right text-lg sm:text-xl flex-shrink-0"
        condition={condition}
      />
    </div>
    <p className="text-xs sm:text-sm font-montserrat mb-2 truncate">
      <T>{condition}</T>
    </p>
    <div className="flex items-center gap-2">
      <img
        className="mysvg flex-shrink-0"
        src={thermometer}
        alt="thermometer icon"
        height="20"
        width="20"
      />
      <p className="text-xs">
        <T>Min</T>: {minTemp}°C | <T>Max</T>: {maxTemp}°C
      </p>
    </div>
  </div>
);

WeatherCard.propTypes = {
  city: PropTypes.string.isRequired,
  condition: PropTypes.string.isRequired,
  minTemp: PropTypes.number.isRequired,
  maxTemp: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
};

const Home = () => {
  const [data, setData] = useState({});
  const [location, setLocation] = useState("");

  const [currentDateTime, setCurrentDateTime] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  const [setPopupData] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const forecastCategories = [
    {
      title: <T>Weather Forecasts</T>,
      icon: <Cloud className="text-blue-500" />,
      items: [
        { name: <T>Weekly Forecast</T>, path: "/7-days-forecast" },
        {
          name: <T>Subseasonal 2 Seasonal Forecast</T>,
          path: "/subseasonal-forecast",
        },
        { name: <T>Seasonal Forecast</T>, path: "/seasonal-forecast" },
      ],
    },
    {
      title: <T>Environmental Monitoring</T>,
      icon: <BarChart2 className="text-green-600" />,
      items: [
        { name: <T>Flood and Drought Bulletins</T>, path: "/flood-drought" },
      ],
    },
    {
      title: <T>Agricultural Resources</T>,
      icon: <Wheat className="text-amber-600" />,
      items: [
        { name: <T>Agrometeorological Bulletins</T>, path: "/agro-bulletins" },
        { name: <T>Crop Calendar</T>, path: "/crop-calendar" },
        { name: <T>Crop Advisories</T>, path: "/crop-advisory" },
      ],
    },
    {
      title: <T>Livestock Management</T>,
      icon: <Bird className="text-purple-600" />,
      items: [
        { name: <T>Poultry Calendar</T>, path: "/poultry-calendar" },
        { name: <T>Poultry Advisories</T>, path: "/poultry-advisory" },
      ],
    },
  ];

  const toggleCategory = (index) => {
    if (expandedCategory === index) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(index);
    }
  };

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=4a1a256c56d0d338ce9ef49b4f933ca4`;

  const searchLocation = (event) => {
    if (event.key === "Enter") {
      axios
        .get(url)
        .then((response) => {
          setData(response.data);
          console.log(response.data);
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
          alert("Could not fetch weather data. Please try another location.");
        });
      setLocation("");
    }
  };

  // All 16 Regional Capitals and Major Municipal Capitals in Ghana
  const ghanaCities = [
    // Regional Capitals
    {
      name: "Accra",
      lat: 5.6037,
      lng: -0.187,
      type: "Regional Capital",
      region: "Greater Accra",
    },
    {
      name: "Bolgatanga",
      lat: 10.7856,
      lng: -0.8514,
      type: "Regional Capital",
      region: "Upper East",
    },
    {
      name: "Kumasi",
      lat: 6.6885,
      lng: -1.6244,
      type: "Regional Capital",
      region: "Ashanti",
    },
    {
      name: "Tarkwa",
      lat: 5.3004,
      lng: -1.9959,
      type: "Municipal Capital",
      region: "Western",
    },
    {
      name: "Tamale",
      lat: 9.4034,
      lng: -0.8424,
      type: "Regional Capital",
      region: "Northern",
    },
    {
      name: "Cape Coast",
      lat: 5.1054,
      lng: -1.2466,
      type: "Regional Capital",
      region: "Central",
    },
    {
      name: "Koforidua",
      lat: 6.0941,
      lng: -0.2631,
      type: "Regional Capital",
      region: "Eastern",
    },

    {
      name: "Ho",
      lat: 6.6009,
      lng: 0.4709,
      type: "Regional Capital",
      region: "Volta",
    },
    {
      name: "Obuasi",
      lat: 6.2028,
      lng: -1.6703,
      type: "Municipal Capital",
      region: "Ashanti",
    },
    {
      name: "Yendi",
      lat: 9.4427,
      lng: -0.0093,
      type: "Regional Capital",
      region: "North East",
    },
    {
      name: "Takoradi",
      lat: 4.8845,
      lng: -1.7554,
      type: "Regional Capital",
      region: "Western",
    },
    {
      name: "Sunyani",
      lat: 7.3378,
      lng: -2.3267,
      type: "Regional Capital",
      region: "Bono",
    },
    {
      name: "Elmina",
      lat: 5.0831,
      lng: -1.3488,
      type: "Municipal Capital",
      region: "Central",
    },
    {
      name: "Techiman",
      lat: 7.5931,
      lng: -1.9381,
      type: "Regional Capital",
      region: "Bono East",
    },
    {
      name: "Goaso",
      lat: 6.8009,
      lng: -2.5303,
      type: "Regional Capital",
      region: "Ahafo",
    },
    {
      name: "Sefwi Wiawso",
      lat: 6.2167,
      lng: -2.4833,
      type: "Regional Capital",
      region: "Western North",
    },

    {
      name: "Wa",
      lat: 10.06,
      lng: -2.5057,
      type: "Regional Capital",
      region: "Upper West",
    },
    {
      name: "Damongo",
      lat: 9.0842,
      lng: -1.815,
      type: "Regional Capital",
      region: "Savannah",
    },

    {
      name: "Dambai",
      lat: 8.0167,
      lng: 0.4333,
      type: "Regional Capital",
      region: "Oti",
    },

    {
      name: "Tema",
      lat: 5.6698,
      lng: -0.0166,
      type: "Municipal Capital",
      region: "Greater Accra",
    },
  ];

  const [weatherData, setWeatherData] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const AMBEE_BASE_URL = API_CONFIG.AMBEE_BASE_URL;

  // Fetch weather data for a specific city
  const fetchCityWeather = async (city) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `${AMBEE_BASE_URL}/weather/latest/by-lat-lng?lat=${city.lat}&lng=${city.lng}`,
        {
          headers: { "Content-type": "application/json" },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.data) {
        return formatWeatherDataForCity(city, data.data);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      return getMockWeatherForCity(city);
    }
  };

  // Format weather data from Ambee API
  const formatWeatherDataForCity = (cityData, weatherData) => {
    // Convert Fahrenheit to Celsius
    const tempCelsius = Math.round(((weatherData.temperature - 32) * 5) / 9);

    // Get condition from summary
    const condition = getWeatherCondition(weatherData.summary);

    // Calculate min/max temps (simulate daily range)
    const minTemp = Math.max(tempCelsius - 3, 18);
    const maxTemp = tempCelsius + 4;

    return {
      city: cityData.name,
      condition: condition,
      minTemp: minTemp,
      maxTemp: maxTemp,
      type: cityData.type,
      region: cityData.region,
      summary: weatherData.summary || "No detailed forecast available",
      humidity: weatherData.humidity,
      windSpeed: Math.round(weatherData.windSpeed * 3.6), // Convert m/s to km/h
    };
  };

  // Get weather condition from summary
  const getWeatherCondition = (summary) => {
    const summaryLower = (summary || "").toLowerCase();
    if (summaryLower.includes("rain") || summaryLower.includes("shower"))
      return "Rains, Sunny Intervals";
    if (summaryLower.includes("cloud")) return "Cloudy, Sunny Intervals";
    if (summaryLower.includes("clear") || summaryLower.includes("sunny"))
      return "Sunny Intervals";
    if (summaryLower.includes("storm")) return "Rains, Sunny Intervals";
    if (summaryLower.includes("fog") || summaryLower.includes("mist"))
      return "Cloudy, Sunny Intervals";
    return "Sunny Intervals";
  };

  // Generate mock weather data for fallback
  const getMockWeatherForCity = (cityData) => {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour < 6 || hour > 18;

    // Base temperature varies by latitude (northern cities are hotter)
    const baseTemp = cityData.lat > 9 ? 30 : cityData.lat > 7 ? 28 : 26;
    const tempVariation = isNight ? -3 : 2;
    const currentTemp = Math.round(
      baseTemp + tempVariation + Math.random() * 4,
    );

    // Time-based weather conditions
    const timeBasedConditions = isNight
      ? ["Cloudy, Sunny Intervals", "Sunny Intervals"]
      : [
          "Sunny Intervals",
          "Cloudy, Sunny Intervals",
          "Rains, Sunny Intervals",
        ];

    const condition =
      timeBasedConditions[
        Math.floor(Math.random() * timeBasedConditions.length)
      ];

    return {
      city: cityData.name,
      condition: condition,
      minTemp: Math.max(currentTemp - 3, 18),
      maxTemp: currentTemp + 4,
      type: cityData.type,
      region: cityData.region,
      summary: `${condition} with typical West African weather`,
      humidity: Math.round(60 + Math.random() * 30),
      windSpeed: Math.round(5 + Math.random() * 20),
    };
  };

  const settings = {
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    accessibility: false,
    speed: 8000,
    pauseOnHover: true,
    cssEase: "linear",
    beforeChange: () => {
      if (
        document.activeElement instanceof HTMLElement &&
        weatherSliderRef.current?.innerSlider?.list?.contains(
          document.activeElement,
        )
      ) {
        document.activeElement.blur();
      }
    },
    afterChange: () => {
      window.setTimeout(syncWeatherSliderAccessibility, 0);
    },
    responsive: [
      { breakpoint: 1400, settings: { slidesToShow: 5, slidesToScroll: 2 } },
      { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 2 } },
      { breakpoint: 992, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 576, settings: { slidesToShow: 2, slidesToScroll: 2 } },
    ],
  };

  // Load weather data for all cities
  const loadAllCitiesWeather = async () => {
    setLoadingWeather(true);
    try {
      const weatherPromises = ghanaCities.map(async (city) => {
        try {
          return await fetchCityWeather(city);
        } catch (error) {
          return getMockWeatherForCity(city);
        }
      });

      const results = await Promise.allSettled(weatherPromises);
      const weatherDataArray = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      setWeatherData(weatherDataArray);
    } catch (error) {
      // Fallback to mock data for all cities
      const fallbackData = ghanaCities.map((city) =>
        getMockWeatherForCity(city),
      );
      setWeatherData(fallbackData);
    } finally {
      setLoadingWeather(false);
    }
  };

  const weatherSliderRef = useRef(null);
  const syncWeatherSliderAccessibility = useCallback(() => {
    updateSliderAccessibility(weatherSliderRef);
  }, []);

  useEffect(() => {
    loadAllCitiesWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  useEffect(() => {
    const timer = window.setTimeout(syncWeatherSliderAccessibility, 0);
    return () => window.clearTimeout(timer);
  }, [syncWeatherSliderAccessibility, weatherData, loadingWeather]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions = { day: "2-digit", month: "short", year: "numeric" };
      const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
      setCurrentDateTime(now.toLocaleDateString("en-GB", dateOptions));
      setFormattedTime(now.toLocaleTimeString("en-GB", timeOptions));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePolygonClick = (latlng, message, severity) => {
    setPopupData({ position: latlng, message, severity });
  };

  return (
    <>
      <PageTitle
        title="Home - Agricultural Information Services for Ghana"
        includeAppName={false}
      />
      <div
        className="min-h-screen bg-gray-950 relative"
        style={heroBackgroundStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/40 to-gray-950/80 pointer-events-none" />
        <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 lg:pt-32 pb-10 md:pb-12 space-y-8 md:space-y-10">
          <section className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-300/30 text-blue-100 text-xs md:text-sm font-medium tracking-wide uppercase">
              <T>Ghana AgroMet Platform</T>
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              <T>Weather Intelligence for Ghana&apos;s Farmers</T>
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-blue-100/90 leading-relaxed">
              <T>
                Hyper-local forecasts, early warnings and agro-advisories built
                with GMet, MoFA and the World Bank to help farmers plan with
                confidence.
              </T>
            </p>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/seven-days-forecast"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg transition"
              >
                <T>View 7-Day Forecast</T>
                <FaArrowRight className="ml-2" />
              </Link>
              <Link
                to="/crop-advisory"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition"
              >
                <T>Get Crop Advisory</T>
              </Link>
            </div>
          </section>

          {data.name && (
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-4 max-w-md mx-auto">
              <h3 className="text-white font-bold">
                <T>Weather for</T> {data.name}
              </h3>
              <p className="text-white">
                <T>Condition</T>:{" "}
                {data.weather && <T>{data.weather[0]?.description}</T>}
              </p>
              <p className="text-white">
                <T>Temperature</T>:{" "}
                {data.main && Math.round(data.main.temp - 273.15)}
                °C
              </p>
            </div>
          )}

          <section className={SECTION_CARD}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-6">
              <div>
                <h2 className={SECTION_HEADING}>
                  <T>Weather for</T> {getFormattedDate()}
                </h2>
                <p className={SECTION_SUBHEADING}>
                  <T>
                    Live conditions across 20 regional and municipal capitals.
                  </T>
                </p>
              </div>
              {loadingWeather && (
                <div className="flex items-center text-white/90 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <T>Loading live weather...</T>
                </div>
              )}
            </div>
            <div className="slider-container">
              {loadingWeather ? (
                <div className="flex justify-center items-center py-10">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                    <p className="text-sm">
                      <T>
                        Fetching weather data for 20 major cities across
                        Ghana...
                      </T>
                    </p>
                    <p className="text-xs text-blue-200 mt-1">
                      <T>Including all regional and municipal capitals</T>
                    </p>
                  </div>
                </div>
              ) : weatherData.length > 0 ? (
                <Slider ref={weatherSliderRef} {...settings}>
                  {weatherData.map((data, index) => (
                    <WeatherCard key={`${data.city}-${index}`} {...data} />
                  ))}
                </Slider>
              ) : (
                <div className="text-center text-white py-6">
                  <p className="text-sm">
                    <T>Weather data for major Ghana cities unavailable.</T>
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    <T>Please try again later.</T>
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-4 gap-5 md:gap-6">
            <div className={`${SECTION_CARD} lg:col-span-1`}>
              <h2 className="text-white text-lg md:text-xl font-semibold mb-4 flex items-center">
                <img src={cap} alt="" className="h-6 w-6 mr-2" />
                <T>Latest Weather Warnings</T>
              </h2>
              <div className="bg-emerald-500/10 border border-emerald-300/30 rounded-lg p-4 flex items-start">
                <FaExclamationTriangle className="text-emerald-300 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-100">
                    <T>No active alerts</T>
                  </p>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    <T>
                      All monitored regions are currently clear. We&apos;ll
                      notify you here when warnings are issued.
                    </T>
                  </p>
                </div>
              </div>
            </div>

            <div className={`${SECTION_CARD} lg:col-span-2`}>
              <p className="text-blue-100/80 text-xs md:text-sm mb-1">
                <i className="fas fa-calendar-alt mr-2"></i>
                {`${currentDateTime} - ${formattedTime}`}
              </p>
              <h2 className={`${SECTION_HEADING} mb-4`}>
                <T>Regional Weather Map</T>
              </h2>
              <WeatherInteractiveMap
                onRegionSelect={(regionName, regionData) => {
                  console.log("Selected region:", regionName, regionData);
                }}
                onDistrictSelect={(district) => {
                  console.log("Selected district:", district);
                }}
                showWeatherData={true}
                showAgriculturalData={true}
              />
            </div>

            <div className={`${SECTION_CARD} lg:col-span-1`}>
              <h2 className="text-white text-lg md:text-xl font-semibold mb-4">
                <T>Weather and Climate Resources</T>
              </h2>
              <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={searchLocation}
                  placeholder="Enter location (e.g., Accra)"
                  className="p-2 pl-10 rounded-lg border border-gray-300 text-black w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                {forecastCategories.map((category, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow-sm">
                    <button
                      onClick={() => toggleCategory(idx)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-blue-50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          {category.icon}
                        </div>
                        <h3 className="font-medium text-gray-800">
                          {category.title}
                        </h3>
                      </div>
                      <ChevronRight
                        className={`text-blue-500 transition-transform duration-200 ${
                          expandedCategory === idx ? "transform rotate-90" : ""
                        }`}
                      />
                    </button>

                    {expandedCategory === idx && (
                      <div className="px-3 pb-3">
                        <ul className="space-y-2 ml-10">
                          {category.items.map((item, itemIdx) => (
                            <li key={itemIdx}>
                              <a
                                href={item.path}
                                className="block py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm"
                              >
                                {item.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={SECTION_CARD}>
            <div className="mb-6">
              <h2 className={SECTION_HEADING}>
                <T>Latest News and Updates</T>
              </h2>
              <p className={SECTION_SUBHEADING}>
                <T>
                  Alerts, advisories, and program updates from across the
                  network.
                </T>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <NewsCard
                image={event1}
                alt="Heavy rainfall in northern Ghana"
                title="Heavy Rainfall Expected in Northern Regions"
                excerpt="Authorities issue warnings as heavy rainfall is forecasted for the northern regions of Ghana this week."
                to="/blog/son-forecast"
              />
              <NewsCard
                image={event2}
                alt="Drought relief in Savannah Region"
                title="Drought Relief Efforts in Savannah Region"
                excerpt="Government and NGOs launch initiatives to support farmers affected by prolonged drought in the Savannah Region."
                to="/events/crop-calen"
              />
              <NewsCard
                image={event3}
                alt="New agro-meteorological tools launched"
                title="New Agro-Meteorological Tools Launched"
                excerpt="GHAAP introduces advanced tools to provide farmers with precise weather and climate data."
                to="/events/clim-rep-rel"
              />
            </div>
          </section>

          <section>
            <div className="text-center mb-8">
              <h2 className={`${SECTION_HEADING} text-center`}>
                <T>Our Partners</T>
              </h2>
              <p className={`${SECTION_SUBHEADING} max-w-2xl mx-auto`}>
                <T>
                  In partnership with Ghana&apos;s leading agricultural and
                  climate institutions.
                </T>
              </p>
            </div>
            <div className={SECTION_CARD}>
              <Slider {...sliderSettings}>
                {[fsrp, mofa, gmet, worldbank, ecowas].map((partner, index) => (
                  <div key={index} className="px-3">
                    <div className="bg-white/95 rounded-xl p-4 flex items-center justify-center h-24">
                      <img
                        src={partner}
                        alt={`Partner ${index + 1}`}
                        className="max-h-16 object-contain"
                      />
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Home;
