/**
 * Voice & Language Service for Phase 3 Advanced Features
 * Provides voice input/output and local language support for Ghana
 */

import { GhanaNLP } from '@paakways/ghananlp-node';

class VoiceLanguageService {
  constructor() {
    // Ghana NLP integration for local languages
    this.ghanaNLP = new GhanaNLP("f61d93ed885e46629af097304e12d297");
    
    // Supported languages in Ghana
    this.supportedLanguages = {
      'en': { name: 'English', nativeName: 'English', rtl: false },
      'tw': { name: 'Twi', nativeName: 'Twi', rtl: false },
      'ga': { name: 'Ga', nativeName: 'Ga', rtl: false },
      'ee': { name: 'Ewe', nativeName: 'Eʋegbe', rtl: false },
      'ha': { name: 'Hausa', nativeName: 'Hausa', rtl: false },
      'dag': { name: 'Dagbani', nativeName: 'Dagbanli', rtl: false }
    };

    // Agricultural terminology translations
    this.agriculturalTerms = {
      'tw': { // Twi translations
        'maize': 'aburo',
        'rice': 'emo',
        'cassava': 'bankye',
        'yam': 'bayere',
        'plantain': 'kwadu',
        'tomatoes': 'ntosi',
        'pepper': 'mako',
        'farm': 'afuo',
        'farmer': 'okuafo',
        'plant': 'dua',
        'harvest': 'twae',
        'disease': 'yare',
        'pest': 'amoa',
        'fertilizer': 'wura',
        'rain': 'osu',
        'drought': 'osukɔm',
        'irrigation': 'nsuyɛ',
        'soil': 'dɔte',
        'seed': 'aba',
        'crop': 'nnɔbae'
      },
      'ga': { // Ga translations
        'maize': 'ablẽ',
        'rice': 'emo',
        'cassava': 'agbeli',
        'yam': 'ami',
        'plantain': 'akla',
        'tomatoes': 'tomato',
        'pepper': 'atorbemi',
        'farm': 'afɔ',
        'farmer': 'afɔkulɔ',
        'plant': 'ti',
        'harvest': 'cɔlɔ',
        'disease': 'ayɔnɔ',
        'pest': 'lɛlɛ',
        'fertilizer': 'wuram',
        'rain': 'ohai',
        'drought': 'ohaikpɔnɔ',
        'irrigation': 'nsuwɔ',
        'soil': 'anyigba',
        'seed': 'aku',
        'crop': 'afɔnɔ'
      }
    };

    // Voice synthesis settings
    this.speechSettings = {
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0,
      voice: null // Will be set based on language
    };

    // Speech recognition settings
    this.recognitionSettings = {
      continuous: false,
      interimResults: true,
      lang: 'en-GH', // Ghana English
      maxAlternatives: 3
    };

    // Initialize voice synthesis
    this.initializeSpeechSynthesis();
  }

  /**
   * Initialize speech synthesis capabilities
   */
  initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      
      // Get available voices
      this.getAvailableVoices();
      
      // Listen for voice changes
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        this.getAvailableVoices();
      });
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }

  /**
   * Get available voices for different languages
   */
  getAvailableVoices() {
    if (!this.speechSynthesis) return [];

    const voices = this.speechSynthesis.getVoices();
    
    this.availableVoices = {
      'en': voices.filter(voice => 
        voice.lang.startsWith('en') || 
        voice.lang.includes('GB') || 
        voice.lang.includes('US')
      ),
      'tw': voices.filter(voice => voice.lang.includes('tw')),
      'ga': voices.filter(voice => voice.lang.includes('ga')),
      'ee': voices.filter(voice => voice.lang.includes('ee')),
      'ha': voices.filter(voice => voice.lang.includes('ha'))
    };

    // Fallback to English if local language voices not available
    Object.keys(this.supportedLanguages).forEach(lang => {
      if (!this.availableVoices[lang] || this.availableVoices[lang].length === 0) {
        this.availableVoices[lang] = this.availableVoices['en'];
      }
    });

    return this.availableVoices;
  }

  /**
   * Translate text to local language
   */
  async translateText(text, targetLanguage = 'tw', sourceLanguage = 'en') {
    try {
      if (targetLanguage === sourceLanguage) {
        return { success: true, translatedText: text, sourceLanguage, targetLanguage };
      }

      // Use Ghana NLP for translation
      const response = await this.ghanaNLP.translate({
        text: text,
        from: sourceLanguage,
        to: targetLanguage
      });

      if (response && response.translation) {
        return {
          success: true,
          translatedText: response.translation,
          sourceLanguage,
          targetLanguage,
          confidence: response.confidence || 0.8
        };
      } else {
        // Fallback to agricultural term replacement for basic translation
        const basicTranslation = this.basicTermTranslation(text, targetLanguage);
        return {
          success: true,
          translatedText: basicTranslation,
          sourceLanguage,
          targetLanguage,
          confidence: 0.6,
          method: 'basic_term_replacement'
        };
      }

    } catch (error) {
      console.error('Translation error:', error);
      
      // Fallback to basic translation
      const basicTranslation = this.basicTermTranslation(text, targetLanguage);
      return {
        success: false,
        error: error.message,
        fallbackText: basicTranslation,
        sourceLanguage,
        targetLanguage
      };
    }
  }

  /**
   * Basic term replacement for agricultural vocabulary
   */
  basicTermTranslation(text, targetLanguage) {
    if (!this.agriculturalTerms[targetLanguage]) {
      return text; // Return original if no translations available
    }

    let translatedText = text.toLowerCase();
    const terms = this.agriculturalTerms[targetLanguage];

    // Replace agricultural terms
    Object.entries(terms).forEach(([english, local]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedText = translatedText.replace(regex, local);
    });

    return translatedText;
  }

  /**
   * Convert text to speech
   */
  async speakText(text, language = 'en', options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice based on language
      const voices = this.availableVoices[language] || this.availableVoices['en'];
      if (voices && voices.length > 0) {
        utterance.voice = voices[0];
      }

      // Apply settings
      utterance.rate = options.rate || this.speechSettings.rate;
      utterance.pitch = options.pitch || this.speechSettings.pitch;
      utterance.volume = options.volume || this.speechSettings.volume;
      utterance.lang = language === 'en' ? 'en-GH' : language;

      // Event handlers
      utterance.onend = () => {
        resolve({ success: true, duration: utterance.length || 0 });
      };

      utterance.onerror = (event) => {
        // Handle interruption gracefully
        if (event.error === 'interrupted') {
          console.log('Speech synthesis was interrupted by user or system');
          resolve({ success: false, interrupted: true });
        } else {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        }
      };

      utterance.onstart = () => {
        console.log('Speech started');
      };

      // Speak the text
      this.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Start voice recognition
   */
  async startVoiceRecognition(language = 'en-GH', options = {}) {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure recognition
      recognition.continuous = options.continuous || this.recognitionSettings.continuous;
      recognition.interimResults = options.interimResults || this.recognitionSettings.interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = options.maxAlternatives || this.recognitionSettings.maxAlternatives;

      let finalTranscript = '';
      let isListening = true;

      // Event handlers
      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Send interim results if enabled
        if (options.onInterimResult && interimTranscript) {
          options.onInterimResult(interimTranscript);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          resolve({
            success: true,
            transcript: finalTranscript,
            language,
            confidence: event.results[0]?.[0]?.confidence || 0.8
          });
        }
      };

      recognition.onerror = (event) => {
        isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onstart = () => {
        console.log('Voice recognition started');
        if (options.onStart) options.onStart();
      };

      // Start recognition
      recognition.start();

      // Return control object
      return {
        stop: () => {
          isListening = false;
          recognition.stop();
        },
        abort: () => {
          isListening = false;
          recognition.abort();
        }
      };
    });
  }

  /**
   * Process multilingual agricultural query
   */
  async processMultilingualQuery(query, inputLanguage = 'auto', outputLanguage = 'en') {
    try {
      let processedQuery = query;
      let detectedLanguage = inputLanguage;

      // Auto-detect language if needed
      if (inputLanguage === 'auto') {
        detectedLanguage = await this.detectLanguage(query);
      }

      // Translate to English for processing if needed
      if (detectedLanguage !== 'en') {
        const translation = await this.translateText(query, 'en', detectedLanguage);
        if (translation.success) {
          processedQuery = translation.translatedText;
        }
      }

      return {
        success: true,
        originalQuery: query,
        processedQuery,
        detectedLanguage,
        outputLanguage,
        requiresTranslation: detectedLanguage !== outputLanguage
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        originalQuery: query
      };
    }
  }

  /**
   * Detect language of input text
   */
  async detectLanguage(text) {
    try {
      // Check if Ghana NLP has language detection capability
      if (this.ghanaNLP && typeof this.ghanaNLP.detectLanguage === 'function') {
        const response = await this.ghanaNLP.detectLanguage(text);
        
        if (response && response.language) {
          return response.language;
        }
      }

      // Fallback: simple keyword detection
      return this.simpleLanguageDetection(text);

    } catch (error) {
      console.error('Language detection error:', error);
      // Always fallback to simple detection
      return this.simpleLanguageDetection(text);
    }
  }

  /**
   * Simple language detection based on agricultural terms
   */
  simpleLanguageDetection(text) {
    const lowerText = text.toLowerCase();
    
    // Check for Twi terms
    const twiTerms = Object.values(this.agriculturalTerms.tw || {});
    if (twiTerms.some(term => lowerText.includes(term))) {
      return 'tw';
    }

    // Check for Ga terms
    const gaTerms = Object.values(this.agriculturalTerms.ga || {});
    if (gaTerms.some(term => lowerText.includes(term))) {
      return 'ga';
    }

    // Default to English
    return 'en';
  }

  /**
   * Generate voice-friendly response
   */
  generateVoiceFriendlyResponse(text, language = 'en') {
    // Clean up text for better speech synthesis
    let voiceText = text
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italic
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace markdown links with text
      .replace(/`([^`]+)`/g, '$1') // Remove code formatting
      .replace(/\n+/g, '. ') // Replace line breaks with periods
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Add pauses for better speech flow
    voiceText = voiceText
      .replace(/\. /g, '. ... ') // Add pauses after sentences
      .replace(/: /g, ': ... ') // Add pauses after colons
      .replace(/; /g, '; ... '); // Add pauses after semicolons

    // Ensure proper pronunciation of agricultural terms
    if (language === 'en') {
      voiceText = voiceText
        .replace(/NPK/g, 'N P K') // Spell out NPK
        .replace(/pH/g, 'P H') // Spell out pH
        .replace(/°C/g, ' degrees celsius'); // Expand temperature
    }

    return voiceText;
  }

  /**
   * Get language preferences for user
   */
  getLanguagePreferences() {
    return {
      supportedLanguages: this.supportedLanguages,
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      voiceSupported: 'speechSynthesis' in window,
      recognitionSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      translationSupported: true,
      agriculturalTermsAvailable: Object.keys(this.agriculturalTerms)
    };
  }

  /**
   * Create audio file from text (for offline playback)
   */
  async createAudioFile(text, language = 'en', format = 'mp3') {
    try {
      // This would integrate with a TTS service to generate audio files
      // For now, return a mock response
      return {
        success: true,
        audioUrl: `data:audio/${format};base64,mock-audio-data`,
        duration: Math.ceil(text.length / 10), // Rough estimate
        language,
        format,
        size: text.length * 64 // Rough estimate in bytes
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get voice and language status
   */
  getStatus() {
    return {
      speechSynthesis: {
        supported: 'speechSynthesis' in window,
        voices: this.speechSynthesis ? this.speechSynthesis.getVoices().length : 0,
        speaking: this.speechSynthesis ? this.speechSynthesis.speaking : false
      },
      speechRecognition: {
        supported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      },
      translation: {
        ghanaNLPConnected: !!this.ghanaNLP,
        supportedLanguages: Object.keys(this.supportedLanguages).length,
        agriculturalTerms: Object.keys(this.agriculturalTerms).length
      },
      currentLanguage: 'en',
      preferences: this.getLanguagePreferences()
    };
  }
}

export default new VoiceLanguageService();