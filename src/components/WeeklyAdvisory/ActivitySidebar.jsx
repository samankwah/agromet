/**
 * ActivitySidebar Component
 * Displays list of activity stages with navigation
 * Professional slate gradient with green active accent
 */

import React from 'react';
import { FaSeedling, FaTractor, FaSprayCan, FaCut, FaBoxOpen } from 'react-icons/fa';

const ActivitySidebar = ({ activities, currentActivity, onSelectActivity }) => {
  // Map activity names to icons
  const getActivityIcon = (activityName) => {
    const name = activityName.toLowerCase();

    if (name.includes('site') || name.includes('land')) return <FaTractor className="text-green-600" />;
    if (name.includes('plant') || name.includes('sowing')) return <FaSeedling className="text-green-600" />;
    if (name.includes('fertilizer') || name.includes('spray') || name.includes('pest')) return <FaSprayCan className="text-green-600" />;
    if (name.includes('harvest')) return <FaCut className="text-green-600" />;
    if (name.includes('post-harvest') || name.includes('handling')) return <FaBoxOpen className="text-green-600" />;

    return <FaSeedling className="text-green-600" />;
  };

  return (
    <div className="w-80 min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 shadow-lg">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-300 bg-gradient-to-r from-green-500 to-emerald-600">
        <h2 className="text-lg font-bold text-white">List of Activities</h2>
        <p className="text-sm text-green-50 mt-1">Select an activity stage</p>
      </div>

      {/* Activity List */}
      <div className="py-4">
        {activities && activities.length > 0 ? (
          activities.map((activity, index) => {
            const isActive = currentActivity &&
              (currentActivity.id === activity.id ||
               currentActivity.advisory_id === activity.advisory_id);

            return (
              <button
                key={activity.id || activity.advisory_id || index}
                onClick={() => onSelectActivity(activity)}
                className={`
                  w-full px-6 py-4 flex items-center gap-3
                  transition-all duration-300 ease-in-out
                  border-l-4
                  ${isActive
                    ? 'bg-green-50 border-green-500 text-green-700 font-semibold shadow-md'
                    : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-200 hover:border-slate-300'
                  }
                `}
              >
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg
                  transition-all duration-300
                  ${isActive
                    ? 'bg-white shadow-sm'
                    : 'bg-slate-100'
                  }
                `}>
                  {getActivityIcon(activity.activity_stage || activity.name || '')}
                </div>

                {/* Activity Name */}
                <div className="flex-1 text-left">
                  <p className={`
                    text-sm leading-tight
                    ${isActive ? 'font-semibold' : 'font-medium'}
                  `}>
                    {activity.activity_stage || activity.name || `Activity ${index + 1}`}
                  </p>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-slate-500 text-sm">No activities available</p>
            <p className="text-slate-400 text-xs mt-1">Upload weekly advisory data to see activities</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-100 border-t border-slate-200">
        <p className="text-xs text-slate-600 text-center">
          {activities?.length || 0} {activities?.length === 1 ? 'Activity' : 'Activities'} Available
        </p>
      </div>
    </div>
  );
};

export default ActivitySidebar;
