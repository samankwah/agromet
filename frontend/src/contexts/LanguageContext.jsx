import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  const [translationVersion, setTranslationVersion] = useState(0);
  const [pendingTranslations, setPendingTranslations] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const isTranslating = pendingTranslations > 0;

  const supportedLanguages = useMemo(
    () => translationService.getSupportedLanguages(),
    []
  );

  const setLanguage = useCallback((code) => {
    if (translationService.setUserLanguage(code)) {
      translationService.resetTranslationCircuitBreaker();
      setCurrentLanguage(code);
      setTranslationVersion((version) => version + 1);
    }
  }, []);

  useEffect(() => {
    const htmlLangByCode = {
      en: 'en',
      tw: 'ak-GH',
      gaa: 'gaa-GH',
      ee: 'ee-GH',
      dag: 'dag-GH',
    };

    document.documentElement.lang = htmlLangByCode[currentLanguage] || currentLanguage;
    document.documentElement.dir = 'ltr';
  }, [currentLanguage]);

  const translate = useCallback(
    async (text, targetLang, sourceLang = 'en') => {
      const lang = targetLang || currentLanguage;
      if (lang === 'en' || !text) return text;

      setPendingTranslations((count) => count + 1);
      try {
        const result = await translationService.translate(text, lang, sourceLang);
        return result || text;
      } catch {
        return text;
      } finally {
        setPendingTranslations((count) => Math.max(0, count - 1));
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
        } else if (result?.url) {
          const audio = new Audio(result.url);
          audioRef.current = audio;

          audio.onended = () => {
            if (result.type === 'api') {
              URL.revokeObjectURL(result.url);
            }
            setIsSpeaking(false);
            audioRef.current = null;
          };
          audio.onerror = () => {
            if (result.type === 'api') {
              URL.revokeObjectURL(result.url);
            }
            setIsSpeaking(false);
            audioRef.current = null;
          };

          await audio.play();
        } else if (typeof result?.speak === 'function') {
          result.speak({
            onEnd: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
          });
        } else {
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
      translationVersion,
      isEnglish: currentLanguage === 'en',
    }),
    [currentLanguage, setLanguage, translate, speak, stopSpeaking, isSpeaking, isTranslating, supportedLanguages, getDisplayText, translationVersion]
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
