import { useState, useCallback } from "react";
import axios from "axios";

// Custom hook for weather data management
export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get API configuration from environment
  const getApiConfig = useCallback(() => {
    const apiKey = import.meta.env.VITE_AMBEE_API_KEY;
    const isMockMode = !apiKey || apiKey === "your-ambee-api-key-here";

    return {
      apiKey,
      isMockMode,
      baseUrl: "/api/ambee/weather/forecast/by-lat-lng"
    };
  }, []);

  // Generate mock weather data
  const generateMockWeather = useCallback((city) => {
    const conditions = [
      "Sunny Intervals", "Cloudy", "Light Rain", "Partly Cloudy",
      "Clear Sky", "Overcast", "Mist"
    ];

    return {
      city,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      minTemp: Math.round(20 + Math.random() * 10),
      maxTemp: Math.round(28 + Math.random() * 12),
    };
  }, []);

  // Fetch weather data for a city
  const fetchWeatherForCity = useCallback(async (city, lat, lng) => {
    const { apiKey, isMockMode, baseUrl } = getApiConfig();

    if (isMockMode) {
      console.info("API key not configured, using mock weather data");
      return generateMockWeather(city);
    }

    try {
      const url = `${baseUrl}?lat=${lat}&lng=${lng}`;
      const response = await axios.get(url, {
        headers: {
          "Content-type": "application/json",
          "x-api-key": apiKey,
        },
        timeout: 10000, // 10 second timeout
      });

      const forecast = response.data.data?.[0];
      if (!forecast) {
        throw new Error("No forecast data available");
      }

      // Handle temperature conversion (Fahrenheit to Celsius if needed)
      const tempCelsius = forecast.temperature > 50
        ? Math.round(((forecast.temperature - 32) * 5) / 9)
        : Math.round(forecast.temperature);

      return {
        city,
        condition: forecast.summary || "Sunny Intervals",
        minTemp: Math.max(0, Math.round(tempCelsius - 3)),
        maxTemp: Math.round(tempCelsius + 3),
      };
    } catch (err) {
      console.error(`Error fetching weather for ${city}:`, err.message);
      // Return mock data as fallback
      return generateMockWeather(city);
    }
  }, [generateMockWeather, getApiConfig]);

  // Fetch weather for multiple cities
  const fetchWeatherForCities = useCallback(async (cities) => {
    setLoading(true);
    setError(null);

    try {
      const promises = cities.map(({ city, lat, lng }) =>
        fetchWeatherForCity(city, lat, lng)
      );

      const results = await Promise.allSettled(promises);
      const successfulResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      setWeatherData(successfulResults);

      // Check if any requests failed
      const failedCount = results.filter(result => result.status === 'rejected').length;
      if (failedCount > 0) {
        console.warn(`${failedCount} weather requests failed, showing available data`);
      }
    } catch (err) {
      setError(`Failed to fetch weather data: ${err.message}`);
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchWeatherForCity]);

  // Add weather for a single city
  const addCityWeather = useCallback(async (city, lat, lng) => {
    setError(null);

    // Check if city already exists
    const exists = weatherData.find(
      (item) => item.city.toLowerCase() === city.toLowerCase()
    );

    if (exists) {
      setError(`Weather for "${city}" is already displayed`);
      return false;
    }

    setLoading(true);
    try {
      const newWeather = await fetchWeatherForCity(city, lat, lng);
      setWeatherData(prev => [...prev, newWeather]);
      return true;
    } catch {
      setError(`Could not fetch weather data for "${city}"`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [weatherData, fetchWeatherForCity]);

  // Remove city weather
  const removeCityWeather = useCallback((cityName) => {
    setWeatherData(prev =>
      prev.filter(item => item.city.toLowerCase() !== cityName.toLowerCase())
    );
  }, []);

  // Refresh all weather data
  const refreshWeatherData = useCallback(() => {
    if (weatherData.length > 0) {
      const cities = weatherData.map(item => ({
        city: item.city,
        lat: 0, // Would need to store original coordinates
        lng: 0
      }));
      fetchWeatherForCities(cities);
    }
  }, [weatherData, fetchWeatherForCities]);

  return {
    weatherData,
    loading,
    error,
    fetchWeatherForCities,
    addCityWeather,
    removeCityWeather,
    refreshWeatherData,
    setError, // Allow manual error clearing
  };
};