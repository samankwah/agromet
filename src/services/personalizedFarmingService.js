/**
 * Personalized Farming Assistant Service for Phase 3 Advanced Features
 * Provides farm profiles, seasonal planning, and personalized recommendations
 */

class PersonalizedFarmingService {
  constructor() {
    // Local storage keys for persistence
    this.storageKeys = {
      farmProfile: 'triagro_farm_profile',
      farmingHistory: 'triagro_farming_history',
      preferences: 'triagro_user_preferences',
      seasonalPlan: 'triagro_seasonal_plan',
      achievements: 'triagro_achievements'
    };

    // Default farm profile structure
    this.defaultProfile = {
      id: null,
      created: new Date().toISOString(),
      personal: {
        name: '',
        experience: 'beginner', // beginner, intermediate, experienced
        language: 'en',
        region: '',
        district: ''
      },
      farm: {
        size: { value: 0, unit: 'acres' },
        soilType: '', // sandy, clay, loam, laterite
        waterSource: '', // rain-fed, irrigation, borehole, river
        farmingSystem: '', // monoculture, intercropping, mixed
        elevation: '', // lowland, upland, highland
        slope: '' // flat, gentle, steep
      },
      crops: {
        current: [], // Current season crops
        preferred: [], // Farmer's preferred crops
        experience: {}, // Crop-specific experience levels
        varieties: {}, // Preferred varieties per crop
        yields: {} // Historical yields per crop
      },
      goals: {
        primary: '', // income, food_security, export, processing
        yield_target: {},
        market_focus: '', // local, regional, export
        sustainability: [] // organic, water_conservation, soil_health
      },
      resources: {
        budget: { range: '', currency: 'GHS' },
        equipment: [], // tools and machinery available
        labor: '', // family, hired, community
        storage: '', // on-farm, warehouse, cooperative
        transportation: '' // own, hired, cooperative
      }
    };

    // Achievement system
    this.achievements = {
      'first_harvest': {
        name: 'First Harvest',
        description: 'Successfully completed your first harvest',
        icon: '🌾',
        points: 100
      },
      'disease_detective': {
        name: 'Disease Detective',
        description: 'Correctly identified 5 crop diseases',
        icon: '🔍',
        points: 150
      },
      'weather_wise': {
        name: 'Weather Wise',
        description: 'Used weather forecasts for farming decisions 10 times',
        icon: '🌦️',
        points: 200
      },
      'market_master': {
        name: 'Market Master',
        description: 'Achieved optimal selling prices 5 times',
        icon: '💰',
        points: 250
      },
      'sustainable_farmer': {
        name: 'Sustainable Farmer',
        description: 'Implemented 3 sustainable farming practices',
        icon: '🌱',
        points: 300
      },
      'yield_champion': {
        name: 'Yield Champion',
        description: 'Exceeded yield targets for 3 consecutive seasons',
        icon: '🏆',
        points: 500
      }
    };

    // Seasonal planning templates
    this.seasonalTemplates = {
      'major-rainy-season': {
        name: 'Major Rainy Season',
        period: 'March - July',
        preparation: {
          'January': ['Land preparation', 'Seed procurement', 'Tool maintenance'],
          'February': ['Final land prep', 'Input purchase', 'Weather monitoring'],
          'March': ['Planting', 'Early fertilizer application', 'Pest monitoring']
        },
        recommended_crops: {
          'Forest Zone': ['maize', 'cassava', 'plantain', 'cocoyam', 'vegetables'],
          'Guinea Savannah': ['maize', 'rice', 'yam', 'soybeans', 'groundnuts'],
          'Sudan Savannah': ['millet', 'sorghum', 'groundnuts', 'cowpea'],
          'Coastal Plains': ['maize', 'vegetables', 'cassava', 'coconut']
        }
      },
      'minor-rainy-season': {
        name: 'Minor Rainy Season',
        period: 'September - November',
        preparation: {
          'August': ['Land preparation', 'Seed selection', 'Market planning'],
          'September': ['Planting short-duration crops', 'Fertilizer application'],
          'October': ['Pest and disease management', 'Weeding']
        },
        recommended_crops: {
          'Forest Zone': ['vegetables', 'short-duration maize', 'legumes'],
          'Guinea Savannah': ['vegetables', 'legumes', 'short-duration cereals'],
          'Sudan Savannah': ['vegetables (irrigated)', 'dry season crops'],
          'Coastal Plains': ['vegetables', 'short-duration maize', 'legumes']
        }
      },
      'dry-season': {
        name: 'Dry Season',
        period: 'December - February',
        preparation: {
          'November': ['Harvest completion', 'Storage preparation', 'Equipment maintenance'],
          'December': ['Post-harvest processing', 'Market sales', 'Planning next season'],
          'January': ['Land preparation', 'Input procurement', 'Training/learning']
        },
        recommended_activities: ['Irrigation farming', 'Value addition', 'Equipment maintenance', 'Capacity building']
      }
    };

    // Load existing profile
    this.loadFarmProfile();
  }

  /**
   * Create or update farm profile
   */
  createFarmProfile(profileData) {
    try {
      const profile = {
        ...this.defaultProfile,
        ...profileData,
        id: profileData.id || this.generateProfileId(),
        updated: new Date().toISOString()
      };

      // Validate required fields
      const validation = this.validateProfile(profile);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Save profile
      localStorage.setItem(this.storageKeys.farmProfile, JSON.stringify(profile));
      this.currentProfile = profile;

      // Initialize farming history if new profile
      if (!profileData.id) {
        this.initializeFarmingHistory(profile.id);
      }

      return {
        success: true,
        profile: profile,
        message: 'Farm profile created successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load existing farm profile
   */
  loadFarmProfile() {
    try {
      const stored = localStorage.getItem(this.storageKeys.farmProfile);
      if (stored) {
        this.currentProfile = JSON.parse(stored);
        return {
          success: true,
          profile: this.currentProfile
        };
      }
      return {
        success: false,
        message: 'No farm profile found'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get personalized recommendations
   */
  getPersonalizedRecommendations(context = {}) {
    if (!this.currentProfile) {
      return {
        success: false,
        message: 'Please create a farm profile first to get personalized recommendations'
      };
    }

    const recommendations = {
      crop_selection: this.getCropRecommendations(),
      seasonal_planning: this.getSeasonalPlan(),
      resource_optimization: this.getResourceOptimization(),
      skill_development: this.getSkillDevelopment(),
      market_opportunities: this.getMarketOpportunities(),
      weather_insights: this.getWeatherInsights(),
      achievements: this.getAvailableAchievements()
    };

    return {
      success: true,
      recommendations,
      profile_summary: this.getProfileSummary()
    };
  }

  /**
   * Get crop recommendations based on profile
   */
  getCropRecommendations() {
    const { farm, crops, goals, resources } = this.currentProfile;
    const currentSeason = this.getCurrentSeason();
    const agroZone = this.getAgroZone(this.currentProfile.personal.region);
    
    const recommendations = [];

    // Get seasonal crop recommendations
    const seasonalCrops = this.seasonalTemplates[currentSeason]?.recommended_crops[agroZone] || [];
    
    seasonalCrops.forEach(crop => {
      const rec = {
        crop,
        priority: 'medium',
        reasoning: [],
        variety_suggestions: [],
        expected_yield: null,
        market_potential: 'good'
      };

      // Check if farmer has experience with this crop
      if (crops.experience[crop]) {
        rec.priority = 'high';
        rec.reasoning.push(`You have ${crops.experience[crop]} experience with ${crop}`);
      }

      // Check if it's a preferred crop
      if (crops.preferred.includes(crop)) {
        rec.priority = 'high';
        rec.reasoning.push(`${crop} is one of your preferred crops`);
      }

      // Check farm suitability
      if (this.isCropSuitableForFarm(crop, farm)) {
        rec.reasoning.push(`${crop} is well-suited to your farm conditions`);
      }

      // Add variety suggestions
      rec.variety_suggestions = this.getVarietySuggestions(crop, agroZone);

      // Market potential based on goals
      if (goals.market_focus === 'export' && ['cocoa', 'yam', 'cassava'].includes(crop)) {
        rec.market_potential = 'excellent';
        rec.reasoning.push(`${crop} has strong export potential`);
      }

      recommendations.push(rec);
    });

    return {
      current_season: currentSeason,
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      diversification_tip: 'Consider intercropping to maximize land use and reduce risk'
    };
  }

  /**
   * Generate seasonal farming plan
   */
  getSeasonalPlan() {
    const currentSeason = this.getCurrentSeason();
    const currentMonth = new Date().getMonth() + 1;
    const template = this.seasonalTemplates[currentSeason];

    if (!template) {
      return {
        error: 'No seasonal template available for current period'
      };
    }

    const plan = {
      season: template.name,
      period: template.period,
      current_month: this.getMonthName(currentMonth),
      this_month_tasks: this.getTasksForMonth(currentMonth, template),
      upcoming_tasks: this.getUpcomingTasks(template),
      crop_calendar: this.generateCropCalendar(),
      resource_planning: this.getResourcePlanning(template)
    };

    return plan;
  }

  /**
   * Get resource optimization recommendations
   */
  getResourceOptimization() {
    const { resources, farm } = this.currentProfile;
    const optimizations = [];

    // Budget optimization
    if (resources.budget.range === 'limited') {
      optimizations.push({
        category: 'budget',
        recommendation: 'Focus on high-value, low-input crops like vegetables',
        priority: 'high',
        impact: 'Maximize returns with limited investment'
      });
    }

    // Labor optimization
    if (resources.labor === 'family') {
      optimizations.push({
        category: 'labor',
        recommendation: 'Consider labor-saving techniques like direct seeding',
        priority: 'medium',
        impact: 'Reduce labor requirements during peak periods'
      });
    }

    // Equipment recommendations
    if (farm.size.value > 2 && !resources.equipment.includes('tractor')) {
      optimizations.push({
        category: 'equipment',
        recommendation: 'Consider tractor services or cooperative ownership',
        priority: 'medium',
        impact: 'Improve efficiency for larger farm operations'
      });
    }

    // Storage optimization
    if (!resources.storage) {
      optimizations.push({
        category: 'storage',
        recommendation: 'Invest in proper storage to reduce post-harvest losses',
        priority: 'high',
        impact: 'Reduce losses by 15-30% and enable better timing of sales'
      });
    }

    return optimizations;
  }

  /**
   * Get skill development recommendations
   */
  getSkillDevelopment() {
    const { personal, crops } = this.currentProfile;
    const suggestions = [];

    // Experience-based recommendations
    if (personal.experience === 'beginner') {
      suggestions.push({
        skill: 'Crop Management Basics',
        description: 'Learn fundamental crop cultivation techniques',
        resources: ['Local extension services', 'TriAgro AI tutorials', 'Farmer field schools'],
        priority: 'high'
      });
    }

    // Crop-specific skills
    Object.keys(crops.experience).forEach(crop => {
      if (crops.experience[crop] === 'beginner') {
        suggestions.push({
          skill: `Advanced ${crop} cultivation`,
          description: `Improve your ${crop} farming techniques`,
          resources: [`${crop} specific training`, 'Best practice guides'],
          priority: 'medium'
        });
      }
    });

    // Technology adoption
    suggestions.push({
      skill: 'Digital Farming Tools',
      description: 'Learn to use weather apps, market prices, and agricultural AI',
      resources: ['TriAgro AI platform', 'Mobile apps training', 'Digital literacy programs'],
      priority: 'medium'
    });

    return suggestions.slice(0, 4); // Top 4 recommendations
  }

  /**
   * Get market opportunities
   */
  getMarketOpportunities() {
    const { goals, personal } = this.currentProfile;
    const opportunities = [];

    // Regional market opportunities
    const regionalOpportunities = {
      'Greater Accra': ['vegetables', 'processed foods', 'organic produce'],
      'Ashanti': ['food crops', 'vegetables', 'poultry products'],
      'Northern': ['grains', 'legumes', 'livestock'],
      'Western': ['tree crops', 'root crops', 'vegetables']
    };

    const regional = regionalOpportunities[personal.region] || [];
    regional.forEach(opportunity => {
      opportunities.push({
        type: 'regional_market',
        product: opportunity,
        potential: 'high',
        description: `Strong demand for ${opportunity} in ${personal.region} region`
      });
    });

    // Export opportunities
    if (goals.market_focus === 'export') {
      opportunities.push({
        type: 'export',
        product: 'Yam',
        potential: 'excellent',
        description: 'Growing international demand for Ghanaian yam'
      });
    }

    // Value addition opportunities
    opportunities.push({
      type: 'value_addition',
      product: 'Processing',
      potential: 'good',
      description: 'Add value through processing (gari, flour, dried products)'
    });

    return opportunities.slice(0, 5);
  }

  /**
   * Get weather insights for farming
   */
  getWeatherInsights() {
    const currentSeason = this.getCurrentSeason();
    const month = new Date().getMonth() + 1;

    const insights = {
      current_season: currentSeason,
      seasonal_outlook: this.getSeasonalOutlook(currentSeason),
      farming_implications: this.getFarmingImplications(currentSeason, month),
      preparation_tips: this.getPreparationTips(currentSeason)
    };

    return insights;
  }

  /**
   * Track farming activity and update history
   */
  trackFarmingActivity(activity) {
    try {
      const history = this.getFarmingHistory();
      
      const activityRecord = {
        id: this.generateActivityId(),
        timestamp: new Date().toISOString(),
        season: this.getCurrentSeason(),
        ...activity
      };

      history.activities.push(activityRecord);
      
      // Check for achievements
      this.checkAchievements(activityRecord, history);

      // Save updated history
      localStorage.setItem(this.storageKeys.farmingHistory, JSON.stringify(history));

      return {
        success: true,
        activity: activityRecord
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get farming history and analytics
   */
  getFarmingAnalytics() {
    const history = this.getFarmingHistory();
    
    return {
      total_activities: history.activities.length,
      yield_trends: this.calculateYieldTrends(history),
      seasonal_performance: this.analyzeSeasonalPerformance(history),
      crop_success_rates: this.calculateCropSuccessRates(history),
      achievements: history.achievements || [],
      recommendations: this.generateAnalyticsRecommendations(history)
    };
  }

  /**
   * Helper Methods
   */
  
  generateProfileId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateActivityId() {
    return 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  validateProfile(profile) {
    const errors = [];
    
    if (!profile.personal.name) errors.push('Name is required');
    if (!profile.personal.region) errors.push('Region is required');
    if (!profile.farm.size.value || profile.farm.size.value <= 0) errors.push('Farm size must be greater than 0');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 7) return 'major-rainy-season';
    if (month >= 9 && month <= 11) return 'minor-rainy-season';
    return 'dry-season';
  }

  getAgroZone(region) {
    const zones = {
      'Northern': 'Guinea Savannah',
      'Upper East': 'Sudan Savannah',
      'Upper West': 'Sudan Savannah',
      'Greater Accra': 'Coastal Plains',
      'Central': 'Forest Zone',
      'Western': 'Forest Zone',
      'Ashanti': 'Forest Zone',
      'Eastern': 'Forest Zone'
    };
    return zones[region] || 'Forest Zone';
  }

  getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

  getFarmingHistory() {
    try {
      const stored = localStorage.getItem(this.storageKeys.farmingHistory);
      return stored ? JSON.parse(stored) : { activities: [], achievements: [] };
    } catch (error) {
      return { activities: [], achievements: [] };
    }
  }

  initializeFarmingHistory(profileId) {
    const history = {
      profileId,
      created: new Date().toISOString(),
      activities: [],
      achievements: []
    };
    localStorage.setItem(this.storageKeys.farmingHistory, JSON.stringify(history));
  }

  getProfileSummary() {
    if (!this.currentProfile) return null;

    const { personal, farm, crops } = this.currentProfile;
    return {
      farmer_name: personal.name,
      experience_level: personal.experience,
      region: personal.region,
      farm_size: `${farm.size.value} ${farm.size.unit}`,
      primary_crops: crops.current.slice(0, 3),
      farming_focus: this.currentProfile.goals.primary,
      profile_completeness: this.calculateProfileCompleteness()
    };
  }

  calculateProfileCompleteness() {
    const requiredFields = [
      'personal.name', 'personal.region', 'farm.size.value',
      'farm.soilType', 'farm.waterSource'
    ];
    
    let completed = 0;
    requiredFields.forEach(field => {
      const value = this.getNestedProperty(this.currentProfile, field);
      if (value) completed++;
    });

    return Math.round((completed / requiredFields.length) * 100);
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, prop) => current && current[prop], obj);
  }

  checkAchievements(activity, history) {
    // Implementation for checking and awarding achievements
    // This would analyze farming activities and award appropriate achievements
  }

  isCropSuitableForFarm(crop, farm) {
    // Implementation for checking crop suitability based on farm conditions
    return true; // Simplified for now
  }

  getVarietySuggestions(crop, agroZone) {
    const varieties = {
      'maize': ['Abontem', 'Obaatampa', 'Mamaba'],
      'rice': ['Jasmine', 'Nerica', 'Agra'],
      'cassava': ['Esi Abaaya', 'Tekbankye']
    };
    return varieties[crop] || [];
  }

  getAvailableAchievements() {
    const history = this.getFarmingHistory();
    const earned = history.achievements.map(a => a.id);
    
    return Object.entries(this.achievements)
      .filter(([id]) => !earned.includes(id))
      .map(([id, achievement]) => ({ id, ...achievement }))
      .slice(0, 3); // Next 3 available achievements
  }
}

export default new PersonalizedFarmingService();