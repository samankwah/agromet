import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import PropTypes from 'prop-types';
import useTranslation from '../../hooks/useTranslation';

const LanguageSelector = ({ variant = 'header' }) => {
  const { currentLanguage, setLanguage, supportedLanguages } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    setLanguage(code);
    setOpen(false);
  };

  const isFloating = variant === 'floating';
  const isHeader = variant === 'header';

  return (
    <div ref={ref} className={`relative ${isFloating ? 'fixed top-24 right-4 z-[60]' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className={
          isHeader
            ? 'flex items-center gap-1 px-3 py-2 text-sm font-semibold text-black border-b-2 border-transparent hover:border-black transition-all whitespace-nowrap'
            : 'bg-white/95 backdrop-blur-sm border border-green-200 rounded-full w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1.5 flex items-center justify-center md:gap-2 shadow-lg hover:border-green-400 transition-all duration-300'
        }
        aria-label="Select language"
      >
        <Globe className={isHeader ? 'w-4 h-4 text-black mr-1' : 'w-5 h-5 text-green-600 md:w-4 md:h-4'} />
        <span className={isHeader ? '' : 'hidden lg:inline text-green-700 font-medium text-sm'}>
          {supportedLanguages[currentLanguage]?.name || 'English'}
        </span>
      </button>

      {open && (
        <div
          className={`absolute ${isHeader ? 'top-full right-0 mt-1' : 'top-full right-0 mt-2'} bg-white rounded-xl shadow-2xl border border-green-200 overflow-hidden z-[70] w-56`}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {Object.entries(supportedLanguages).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`w-full px-3 py-2.5 text-left hover:bg-green-50 transition-colors flex items-center gap-2.5 ${
                  currentLanguage === code ? 'bg-green-100 text-green-800' : 'text-gray-700'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{lang.name}</div>
                  {lang.region && (
                    <div className="text-xs text-gray-500 truncate">{lang.region}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

LanguageSelector.propTypes = {
  variant: PropTypes.oneOf(['header', 'inline', 'floating']),
};

export default LanguageSelector;
