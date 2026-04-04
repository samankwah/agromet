import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import {
  FaSun,
  FaCloud,
  FaCloudRain,
  FaBolt,
  FaSnowflake,
  FaEye,
  FaCloudSun,
  FaWind
} from "react-icons/fa";
import { getWeatherTheme } from "../utils/weatherThemes";
import { getResponsiveAnimationSettings } from "../utils/weatherAnimations";

// Enhanced animated weather icon component
const AnimatedWeatherIcon = ({
  condition,
  size = "4xl",
  showParticles = true,
  interactive = true,
  temperature = null,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Detect mobile and motion preferences
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const checkMotion = () => setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    checkMobile();
    checkMotion();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get theme and animation settings with error handling
  const theme = useMemo(() => {
    try {
      return getWeatherTheme(condition);
    } catch (error) {
      console.error("Error getting weather theme:", error);
      return {
        primary: "#FFD700",
        gradient: "from-yellow-400 to-orange-400",
        glow: "shadow-yellow-300/50"
      };
    }
  }, [condition]);

  const responsiveSettings = useMemo(() => {
    try {
      return getResponsiveAnimationSettings(isMobile, reduceMotion);
    } catch (error) {
      console.error("Error getting responsive settings:", error);
      return {
        particleReduction: 1,
        durationMultiplier: 1,
        intensityReduction: 1
      };
    }
  }, [isMobile, reduceMotion]);

  // Icon mapping with enhanced animations
  const iconMap = {
    "clear sky": {
      icon: FaSun,
      bgColor: theme.gradient,
      particles: "sparkles"
    },
    "sunny": {
      icon: FaSun,
      bgColor: theme.gradient,
      particles: "sparkles"
    },
    "sunny intervals": {
      icon: FaCloudSun,
      bgColor: theme.gradient,
      particles: "light-sparkles"
    },
    "partly cloudy": {
      icon: FaCloudSun,
      bgColor: theme.gradient,
      particles: "none"
    },
    "cloudy": {
      icon: FaCloud,
      bgColor: theme.gradient,
      particles: "none"
    },
    "overcast": {
      icon: FaCloud,
      bgColor: theme.gradient,
      particles: "none"
    },
    "light rain": {
      icon: FaCloudRain,
      bgColor: theme.gradient,
      particles: "rain"
    },
    "moderate rain": {
      icon: FaCloudRain,
      bgColor: theme.gradient,
      particles: "rain"
    },
    "heavy rain": {
      icon: FaCloudRain,
      bgColor: theme.gradient,
      particles: "heavy-rain"
    },
    "thunderstorm": {
      icon: FaBolt,
      bgColor: theme.gradient,
      particles: "lightning"
    },
    "snow": {
      icon: FaSnowflake,
      bgColor: theme.gradient,
      particles: "snow"
    },
    "mist": {
      icon: FaEye,
      bgColor: theme.gradient,
      particles: "fog"
    },
    "fog": {
      icon: FaEye,
      bgColor: theme.gradient,
      particles: "fog"
    },
    "windy": {
      icon: FaWind,
      bgColor: theme.gradient,
      particles: "wind"
    }
  };

  const conditionKey = condition.toLowerCase();
  const iconConfig = iconMap[conditionKey] || iconMap["sunny intervals"];
  const IconComponent = iconConfig.icon;

  // Particle components
  const RainParticles = ({ count = 5 }) => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: Math.floor(count * responsiveSettings.particleReduction) }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-3 bg-blue-400 opacity-60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px"
          }}
          animate={{
            y: [0, 80],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.8 * responsiveSettings.durationMultiplier,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );

  const SnowParticles = ({ count = 6 }) => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: Math.floor(count * responsiveSettings.particleReduction) }, (_, i) => (
        <motion.div
          key={i}
          className="absolute text-white text-xs opacity-80"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px"
          }}
          animate={{
            y: [0, 80],
            x: [0, Math.random() * 20 - 10],
            rotate: [0, 360],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2.5 * responsiveSettings.durationMultiplier,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "linear"
          }}
        >
          ❄
        </motion.div>
      ))}
    </div>
  );

  const SparkleParticles = ({ count = 4 }) => (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: Math.floor(count * responsiveSettings.particleReduction) }, (_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-300 text-xs"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180]
          }}
          transition={{
            duration: 1.5 * responsiveSettings.durationMultiplier,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut"
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );

  const LightningParticles = () => (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0 bg-yellow-300 opacity-20 rounded-full"
        animate={{
          opacity: [0, 0.4, 0, 0.4, 0]
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      />
    </div>
  );

  const FogParticles = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
      {Array.from({ length: 3 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 bg-gray-300 opacity-40 rounded-full"
          style={{
            width: `${60 + Math.random() * 40}%`,
            left: `${Math.random() * 20}%`,
            top: `${20 + i * 20}%`
          }}
          animate={{
            x: [0, 15, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );

  // Render particles based on weather condition
  const renderParticles = () => {
    if (!showParticles || reduceMotion) return null;

    switch (iconConfig.particles) {
      case "rain":
        return <RainParticles count={3} />;
      case "heavy-rain":
        return <RainParticles count={8} />;
      case "snow":
        return <SnowParticles count={6} />;
      case "sparkles":
        return <SparkleParticles count={4} />;
      case "light-sparkles":
        return <SparkleParticles count={2} />;
      case "lightning":
        return <LightningParticles />;
      case "fog":
        return <FogParticles />;
      default:
        return null;
    }
  };

  // Main icon animations
  const getIconAnimation = () => {
    if (reduceMotion) return {};

    const baseAnimation = {
      scale: isHovered ? 1.1 : 1,
      transition: { duration: 0.3 }
    };

    switch (conditionKey) {
      case "clear sky":
      case "sunny":
        return {
          ...baseAnimation,
          rotate: [0, 360],
          transition: {
            ...baseAnimation.transition,
            rotate: {
              duration: 20 * responsiveSettings.durationMultiplier,
              repeat: Infinity,
              ease: "linear"
            }
          }
        };

      case "partly cloudy":
      case "cloudy":
      case "overcast":
        return {
          ...baseAnimation,
          y: [0, -8, 0],
          transition: {
            ...baseAnimation.transition,
            y: {
              duration: 4 * responsiveSettings.durationMultiplier,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        };

      case "thunderstorm":
        return {
          ...baseAnimation,
          scale: isHovered ? 1.2 : [1, 1.1, 1],
          transition: {
            ...baseAnimation.transition,
            scale: {
              duration: 0.3,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut"
            }
          }
        };

      case "snow":
        return {
          ...baseAnimation,
          rotate: [0, 10, -10, 0],
          transition: {
            ...baseAnimation.transition,
            rotate: {
              duration: 3 * responsiveSettings.durationMultiplier,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        };

      default:
        return baseAnimation;
    }
  };

  const sizeClasses = {
    "sm": "text-sm w-8 h-8",
    "md": "text-base w-12 h-12",
    "lg": "text-lg w-16 h-16",
    "xl": "text-xl w-20 h-20",
    "2xl": "text-2xl w-24 h-24",
    "3xl": "text-3xl w-28 h-28",
    "4xl": "text-4xl w-32 h-32",
    "5xl": "text-5xl w-36 h-36"
  };

  return (
    <div
      className={`relative inline-block ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {/* Main weather icon */}
      <motion.div
        className="relative z-10 flex items-center justify-center w-full h-full"
        animate={getIconAnimation()}
      >
        <IconComponent
          className={`drop-shadow-lg ${theme.glow}`}
          style={{ color: theme.primary, fontSize: '60px', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}
        />
      </motion.div>

      {/* Particles and effects */}
      <AnimatePresence>
        {renderParticles()}
      </AnimatePresence>


      {/* Temperature indicator overlay */}
      {temperature && (
        <div className="absolute -bottom-2 -right-2 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-semibold text-gray-800 shadow-lg">
          {temperature}°
        </div>
      )}
    </div>
  );
};


// Main component PropTypes
AnimatedWeatherIcon.propTypes = {
  condition: PropTypes.string.isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"]),
  showParticles: PropTypes.bool,
  interactive: PropTypes.bool,
  temperature: PropTypes.number,
  className: PropTypes.string
};

export default AnimatedWeatherIcon;