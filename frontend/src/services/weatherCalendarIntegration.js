/**
 * Weather Calendar Integration Service
 *
 * Integrates real-time weather data with calendar recommendations
 * to provide climate-adjusted agricultural timing
 */

class WeatherCalendarIntegration {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
    this.weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY;
    this.weatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get weather-adjusted calendar recommendations
   * @param {Object} calendarData - Original calendar data
   * @param {string} regionCode - Region for weather data
   * @param {Object} options - Integration options
   * @returns {Promise<Object>} Weather-adjusted calendar
   */
  async getWeatherAdjustedCalendar(calendarData, regionCode, options = {}) {
    const {
      enableRainfallAdjustment = true,
      enableTemperatureAdjustment = true,
      enableSeasonalForecasting = true,
      adjustmentSensitivity = 'medium' // low, medium, high
    } = options;

    try {
      console.log('🌤️ Getting weather-adjusted calendar for', regionCode);

      // Get current weather and forecast
      const weatherData = await this.getRegionalWeatherData(regionCode);

      if (!weatherData.success) {
        console.warn('⚠️ Weather data unavailable, using original calendar');
        return {
          success: true,
          data: calendarData,
          metadata: {
            weatherIntegrationUsed: false,
            fallbackReason: weatherData.error
          }
        };
      }

      // Apply weather adjustments
      const adjustedActivities = await this.applyWeatherAdjustments(
        calendarData,
        weatherData.data,
        {
          enableRainfallAdjustment,
          enableTemperatureAdjustment,
          enableSeasonalForecasting,
          adjustmentSensitivity
        }
      );

      return {
        success: true,
        data: adjustedActivities,
        metadata: {
          weatherIntegrationUsed: true,
          weatherData: {
            currentConditions: weatherData.data.current,
            forecast: weatherData.data.forecast,
            adjustmentsApplied: adjustedActivities.length
          },
          adjustmentSensitivity,
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Weather integration error:', error);

      return {
        success: true,
        data: calendarData,
        metadata: {
          weatherIntegrationUsed: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Get regional weather data
   * @param {string} regionCode - Ghana region code
   * @returns {Promise<Object>} Weather data result
   */
  async getRegionalWeatherData(regionCode) {
    const cacheKey = `weather_${regionCode}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      // Get coordinates for region (simplified mapping)
      const regionCoordinates = this.getRegionCoordinates(regionCode);

      if (!regionCoordinates) {
        return {
          success: false,
          error: `Coordinates not found for region: ${regionCode}`
        };
      }

      const { lat, lon } = regionCoordinates;

      // Mock weather API call (replace with real API when key is available)
      const weatherData = await this.mockWeatherApi(lat, lon, regionCode);

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mock weather API for demonstration (replace with real API)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} regionCode - Region code
   * @returns {Promise<Object>} Mock weather data
   */
  async mockWeatherApi(lat, lon, regionCode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate realistic mock data based on Ghana's climate
    const currentTemp = 25 + Math.random() * 10; // 25-35°C range
    const humidity = 60 + Math.random() * 30; // 60-90% range
    const rainfall = Math.random() * 20; // 0-20mm daily

    return {
      success: true,
      data: {
        current: {
          temperature: Math.round(currentTemp),
          humidity: Math.round(humidity),
          rainfall: Math.round(rainfall * 10) / 10,
          conditions: rainfall > 10 ? 'rainy' : rainfall > 5 ? 'cloudy' : 'sunny',
          windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10
        },
        forecast: this.generateMockForecast(),
        region: regionCode,
        coordinates: { lat, lon }
      }
    };
  }

  /**
   * Generate mock 7-day forecast
   * @returns {Array} Mock forecast data
   */
  generateMockForecast() {
    const forecast = [];
    const baseTemp = 28;

    for (let i = 0; i < 7; i++) {
      const tempVariation = (Math.random() - 0.5) * 8;
      const rainfallChance = Math.random();

      forecast.push({
        day: i,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temperature: {
          high: Math.round(baseTemp + tempVariation + 3),
          low: Math.round(baseTemp + tempVariation - 3)
        },
        rainfall: rainfallChance > 0.7 ? Math.round(Math.random() * 25) : 0,
        humidity: Math.round(65 + Math.random() * 25),
        conditions: rainfallChance > 0.7 ? 'rainy' : rainfallChance > 0.4 ? 'cloudy' : 'sunny'
      });
    }

    return forecast;
  }

  /**
   * Apply weather adjustments to calendar activities
   * @param {Array} activities - Original activities
   * @param {Object} weatherData - Current weather data
   * @param {Object} options - Adjustment options
   * @returns {Promise<Array>} Adjusted activities
   */
  async applyWeatherAdjustments(activities, weatherData, options) {
    const adjustedActivities = [];

    for (const activity of activities) {
      let adjustedActivity = { ...activity };

      // Apply rainfall adjustments
      if (options.enableRainfallAdjustment) {
        adjustedActivity = this.applyRainfallAdjustment(adjustedActivity, weatherData, options.adjustmentSensitivity);
      }

      // Apply temperature adjustments
      if (options.enableTemperatureAdjustment) {
        adjustedActivity = this.applyTemperatureAdjustment(adjustedActivity, weatherData, options.adjustmentSensitivity);
      }

      // Apply seasonal forecasting adjustments
      if (options.enableSeasonalForecasting) {
        adjustedActivity = this.applySeasonalForecastAdjustment(adjustedActivity, weatherData, options.adjustmentSensitivity);
      }

      adjustedActivities.push(adjustedActivity);
    }

    return adjustedActivities;
  }

  /**
   * Apply rainfall-based adjustments
   * @param {Object} activity - Activity to adjust
   * @param {Object} weatherData - Weather data
   * @param {string} sensitivity - Adjustment sensitivity
   * @returns {Object} Adjusted activity
   */
  applyRainfallAdjustment(activity, weatherData, sensitivity) {
    const { current, forecast } = weatherData;
    const adjustedActivity = { ...activity };

    // Check if activity is rainfall-dependent
    const rainfallDependent = ['planting', 'sowing', 'irrigation'].some(keyword =>
      activity.activity.toLowerCase().includes(keyword)
    );

    if (rainfallDependent) {
      const recentRainfall = current.rainfall || 0;
      const forecastRainfall = forecast.slice(0, 3).reduce((sum, day) => sum + day.rainfall, 0);

      if (recentRainfall > 15 || forecastRainfall > 30) {
        // Heavy rainfall - suggest delay for planting activities
        adjustedActivity.advisory = `${activity.advisory}\n\n🌧️ Weather Advisory: Recent heavy rainfall detected (${recentRainfall}mm). Consider delaying planting activities until soil moisture reduces to prevent waterlogging.`;
        adjustedActivity.weatherAdjustment = {
          type: 'rainfall_delay',
          severity: recentRainfall > 20 ? 'high' : 'medium',
          recommendation: 'delay'
        };
      } else if (recentRainfall < 2 && forecastRainfall < 5) {
        // Dry conditions - suggest irrigation or waiting for rain
        adjustedActivity.advisory = `${activity.advisory}\n\n☀️ Weather Advisory: Dry conditions detected. Consider irrigation or wait for forecasted rainfall to ensure optimal planting conditions.`;
        adjustedActivity.weatherAdjustment = {
          type: 'drought_advisory',
          severity: 'medium',
          recommendation: 'irrigate_or_wait'
        };
      }
    }

    return adjustedActivity;
  }

  /**
   * Apply temperature-based adjustments
   * @param {Object} activity - Activity to adjust
   * @param {Object} weatherData - Weather data
   * @param {string} sensitivity - Adjustment sensitivity
   * @returns {Object} Adjusted activity
   */
  applyTemperatureAdjustment(activity, weatherData, sensitivity) {
    const adjustedActivity = { ...activity };
    const currentTemp = weatherData.current.temperature;

    // Check if activity is temperature-sensitive
    const temperatureSensitive = ['planting', 'harvesting', 'fertilizer'].some(keyword =>
      activity.activity.toLowerCase().includes(keyword)
    );

    if (temperatureSensitive) {
      if (currentTemp > 35) {
        adjustedActivity.advisory = `${activity.advisory}\n\n🌡️ Temperature Advisory: High temperatures (${currentTemp}°C) detected. Consider scheduling activities during cooler parts of the day (early morning or late evening).`;
        adjustedActivity.weatherAdjustment = {
          type: 'temperature_timing',
          severity: 'medium',
          recommendation: 'schedule_for_cooler_hours'
        };
      } else if (currentTemp < 18) {
        adjustedActivity.advisory = `${activity.advisory}\n\n❄️ Temperature Advisory: Cool temperatures (${currentTemp}°C) may slow plant growth. Monitor plant development closely.`;
        adjustedActivity.weatherAdjustment = {
          type: 'temperature_monitoring',
          severity: 'low',
          recommendation: 'monitor_closely'
        };
      }
    }

    return adjustedActivity;
  }

  /**
   * Apply seasonal forecasting adjustments
   * @param {Object} activity - Activity to adjust
   * @param {Object} weatherData - Weather data
   * @param {string} sensitivity - Adjustment sensitivity
   * @returns {Object} Adjusted activity
   */
  applySeasonalForecastAdjustment(activity, weatherData, sensitivity) {
    const adjustedActivity = { ...activity };
    const forecast = weatherData.forecast;

    // Analyze forecast trends
    const avgForecastRainfall = forecast.reduce((sum, day) => sum + day.rainfall, 0) / forecast.length;
    const avgForecastTemp = forecast.reduce((sum, day) => sum + (day.temperature.high + day.temperature.low) / 2, 0) / forecast.length;

    if (avgForecastRainfall > 15) {
      adjustedActivity.advisory = `${activity.advisory}\n\n🌦️ Forecast Advisory: Heavy rainfall expected in the coming week (${Math.round(avgForecastRainfall)}mm avg). Plan drainage and disease prevention measures.`;
    } else if (avgForecastRainfall < 3) {
      adjustedActivity.advisory = `${activity.advisory}\n\n☀️ Forecast Advisory: Dry conditions expected (${Math.round(avgForecastRainfall)}mm avg). Prepare irrigation systems and consider drought-resistant practices.`;
    }

    return adjustedActivity;
  }

  /**
   * Get coordinates for Ghana regions (simplified mapping)
   * @param {string} regionCode - Region code
   * @returns {Object|null} Coordinates object or null
   */
  getRegionCoordinates(regionCode) {
    const coordinates = {
      'Greater Accra': { lat: 5.6037, lon: -0.1870 },
      'Ashanti': { lat: 6.6885, lon: -1.6244 },
      'Northern': { lat: 9.4034, lon: -0.8424 },
      'Eastern': { lat: 6.1375, lon: -0.2662 },
      'Western': { lat: 4.8970, lon: -1.7889 },
      'Volta': { lat: 6.1396, lon: 0.2739 },
      'Upper East': { lat: 10.7959, lon: -0.8571 },
      'Upper West': { lat: 10.2738, lon: -2.4969 },
      'Central': { lat: 5.2472, lon: -1.0333 },
      'Bono': { lat: 7.7397, lon: -2.3302 },
      'Western North': { lat: 6.2050, lon: -2.8145 },
      'Ahafo': { lat: 7.1756, lon: -2.6189 },
      'Savannah': { lat: 8.5455, lon: -1.8094 },
      'Oti': { lat: 7.8774, lon: 0.0341 },
      'Bono East': { lat: 7.7397, lon: -1.0362 },
      'North East': { lat: 10.4730, lon: -0.3762 }
    };

    return coordinates[regionCode] || null;
  }

  /**
   * Clear weather data cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Weather integration cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      expiryHours: this.cacheExpiry / (60 * 60 * 1000),
      entries: Array.from(this.cache.keys())
    };
  }
}

export default new WeatherCalendarIntegration();