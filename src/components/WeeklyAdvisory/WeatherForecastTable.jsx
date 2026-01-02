/**
 * WeatherForecastTable Component
 * Displays weather forecast table with 9 parameters
 * Dark slate header with cyan weather icons
 */

import React from 'react';
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

const WeatherForecastTable = ({ advisory }) => {
  if (!advisory) return null;

  const weatherParameters = [
    {
      name: 'RAINFALL',
      icon: <FaCloudRain className="text-cyan-400" />,
      forecast: advisory.rainfall_forecast || '-',
      implication: advisory.rainfall_implication || '-'
    },
    {
      name: 'TEMPERATURE',
      icon: <FaTemperatureHigh className="text-cyan-400" />,
      forecast: advisory.temperature_forecast || '-',
      implication: advisory.temperature_implication || '-'
    },
    {
      name: 'HUMIDITY',
      icon: <FaTint className="text-cyan-400" />,
      forecast: advisory.humidity_forecast || '-',
      implication: advisory.humidity_implication || '-'
    },
    {
      name: 'SOIL MOISTURE',
      icon: <FaSeedling className="text-cyan-400" />,
      forecast: advisory.soil_moisture_forecast || '-',
      implication: advisory.soil_moisture_implication || '-'
    },
    {
      name: 'SOIL TEMPERATURE',
      icon: <FaThermometerHalf className="text-cyan-400" />,
      forecast: advisory.soil_temperature_forecast || '-',
      implication: advisory.soil_temperature_implication || '-'
    },
    {
      name: 'SUNSHINE INTENSITY',
      icon: <FaSun className="text-cyan-400" />,
      forecast: advisory.sunshine_forecast || '-',
      implication: advisory.sunshine_implication || '-'
    },
    {
      name: 'SUNRISE',
      icon: <FaCloudSun className="text-cyan-400" />,
      forecast: advisory.sunrise_forecast || '-',
      implication: advisory.sunrise_implication || '-'
    },
    {
      name: 'SUNSET',
      icon: <FaMoon className="text-cyan-400" />,
      forecast: advisory.sunset_forecast || '-',
      implication: advisory.sunset_implication || '-'
    },
    {
      name: 'EVAPOTRANSPIRATION',
      icon: <FaWind className="text-cyan-400" />,
      forecast: advisory.evapotranspiration_forecast || '-',
      implication: advisory.evapotranspiration_implication || '-'
    }
  ];

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-slate-800 to-slate-900 rounded-full"></div>
        <h3 className="text-lg font-bold text-slate-800">Detailed Forecast</h3>
      </div>

      {/* Weather Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg border border-slate-300">
        <table className="min-w-full bg-white">
          {/* Header Row */}
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700">
                Parameter
              </th>
              {weatherParameters.map((param, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700 last:border-r-0"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl">{param.icon}</div>
                    <span className="leading-tight">{param.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody>
            {/* FORECAST Row */}
            <tr className="bg-white hover:bg-slate-50 transition-colors duration-200">
              <td className="px-4 py-4 text-sm font-bold text-slate-900 uppercase border-r border-slate-200 bg-slate-100">
                FORECAST
              </td>
              {weatherParameters.map((param, index) => (
                <td
                  key={index}
                  className="px-4 py-4 text-sm text-slate-900 text-center border-r border-slate-200 last:border-r-0"
                >
                  <div className="font-medium leading-relaxed">
                    {param.forecast}
                  </div>
                </td>
              ))}
            </tr>

            {/* IMPLICATIONS Row */}
            <tr className="bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
              <td className="px-4 py-4 text-sm font-bold text-slate-900 uppercase border-r border-slate-200 bg-slate-100">
                IMPLICATIONS
              </td>
              {weatherParameters.map((param, index) => (
                <td
                  key={index}
                  className="px-4 py-4 text-sm text-slate-700 text-center border-r border-slate-200 last:border-r-0"
                >
                  <div className="leading-relaxed">
                    {param.implication}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeatherForecastTable;
