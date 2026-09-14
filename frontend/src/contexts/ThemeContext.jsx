import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";

const STORAGE_KEY = "agromet-theme";
const THEMES = new Set(["light", "dark"]);

const ThemeContext = createContext(null);

const getStoredTheme = () => {
  if (typeof window === "undefined") return null;

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.has(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
};

const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getInitialTheme = () => getStoredTheme() || getSystemTheme() || "light";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [hasStoredPreference, setHasStoredPreference] = useState(() => Boolean(getStoredTheme()));

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (hasStoredPreference) return undefined;

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return undefined;

    const handleChange = (event) => {
      if (!getStoredTheme()) {
        setTheme(event.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, [hasStoredPreference]);

  const updateTheme = useCallback((nextTheme) => {
    if (!THEMES.has(nextTheme)) return;

    setTheme(nextTheme);
    setHasStoredPreference(true);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Theme selection should still work when storage is unavailable.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme(theme === "dark" ? "light" : "dark");
  }, [theme, updateTheme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme: updateTheme,
      toggleTheme,
    }),
    [theme, updateTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
