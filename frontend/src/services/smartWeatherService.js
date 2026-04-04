/**
 * Smart Weather Service for Agricultural Decisions
 * Provides weather-informed farming recommendations for Ghana
 */

import ghanaRegions from '../assets/ghana-regions.json';

class SmartWeatherService {
  constructor() {
    // Ghana-specific weather stations and regional data
    this.weatherStations = {
      'Greater Accra': { lat: 5.6037, lon: -0.1870, station: 'Kotoka Airport' },
      'Ashanti': { lat: 6.6885, lon: -1.6244, station: 'Kumasi Airport' },
      'Northern': { lat: 9.4028, lon: -0.8424, station: 'Tamale Airport' },
      'Western': { lat: 4.8960, lon: -1.7847, station: 'Takoradi' },
      'Eastern': { lat: 6.0833, lon: -0.2500, station: 'Koforidua' },
      'Central': { lat: 5.1053, lon: -1.2466, station: 'Cape Coast' },
      'Volta': { lat: 6.1108, lon: 0.4708, station: 'Ho' },
      'Upper East': { lat: 10.7890, lon: -0.8514, station: 'Bolgatanga' },
      'Upper West': { lat: 10.0608, lon: -2.5073, station: 'Wa' },
      'Brong Ahafo': { lat: 7.7167, lon: -2.3167, station: 'Sunyani' }
    };

    // Crop-specific weather requirements
    this.cropWeatherRequirements = {
      maize: {
        minRainfall: 500, // mm per season
        optimalTemp: { min: 20, max: 30 }, // Celsius
        growingDays: { Abontem: 90, Obaatampa: 120 },
        criticalStages: {
          planting: { soilMoisture: 'adequate', temperature: '>18°C' },
          flowering: { rainfall: 'moderate', noStress: true },
          grain_filling: { rainfall: 'light', temperature: '<35°C' }
        }
      },
      rice: {
        minRainfall: 1000, // mm per season
        optimalTemp: { min: 22, max: 32 },
        growingDays: { Jasmine: 120, Nerica: 110 },
        waterRequirement: 'continuous flooding or adequate moisture',
        criticalStages: {
          nursery: { temperature: '25-30°C', moisture: 'saturated' },
          transplanting: { rainfall: 'heavy', flooding: 'preferred' },
          booting: { temperature: '<35°C', humidity: 'high' }
        }
      },
      cassava: {
        minRainfall: 1000,
        optimalTemp: { min: 25, max: 35 },
        growingDays: { 'Esi Abaaya': 365 },
        droughtTolerance: 'high',
        criticalStages: {
          establishment: { rainfall: 'moderate', temperature: '>20°C' },
          tuber_formation: { rainfall: 'adequate', dry_season: 'tolerated' }
        }
      },
      yam: {
        minRainfall: 1200,
        optimalTemp: { min: 25, max: 30 },
        growingDays: { Puna: 240 },
        criticalStages: {
          planting: { rainfall: 'onset_of_rains', soil_temp: '>20°C' },
          tuber_bulking: { rainfall: 'consistent', drainage: 'good' }
        }
      }
    };

    // Weather patterns and farming calendar for Ghana
    this.seasonalPatterns = {
      'major-rainy-season': {
        months: [3, 4, 5, 6, 7], // March to July
        characteristics: 'Heavy rainfall, high humidity, optimal planting time',
        averageRainfall: '600-1200mm',
        recommendedCrops: ['maize', 'rice', 'cassava', 'yam', 'plantain']
      },
      'minor-rainy-season': {
        months: [9, 10, 11], // September to November
        characteristics: 'Moderate rainfall, suitable for short-duration crops',
        averageRainfall: '200-600mm',
        recommendedCrops: ['maize', 'vegetables', 'legumes']
      },
      'dry-season': {
        months: [12, 1, 2], // December to February
        characteristics: 'Low rainfall, dry harmattan winds, irrigation needed',
        averageRainfall: '0-100mm',
        recommendedCrops: ['vegetables (irrigated)', 'land preparation']
      }
    };
  }

  /**
   * Get current season based on month
   */
  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    
    if (this.seasonalPatterns['major-rainy-season'].months.includes(month)) {
      return 'major-rainy-season';
    } else if (this.seasonalPatterns['minor-rainy-season'].months.includes(month)) {
      return 'minor-rainy-season';
    } else {
      return 'dry-season';
    }
  }

  /**
   * Generate mock weather data for Ghana regions
   * In production, this would connect to actual weather APIs
   */
  async getRegionalWeather(region) {
    const currentSeason = this.getCurrentSeason();
    const month = new Date().getMonth() + 1;
    
    // Simulate realistic weather for Ghana
    const baseWeather = this.generateRealisticWeather(region, currentSeason, month);
    
    return {
      current: baseWeather.current,
      forecast: baseWeather.forecast,
      alerts: baseWeather.alerts,
      agricultural: {
        season: currentSeason,
        plantingWindow: this.getPlantingWindow(region, currentSeason),
        irrigationNeeds: this.getIrrigationNeeds(region, baseWeather.current),
        harvestConditions: this.getHarvestConditions(baseWeather.forecast)
      }
    };
  }

  /**
   * Generate realistic weather data for Ghana
   */
  generateRealisticWeather(region, season, month) {
    const isNorthern = ['Northern', 'Upper East', 'Upper West'].includes(region);
    const isCoastal = ['Greater Accra', 'Central', 'Western'].includes(region);
    
    let temperature, humidity, rainfall, condition;
    
    if (season === 'major-rainy-season') {
      temperature = isNorthern ? 28 : (isCoastal ? 26 : 25);
      humidity = isNorthern ? 70 : 85;
      rainfall = Math.random() > 0.3 ? 'likely' : 'none';
      condition = rainfall === 'likely' ? 'Rainy' : 'Cloudy';
    } else if (season === 'minor-rainy-season') {
      temperature = isNorthern ? 30 : (isCoastal ? 27 : 26);
      humidity = isNorthern ? 60 : 75;
      rainfall = Math.random() > 0.5 ? 'light' : 'none';
      condition = rainfall === 'light' ? 'Light Rain' : 'Partly Cloudy';
    } else { // dry-season
      temperature = isNorthern ? 35 : (isCoastal ? 29 : 31);
      humidity = isNorthern ? 30 : 60;
      rainfall = 'none';
      condition = isNorthern ? 'Hot & Dry' : 'Sunny';
    }

    const current = {
      temperature: temperature + Math.floor(Math.random() * 4 - 2), // ±2°C variation
      humidity: humidity + Math.floor(Math.random() * 10 - 5), // ±5% variation
      condition,
      rainfall,
      windSpeed: Math.floor(Math.random() * 15 + 5), // 5-20 km/h
      pressure: 1013 + Math.floor(Math.random() * 20 - 10), // ±10 hPa
      timestamp: new Date().toISOString()
    };

    // Generate 7-day forecast
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        highTemp: current.temperature + Math.floor(Math.random() * 6 - 3),
        lowTemp: current.temperature - Math.floor(Math.random() * 8 + 3),
        condition: this.getRandomCondition(season),
        rainfall: season === 'dry-season' ? 0 : Math.floor(Math.random() * 20),
        humidity: current.humidity + Math.floor(Math.random() * 10 - 5)
      });
    }

    // Generate weather alerts
    const alerts = this.generateWeatherAlerts(current, forecast, season, region);

    return { current, forecast, alerts };
  }

  /**
   * Get random weather condition based on season
   */
  getRandomCondition(season) {
    const conditions = {
      'major-rainy-season': ['Rainy', 'Heavy Rain', 'Cloudy', 'Thunderstorms', 'Partly Cloudy'],
      'minor-rainy-season': ['Light Rain', 'Cloudy', 'Partly Cloudy', 'Sunny'],
      'dry-season': ['Sunny', 'Hot & Dry', 'Clear', 'Dusty']
    };
    
    const seasonConditions = conditions[season];
    return seasonConditions[Math.floor(Math.random() * seasonConditions.length)];
  }

  /**
   * Generate weather alerts for farming
   */
  generateWeatherAlerts(current, forecast, season, region) {
    const alerts = [];
    
    // Temperature alerts
    if (current.temperature > 35) {
      alerts.push({
        type: 'heat_stress',
        severity: 'high',
        message: 'Extreme heat warning: Protect crops from heat stress. Increase irrigation frequency.',
        action: 'Apply mulch, provide shade for sensitive crops, irrigate early morning/evening'
      });
    }
    
    // Rainfall alerts
    const upcomingRain = forecast.filter(day => day.rainfall > 10).length;
    if (season === 'dry-season' && upcomingRain === 0) {
      alerts.push({
        type: 'drought_risk',
        severity: 'medium',
        message: 'Extended dry period ahead. Plan irrigation strategy for crops.',
        action: 'Check irrigation systems, conserve water, consider drought-resistant varieties'
      });
    }
    
    if (upcomingRain > 4) {
      alerts.push({
        type: 'excess_rainfall',
        severity: 'medium', 
        message: 'Heavy rainfall expected. Ensure proper drainage and protect crops.',
        action: 'Clear drainage channels, harvest mature crops, protect seedlings'
      });
    }
    
    // Seasonal planting alerts
    if (season === 'major-rainy-season' && current.condition === 'Rainy') {
      alerts.push({
        type: 'planting_opportunity',
        severity: 'low',
        message: 'Good soil moisture conditions for planting major season crops.',
        action: 'Consider planting maize, rice, cassava, or yam if soil is well-prepared'
      });
    }

    return alerts;
  }

  /**
   * Get planting window recommendations
   */
  getPlantingWindow(region, season) {
    const isNorthern = ['Northern', 'Upper East', 'Upper West'].includes(region);
    
    const windows = {
      'major-rainy-season': {
        northern: 'April-May: Ideal for maize, rice, yam, soybeans',
        southern: 'March-April: Plant maize, cassava, plantain, vegetables'
      },
      'minor-rainy-season': {
        northern: 'Not recommended for major crops',
        southern: 'September-October: Short-duration maize, vegetables'
      },
      'dry-season': {
        northern: 'Irrigation farming only: vegetables, dry season rice',
        southern: 'Land preparation period, irrigated vegetables'
      }
    };
    
    return isNorthern ? windows[season].northern : windows[season].southern;
  }

  /**
   * Determine irrigation needs
   */
  getIrrigationNeeds(region, currentWeather) {
    const season = this.getCurrentSeason();
    
    if (season === 'dry-season') {
      return 'Critical: Daily irrigation needed for all crops';
    } else if (currentWeather.condition.includes('Sunny') && currentWeather.humidity < 50) {
      return 'Moderate: Supplement rainfall with light irrigation';
    } else if (currentWeather.condition.includes('Rain')) {
      return 'Minimal: Natural rainfall adequate, monitor drainage';
    } else {
      return 'Low: Monitor soil moisture, irrigate if needed';
    }
  }

  /**
   * Analyze harvest conditions
   */
  getHarvestConditions(forecast) {
    const dryDays = forecast.filter(day => day.rainfall < 2).length;
    const wetDays = forecast.filter(day => day.rainfall > 10).length;
    
    if (dryDays >= 5) {
      return 'Excellent: Extended dry period ideal for harvesting and drying';
    } else if (wetDays >= 4) {
      return 'Poor: Heavy rainfall expected, delay harvest if possible';
    } else if (dryDays >= 3) {
      return 'Good: Some dry days available for harvest activities';
    } else {
      return 'Fair: Mixed conditions, harvest quickly during dry windows';
    }
  }

  /**
   * Smart planting recommendations
   */
  async getPlantingRecommendation(region, crop, userQuery) {
    const weather = await this.getRegionalWeather(region);
    const cropRequirements = this.cropWeatherRequirements[crop.toLowerCase()];
    const season = this.getCurrentSeason();
    
    if (!cropRequirements) {
      return `I don't have specific weather requirements for ${crop}. Please consult local agricultural extension services.`;
    }

    const recommendation = {
      shouldPlant: false,
      confidence: 'low',
      reasoning: [],
      alternatives: [],
      timing: ''
    };

    // Analyze current conditions
    const currentTemp = weather.current.temperature;
    const soilMoisture = weather.current.condition.includes('Rain') ? 'adequate' : 'low';
    
    // Temperature check
    if (currentTemp >= cropRequirements.optimalTemp.min && 
        currentTemp <= cropRequirements.optimalTemp.max) {
      recommendation.reasoning.push(`✓ Temperature (${currentTemp}°C) is optimal for ${crop}`);
      recommendation.shouldPlant = true;
    } else {
      recommendation.reasoning.push(`✗ Temperature (${currentTemp}°C) is outside optimal range (${cropRequirements.optimalTemp.min}-${cropRequirements.optimalTemp.max}°C)`);
    }

    // Season appropriateness
    const seasonalCrops = this.seasonalPatterns[season].recommendedCrops;
    if (seasonalCrops.includes(crop.toLowerCase())) {
      recommendation.reasoning.push(`✓ Current ${season.replace('-', ' ')} is suitable for ${crop}`);
      recommendation.shouldPlant = recommendation.shouldPlant && true;
    } else {
      recommendation.reasoning.push(`✗ Current ${season.replace('-', ' ')} is not ideal for ${crop}`);
      recommendation.shouldPlant = false;
    }

    // Rainfall/moisture analysis
    const upcomingRain = weather.forecast.filter(day => day.rainfall > 5).length;
    if (crop.toLowerCase() === 'rice' && upcomingRain < 3) {
      recommendation.reasoning.push(`✗ Insufficient rainfall forecast for rice cultivation`);
      recommendation.shouldPlant = false;
    } else if (soilMoisture === 'adequate') {
      recommendation.reasoning.push(`✓ Adequate soil moisture for planting`);
    }

    // Set confidence and timing
    if (recommendation.shouldPlant) {
      recommendation.confidence = 'high';
      recommendation.timing = `Plant within the next 1-2 weeks to take advantage of current conditions`;
    } else {
      recommendation.confidence = 'low';
      if (season === 'dry-season') {
        recommendation.timing = `Wait for rainy season (March-April for major season)`;
        recommendation.alternatives = ['Consider irrigated vegetables', 'Prepare land for next season'];
      } else {
        recommendation.timing = `Monitor weather for improved conditions`;
      }
    }

    return this.formatPlantingRecommendation(crop, region, recommendation, weather);
  }

  /**
   * Format planting recommendation for user
   */
  formatPlantingRecommendation(crop, region, recommendation, weather) {
    const shouldPlantText = recommendation.shouldPlant ? 
      `✅ YES, plant ${crop} now in ${region}` : 
      `❌ NOT recommended to plant ${crop} now in ${region}`;

    let response = `**${shouldPlantText}** (${recommendation.confidence} confidence)\n\n`;
    
    response += `**Analysis:**\n${recommendation.reasoning.join('\n')}\n\n`;
    
    if (recommendation.timing) {
      response += `**Timing:** ${recommendation.timing}\n\n`;
    }
    
    if (recommendation.alternatives.length > 0) {
      response += `**Alternatives:** ${recommendation.alternatives.join(', ')}\n\n`;
    }
    
    response += `**Current Conditions in ${region}:**\n`;
    response += `• Temperature: ${weather.current.temperature}°C\n`;
    response += `• Condition: ${weather.current.condition}\n`;
    response += `• Humidity: ${weather.current.humidity}%\n\n`;
    
    if (weather.alerts.length > 0) {
      response += `**Weather Alerts:**\n`;
      weather.alerts.forEach(alert => {
        response += `⚠️ ${alert.message}\n`;
      });
    }

    return response;
  }

  /**
   * Get irrigation recommendations
   */
  async getIrrigationRecommendation(region, crop) {
    const weather = await this.getRegionalWeather(region);
    const irrigation = weather.agricultural.irrigationNeeds;
    
    let response = `**Irrigation Recommendation for ${crop} in ${region}:**\n\n`;
    response += `${irrigation}\n\n`;
    
    response += `**Current Conditions:**\n`;
    response += `• Temperature: ${weather.current.temperature}°C\n`;
    response += `• Humidity: ${weather.current.humidity}%\n`;
    response += `• Condition: ${weather.current.condition}\n\n`;
    
    // Specific irrigation advice based on crop
    if (crop.toLowerCase() === 'rice') {
      response += `**Rice-Specific Advice:**\n`;
      response += `• Maintain 2-5cm water depth in paddies\n`;
      response += `• Drain before fertilizer application\n`;
      response += `• Increase water depth during drought stress\n`;
    } else if (crop.toLowerCase() === 'vegetables') {
      response += `**Vegetable-Specific Advice:**\n`;
      response += `• Water early morning or evening\n`;
      response += `• Use drip irrigation for efficiency\n`;
      response += `• Mulch to retain soil moisture\n`;
    }
    
    return response;
  }

  /**
   * Get harvest timing recommendations
   */
  async getHarvestRecommendation(region, crop) {
    const weather = await this.getRegionalWeather(region);
    const harvestConditions = weather.agricultural.harvestConditions;
    
    let response = `**Harvest Timing for ${region}:**\n\n`;
    response += `${harvestConditions}\n\n`;
    
    response += `**7-Day Forecast:**\n`;
    weather.forecast.forEach(day => {
      const icon = day.rainfall > 10 ? '🌧️' : day.rainfall > 2 ? '🌦️' : '☀️';
      response += `${icon} ${day.date}: ${day.highTemp}°C/${day.lowTemp}°C, ${day.condition}\n`;
    });
    
    response += `\n**Recommendation:** `;
    const dryDays = weather.forecast.filter(day => day.rainfall < 2).length;
    if (dryDays >= 3) {
      response += `Good harvest window available. Plan harvest activities for dry days.`;
    } else {
      response += `Limited dry days. Harvest quickly when conditions permit.`;
    }
    
    return response;
  }
}

export default new SmartWeatherService();