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
import ContentManagerHub from "./ContentManagerHub";
import DashboardStats from "./DashboardStats";
import NavigationBreadcrumb from "./NavigationBreadcrumb";
import CalendarDataPreview from "./CalendarDataPreview";
import AgrometAdvisoryManager from "./AgrometAdvisoryManager";
import PoultryAdvisoryManager from "./PoultryAdvisoryManager";
import CropCalendarForm from "./CropCalendarForm";
import PoultryCalendarForm from "./PoultryCalendarForm";
import userService from "../../services/userService";

const RefactoredDashboard = () => {
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
        return "Upload Crop Calendar Data";
      case "agricultural-poultry-calendar":
        return "Upload Poultry Calendar Data";
      case "agricultural-agromet-advisory":
        return "Upload Agromet Advisory Data";
      case "agricultural-poultry-advisory":
        return "Upload Poultry Advisory Data";
      case "content-management-crop-calendar":
        return "Manage Crop Calendar Data";
      case "content-management-agromet-advisory":
        return "Manage Agromet Advisory Data";
      case "content-management-poultry-calendar":
        return "Manage Poultry Calendar Data";
      case "content-management-poultry-advisory":
        return "Manage Poultry Advisory Data";
      case "emergency":
        return "Emergency Alert Management";
      case "news":
        return "News Management";
      default:
        return "TriAgro AI Dashboard";
    }
  };

  const renderMainContent = () => {
    // Dashboard Overview with Enhanced Stats
    if (activePage === "dashboard") {
      return (
        <DashboardStats
          agriculturalStats={agriculturalStats}
          recentUploads={recentUploads}
          onNavigate={handleNavigate}
        />
      );
    }

    // Content Management Pages (using new ContentManagerHub)
    if (activePage.startsWith("content-management-")) {
      const dataType = activePage.replace("content-management-", "");
      return (
        <ContentManagerHub
          dataType={dataType}
          onClose={() => handleNavigate("dashboard")}
        />
      );
    }

    // Agricultural Data Upload Pages (legacy support)
    if (activePage.startsWith("agricultural-")) {
      if (activePage === "agricultural-crop-calendar") {
        return (
          <CalendarDataPreview
            dataType="crop-calendar"
            title="Crop Calendar"
            onAddNew={() => setShowCropCalendarForm(true)}
          />
        );
      }
      if (activePage === "agricultural-poultry-calendar") {
        return (
          <CalendarDataPreview
            dataType="poultry-calendar"
            title="Poultry Calendar"
            onAddNew={() => setShowPoultryCalendarForm(true)}
          />
        );
      }
      if (activePage === "agricultural-agromet-advisory") {
        return <AgrometAdvisoryManager />;
      }
      if (activePage === "agricultural-poultry-advisory") {
        return <PoultryAdvisoryManager />;
      }
    }

    // Placeholder pages for other functionality
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            This feature is under development and will be available soon.
          </p>
          <button
            onClick={() => handleNavigate("dashboard")}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
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
                <div className="ml-8">
                  <NavigationBreadcrumb 
                    activePage={activePage} 
                    onNavigate={handleNavigate}
                  />
                </div>
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
              {/* Page Title - Only show for non-dashboard pages */}
              {activePage !== "dashboard" && (
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{getPageTitle()}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your agricultural data efficiently with Excel file uploads and real-time processing
                  </p>
                </div>
              )}

              {/* Main Content */}
              {renderMainContent()}
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

export default RefactoredDashboard;