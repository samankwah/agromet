/**
 * AdvisoryGrid Component
 * Grid layout for advisory cards (3 columns desktop, 1 mobile)
 * Displays advisory for each of the 9 weather parameters
 */

import React from 'react';
import AdvisoryCard from './AdvisoryCard';
import {
  FaCloudRain,
  FaTemperatureHigh,
  FaTint,
  FaSeedling,
  FaThermometerHalf,
  FaSun,
  FaCloudSun,
  FaMoon,
  FaWind
} from 'react-icons/fa';

const AdvisoryGrid = ({ advisory }) => {
  if (!advisory) return null;

  const advisories = [
    {
      title: 'Rainfall Advisory',
      icon: <FaCloudRain />,
      advisory: advisory.rainfall_advisory,
      accentColor: 'blue'
    },
    {
      title: 'Temperature Advisory',
      icon: <FaTemperatureHigh />,
      advisory: advisory.temperature_advisory,
      accentColor: 'orange'
    },
    {
      title: 'Humidity Advisory',
      icon: <FaTint />,
      advisory: advisory.humidity_advisory,
      accentColor: 'cyan'
    },
    {
      title: 'Soil Moisture Advisory',
      icon: <FaSeedling />,
      advisory: advisory.soil_moisture_advisory,
      accentColor: 'brown'
    },
    {
      title: 'Soil Temperature Advisory',
      icon: <FaThermometerHalf />,
      advisory: advisory.soil_temperature_advisory,
      accentColor: 'red'
    },
    {
      title: 'Sunshine Advisory',
      icon: <FaSun />,
      advisory: advisory.sunshine_advisory,
      accentColor: 'yellow'
    },
    {
      title: 'Sunrise Advisory',
      icon: <FaCloudSun />,
      advisory: advisory.sunrise_advisory,
      accentColor: 'pink'
    },
    {
      title: 'Sunset Advisory',
      icon: <FaMoon />,
      advisory: advisory.sunset_advisory,
      accentColor: 'purple'
    },
    {
      title: 'Evapotranspiration Advisory',
      icon: <FaWind />,
      advisory: advisory.evapotranspiration_advisory,
      accentColor: 'teal'
    }
  ];

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="mb-5 flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
        <h3 className="text-lg font-bold text-slate-800">Advisory</h3>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advisories.map((item, index) => (
          <AdvisoryCard
            key={index}
            title={item.title}
            icon={item.icon}
            advisory={item.advisory}
            accentColor={item.accentColor}
          />
        ))}
      </div>
    </div>
  );
};

export default AdvisoryGrid;
