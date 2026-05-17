import { useState } from "react";
import {
  FaTachometerAlt,
  FaBell,
  FaCloudSun,
  FaNewspaper,
  FaChevronDown,
  FaChevronRight,
  FaSeedling,
  FaCalendarAlt,
  FaEgg,
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

  const navButtonClass = (active) =>
    `w-full flex items-center px-4 py-3 text-sm rounded-full transition-all ${
      active
        ? "bg-neo-bg text-neo-accent-strong shadow-neo-pressed"
        : "text-neo-muted hover:bg-white/55 hover:text-neo-accent-strong hover:shadow-neo-soft"
    }`;

  const parentButtonClass = (active) =>
    `w-full flex items-center justify-between px-4 py-3 text-sm rounded-full transition-all ${
      active
        ? "bg-neo-bg text-neo-accent-strong shadow-neo-pressed"
        : "text-neo-muted hover:bg-white/55 hover:text-neo-accent-strong hover:shadow-neo-soft"
    }`;

  return (
    <>
      <div className="neo-surface h-screen w-72 text-neo-text flex flex-col fixed left-0 top-0 rounded-none lg:rounded-r-neo-lg">
        <div className="p-4 border-b neo-divider">
          <h1 className="text-xl font-bold text-neo-accent-strong">AgroMet AI Admin</h1>
          <p className="mt-1 text-xs text-neo-muted">Agricultural operations</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {/* Dashboard */}
            <li>
              <button
                onClick={() => onNavigate("dashboard")}
                className={navButtonClass(activePage === "dashboard")}
              >
                <FaTachometerAlt className="mr-3" />
                <span>Dashboard Overview</span>
              </button>
            </li>

            {/* Calendar Management */}
            <li>
              <button
                onClick={toggleCalendarManagement}
                className={parentButtonClass(activePage.startsWith("calendar") || activePage.startsWith("agricultural-crop") || activePage.startsWith("agricultural-poultry") || activePage.startsWith("enhanced-calendar"))}
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
                      className={navButtonClass(activePage === "content-management-crop-calendar")}
                    >
                      <FaSeedling className="mr-3 text-sm" />
                      <span>Crop Calendars</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("content-management-poultry-calendar")}
                      className={navButtonClass(activePage === "content-management-poultry-calendar")}
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
                className={parentButtonClass(activePage.startsWith("advisory") || activePage.startsWith("agricultural-agromet") || activePage.startsWith("content-management-agromet") || activePage.startsWith("content-management-poultry-advisory"))}
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
                      className={navButtonClass(activePage === "content-management-agromet-advisory")}
                    >
                      <FaCloudSun className="mr-3 text-sm" />
                      <span>Agromet Advisories</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("content-management-poultry-advisory")}
                      className={navButtonClass(activePage === "content-management-poultry-advisory")}
                    >
                      <FaSeedling className="mr-3 text-sm" />
                      <span>Poultry Advisories</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>

            <div className="border-t neo-divider my-2"></div>

            {/* System Tools */}
            <li>
              <button
                onClick={() => onNavigate("emergency")}
                className={navButtonClass(activePage === "emergency")}
              >
                <FaBell className="mr-3" />
                <span>Emergency Alerts</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => onNavigate("news")}
                className={navButtonClass(activePage === "news")}
              >
                <FaNewspaper className="mr-3" />
                <span>News Management</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t neo-divider text-xs text-center text-neo-muted">
          <p>© {new Date().getFullYear()} AgroMet AI</p>
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
