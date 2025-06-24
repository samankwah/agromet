// import { Polygon, Popup, Tooltip } from "react-leaflet";

// const SeverityPolygon = ({ coordinates, severity, message }) => {
//   const severityColors = {
//     low: "#00ff00", // Light rain
//     medium: "#ffff00", // Moderate rain
//     high: "#ff0000", // Heavy rain
//   };

//   return (
//     <Polygon
//       positions={coordinates}
//       pathOptions={{
//         color: "blue", // Border color
//         fillColor: severityColors[severity], // Color based on severity
//         fillOpacity: 0.5, // Transparency
//       }}
//     >
//       {/* Popup with more information */}
//       <Popup>
//         <div>
//           <p>{message}</p>
//         </div>
//       </Popup>

//       {/* Tooltip on hover */}
//       <Tooltip>
//         <span>{severity.toUpperCase()} Severity Zone</span>
//       </Tooltip>
//     </Polygon>
//   );
// };

// export default SeverityPolygon;

import { Polygon, Popup, Tooltip } from "react-leaflet";
import PropTypes from "prop-types"; // Importing PropTypes for type-checking

const SeverityPolygon = ({ coordinates, severity, message }) => {
  // Define colors for different severity levels
  const severityColors = {
    low: "#00ff00", // Green for low severity
    medium: "#ffff00", // Yellow for medium severity
    high: "#ff0000", // Red for high severity
  };

  // Ensure severity is valid, default to "medium" if not
  const fillColor = severityColors[severity] || severityColors.medium;

  // Ensure that coordinates are properly passed
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return null; // If coordinates are invalid, render nothing
  }

  // Ensure the message is a string, default to a fallback if not provided
  const displayMessage = message || "No additional information available.";

  return (
    <Polygon
      // Ensure positions are passed correctly as the coordinates prop
      positions={coordinates}
      // Path options for the polygon (color, fill color based on severity, etc.)
      pathOptions={{
        color: "blue", // Border color for the polygon
        fillColor: fillColor, // Fill color based on severity
        fillOpacity: 0.5, // Transparency level
      }}
    >
      {/* Popup component displays a message when the polygon is clicked */}
      <Popup>
        <div>
          <h3>{severity.toUpperCase()} Severity Zone</h3>
          <p>{displayMessage}</p>
        </div>
      </Popup>

      {/* Tooltip that appears when hovering over the polygon */}
      <Tooltip>
        <span>{severity.toUpperCase()} Severity Zone</span>
      </Tooltip>
    </Polygon>
  );
};

// PropTypes for type checking
SeverityPolygon.propTypes = {
  coordinates: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.number) // Expecting an array of [lat, lng] pairs
  ).isRequired,
  severity: PropTypes.oneOf(["low", "medium", "high"]).isRequired, // Severity must be one of these values
  message: PropTypes.string, // Optional string for the popup message
};

// Default props in case they're missing
SeverityPolygon.defaultProps = {
  message: "No additional information available.",
};

export default SeverityPolygon;
