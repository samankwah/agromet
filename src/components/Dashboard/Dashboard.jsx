import { useState, useEffect } from "react";
import {
  FaBell,
  FaSignOutAlt,
  FaSeedling,
  FaCalendarAlt,
  FaFileAlt,
  FaUsers,
  FaCloudSun,
} from "react-icons/fa";
import Sidebar from "./DashboardSidebar";
import CropCalendarForm from "./CropCalendarForm";
import PoultryCalendarForm from "./PoultryCalendarForm";
import CalendarDataPreview from "./CalendarDataPreview";
import AgrometAdvisoryManager from "./AgrometAdvisoryManager";
import PoultryAdvisoryManager from "./PoultryAdvisoryManager";
import userService from "../../services/userService";

const Dashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [showCropCalendarForm, setShowCropCalendarForm] = useState(false);
  const [showPoultryCalendarForm, setShowPoultryCalendarForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [agriculturalStats, setAgriculturalStats] = useState(null);
  const [recentUploads, setRecentUploads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load user data and agricultural statistics
  useEffect(() => {
    loadUserData();
    loadAgriculturalStats();
  }, []);

  // Auto-refresh recent uploads every 30 seconds when on dashboard
  useEffect(() => {
    let intervalId;
    
    if (activePage === 'dashboard') {
      intervalId = setInterval(() => {
        loadRecentUploads();
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activePage]);

  const loadUserData = async () => {
    try {
      const user = userService.getCurrentUser();
      setCurrentUser(user);

      // Load notifications
      const notificationsResult = await userService.getUserNotifications();
      if (notificationsResult.success) {
        setNotifications(notificationsResult.data || []);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadRecentUploads = async () => {
    try {
      const dataTypes = [
        { key: 'crop-calendar', displayName: 'Crop Calendar' },
        { key: 'agromet-advisory', displayName: 'Agromet Advisory' },
        { key: 'poultry-calendar', displayName: 'Poultry Calendar' },
        { key: 'poultry-advisory', displayName: 'Poultry Advisory' }
      ];
      
      const allUploads = [];
      
      for (const dataType of dataTypes) {
        try {
          const result = await userService.getAgriculturalData(dataType.key);
          if (result.success && result.data) {
            const uploads = result.data
              .filter(item => item.uploadDate || item.createdAt) // Only items with upload dates
              .map(item => ({
                id: item.id || item.uniqueId,
                type: dataType.displayName,
                filename: item.filename || item.originalFilename || `${dataType.displayName}_${new Date(item.uploadDate || item.createdAt).toLocaleDateString()}.xlsx`,
                recordCount: item.recordCount || (Array.isArray(result.data) ? 1 : 0),
                uploadDate: item.uploadDate || item.createdAt || new Date().toISOString(),
                status: item.status || 'processed'
              }))
              .slice(0, 2); // Get latest 2 from each type
            
            allUploads.push(...uploads);
          }
        } catch (error) {
          console.warn(`Error loading ${dataType.key} uploads:`, error);
        }
      }
      
      // Sort by upload date (newest first) and take latest 5
      const sortedUploads = allUploads
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .slice(0, 5);
      
      setRecentUploads(sortedUploads);
      
    } catch (error) {
      console.error("Error loading recent uploads:", error);
      // Fallback to empty array if there's an error
      setRecentUploads([]);
    }
  };

  const loadAgriculturalStats = async () => {
    try {
      const dataTypes = ['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory'];
      const results = await Promise.allSettled(
        dataTypes.map(type => userService.getAgriculturalData(type))
      );
      
      const [cropCalendarData, agrometAdvisoryData, poultryCalendarData, poultryAdvisoryData] = results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, data: [] }
      );

      const stats = {
        cropCalendars: {
          total: cropCalendarData.success ? cropCalendarData.data.length : 0,
          regions: cropCalendarData.success ? [...new Set(cropCalendarData.data.map(item => item.region))].length : 0,
          crops: cropCalendarData.success ? [...new Set(cropCalendarData.data.map(item => item.crop))].length : 0
        },
        agrometAdvisories: {
          total: agrometAdvisoryData.success ? agrometAdvisoryData.data.length : 0,
          regions: agrometAdvisoryData.success ? [...new Set(agrometAdvisoryData.data.map(item => item.region))].length : 0,
          activities: agrometAdvisoryData.success ? [...new Set(agrometAdvisoryData.data.map(item => item.activity))].length : 0
        },
        poultryCalendars: {
          total: poultryCalendarData.success ? poultryCalendarData.data.length : 0,
          regions: poultryCalendarData.success ? [...new Set(poultryCalendarData.data.map(item => item.region))].length : 0
        },
        poultryAdvisories: {
          total: poultryAdvisoryData.success ? poultryAdvisoryData.data.length : 0,
          regions: poultryAdvisoryData.success ? [...new Set(poultryAdvisoryData.data.map(item => item.region))].length : 0
        }
      };

      setAgriculturalStats(stats);

      // Load real recent uploads from all data types
      await loadRecentUploads();

    } catch (error) {
      console.error("Error loading agricultural stats:", error);
      setAgriculturalStats({
        cropCalendars: { total: 0, regions: 0, crops: 0 },
        agrometAdvisories: { total: 0, regions: 0, activities: 0 },
        poultryCalendars: { total: 0, regions: 0 },
        poultryAdvisories: { total: 0, regions: 0 }
      });
    }
  };

  const handleNavigate = (page) => {
    setIsLoading(true);
    setActivePage(page);
    
    // Show appropriate forms for specific pages
    if (page === "agricultural-crop-calendar") {
      setShowCropCalendarForm(true);
      setShowPoultryCalendarForm(false);
    } else if (page === "agricultural-poultry-calendar") {
      setShowPoultryCalendarForm(true);
      setShowCropCalendarForm(false);
    } else {
      setShowCropCalendarForm(false);
      setShowPoultryCalendarForm(false);
    }

    // Refresh dashboard data when navigating back to dashboard
    if (page === 'dashboard') {
      refreshDashboardData();
    }

    // Close mobile sidebar
    setSidebarOpen(false);

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handleLogout = async () => {
    try {
      await userService.signOut();
      window.location.href = "/admin-login";
    } catch (error) {
      console.error("Logout error:", error);
      userService.clearAuthData();
      window.location.href = "/admin-login";
    }
  };

  const handleCropCalendarSave = (data) => {
    console.log('Crop calendar saved:', data);
    loadAgriculturalStats();
    loadRecentUploads(); // Refresh recent uploads
    setShowCropCalendarForm(false);
  };

  const handlePoultryCalendarSave = (data) => {
    console.log('Poultry calendar saved:', data);
    loadAgriculturalStats();
    loadRecentUploads(); // Refresh recent uploads
    setShowPoultryCalendarForm(false);
  };

  // Refresh dashboard data when returning to dashboard page
  const refreshDashboardData = () => {
    if (activePage === 'dashboard') {
      loadAgriculturalStats();
      loadRecentUploads();
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard Overview";
      case "agricultural-crop-calendar":
        return "Crop Calendar Management";
      case "agricultural-poultry-calendar":
        return "Poultry Calendar Management";
      case "agricultural-agromet-advisory":
        return "Agromet Advisory Management";
      case "agricultural-poultry-advisory":
        return "Poultry Advisory Management";
      case "content-management-crop-calendar":
        return "Manage Crop Calendars";
      case "content-management-agromet-advisory":
        return "Manage Agromet Advisories";
      case "content-management-poultry-calendar":
        return "Manage Poultry Calendars";
      case "content-management-poultry-advisory":
        return "Manage Poultry Advisories";
      default:
        return "TriAgro AI Dashboard";
    }
  };

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-green-800">TriAgro AI</h1>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <FaSignOutAlt className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-green-800">TriAgro AI Admin</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FaBell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500"></span>
                  )}
                </div>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold mr-3">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-gray-700">
                      {currentUser?.name || 'Admin'}
                    </div>
                    <div className="text-xs text-gray-500">{currentDate}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <FaSignOutAlt className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {/* Page Title */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{getPageTitle()}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your agricultural data and calendars efficiently
                </p>
              </div>

              {/* Dashboard Overview */}
              {activePage === "dashboard" && agriculturalStats && (
                <>
                  {/* Key Metrics Cards - Mobile Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                      <div className="flex items-center">
                        <div className="p-2 bg-white bg-opacity-30 rounded-lg">
                          <FaCalendarAlt className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-green-100 text-xs sm:text-sm">Crop Calendars</p>
                          <p className="text-xl sm:text-2xl font-bold">{agriculturalStats.cropCalendars.total}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                      <div className="flex items-center">
                        <div className="p-2 bg-white bg-opacity-30 rounded-lg">
                          <FaCloudSun className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-blue-100 text-xs sm:text-sm">Agromet Advisories</p>
                          <p className="text-xl sm:text-2xl font-bold">{agriculturalStats.agrometAdvisories.total}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                      <div className="flex items-center">
                        <div className="p-2 bg-white bg-opacity-30 rounded-lg">
                          <FaSeedling className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-purple-100 text-xs sm:text-sm">Poultry Calendars</p>
                          <p className="text-xl sm:text-2xl font-bold">{agriculturalStats.poultryCalendars.total}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                      <div className="flex items-center">
                        <div className="p-2 bg-white bg-opacity-30 rounded-lg">
                          <FaUsers className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-orange-100 text-xs sm:text-sm">Poultry Advisories</p>
                          <p className="text-xl sm:text-2xl font-bold">{agriculturalStats.poultryAdvisories.total}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Recent Uploads */}
                    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
                      <div className="space-y-3">
                        {recentUploads.length > 0 ? recentUploads.map((upload) => (
                          <div key={upload.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-md space-y-2 sm:space-y-0">
                            <div className="flex items-center min-w-0 flex-1">
                              <FaFileAlt className="text-green-500 mr-3 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{upload.filename}</p>
                                <p className="text-xs text-gray-500">{upload.type} • {upload.recordCount} records</p>
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-1 flex-shrink-0">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {upload.status}
                              </span>
                              <p className="text-xs text-gray-500">
                                {new Date(upload.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-sm text-gray-500">No recent uploads found</p>
                            <p className="text-xs text-gray-400 mt-1">Upload agricultural data to see recent activity</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleNavigate("agricultural-crop-calendar")}
                          className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <FaCalendarAlt className="text-green-600 mr-3" />
                          <span className="text-sm font-medium text-green-800">Create Crop Calendar</span>
                        </button>
                        
                        <button
                          onClick={() => handleNavigate("agricultural-poultry-calendar")}
                          className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <FaSeedling className="text-blue-600 mr-3" />
                          <span className="text-sm font-medium text-blue-800">Create Poultry Calendar</span>
                        </button>
                        
                        <button
                          onClick={() => handleNavigate("agricultural-agromet-advisory")}
                          className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <FaCloudSun className="text-purple-600 mr-3" />
                          <span className="text-sm font-medium text-purple-800">Manage Agromet Advisory</span>
                        </button>
                        
                        <button
                          onClick={() => handleNavigate("agricultural-poultry-advisory")}
                          className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <FaUsers className="text-orange-600 mr-3" />
                          <span className="text-sm font-medium text-orange-800">Manage Poultry Advisory</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Content Management Pages */}
              {activePage.startsWith("content-management-") && (
                <div className="bg-white rounded-lg shadow">
                  {activePage === "content-management-crop-calendar" && (
                    <CalendarDataPreview
                      dataType="crop-calendar"
                      title="Crop Calendar"
                      onAddNew={() => setShowCropCalendarForm(true)}
                    />
                  )}
                  {activePage === "content-management-poultry-calendar" && (
                    <CalendarDataPreview
                      dataType="poultry-calendar"
                      title="Poultry Calendar"
                      onAddNew={() => setShowPoultryCalendarForm(true)}
                    />
                  )}
                  {activePage === "content-management-agromet-advisory" && (
                    <AgrometAdvisoryManager />
                  )}
                  {activePage === "content-management-poultry-advisory" && (
                    <PoultryAdvisoryManager />
                  )}
                </div>
              )}

              {/* Agricultural Data Pages */}
              {activePage.startsWith("agricultural-") && !activePage.startsWith("content-management-") && (
                <div className="bg-white rounded-lg shadow">
                  {activePage === "agricultural-crop-calendar" && (
                    <CalendarDataPreview
                      dataType="crop-calendar"
                      title="Crop Calendar"
                      onAddNew={() => setShowCropCalendarForm(true)}
                    />
                  )}
                  {activePage === "agricultural-poultry-calendar" && (
                    <CalendarDataPreview
                      dataType="poultry-calendar"
                      title="Poultry Calendar"
                      onAddNew={() => setShowPoultryCalendarForm(true)}
                    />
                  )}
                  {activePage === "agricultural-agromet-advisory" && (
                    <AgrometAdvisoryManager />
                  )}
                  {activePage === "agricultural-poultry-advisory" && (
                    <PoultryAdvisoryManager />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form Modals */}
      <CropCalendarForm
        isOpen={showCropCalendarForm}
        onClose={() => setShowCropCalendarForm(false)}
        onSave={handleCropCalendarSave}
      />

      <PoultryCalendarForm
        isOpen={showPoultryCalendarForm}
        onClose={() => setShowPoultryCalendarForm(false)}
        onSave={handlePoultryCalendarSave}
      />
    </div>
  );
};

export default Dashboard;