/**
 * SMSSection Component
 * Displays SMS preview with sky blue gradient
 * Monospace font for SMS text, preview badge
 */

import React from 'react';
import { FaSms, FaMobileAlt, FaCopy } from 'react-icons/fa';

const SMSSection = ({ smsText }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (smsText && smsText.trim() !== '' && smsText.trim() !== '-') {
      navigator.clipboard.writeText(smsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!smsText) return null;

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-300/60 rounded-lg shadow-md shadow-sky-200/50 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-sky-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <FaSms className="text-sky-600 text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-sky-800 uppercase tracking-wide">
                SMS/TEXT
              </h3>
              <p className="text-xs text-sky-600 mt-0.5 flex items-center gap-1">
                <FaMobileAlt className="text-xs" />
                <span>Mobile Advisory Preview</span>
              </p>
            </div>
          </div>

          {/* Copy Button */}
          {smsText && smsText.trim() !== '' && smsText.trim() !== '-' && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm"
              title="Copy SMS text to clipboard"
            >
              <FaCopy />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>

        {/* SMS Preview Badge */}
        <div className="inline-flex items-center px-3 py-1 bg-sky-600 text-white text-xs font-semibold rounded-full mb-3">
          SMS Preview
        </div>

        {/* SMS Text */}
        <div className="bg-white rounded-lg p-4 border border-sky-200 shadow-sm">
          {smsText && smsText.trim() !== '' && smsText.trim() !== '-' ? (
            <p className="text-sm text-slate-700 font-mono leading-relaxed">
              {smsText}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No SMS text available for this advisory
            </p>
          )}
        </div>

        {/* Character Count */}
        {smsText && smsText.trim() !== '' && smsText.trim() !== '-' && (
          <div className="mt-3 flex items-center justify-between text-xs text-sky-700">
            <span>Character count: {smsText.length}</span>
            <span>
              SMS segments: {Math.ceil(smsText.length / 160)}
              {smsText.length > 160 && ' (multi-part)'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSSection;
