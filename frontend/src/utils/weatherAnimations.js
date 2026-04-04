// Weather animation definitions and utilities for live weather icons

// Base animation variants for Framer Motion
export const weatherAnimations = {
  // Sun animations
  sun: {
    rotate: {
      rotate: [0, 360],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    glow: {
      filter: [
        "drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))",
        "drop-shadow(0 0 20px rgba(255, 215, 0, 1))",
        "drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Cloud animations
  cloud: {
    float: {
      y: [0, -8, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    drift: {
      x: [0, 10, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    opacity: {
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Rain animations
  rain: {
    drop: {
      y: [-20, 100],
      opacity: [0, 1, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
        staggerChildren: 0.1
      }
    },
    splash: {
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  },

  // Snow animations
  snow: {
    fall: {
      y: [-20, 100],
      x: [-5, 5, -5],
      rotate: [0, 360],
      opacity: [0, 1, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }
    },
    accumulate: {
      scale: [0, 1],
      transition: {
        duration: 2,
        ease: "easeOut"
      }
    }
  },

  // Lightning animations
  lightning: {
    flash: {
      opacity: [0, 1, 0, 1, 0],
      scale: [0.8, 1.2, 0.8, 1.2, 0.8],
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "easeInOut"
      }
    },
    strike: {
      pathLength: [0, 1],
      opacity: [0, 1, 0],
      transition: {
        duration: 0.1,
        repeat: Infinity,
        repeatDelay: 4,
        ease: "easeOut"
      }
    }
  },

  // Fog/Mist animations
  fog: {
    wave: {
      opacity: [0.3, 0.8, 0.3],
      scale: [0.9, 1.1, 0.9],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    layer: {
      x: [0, 20, 0],
      opacity: [0.2, 0.6, 0.2],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Wind animations
  wind: {
    sway: {
      x: [0, 15, 0, -15, 0],
      rotate: [0, 2, 0, -2, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    gust: {
      scale: [1, 1.2, 1],
      x: [0, 10, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

// Particle system animations
export const particleAnimations = {
  raindrops: (count = 5) => Array.from({ length: count }, (_, i) => ({
    y: [-20, 100],
    opacity: [0, 1, 0],
    transition: {
      duration: 0.8 + Math.random() * 0.4,
      repeat: Infinity,
      delay: i * 0.1,
      ease: "linear"
    }
  })),

  snowflakes: (count = 8) => Array.from({ length: count }, (_, i) => ({
    y: [-20, 100],
    x: [Math.random() * 10 - 5, Math.random() * 10 - 5],
    rotate: [0, 360],
    opacity: [0, 1, 0],
    transition: {
      duration: 2 + Math.random() * 2,
      repeat: Infinity,
      delay: i * 0.2,
      ease: "linear"
    }
  })),

  sparkles: (count = 6) => Array.from({ length: count }, (_, i) => ({
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    rotate: [0, 180],
    transition: {
      duration: 1 + Math.random() * 0.5,
      repeat: Infinity,
      delay: i * 0.3,
      ease: "easeInOut"
    }
  })),

  lightning_particles: (count = 3) => Array.from({ length: count }, (_, i) => ({
    opacity: [0, 1, 0],
    scale: [0.5, 1.5, 0.5],
    transition: {
      duration: 0.1,
      repeat: Infinity,
      delay: i * 0.05,
      repeatDelay: 3,
      ease: "easeOut"
    }
  }))
};


// Animation configuration based on weather conditions
export const getWeatherAnimation = (condition) => {
  const conditionKey = condition.toLowerCase();

  const animationMap = {
    "clear sky": {
      primary: weatherAnimations.sun.rotate,
      secondary: weatherAnimations.sun.glow,
      particles: particleAnimations.sparkles(4)
    },

    "sunny": {
      primary: weatherAnimations.sun.rotate,
      secondary: weatherAnimations.sun.pulse,
      particles: particleAnimations.sparkles(6)
    },

    "sunny intervals": {
      primary: weatherAnimations.cloud.float,
      secondary: weatherAnimations.sun.rotate,
      particles: particleAnimations.sparkles(3)
    },

    "partly cloudy": {
      primary: weatherAnimations.cloud.float,
      secondary: weatherAnimations.cloud.drift,
      particles: []
    },

    "cloudy": {
      primary: weatherAnimations.cloud.float,
      secondary: weatherAnimations.cloud.opacity,
      particles: []
    },

    "overcast": {
      primary: weatherAnimations.cloud.float,
      secondary: weatherAnimations.cloud.opacity,
      particles: []
    },

    "light rain": {
      primary: weatherAnimations.cloud.float,
      secondary: weatherAnimations.rain.drop,
      particles: particleAnimations.raindrops(3)
    },

    "moderate rain": {
      primary: weatherAnimations.cloud.float,
      secondary: weatherAnimations.rain.drop,
      particles: particleAnimations.raindrops(6)
    },

    "heavy rain": {
      primary: weatherAnimations.cloud.float,
      secondary: weatherAnimations.rain.drop,
      particles: particleAnimations.raindrops(10)
    },

    "thunderstorm": {
      primary: weatherAnimations.lightning.flash,
      secondary: weatherAnimations.cloud.float,
      particles: particleAnimations.lightning_particles(5)
    },

    "snow": {
      primary: weatherAnimations.cloud.float,
      secondary: weatherAnimations.snow.fall,
      particles: particleAnimations.snowflakes(8)
    },

    "mist": {
      primary: weatherAnimations.fog.wave,
      secondary: weatherAnimations.fog.layer,
      particles: []
    },

    "fog": {
      primary: weatherAnimations.fog.wave,
      secondary: weatherAnimations.fog.layer,
      particles: []
    }
  };

  return animationMap[conditionKey] || animationMap["sunny intervals"];
};

// Responsive animation settings
export const getResponsiveAnimationSettings = (isMobile = false, reduceMotion = false) => {
  if (reduceMotion) {
    return {
      duration: 0,
      repeat: 0,
      animate: false
    };
  }

  if (isMobile) {
    return {
      particleReduction: 0.5,
      durationMultiplier: 1.5,
      intensityReduction: 0.7
    };
  }

  return {
    particleReduction: 1,
    durationMultiplier: 1,
    intensityReduction: 1
  };
};