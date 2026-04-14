import { useLanguage } from '../contexts/LanguageContext';

const useTranslation = () => {
  return useLanguage();
};

export default useTranslation;
