import { useState, useEffect, useRef } from "react";
import {
  FaHome,
  FaBars,
  FaChevronDown,
  FaChevronUp,
  FaChevronRight,
  FaShoppingCart,
  FaSeedling,
  FaCloudSun,
  FaComments,
  FaUser,
  FaTimes,
  FaCamera,
} from "react-icons/fa";
import LanguageSelector from "./common/LanguageSelector";
import T from "./common/T";
import { Link, useLocation } from "react-router-dom";
import logo2 from "../assets/images/agromet-high-resolution-logo-transparent.png";
import { useChatbotIntegration } from "../hooks/useChatbotIntegration";

const navPillBase =
  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-neo-text transition-all duration-200 hover:text-neo-accent-strong focus:outline-none focus-visible:ring-4 focus-visible:ring-neo-focus/25";

const navPillState = (active) =>
  active
    ? "bg-neo-bg shadow-neo-pressed text-neo-accent-strong"
    : "hover:bg-white/45 hover:shadow-neo-soft";

const mobileNavState = (active) =>
  active
    ? "bg-neo-bg shadow-neo-pressed text-neo-accent-strong"
    : "text-neo-text hover:bg-white/50 hover:shadow-neo-soft";

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Initialize chatbot integration
  useChatbotIntegration();

  const forecastLinks = [
    { to: "/7-days-forecast", label: <T>Weekly Forecast</T> },
    { to: "/agro-bulletins", label: <T>Agrometeorological Bulletins</T> },
    { to: "/subseasonal-forecast", label: <T>Subseasonal 2 Seasonal Forecast</T> },
    { to: "/flood-drought", label: <T>Flood & Drought Bulletins</T> },
    { to: "/seasonal-forecast", label: <T>Seasonal Forecast</T> },
  ];

  const agricultureLinks = [
    { to: "/crop-calendar", label: <T>Crop Calendar</T> },
    { to: "/poultry-calendar", label: <T>Poultry Calendar</T> },
    { to: "/crop-advisory", label: <T>Crop Advisories</T> },
    { to: "/poultry-advisory", label: <T>Poultry Advisories</T> },
  ];

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Handle clicks outside the mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    // Add/remove body scroll lock and focus management
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      mobileMenuRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on location change and manage focus
  useEffect(() => {
    setIsMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }, [location]);

  // Trap focus within mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      const focusableElements = mobileMenuRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      const handleKeyDown = (e) => {
        if (e.key === "Tab") {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isMobileMenuOpen]);

  const isForecastActive = forecastLinks.some((link) => location.pathname === link.to);
  const isAgricultureActive = agricultureLinks.some((link) => location.pathname === link.to);

  return (
    <div className="fixed inset-x-0 top-3 z-[1000] px-2 md:px-4">
      <header
        className="neo-surface mx-auto w-full max-w-[1600px] rounded-full px-2 py-1.5 md:px-3 md:py-2"
      >
        <div className="mx-auto flex items-center justify-between gap-2 px-1 md:px-2">
        <div className="flex items-center space-x-2 mb-0 md:mb-0">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-neo-surface px-3 py-1.5 shadow-neo-soft transition hover:shadow-neo"
            aria-label="AgroMet home"
          >
            <img
              src={logo2}
              alt="agropulse logo"
              className="h-11 w-auto object-contain md:h-14"
            />
          </Link>
        </div>
        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <button
            ref={menuButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="neo-icon-button menu-toggle"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <FaBars className="h-5 w-5" />
          </button>
        </div>
        {/* Desktop Navbar Links */}
        <div className="hidden lg:flex align-middle items-center justify-center flex-1 gap-2 xl:gap-3">
          <Link
            to="/"
            className={`${navPillBase} ${navPillState(location.pathname === "/")}`}
          >
            <FaHome className="text-base" />
            <span><T>Home</T></span>
          </Link>

          <Link
            to="/agro-advisory"
            className={`${navPillBase} ${navPillState(location.pathname === "/agro-advisory" || location.pathname === "/agromet-advisory")} whitespace-nowrap`}
          >
            <FaComments className="text-base" />
            <span><T>Agromet Advisory</T></span>
          </Link>
          <Link
            to="/crop-diagnose"
            className={`${navPillBase} ${navPillState(location.pathname === "/crop-diagnose")} whitespace-nowrap`}
          >
            <FaCamera className="text-base" />
            <span><T>Diagnose</T></span>
          </Link>
          <Link
            to="/market-page"
            className={`${navPillBase} ${navPillState(location.pathname === "/market-page")} whitespace-nowrap`}
          >
            <FaShoppingCart className="text-base" />
            <span><T>Market</T></span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center">
          <LanguageSelector variant="header" />
        </div>

        <div className="hidden lg:flex h-8 w-px bg-neo-border mx-2" />

        <Link
          to="/admin-login"
          className={`neo-icon-button hidden lg:flex ${location.pathname === "/admin-login" ? "is-active" : ""}`}
          aria-label="Admin login"
        >
          <FaUser className="text-base" />
        </Link>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-neo-text/15 lg:hidden transition-opacity duration-300"
            aria-modal="true"
            role="dialog"
          >
            <div
              ref={mobileMenuRef}
              tabIndex={-1}
              className={`neo-surface fixed top-3 left-3 h-[calc(100vh-1.5rem)] w-[min(84vw,340px)] overflow-y-auto rounded-neo-lg z-50 transform transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <img
                    src={logo2}
                    alt="ddt logo"
                    className="h-10 w-auto rounded-lg p-1"
                  />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="neo-icon-button h-10 w-10"
                  aria-label="Close menu"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Menu Content */}
              <div className="h-[calc(100%-68px)] overflow-y-auto">
                <nav className="flex flex-col">
                  {/* Language Selector */}
                  <div className="px-4 py-3 border-b neo-divider">
                    <LanguageSelector variant="inline" />
                  </div>

                  {/* Main Navigation Items */}
                  <Link
                    to="/"
                    className={`mx-3 my-1 flex items-center rounded-full px-4 py-3 ${mobileNavState(location.pathname === "/")}`}
                  >
                    <FaHome className="mr-4 text-lg" />
                    <span className="font-medium"><T>Home</T></span>
                  </Link>

                  <Link
                    to="/market-page"
                    className={`mx-3 my-1 flex items-center rounded-full px-4 py-3 ${mobileNavState(location.pathname === "/market-page")}`}
                  >
                    <FaShoppingCart className="mr-4 text-lg" />
                    <span className="font-medium"><T>Market</T></span>
                  </Link>

                <Link
                  to="/agro-advisory"
                  className={`mx-3 my-1 flex items-center rounded-full px-4 py-3 ${mobileNavState(location.pathname === "/agro-advisory" || location.pathname === "/agromet-advisory")}`}
                >
                  <FaComments className="mr-4 text-lg" />
                  <span className="font-medium"><T>Agromet Advisory</T></span>
                </Link>

                <Link
                  to="/crop-diagnose"
                  className={`mx-3 my-1 flex items-center rounded-full px-4 py-3 ${mobileNavState(location.pathname === "/crop-diagnose")}`}
                >
                  <FaCamera className="mr-4 text-lg" />
                  <span className="font-medium"><T>Crop Diagnose</T></span>
                </Link>

                {/* Expandable Weather Section */}
                <div>
                  <button
                    className={`mx-3 my-1 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-full px-4 py-3 ${mobileNavState(expandedSection === "weather" || isForecastActive)}`}
                    onClick={() => toggleSection("weather")}
                    aria-expanded={expandedSection === "weather"}
                  >
                    <div className="flex items-center">
                      <FaCloudSun className="mr-4 text-lg" />
                      <span className="font-medium"><T>Weather</T></span>
                    </div>
                    {expandedSection === "weather" ? (
                      <FaChevronUp className="text-neo-muted" />
                    ) : (
                      <FaChevronDown className="text-neo-muted" />
                    )}
                  </button>

                  {expandedSection === "weather" && (
                    <div className="mx-4 mb-2 rounded-neo bg-white/40 p-2">
                      {forecastLinks.map((link, index) => (
                        <Link
                          key={index}
                          to={link.to}
                          className={`flex items-center rounded-full px-4 py-2 text-sm ${
                            location.pathname === link.to
                              ? "bg-neo-bg text-neo-accent-strong shadow-neo-pressed"
                              : "text-neo-muted hover:bg-white/60"
                          }`}
                        >
                          <FaChevronRight className="mr-2 text-xs text-neo-muted" />
                          <span>{link.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expandable Agriculture Section */}
                <div>
                  <button
                    className={`mx-3 my-1 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-full px-4 py-3 ${mobileNavState(expandedSection === "agriculture" || isAgricultureActive)}`}
                    onClick={() => toggleSection("agriculture")}
                    aria-expanded={expandedSection === "agriculture"}
                  >
                    <div className="flex items-center">
                      <FaSeedling className="mr-4 text-lg" />
                      <span className="font-medium"><T>Agriculture</T></span>
                    </div>
                    {expandedSection === "agriculture" ? (
                      <FaChevronUp className="text-neo-muted" />
                    ) : (
                      <FaChevronDown className="text-neo-muted" />
                    )}
                  </button>

                  {expandedSection === "agriculture" && (
                    <div className="mx-4 mb-2 rounded-neo bg-white/40 p-2">
                      {agricultureLinks.map((link, index) => (
                        <Link
                          key={index}
                          to={link.to}
                          className={`flex items-center rounded-full px-4 py-2 text-sm ${
                            location.pathname === link.to
                              ? "bg-neo-bg text-neo-accent-strong shadow-neo-pressed"
                              : "text-neo-muted hover:bg-white/60"
                          }`}
                        >
                          <FaChevronRight className="mr-2 text-xs text-neo-muted" />
                          <span>{link.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Login */}
                <Link
                  to="/admin-login"
                  className={`mx-3 my-1 mt-3 flex items-center rounded-full px-4 py-3 ${mobileNavState(location.pathname === "/admin-login")}`}
                >
                  <FaUser className="mr-4 text-lg" />
                  <span className="font-medium"><T>Admin</T></span>
                </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;
