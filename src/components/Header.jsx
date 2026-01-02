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
  FaImage,
  FaTimes,
  FaCamera,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import logo2 from "../assets/images/agromet-high-resolution-logo-transparent.png";
import { useChatbotIntegration } from "../hooks/useChatbotIntegration";

// Dropdown Component
const Dropdown = ({ links, title }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
      ref={dropdownRef}
    >
      <button className="block px-3 text-black font-semibold border-b-2 border-transparent hover:border-black text-sm whitespace-nowrap flex items-center">
        {title} <FaChevronDown className="inline ml-1 text-black" />
      </button>

      {isDropdownOpen && (
        <div
          className="absolute left-0 z-50 w-52 bg-white border border-gray-200 rounded-md shadow-lg"
          style={{ top: "100%" }}
        >
          <ul className="py-1">
            {links.map((link) => (
              <li key={link.to || link.href}>
                {link.href ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 text-black hover:bg-gray-200 transition duration-200 text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.to}
                    className="block p-2 text-black hover:bg-gray-200 transition duration-200 text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

Dropdown.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      to: PropTypes.string,
      href: PropTypes.string,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
};

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Initialize chatbot integration
  useChatbotIntegration();

  const forecastLinks = [
    { to: "/7-days-forecast", label: "Weekly Forecast" },
    { to: "/agro-bulletins", label: "Agrometeorological Bulletins" },
    { to: "/subseasonal-forecast", label: "Subseasonal 2 Seasonal Forecast" },

    { to: "/flood-drought", label: "Flood & Drought Bulletins" },

    { to: "/seasonal-forecast", label: "Seasonal Forecast" },
  ];

  const agricultureLinks = [
    { to: "/crop-calendar", label: "Crop Calendar" },
    { to: "/poultry-calendar", label: "Poultry Calendar" },
    { to: "/crop-advisory", label: "Crop Advisories" },
    { to: "/poultry-advisory", label: "Poultry Advisories" },
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

  return (
    <header
      className="fixed top-0 left-1/2 transform -translate-x-1/2 w-[94%] md:w-[98%] p-1 md:p-2 z-[1000] bg-white/20 backdrop-blur-[600px] border border-white/30 shadow-md rounded-full mt-2"
      style={{ maxWidth: "1600px" }}
    >
      <div className="container mx-auto flex items-center justify-between px-2 md:px-4">
        <div className="flex items-center space-x-2 mb-0 md:mb-0">
          <Link to="/">
            <img
              src={logo2}
              alt="agropulse logo"
              className="h-10 md:h-12 rounded-lg p-1"
            />
          </Link>
        </div>
        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <button
            ref={menuButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 menu-toggle"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <FaBars className="h-6 w-6 text-black" />
          </button>
        </div>
        {/* Desktop Navbar Links */}
        <div className="hidden text-black lg:flex align-middle items-center justify-center flex-1 space-x-4 xl:space-x-6">
          <Link
            to="/"
            className={`block px-3 font-semibold text-sm border-b-2 ${
              location.pathname === "/" ? "border-black" : "border-transparent"
            } hover:border-black flex flex-row items-center py-2`}
          >
            <FaHome className="mb-1 text-xl mr-1 text-black" />
            <span>Home</span>
          </Link>

          {/* <div className="flex flex-row items-center">
            <FaCloudSun className="mb-1 text-xl mr-1 text-black" />
            <Dropdown
              links={forecastLinks}
              title="Weather"
              className={`block px-3 font-semibold border-b-2 text-sm ${
                forecastLinks.some((link) => location.pathname === link.to)
                  ? "border-black"
                  : "border-transparent"
              } hover:border-black flex flex-row items-center py-2`}
            />
          </div>

          <div className="flex flex-row items-center">
            <FaSeedling className="mb-1 text-xl mr-1 text-black" />
            <Dropdown
              links={agricultureLinks}
              title="Agriculture"
              className={`block px-3 font-semibold border-b-2 text-sm ${
                agricultureLinks.some((link) => location.pathname === link.to)
                  ? "border-black"
                  : "border-transparent"
              } hover:border-black flex flex-row items-center py-2`}
            />
          </div> */}

          <Link
            to="/agro-advisory"
            className={`block px-3 font-semibold border-b-2 text-sm whitespace-nowrap ${
              location.pathname === "/agro-advisory"
                ? "border-black"
                : "border-transparent"
            } hover:border-black flex flex-row items-center py-2`}
          >
            <FaComments className="mb-1 text-xl mr-1 text-black" />
            <span>Agromet Advisory</span>
          </Link>
          <Link
            to="/crop-diagnose"
            className={`block px-3 font-semibold border-b-2 text-sm whitespace-nowrap ${
              location.pathname === "/crop-diagnose"
                ? "border-black"
                : "border-transparent"
            } hover:border-black flex flex-row items-center py-2`}
          >
            <FaCamera className="mb-1 text-xl mr-1 text-black" />
            <span>Diagnose</span>
          </Link>
          <Link
            to="/media-page"
            className={`block px-3 font-semibold border-b-2 text-sm whitespace-nowrap ${
              location.pathname === "/media-page"
                ? "border-black"
                : "border-transparent"
            } hover:border-black flex flex-row items-center py-2`}
          >
            <FaImage className="mb-1 text-xl mr-1 text-black" />
            <span>Media</span>
          </Link>
          <Link
            to="/market-page"
            className={`block px-3 font-semibold border-b-2 text-sm whitespace-nowrap ${
              location.pathname === "/market-page"
                ? "border-black"
                : "border-transparent"
            } hover:border-black flex flex-row items-center py-2`}
          >
            <FaShoppingCart className="mb-1 text-xl mr-1 text-black" />
            <span>Market</span>
          </Link>
        </div>

        <div className="hidden lg:flex flex-col border-2 border-gray-100 h-8 mx-2" />

        <Link
          to="/admin-login"
          className={`hidden lg:flex px-3 font-semibold text-sm border-b-2 ${
            location.pathname === "/admin-login"
              ? "border-black"
              : "border-transparent"
          } hover:border-black flex-row items-center py-2 text-black`}
        >
          <FaUser className="mb-1 text-xl text-black" />
        </Link>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/0 z-50 lg:hidden transition-opacity duration-300"
          aria-modal="true"
          role="dialog"
        >
          <div
            ref={mobileMenuRef}
            tabIndex={-1}
            className={`fixed top-0 left-0 w-4/5 h-screen bg-white shadow-lg z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ maxWidth: "320px" }}
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <img
                  src={logo2}
                  alt="ddt logo"
                  className="h-8 rounded-lg p-1"
                />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label="Close menu"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="overflow-y-auto h-[calc(100%-68px)]">
              <nav className="flex flex-col">
                {/* Main Navigation Items */}
                <Link
                  to="/"
                  className={`flex items-center px-6 py-3 text-gray-950 ${
                    location.pathname === "/" ? "bg-blue-50 text-blue-700" : ""
                  } hover:bg-gray-100`}
                >
                  <FaHome className="mr-4 text-lg" />
                  <span className="font-medium">Home</span>
                </Link>

                <Link
                  to="/market-page"
                  className={`flex items-center px-6 py-3 text-gray-950 ${
                    location.pathname === "/market-page"
                      ? "bg-blue-50 text-blue-700"
                      : ""
                  } hover:bg-gray-100`}
                >
                  <FaShoppingCart className="mr-4 text-lg" />
                  <span className="font-medium">Market</span>
                </Link>

                <Link
                  to="/agro-advisory"
                  className={`flex items-center px-6 py-3 text-gray-950 ${
                    location.pathname === "/agro-advisory"
                      ? "bg-blue-50 text-blue-700"
                      : ""
                  } hover:bg-gray-100`}
                >
                  <FaComments className="mr-4 text-lg" />
                  <span className="font-medium">Agromet Advisory</span>
                </Link>

                <Link
                  to="/media-page"
                  className={`flex items-center px-6 py-3 text-gray-950 ${
                    location.pathname === "/media-page"
                      ? "bg-blue-50 text-blue-700"
                      : ""
                  } hover:bg-gray-100`}
                >
                  <FaImage className="mr-4 text-lg" />
                  <span className="font-medium">Media</span>
                </Link>

                <Link
                  to="/crop-diagnose"
                  className={`flex items-center px-6 py-3 text-gray-950 ${
                    location.pathname === "/crop-diagnose"
                      ? "bg-blue-50 text-blue-700"
                      : ""
                  } hover:bg-gray-100`}
                >
                  <FaCamera className="mr-4 text-lg" />
                  <span className="font-medium">Crop Diagnose</span>
                </Link>

                {/* Expandable Weather Section */}
                <div>
                  <button
                    className={`flex items-center justify-between w-full px-6 py-3 text-gray-950 hover:bg-gray-100 ${
                      expandedSection === "weather" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => toggleSection("weather")}
                    aria-expanded={expandedSection === "weather"}
                  >
                    <div className="flex items-center">
                      <FaCloudSun className="mr-4 text-lg" />
                      <span className="font-medium">Weather</span>
                    </div>
                    {expandedSection === "weather" ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </button>

                  {expandedSection === "weather" && (
                    <div className="bg-gray-50">
                      {forecastLinks.map((link, index) => (
                        <Link
                          key={index}
                          to={link.to}
                          className={`flex items-center pl-14 pr-6 py-3 text-gray-700 hover:bg-gray-100 ${
                            location.pathname === link.to
                              ? "text-blue-600 bg-blue-50"
                              : ""
                          }`}
                        >
                          <FaChevronRight className="mr-2 text-xs text-gray-400" />
                          <span>{link.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expandable Agriculture Section */}
                <div>
                  <button
                    className={`flex items-center justify-between w-full px-6 py-3 text-gray-950 hover:bg-gray-100 ${
                      expandedSection === "agriculture" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => toggleSection("agriculture")}
                    aria-expanded={expandedSection === "agriculture"}
                  >
                    <div className="flex items-center">
                      <FaSeedling className="mr-4 text-lg" />
                      <span className="font-medium">Agriculture</span>
                    </div>
                    {expandedSection === "agriculture" ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </button>

                  {expandedSection === "agriculture" && (
                    <div className="bg-gray-50">
                      {agricultureLinks.map((link, index) => (
                        <Link
                          key={index}
                          to={link.to}
                          className={`flex items-center pl-14 pr-6 py-3 text-gray-700 hover:bg-gray-100 ${
                            location.pathname === link.to
                              ? "text-blue-600 bg-blue-50"
                              : ""
                          }`}
                        >
                          <FaChevronRight className="mr-2 text-xs text-gray-400" />
                          <span>{link.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Login */}
                <Link
                  to="/admin-login"
                  className={`flex items-center px-6 py-3 text-gray-950 ${
                    location.pathname === "/admin-login"
                      ? "bg-blue-50 text-blue-700"
                      : ""
                  } hover:bg-gray-100 mt-2`}
                >
                  <FaUser className="mr-4 text-lg" />
                  <span className="font-medium">Admin</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
