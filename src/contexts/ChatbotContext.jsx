import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ChatbotContext = createContext();

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

export const ChatbotProvider = ({ children }) => {
  const [userContext, setUserContext] = useState({
    region: null,
    weather: null,
    season: null,
    crops: [],
    currentPage: null,
  });

  const [chatPreferences, setChatPreferences] = useState({
    language: 'en',
    enableVoice: true,
    enableNotifications: true,
  });

  // Auto-detect user context from current page and existing platform data
  useEffect(() => {
    const detectContext = () => {
      const currentPath = window.location.pathname;
      let currentPage = 'home';
      
      // Determine current page context
      if (currentPath.includes('weather') || currentPath.includes('forecast')) {
        currentPage = 'weather';
      } else if (currentPath.includes('crop')) {
        currentPage = 'crops';
      } else if (currentPath.includes('market')) {
        currentPage = 'market';
      } else if (currentPath.includes('dashboard')) {
        currentPage = 'dashboard';
      }

      // Try to get region from localStorage or URL params
      const savedRegion = localStorage.getItem('userRegion');
      const urlParams = new URLSearchParams(window.location.search);
      const regionFromUrl = urlParams.get('region');

      setUserContext(prev => ({
        ...prev,
        currentPage,
        region: regionFromUrl || savedRegion || prev.region,
      }));
    };

    detectContext();
    
    // Listen for route changes
    const handleLocationChange = () => {
      detectContext();
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Get current season based on date
  useEffect(() => {
    const getCurrentSeason = () => {
      const month = new Date().getMonth() + 1; // 1-12
      
      if (month >= 4 && month <= 7) {
        return 'major-rainy-season';
      } else if (month >= 9 && month <= 11) {
        return 'minor-rainy-season';
      } else {
        return 'dry-season';
      }
    };

    setUserContext(prev => ({
      ...prev,
      season: getCurrentSeason(),
    }));
  }, []);

  // Update user context methods
  const updateRegion = (region) => {
    setUserContext(prev => ({ ...prev, region }));
    localStorage.setItem('userRegion', region);
  };

  const updateWeather = (weather) => {
    setUserContext(prev => ({ ...prev, weather }));
  };

  const updateCrops = (crops) => {
    setUserContext(prev => ({ ...prev, crops }));
  };

  const updatePreferences = (newPreferences) => {
    setChatPreferences(prev => ({ ...prev, ...newPreferences }));
    localStorage.setItem('chatPreferences', JSON.stringify({ ...chatPreferences, ...newPreferences }));
  };

  // Load saved preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem('chatPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setChatPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved chat preferences:', error);
      }
    }
  }, []);

  // Get contextual suggestions based on current page
  const getContextualSuggestions = () => {
    const { currentPage, region } = userContext;
    
    const baseSuggestions = [
      "What crops should I plant this season?",
      "How do I identify crop diseases?",
      "What's the weather forecast?",
      "Best fertilizer recommendations?",
    ];

    const contextualSuggestions = {
      weather: [
        "How will today's weather affect my crops?",
        "When is the best time to plant given the forecast?",
        "How to protect crops from heavy rains?",
        "Drought management strategies?",
      ],
      crops: [
        "What's the best planting calendar for my region?",
        "How to maximize crop yield?",
        "Common crop diseases in this season?",
        "Organic farming techniques?",
      ],
      market: [
        "What crops have good market prices now?",
        "When is the best time to sell my harvest?",
        "How to prepare crops for market?",
        "Storage techniques to maintain quality?",
      ],
      dashboard: [
        "How to interpret weather data for farming?",
        "Setting up crop monitoring systems?",
        "Best practices for farm record keeping?",
        "Planning seasonal farming activities?",
      ],
    };

    let suggestions = contextualSuggestions[currentPage] || baseSuggestions;

    // Add region-specific context if available
    if (region) {
      suggestions = suggestions.map(s => s.replace('my region', region));
    }

    return suggestions;
  };

  // Get enhanced context for chatbot
  const getEnhancedContext = () => {
    const suggestions = getContextualSuggestions();
    
    return {
      ...userContext,
      suggestions,
      preferences: chatPreferences,
      platformData: {
        hasWeatherData: !!userContext.weather,
        hasRegionSelected: !!userContext.region,
        currentSeason: userContext.season,
      }
    };
  };

  const value = {
    userContext,
    chatPreferences,
    updateRegion,
    updateWeather,
    updateCrops,
    updatePreferences,
    getContextualSuggestions,
    getEnhancedContext,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};

ChatbotProvider.propTypes = {
  children: PropTypes.node.isRequired,
};