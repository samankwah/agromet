import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
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
import EnhancedCalendarUpload from "../EnhancedCalendarUpload";
import EnhancedCalendarViewer from "../EnhancedCalendarViewer";
import ProductionCycleManager from "../ProductionCycleManager";
import ProfileDropdown from "../common/ProfileDropdown";
import userService from "../../services/userService";
import { TableSkeleton } from "../common/SkeletonLoading";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // AUTO-OPEN MODAL: Only open if explicitly requested or returning from preview
  useEffect(() => {
    const openModal = searchParams.get('openModal');
    const storedFormData = localStorage.getItem('calendarFormData');
    const isReturningFromPreview = sessionStorage.getItem('returningFromCalendarPreview');
    
    if (openModal === 'crop-calendar' || (storedFormData && isReturningFromPreview)) {
      console.log('🔄 Opening crop calendar modal - URL param or returning from preview');
      setShowCropCalendarForm(true);
      
      // Clear the URL parameter after opening modal
      if (openModal) {
        setSearchParams({});
      }
    } else if (storedFormData && !isReturningFromPreview) {
      // Clean up old form data if not returning from preview
      console.log('🧹 Cleaning up old form data on dashboard (not from preview)');
      localStorage.removeItem('calendarFormData');
    }
  }, [searchParams, setSearchParams]); // React to URL changes

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
      console.log('📊 [DASHBOARD] loadAgriculturalStats started');
      const dataTypes = ['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory'];

      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      console.log('📊 [DASHBOARD] Calling getAgriculturalData for types:', dataTypes);
      const results = await Promise.allSettled(
        dataTypes.map(type => userService.getAgriculturalData(type, { _t: timestamp }))
      );

      console.log('📊 [DASHBOARD] Raw results from Promise.allSettled:', results);

      const [cropCalendarData, agrometAdvisoryData, poultryCalendarData, poultryAdvisoryData] = results.map(result =>
        result.status === 'fulfilled' ? result.value : { success: false, data: [] }
      );

      console.log('📊 [DASHBOARD] Crop Calendar Data received:', {
        success: cropCalendarData.success,
        dataLength: cropCalendarData.data?.length,
        sampleData: cropCalendarData.data?.[0]
      });

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

  const handleCropCalendarSave = async (data) => {
    setShowCropCalendarForm(false);

    // Force immediate refresh of agricultural stats and recent uploads
    try {
      await Promise.all([
        loadAgriculturalStats(),
        loadRecentUploads()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  const handlePoultryCalendarSave = async (data) => {
    setShowPoultryCalendarForm(false);

    // Force immediate refresh of agricultural stats and recent uploads
    try {
      await Promise.all([
        loadAgriculturalStats(),
        loadRecentUploads()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
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
      case "enhanced-calendar-upload":
        return "Enhanced Calendar Upload";
      case "enhanced-calendar-viewer":
        return "Enhanced Calendar Viewer";
      case "enhanced-calendar-production":
        return "Production Cycle Management";
      default:
        return "AgroMet AI Dashboard";
    }
  };


  return (
    <div className="neo-page flex min-h-screen">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-neo-text/35"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden neo-surface-soft m-3">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="neo-icon-button h-10 w-10"
              aria-label="Open dashboard navigation"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-neo-accent-strong">AgroMet AI</h1>
            <button
              onClick={handleLogout}
              className="neo-icon-button h-10 w-10"
              aria-label="Sign out"
            >
              <FaSignOutAlt className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block neo-surface-soft sticky top-4 z-10 relative mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 w-full">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-neo-accent-strong">AgroMet AI Admin</h1>
              </div>
              <div className="flex items-center">
                {/* Spacer to maintain layout */}
              </div>
            </div>
          </div>
          {/* Absolutely positioned ProfileDropdown at screen edge */}
          <div className="absolute top-0 right-4 h-16 flex items-center">
            <ProfileDropdown
              user={currentUser}
              onLogout={handleLogout}
            />
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="py-6">
              <TableSkeleton rows={5} columns={4} />
            </div>
          ) : (
            <>
              {/* Page Title */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-neo-text">{getPageTitle()}</h2>
                <p className="mt-1 text-sm text-neo-muted">
                  Manage your agricultural data and calendars efficiently
                </p>
              </div>

              {/* Dashboard Overview */}
              {activePage === "dashboard" && agriculturalStats && (
                <>
                  {/* Key Metrics Cards - Mobile Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="neo-stat">
                      <div className="flex items-center">
                        <div className="neo-icon-button h-12 w-12">
                          <FaCalendarAlt className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-neo-muted text-xs sm:text-sm">Crop Calendars</p>
                          <p className="text-xl sm:text-2xl font-bold text-neo-text">{agriculturalStats.cropCalendars.total}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="neo-stat">
                      <div className="flex items-center">
                        <div className="neo-icon-button h-12 w-12">
                          <FaCloudSun className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-neo-muted text-xs sm:text-sm">Agromet Advisories</p>
                          <p className="text-xl sm:text-2xl font-bold text-neo-text">{agriculturalStats.agrometAdvisories.total}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="neo-stat">
                      <div className="flex items-center">
                        <div className="neo-icon-button h-12 w-12">
                          <FaSeedling className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-neo-muted text-xs sm:text-sm">Poultry Calendars</p>
                          <p className="text-xl sm:text-2xl font-bold text-neo-text">{agriculturalStats.poultryCalendars.total}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="neo-stat">
                      <div className="flex items-center">
                        <div className="neo-icon-button h-12 w-12">
                          <FaUsers className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-neo-muted text-xs sm:text-sm">Poultry Advisories</p>
                          <p className="text-xl sm:text-2xl font-bold text-neo-text">{agriculturalStats.poultryAdvisories.total}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Recent Uploads */}
                    <div className="neo-panel">
                      <h3 className="text-lg font-semibold text-neo-text mb-4">Recent Uploads</h3>
                      <div className="space-y-3">
                        {recentUploads.length > 0 ? recentUploads.map((upload) => (
                          <div key={upload.id} className="neo-inset flex flex-col sm:flex-row sm:items-center justify-between p-3 space-y-2 sm:space-y-0">
                            <div className="flex items-center min-w-0 flex-1">
                              <FaFileAlt className="text-neo-accent mr-3 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-neo-text truncate">{upload.filename}</p>
                                <p className="text-xs text-neo-muted">{upload.type} - {upload.recordCount} records</p>
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-1 flex-shrink-0">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                {upload.status}
                              </span>
                              <p className="text-xs text-neo-muted">
                                {new Date(upload.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <FaFileAlt className="mx-auto h-12 w-12 text-neo-muted mb-4" />
                            <p className="text-sm text-neo-muted">No recent uploads found</p>
                            <p className="text-xs text-neo-muted/80 mt-1">Upload agricultural data to see recent activity</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="neo-panel">
                      <h3 className="text-lg font-semibold text-neo-text mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleNavigate("agricultural-crop-calendar")}
                          className="neo-button justify-start text-left"
                        >
                          <FaCalendarAlt className="text-neo-accent" />
                          <span className="text-sm font-medium">Upload Crop Calendar</span>
                        </button>
                        
                        <button
                          onClick={() => handleNavigate("agricultural-agromet-advisory")}
                          className="neo-button justify-start text-left"
                        >
                          <FaCloudSun className="text-neo-teal" />
                          <span className="text-sm font-medium">Upload Advisories</span>
                        </button>
                        
                        <button
                          onClick={() => handleNavigate("agricultural-poultry-calendar")}
                          className="neo-button justify-start text-left"
                        >
                          <FaSeedling className="text-neo-accent" />
                          <span className="text-sm font-medium">Upload Poultry Calendar</span>
                        </button>
                        
                        <button
                          onClick={() => handleNavigate("agricultural-poultry-advisory")}
                          className="neo-button justify-start text-left"
                        >
                          <FaUsers className="text-neo-muted" />
                          <span className="text-sm font-medium">Upload Poultry Advisory</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}


              {/* Content Management Pages */}
              {activePage.startsWith("content-management-") && (
                <div className="neo-table-shell">
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
                <div className="neo-table-shell">
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

              {/* Enhanced Calendar Pages */}
              {activePage.startsWith("enhanced-calendar") && (
                <div className="neo-table-shell">
                  {activePage === "enhanced-calendar-upload" && (
                    <EnhancedCalendarUpload />
                  )}
                  {activePage === "enhanced-calendar-viewer" && (
                    <EnhancedCalendarViewer />
                  )}
                  {activePage === "enhanced-calendar-production" && (
                    <ProductionCycleManager />
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
