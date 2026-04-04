// Weather themes and color schemes for live weather icons

export const weatherThemes = {
  "clear sky": {
    primary: "#FFD700", // Golden yellow
    secondary: "#FFA500", // Orange
    accent: "#FFFF00", // Bright yellow
    gradient: "from-yellow-400 via-orange-400 to-yellow-500",
    background: "from-sky-300 to-sky-500",
    glow: "shadow-yellow-400/50",
    particles: "#FFE55C",
    intensity: "high"
  },

  "sunny": {
    primary: "#FFD700",
    secondary: "#FF8C00",
    accent: "#FFFFE0",
    gradient: "from-yellow-300 via-yellow-400 to-orange-400",
    background: "from-blue-400 to-sky-300",
    glow: "shadow-yellow-300/60",
    particles: "#FFF700",
    intensity: "high"
  },

  "sunny intervals": {
    primary: "#FFD700",
    secondary: "#87CEEB",
    accent: "#F0F8FF",
    gradient: "from-yellow-400 via-sky-300 to-white",
    background: "from-blue-300 to-sky-400",
    glow: "shadow-yellow-300/40",
    particles: "#FFE55C",
    intensity: "medium"
  },

  "partly cloudy": {
    primary: "#87CEEB",
    secondary: "#B0C4DE",
    accent: "#F5F5F5",
    gradient: "from-gray-300 via-blue-200 to-white",
    background: "from-gray-400 to-blue-300",
    glow: "shadow-blue-300/30",
    particles: "#E6F3FF",
    intensity: "medium"
  },

  "cloudy": {
    primary: "#708090",
    secondary: "#A9A9A9",
    accent: "#D3D3D3",
    gradient: "from-gray-400 via-gray-300 to-gray-200",
    background: "from-gray-500 to-gray-400",
    glow: "shadow-gray-400/30",
    particles: "#F0F0F0",
    intensity: "low"
  },

  "overcast": {
    primary: "#696969",
    secondary: "#808080",
    accent: "#DCDCDC",
    gradient: "from-gray-600 via-gray-500 to-gray-400",
    background: "from-gray-600 to-gray-500",
    glow: "shadow-gray-500/40",
    particles: "#E5E5E5",
    intensity: "low"
  },

  "light rain": {
    primary: "#4682B4",
    secondary: "#87CEFA",
    accent: "#E0F6FF",
    gradient: "from-blue-400 via-blue-300 to-sky-200",
    background: "from-gray-500 to-blue-400",
    glow: "shadow-blue-400/50",
    particles: "#B0E0E6",
    intensity: "medium"
  },

  "moderate rain": {
    primary: "#1E90FF",
    secondary: "#4169E1",
    accent: "#ADD8E6",
    gradient: "from-blue-500 via-blue-400 to-blue-300",
    background: "from-gray-600 to-blue-500",
    glow: "shadow-blue-500/60",
    particles: "#87CEEB",
    intensity: "high"
  },

  "heavy rain": {
    primary: "#0000CD",
    secondary: "#191970",
    accent: "#6495ED",
    gradient: "from-blue-700 via-blue-600 to-blue-500",
    background: "from-gray-700 to-blue-600",
    glow: "shadow-blue-600/70",
    particles: "#4682B4",
    intensity: "very-high"
  },

  "thunderstorm": {
    primary: "#8A2BE2",
    secondary: "#4B0082",
    accent: "#FFD700",
    gradient: "from-purple-600 via-indigo-700 to-gray-800",
    background: "from-gray-800 to-purple-700",
    glow: "shadow-purple-500/80",
    particles: "#FFFF00",
    intensity: "extreme"
  },

  "snow": {
    primary: "#FFFAFA",
    secondary: "#F0F8FF",
    accent: "#E6E6FA",
    gradient: "from-white via-blue-100 to-gray-200",
    background: "from-gray-300 to-blue-200",
    glow: "shadow-blue-200/50",
    particles: "#FFFFFF",
    intensity: "medium"
  },

  "mist": {
    primary: "#F5F5F5",
    secondary: "#DCDCDC",
    accent: "#F8F8FF",
    gradient: "from-gray-200 via-gray-100 to-white",
    background: "from-gray-400 to-gray-200",
    glow: "shadow-gray-300/40",
    particles: "#F0F0F0",
    intensity: "low"
  },

  "fog": {
    primary: "#E6E6FA",
    secondary: "#D3D3D3",
    accent: "#F5F5F5",
    gradient: "from-gray-300 via-gray-200 to-gray-100",
    background: "from-gray-500 to-gray-300",
    glow: "shadow-gray-400/50",
    particles: "#EEEEEE",
    intensity: "medium"
  }
};

// Time-based variations
export const getTimeBasedTheme = (baseTheme, hour = new Date().getHours()) => {
  const isMorning = hour >= 6 && hour < 12;
  const isEvening = hour >= 18 && hour < 21;
  const isNight = hour >= 21 || hour < 6;

  if (isNight) {
    return {
      ...baseTheme,
      primary: darkenColor(baseTheme.primary, 0.4),
      background: "from-indigo-900 to-purple-900",
      glow: baseTheme.glow.replace(/\/\d+/, "/30"),
      intensity: "low"
    };
  }

  if (isEvening) {
    return {
      ...baseTheme,
      gradient: baseTheme.gradient.replace("yellow", "orange").replace("sky", "amber"),
      background: "from-orange-400 to-red-400",
      accent: "#FF6347"
    };
  }

  if (isMorning) {
    return {
      ...baseTheme,
      gradient: baseTheme.gradient.replace("orange", "pink"),
      background: "from-pink-300 to-blue-300",
      accent: "#FFB6C1"
    };
  }

  return baseTheme;
};

// Utility function to darken colors
const darkenColor = (color, factor) => {
  // Simple darkening - in production, you might want a more sophisticated color manipulation
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * factor * 100);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

// Animation intensity mappings
export const animationIntensity = {
  "low": {
    duration: 8,
    scale: 0.8,
    particleCount: 3,
    opacity: 0.6
  },
  "medium": {
    duration: 6,
    scale: 1.0,
    particleCount: 5,
    opacity: 0.8
  },
  "high": {
    duration: 4,
    scale: 1.2,
    particleCount: 8,
    opacity: 1.0
  },
  "very-high": {
    duration: 3,
    scale: 1.4,
    particleCount: 12,
    opacity: 1.0
  },
  "extreme": {
    duration: 2,
    scale: 1.6,
    particleCount: 15,
    opacity: 1.0
  }
};

// Weather condition helpers
export const getWeatherTheme = (condition, includeTimeVariation = true) => {
  const conditionKey = condition.toLowerCase();
  const baseTheme = weatherThemes[conditionKey] || weatherThemes["sunny intervals"];

  if (includeTimeVariation) {
    return getTimeBasedTheme(baseTheme);
  }

  return baseTheme;
};

export const getAnimationSettings = (condition) => {
  const theme = getWeatherTheme(condition, false);
  return animationIntensity[theme.intensity] || animationIntensity["medium"];
};