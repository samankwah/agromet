import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  FaCalendarAlt,
  FaCloudSun,
  FaSeedling,
  FaUsers,
  FaFileAlt,
  FaChartBar,
  FaMapMarkedAlt,
  FaLeaf,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrendUp,
  FaArrowUp,
  FaArrowDown,
  FaExternalLinkAlt
} from "react-icons/fa";
import userService from "../../services/userService";

const DashboardStats = ({ agriculturalStats, recentUploads, onNavigate }) => {
  const [trendData, setTrendData] = useState({});
  const [activityData, setActivityData] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendData();
    loadActivityData();
    loadHealthMetrics();
  }, [agriculturalStats]);

  const loadTrendData = async () => {
    try {
      // Calculate trends from the last 30 days vs previous 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const trends = {};
      const dataTypes = ['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory'];

      for (const type of dataTypes) {
        try {
          const result = await userService.getAgriculturalData(type);
          if (result.success && result.data) {
            const recent = result.data.filter(item => 
              new Date(item.createdAt || item.uploadDate) > thirtyDaysAgo
            ).length;

            const previous = result.data.filter(item => {
              const date = new Date(item.createdAt || item.uploadDate);
              return date > sixtyDaysAgo && date <= thirtyDaysAgo;
            }).length;

            const change = previous > 0 ? ((recent - previous) / previous) * 100 : recent > 0 ? 100 : 0;
            trends[type] = { recent, previous, change };
          }
        } catch (err) {
          console.warn(`Failed to load trend data for ${type}:`, err);
        }
      }

      setTrendData(trends);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    }
  };

  const loadActivityData = () => {
    if (!recentUploads || recentUploads.length === 0) return;

    // Group uploads by date
    const groupedByDate = {};
    recentUploads.forEach(upload => {
      const date = new Date(upload.uploadDate).toDateString();
      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          count: 0,
          records: 0,
          types: new Set()
        };
      }
      groupedByDate[date].count++;
      groupedByDate[date].records += upload.recordCount || 0;
      groupedByDate[date].types.add(upload.type);
    });

    const activity = Object.values(groupedByDate)
      .map(day => ({
        ...day,
        types: Array.from(day.types)
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7);

    setActivityData(activity);
  };

  const loadHealthMetrics = async () => {
    try {
      const dataTypes = ['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory'];
      const metrics = {
        totalRecords: 0,
        completeRecords: 0,
        recentlyUpdated: 0,
        withLocation: 0,
        dataQuality: 0,
        regionCoverage: 0
      };

      const allRegions = new Set();
      const ghanaRegionsCount = 16; // Total regions in Ghana

      for (const type of dataTypes) {
        try {
          const result = await userService.getAgriculturalData(type);
          if (result.success && result.data) {
            const data = result.data;
            metrics.totalRecords += data.length;

            data.forEach(item => {
              // Count complete records (more than half fields filled)
              const filledFields = Object.values(item).filter(val => 
                val !== null && val !== undefined && val !== ''
              ).length;
              const totalFields = Object.keys(item).length;
              if (filledFields > totalFields / 2) {
                metrics.completeRecords++;
              }

              // Count recently updated (last 30 days)
              const lastUpdate = new Date(item.lastUpdated || item.createdAt || 0);
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              if (lastUpdate > thirtyDaysAgo) {
                metrics.recentlyUpdated++;
              }

              // Count records with location
              if (item.region && item.district) {
                metrics.withLocation++;
                allRegions.add(item.region);
              }
            });
          }
        } catch (err) {
          console.warn(`Failed to load health metrics for ${type}:`, err);
        }
      }

      metrics.dataQuality = metrics.totalRecords > 0 
        ? Math.round((metrics.completeRecords / metrics.totalRecords) * 100) 
        : 0;
      
      metrics.regionCoverage = Math.round((allRegions.size / ghanaRegionsCount) * 100);

      setHealthMetrics(metrics);
    } catch (error) {
      console.error('Failed to load health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title, value, icon, color, trend, onClick) => (
    <div 
      className={`bg-gradient-to-r ${color} rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.change >= 0 ? (
                <FaArrowUp className="mr-1 text-xs" />
              ) : (
                <FaArrowDown className="mr-1 text-xs" />
              )}
              <span className="text-xs font-medium">
                {Math.abs(trend.change).toFixed(1)}% vs last month
              </span>
            </div>
          )}
        </div>
        <div className="text-4xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );

  const renderMetricCard = (title, value, icon, subtitle, status = 'good') => (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl text-gray-400">{icon}</div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'good' ? 'bg-green-100 text-green-800' :
          status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status === 'good' ? <FaCheckCircle className="inline mr-1" /> : 
           <FaExclamationTriangle className="inline mr-1" />}
          {status.toUpperCase()}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard(
          "Crop Calendars",
          agriculturalStats?.cropCalendars?.total || 0,
          <FaCalendarAlt />,
          "from-green-400 to-green-600",
          trendData['crop-calendar'],
          () => onNavigate("content-management-crop-calendar")
        )}
        
        {renderStatCard(
          "Agromet Advisories", 
          agriculturalStats?.agrometAdvisories?.total || 0,
          <FaCloudSun />,
          "from-blue-400 to-blue-600",
          trendData['agromet-advisory'],
          () => onNavigate("content-management-agromet-advisory")
        )}
        
        {renderStatCard(
          "Poultry Calendars",
          agriculturalStats?.poultryCalendars?.total || 0,
          <FaSeedling />,
          "from-purple-400 to-purple-600",
          trendData['poultry-calendar'],
          () => onNavigate("content-management-poultry-calendar")
        )}
        
        {renderStatCard(
          "Poultry Advisories",
          agriculturalStats?.poultryAdvisories?.total || 0,
          <FaUsers />,
          "from-orange-400 to-orange-600",
          trendData['poultry-advisory'],
          () => onNavigate("content-management-poultry-advisory")
        )}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {renderMetricCard(
          "Data Quality",
          `${healthMetrics.dataQuality}%`,
          <FaCheckCircle />,
          "Complete records",
          healthMetrics.dataQuality >= 80 ? 'good' : healthMetrics.dataQuality >= 60 ? 'warning' : 'error'
        )}
        
        {renderMetricCard(
          "Region Coverage",
          `${healthMetrics.regionCoverage}%`,
          <FaMapMarkedAlt />,
          `${Math.round(healthMetrics.regionCoverage * 16 / 100)}/16 regions`,
          healthMetrics.regionCoverage >= 70 ? 'good' : healthMetrics.regionCoverage >= 40 ? 'warning' : 'error'
        )}
        
        {renderMetricCard(
          "Total Crops",
          agriculturalStats?.cropCalendars?.crops || 0,
          <FaLeaf />,
          "Unique crop types"
        )}
        
        {renderMetricCard(
          "Total Districts",
          Math.max(
            agriculturalStats?.cropCalendars?.regions || 0,
            agriculturalStats?.agrometAdvisories?.regions || 0,
            agriculturalStats?.poultryCalendars?.regions || 0,
            agriculturalStats?.poultryAdvisories?.regions || 0
          ),
          <FaMapMarkedAlt />,
          "Covered districts"
        )}
        
        {renderMetricCard(
          "Recent Updates",
          healthMetrics.recentlyUpdated,
          <FaClock />,
          "Last 30 days",
          healthMetrics.recentlyUpdated > 10 ? 'good' : healthMetrics.recentlyUpdated > 3 ? 'warning' : 'error'
        )}
        
        {renderMetricCard(
          "Data Integrity",
          `${Math.round((healthMetrics.withLocation / Math.max(healthMetrics.totalRecords, 1)) * 100)}%`,
          <FaExclamationTriangle />,
          "With location data",
          healthMetrics.withLocation / Math.max(healthMetrics.totalRecords, 1) >= 0.8 ? 'good' : 'warning'
        )}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaTrendUp className="mr-2 text-green-600" />
              Recent Activity
            </h3>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          
          <div className="space-y-3">
            {activityData.length > 0 ? activityData.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FaFileAlt className="text-green-500 text-sm" />
                    <span className="text-sm font-medium text-gray-900">
                      {day.count} upload{day.count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-500">
                      • {day.records} records
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {day.types.join(', ')}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString()}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <FaFileAlt className="mx-auto h-8 w-8 mb-3 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaChartBar className="mr-2 text-blue-600" />
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate("agricultural-crop-calendar")}
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <FaCalendarAlt className="text-green-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-green-800">Upload Crop Calendar</div>
                <div className="text-xs text-green-600">Add new crop data</div>
              </div>
            </button>
            
            <button
              onClick={() => onNavigate("agricultural-agromet-advisory")}
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <FaCloudSun className="text-blue-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-blue-800">Manage Advisories</div>
                <div className="text-xs text-blue-600">Weather advisories</div>
              </div>
            </button>
            
            <button
              onClick={() => onNavigate("content-management-crop-calendar")}
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
            >
              <FaFileAlt className="text-purple-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-purple-800">View All Data</div>
                <div className="text-xs text-purple-600">Browse & manage</div>
              </div>
            </button>
            
            <button
              onClick={() => window.open('/crop-calendar', '_blank')}
              className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
            >
              <FaExternalLinkAlt className="text-orange-600 mr-3" />
              <div>
                <div className="text-sm font-medium text-orange-800">Public View</div>
                <div className="text-xs text-orange-600">See live site</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Data Health Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaCheckCircle className="mr-2 text-green-600" />
          Data Health Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Coverage Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Records with Location:</span>
                <span className="font-medium text-blue-600">
                  {healthMetrics.withLocation}/{healthMetrics.totalRecords}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Regions Covered:</span>
                <span className="font-medium text-green-600">
                  {Math.round(healthMetrics.regionCoverage * 16 / 100)}/16
                </span>
              </div>
              <div className="flex justify-between">
                <span>Data Completeness:</span>
                <span className="font-medium text-purple-600">
                  {healthMetrics.dataQuality}%
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Content Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Crop Calendars:</span>
                <span className="font-medium text-green-600">
                  {agriculturalStats?.cropCalendars?.total || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Weather Advisories:</span>
                <span className="font-medium text-blue-600">
                  {agriculturalStats?.agrometAdvisories?.total || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Poultry Data:</span>
                <span className="font-medium text-orange-600">
                  {(agriculturalStats?.poultryCalendars?.total || 0) + 
                   (agriculturalStats?.poultryAdvisories?.total || 0)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Recent Activity</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Updated This Month:</span>
                <span className="font-medium text-green-600">
                  {healthMetrics.recentlyUpdated}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Uploads:</span>
                <span className="font-medium text-blue-600">
                  {recentUploads?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Average Quality:</span>
                <span className="font-medium text-purple-600">
                  {healthMetrics.dataQuality >= 80 ? 'Excellent' :
                   healthMetrics.dataQuality >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardStats.propTypes = {
  agriculturalStats: PropTypes.object,
  recentUploads: PropTypes.array,
  onNavigate: PropTypes.func.isRequired
};

export default DashboardStats;