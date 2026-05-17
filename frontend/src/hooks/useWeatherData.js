import { useState, useCallback } from "react";
import { getWeatherBundleByCoordinates, OPEN_METEO_SOURCE } from "../services/openMeteoService";

// Custom hook for weather data management
export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUnavailableWeather = useCallback((city) => {
    return {
      city,
      condition: "Weather unavailable",
      minTemp: null,
      maxTemp: null,
      humidity: null,
      windSpeed: null,
      source: `${OPEN_METEO_SOURCE} unavailable`,
    };
  }, []);

  const logWeatherFallback = useCallback((message, details) => {
    console.warn(`[Weather fallback] ${message}`, details);
  }, []);

  // Fetch weather data for a city
  const fetchWeatherForCity = useCallback(async (city, lat, lng) => {
    try {
      const weather = await getWeatherBundleByCoordinates(lat, lng, {
        forecastDays: 7,
      });
      const today = weather.daily[0];

      return {
        city,
        condition: weather.current.condition || today?.condition || "Variable Weather",
        minTemp: today?.lowTemp ?? weather.current.temperatureValue,
        maxTemp: today?.highTemp ?? weather.current.temperatureValue,
        humidity: weather.current.humidityValue,
        windSpeed: weather.current.windSpeedValue,
        summary: weather.current.summary,
        source: "live",
        updatedAt: weather.current.updatedAt,
        lat,
        lng,
      };
    } catch (err) {
      return {
        ...getUnavailableWeather(city),
        lat,
        lng,
        errorMessage:
          err?.message ||
          "Live weather unavailable.",
      };
    }
  }, [getUnavailableWeather]);

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
