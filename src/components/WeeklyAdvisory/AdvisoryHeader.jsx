/**
 * AdvisoryHeader Component
 * Displays advisory metadata in a warm amber/orange gradient
 * Professional, clean layout with proper spacing
 */

import React from 'react';
import { FaMapMarkerAlt, FaCalendarAlt, FaSeedling, FaGlobeAmericas } from 'react-icons/fa';

const AdvisoryHeader = ({ advisory }) => {
  if (!advisory) return null;

  const metadata = [
    {
      icon: <FaGlobeAmericas className="text-amber-600" />,
      label: 'Zone',
      value: advisory.zone || 'N/A'
    },
    {
      icon: <FaMapMarkerAlt className="text-amber-600" />,
      label: 'Region',
      value: advisory.region || 'N/A'
    },
    {
      icon: <FaMapMarkerAlt className="text-amber-600" />,
      label: 'District',
      value: advisory.district || 'N/A'
    },
    {
      icon: <FaSeedling className="text-amber-600" />,
      label: 'Commodity',
      value: advisory.crop_type || 'N/A'
    },
    {
      icon: <FaCalendarAlt className="text-amber-600" />,
      label: 'Month/Year',
      value: advisory.month_year || 'N/A'
    },
    {
      icon: <FaCalendarAlt className="text-amber-600" />,
      label: 'Weeks',
      value: advisory.weeks_range || `Week ${advisory.week_number || 'N/A'}`
    },
    {
      icon: <FaCalendarAlt className="text-amber-600" />,
      label: 'Start Date',
      value: advisory.start_date ? new Date(advisory.start_date).toLocaleDateString() : 'N/A'
    },
    {
      icon: <FaCalendarAlt className="text-amber-600" />,
      label: 'End Date',
      value: advisory.end_date ? new Date(advisory.end_date).toLocaleDateString() : 'N/A'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300/50 rounded-xl shadow-md p-6 mb-6">
      {/* Activity Title */}
      <div className="mb-4 pb-4 border-b border-amber-200">
        <h2 className="text-2xl font-bold text-amber-900">
          Activity: <span className="text-amber-700">{advisory.activity_stage || 'N/A'}</span>
        </h2>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metadata.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-amber-200/60 hover:bg-white/80 transition-all duration-200"
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-100 rounded-full">
              {item.icon}
            </div>

            {/* Label and Value */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">
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
