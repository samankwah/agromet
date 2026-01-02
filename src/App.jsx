import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ChatbotProvider } from './contexts/ChatbotContext';
import Layout from './pages/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Weather from './pages/Weather';
import Forecast from './pages/Forecast';
import SevenDaysForecast from './pages/SevenDaysForecast';
import SeasonalForecast from './pages/SeasonalForecast';
import SubseasonalForecast from './pages/SubseasonalForecast';
import CropAdvisory from './pages/CropAdvisory';
import PoultryAdvisory from './pages/PoultryAdvisory';
import AgroMetAdvisory from './pages/AgroMetAdvisory';
import FloodDrought from './pages/FloodDrought';
import NewsUpdates from './pages/NewsUpdates';
import AgroBulletins from './pages/AgroBulletins';
import OurServices from './pages/OurServices';
import MediaPage from './pages/MediaPage';
import Careers from './pages/Careers';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AdminLogin from './pages/AdminLogin';
import AdminSignUp from './pages/AdminSignUp';
import DashboardPage from './pages/DashboardPage';
import CropCalendar from './pages/CropCalendar';
import PoultryCalendar from './pages/PoultryCalendar';
import CalendarPreviewPage from './pages/CalendarPreviewPage';
import PoultryCalendarPreviewPage from './pages/PoultryCalendarPreviewPage';
import CreatePoultryCalendarPage from './pages/CreatePoultryCalendarPage';
import CombineView from './pages/CombineView';
import MarketPage from './components/MarketPage';
import CropDiagnosticTool from './components/CropDiagnosticTool';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <ErrorBoundary>
      <ChatbotProvider>
        <Router>
          <ScrollToTop />
          <Toaster position="top-right" />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/forecast" element={<Forecast />} />

              {/* Forecast routes - support both URL formats */}
              <Route path="/seven-days-forecast" element={<SevenDaysForecast />} />
              <Route path="/7-days-forecast" element={<SevenDaysForecast />} />
              <Route path="/seasonal-forecast" element={<SeasonalForecast />} />
              <Route path="/subseasonal-forecast" element={<SubseasonalForecast />} />
              <Route path="/flood-drought" element={<FloodDrought />} />
              <Route path="/agro-bulletins" element={<AgroBulletins />} />

              {/* Agriculture routes */}
              <Route path="/crop-advisory" element={<CropAdvisory />} />
              <Route path="/poultry-advisory" element={<PoultryAdvisory />} />
              <Route path="/crop-calendar" element={<CropCalendar />} />
              <Route path="/poultry-calendar" element={<PoultryCalendar />} />

              {/* Advisory routes - support both URL formats */}
              <Route path="/agromet-advisory" element={<AgroMetAdvisory />} />
              <Route path="/agro-advisory" element={<AgroMetAdvisory />} />

              {/* Tools */}
              <Route path="/crop-diagnose" element={<CropDiagnosticTool />} />

              {/* Media and Market - support both URL formats */}
              <Route path="/media" element={<MediaPage />} />
              <Route path="/media-page" element={<MediaPage />} />
              <Route path="/market-page" element={<MarketPage />} />

              {/* General pages */}
              <Route path="/news-updates" element={<NewsUpdates />} />
              <Route path="/our-services" element={<OurServices />} />
              <Route path="/services" element={<OurServices />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/terms" element={<TermsOfService />} />

              {/* Admin routes */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-signup" element={<AdminSignUp />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Calendar preview routes */}
              <Route path="/calendar-preview" element={<CalendarPreviewPage />} />
              <Route path="/poultry-calendar-preview" element={<PoultryCalendarPreviewPage />} />
              <Route path="/create-poultry-calendar" element={<CreatePoultryCalendarPage />} />
              <Route path="/combine-view" element={<CombineView />} />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </ChatbotProvider>
    </ErrorBoundary>
  );
}

export default App;
