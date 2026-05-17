import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiChevronRight } from 'react-icons/hi2';

const routeMap = {
  // Weather
  '/7-days-forecast': { label: 'Weekly Forecast', parent: 'Weather' },
  '/seven-days-forecast': { label: 'Weekly Forecast', parent: 'Weather' },
  '/agro-bulletins': { label: 'Agro Bulletins', parent: 'Weather' },
  '/subseasonal-forecast': { label: 'Subseasonal Forecast', parent: 'Weather' },
  '/seasonal-forecast': { label: 'Seasonal Forecast', parent: 'Weather' },
  '/flood-drought': { label: 'Flood & Drought', parent: 'Weather' },

  // Agriculture
  '/crop-advisory': { label: 'Crop Advisory', parent: 'Agriculture' },
  '/poultry-advisory': { label: 'Poultry Advisory', parent: 'Agriculture' },
  '/crop-calendar': { label: 'Crop Calendar', parent: 'Agriculture' },
  '/poultry-calendar': { label: 'Poultry Calendar', parent: 'Agriculture' },

  // Tools & features
  '/agro-advisory': { label: 'AgroMet Advisory' },
  '/agromet-advisory': { label: 'AgroMet Advisory' },
  '/crop-diagnose': { label: 'Crop Diagnosis' },
  '/market-page': { label: 'Market Intelligence' },

  // General
  '/about': { label: 'About' },
  '/contact': { label: 'Contact' },
  '/our-services': { label: 'Our Services' },
  '/services': { label: 'Our Services' },
  '/careers': { label: 'Careers' },
  '/media': { label: 'Media' },
  '/media-page': { label: 'Media' },
  '/news-updates': { label: 'News & Updates' },
  '/privacy-policy': { label: 'Privacy Policy' },
  '/privacy': { label: 'Privacy Policy' },
  '/terms-of-service': { label: 'Terms of Service' },
  '/terms': { label: 'Terms of Service' },
};

const Breadcrumb = ({ variant = 'light' }) => {
  const { pathname } = useLocation();

  if (pathname === '/') return null;

  const route = routeMap[pathname];
  if (!route) return null;

  const dark = variant === 'dark';

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-5 flex-wrap">
      <Link
        to="/"
        className={`inline-flex items-center gap-1 transition-colors ${dark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-400 hover:text-emerald-600'}`}
      >
        <HiHome className="w-4 h-4" />
        <span>Home</span>
      </Link>

      {route.parent && (
        <>
          <HiChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? 'text-slate-600' : 'text-slate-300'}`} />
          <span className={dark ? 'text-slate-400' : 'text-slate-400'}>{route.parent}</span>
        </>
      )}

      <HiChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? 'text-slate-600' : 'text-slate-300'}`} />
      <span className={`font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{route.label}</span>
    </nav>
  );
};

export default Breadcrumb;
