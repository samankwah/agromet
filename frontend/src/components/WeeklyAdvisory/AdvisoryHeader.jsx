import React from 'react';
import { FaMapMarkerAlt, FaCalendarAlt, FaSeedling, FaGlobeAmericas } from 'react-icons/fa';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const num = Number(value);
  if (!isNaN(num) && num > 1 && num < 2958465) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + num * 86400000);
    if (date.getFullYear() >= 2000) {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000) {
    return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return String(value) || 'N/A';
};

const AdvisoryHeader = ({ advisory }) => {
  if (!advisory) return null;

  const metadata = [
    {
      icon: <FaGlobeAmericas className="text-emerald-600" />,
      label: 'Zone',
      value: advisory.zone || 'N/A'
    },
    {
      icon: <FaMapMarkerAlt className="text-emerald-600" />,
      label: 'Region',
      value: advisory.region || 'N/A'
    },
    {
      icon: <FaMapMarkerAlt className="text-emerald-600" />,
      label: 'District',
      value: advisory.district || 'N/A'
    },
    {
      icon: <FaSeedling className="text-emerald-600" />,
      label: 'Commodity',
      value: advisory.crop_type || 'N/A'
    },
    {
      icon: <FaCalendarAlt className="text-emerald-600" />,
      label: 'Month/Year',
      value: advisory.month_year || 'N/A'
    },
    {
      icon: <FaCalendarAlt className="text-emerald-600" />,
      label: 'Weeks',
      value: advisory.weeks_range || `Week ${advisory.week_number || 'N/A'}`
    },
    {
      icon: <FaCalendarAlt className="text-emerald-600" />,
      label: 'Start Date',
      value: formatDate(advisory.start_date)
    },
    {
      icon: <FaCalendarAlt className="text-emerald-600" />,
      label: 'End Date',
      value: formatDate(advisory.end_date)
    }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
      <div className="mb-4 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">
          Activity: <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{advisory.activity_stage || 'N/A'}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metadata.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-emerald-50 rounded-full">
              {item.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate" title={item.value}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvisoryHeader;
