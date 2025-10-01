import PropTypes from "prop-types";
import { FaHome, FaChevronRight, FaDatabase, FaUpload, FaChartBar } from "react-icons/fa";

const NavigationBreadcrumb = ({ activePage, onNavigate, className = "" }) => {
  // Define breadcrumb structure based on active page
  const getBreadcrumbs = (page) => {
    const breadcrumbs = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <FaHome className="w-4 h-4" />,
        path: "dashboard"
      }
    ];

    // Content Management paths
    if (page.startsWith("content-management-")) {
      const dataType = page.replace("content-management-", "");
      const typeLabels = {
        "crop-calendar": "Crop Calendar",
        "agromet-advisory": "Agromet Advisory",
        "poultry-calendar": "Poultry Calendar",
        "poultry-advisory": "Poultry Advisory"
      };

      breadcrumbs.push(
        {
          id: "content-management",
          label: "Content Management",
          icon: <FaDatabase className="w-4 h-4" />,
          path: null // Not clickable as it's a category
        },
        {
          id: page,
          label: typeLabels[dataType] || "Data Management",
          icon: <FaDatabase className="w-4 h-4" />,
          path: page
        }
      );
    }
    
    // Agricultural Data Upload paths
    else if (page.startsWith("agricultural-")) {
      const dataType = page.replace("agricultural-", "");
      const typeLabels = {
        "crop-calendar": "Crop Calendar Upload",
        "agromet-advisory": "Agromet Advisory Upload",
        "poultry-calendar": "Poultry Calendar Upload",
        "poultry-advisory": "Poultry Advisory Upload"
      };

      breadcrumbs.push(
        {
          id: "agricultural-data",
          label: "Agricultural Data",
          icon: <FaUpload className="w-4 h-4" />,
          path: null
        },
        {
          id: page,
          label: typeLabels[dataType] || "Data Upload",
          icon: <FaUpload className="w-4 h-4" />,
          path: page
        }
      );
    }
    
    // Weather Reports paths
    else if (page.startsWith("weather-")) {
      const weatherType = page.replace("weather-", "");
      const weatherLabels = {
        "agro": "Agromet Bulletins",
        "flood": "Flood & Drought Bulletins",
        "seasonal": "Seasonal Forecast"
      };

      breadcrumbs.push(
        {
          id: "weather-reports",
          label: "Weather Reports",
          icon: <FaChartBar className="w-4 h-4" />,
          path: null
        },
        {
          id: page,
          label: weatherLabels[weatherType] || "Weather Report",
          icon: <FaChartBar className="w-4 h-4" />,
          path: page
        }
      );
    }
    
    // Single level pages
    else if (page !== "dashboard") {
      const pageLabels = {
        "emergency": "Emergency Alert",
        "news": "News Management"
      };

      breadcrumbs.push({
        id: page,
        label: pageLabels[page] || page.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        icon: <FaDatabase className="w-4 h-4" />,
        path: page
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(activePage);
  
  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for dashboard only
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.id} className="flex items-center">
            {index > 0 && (
              <FaChevronRight className="w-3 h-3 text-gray-400 mr-2" />
            )}
            
            {breadcrumb.path && onNavigate ? (
              <button
                onClick={() => onNavigate(breadcrumb.path)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                  index === breadcrumbs.length - 1
                    ? "text-green-700 bg-green-50 font-medium cursor-default"
                    : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
                }`}
                disabled={index === breadcrumbs.length - 1}
              >
                {breadcrumb.icon}
                <span>{breadcrumb.label}</span>
              </button>
            ) : (
              <div className={`flex items-center space-x-1 px-2 py-1 ${
                index === breadcrumbs.length - 1
                  ? "text-green-700 font-medium"
                  : "text-gray-500"
              }`}>
                {breadcrumb.icon}
                <span>{breadcrumb.label}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

NavigationBreadcrumb.propTypes = {
  activePage: PropTypes.string.isRequired,
  onNavigate: PropTypes.func,
  className: PropTypes.string
};

export default NavigationBreadcrumb;