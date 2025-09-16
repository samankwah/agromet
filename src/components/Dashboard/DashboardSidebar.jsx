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
  FaCalendarAlt,
  FaEgg,
  FaEye,
  FaChartBar,
  FaCog,
  FaStar,
  FaFileAlt
} from "react-icons/fa";
import PropTypes from "prop-types";

const Sidebar = ({ activePage, onNavigate }) => {
  const [calendarManagementExpanded, setCalendarManagementExpanded] = useState(true);
  const [advisoryManagementExpanded, setAdvisoryManagementExpanded] = useState(false);

  const toggleCalendarManagement = () => {
    setCalendarManagementExpanded(!calendarManagementExpanded);
  };

  const toggleAdvisoryManagement = () => {
    setAdvisoryManagementExpanded(!advisoryManagementExpanded);
  };

  return (
    <>
      <div className="h-screen w-72 bg-green-800 text-white flex flex-col fixed left-0 top-0 shadow-lg">
        <div className="p-4 border-b border-green-700">
          <h1 className="text-xl font-bold">TriAgro AI Admin</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {/* Dashboard */}
            <li>
              <button
                onClick={() => onNavigate("dashboard")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-all ${
                  activePage === "dashboard"
                    ? "bg-green-700 shadow-md"
                    : "hover:bg-green-700 hover:shadow-sm"
                }`}
              >
                <FaTachometerAlt className="mr-3" />
                <span>Dashboard Overview</span>
              </button>
            </li>

            {/* Calendar Management */}
            <li>
              <button
                onClick={toggleCalendarManagement}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-all ${
                  activePage.startsWith("calendar") || activePage.startsWith("agricultural-crop") || activePage.startsWith("agricultural-poultry") || activePage.startsWith("enhanced-calendar")
                    ? "bg-green-700 shadow-md"
                    : "hover:bg-green-700 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-3" />
                  <span>Calendar Management</span>
                </div>
                {calendarManagementExpanded ? (
                  <FaChevronDown className="ml-2" />
                ) : (
                  <FaChevronRight className="ml-2" />
                )}
              </button>

              {calendarManagementExpanded && (
                <ul className="ml-4 mt-2 space-y-1">
                  <li>
                    <button
                      onClick={() => onNavigate("content-management-crop-calendar")}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-all ${
                        activePage === "content-management-crop-calendar"
                          ? "bg-green-600"
                          : "hover:bg-green-600"
                      }`}
                    >
                      <FaSeedling className="mr-3 text-sm" />
                      <span>Crop Calendars</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("content-management-poultry-calendar")}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-all ${
                        activePage === "content-management-poultry-calendar"
                          ? "bg-green-600"
                          : "hover:bg-green-600"
                      }`}
                    >
                      <FaEgg className="mr-3 text-sm" />
                      <span>Poultry Calendars</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* Advisory Management */}
            <li>
              <button
                onClick={toggleAdvisoryManagement}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-all ${
                  activePage.startsWith("advisory") || activePage.startsWith("agricultural-agromet") || activePage.startsWith("content-management-agromet") || activePage.startsWith("content-management-poultry-advisory")
                    ? "bg-green-700 shadow-md"
                    : "hover:bg-green-700 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center">
                  <FaCloudSun className="mr-3" />
                  <span>Advisory Management</span>
                </div>
                {advisoryManagementExpanded ? (
                  <FaChevronDown className="ml-2" />
                ) : (
                  <FaChevronRight className="ml-2" />
                )}
              </button>

              {advisoryManagementExpanded && (
                <ul className="ml-4 mt-2 space-y-1">
                  <li>
                    <button
                      onClick={() => onNavigate("content-management-agromet-advisory")}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-all ${
                        activePage === "content-management-agromet-advisory"
                          ? "bg-green-600"
                          : "hover:bg-green-600"
                      }`}
                    >
                      <FaCloudSun className="mr-3 text-sm" />
                      <span>Agromet Advisories</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("content-management-poultry-advisory")}
                      className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-all ${
                        activePage === "content-management-poultry-advisory"
                          ? "bg-green-600"
                          : "hover:bg-green-600"
                      }`}
                    >
                      <FaSeedling className="mr-3 text-sm" />
                      <span>Poultry Advisories</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>

            <div className="border-t border-green-700 my-2"></div>

            {/* System Tools */}
            <li>
              <button
                onClick={() => onNavigate("emergency")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-all ${
                  activePage === "emergency"
                    ? "bg-green-700 shadow-md"
                    : "hover:bg-green-700 hover:shadow-sm"
                }`}
              >
                <FaBell className="mr-3" />
                <span>Emergency Alerts</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => onNavigate("news")}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-all ${
                  activePage === "news"
                    ? "bg-green-700 shadow-md" 
                    : "hover:bg-green-700 hover:shadow-sm"
                }`}
              >
                <FaNewspaper className="mr-3" />
                <span>News Management</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-green-700 text-xs text-center">
          <p>© {new Date().getFullYear()} TriAgro-AI</p>
          <p>Agricultural Intelligence Platform</p>
        </div>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  activePage: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default Sidebar;
