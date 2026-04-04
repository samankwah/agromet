import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatbot } from '../contexts/ChatbotContext';
import { getCurrentWeather } from '../services/weatherApi';

export const useChatbotIntegration = () => {
  const location = useLocation();
  const { updateWeather, updateCrops, userContext } = useChatbot();

  // Update weather data when region changes
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (userContext.region) {
        try {
          const weatherData = await getCurrentWeather();
          // Find weather for the user's region or use a default
          const regionWeather = weatherData.weather.find(w => 
            w.city.toLowerCase().includes(userContext.region.toLowerCase())
          ) || weatherData.weather[0];

          updateWeather({
            condition: regionWeather.condition,
            temperature: regionWeather.temperature,
            humidity: Math.floor(Math.random() * 40) + 60, // Mock humidity
            location: regionWeather.city,
          });
        } catch (error) {
          console.error('Failed to fetch weather data for chatbot:', error);
        }
      }
    };

    fetchWeatherData();
  }, [userContext.region, updateWeather]);

  // Auto-detect crops based on current page
  useEffect(() => {
    const currentPath = location.pathname;
    const detectedCrops = [];

    // Extract crop information from current page
    if (currentPath.includes('crop-calendar')) {
      detectedCrops.push('maize', 'rice', 'yam');
    } else if (currentPath.includes('market')) {
      detectedCrops.push('tomatoes', 'onions', 'pepper');
    } else if (currentPath.includes('crop-advisory')) {
      detectedCrops.push('crops');
    }

    if (detectedCrops.length > 0) {
      updateCrops(detectedCrops);
    }
  }, [location.pathname, updateCrops]);

  // Extract location from URL parameters or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const regionParam = urlParams.get('region') || urlParams.get('location');
    
    if (regionParam && regionParam !== userContext.region) {
      // This would be handled by the context provider
      localStorage.setItem('userRegion', regionParam);
    }
  }, [location.search, userContext.region]);

  return {
    userContext,
  };
};

// Hook for components to provide chatbot context
export const useChatbotContext = () => {
  const { updateRegion, updateWeather, updateCrops } = useChatbot();

  const provideCropContext = (crops) => {
    updateCrops(Array.isArray(crops) ? crops : [crops]);
  };

  const provideLocationContext = (region) => {
    updateRegion(region);
  };

  const provideWeatherContext = (weather) => {
    updateWeather(weather);
  };

  return {
    provideCropContext,
    provideLocationContext,
    provideWeatherContext,
  };
};