import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import PropTypes from 'prop-types';
import useTranslation from '../../hooks/useTranslation';

const LanguageSelector = ({ variant = 'header' }) => {
  const { currentLanguage, setLanguage, supportedLanguages, getDisplayText } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectLanguageLabel = getDisplayText('selectLanguage', 'Select language');

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
    <div
      ref={ref}
      data-no-auto-translate="true"
      className={`relative ${isFloating ? 'fixed top-24 right-4 z-[60]' : ''}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className={
          isHeader
            ? 'neo-button min-h-0 px-3 py-2 text-sm whitespace-nowrap'
            : 'neo-button min-h-0 w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 flex items-center justify-center md:gap-2'
        }
        aria-label={selectLanguageLabel}
      >
        <Globe className={isHeader ? 'w-4 h-4 text-neo-accent-strong mr-1' : 'w-5 h-5 text-neo-accent-strong md:w-4 md:h-4'} />
        <span className={isHeader ? '' : 'hidden lg:inline text-neo-accent-strong font-medium text-sm'}>
          {supportedLanguages[currentLanguage]?.name || 'English'}
        </span>
      </button>

      {open && (
        <div
          className={`absolute ${isHeader ? 'top-full right-0 mt-3' : 'top-full right-0 mt-3'} z-[999] w-72 max-w-[calc(100vw-2rem)] overflow-visible rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.24)] ring-1 ring-slate-900/5`}
        >
          <div className="py-1">
            {Object.entries(supportedLanguages).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`w-full rounded-xl px-3 py-3 text-left transition-colors flex items-center gap-3 ${
                  currentLanguage === code
                    ? 'bg-emerald-50 text-emerald-800 shadow-inner'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                  {code}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm leading-5 text-inherit">{lang.name}</div>
                  {lang.region && (
                    <div className="text-xs leading-5 text-slate-600">{lang.region}</div>
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
