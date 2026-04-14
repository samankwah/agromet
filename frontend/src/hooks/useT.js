import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import translationBatchQueue from '../services/translationBatchQueue';
import translationService from '../services/translationService';

function applyVars(text, vars) {
  if (!vars) return text;
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

const useT = () => {
  const { currentLanguage } = useLanguage();
  const isEnglish = currentLanguage === 'en';
  const [, forceUpdate] = useState(0);
  const mountedRef = useRef(true);
  const pendingRef = useRef(new Set());

  useEffect(() => () => { mountedRef.current = false; }, []);

  // Reset pending translations when language changes
  useEffect(() => {
    pendingRef.current.clear();
  }, [currentLanguage]);

  const t = useCallback(
    (text, vars) => {
      if (isEnglish || !text) return applyVars(text, vars);

      const cacheKey = `${text}_en_${currentLanguage}`;
      const cached = translationService.cache.get(cacheKey);
      if (cached) return applyVars(cached, vars);

      // Fire async translation if not already pending
      if (!pendingRef.current.has(text)) {
        pendingRef.current.add(text);
        const attempt = (n) => {
          translationBatchQueue
            .enqueue(text, currentLanguage, 'en')
            .then(() => {
              if (mountedRef.current) forceUpdate((v) => v + 1);
            })
            .catch(() => {
              // Retry up to 3 times with increasing delay
              if (mountedRef.current && n < 3) {
                setTimeout(() => attempt(n + 1), (n + 1) * 3000);
              } else {
                pendingRef.current.delete(text);
              }
            });
        };
        attempt(0);
      }

      return applyVars(text, vars);
    },
    [currentLanguage, isEnglish]
  );

  return { t };
};

export default useT;
