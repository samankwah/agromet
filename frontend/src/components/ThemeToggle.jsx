import { FaMoon, FaSun } from "react-icons/fa";
import PropTypes from "prop-types";
import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Switch to day theme" : "Switch to night theme";
  const Icon = isDark ? FaSun : FaMoon;

  return (
    <button
      type="button"
      className={`neo-icon-button ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

ThemeToggle.propTypes = {
  className: PropTypes.string,
};

export default ThemeToggle;
