/**
 * SummarySection Component
 * Displays overall summary with emerald gradient
 * Professional, spacious layout with green glow shadow
 */

import React from 'react';
import { FaFileAlt, FaInfoCircle } from 'react-icons/fa';

const SummarySection = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-300/60 rounded-xl shadow-lg shadow-emerald-200/50 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-emerald-200">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <FaFileAlt className="text-emerald-600 text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-emerald-800 uppercase tracking-wide">
              Forecast and Advisory
            </h3>
            <p className="text-sm text-emerald-600 mt-0.5">
              Overall Summary Weather Outlook & Advisory
            </p>
          </div>
        </div>

        {/* Summary Content */}
        <div className="bg-white/60 rounded-lg p-5 border border-emerald-200/60">
          {summary && summary.trim() !== '' && summary.trim() !== '-' ? (
            <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600">
              <FaInfoCircle />
              <p className="text-sm italic">
                No overall summary available for this advisory
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-4 flex items-start gap-2 text-emerald-700">
          <FaInfoCircle className="flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            This summary combines weather forecasts with actionable farming recommendations
            for the specified activity stage and period.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
