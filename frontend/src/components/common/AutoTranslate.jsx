import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useLanguage } from '../../contexts/LanguageContext';
import translationBatchQueue from '../../services/translationBatchQueue';
import translationService from '../../services/translationService';

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
const ORIGINAL_ATTR_PREFIX = 'data-i18n-original-';
const LANG_ATTR_PREFIX = 'data-i18n-lang-';
const LAST_TRANSLATED_ATTR_PREFIX = 'data-i18n-last-translated-';

const BASE_SKIP_SELECTOR = [
  '[data-no-auto-translate]',
  '[data-i18n-managed]',
  'script',
  'style',
  'noscript',
  'svg',
  'canvas',
  'iframe',
  '.leaflet-container',
  '.leaflet-pane',
  '.leaflet-control',
  '.leaflet-tooltip',
  '.leaflet-popup',
].join(',');

const TEXT_SKIP_SELECTOR = [
  BASE_SKIP_SELECTOR,
  'input',
  'textarea',
].join(',');

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const hasLetters = (value) => /\p{L}/u.test(value);

const shouldTranslate = (value) => {
  const text = normalizeText(value);

  if (!text || text.length < 2 || !hasLetters(text)) return false;
  if (/^https?:\/\//i.test(text) || /^\S+@\S+\.\S+$/.test(text)) return false;
  if (/^[A-Z]{2,6}$/.test(text)) return false;
  if (/^[\d\s.,:%°/+\-()[\]]+$/.test(text)) return false;

  return true;
};

const closestSkippable = (node, selector = TEXT_SKIP_SELECTOR) => {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return element?.closest?.(selector);
};

const applyTranslatedNodeValue = (node, translated) => {
  const originalRaw = node.__agrometOriginalRaw || node.nodeValue || '';
  const leading = originalRaw.match(/^\s*/)?.[0] || '';
  const trailing = originalRaw.match(/\s*$/)?.[0] || '';
  const nextValue = `${leading}${translated}${trailing}`;
  node.nodeValue = nextValue;
  node.__agrometLastTranslatedRaw = nextValue;
};

const AutoTranslate = () => {
  const { currentLanguage, translationVersion } = useLanguage();
  const { pathname } = useLocation();
  const timerRef = useRef(null);
  const observerRef = useRef(null);

  const translateTextNode = useCallback(
    (node) => {
      if (closestSkippable(node)) return;

      const rawValue = node.nodeValue || '';
      if (
        node.__agrometOriginalRaw &&
        rawValue !== node.__agrometOriginalRaw &&
        rawValue !== node.__agrometLastTranslatedRaw
      ) {
        node.__agrometOriginalRaw = rawValue;
        node.__agrometAutoOriginal = null;
        node.__agrometAutoLang = null;
        node.__agrometAutoVersion = null;
        node.__agrometAutoPending = null;
      }

      if (!node.__agrometOriginalRaw) {
        node.__agrometOriginalRaw = rawValue;
      }

      const originalText = normalizeText(node.__agrometOriginalRaw);
      if (!shouldTranslate(originalText)) return;

      if (
        typeof translationService.shouldTranslateText === 'function' &&
        !translationService.shouldTranslateText(originalText, currentLanguage, 'en')
      ) {
        if (node.nodeValue !== node.__agrometOriginalRaw) {
          node.nodeValue = node.__agrometOriginalRaw;
        }
        node.__agrometLastTranslatedRaw = null;
        node.__agrometAutoOriginal = originalText;
        node.__agrometAutoLang = currentLanguage;
        node.__agrometAutoVersion = translationVersion;
        node.__agrometAutoPending = null;
        return;
      }

      if (currentLanguage === 'en') {
        if (node.nodeValue !== node.__agrometOriginalRaw) {
          node.nodeValue = node.__agrometOriginalRaw;
        }
        node.__agrometLastTranslatedRaw = null;
        node.__agrometAutoLang = 'en';
        return;
      }

      if (
        node.__agrometAutoLang === currentLanguage &&
        node.__agrometAutoOriginal === originalText &&
        node.__agrometAutoVersion === translationVersion
      ) {
        return;
      }

      const pendingKey = `${originalText}_${currentLanguage}_${translationVersion}`;
      if (node.__agrometAutoPending === pendingKey) return;

      const override = translationService.getTranslationOverride?.(
        originalText,
        currentLanguage,
        'en'
      );

      if (override) {
        applyTranslatedNodeValue(node, override);
        node.__agrometAutoOriginal = originalText;
        node.__agrometAutoLang = currentLanguage;
        node.__agrometAutoVersion = translationVersion;
        node.__agrometAutoPending = null;
        return;
      }

      node.__agrometAutoPending = pendingKey;

      translationBatchQueue
        .enqueue(originalText, currentLanguage, 'en')
        .then((translated) => {
          const stillCurrent =
            document.body.contains(node) &&
            node.__agrometAutoPending === pendingKey &&
            normalizeText(node.__agrometOriginalRaw) === originalText;

          if (stillCurrent && translated && translated !== originalText) {
            applyTranslatedNodeValue(node, translated);
            node.__agrometAutoOriginal = originalText;
            node.__agrometAutoLang = currentLanguage;
            node.__agrometAutoVersion = translationVersion;
          }

          if (node.__agrometAutoPending === pendingKey) {
            node.__agrometAutoPending = null;
          }
        })
        .catch(() => {
          if (node.__agrometAutoPending === pendingKey) {
            node.__agrometAutoPending = null;
          }
        });
    },
    [currentLanguage, translationVersion]
  );

  const translateAttribute = useCallback(
    (element, attr) => {
      if (closestSkippable(element, BASE_SKIP_SELECTOR) || !element.hasAttribute(attr)) return;

      const originalAttr = `${ORIGINAL_ATTR_PREFIX}${attr}`;
      const langAttr = `${LANG_ATTR_PREFIX}${attr}`;
      const lastTranslatedAttr = `${LAST_TRANSLATED_ATTR_PREFIX}${attr}`;
      const pendingAttr = `data-i18n-pending-${attr}`;

      const rawValue = element.getAttribute(attr) || '';
      if (
        element.hasAttribute(originalAttr) &&
        rawValue !== element.getAttribute(originalAttr) &&
        rawValue !== element.getAttribute(lastTranslatedAttr)
      ) {
        element.setAttribute(originalAttr, rawValue);
        element.removeAttribute(langAttr);
        element.removeAttribute(`${langAttr}-version`);
        element.removeAttribute(lastTranslatedAttr);
        element.removeAttribute(pendingAttr);
      }

      if (!element.hasAttribute(originalAttr)) {
        element.setAttribute(originalAttr, rawValue);
      }

      const originalText = normalizeText(element.getAttribute(originalAttr));
      if (!shouldTranslate(originalText)) return;

      if (
        typeof translationService.shouldTranslateText === 'function' &&
        !translationService.shouldTranslateText(originalText, currentLanguage, 'en')
      ) {
        element.setAttribute(attr, element.getAttribute(originalAttr) || '');
        element.setAttribute(langAttr, currentLanguage);
        element.setAttribute(`${langAttr}-version`, String(translationVersion));
        element.removeAttribute(lastTranslatedAttr);
        element.removeAttribute(pendingAttr);
        return;
      }

      if (currentLanguage === 'en') {
        element.setAttribute(attr, element.getAttribute(originalAttr) || '');
        element.setAttribute(langAttr, 'en');
        element.removeAttribute(lastTranslatedAttr);
        return;
      }

      if (
        element.getAttribute(langAttr) === currentLanguage &&
        element.getAttribute(`${langAttr}-version`) === String(translationVersion) &&
        normalizeText(element.getAttribute(attr)) !== originalText
      ) {
        return;
      }

      const pendingKey = `${originalText}_${currentLanguage}_${translationVersion}`;
      if (element.getAttribute(pendingAttr) === pendingKey) return;

      const override = translationService.getTranslationOverride?.(
        originalText,
        currentLanguage,
        'en'
      );

      if (override) {
        element.setAttribute(attr, override);
        element.setAttribute(lastTranslatedAttr, override);
        element.setAttribute(langAttr, currentLanguage);
        element.setAttribute(`${langAttr}-version`, String(translationVersion));
        element.removeAttribute(pendingAttr);
        return;
      }

      element.setAttribute(pendingAttr, pendingKey);

      translationBatchQueue
        .enqueue(originalText, currentLanguage, 'en')
        .then((translated) => {
          const stillCurrent =
            document.body.contains(element) &&
            element.getAttribute(pendingAttr) === pendingKey &&
            normalizeText(element.getAttribute(originalAttr)) === originalText;

          if (stillCurrent && translated && translated !== originalText) {
            element.setAttribute(attr, translated);
            element.setAttribute(lastTranslatedAttr, translated);
            element.setAttribute(langAttr, currentLanguage);
            element.setAttribute(`${langAttr}-version`, String(translationVersion));
          }

          if (element.getAttribute(pendingAttr) === pendingKey) {
            element.removeAttribute(pendingAttr);
          }
        })
        .catch(() => {
          if (element.getAttribute(pendingAttr) === pendingKey) {
            element.removeAttribute(pendingAttr);
            element.removeAttribute(langAttr);
          }
        });
    },
    [currentLanguage, translationVersion]
  );

  const translateTree = useCallback(() => {
    if (!document.body) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!shouldTranslate(node.nodeValue) || closestSkippable(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    textNodes.forEach((node) => translateTextNode(node));

    document.body.querySelectorAll(TRANSLATABLE_ATTRIBUTES.map((attr) => `[${attr}]`).join(',')).forEach((element) => {
      TRANSLATABLE_ATTRIBUTES.forEach((attr) => translateAttribute(element, attr));
    });
  }, [translateAttribute, translateTextNode]);

  const scheduleTranslate = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      translateTree();
    }, 150);
  }, [translateTree]);

  useEffect(() => {
    scheduleTranslate();
  }, [currentLanguage, pathname, scheduleTranslate]);

  useEffect(() => {
    observerRef.current?.disconnect();

    observerRef.current = new MutationObserver((mutations) => {
      if (
        mutations.some(
          (mutation) =>
            mutation.type === 'childList' ||
            mutation.type === 'characterData' ||
            TRANSLATABLE_ATTRIBUTES.includes(mutation.attributeName)
        )
      ) {
        scheduleTranslate();
      }
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [scheduleTranslate]);

  return null;
};

export default AutoTranslate;
