import axios from "axios";
import offlineTranslationService from "./offlineTranslationService";
import { ghanaianLanguages } from "../data/ghanaianLanguages";

// Ghana NLP Translation Service with offline fallback
class TranslationService {
  constructor() {
    this.primaryApiKey =
      import.meta.env.VITE_NLP_PRIMARY_KEY ||
      "c7540cd770e24a57ad5171e6a9ef3d1d";
    this.secondaryApiKey =
      import.meta.env.VITE_NLP_SECONDARY_KEY ||
      "53ee41bbff5948dfbf9094719604eec0";
    this.currentApiKey = this.primaryApiKey;
    this.baseUrl = "/api/v1/translate";
    this.ttsUrl = "/api/tts";

    // Circuit breaker for API health tracking
    this.apiHealthStatus = {
      translation: { isHealthy: true, lastFailure: null, failureCount: 0 },
      tts: { isHealthy: true, lastFailure: null, failureCount: 0 }
    };
    this.circuitBreakerThreshold = 3; // Fail after 3 consecutive errors
    this.circuitBreakerTimeout = 60000; // Reset after 1 minute

    // Use comprehensive language data
    this.languages = ghanaianLanguages.languages;

    // Translation cache to reduce API calls
    this.cache = new Map();

    // Track online/offline status
    this.isOnline = navigator.onLine;
    window.addEventListener("online", () => (this.isOnline = true));
    window.addEventListener("offline", () => (this.isOnline = false));
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.languages;
  }

  // Get user's preferred language from localStorage or browser
  getUserLanguage() {
    const stored = localStorage.getItem("preferredLanguage");
    if (stored && this.languages[stored]) {
      return stored;
    }

    // Try to detect from browser
    const browserLang = navigator.language.split("-")[0];
    return this.languages[browserLang] ? browserLang : "en";
  }

  // Set user's preferred language
  setUserLanguage(langCode) {
    if (this.languages[langCode]) {
      localStorage.setItem("preferredLanguage", langCode);
      return true;
    }
    return false;
  }

  // Check if API should be used based on circuit breaker
  shouldUseApi(apiType) {
    const status = this.apiHealthStatus[apiType];
    if (!status.isHealthy) {
      const timeSinceFailure = Date.now() - status.lastFailure;
      if (timeSinceFailure > this.circuitBreakerTimeout) {
        // Reset circuit breaker after timeout
        status.isHealthy = true;
        status.failureCount = 0;
        console.log(`🔄 Circuit breaker reset for ${apiType} API`);
        return true;
      }
      console.log(`🚫 Circuit breaker open for ${apiType} API - using fallback`);
      return false;
    }
    return true;
  }

  // Record API failure
  recordApiFailure(apiType, error) {
    const status = this.apiHealthStatus[apiType];
    status.failureCount++;
    status.lastFailure = Date.now();
    
    // Check if we should open circuit breaker
    if (status.failureCount >= this.circuitBreakerThreshold) {
      status.isHealthy = false;
      console.warn(`🚨 Circuit breaker opened for ${apiType} API after ${status.failureCount} failures`);
    }
    
    // Log the specific error type
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.warn(`⏰ ${apiType} API timeout - server may be down`);
    }
  }

  // Translate text with offline fallback
  async translate(text, targetLang = "tw", sourceLang = "en") {
    if (!text || targetLang === sourceLang) {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check circuit breaker before attempting API call
    if (!this.isOnline || !this.shouldUseApi('translation')) {
      const offlineTranslation = offlineTranslationService.translateOffline(
        text,
        sourceLang,
        targetLang
      );
      this.cache.set(cacheKey, offlineTranslation);
      return offlineTranslation;
    }

    try {
      console.log(`🔄 Translating: "${text}" from ${sourceLang} to ${targetLang}`);
      
      const response = await axios.post(
        this.baseUrl,
        {
          in: text,
          lang: `${sourceLang}-${targetLang}`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": this.currentApiKey,
          },
          timeout: 5000, // 5 second timeout to fail faster
        }
      );
      
      console.log('✅ Translation API Response:', response.data);

      // Ghana NLP API returns the translated text directly
      let translatedText;
      if (typeof response.data === 'string') {
        translatedText = response.data;
      } else if (response.data && response.data.out) {
        translatedText = response.data.out;
      } else if (response.data && response.data.translation) {
        translatedText = response.data.translation;
      } else if (response.data && typeof response.data === 'object') {
        // Handle case where response is wrapped in an object
        translatedText = response.data.text || response.data.result || JSON.stringify(response.data);
      } else {
        throw new Error('Invalid response format from Ghana NLP API');
      }

      console.log(`✅ Translation result: "${translatedText}"`);
      this.cache.set(cacheKey, translatedText);
      return translatedText;
    } catch (error) {
      console.error("❌ Translation API error:", error.message);
      
      // Record the failure for circuit breaker
      this.recordApiFailure('translation', error);
      
      // Try secondary key if primary fails with quota/auth error (but not on timeout)
      if ((error.response?.status === 403 || error.response?.status === 401) && 
          this.currentApiKey === this.primaryApiKey &&
          error.code !== 'ETIMEDOUT') {
        console.warn("🔄 Primary API key failed, trying secondary key...");
        this.currentApiKey = this.secondaryApiKey;
        
        try {
          const retryResponse = await axios.post(
            this.baseUrl,
            {
              in: text,
              lang: `${sourceLang}-${targetLang}`,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": this.currentApiKey,
              },
              timeout: 5000, // Shorter timeout
            }
          );
          
          let translatedText;
          if (typeof retryResponse.data === 'string') {
            translatedText = retryResponse.data;
          } else if (retryResponse.data && retryResponse.data.out) {
            translatedText = retryResponse.data.out;
          } else if (retryResponse.data && retryResponse.data.translation) {
            translatedText = retryResponse.data.translation;
          } else {
            throw new Error('Invalid response format from Ghana NLP API');
          }
          
          console.log(`✅ Secondary key translation success: "${translatedText}"`);
          this.cache.set(cacheKey, translatedText);
          return translatedText;
        } catch (secondaryError) {
          console.error("❌ Secondary API key also failed:", secondaryError.message);
          this.recordApiFailure('translation', secondaryError);
          // Reset to primary key for next attempt
          this.currentApiKey = this.primaryApiKey;
        }
      }
      
      // Enhanced fallback to offline translation
      const offlineTranslation = offlineTranslationService.translateOffline(
        text,
        sourceLang,
        targetLang
      );
      console.log(`🔄 Using offline translation: "${offlineTranslation}"`);
      this.cache.set(cacheKey, offlineTranslation);
      return offlineTranslation;
    }
  }

  // Translate disease detection results with offline fallback
  async translateDiseaseResults(results, targetLang) {
    if (targetLang === "en") {
      return results;
    }

    console.log(`🩺 Translating disease results to ${targetLang}:`, results);

    // If offline, use offline translation service
    if (!this.isOnline) {
      const offlineResults =
        offlineTranslationService.translateDiseaseResultsOffline(
          results,
          targetLang
        );
      return {
        ...results,
        ...offlineResults,
        originalLanguage: "en",
        translatedLanguage: targetLang,
      };
    }

    try {
      // Break down remedy into smaller chunks for better translation
      const remedy = results.remedy || "No remedy available";
      const remedySentences = remedy.split('. ').filter(s => s.trim());
      
      console.log(`🔄 Breaking remedy into ${remedySentences.length} sentences for translation`);
      
      // Translate each field individually with better error handling
      const baseTranslations = await Promise.allSettled([
        this.translate(results.plant || "Unknown", targetLang, "en"),
        this.translate(results.disease || "No disease detected", targetLang, "en"),
      ]);
      
      // Translate remedy sentences individually
      const remedyTranslations = await Promise.allSettled(
        remedySentences.map(sentence => 
          this.translate(sentence.trim() + '.', targetLang, "en")
        )
      );
      
      const [plantResult, diseaseResult] = baseTranslations;
      
      // Combine translated remedy sentences
      const translatedRemedySentences = remedyTranslations
        .map(result => result.status === 'fulfilled' ? result.value : '')
        .filter(sentence => sentence.trim())
        .join(' ');

      const translatedResults = {
        ...results,
        plant: plantResult.status === 'fulfilled' ? plantResult.value : results.plant,
        disease: diseaseResult.status === 'fulfilled' ? diseaseResult.value : results.disease,
        remedy: translatedRemedySentences || results.remedy,
        originalLanguage: "en",
        translatedLanguage: targetLang,
        translationType: "online",
      };

      console.log('✅ Disease translation completed:', translatedResults);
      return translatedResults;

    } catch (error) {
      console.error(
        "Disease results translation error, using offline fallback:",
        error
      );
      const offlineResults =
        offlineTranslationService.translateDiseaseResultsOffline(
          results,
          targetLang
        );
      return {
        ...results,
        ...offlineResults,
        originalLanguage: "en",
        translatedLanguage: targetLang,
      };
    }
  }

  // Text to speech with Ghana NLP API
  async textToSpeech(text, language = "en") {
    // Check circuit breaker before attempting TTS API
    if (this.isOnline && this.shouldUseApi('tts')) {
      try {
        console.log(`🔊 Attempting Ghana NLP TTS for language: ${language}`);
        
        // Map language codes to Ghana NLP format
        const langMapping = {
          "tw": "tw", // Twi
          "ee": "ee", // Ewe
          "ki": "ki", // Kikuyu
          "en": "en"  // English (may not be supported)
        };
        
        const nlpLanguage = langMapping[language] || "tw"; // Default to Twi
        const speaker = this.getVoiceForLanguage(language);
        
        console.log(`🎤 Using speaker: ${speaker} for language: ${nlpLanguage}`);

        // Try multiple TTS endpoints for better compatibility
        const endpoints = ["/api/tts/tts", "/api/tts/synthesize"];
        let response = null;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying TTS endpoint: ${endpoint}`);
            
            response = await axios.post(
              endpoint,
              {
                text: text,
                language: nlpLanguage,
                voice: speaker
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  "Ocp-Apim-Subscription-Key": this.currentApiKey,
                },
                responseType: "blob",
                timeout: 8000, // 8 second timeout for TTS
              }
            );
            
            console.log(`✅ TTS endpoint ${endpoint} successful`);
            break; // Success, exit loop
            
          } catch (endpointError) {
            console.warn(`⚠️ TTS endpoint ${endpoint} failed:`, endpointError.response?.status);
            if (endpoint === endpoints[endpoints.length - 1]) {
              // If this is the last endpoint, throw the error
              throw endpointError;
            }
          }
        }

        console.log("✅ Ghana NLP TTS response received");

        // Create audio URL from blob
        const audioBlob = new Blob([response.data], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);

        return { url: audioUrl, type: "api" };
      } catch (error) {
        console.error(
          "❌ Ghana NLP TTS error, falling back to browser TTS:",
          error.response?.status,
          error.response?.data || error.message
        );
        
        // Record TTS failure for circuit breaker
        this.recordApiFailure('tts', error);
      }
    } else {
      console.log("📵 Offline - using browser TTS fallback");
    }

    // Fallback to browser's built-in TTS
    if ("speechSynthesis" in window) {
      try {
        console.log(`🌐 Using browser TTS fallback for language: ${language}`);
        
        // Create a promise-based wrapper for speechSynthesis
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);

          // Set language based on our language code
          const langMap = {
            en: "en-US",
            tw: "en-GH", // Use Ghanaian English as fallback for Twi
            ee: "en-GH",
            gaa: "en-GH",
            dag: "en-GH",
            ha: "ha-NG", // Hausa (Nigeria)
            fat: "en-GH",
            nzi: "en-GH",
            ki: "en-KE", // Kenyan English for Kikuyu
          };

          const targetLang = langMap[language] || "en-US";
          utterance.lang = targetLang;
          utterance.rate = 0.8; // Slower for better pronunciation
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          console.log(`🔊 Browser TTS configured: ${targetLang}`);

          // Return a function that will speak when called
          resolve({
            speak: () => {
              console.log("🎵 Starting browser TTS playback");
              window.speechSynthesis.speak(utterance);
            },
            cancel: () => window.speechSynthesis.cancel(),
            type: "browser",
            language: targetLang,
            fallback: true
          });
        });
      } catch (error) {
        console.error("❌ Browser TTS error:", error);
        return null;
      }
    }

    return null;
  }

  // Get greeting in different languages
  getGreeting(langCode) {
    const greetings = {
      en: "Good morning",
      tw: "Maakye",
      ee: "Ŋdi",
      gaa: "Ojekoo",
      dag: "Dasuba",
      nzi: "Maakye",
      fat: "Maakye",
      ha: "Ina kwana",
    };

    return greetings[langCode] || greetings.en;
  }

  // Get common agricultural terms translations
  getAgriculturalTerms(langCode) {
    const terms = {
      en: {
        plant: "Plant",
        disease: "Disease",
        treatment: "Treatment",
        healthy: "Healthy",
        infected: "Infected",
        prevention: "Prevention",
        farmer: "Farmer",
        crop: "Crop",
        harvest: "Harvest",
        pesticide: "Pesticide",
      },
      tw: {
        plant: "Afifide",
        disease: "Yare",
        treatment: "Ayaresa",
        healthy: "Apɔmuden",
        infected: "Yare aka no",
        prevention: "Siw",
        farmer: "Okuani",
        crop: "Nnɔbae",
        harvest: "Twabere",
        pesticide: "Nnwurammoa aduru",
      },
      // Add more languages as needed
    };

    return terms[langCode] || terms.en;
  }

  // Get voice name for language (Ghana NLP specific)
  getVoiceForLanguage(language) {
    // Use actual speaker names from Ghana NLP API
    // Available speakers: Twi (4,5,6,7,8,9), Ewe (3,4), Kikuyu (1,5)
    const voiceMap = {
      en: "twi_speaker_4", // Fallback to Twi
      tw: "twi_speaker_5", // Using Twi speaker 5 for variety
      ee: "ewe_speaker_4", // Using Ewe speaker 4
      gaa: "twi_speaker_6", // Fallback to Twi speaker 6 for Ga
      dag: "twi_speaker_7", // Fallback to Twi speaker 7 for Dagbani
      ha: "twi_speaker_8", // Fallback to Twi speaker 8 for Hausa
      fat: "twi_speaker_9", // Fallback to Twi speaker 9 for Fante (most similar)
      nzi: "twi_speaker_4", // Fallback to Twi speaker 4 for Nzema
      ki: "kikuyu_speaker_5" // Kikuyu speaker 5
    };
    return voiceMap[language] || voiceMap.tw; // Default to Twi speaker
  }

  // Get random voice for variety (optional enhancement)
  getRandomVoiceForLanguage(language) {
    const voiceOptions = {
      tw: ["twi_speaker_4", "twi_speaker_5", "twi_speaker_6", "twi_speaker_7", "twi_speaker_8", "twi_speaker_9"],
      ee: ["ewe_speaker_3", "ewe_speaker_4"],
      ki: ["kikuyu_speaker_1", "kikuyu_speaker_5"]
    };
    
    const options = voiceOptions[language];
    if (options && options.length > 0) {
      const randomIndex = Math.floor(Math.random() * options.length);
      return options[randomIndex];
    }
    
    return this.getVoiceForLanguage(language);
  }

  // Get available TTS languages from Ghana NLP
  async getAvailableTTSLanguages() {
    try {
      const response = await axios.get("/api/tts/languages", {
        headers: {
          "Ocp-Apim-Subscription-Key": this.currentApiKey,
        },
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching TTS languages:", error);
      return [];
    }
  }

  // Get available TTS speakers from Ghana NLP
  async getAvailableTTSSpeakers() {
    try {
      const response = await axios.get("/api/tts/speakers", {
        headers: {
          "Ocp-Apim-Subscription-Key": this.currentApiKey,
        },
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching TTS speakers:", error);
      return [];
    }
  }

  // Clear translation cache
  clearCache() {
    this.cache.clear();
  }
}

export default new TranslationService();
