import { useState, useEffect } from "react";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaCloudSun, FaExclamationTriangle } from "react-icons/fa";
import thermometer from "../assets/images/thermometer.svg";
import PropTypes from "prop-types";

// Slider settings
const sliderSettings = {
  infinite: true,
  slidesToShow: 5,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 4 } },
    { breakpoint: 992, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 576, settings: { slidesToShow: 2 } },
  ],
};

// WeatherIcon component
const WeatherIcon = ({ condition }) => {
  const conditionMap = {
    "clear sky": "Sunny Intervals",
    "partly cloudy": "Cloudy, Sunny Intervals",
    cloudy: "Cloudy, Sunny Intervals",
    "light rain": "Rains, Sunny Intervals",
    "moderate rain": "Rains, Sunny Intervals",
    "heavy rain": "Rains, Sunny Intervals",
    thunderstorm: "Rains, Sunny Intervals",
    snow: "Sunny Intervals, Showers",
    mist: "Sunny Intervals, Showers",
  };
  const mappedCondition =
    conditionMap[condition.toLowerCase()] || "Sunny Intervals";
  return <FaCloudSun className="text-white text-4xl" />;
};

WeatherIcon.propTypes = {
  condition: PropTypes.string.isRequired,
};

// WeatherCard component
const WeatherCard = ({ city, condition, minTemp, maxTemp }) => (
  <div className="bg-[#2196f3] text-white rounded-lg shadow-lg p-4 mx-2">
    <h3 className="text-xl font-semibold">{city}</h3>
    <div className="flex justify-center items-center my-2">
      <WeatherIcon condition={condition} />
    </div>
    <p className="text-center capitalize">{condition}</p>
    <div className="flex justify-between items-center mt-2">
      <div className="flex items-center">
        <img src={thermometer} alt="Thermometer" className="w-5 h-5 mr-1" />
        <span>
          {minTemp}°C / {maxTemp}°C
        </span>
      </div>
    </div>
  </div>
);

WeatherCard.propTypes = {
  city: PropTypes.string.isRequired,
  condition: PropTypes.string.isRequired,
  minTemp: PropTypes.number.isRequired,
  maxTemp: PropTypes.number.isRequired,
};

// City coordinates for default cities
const cityCoordinates = {
  Koforidua: { lat: 6.0939, lng: -0.2591 },
  "Cape Coast": { lat: 5.1315, lng: -1.2795 },
  Ho: { lat: 6.6008, lng: 0.4713 },
  Takoradi: { lat: 4.8845, lng: -1.7554 },
  Accra: { lat: 5.56, lng: -0.205 },
  Bole: { lat: 9.0333, lng: -2.4833 },
  Tamale: { lat: 9.4008, lng: -0.8393 },
};

const WeatherSection = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [location, setLocation] = useState("");
  const [error, setError] = useState(null);

  // Utility function to get formatted date
  const getFormattedDate = () => {
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Date().toLocaleDateString("en-US", options);
  };

  // Fetch weather data for a given lat/lng
  const fetchWeather = async (city, lat, lng) => {
    const apiKey =
      import.meta.env.VITE_AMBEE_API_KEY || import.meta.env.VITE_AMBEE_API_KEY;

    // Check if API key is available
    if (!apiKey || apiKey === "your-ambee-api-key-here") {
      console.info("Ambee API key not configured, using mock weather data");
      return {
        city,
        condition: "Sunny Intervals",
        minTemp: Math.round(25 + Math.random() * 10), // Mock temperature range
        maxTemp: Math.round(30 + Math.random() * 10),
      };
    }

    try {
      const url = `/api/ambee/weather/forecast/by-lat-lng?lat=${lat}&lng=${lng}`;
      const response = await axios.get(url, {
        headers: {
          "Content-type": "application/json",
        },
      });
      const forecast = response.data.data[0]; // Use first forecast entry

      // Convert Fahrenheit to Celsius if needed
      const tempCelsius =
        forecast.temperature > 50
          ? Math.round(((forecast.temperature - 32) * 5) / 9)
          : Math.round(forecast.temperature);

      return {
        city,
        condition: forecast.summary || "Sunny Intervals",
        minTemp: Math.round(tempCelsius - 2), // Approximate min/max
        maxTemp: Math.round(tempCelsius + 2),
      };
    } catch (err) {
      console.error(`Error fetching weather for ${city}:`, err);
      // Return mock data as fallback
      return {
        city,
        condition: "Sunny Intervals",
        minTemp: Math.round(25 + Math.random() * 10),
        maxTemp: Math.round(30 + Math.random() * 10),
      };
    }
  };

  // Handle search input
  const searchLocation = async (event) => {
    if (event.key === "Enter" && location.trim()) {
      setError(null);
      const city = location.trim();
      const coords = cityCoordinates[city] || { lat: 8, lng: -1 }; // Fallback coordinates
      const newWeather = await fetchWeather(city, coords.lat, coords.lng);
      if (newWeather) {
        setWeatherData((prev) => {
          const exists = prev.find(
            (item) => item.city.toLowerCase() === city.toLowerCase()
          );
          if (exists) return prev;
          return [...prev, newWeather];
        });
        setLocation("");
      } else {
        setError(`Could not find weather data for "${city}"`);
      }
    }
  };

  // Fetch initial weather data for default cities
  useEffect(() => {
    const defaultCities = [
      "Koforidua",
      "Cape Coast",
      "Ho",
      "Takoradi",
      "Accra",
      "Bole",
      "Tamale",
    ];
    const fetchDefaultWeather = async () => {
      const promises = defaultCities.map((city) => {
        const coords = cityCoordinates[city];
        return fetchWeather(city, coords.lat, coords.lng);
      });
      const results = await Promise.all(promises);
      const validResults = results.filter((result) => result !== null);
      setWeatherData(validResults);
    };
    fetchDefaultWeather();
  }, []);

  return (
    <div className="bg-[#2196f3] rounded-lg shadow-lg p-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg md:text-xl">
          Weather for {getFormattedDate()}
        </h2>
        <div className="relative">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={searchLocation}
            placeholder="Enter city name..."
            className="px-4 py-2 rounded-lg text-gray-900 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-center mb-4 flex items-center justify-center">
          <FaExclamationTriangle className="mr-2" /> {error}
        </p>
      )}
      <div className="slider-container">
        <Slider {...sliderSettings}>
          {weatherData.map((data, index) => (
            <WeatherCard key={index} {...data} />
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default WeatherSection;
