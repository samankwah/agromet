import { useCallback, useEffect, useRef, useState } from "react";

import { useLanguage } from "../contexts/LanguageContext";
import translationBatchQueue from "../services/translationBatchQueue";
import translationService from "../services/translationService";

const applyVars = (text, vars) => {
  if (!vars) return text;

  return Object.entries(vars).reduce(
    (output, [key, value]) =>
      String(output).replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value),
    text
  );
};

const normalizeText = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeText).join(" ");
  }

  if (value === null || value === undefined || typeof value === "boolean") {
    return "";
  }

  return String(value).replace(/\s+/g, " ").trim();
};

const useT = () => {
  const { currentLanguage, translationVersion } = useLanguage();
  const isEnglish = currentLanguage === "en";
  const [, forceUpdate] = useState(0);
  const mountedRef = useRef(true);
  const pendingRef = useRef(new Set());

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  useEffect(() => {
    pendingRef.current.clear();
  }, [currentLanguage]);

  const t = useCallback(
    (value, vars) => {
      const text = normalizeText(value);

      if (isEnglish || !text) {
        return applyVars(text, vars);
      }

      if (translationService.isProtectedLocationName?.(text)) {
        return applyVars(text, vars);
      }

      const override = translationService.getTranslationOverride?.(
        text,
        currentLanguage,
        "en"
      );

      if (override) {
        return applyVars(override, vars);
      }

      const cacheKey = `${text}_en_${currentLanguage}`;
      const cached = translationService.cache.get(cacheKey);

      if (cached && cached !== text) {
        return applyVars(cached, vars);
      }

      if (cached === text) {
        translationService.cache.delete(cacheKey);
      }

      const pendingKey = `${cacheKey}_${translationVersion}`;
      if (!pendingRef.current.has(pendingKey)) {
        pendingRef.current.add(pendingKey);

        const attempt = (retryCount) => {
          translationBatchQueue
            .enqueue(text, currentLanguage, "en")
            .then(() => {
              pendingRef.current.delete(pendingKey);

              if (mountedRef.current) {
                forceUpdate((version) => version + 1);
              }
            })
            .catch(() => {
              if (mountedRef.current && retryCount < 3) {
                setTimeout(() => attempt(retryCount + 1), (retryCount + 1) * 3000);
              } else {
                pendingRef.current.delete(pendingKey);
              }
            });
        };

        attempt(0);
      }

      return applyVars(text, vars);
    },
    [currentLanguage, isEnglish, translationVersion]
  );

  return { t };
};

export default useT;
