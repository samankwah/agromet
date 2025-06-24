import { useState } from "react";
import {
  FaTachometerAlt,
  FaBell,
  FaCloudSun,
  FaNewspaper,
  FaChevronDown,
  FaChevronRight,
  FaSeedling,
  FaDatabase,
} from "react-icons/fa";
import PropTypes from "prop-types";
import CreateCropCalendar from "./CreateCalendar";

const Sidebar = ({ activePage, onNavigate }) => {
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [agriculturalExpanded, setAgriculturalExpanded] = useState(false);
  const [contentManagementExpanded, setContentManagementExpanded] =
    useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleWeather = () => {
    setWeatherExpanded(!weatherExpanded);
  };

  const toggleAgricultural = () => {
    setAgriculturalExpanded(!agriculturalExpanded);
  };

  const toggleContentManagement = () => {
    setContentManagementExpanded(!contentManagementExpanded);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    onNavigate("dashboard");
  };

  return (
    <>
      <div className="h-screen w-64 bg-green-800 text-white flex flex-col fixed left-0 top-0 shadow-lg">
        <div className="p-4 border-b border-green-700">
          <h1 className="text-xl font-bold">TriAgro AI Admin</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {/* Dashboard */}
            <li>
              <button
                onClick={() => onNavigate("dashboard")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg ${
                  activePage === "dashboard"
                    ? "bg-green-700"
                    : "hover:bg-green-700"
                }`}
              >
                <FaTachometerAlt className="mr-3" />
                <span>Dashboard</span>
              </button>
            </li>

            {/* Emergency Alert */}
            <li>
              <button
                onClick={() => onNavigate("emergency")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg ${
                  activePage === "emergency"
                    ? "bg-green-700"
                    : "hover:bg-green-700"
                }`}
              >
                <FaBell className="mr-3" />
                <span>Emergency Alert</span>
              </button>
            </li>

            {/* Weather Reports */}
            <li>
              <button
                onClick={toggleWeather}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg ${
                  activePage.startsWith("weather")
                    ? "bg-green-700"
                    : "hover:bg-green-700"
                }`}
              >
                <div className="flex items-center">
                  <FaCloudSun className="mr-3" />
                  <span>Weather Reports</span>
                </div>
                {weatherExpanded ? (
                  <FaChevronDown className="ml-2" />
                ) : (
                  <FaChevronRight className="ml-2" />
                )}
              </button>

              {weatherExpanded && (
                <ul className="ml-4 mt-2 space-y-1">
                  <li>
                    <button
                      onClick={() => onNavigate("weather-agro")}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "weather-agro"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Agromet Bulletins</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("weather-flood")}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "weather-flood"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Flood & Drought Bulletins</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("weather-seasonal")}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "weather-seasonal"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Seasonal Forecast</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* Agricultural Data Upload */}
            <li>
              <button
                onClick={toggleAgricultural}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg ${
                  activePage.startsWith("agricultural")
                    ? "bg-green-700"
                    : "hover:bg-green-700"
                }`}
              >
                <div className="flex items-center">
                  <FaSeedling className="mr-3" />
                  <span>Agricultural Data</span>
                </div>
                {agriculturalExpanded ? (
                  <FaChevronDown className="ml-2" />
                ) : (
                  <FaChevronRight className="ml-2" />
                )}
              </button>

              {agriculturalExpanded && (
                <ul className="ml-4 mt-2 space-y-1">
                  <li>
                    <button
                      onClick={() => onNavigate("agricultural-crop-calendar")}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "agricultural-crop-calendar"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Crop Calendars</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        onNavigate("agricultural-agromet-advisory")
                      }
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "agricultural-agromet-advisory"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Agromet Advisories</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        onNavigate("agricultural-poultry-calendar")
                      }
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "agricultural-poultry-calendar"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Poultry Calendars</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        onNavigate("agricultural-poultry-advisory")
                      }
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "agricultural-poultry-advisory"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Upload Poultry Advisories</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* Content Management */}
            <li>
              <button
                onClick={toggleContentManagement}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg ${
                  activePage.startsWith("content-management")
                    ? "bg-green-700"
                    : "hover:bg-green-700"
                }`}
              >
                <div className="flex items-center">
                  <FaDatabase className="mr-3" />
                  <span>Content Management</span>
                </div>
                {contentManagementExpanded ? (
                  <FaChevronDown className="ml-2" />
                ) : (
                  <FaChevronRight className="ml-2" />
                )}
              </button>

              {contentManagementExpanded && (
                <ul className="ml-4 mt-2 space-y-1">
                  <li>
                    <button
                      onClick={() =>
                        onNavigate("content-management-crop-calendar")
                      }
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "content-management-crop-calendar"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Crop Calendars</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        onNavigate("content-management-agromet-advisory")
                      }
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "content-management-agromet-advisory"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Agromet Advisories</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        onNavigate("content-management-poultry-calendar")
                      }
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "content-management-poultry-calendar"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Poultry Calendars</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        onNavigate("content-management-poultry-advisory")
                      }
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg ${
                        activePage === "content-management-poultry-advisory"
                          ? "bg-green-700"
                          : "hover:bg-green-700"
                      }`}
                    >
                      <span>Poultry Advisories</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* News */}
            <li>
              <button
                onClick={() => onNavigate("news")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg ${
                  activePage === "news" ? "bg-green-700" : "hover:bg-green-700"
                }`}
              >
                <FaNewspaper className="mr-3" />
                <span>News</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-green-700 text-xs text-center">
          <p>© {new Date().getFullYear()} TriAgro-AI</p>
          <p>Agricultural Intelligence Platform</p>
        </div>
      </div>

      {/* Modal */}
      <CreateCropCalendar isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

Sidebar.propTypes = {
  activePage: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default Sidebar;
