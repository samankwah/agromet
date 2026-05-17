import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const usePageTitle = (title, includeAppName = true) => {
  const { currentLanguage, translate, translationVersion } = useLanguage();

  useEffect(() => {
    const appName = 'AgroMet AI';
    const separator = ' | ';
    const fallbackTitle = 'Agricultural Information Services for Ghana';
    let active = true;

    const setTitle = async () => {
      const sourceTitle = title || fallbackTitle;
      let resolvedTitle = sourceTitle;

      if (currentLanguage !== 'en') {
        resolvedTitle = await translate(sourceTitle).catch(() => sourceTitle);
      }

      if (!active) return;

      if (title) {
        document.title = includeAppName ? `${resolvedTitle}${separator}${appName}` : resolvedTitle;
      } else {
        document.title = `${appName} - ${resolvedTitle}`;
      }
    };

    setTitle();

    return () => {
      active = false;
    };
  }, [title, includeAppName, currentLanguage, translate, translationVersion]);
};

export default usePageTitle;
