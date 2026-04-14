import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import translationService from '../services/translationService';
import { getTranslation } from '../data/ghanaianLanguages';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(
    () => translationService.getUserLanguage() || 'en'
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const supportedLanguages = useMemo(
    () => translationService.getSupportedLanguages(),
    []
  );

  const setLanguage = useCallback((code) => {
    if (translationService.setUserLanguage(code)) {
      // Reset circuit breaker so API calls are retried with the new language
      translationService.resetTranslationCircuitBreaker();
      // Purge any stale cache entries where "translation" is just the original English text
      translationService.purgeStaleEntries(code);
      setCurrentLanguage(code);
    }
  }, []);

  const translate = useCallback(
    async (text, targetLang, sourceLang = 'en') => {
      const lang = targetLang || currentLanguage;
      if (lang === 'en' || !text) return text;

      setIsTranslating(true);
      try {
        const result = await translationService.translate(text, lang, sourceLang);
        return result || text;
      } catch {
        return text;
      } finally {
        setIsTranslating(false);
      }
    },
    [currentLanguage]
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text) => {
      if (!text) return;

      // Toggle off if already speaking
      if (isSpeaking) {
        stopSpeaking();
        return;
      }

      setIsSpeaking(true);
      try {
        const result = await translationService.textToSpeech(text, currentLanguage);

        if (result instanceof Blob || result instanceof ArrayBuffer) {
          const blob = result instanceof Blob ? result : new Blob([result], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
            audioRef.current = null;
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
            audioRef.current = null;
          };

          await audio.play();
        } else {
          // Browser speech synthesis fallback (translationService handles this)
          setIsSpeaking(false);
        }
      } catch {
        // Fallback to browser speech synthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = currentLanguage === 'tw' ? 'ak' : currentLanguage;
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
        }
      }
    },
    [currentLanguage, isSpeaking, stopSpeaking]
  );

  const getDisplayText = useCallback(
    (key, fallback, category = 'phrases') => {
      if (currentLanguage === 'en') return fallback;
      return getTranslation(key, currentLanguage, category) || fallback;
    },
    [currentLanguage]
  );

  const value = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      translate,
      speak,
      stopSpeaking,
      isSpeaking,
      isTranslating,
      supportedLanguages,
      getDisplayText,
      isEnglish: currentLanguage === 'en',
    }),
    [currentLanguage, setLanguage, translate, speak, stopSpeaking, isSpeaking, isTranslating, supportedLanguages, getDisplayText]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default LanguageContext;
