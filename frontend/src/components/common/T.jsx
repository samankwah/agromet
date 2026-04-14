import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import translationBatchQueue from '../../services/translationBatchQueue';
import translationService from '../../services/translationService';

function applyVars(text, vars) {
  if (!vars) return text;
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

const T = ({ children, vars }) => {
  const { currentLanguage } = useLanguage();
  const isEnglish = currentLanguage === 'en';
  const text = typeof children === 'string' ? children : String(children);

  const [translated, setTranslated] = useState(() => {
    if (isEnglish) return text;
    const cacheKey = `${text}_en_${currentLanguage}`;
    return translationService.cache.get(cacheKey) || text;
  });

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const retryCountRef = useRef(0);

  useEffect(() => {
    if (isEnglish) {
      setTranslated(text);
      retryCountRef.current = 0;
      return;
    }

    const cacheKey = `${text}_en_${currentLanguage}`;
    const cached = translationService.cache.get(cacheKey);
    if (cached) {
      setTranslated(cached);
      return;
    }

    const attemptTranslation = (attempt) => {
      if (!mountedRef.current) return;
      console.log(`[T] attempt=${attempt} text="${text.substring(0, 40)}" lang=${currentLanguage}`);
      translationBatchQueue
        .enqueue(text, currentLanguage, 'en')
        .then((result) => {
          console.log(`[T] SUCCESS "${text.substring(0, 30)}" → "${String(result).substring(0, 30)}"`);
          if (!mountedRef.current) return;
          setTranslated(result);
        })
        .catch((err) => {
          console.error(`[T] FAILED "${text.substring(0, 30)}" attempt=${attempt}:`, err?.message);
          // Retry up to 3 times with increasing delay
          if (mountedRef.current && attempt < 3) {
            const delay = (attempt + 1) * 3000; // 3s, 6s, 9s
            setTimeout(() => attemptTranslation(attempt + 1), delay);
          }
        });
    };

    attemptTranslation(0);
  }, [text, currentLanguage, isEnglish]);

  return applyVars(translated, vars);
};

export default T;
