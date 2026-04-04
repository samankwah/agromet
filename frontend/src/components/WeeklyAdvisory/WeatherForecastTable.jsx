/**
 * WeatherForecastTable Component
 * Displays weather forecast table with 9 parameters
 * Three rows: Forecast, Implications, Advisory
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

// Format forecast cell value based on parameter type
const formatForecastValue = (value, paramName) => {
  if (!value || value === '-') return value;
  const upper = (paramName || '').toUpperCase();

  // Excel time fraction → readable time for sunrise/sunset
  if (upper === 'SUNRISE' || upper === 'SUNSET') {
    const num = Number(value);
    if (!isNaN(num) && num > 0 && num < 1) {
      const totalMinutes = Math.round(num * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const period = hours < 12 ? 'AM' : 'PM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
    }
    return value;
  }

  // Excel decimal → percentage for humidity
  if (upper === 'HUMIDITY' && !value.includes('%')) {
    const num = Number(value);
    if (!isNaN(num) && num > 0 && num <= 1) {
      return `${Math.round(num * 100)}%`;
    }
    return value;
  }

  // Fix temperature unit: OC → °C
  if (upper === 'TEMP' || upper === 'TEMPERATURE') {
    return value.replace(/(\d)\s*OC\b/gi, '$1°C');
  }

  return value;
};

const WeatherForecastTable = ({ advisory, activityData }) => {
  if (!advisory && !activityData) return null;

  // If we have structured activityData (from new parser), use it
  if (activityData && activityData.weatherParameters) {
    const params = activityData.weatherParameters;
    const iconMap = {
      'RAINFALL': <FaCloudRain className="text-cyan-400" />,
      'TEMP': <FaTemperatureHigh className="text-cyan-400" />,
      'TEMPERATURE': <FaTemperatureHigh className="text-cyan-400" />,
      'HUMIDITY': <FaTint className="text-cyan-400" />,
      'SOIL MOISTURE': <FaSeedling className="text-cyan-400" />,
      'SOIL TEMP': <FaThermometerHalf className="text-cyan-400" />,
      'SOIL TEMPERATURE': <FaThermometerHalf className="text-cyan-400" />,
      'SUNSHINE INTENSITY': <FaSun className="text-cyan-400" />,
      'SUNSHINE': <FaSun className="text-cyan-400" />,
      'SUNRISE': <FaCloudSun className="text-cyan-400" />,
      'SUNSET': <FaMoon className="text-cyan-400" />,
      'EVAPO-TRANSP.': <FaWind className="text-cyan-400" />,
      'EVAPOTRANSPIRATION': <FaWind className="text-cyan-400" />,
    };

    return (
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-slate-800 to-slate-900 rounded-full"></div>
          <h3 className="text-lg font-bold text-slate-800">Detailed Forecast</h3>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-lg border border-slate-300">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700 min-w-[120px]">
                  Parameter
                </th>
                {params.map((param, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700 last:border-r-0 min-w-[140px]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-2xl">{iconMap[param.toUpperCase()] || <FaSun className="text-cyan-400" />}</div>
                      <span className="leading-tight">{param}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* FORECAST Row */}
              <tr className="bg-white hover:bg-slate-50 transition-colors duration-200">
                <td className="px-4 py-4 text-sm font-bold text-slate-900 uppercase border-r border-slate-200 bg-slate-100">
                  FORECAST
                </td>
                {params.map((param, index) => (
                  <td key={index} className="px-4 py-4 text-sm text-slate-900 text-center border-r border-slate-200 last:border-r-0">
                    <div className="font-medium leading-relaxed">
                      {formatForecastValue(activityData.forecast?.[param] || '-', param)}
                    </div>
                  </td>
                ))}
              </tr>

              {/* IMPLICATIONS Row */}
              <tr className="bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
                <td className="px-4 py-4 text-sm font-bold text-slate-900 uppercase border-r border-slate-200 bg-slate-100">
                  IMPLICATIONS
                </td>
                {params.map((param, index) => (
                  <td key={index} className="px-4 py-4 text-sm text-slate-700 text-center border-r border-slate-200 last:border-r-0">
                    <div className="leading-relaxed">
                      {activityData.implication?.[param] || '-'}
                    </div>
                  </td>
                ))}
              </tr>

              {/* ADVISORY Row */}
              <tr className="bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200">
                <td className="px-4 py-4 text-sm font-bold text-emerald-900 uppercase border-r border-slate-200 bg-emerald-100">
                  ADVISORY
                </td>
                {params.map((param, index) => (
                  <td key={index} className="px-4 py-4 text-sm text-emerald-800 text-center border-r border-slate-200 last:border-r-0">
                    <div className="leading-relaxed">
                      {activityData.advisory?.[param] || '-'}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: legacy format with flat advisory fields
  const weatherParameters = [
    {
      name: 'RAINFALL',
      icon: <FaCloudRain className="text-cyan-400" />,
      forecast: advisory.rainfall_forecast || '-',
      implication: advisory.rainfall_implication || '-',
      advisoryText: advisory.rainfall_advisory || '-'
    },
    {
      name: 'TEMPERATURE',
      icon: <FaTemperatureHigh className="text-cyan-400" />,
      forecast: advisory.temperature_forecast || '-',
      implication: advisory.temperature_implication || '-',
      advisoryText: advisory.temperature_advisory || '-'
    },
    {
      name: 'HUMIDITY',
      icon: <FaTint className="text-cyan-400" />,
      forecast: advisory.humidity_forecast || '-',
      implication: advisory.humidity_implication || '-',
      advisoryText: advisory.humidity_advisory || '-'
    },
    {
      name: 'SOIL MOISTURE',
      icon: <FaSeedling className="text-cyan-400" />,
      forecast: advisory.soil_moisture_forecast || '-',
      implication: advisory.soil_moisture_implication || '-',
      advisoryText: advisory.soil_moisture_advisory || '-'
    },
    {
      name: 'SOIL TEMPERATURE',
      icon: <FaThermometerHalf className="text-cyan-400" />,
      forecast: advisory.soil_temperature_forecast || '-',
      implication: advisory.soil_temperature_implication || '-',
      advisoryText: advisory.soil_temperature_advisory || '-'
    },
    {
      name: 'SUNSHINE INTENSITY',
      icon: <FaSun className="text-cyan-400" />,
      forecast: advisory.sunshine_forecast || '-',
      implication: advisory.sunshine_implication || '-',
      advisoryText: advisory.sunshine_advisory || '-'
    },
    {
      name: 'SUNRISE',
      icon: <FaCloudSun className="text-cyan-400" />,
      forecast: advisory.sunrise_forecast || '-',
      implication: advisory.sunrise_implication || '-',
      advisoryText: advisory.sunrise_advisory || '-'
    },
    {
      name: 'SUNSET',
      icon: <FaMoon className="text-cyan-400" />,
      forecast: advisory.sunset_forecast || '-',
      implication: advisory.sunset_implication || '-',
      advisoryText: advisory.sunset_advisory || '-'
    },
    {
      name: 'EVAPOTRANSPIRATION',
      icon: <FaWind className="text-cyan-400" />,
      forecast: advisory.evapotranspiration_forecast || '-',
      implication: advisory.evapotranspiration_implication || '-',
      advisoryText: advisory.evapotranspiration_advisory || '-'
    }
  ];

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-slate-800 to-slate-900 rounded-full"></div>
        <h3 className="text-lg font-bold text-slate-800">Detailed Forecast</h3>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-lg border border-slate-300">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700 min-w-[120px]">
                Parameter
              </th>
              {weatherParameters.map((param, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-700 last:border-r-0 min-w-[140px]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl">{param.icon}</div>
                    <span className="leading-tight">{param.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white hover:bg-slate-50 transition-colors duration-200">
              <td className="px-4 py-4 text-sm font-bold text-slate-900 uppercase border-r border-slate-200 bg-slate-100">
                FORECAST
              </td>
              {weatherParameters.map((param, index) => (
                <td key={index} className="px-4 py-4 text-sm text-slate-900 text-center border-r border-slate-200 last:border-r-0">
                  <div className="font-medium leading-relaxed">{param.forecast}</div>
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
              <td className="px-4 py-4 text-sm font-bold text-slate-900 uppercase border-r border-slate-200 bg-slate-100">
                IMPLICATIONS
              </td>
              {weatherParameters.map((param, index) => (
                <td key={index} className="px-4 py-4 text-sm text-slate-700 text-center border-r border-slate-200 last:border-r-0">
                  <div className="leading-relaxed">{param.implication}</div>
                </td>
              ))}
            </tr>
            <tr className="bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200">
              <td className="px-4 py-4 text-sm font-bold text-emerald-900 uppercase border-r border-slate-200 bg-emerald-100">
                ADVISORY
              </td>
              {weatherParameters.map((param, index) => (
                <td key={index} className="px-4 py-4 text-sm text-emerald-800 text-center border-r border-slate-200 last:border-r-0">
                  <div className="leading-relaxed">{param.advisoryText}</div>
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
