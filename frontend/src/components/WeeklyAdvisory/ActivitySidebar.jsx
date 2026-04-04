/**
 * ActivitySidebar Component
 * Desktop (lg+): Sticky vertical sidebar with compact spacing
 * Mobile/Tablet (<lg): Horizontal scrollable pill strip
 */

import React from 'react';
import { FaSeedling, FaTractor, FaSprayCan, FaCut, FaBoxOpen } from 'react-icons/fa';

const ActivitySidebar = ({ activities, currentActivity, onSelectActivity, variant }) => {
  const getActivityIcon = (activityName) => {
    const name = (activityName || '').toLowerCase();
    if (name.includes('site') || name.includes('land')) return <FaTractor />;
    if (name.includes('plant') || name.includes('sowing')) return <FaSeedling />;
    if (name.includes('fertilizer') || name.includes('spray') || name.includes('pest')) return <FaSprayCan />;
    if (name.includes('harvest')) return <FaCut />;
    if (name.includes('post-harvest') || name.includes('handling')) return <FaBoxOpen />;
    return <FaSeedling />;
  };

  const isActiveItem = (activity) => {
    const currentName = currentActivity?.activity_stage || currentActivity?.name || '';
    const activityName = activity.activity_stage || activity.name || '';
    return !!(currentName && activityName && currentName === activityName);
  };

  const getName = (activity, index) =>
    activity.activity_stage || activity.name || `Activity ${index + 1}`;

  if (!activities?.length) return null;

  // Mobile horizontal strip
  if (variant === 'mobile') {
    return (
      <div className="mb-4">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-lg px-4 py-2.5">
          <h2 className="text-sm font-bold text-white">Activities</h2>
        </div>
        <div className="flex overflow-x-auto gap-2 p-2.5 bg-slate-50 border border-t-0 border-gray-200 rounded-b-lg">
          {activities.map((activity, index) => {
            const active = isActiveItem(activity);
            return (
              <button
                key={activity.id || activity.advisory_id || index}
                onClick={() => onSelectActivity(activity)}
                className={`
                  flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                  transition-all duration-200 border whitespace-nowrap
                  ${active
                    ? 'bg-green-600 text-white border-green-600 shadow-sm [&_svg]:text-white'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-green-400 hover:bg-green-50 [&_svg]:text-green-600'
                  }
                `}
              >
                {getActivityIcon(getName(activity, index))}
                <span>{getName(activity, index)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop sticky vertical sidebar
  return (
    <div className="w-80 flex-shrink-0 sticky top-24 self-start bg-gradient-to-b from-slate-50 to-slate-100 border border-gray-200 rounded-l-lg shadow-lg max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="p-4 border-b border-slate-300 bg-gradient-to-r from-green-500 to-emerald-600">
        <h2 className="text-base font-bold text-white">List of Activities</h2>
        <p className="text-xs text-green-50 mt-0.5">Select an activity stage</p>
      </div>

      <div className="py-1">
        {activities.map((activity, index) => {
          const active = isActiveItem(activity);
          return (
            <button
              key={activity.id || activity.advisory_id || index}
              onClick={() => onSelectActivity(activity)}
              className={`
                w-full px-4 py-2.5 flex items-center gap-2.5
                transition-all duration-200 border-l-4
                ${active
                  ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                  : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-200 hover:border-slate-300'
                }
              `}
            >
              <div className={`
                flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200
                ${active ? 'bg-white shadow-sm [&_svg]:text-green-600' : 'bg-slate-100 [&_svg]:text-green-600'}
              `}>
                {getActivityIcon(getName(activity, index))}
              </div>
              <p className={`flex-1 text-left text-sm leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {getName(activity, index)}
              </p>
              {active && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default ActivitySidebar;
