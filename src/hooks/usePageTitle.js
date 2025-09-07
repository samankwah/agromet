import { useEffect } from 'react';

const usePageTitle = (title, includeAppName = true) => {
  useEffect(() => {
    const appName = 'TriAgro AI';
    const separator = ' | ';
    
    if (title) {
      document.title = includeAppName ? `${title}${separator}${appName}` : title;
    } else {
      document.title = `${appName} - Agricultural Information Services for Ghana`;
    }

    return () => {
      document.title = `${appName} - Agricultural Information Services for Ghana`;
    };
  }, [title, includeAppName]);
};

export default usePageTitle;