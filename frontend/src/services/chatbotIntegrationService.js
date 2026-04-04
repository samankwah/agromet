/**
 * Chatbot Integration Service for Phase 3 Advanced Features
 * Integrates all Phase 3 services with the chatbot interface
 */

import visualIntegrationService from './visualIntegrationService';
import voiceLanguageService from './voiceLanguageService';
import personalizedFarmingService from './personalizedFarmingService';

class ChatbotIntegrationService {
  constructor() {
    // Integration status tracking
    this.integrationStatus = {
      visual: false,
      voice: false,
      personalized: false,
      initialized: false
    };

    // Feature flags for gradual rollout
    this.featureFlags = {
      imageAnalysis: true,
      voiceInput: true,
      voiceOutput: true,
      languageTranslation: true,
      farmProfiles: true,
      personalizedRecommendations: true,
      achievementSystem: true
    };

    this.initialize();
  }

  /**
   * Initialize all integrated services
   */
  async initialize() {
    try {
      // Check service availability
      this.integrationStatus.visual = await this.checkVisualIntegration();
      this.integrationStatus.voice = await this.checkVoiceIntegration();
      this.integrationStatus.personalized = await this.checkPersonalizedIntegration();
      
      this.integrationStatus.initialized = true;
      console.log('ChatbotIntegrationService initialized:', this.integrationStatus);
      
      return {
        success: true,
        status: this.integrationStatus
      };
    } catch (error) {
      console.error('ChatbotIntegrationService initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enhanced message processing with Phase 3 features
   */
  async processEnhancedMessage(message, imageData = null, userContext = {}) {
    try {
      // Check service availability first
      if (!this.integrationStatus.initialized) {
        await this.initialize();
      }

      let enhancedResponse = {
        text: '',
        features: {
          imageAnalysis: null,
          voiceResponse: null,
          personalizedAdvice: null,
          languageSupport: null
        },
        metadata: {
          processingTime: Date.now(),
          featuresUsed: []
        }
      };

      // 1. Image Analysis Integration
      if (imageData && this.featureFlags.imageAnalysis) {
        const imageAnalysis = await this.processImageWithChatbot(message, imageData, userContext);
        if (imageAnalysis.success) {
          enhancedResponse.features.imageAnalysis = imageAnalysis;
          enhancedResponse.metadata.featuresUsed.push('image-analysis');
          enhancedResponse.text = imageAnalysis.response;
        }
      }

      // 2. Language Detection and Translation
      if (this.featureFlags.languageTranslation) {
        try {
          const languageProcessing = await this.processLanguage(message, userContext.language);
          if (languageProcessing.success) {
            enhancedResponse.features.languageSupport = languageProcessing;
            enhancedResponse.metadata.featuresUsed.push('language-support');
          }
        } catch (langError) {
          console.warn('Language processing failed, continuing without translation:', langError.message);
        }
      }

      // 3. Personalized Farming Integration
      if (this.featureFlags.personalizedRecommendations) {
        const personalizedAdvice = await this.getPersonalizedResponse(message, userContext);
        if (personalizedAdvice.success) {
          enhancedResponse.features.personalizedAdvice = personalizedAdvice;
          enhancedResponse.metadata.featuresUsed.push('personalized-advice');
          
          // Enhance response with personalized context
          if (!enhancedResponse.text) {
            enhancedResponse.text = personalizedAdvice.response;
          } else {
            enhancedResponse.text += `\n\n**🎯 Personalized for you:**\n${personalizedAdvice.contextualAdvice}`;
          }
        }
      }

      // 4. Voice Response Generation
      if (this.featureFlags.voiceOutput && userContext.preferVoice) {
        const voiceResponse = await this.generateVoiceResponse(enhancedResponse.text, userContext.language);
        if (voiceResponse.success) {
          enhancedResponse.features.voiceResponse = voiceResponse;
          enhancedResponse.metadata.featuresUsed.push('voice-output');
        }
      }

      enhancedResponse.metadata.processingTime = Date.now() - enhancedResponse.metadata.processingTime;
      return {
        success: true,
        response: enhancedResponse
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackResponse(message)
      };
    }
  }

  /**
   * Process image with chatbot context
   */
  async processImageWithChatbot(message, imageData, userContext) {
    try {
      return await visualIntegrationService.processChatbotImageQuery(
        message,
        imageData,
        {
          ...userContext,
          farmProfile: await this.getFarmProfileContext()
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process language detection and translation
   */
  async processLanguage(message, preferredLanguage = 'en') {
    try {
      const languageProcessing = await voiceLanguageService.processMultilingualQuery(
        message,
        'auto',
        preferredLanguage
      );

      if (languageProcessing.success && languageProcessing.requiresTranslation) {
        const translation = await voiceLanguageService.translateText(
          message,
          'en',
          languageProcessing.detectedLanguage
        );
        
        return {
          success: true,
          detectedLanguage: languageProcessing.detectedLanguage,
          translation: translation,
          originalMessage: message,
          processedMessage: languageProcessing.processedQuery
        };
      }

      return {
        success: true,
        detectedLanguage: languageProcessing.detectedLanguage || 'en',
        translation: null,
        processedMessage: message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get personalized response based on farm profile
   */
  async getPersonalizedResponse(message, userContext) {
    try {
      const farmProfile = personalizedFarmingService.currentProfile;
      
      if (!farmProfile) {
        return {
          success: true,
          response: this.generateProfileSetupPrompt(),
          contextualAdvice: 'Create a farm profile to get personalized advice.',
          profileRequired: true
        };
      }

      // Get personalized recommendations
      const recommendations = personalizedFarmingService.getPersonalizedRecommendations({
        currentQuery: message,
        userLocation: userContext.region,
        currentSeason: userContext.season
      });

      if (recommendations.success) {
        const contextualAdvice = this.generateContextualAdvice(message, recommendations, farmProfile);
        
        return {
          success: true,
          response: contextualAdvice,
          recommendations: recommendations.recommendations,
          profileSummary: recommendations.profile_summary,
          contextualAdvice: this.extractRelevantAdvice(message, recommendations)
        };
      }

      return {
        success: false,
        error: 'Unable to generate personalized recommendations'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate voice response
   */
  async generateVoiceResponse(text, language = 'en') {
    try {
      const voiceFriendlyText = voiceLanguageService.generateVoiceFriendlyResponse(text, language);
      
      return {
        success: true,
        voiceText: voiceFriendlyText,
        language: language,
        canSpeak: voiceLanguageService.getStatus().speechSynthesis.supported
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get farm profile context for enhanced responses
   */
  async getFarmProfileContext() {
    const profile = personalizedFarmingService.currentProfile;
    if (!profile) return null;

    return {
      farmerName: profile.personal.name,
      experience: profile.personal.experience,
      region: profile.personal.region,
      farmSize: `${profile.farm.size.value} ${profile.farm.size.unit}`,
      currentCrops: profile.crops.current,
      farmingGoals: profile.goals.primary,
      soilType: profile.farm.soilType,
      waterSource: profile.farm.waterSource
    };
  }

  /**
   * Generate contextual advice based on query and profile
   */
  generateContextualAdvice(query, recommendations, profile) {
    const lowerQuery = query.toLowerCase();
    let advice = '';

    // Crop-specific advice
    if (lowerQuery.includes('crop') || lowerQuery.includes('plant')) {
      const cropRecs = recommendations.recommendations.crop_selection;
      if (cropRecs && cropRecs.recommendations.length > 0) {
        const topCrop = cropRecs.recommendations[0];
        advice += `Based on your ${profile.farm.size.value} ${profile.farm.size.unit} farm in ${profile.personal.region}, I recommend **${topCrop.crop}** for the current season. `;
        advice += `This choice is prioritized as ${topCrop.priority} because: ${topCrop.reasoning.join(', ')}.`;
      }
    }

    // Seasonal advice
    if (lowerQuery.includes('season') || lowerQuery.includes('when')) {
      const seasonalPlan = recommendations.recommendations.seasonal_planning;
      if (seasonalPlan) {
        advice += `For ${seasonalPlan.season} (${seasonalPlan.period}), your main tasks this month include: ${seasonalPlan.this_month_tasks.join(', ')}.`;
      }
    }

    // Resource optimization
    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('resources')) {
      const resourceOpt = recommendations.recommendations.resource_optimization;
      if (resourceOpt && resourceOpt.length > 0) {
        const topRecommendation = resourceOpt[0];
        advice += `Resource optimization tip: ${topRecommendation.recommendation} - ${topRecommendation.impact}`;
      }
    }

    return advice || 'Based on your farm profile, I can provide more specific advice. What particular aspect of farming would you like help with?';
  }

  /**
   * Extract relevant advice from recommendations
   */
  extractRelevantAdvice(query, recommendations) {
    const advice = [];
    
    // Add relevant recommendations based on query
    if (query.toLowerCase().includes('market')) {
      const marketOps = recommendations.recommendations.market_opportunities;
      if (marketOps && marketOps.length > 0) {
        advice.push(`💰 Market opportunity: ${marketOps[0].description}`);
      }
    }

    if (query.toLowerCase().includes('skill') || query.toLowerCase().includes('learn')) {
      const skillDev = recommendations.recommendations.skill_development;
      if (skillDev && skillDev.length > 0) {
        advice.push(`📚 Skill development: ${skillDev[0].description}`);
      }
    }

    return advice.join('\n');
  }

  /**
   * Generate profile setup prompt
   */
  generateProfileSetupPrompt() {
    return `**🌱 Welcome to Personalized Farming!**

To provide you with the most relevant agricultural advice, I'd love to learn about your farm. 

**Quick Setup:**
• Farm location (region/district)
• Farm size and crops you grow
• Your farming experience level
• Primary farming goals

Would you like me to help you set up your farm profile? This will enable me to provide:
- Location-specific crop recommendations
- Seasonal planning for your area
- Resource optimization for your farm size
- Personalized market opportunities

Just tell me about your farm, and I'll create your profile!`;
  }

  /**
   * Generate fallback response
   */
  generateFallbackResponse(message) {
    return `I'm having trouble processing your request right now, but I'm still here to help! 

Try asking about:
- Crop cultivation and farming techniques
- Weather and seasonal planning
- Pest and disease management  
- Market prices and opportunities
- Agricultural best practices for Ghana

You can also upload a photo of your crops for analysis, or set up a farm profile for personalized advice.`;
  }

  /**
   * Check service integration status
   */
  async checkVisualIntegration() {
    try {
      const integration = visualIntegrationService.getDiagnosticToolIntegration();
      return !!integration.endpoint;
    } catch (error) {
      return false;
    }
  }

  async checkVoiceIntegration() {
    try {
      const status = voiceLanguageService.getStatus();
      return status.speechSynthesis.supported || status.speechRecognition.supported;
    } catch (error) {
      return false;
    }
  }

  async checkPersonalizedIntegration() {
    try {
      const profile = personalizedFarmingService.loadFarmProfile();
      return true; // Service is available
    } catch (error) {
      return false;
    }
  }

  /**
   * Get integration capabilities
   */
  getCapabilities() {
    return {
      features: this.featureFlags,
      status: this.integrationStatus,
      services: {
        visual: {
          imageAnalysis: this.featureFlags.imageAnalysis,
          supportedFormats: ['jpg', 'png', 'webp'],
          maxFileSize: '10MB',
          analysisTypes: Object.keys(visualIntegrationService.analysisTypes)
        },
        voice: {
          speechSynthesis: this.featureFlags.voiceOutput,
          speechRecognition: this.featureFlags.voiceInput,
          supportedLanguages: Object.keys(voiceLanguageService.supportedLanguages),
          translation: this.featureFlags.languageTranslation
        },
        personalized: {
          farmProfiles: this.featureFlags.farmProfiles,
          recommendations: this.featureFlags.personalizedRecommendations,
          achievements: this.featureFlags.achievementSystem,
          analytics: true
        }
      }
    };
  }

  /**
   * Update feature flags
   */
  updateFeatureFlags(newFlags) {
    this.featureFlags = { ...this.featureFlags, ...newFlags };
    return this.featureFlags;
  }
}

export default new ChatbotIntegrationService();