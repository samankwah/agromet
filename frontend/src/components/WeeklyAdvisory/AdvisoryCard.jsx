/**
 * AdvisoryCard Component
 * Individual advisory card for each weather parameter
 * White background with parameter-specific color accents and hover effects
 */

import React from 'react';

const AdvisoryCard = ({ title, icon, advisory, accentColor = 'green' }) => {
  const colorClasses = {
    blue: {
      header: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600'
    },
    orange: {
      header: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-600'
    },
    cyan: {
      header: 'from-cyan-500 to-cyan-600',
      iconBg: 'bg-cyan-100',
      iconText: 'text-cyan-600'
    },
    brown: {
      header: 'from-amber-700 to-amber-800',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-700'
    },
    red: {
      header: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600'
    },
    yellow: {
      header: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600'
    },
    pink: {
      header: 'from-pink-500 to-pink-600',
      iconBg: 'bg-pink-100',
      iconText: 'text-pink-600'
    },
    purple: {
      header: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600'
    },
    teal: {
      header: 'from-teal-500 to-teal-600',
      iconBg: 'bg-teal-100',
      iconText: 'text-teal-600'
    },
    green: {
      header: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600'
    }
  };

  const colors = colorClasses[accentColor] || colorClasses.green;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Card Header */}
      <div className={`bg-gradient-to-r ${colors.header} px-4 py-3`}>
        <h4 className="text-white font-bold text-sm uppercase tracking-wide text-center">
          {title}
        </h4>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`${colors.iconBg} w-16 h-16 rounded-full flex items-center justify-center shadow-md`}>
            <div className={`${colors.iconText} text-3xl`}>
              {icon}
            </div>
          </div>
        </div>

        {/* Advisory Text */}
        <div className="flex-1">
          {advisory && advisory.trim() !== '-' && advisory.trim() !== '' ? (
            <p className="text-slate-700 text-sm leading-relaxed text-center">
              {advisory}
            </p>
          ) : (
            <p className="text-slate-400 text-sm italic text-center">
              No specific advisory for this parameter
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisoryCard;
