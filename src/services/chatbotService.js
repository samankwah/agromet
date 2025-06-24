import axios from 'axios';
import chatbotIntegrationService from './chatbotIntegrationService';

class ChatbotService {
  constructor() {
    // Use local proxy server to avoid CORS issues
    this.apiUrl = 'http://localhost:3001/api/chat';
    this.faqUrl = 'http://localhost:3001/api/faq';
    this.healthUrl = 'http://localhost:3001/api/health';
  }


  // Enhanced message sending with Phase 3 features
  async sendEnhancedMessage(message, conversationHistory = [], userContext = {}, imageData = null) {
    try {
      // First try Phase 3 enhanced processing
      const enhancedResult = await chatbotIntegrationService.processEnhancedMessage(
        message, 
        imageData, 
        userContext
      );

      if (enhancedResult.success && enhancedResult.response.text) {
        return {
          success: true,
          message: enhancedResult.response.text,
          features: enhancedResult.response.features,
          metadata: enhancedResult.response.metadata,
          enhanced: true
        };
      }

      // Fallback to regular message processing
      return await this.sendMessage(message, conversationHistory, userContext);
    } catch (error) {
      console.error('Enhanced message processing failed, falling back to regular:', error);
      return await this.sendMessage(message, conversationHistory, userContext);
    }
  }

  // Send message to Claude API via proxy server
  async sendMessage(message, conversationHistory = [], userContext = {}) {
    try {
      // Check if proxy server is running
      await this.checkServerHealth();

      const requestBody = {
        message,
        conversationHistory,
        userContext
      };

      const response = await axios.post(
        this.apiUrl,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data?.success && response.data?.message) {
        return {
          success: true,
          message: response.data.message,
          usage: response.data.usage,
        };
      } else {
        throw new Error(response.data?.error || 'Invalid response from proxy server');
      }
    } catch (error) {
      console.error('Chatbot service error:', error);
      
      // Handle different types of errors
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        return {
          success: false,
          error: 'Cannot connect to proxy server. Please ensure the server is running.',
          fallbackMessage: "I'm having trouble connecting to the server. Please make sure the backend server is running (npm run server) and try again."
        };
      } else if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Authentication failed. Please check your Claude API key.',
          fallbackMessage: "I'm having trouble connecting right now. Please try again later or contact support."
        };
      } else if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          fallbackMessage: "I'm receiving too many requests right now. Please wait a moment and try again."
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          error: 'Invalid request format',
          fallbackMessage: "There was an issue with your request. Please try rephrasing your question."
        };
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          success: false,
          error: 'Request timeout',
          fallbackMessage: "Sorry, that took too long to process. Please try asking your question again."
        };
      } else {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
          fallbackMessage: error.response?.data?.fallbackMessage || "I'm experiencing technical difficulties. Please try again in a few moments."
        };
      }
    }
  }

  // Check if proxy server is running
  async checkServerHealth() {
    try {
      await axios.get(this.healthUrl, { timeout: 5000 });
      return true;
    } catch (error) {
      throw new Error('Proxy server is not running. Please start it with: npm run server');
    }
  }

  // Get agriculture-related FAQ responses for common questions
  async getFAQResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced pattern matching for Ghana-specific agricultural questions
    const localPatterns = {
      // Crop Planting & Timing
      'when to plant maize': 'when-to-plant-maize',
      'when to plant rice': 'when-to-plant-rice', 
      'when to plant cassava': 'when-to-plant-cassava',
      'when to plant yam': 'when-to-plant-yam',
      'maize planting time': 'when-to-plant-maize',
      'rice planting time': 'when-to-plant-rice',
      
      // Fertilizer & Soil Management
      'maize fertilizer': 'maize-fertilizer',
      'rice fertilizer': 'rice-fertilizer',
      'best fertilizer': 'best-fertilizer',
      'soil preparation': 'soil-preparation',
      'fertilizer application': 'best-fertilizer',
      'npk fertilizer': 'best-fertilizer',
      
      // Pest & Disease Management
      'fall armyworm': 'fall-armyworm-control',
      'armyworm control': 'fall-armyworm-control',
      'crop disease': 'how-to-treat-crop-disease',
      'how to treat crop disease': 'how-to-treat-crop-disease',
      'rice pest': 'rice-pest-control',
      'vegetable pest': 'vegetable-pest-management',
      'pest control': 'how-to-treat-crop-disease',
      
      // Weather & Seasonal Farming
      'rainy season farming': 'rainy-season-farming',
      'dry season farming': 'dry-season-farming',
      'weather farming': 'weather-farming',
      'seasonal farming': 'rainy-season-farming',
      
      // Regional Specific
      'northern ghana farming': 'northern-ghana-farming',
      'southern ghana farming': 'southern-ghana-farming',
      'coastal farming': 'coastal-farming',
      
      // Market & Economics
      'crop prices': 'crop-prices',
      'market prices': 'crop-prices',
      'profitable crops': 'profitable-crops',
      'post harvest storage': 'post-harvest-storage',
      'storage methods': 'post-harvest-storage',
      
      // Varieties & Seeds
      'maize varieties': 'maize-varieties',
      'rice varieties': 'rice-varieties',
      'seed varieties': 'maize-varieties',
      'abontem': 'maize-varieties',
      'obaatampa': 'maize-varieties',
      'jasmine rice': 'rice-varieties',
      
      // General Farming Practices
      'organic farming': 'organic-farming',
      'irrigation farming': 'irrigation-farming',
      'crop rotation': 'crop-rotation',
      'drip irrigation': 'irrigation-farming'
    };

    for (const [pattern, endpoint] of Object.entries(localPatterns)) {
      if (lowerMessage.includes(pattern)) {
        try {
          const response = await axios.get(`${this.faqUrl}/${endpoint}`, { timeout: 3000 });
          if (response.data?.success) {
            return response.data.message;
          }
        } catch (error) {
          console.warn('FAQ endpoint failed, falling back to local responses:', error.message);
          // Fallback to local responses if server is unavailable
          break;
        }
      }
    }
    
    // Local fallback responses
    const localFaqs = {
      'when to plant maize': 'In Ghana, maize is typically planted at the beginning of the rainy season (April-June for major season, September-November for minor season). Wait for consistent soil moisture before planting.',
      'when to plant rice': 'Rice planting in Ghana depends on your region. In the north, plant during May-July. In irrigated areas, you can plant year-round with proper water management.',
      'how to treat crop disease': 'First, identify the specific disease by examining symptoms. Common treatments include proper spacing for air circulation, removing infected plants, and using appropriate fungicides or organic treatments like neem oil.',
      'best fertilizer': 'For most crops in Ghana, NPK fertilizers work well. Organic options include compost, poultry manure, and cow dung. Soil testing helps determine specific nutrient needs.',
      'weather farming': 'Check weather forecasts regularly. Plant before rains, protect crops during storms, and harvest during dry periods. Use our weather section for detailed forecasts.',
    };

    for (const [key, response] of Object.entries(localFaqs)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return null;
  }

  // Validate message before sending
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Message is required and must be text.' };
    }
    
    if (message.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty.' };
    }
    
    if (message.length > 1000) {
      return { valid: false, error: 'Message is too long. Please keep it under 1000 characters.' };
    }
    
    return { valid: true };
  }

  // Get conversation summary for long chats
  async summarizeConversation(conversationHistory) {
    if (conversationHistory.length < 6) {
      return conversationHistory; // No need to summarize short conversations
    }

    try {
      const messages = [
        {
          role: 'user',
          content: `Summarize this agricultural conversation, keeping key farming advice and context. Be concise but preserve important details: ${JSON.stringify(conversationHistory.slice(0, -2))}`
        }
      ];

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          max_tokens: 200,
          temperature: 0.3,
          system: 'You are a helpful assistant that summarizes agricultural conversations concisely.',
          messages: messages
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': this.apiVersion,
          }
        }
      );

      if (response.data?.content?.[0]?.text) {
        return [
          {
            role: 'system',
            content: `Previous conversation summary: ${response.data.content[0].text}`
          },
          ...conversationHistory.slice(-2) // Keep last 2 messages
        ];
      }
    } catch (error) {
      console.error('Failed to summarize conversation:', error);
    }

    // Fallback: just keep recent messages
    return conversationHistory.slice(-4);
  }
}

// Create singleton instance
const chatbotService = new ChatbotService();

export default chatbotService;