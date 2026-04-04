import { useState, useCallback } from "react";
import axios from "axios";
import API_CONFIG from "../config/apiConfig";

// Custom hook for weather data management
export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get API configuration from environment
  const getApiConfig = useCallback(() => {
    return {
      baseUrl: `${API_CONFIG.AMBEE_BASE_URL}/weather/forecast/by-lat-lng`
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
      source: "fallback",
    };
  }, []);

  const logWeatherFallback = useCallback((message, details) => {
    console.warn(`[Weather fallback] ${message}`, details);
  }, []);

  // Fetch weather data for a city
  const fetchWeatherForCity = useCallback(async (city, lat, lng) => {
    const { baseUrl } = getApiConfig();

    try {
      const url = `${baseUrl}?lat=${lat}&lng=${lng}`;
      const response = await axios.get(url, {
        headers: { "Content-type": "application/json" },
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
        source: "live",
        lat,
        lng,
      };
    } catch (err) {
      // Return mock data as fallback
      return {
        ...generateMockWeather(city),
        lat,
        lng,
        errorMessage:
          err?.response?.data?.detail?.message ||
          err?.response?.data?.detail?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Live weather unavailable.",
      };
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
      const fallbackCount = successfulResults.filter((item) => item.source !== "live").length;
      if (successfulResults.length > 0 && fallbackCount === successfulResults.length) {
        logWeatherFallback("All requested locations are using fallback data.", {
          cities: successfulResults.map((item) => ({
            city: item.city,
            errorMessage: item.errorMessage,
          })),
        });
      } else if (fallbackCount > 0) {
        logWeatherFallback(
          `${fallbackCount} location${fallbackCount === 1 ? "" : "s"} are using fallback data.`,
          {
            cities: successfulResults
              .filter((item) => item.source !== "live")
              .map((item) => ({
                city: item.city,
                errorMessage: item.errorMessage,
              })),
          }
        );
      }
    } catch (err) {
      setError(`Failed to fetch weather data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [fetchWeatherForCity, logWeatherFallback]);

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
      if (newWeather.source !== "live") {
        logWeatherFallback(`"${city}" is using fallback weather data.`, {
          city,
          errorMessage: newWeather.errorMessage,
        });
      }
      return true;
    } catch {
      setError(`Could not fetch weather data for "${city}"`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [weatherData, fetchWeatherForCity, logWeatherFallback]);

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
        lat: item.lat,
        lng: item.lng
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
