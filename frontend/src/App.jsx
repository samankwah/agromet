import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ChatbotProvider } from './contexts/ChatbotContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './pages/Layout';
import Home from './pages/Home';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Weather = lazy(() => import('./pages/Weather'));
const Forecast = lazy(() => import('./pages/Forecast'));
const SevenDaysForecast = lazy(() => import('./pages/SevenDaysForecast'));
const SeasonalForecast = lazy(() => import('./pages/SeasonalForecast'));
const SubseasonalForecast = lazy(() => import('./pages/SubseasonalForecast'));
const CropAdvisory = lazy(() => import('./pages/CropAdvisory'));
const PoultryAdvisory = lazy(() => import('./pages/PoultryAdvisory'));
const AgroMetAdvisory = lazy(() => import('./pages/AgroMetAdvisory'));
const FloodDrought = lazy(() => import('./pages/FloodDrought'));
const NewsUpdates = lazy(() => import('./pages/NewsUpdates'));
const AgroBulletins = lazy(() => import('./pages/AgroBulletins'));
const OurServices = lazy(() => import('./pages/OurServices'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const Careers = lazy(() => import('./pages/Careers'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminSignUp = lazy(() => import('./pages/AdminSignUp'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CropCalendar = lazy(() => import('./pages/CropCalendar'));
const PoultryCalendar = lazy(() => import('./pages/PoultryCalendar'));
const CalendarPreviewPage = lazy(() => import('./pages/CalendarPreviewPage'));
const PoultryCalendarPreviewPage = lazy(() => import('./pages/PoultryCalendarPreviewPage'));
const CreatePoultryCalendarPage = lazy(() => import('./pages/CreatePoultryCalendarPage'));
const CombineView = lazy(() => import('./pages/CombineView'));
const MarketPage = lazy(() => import('./components/MarketPage'));
const CropDiagnosticTool = lazy(() => import('./components/CropDiagnosticTool'));

const RouteLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
  </div>
);

const withSuspense = (element) => (
  <Suspense fallback={<RouteLoader />}>
    {element}
  </Suspense>
);

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
      <ChatbotProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ScrollToTop />
          <Toaster position="top-right" />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={withSuspense(<About />)} />
              <Route path="/contact" element={withSuspense(<Contact />)} />
              <Route path="/weather" element={withSuspense(<Weather />)} />
              <Route path="/forecast" element={withSuspense(<Forecast />)} />

              {/* Forecast routes - support both URL formats */}
              <Route path="/seven-days-forecast" element={withSuspense(<SevenDaysForecast />)} />
              <Route path="/7-days-forecast" element={withSuspense(<SevenDaysForecast />)} />
              <Route path="/seasonal-forecast" element={withSuspense(<SeasonalForecast />)} />
              <Route path="/subseasonal-forecast" element={withSuspense(<SubseasonalForecast />)} />
              <Route path="/flood-drought" element={withSuspense(<FloodDrought />)} />
              <Route path="/agro-bulletins" element={withSuspense(<AgroBulletins />)} />

              {/* Agriculture routes */}
              <Route path="/crop-advisory" element={withSuspense(<CropAdvisory />)} />
              <Route path="/poultry-advisory" element={withSuspense(<PoultryAdvisory />)} />
              <Route path="/crop-calendar" element={withSuspense(<CropCalendar />)} />
              <Route path="/poultry-calendar" element={withSuspense(<PoultryCalendar />)} />

              {/* Advisory routes - support both URL formats */}
              <Route path="/agromet-advisory" element={withSuspense(<AgroMetAdvisory />)} />
              <Route path="/agro-advisory" element={withSuspense(<AgroMetAdvisory />)} />

              {/* Tools */}
              <Route path="/crop-diagnose" element={withSuspense(<CropDiagnosticTool />)} />

              {/* Media and Market - support both URL formats */}
              <Route path="/media" element={withSuspense(<MediaPage />)} />
              <Route path="/media-page" element={withSuspense(<MediaPage />)} />
              <Route path="/market-page" element={withSuspense(<MarketPage />)} />

              {/* General pages */}
              <Route path="/news-updates" element={withSuspense(<NewsUpdates />)} />
              <Route path="/our-services" element={withSuspense(<OurServices />)} />
              <Route path="/services" element={withSuspense(<OurServices />)} />
              <Route path="/careers" element={withSuspense(<Careers />)} />
              <Route path="/privacy-policy" element={withSuspense(<PrivacyPolicy />)} />
              <Route path="/privacy" element={withSuspense(<PrivacyPolicy />)} />
              <Route path="/terms-of-service" element={withSuspense(<TermsOfService />)} />
              <Route path="/terms" element={withSuspense(<TermsOfService />)} />

              {/* Admin app routes */}
              <Route path="/dashboard" element={withSuspense(<DashboardPage />)} />

              {/* Calendar preview routes */}
              <Route path="/calendar-preview" element={withSuspense(<CalendarPreviewPage />)} />
              <Route path="/poultry-calendar-preview" element={withSuspense(<PoultryCalendarPreviewPage />)} />
              <Route path="/create-poultry-calendar" element={withSuspense(<CreatePoultryCalendarPage />)} />
              <Route path="/combine-view" element={withSuspense(<CombineView />)} />
            </Route>

            {/* Standalone auth routes */}
            <Route path="/admin-login" element={withSuspense(<AdminLogin />)} />
            <Route path="/admin-signup" element={withSuspense(<AdminSignUp />)} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ChatbotProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
