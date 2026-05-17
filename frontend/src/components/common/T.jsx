import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
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

function normalizeText(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).join('');
  }

  if (value === null || value === undefined || typeof value === 'boolean') {
    return '';
  }

  return String(value).replace(/\s+/g, ' ').trim();
}

const T = ({ children, vars }) => {
  const { currentLanguage, translationVersion } = useLanguage();
  const isEnglish = currentLanguage === 'en';
  const text = normalizeText(children);

  const [translated, setTranslated] = useState(() => {
    if (isEnglish) return text;
    if (translationService.isProtectedLocationName?.(text)) return text;

    const override = translationService.getTranslationOverride?.(
      text,
      currentLanguage,
      'en'
    );
    if (override) return override;

    const cacheKey = `${text}_en_${currentLanguage}`;
    const cached = translationService.cache.get(cacheKey);
    return cached && cached !== text ? cached : text;
  });

  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    if (isEnglish) {
      setTranslated(text);
      return () => {
        cancelled = true;
      };
    }

    if (!text) {
      setTranslated('');
      return () => {
        cancelled = true;
      };
    }

    if (translationService.isProtectedLocationName?.(text)) {
      setTranslated(text);
      return () => {
        cancelled = true;
      };
    }

    const cacheKey = `${text}_en_${currentLanguage}`;
    const override = translationService.getTranslationOverride?.(
      text,
      currentLanguage,
      'en'
    );
    if (override) {
      translationService.cache.set(cacheKey, override);
      setTranslated(override);
      return () => {
        cancelled = true;
      };
    }

    const cached = translationService.cache.get(cacheKey);
    if (cached && cached !== text) {
      setTranslated(cached);
      return () => {
        cancelled = true;
      };
    }
    if (cached === text) {
      translationService.cache.delete(cacheKey);
    }

    setTranslated(text);

    const attemptTranslation = (attempt) => {
      if (!mountedRef.current || cancelled) return;

      translationBatchQueue
        .enqueue(text, currentLanguage, 'en')
        .then((result) => {
          if (!mountedRef.current || cancelled) return;
          setTranslated(result || text);
        })
        .catch(() => {
          if (mountedRef.current && !cancelled && attempt < 3) {
            const delay = (attempt + 1) * 2000;
            setTimeout(() => attemptTranslation(attempt + 1), delay);
          }
        });
    };

    attemptTranslation(0);

    return () => {
      cancelled = true;
    };
  }, [text, currentLanguage, isEnglish, translationVersion]);

  return (
    <span data-i18n-managed="true" style={{ display: 'contents' }}>
      {applyVars(translated, vars)}
    </span>
  );
};

T.propTypes = {
  children: PropTypes.node,
  vars: PropTypes.object,
};

export default T;
