import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Bird,
  Camera,
  ChevronRight,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Map,
  RefreshCw,
  Search,
  ShoppingCart,
  Sprout,
  Thermometer,
  Wheat,
  Wind,
} from "lucide-react";
import PageTitle from "../components/PageTitle";
import WeatherInteractiveMap from "../components/WeatherInteractiveMap";
import AnimatedWeatherIcon from "../components/AnimatedWeatherIcon";
import thermometer from "../assets/images/thermometer.svg";
import event1 from "../assets/images/event1.jpg";
import event2 from "../assets/images/event2.png";
import event3 from "../assets/images/event3.jpg";
import mofa from "../assets/icons/mofa.png";
import ecowas from "../assets/icons/ecowas.png";
import worldbank from "../assets/icons/worldbank.png";
import fsrp from "../assets/icons/fsrp.png";
import gmet from "../assets/icons/gmet.png";
import cap from "../assets/icons/CAP.png";
import logo from "../assets/images/agromet-high-resolution-logo-transparent.png";
import T from "../components/common/T";
import { SkeletonBlock } from "../components/common/SkeletonLoading";
import useT from "../hooks/useT";
import {
  getWeatherBundleByCoordinates,
  getWeatherBundlesByCoordinates,
  getWeatherForLocationName,
  OPEN_METEO_SOURCE,
} from "../services/openMeteoService";

const SECTION_CARD = "neo-panel";

const SECTION_HEADING =
  "text-neo-text text-2xl md:text-3xl font-semibold tracking-tight";

const SECTION_SUBHEADING = "text-neo-muted text-sm md:text-base mt-1";

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

const mapWeatherCondition = (condition) => {
  const conditionMap = {
    "Cloudy, Sunny Intervals": "partly cloudy",
    "Rains, Sunny Intervals": "light rain",
    "Sunny Intervals": "sunny intervals",
    "Sunny Intervals, Showers": "light rain",
  };

  const normalized = String(condition || "").toLowerCase();
  if (normalized.includes("thunder")) return "thunderstorm";
  if (
    normalized.includes("rain") ||
    normalized.includes("drizzle") ||
    normalized.includes("shower")
  ) {
    return "light rain";
  }
  if (normalized.includes("cloud") || normalized.includes("fog")) {
    return "partly cloudy";
  }
  if (normalized.includes("sun") || normalized.includes("clear")) {
    return "sunny intervals";
  }

  return conditionMap[condition] || "sunny intervals";
};

const WeatherIcon = ({ condition }) => {
  const mappedCondition = mapWeatherCondition(condition);

  return (
    <div className="flex items-center justify-center">
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

const getUpdatedStamp = (timestamp) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSixHourlyUpdatedDate = (date = new Date()) => {
  const updatedAt = new Date(date);
  updatedAt.setMinutes(0, 0, 0);
  updatedAt.setHours(Math.floor(updatedAt.getHours() / 6) * 6);
  return updatedAt;
};

const getNextSixHourlyDelay = () => {
  const now = new Date();
  const nextUpdate = getSixHourlyUpdatedDate(now);
  nextUpdate.setHours(nextUpdate.getHours() + 6);
  return Math.max(1000, nextUpdate.getTime() - now.getTime() + 1000);
};

const useSixHourlyUpdatedDate = () => {
  const [updatedAt, setUpdatedAt] = useState(() => getSixHourlyUpdatedDate());

  useEffect(() => {
    let timeoutId;

    const scheduleNextUpdate = () => {
      timeoutId = window.setTimeout(() => {
        setUpdatedAt(getSixHourlyUpdatedDate());
        scheduleNextUpdate();
      }, getNextSixHourlyDelay());
    };

    scheduleNextUpdate();
    return () => window.clearTimeout(timeoutId);
  }, []);

  return updatedAt;
};

const formatCardTemp = (value) =>
  Number.isFinite(Number(value)) ? `${Math.round(Number(value))}\u00B0C` : "--";

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 10 * 60 * 1000,
};

const GEOLOCATION_STATUS = {
  IDLE: "idle",
  REQUESTING: "requesting",
  READY: "ready",
  DENIED: "denied",
  UNAVAILABLE: "unavailable",
  ERROR: "error",
};

const NEARBY_GHANA_CITY_THRESHOLD_KM = 35;
const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (Number(degrees) * Math.PI) / 180;

const getDistanceKm = (from, to) => {
  const fromLat = Number(from.lat);
  const fromLng = Number(from.lng);
  const toLat = Number(to.lat);
  const toLng = Number(to.lng);

  if (
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLng) ||
    !Number.isFinite(toLat) ||
    !Number.isFinite(toLng)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const latitudeDelta = toRadians(toLat - fromLat);
  const longitudeDelta = toRadians(toLng - fromLng);
  const fromLatitude = toRadians(fromLat);
  const toLatitude = toRadians(toLat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

const getNearestKnownGhanaCity = (cities, coordinates) => {
  const nearest = cities.reduce(
    (best, city) => {
      const distanceKm = getDistanceKm(coordinates, city);
      return distanceKm < best.distanceKm ? { city, distanceKm } : best;
    },
    { city: null, distanceKm: Number.POSITIVE_INFINITY },
  );

  return nearest.distanceKm <= NEARBY_GHANA_CITY_THRESHOLD_KM
    ? nearest.city
    : null;
};

const formatWeatherDataForCard = (
  weatherBundle,
  city,
  type = "Open-Meteo forecast",
  region = "",
) => {
  const today = weatherBundle.daily[0] || {};
  const current = weatherBundle.current;
  const raw = weatherBundle.raw || {};

  return {
    city,
    condition: current.condition,
    minTemp: today.lowTemp ?? current.temperatureValue,
    maxTemp: today.highTemp ?? current.temperatureValue,
    type,
    region,
    summary: current.conversationalSummary || current.summary,
    humidity: current.humidityValue,
    windSpeed: current.windSpeedValue,
    feelsLike: current.apparentTemperatureValue,
    source: OPEN_METEO_SOURCE,
    updatedAt: getUpdatedStamp(current.updatedAt),
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
  };
};

const formatWeatherDataForCity = (cityData, weatherBundle) =>
  formatWeatherDataForCard(
    weatherBundle,
    cityData.name,
    cityData.type,
    cityData.region,
  );

const WeatherCard = ({
  city,
  condition,
  minTemp,
  maxTemp,
  type,
  humidity,
  windSpeed,
  feelsLike,
}) => (
  <div className="neo-surface-soft mx-2 flex min-h-44 min-w-0 flex-col justify-between px-4 py-4 text-left">
    <div>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-neo-text sm:text-base">
            {city}
          </h3>
          <p className="truncate text-xs text-neo-muted">
            <T>{type}</T>
          </p>
        </div>
        <WeatherIcon condition={condition} />
      </div>
      <p className="mb-3 truncate text-xs font-medium text-neo-muted sm:text-sm">
        <T>{condition}</T>
      </p>
    </div>

    <div className="space-y-2 text-xs text-neo-muted">
      <div className="flex items-center gap-2 text-neo-text">
        <img
          className="flex-shrink-0"
          src={thermometer}
          alt=""
          height="20"
          width="20"
        />
        <span>
          <T>Min</T>: {formatCardTemp(minTemp)} | <T>Max</T>:{" "}
          {formatCardTemp(maxTemp)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Thermometer className="h-3.5 w-3.5 text-neo-accent-strong" />
        <span>
          <T>Feels</T>: {formatCardTemp(feelsLike)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <span className="flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5 text-neo-teal" />
          {humidity ?? "--"}%
        </span>
        <span className="flex items-center gap-1">
          <Wind className="h-3.5 w-3.5 text-neo-accent" />
          {windSpeed ?? "--"} km/h
        </span>
      </div>
    </div>
  </div>
);

WeatherCard.propTypes = {
  city: PropTypes.string.isRequired,
  condition: PropTypes.string.isRequired,
  minTemp: PropTypes.number,
  maxTemp: PropTypes.number,
  type: PropTypes.string.isRequired,
  humidity: PropTypes.number,
  windSpeed: PropTypes.number,
  feelsLike: PropTypes.number,
  source: PropTypes.string,
};

const ActionCard = ({ to, label, description, Icon, tone }) => {
  const toneClasses = {
    accent: "bg-neo-accent text-white",
    teal: "bg-neo-teal text-white",
    warning: "bg-neo-warning text-white",
    surface: "bg-neo-bg text-neo-accent-strong shadow-neo-pressed",
  };

  return (
    <Link
      to={to}
      className="neo-surface-soft group flex min-h-[118px] min-w-0 flex-col justify-between p-3 transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-neo-focus/25 sm:min-h-[132px] sm:p-4"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <span
          className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${
            toneClasses[tone] || toneClasses.accent
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-neo-muted transition group-hover:translate-x-1 group-hover:text-neo-accent-strong sm:h-5 sm:w-5" />
      </div>
      <div>
        <h3 className="mt-3 break-words text-sm font-semibold leading-snug text-neo-text sm:mt-4 sm:text-base">
          <T>{label}</T>
        </h3>
        <p className="mt-1 break-words text-xs leading-snug text-neo-muted sm:text-sm sm:leading-relaxed">
          <T>{description}</T>
        </p>
      </div>
    </Link>
  );
};

ActionCard.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  Icon: PropTypes.elementType.isRequired,
  tone: PropTypes.string.isRequired,
};

const ResourceGroup = ({ category, expanded, onToggle }) => (
  <div className="neo-surface-soft p-1">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-full p-3 text-left transition-colors hover:bg-white/55 focus:outline-none focus-visible:ring-4 focus-visible:ring-neo-focus/25"
      aria-expanded={expanded}
    >
      <div className="flex min-w-0 items-center">
        <div className="neo-icon-button mr-3 h-10 w-10 flex-shrink-0">
          {category.icon}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-medium text-neo-text">
            <T>{category.title}</T>
          </h3>
          <p className="truncate text-xs text-neo-muted">
            <T>{category.summary}</T>
          </p>
        </div>
      </div>
      <ChevronRight
        className={`h-5 w-5 flex-shrink-0 text-neo-accent transition-transform duration-200 ${
          expanded ? "rotate-90" : ""
        }`}
      />
    </button>

    {expanded && (
      <div className="px-3 pb-3">
        <ul className="ml-10 space-y-2">
          {category.items.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="block rounded-full px-3 py-2 text-sm text-neo-muted transition-colors hover:bg-white/60 hover:text-neo-accent-strong focus:outline-none focus-visible:ring-4 focus-visible:ring-neo-focus/25"
              >
                <T>{item.name}</T>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

ResourceGroup.propTypes = {
  category: PropTypes.shape({
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const NewsCard = ({ image, alt, title, excerpt, to }) => {
  const { t } = useT();

  return (
    <article className="neo-surface-soft group flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5">
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={t(alt)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex min-w-0 flex-grow flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug text-neo-accent-strong">
          <T>{title}</T>
        </h3>
        <p className="mt-2 flex-grow text-sm leading-relaxed text-neo-muted">
          <T>{excerpt}</T>
        </p>
        <Link
          to={to}
          className="mt-4 inline-flex items-center font-semibold text-neo-accent-strong hover:text-neo-teal focus:outline-none focus-visible:ring-4 focus-visible:ring-neo-focus/25"
        >
          <T>Read More</T>
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </article>
  );
};

NewsCard.propTypes = {
  image: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  excerpt: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};

const Home = () => {
  const { t } = useT();
  const [data, setData] = useState({});
  const [location, setLocation] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [weatherData, setWeatherData] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [featuredLocationWeather, setFeaturedLocationWeather] = useState(null);
  const [featuredLocationStatus, setFeaturedLocationStatus] = useState(
    GEOLOCATION_STATUS.IDLE,
  );
  const sixHourlyUpdatedAt = useSixHourlyUpdatedDate();

  const weatherSliderRef = useRef(null);
  const isHomeMountedRef = useRef(false);
  const featuredLocationRequestStartedRef = useRef(false);

  const ghanaCities = useMemo(
    () => [
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
    ],
    [],
  );

  const forecastCategories = [
    {
      title: "Weather Forecasts",
      summary: "Daily, weekly, seasonal outlooks",
      icon: <Cloud className="text-neo-teal" />,
      items: [
        { name: "Weekly Forecast", path: "/7-days-forecast" },
        {
          name: "Subseasonal to Seasonal Forecast",
          path: "/subseasonal-forecast",
        },
        { name: "Seasonal Forecast", path: "/seasonal-forecast" },
      ],
    },
    {
      title: "Environmental Monitoring",
      summary: "Flood and drought risk bulletins",
      icon: <BarChart2 className="text-neo-accent" />,
      items: [
        { name: "Flood and Drought Bulletins", path: "/flood-drought" },
      ],
    },
    {
      title: "Agricultural Resources",
      summary: "Crop calendars and advisories",
      icon: <Wheat className="text-neo-warning" />,
      items: [
        { name: "Agrometeorological Bulletins", path: "/agro-bulletins" },
        { name: "Crop Calendar", path: "/crop-calendar" },
        { name: "Crop Advisories", path: "/crop-advisory" },
      ],
    },
    {
      title: "Livestock Management",
      summary: "Poultry calendars and guidance",
      icon: <Bird className="text-neo-accent-strong" />,
      items: [
        { name: "Poultry Calendar", path: "/poultry-calendar" },
        { name: "Poultry Advisories", path: "/poultry-advisory" },
      ],
    },
  ];

  const primaryActions = [
    {
      to: "/7-days-forecast",
      label: "Check Forecast",
      description: "7-day outlook.",
      Icon: CloudSun,
      tone: "accent",
    },
    {
      to: "/agro-advisory",
      label: "Agromet Advisory",
      description: "Crop guidance.",
      Icon: Sprout,
      tone: "teal",
    },
    {
      to: "/crop-diagnose",
      label: "Diagnose Crop",
      description: "Check crop stress.",
      Icon: Camera,
      tone: "warning",
    },
    {
      to: "/market-page",
      label: "Market Prices",
      description: "Commodity signals.",
      Icon: ShoppingCart,
      tone: "surface",
    },
  ];

  const partnerLogos = [
    { src: fsrp, label: "FSRP" },
    { src: mofa, label: "Ministry of Food and Agriculture" },
    { src: gmet, label: "GMet" },
    { src: worldbank, label: "World Bank" },
    { src: ecowas, label: "ECOWAS" },
  ];

  const featuredWeather = useMemo(
    () => {
      if (
        featuredLocationStatus === GEOLOCATION_STATUS.READY &&
        featuredLocationWeather
      ) {
        return featuredLocationWeather;
      }

      return (
        weatherData.find((item) => item.city === "Accra") ||
        weatherData[0] ||
        null
      );
    },
    [featuredLocationStatus, featuredLocationWeather, weatherData],
  );
  const activeCapAlert = null;
  const hasActiveCapAlert = Boolean(activeCapAlert);

  const syncWeatherSliderAccessibility = useCallback(() => {
    updateSliderAccessibility(weatherSliderRef);
  }, []);

  const weatherCarouselSettings = {
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
      { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  const toggleCategory = (index) => {
    setExpandedCategory((current) => (current === index ? null : index));
  };

  const getUnavailableWeatherForCity = (cityData, errorMessage) => {
    return {
      city: cityData.name,
      condition: "Weather unavailable",
      minTemp: null,
      maxTemp: null,
      type: cityData.type,
      region: cityData.region,
      summary: errorMessage || "Open-Meteo data could not be loaded.",
      humidity: null,
      windSpeed: null,
      feelsLike: null,
      source: `${OPEN_METEO_SOURCE} unavailable`,
      updatedAt: getUpdatedStamp(sixHourlyUpdatedAt),
    };
  };

  const loadAllCitiesWeather = async () => {
    setLoadingWeather(true);
    try {
      const weatherBundles = await getWeatherBundlesByCoordinates(
        ghanaCities,
        { forecastDays: 7, timeoutMs: 8000 },
      );
      const weatherDataArray = ghanaCities.map((city, index) =>
        weatherBundles[index]
          ? formatWeatherDataForCity(city, weatherBundles[index])
          : getUnavailableWeatherForCity(city),
      );

      setWeatherData(weatherDataArray);
    } catch (error) {
      setWeatherData(
        ghanaCities.map((city) =>
          getUnavailableWeatherForCity(city, error.message),
        ),
      );
    } finally {
      setLoadingWeather(false);
    }
  };

  const searchLocation = async (event) => {
    event.preventDefault();
    const trimmedLocation = location.trim();
    if (!trimmedLocation) return;

    setIsSearching(true);
    setSearchError("");

    try {
      const result = await getWeatherForLocationName(trimmedLocation, {
        forecastDays: 1,
      });

      setData({
        name: result.location.name,
        region: result.location.admin1,
        country: result.location.country,
        current: result.current,
      });
    } catch (error) {
      setSearchError(error.message || "Could not fetch weather data. Try another location.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadAllCitiesWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    isHomeMountedRef.current = true;

    return () => {
      isHomeMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (featuredLocationRequestStartedRef.current) return;
    featuredLocationRequestStartedRef.current = true;

    if (!navigator.geolocation) {
      setFeaturedLocationStatus(GEOLOCATION_STATUS.UNAVAILABLE);
      return;
    }

    setFeaturedLocationStatus(GEOLOCATION_STATUS.REQUESTING);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const coordinates = {
            lat: coords.latitude,
            lng: coords.longitude,
          };
          const weatherBundle = await getWeatherBundleByCoordinates(
            coordinates.lat,
            coordinates.lng,
            { forecastDays: 1, timeoutMs: 8000, timezone: "auto" },
          );

          if (!isHomeMountedRef.current) return;

          const nearbyCity = getNearestKnownGhanaCity(
            ghanaCities,
            coordinates,
          );
          const locationName = nearbyCity?.name || "Current location";
          const locationType =
            nearbyCity?.type ||
            weatherBundle.raw?.timezone ||
            "Open-Meteo coordinates";
          const locationRegion =
            nearbyCity?.region || weatherBundle.raw?.timezone || "";

          setFeaturedLocationWeather(
            formatWeatherDataForCard(
              weatherBundle,
              locationName,
              locationType,
              locationRegion,
            ),
          );
          setFeaturedLocationStatus(GEOLOCATION_STATUS.READY);
        } catch {
          if (!isHomeMountedRef.current) return;

          setFeaturedLocationWeather(null);
          setFeaturedLocationStatus(GEOLOCATION_STATUS.ERROR);
        }
      },
      (error) => {
        if (!isHomeMountedRef.current) return;

        setFeaturedLocationWeather(null);
        setFeaturedLocationStatus(
          error.code === 1
            ? GEOLOCATION_STATUS.DENIED
            : GEOLOCATION_STATUS.UNAVAILABLE,
        );
      },
      GEOLOCATION_OPTIONS,
    );
  }, [ghanaCities]);

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

  return (
    <>
      <PageTitle
        title="Home - Agricultural Information Services for Ghana"
        includeAppName={false}
      />
      <div className="neo-page relative">
        <main className="container relative mx-auto space-y-8 px-4 pb-10 pt-28 sm:px-6 md:space-y-10 md:pt-32 lg:px-8 lg:pt-36">
          <section className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
            <div className="neo-surface min-w-0 p-5 md:p-7 lg:col-span-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <div className="mb-5 inline-flex max-w-full items-center gap-3 rounded-full bg-neo-bg px-4 py-2 shadow-neo-pressed">
                    <img
                      src={logo}
                      alt="AgroMet"
                      className="h-8 w-auto flex-shrink-0 object-contain"
                    />
                    <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-neo-accent-strong">
                      <T>Ghana AgroMet Operations</T>
                    </span>
                  </div>
                  <h1 className="break-words text-3xl font-bold leading-tight tracking-tight text-neo-text md:text-5xl">
                    <T>Farm weather at a glance</T>
                  </h1>
                  <p className="mt-4 max-w-2xl break-words text-base leading-relaxed text-neo-muted md:text-lg">
                    <T>
                      Alerts, local weather, advisories, prices, and map access
                      in one place.
                    </T>
                  </p>
                </div>

                <div className="neo-inset min-w-0 p-4 lg:min-w-[220px]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neo-muted">
                    <T>Dashboard Time</T>
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-neo-text">
                    {formattedTime || "--:--"}
                  </p>
                  <p className="text-sm text-neo-muted">
                    {currentDateTime || getFormattedDate()}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div
                  className={`neo-surface-soft min-w-0 p-4 md:p-5 ${
                    hasActiveCapAlert ? "" : "hidden md:block"
                  }`}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-neo-bg shadow-neo-pressed">
                      <img src={cap} alt="" className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neo-muted">
                        <T>Alert Status</T>
                      </p>
                      <h2 className="mt-1 break-words text-xl font-semibold text-neo-text">
                        <T>No active severe weather alerts</T>
                      </h2>
                      <p className="mt-2 break-words text-sm leading-relaxed text-neo-muted">
                        <T>
                          No warnings are active. New alerts appear here first.
                        </T>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="neo-inset p-3">
                      <AlertTriangle className="mb-2 h-5 w-5 text-neo-accent" />
                      <p className="text-xs text-neo-muted">
                        <T>Severity</T>
                      </p>
                      <p className="font-semibold text-neo-text">
                        <T>Normal</T>
                      </p>
                    </div>
                    <div className="neo-inset p-3">
                      <CloudRain className="mb-2 h-5 w-5 text-neo-teal" />
                      <p className="text-xs text-neo-muted">
                        <T>Risk Window</T>
                      </p>
                      <p className="font-semibold text-neo-text">
                        <T>Today</T>
                      </p>
                    </div>
                    <div className="neo-inset p-3">
                      <RefreshCw className="mb-2 h-5 w-5 text-neo-accent-strong" />
                      <p className="text-xs text-neo-muted">
                        <T>Checked</T>
                      </p>
                      <p className="font-semibold text-neo-text">
                        {formattedTime || "--:--"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 break-words text-xs text-neo-muted">
                    <T>Updated</T> {getUpdatedStamp(sixHourlyUpdatedAt)}
                  </p>
                </div>

                <div className="neo-surface-soft min-w-0 p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neo-muted">
                        <T>Location Check</T>
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-neo-text">
                        <T>Search local weather</T>
                      </h2>
                    </div>
                    <Search className="h-6 w-6 text-neo-accent-strong" />
                  </div>

                  <form
                    onSubmit={searchLocation}
                    className="flex flex-col gap-2 sm:flex-row"
                  >
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neo-muted" />
                      <input
                        type="text"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder={t("Enter location, e.g. Accra")}
                        className="neo-input pl-10 text-sm"
                        aria-label={t("Search weather by location")}
                      />
                    </div>
                    <button
                      type="submit"
                      className="neo-button-primary min-h-0 w-full px-4 py-2 text-sm sm:w-auto"
                      disabled={isSearching}
                    >
                      {isSearching ? <T>Checking</T> : <T>Search</T>}
                    </button>
                  </form>

                  {searchError && (
                    <p className="mt-3 rounded-full bg-red-50 px-3 py-2 text-sm text-red-700">
                      <T>{searchError}</T>
                    </p>
                  )}

                  {data.name ? (
                    <div className="neo-inset mt-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-neo-muted">
                            <T>Weather for</T>
                          </p>
                          <h3 className="text-xl font-semibold text-neo-text">
                            {data.name}
                          </h3>
                          {(data.region || data.country) && (
                            <p className="text-xs text-neo-muted">
                              {[data.region, data.country]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        <Thermometer className="h-6 w-6 text-neo-accent" />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-neo-muted">
                            <T>Condition</T>
                          </p>
                          <p className="font-semibold capitalize text-neo-text">
                            <T>{data.current?.condition}</T>
                          </p>
                        </div>
                        <div>
                          <p className="text-neo-muted">
                            <T>Temperature</T>
                          </p>
                          <p className="font-semibold text-neo-text">
                            {data.current?.temperature}
                          </p>
                        </div>
                        <div>
                          <p className="text-neo-muted">
                            <T>Feels Like</T>
                          </p>
                          <p className="font-semibold text-neo-text">
                            {data.current?.apparentTemperature}
                          </p>
                        </div>
                        <div>
                          <p className="text-neo-muted">
                            <T>Rain</T>
                          </p>
                          <p className="font-semibold text-neo-text">
                            {data.current?.rainfall}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-neo-muted">
                        <T>{data.current?.conversationalSummary}</T>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-neo bg-white/45 p-4 text-sm leading-relaxed text-neo-muted">
                      <T>
                        Quick town check before forecasts or the map.
                      </T>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="neo-surface min-w-0 p-5 md:p-6 lg:col-span-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neo-muted">
                    <T>Immediate Actions</T>
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-neo-text">
                    <T>Quick tools</T>
                  </h2>
                </div>
                <a
                  href="#regional-map"
                  className="neo-icon-button h-11 w-11"
                  aria-label={t("Jump to regional weather map")}
                >
                  <Map className="h-5 w-5" />
                </a>
              </div>

              {featuredWeather && (
                <div className="neo-inset mt-5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-neo-muted">
                        <T>Featured forecast</T>
                      </p>
                      <h3 className="text-xl font-semibold text-neo-text">
                        {featuredWeather.city}
                      </h3>
                      {featuredLocationStatus ===
                        GEOLOCATION_STATUS.REQUESTING && (
                        <p className="mt-1 text-xs text-neo-muted">
                          <T>Detecting your location...</T>
                        </p>
                      )}
                    </div>
                    <WeatherIcon condition={featuredWeather.condition} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-neo bg-white/50 p-2">
                      <p className="text-neo-muted">
                        <T>Min</T>
                      </p>
                      <p className="font-semibold text-neo-text">
                        {formatCardTemp(featuredWeather.minTemp)}
                      </p>
                    </div>
                    <div className="rounded-neo bg-white/50 p-2">
                      <p className="text-neo-muted">
                        <T>Max</T>
                      </p>
                      <p className="font-semibold text-neo-text">
                        {formatCardTemp(featuredWeather.maxTemp)}
                      </p>
                    </div>
                    <div className="rounded-neo bg-white/50 p-2">
                      <p className="text-neo-muted">
                        <T>Feels</T>
                      </p>
                      <p className="font-semibold text-neo-text">
                        {formatCardTemp(featuredWeather.feelsLike)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-neo-muted">
                    <T>{featuredWeather.summary}</T>
                  </p>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
                {primaryActions.map((action) => (
                  <ActionCard key={action.to} {...action} />
                ))}
              </div>
            </aside>
          </section>

          <section className={SECTION_CARD}>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={SECTION_HEADING}>
                  <T>Weather for</T> {getFormattedDate()}
                </h2>
                <p className={SECTION_SUBHEADING}>
                  <T>
                    Major Ghana cities.
                  </T>
                </p>
              </div>
              <div className="text-xs text-neo-muted sm:text-right">
                <p>
                  <T>Updated</T> {getUpdatedStamp(sixHourlyUpdatedAt)}
                </p>
              </div>
            </div>
            <div className="slider-container">
              {loadingWeather ? (
                <div className="grid gap-4 py-2 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`home-weather-skeleton-${index}`} className="neo-surface-soft p-4">
                      <SkeletonBlock className="mb-4 h-5 w-28" tone="neo" />
                      <SkeletonBlock className="mx-auto mb-4 h-16 w-16" rounded="rounded-full" tone="neo" />
                      <SkeletonBlock className="mx-auto mb-3 h-7 w-20" tone="neo" />
                      <SkeletonBlock className="mx-auto h-4 w-32" tone="neo" />
                    </div>
                  ))}
                </div>
              ) : weatherData.length > 0 ? (
                <Slider ref={weatherSliderRef} {...weatherCarouselSettings}>
                  {weatherData.map((weatherItem, index) => (
                    <WeatherCard
                      key={`${weatherItem.city}-${index}`}
                      {...weatherItem}
                    />
                  ))}
                </Slider>
              ) : (
                <div className="py-6 text-center text-neo-muted">
                  <p className="text-sm text-neo-text">
                    <T>Weather data for major Ghana cities unavailable.</T>
                  </p>
                  <p className="mt-1 text-xs text-neo-muted">
                    <T>Please try again later.</T>
                  </p>
                </div>
              )}
            </div>
          </section>

          <section id="regional-map" className={SECTION_CARD}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={SECTION_HEADING}>
                  <T>Regional Weather Map</T>
                </h2>
                <p className={SECTION_SUBHEADING}>
                  <T>
                    Select a district area for local context.
                  </T>
                </p>
              </div>
              <div className="text-xs text-neo-muted sm:text-right">
                <p>
                  <T>Updated</T> {getUpdatedStamp(sixHourlyUpdatedAt)}
                </p>
              </div>
            </div>
            <WeatherInteractiveMap
              updatedAt={sixHourlyUpdatedAt}
              onRegionSelect={(regionName, regionData) => {
                console.log("Selected region:", regionName, regionData);
              }}
              onDistrictSelect={(district) => {
                console.log("Selected district:", district);
              }}
              showWeatherData={true}
              showAgriculturalData={true}
            />
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
            <div className={`${SECTION_CARD} lg:col-span-5`}>
              <div className="mb-5">
                <h2 className={SECTION_HEADING}>
                  <T>Weather and Climate Resources</T>
                </h2>
                <p className={SECTION_SUBHEADING}>
                  <T>
                    Forecasts, bulletins, calendars, and advisories.
                  </T>
                </p>
              </div>
              <div className="space-y-3">
                {forecastCategories.map((category, index) => (
                  <ResourceGroup
                    key={category.title}
                    category={category}
                    expanded={expandedCategory === index}
                    onToggle={() => toggleCategory(index)}
                  />
                ))}
              </div>
            </div>

            <div className={`${SECTION_CARD} lg:col-span-7`}>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className={SECTION_HEADING}>
                    <T>Latest News and Updates</T>
                  </h2>
                  <p className={SECTION_SUBHEADING}>
                    <T>
                      Recent advisories and updates.
                    </T>
                  </p>
                </div>
                <Link
                  to="/news-updates"
                  className="neo-button min-h-0 px-4 py-2 text-sm"
                >
                  <T>View Updates</T>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <NewsCard
                  image={event1}
                  alt="Heavy rainfall in northern Ghana"
                  title="Heavy Rainfall Expected in Northern Regions"
                  excerpt="Authorities issue warnings as heavy rainfall is forecasted for the northern regions of Ghana this week."
                  to="/news-updates"
                />
                <NewsCard
                  image={event2}
                  alt="Drought relief in Savannah Region"
                  title="Drought Relief Efforts in Savannah Region"
                  excerpt="Government and NGOs launch initiatives to support farmers affected by prolonged drought in the Savannah Region."
                  to="/flood-drought"
                />
                <NewsCard
                  image={event3}
                  alt="New agro-meteorological tools launched"
                  title="New Agro-Meteorological Tools Launched"
                  excerpt="GHAAP introduces advanced tools to provide farmers with precise weather and climate data."
                  to="/agro-bulletins"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-8 text-center">
              <h2 className={`${SECTION_HEADING} text-center`}>
                <T>Our Partners</T>
              </h2>
              <p className={`${SECTION_SUBHEADING} mx-auto max-w-2xl`}>
                <T>
                  In partnership with Ghana&apos;s leading agricultural and climate
                  institutions.
                </T>
              </p>
            </div>
            <div className={`${SECTION_CARD} mx-auto max-w-4xl`}>
              <Slider {...sliderSettings}>
                {partnerLogos.map((partner) => (
                  <div key={partner.label} className="px-3">
                    <div className="neo-surface-soft flex h-24 items-center justify-center p-4">
                      <img
                        src={partner.src}
                        alt={partner.label}
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
