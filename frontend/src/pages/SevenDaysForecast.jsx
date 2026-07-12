import { useState, useEffect, useRef } from "react";
import {
  Wind,
  Droplet,
  Thermometer,
  MapPin,
  CloudRain,
  Search,
} from "lucide-react";
import PageTitle from "../components/PageTitle";
import Breadcrumb from "../components/common/Breadcrumb";
import T from "../components/common/T";
import AnimatedWeatherIcon from "../components/AnimatedWeatherIcon";
import { ForecastSkeleton } from "../components/common/SkeletonLoading";
import {
  geocodeLocation,
  getWeatherBundleByCoordinates,
} from "../services/openMeteoService";

const FORECAST_LOCATION_STORAGE_KEY = "agrometForecastLocation";
const AUTO_LOCATION_TIMEZONE = "auto";
const REVERSE_GEOCODING_ENDPOINT =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

const formatUpdatedTime = (timestamp) => {
  const date = timestamp ? new Date(timestamp) : new Date();

  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toForecastLocation = (location) => {
  const lat = Number(location.latitude ?? location.lat);
  const lng = Number(location.longitude ?? location.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const region = location.admin1 || location.region || "";
  const looksLikeCoordinates = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(region);

  return {
    city: location.name || location.city || "Current location",
    region: looksLikeCoordinates ? "" : region,
    country: location.country || "",
    lat,
    lng,
    timezone: location.timezone || AUTO_LOCATION_TIMEZONE,
  };
};

const getStoredForecastLocation = () => {
  if (typeof window === "undefined") return null;

  try {
    const storedLocation = JSON.parse(
      window.localStorage.getItem(FORECAST_LOCATION_STORAGE_KEY)
    );
    return toForecastLocation(storedLocation || {});
  } catch {
    return null;
  }
};

const saveForecastLocation = (location) => {
  if (typeof window === "undefined" || !location) return;
  window.localStorage.setItem(
    FORECAST_LOCATION_STORAGE_KEY,
    JSON.stringify(location)
  );
};

const getBrowserPosition = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Browser location is not available."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 15 * 60 * 1000,
      timeout: 10000,
    });
  });

const reverseGeocodeLocation = async (lat, lng) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 7000);
  const url = new URL(REVERSE_GEOCODING_ENDPOINT);

  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("localityLanguage", "en");

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Reverse geocoding failed.");
    }

    const place = await response.json();
    const townName =
      place.locality ||
      place.city ||
      place.principalSubdivision ||
      place.countryName ||
      "Current location";

    return toForecastLocation({
      city: townName,
      region:
        townName === place.principalSubdivision
          ? ""
          : place.principalSubdivision,
      country: place.countryName,
      lat,
      lng,
      timezone: AUTO_LOCATION_TIMEZONE,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const getNamedLocationFromCoordinates = async (lat, lng) => {
  try {
    const namedLocation = await reverseGeocodeLocation(lat, lng);
    if (namedLocation) return namedLocation;
  } catch (error) {
    console.warn("Could not resolve town name for current location:", error);
  }

  return toForecastLocation({
    city: "Current location",
    lat,
    lng,
    timezone: AUTO_LOCATION_TIMEZONE,
  });
};

const toForecastDisplay = (weatherBundle) =>
  weatherBundle.daily.slice(0, 7).map((day, index) => ({
    day: day.day,
    date: day.displayDate,
    high: day.highTemp ?? 0,
    low: day.lowTemp ?? 0,
    feelsLike:
      index === 0
        ? weatherBundle.current.apparentTemperatureValue
        : day.apparentHighTemp ?? day.highTemp ?? 0,
    condition:
      index === 0
        ? weatherBundle.current.conditionSlug
        : day.conditionSlug,
    conditionText:
      index === 0
        ? weatherBundle.current.condition
        : day.condition,
    summary:
      index === 0
        ? weatherBundle.current.conversationalSummary
        : day.summary,
    humidity: day.humidity || weatherBundle.current.humidityValue || 0,
    rainChance: day.rainChance || 0,
    windSpeed: day.windSpeed || 0,
    hourly: weatherBundle.hourly[day.date] || [],
  }));

const SevenDaysForecast = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [tempUnit, setTempUnit] = useState("celsius"); // celsius or fahrenheit
  const [location, setLocation] = useState(null);
  const [townSearch, setTownSearch] = useState("");
  const [searchingTown, setSearchingTown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationAttempted, setLocationAttempted] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  const [forecastError, setForecastError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const manualLocationOverrideRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const detectInitialLocation = async () => {
      if (location) {
        setLocationAttempted(true);
        return;
      }

      setDetectingLocation(true);
      setForecastError("");

      try {
        const position = await getBrowserPosition();

        if (!isMounted) return;

        const nextLocation = await getNamedLocationFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );

        if (!isMounted || manualLocationOverrideRef.current) return;

        saveForecastLocation(nextLocation);
        setLocation(nextLocation);
      } catch (error) {
        if (!isMounted) return;

        const storedLocation = getStoredForecastLocation();

        if (storedLocation) {
          const namedStoredLocation =
            storedLocation.city === "Current location"
              ? await getNamedLocationFromCoordinates(
                  storedLocation.lat,
                  storedLocation.lng
                )
              : storedLocation;

          if (!isMounted || manualLocationOverrideRef.current) return;

          saveForecastLocation(namedStoredLocation);
          setLocation(namedStoredLocation);
          return;
        }

        setForecastError(
          error.message ||
            "Location access is unavailable. Allow location access to load the forecast."
        );
      } finally {
        if (isMounted) {
          setDetectingLocation(false);
          setLocationAttempted(true);
        }
      }
    };

    detectInitialLocation();

    return () => {
      isMounted = false;
    };
  }, [location]);

  useEffect(() => {
    if (!location) {
      setForecastData([]);
      setUpdatedAt("");
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadForecast = async () => {
      setLoading(true);
      setForecastError("");

      try {
        const weatherBundle = await getWeatherBundleByCoordinates(
          location.lat,
          location.lng,
          {
            forecastDays: 7,
            timezone: location.timezone || AUTO_LOCATION_TIMEZONE,
          }
        );

        if (!isMounted) return;

        setSelectedDay(0);
        setForecastData(toForecastDisplay(weatherBundle));
        setUpdatedAt(
          weatherBundle.updatedAt ||
            weatherBundle.current?.updatedAt ||
            new Date().toISOString()
        );
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading Open-Meteo forecast:", error);
        setForecastError("Open-Meteo forecast unavailable. Try again later.");
        setForecastData([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadForecast();

    return () => {
      isMounted = false;
    };
  }, [location]);

  const handleTownSearch = async (event) => {
    event.preventDefault();

    const townName = townSearch.trim();
    if (!townName) {
      setForecastError("Enter a town name to load its forecast.");
      return;
    }

    setSearchingTown(true);
    manualLocationOverrideRef.current = true;
    setDetectingLocation(false);
    setLocationAttempted(true);
    setForecastError("");

    try {
      const result = await geocodeLocation(townName, { count: 8 });
      const nextLocation = toForecastLocation(result);

      if (!nextLocation) {
        throw new Error("Open-Meteo did not return coordinates for that town.");
      }

      saveForecastLocation(nextLocation);
      setLocation(nextLocation);
      setTownSearch("");
      setLocationAttempted(true);
    } catch (error) {
      setForecastError(error.message || "Could not find that town.");
    } finally {
      setSearchingTown(false);
    }
  };

  // Helper function to convert celsius to fahrenheit
  const celsiusToFahrenheit = (celsius) => {
    return Math.round((celsius * 9) / 5 + 32);
  };

  // Helper function to get temperature with unit
  const getTemp = (temp) => {
    if (!Number.isFinite(Number(temp))) return "--";

    return tempUnit === "celsius"
      ? `${Math.round(Number(temp))}\u00B0C`
      : `${celsiusToFahrenheit(temp)}\u00B0F`;
  };

  const getIconCondition = (condition) => {
    const conditionMap = {
      clear: "sunny",
      "clear-night": "clear night",
      "partly-cloudy": "partly cloudy",
      cloudy: "cloudy",
      rain: "light rain",
      drizzle: "light rain",
      thunderstorm: "thunderstorm",
    };

    return conditionMap[condition] || "sunny intervals";
  };

  // Get background color based on time of day and condition
  const getBackgroundColor = () => {
    if (!forecastData || !forecastData[selectedDay])
      return "from-blue-400 to-blue-600";

    const condition = forecastData[selectedDay].condition;
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour >= 18;

    if (condition === "clear-night") return "from-indigo-900 to-blue-950";
    if (condition === "clear")
      return isNight
        ? "from-indigo-900 to-blue-900"
        : "from-blue-400 to-blue-600";
    if (condition === "partly-cloudy")
      return isNight
        ? "from-gray-800 to-blue-900"
        : "from-blue-300 to-blue-500";
    if (condition === "cloudy")
      return isNight
        ? "from-gray-700 to-gray-900"
        : "from-gray-300 to-gray-500";
    if (condition === "rain" || condition === "drizzle")
      return isNight
        ? "from-blue-800 to-gray-900"
        : "from-blue-700 to-blue-900";
    if (condition === "thunderstorm")
      return isNight
        ? "from-purple-900 to-gray-900"
        : "from-purple-700 to-purple-900";

    return isNight
      ? "from-indigo-900 to-blue-900"
      : "from-blue-400 to-blue-600";
  };

  const locationTitle = location
    ? [location.city, location.region, location.country].filter(Boolean).join(", ")
    : "";

  const townSearchForm = (
    <form
      onSubmit={handleTownSearch}
      className="flex w-full gap-2 sm:w-[360px]"
    >
      <label className="sr-only" htmlFor="weekly-town-search">
        <T>Search town</T>
      </label>
      <input
        id="weekly-town-search"
        type="search"
        value={townSearch}
        onChange={(event) => setTownSearch(event.target.value)}
        className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        placeholder="Search town"
      />
      <button
        type="submit"
        disabled={searchingTown}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Search className="h-4 w-4" />
        <T>Search</T>
      </button>
    </form>
  );

  if (loading || detectingLocation || searchingTown || (!locationAttempted && forecastData.length === 0)) {
    return (
      <>
        <PageTitle title="7-Day Weather Forecast" />
        <div className="container mx-auto px-4 pb-8 pt-32 sm:px-6 md:pt-36 lg:px-8">
          <Breadcrumb />
          <ForecastSkeleton className="mt-4" />
        </div>
      </>
    );
  }

  if (forecastData.length === 0) {
    return (
      <>
        <PageTitle title="7-Day Weather Forecast" />
        <div className="container mx-auto px-4 pb-8 pt-32 sm:px-6 md:pt-36 lg:px-8">
          <Breadcrumb />
          <div className="mb-4 flex justify-end">{townSearchForm}</div>
          {!loading && !detectingLocation && locationAttempted && !location && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-900">
              <T>
                {forecastError || "Allow location access to load a live Open-Meteo forecast."}
              </T>
            </div>
          )}
          {!loading && !detectingLocation && location && forecastError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-800">
              <T>{forecastError}</T>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="7-Day Weather Forecast" />
      <div className="container mx-auto px-4 pb-8 pt-32 sm:px-6 md:pt-36 lg:px-8">
      <Breadcrumb />
      {/* Location and last updated info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="flex items-start mb-2 sm:mb-0">
          <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600 mr-1" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800" data-no-auto-translate>
              {locationTitle}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              <T>Updated</T> {formatUpdatedTime(updatedAt)}
            </p>
          </div>
        </div>
        <div className="w-full sm:ml-auto sm:w-auto">
          {townSearchForm}
          {forecastError && (
            <p className="mt-2 text-right text-sm font-medium text-red-600">
              <T>{forecastError}</T>
            </p>
          )}
        </div>
      </div>

      {/* Main forecast card */}
      <div
        className={`bg-gradient-to-br ${getBackgroundColor()} rounded-2xl shadow-lg text-white overflow-hidden`}
      >
        {/* Current day overview */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-semibold">
                <T>{forecastData[selectedDay].day}</T>
              </h2>
              <p className="text-lg opacity-90">
                <T>{forecastData[selectedDay].date}</T>
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setTempUnit("celsius")}
                className={`px-3 py-1 rounded-l-lg ${
                  tempUnit === "celsius"
                    ? "bg-white text-blue-600"
                    : "bg-blue-700 text-white"
                }`}
              >
                &deg;C
              </button>
              <button
                onClick={() => setTempUnit("fahrenheit")}
                className={`px-3 py-1 rounded-r-lg ${
                  tempUnit === "fahrenheit"
                    ? "bg-white text-blue-600"
                    : "bg-blue-700 text-white"
                }`}
              >
                &deg;F
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-6">
            <div className="flex items-center">
              <AnimatedWeatherIcon
                condition={getIconCondition(forecastData[selectedDay].condition)}
                size="4xl"
                showParticles
                interactive
              />
              <div className="ml-4">
                <div className="text-6xl font-light">
                  {getTemp(forecastData[selectedDay].high)}
                </div>
                <div className="text-lg">
                  <T>Low</T>: {getTemp(forecastData[selectedDay].low)}
                </div>
                <div className="text-lg capitalize">
                  <T>{forecastData[selectedDay].conditionText}</T>
                </div>
                <div className="text-sm opacity-85">
                  <T>{forecastData[selectedDay].summary}</T>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex items-center">
                <Droplet size={16} className="mr-2" />
                <span><T>Humidity:</T> {forecastData[selectedDay].humidity}%</span>
              </div>
              <div className="flex items-center">
                <CloudRain size={16} className="mr-2" />
                <span><T>Rain:</T> {forecastData[selectedDay].rainChance}%</span>
              </div>
              <div className="flex items-center">
                <Wind size={16} className="mr-2" />
                <span><T>Wind:</T> {forecastData[selectedDay].windSpeed} km/h</span>
              </div>
              <div className="flex items-center">
                <Thermometer size={16} className="mr-2" />
                <span>
                  <T>Feels like:</T> {getTemp(forecastData[selectedDay].feelsLike)}
                </span>
              </div>
            </div>
          </div>

          {/* Hourly forecast for selected day */}
          <div>
            <h3 className="text-xl font-semibold mb-4"><T>Hourly Forecast</T></h3>
            <div className="flex overflow-x-auto pb-2 space-x-4">
              {forecastData[selectedDay].hourly.map((hour, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 min-w-[70px]"
                >
                  <span className="text-sm font-medium mb-1">{hour.time}</span>
                  <AnimatedWeatherIcon
                    condition={getIconCondition(hour.condition)}
                    size="sm"
                    showParticles={false}
                    interactive={false}
                  />
                  <span className="mt-1 font-medium">{getTemp(hour.temp)}</span>
                  {hour.rainChance > 0 && (
                    <div className="flex items-center mt-1 text-xs">
                      <CloudRain size={10} className="mr-1" />
                      {hour.rainChance}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7-day forecast row */}
        <div className="bg-gray-800/40 backdrop-blur-sm p-4">
          <h3 className="text-lg font-semibold mb-3"><T>7-Day Forecast</T></h3>
          <div className="grid grid-cols-7 gap-2">
            {forecastData.map((day, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedDay === idx ? "bg-white/20" : "hover:bg-white/10"
                }`}
                onClick={() => setSelectedDay(idx)}
              >
                <span className="text-sm font-medium"><T>{day.day}</T></span>
                <AnimatedWeatherIcon
                  condition={getIconCondition(day.condition)}
                  size="sm"
                  showParticles={false}
                  interactive={false}
                  className="my-2"
                />
                <div className="flex flex-col items-center text-xs sm:text-sm">
                  <span className="font-medium">
                    {Math.round(day.high)}&deg;
                  </span>
                  <span className="opacity-80">
                    {Math.round(day.low)}&deg;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast matrix (similar to iPhone weather app) */}
      <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            <T>Weather Matrix</T>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  <T>DAY</T>
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  <T>CONDITION</T>
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  <T>HIGH / LOW</T>
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  <T>RAIN %</T>
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  <T>HUMIDITY</T>
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  <T>WIND</T>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {forecastData.map((day, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-blue-50 cursor-pointer ${
                    selectedDay === idx ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedDay(idx)}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium"><T>{day.day}</T></div>
                    <div className="text-xs text-gray-500"><T>{day.date}</T></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <AnimatedWeatherIcon
                        condition={getIconCondition(day.condition)}
                        size="sm"
                        showParticles={false}
                        interactive={false}
                      />
                      <span className="ml-2 capitalize">
                        <T>{day.conditionText}</T>
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {getTemp(day.high)} / {getTemp(day.low)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          className="h-1.5 rounded-full bg-blue-600"
                          style={{ width: `${day.rainChance}%` }}
                        ></div>
                      </div>
                      <span>{day.rainChance}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          className="h-1.5 rounded-full bg-purple-600"
                          style={{ width: `${day.humidity}%` }}
                        ></div>
                      </div>
                      <span>{day.humidity}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Wind size={16} className="mr-2 text-gray-500" />
                      <span>{day.windSpeed} km/h</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

export default SevenDaysForecast;
