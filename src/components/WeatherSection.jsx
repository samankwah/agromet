import React, { useState, useEffect, useCallback } from "react";
import { useWeatherData } from "../hooks/useWeatherData";
import ErrorBoundary from "./ErrorBoundary";
import AnimatedWeatherIcon from "./AnimatedWeatherIcon";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/weatherAnimations.css";
import {
  FaCloudSun,
  FaExclamationTriangle,
  FaSun,
  FaCloud,
  FaCloudRain,
  FaBolt,
  FaSnowflake,
  FaEye,
  FaLocationArrow,
  FaSpinner
} from "react-icons/fa";
import thermometer from "../assets/images/thermometer.svg";
import PropTypes from "prop-types";

// Enhanced slider settings with improved responsiveness
const sliderSettings = {
  infinite: true,
  slidesToShow: 5,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 4000,
  pauseOnHover: true,
  swipeToSlide: true,
  touchThreshold: 10,
  speed: 500,
  cssEase: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  responsive: [
    {
      breakpoint: 1400,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplaySpeed: 3500
      }
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplaySpeed: 3000
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
        autoplaySpeed: 2500,
        arrows: false
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplaySpeed: 2000,
        arrows: false,
        centerMode: true,
        centerPadding: "20px"
      }
    },
  ],
};

// Legacy WeatherIcon wrapper for backward compatibility
const WeatherIcon = ({ condition, temperature }) => {
  return (
    <AnimatedWeatherIcon
      condition={condition}
      size="3xl"
      showParticles={true}
      interactive={true}
      temperature={temperature}
      className="mx-auto"
    />
  );
};

WeatherIcon.propTypes = {
  condition: PropTypes.string.isRequired,
  temperature: PropTypes.number,
};

// Enhanced loading skeleton with animated placeholders
const WeatherCardSkeleton = () => (
  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl p-6 mx-2 animate-pulse">
    <div className="h-5 bg-blue-400 bg-opacity-50 rounded-lg mb-3"></div>
    <div className="flex justify-center items-center my-6">
      <div className="w-20 h-20 bg-blue-400 bg-opacity-50 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
    </div>
    <div className="h-4 bg-blue-400 bg-opacity-50 rounded-lg mb-4 w-3/4 mx-auto"></div>
    <div className="flex justify-center items-center mt-2">
      <div className="h-6 bg-blue-400 bg-opacity-50 rounded-full w-24"></div>
    </div>
  </div>
);

// Enhanced WeatherCard component with animated icons
const WeatherCard = ({ city, condition, minTemp, maxTemp, onRemove }) => {
  const avgTemp = Math.round((minTemp + maxTemp) / 2);

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl p-6 mx-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 relative group transform hover:scale-105">
      {onRemove && (
        <button
          onClick={() => onRemove(city)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white hover:text-red-300 bg-black bg-opacity-20 rounded-full w-6 h-6 flex items-center justify-center text-sm"
          title={`Remove ${city}`}
        >
          ×
        </button>
      )}

      <h3 className="text-lg font-bold truncate pr-8 mb-2">{city}</h3>

      <div className="flex justify-center items-center my-4">
        <WeatherIcon condition={condition} temperature={avgTemp} />
      </div>

      <p className="text-center capitalize text-sm mb-3 opacity-90">{condition}</p>

      <div className="flex justify-center items-center mt-2">
        <div className="flex items-center bg-white bg-opacity-20 rounded-full px-3 py-1">
          <img src={thermometer} alt="Thermometer" className="w-3 h-3 mr-2 opacity-80" />
          <span className="text-sm font-semibold">
            {minTemp}° / {maxTemp}°C
          </span>
        </div>
      </div>

      {/* Dynamic background overlay based on weather */}
      <div className="absolute inset-0 rounded-xl opacity-10 pointer-events-none">
        <div className={`w-full h-full rounded-xl bg-gradient-to-br ${getWeatherGradient(condition)}`} />
      </div>
    </div>
  );
};

// Helper function to get weather-specific gradients
const getWeatherGradient = (condition) => {
  const conditionKey = condition.toLowerCase();
  const gradients = {
    "clear sky": "from-yellow-400 to-orange-500",
    "sunny": "from-yellow-300 to-orange-400",
    "sunny intervals": "from-yellow-400 to-blue-400",
    "partly cloudy": "from-gray-300 to-blue-400",
    "cloudy": "from-gray-400 to-gray-500",
    "overcast": "from-gray-500 to-gray-600",
    "light rain": "from-blue-400 to-blue-500",
    "moderate rain": "from-blue-500 to-blue-600",
    "heavy rain": "from-blue-600 to-blue-700",
    "thunderstorm": "from-purple-600 to-gray-800",
    "snow": "from-white to-blue-200",
    "mist": "from-gray-200 to-gray-400",
    "fog": "from-gray-300 to-gray-500"
  };
  return gradients[conditionKey] || gradients["sunny intervals"];
};

WeatherCard.propTypes = {
  city: PropTypes.string.isRequired,
  condition: PropTypes.string.isRequired,
  minTemp: PropTypes.number.isRequired,
  maxTemp: PropTypes.number.isRequired,
  onRemove: PropTypes.func,
};

// Extended city coordinates for Ghana cities
const cityCoordinates = {
  // Regional capitals
  Koforidua: { lat: 6.0939, lng: -0.2591 },
  "Cape Coast": { lat: 5.1315, lng: -1.2795 },
  Ho: { lat: 6.6008, lng: 0.4713 },
  Takoradi: { lat: 4.8845, lng: -1.7554 },
  Accra: { lat: 5.56, lng: -0.205 },
  Bole: { lat: 9.0333, lng: -2.4833 },
  Tamale: { lat: 9.4008, lng: -0.8393 },
  Kumasi: { lat: 6.6885, lng: -1.6244 },
  Sunyani: { lat: 7.3380, lng: -2.3260 },
  Wa: { lat: 10.0606, lng: -2.5097 },

  // Major cities
  "Tema": { lat: 5.6698, lng: -0.0166 },
  "Obuasi": { lat: 6.2072, lng: -1.6663 },
  "Tarkwa": { lat: 5.3013, lng: -1.9969 },
  "Bolgatanga": { lat: 10.7856, lng: -0.8514 },
  "Techiman": { lat: 7.5887, lng: -1.9383 },
  "Navrongo": { lat: 10.8953, lng: -1.0944 },
};

const WeatherSection = () => {
  const {
    weatherData,
    loading,
    error,
    fetchWeatherForCities,
    addCityWeather,
    removeCityWeather,
    refreshWeatherData,
    setError,
  } = useWeatherData();

  const [location, setLocation] = useState("");
  const [isUserLocationLoading, setIsUserLocationLoading] = useState(false);

  // Utility function to get formatted date
  const getFormattedDate = useCallback(() => {
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Date().toLocaleDateString("en-US", options);
  }, []);

  // Debounced search to avoid excessive API calls
  const [searchTimeout] = useState(null);

  // Handle search input with debouncing
  const searchLocation = useCallback(async (event) => {
    if (event.key === "Enter" && location.trim()) {
      setError(null);
      const city = location.trim();

      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Check if city is in predefined coordinates
      const coords = cityCoordinates[city] || { lat: 8, lng: -1 }; // Fallback to center of Ghana

      const success = await addCityWeather(city, coords.lat, coords.lng);
      if (success) {
        setLocation("");
      }
    }
  }, [location, searchTimeout, addCityWeather, setError]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    setIsUserLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await addCityWeather("Your Location", latitude, longitude);
        } catch {
          setError("Could not fetch weather for your location");
        } finally {
          setIsUserLocationLoading(false);
        }
      },
      () => {
        setError("Could not access your location");
        setIsUserLocationLoading(false);
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [addCityWeather, setError]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    refreshWeatherData();
  }, [refreshWeatherData]);

  // Fetch initial weather data for default cities
  useEffect(() => {
    const defaultCities = [
      { city: "Koforidua", lat: 6.0939, lng: -0.2591 },
      { city: "Cape Coast", lat: 5.1315, lng: -1.2795 },
      { city: "Ho", lat: 6.6008, lng: 0.4713 },
      { city: "Takoradi", lat: 4.8845, lng: -1.7554 },
      { city: "Accra", lat: 5.56, lng: -0.205 },
      { city: "Bole", lat: 9.0333, lng: -2.4833 },
      { city: "Tamale", lat: 9.4008, lng: -0.8393 },
    ];

    fetchWeatherForCities(defaultCities);
  }, [fetchWeatherForCities]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-2xl p-6 mb-10 relative overflow-hidden">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-12 scale-150"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-xl md:text-2xl font-bold tracking-wide">
              🌤️ Weather for {getFormattedDate()}
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-white hover:text-blue-200 transition-all duration-300 disabled:opacity-50 transform hover:scale-110 bg-white bg-opacity-20 rounded-full p-2"
              title="Refresh weather data"
            >
              {loading ? (
                <FaSpinner className="animate-spin text-lg" />
              ) : (
                <FaLocationArrow className="transform rotate-45 text-lg" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={searchLocation}
                placeholder="🔍 Enter city name..."
                className="px-5 py-3 rounded-full text-gray-900 w-full md:w-52 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-300 shadow-lg backdrop-blur-sm bg-white bg-opacity-95 placeholder-gray-500"
                disabled={loading}
              />
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={isUserLocationLoading || loading}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
              title="Get weather for your location"
            >
              {isUserLocationLoading ? (
                <FaSpinner className="animate-spin text-lg" />
              ) : (
                <FaLocationArrow className="text-lg" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-30 border-2 border-red-400 border-opacity-50 text-red-100 px-5 py-4 rounded-xl mb-6 flex items-center justify-between backdrop-blur-sm shadow-lg">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-3 flex-shrink-0 text-lg" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-200 hover:text-white ml-4 flex-shrink-0 bg-red-600 bg-opacity-30 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-opacity-50"
            >
              ×
            </button>
          </div>
        )}

        <div className="slider-container relative">
          <Slider {...sliderSettings}>
            {loading && weatherData.length === 0
              ? Array.from({ length: 5 }, (_, index) => (
                  <WeatherCardSkeleton key={`skeleton-${index}`} />
                ))
              : weatherData.map((data, index) => (
                  <WeatherCard
                    key={`${data.city}-${index}`}
                    {...data}
                    onRemove={weatherData.length > 1 ? removeCityWeather : null}
                  />
                ))
            }
          </Slider>
        </div>

        {!loading && weatherData.length === 0 && (
          <div className="text-center text-white py-12">
            <div className="text-6xl mb-4 opacity-50">🌫️</div>
            <p className="text-xl mb-3 font-semibold">No weather data available</p>
            <p className="text-sm opacity-75 max-w-md mx-auto">Try searching for a city or check your internet connection. You can also use the location button to get weather for your current location.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedWeatherSection = React.memo(WeatherSection);

// Export with error boundary wrapper
const WeatherSectionWithErrorBoundary = () => (
  <ErrorBoundary title="Weather Service Error">
    <MemoizedWeatherSection />
  </ErrorBoundary>
);

export default WeatherSectionWithErrorBoundary;
