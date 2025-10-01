import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  FaPlus,
  FaUpload,
  FaDownload,
  FaDatabase,
  FaChartBar,
  FaSync,
  FaFilter,
  FaCalendarAlt,
  FaLeaf,
  FaCloudSun,
  FaEgg,
  FaTimes,
  FaEdit,
  FaSave,
  FaEye
} from "react-icons/fa";
import UniversalDataTable from "./UniversalDataTable";
import EnhancedFileUploader from "./EnhancedFileUploader";
import userService from "../../services/userService";
import { logger } from "../../utils/logger";
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';

const ContentManagerHub = ({ dataType, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("table"); // "table", "upload", "stats"
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal states
  const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [editFormData, setEditFormData] = useState({});

  // Data type configuration
  const dataTypeConfig = {
    'crop-calendar': {
      title: 'Crop Calendar',
      icon: <FaCalendarAlt className="text-green-600" />,
      description: 'Manage crop planting and harvesting schedules',
      acceptedTypes: ['.xlsx', '.xls', '.csv'],
      columns: [
        { key: 'region', label: 'Region', sortable: true, filterable: true },
        { key: 'district', label: 'District', sortable: true, filterable: true },
        { key: 'crop', label: 'Crop', sortable: true, filterable: true, 
          render: (value) => (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              {value}
            </span>
          )
        },
        { key: 'plantingMonth', label: 'Planting Month', sortable: true, filterable: true },
        { key: 'harvestMonth', label: 'Harvest Month', sortable: true, filterable: true },
        { key: 'season', label: 'Season', sortable: true, filterable: true },
        { key: 'lastUpdated', label: 'Last Updated', sortable: true, 
          render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
      ]
    },
    'agromet-advisory': {
      title: 'Agromet Advisory',
      icon: <FaCloudSun className="text-blue-600" />,
      description: 'Manage weather-based agricultural advisories',
      acceptedTypes: ['.xlsx', '.xls', '.csv'],
      columns: [
        { key: 'region', label: 'Region', sortable: true, filterable: true },
        { key: 'district', label: 'District', sortable: true, filterable: true },
        { key: 'commodity', label: 'Commodity', sortable: true, filterable: true },
        { key: 'activity', label: 'Activity', sortable: true, filterable: true },
        { key: 'advisory', label: 'Advisory', sortable: false, filterable: false,
          render: (value) => (
            <div className="max-w-xs truncate" title={value}>
              {value}
            </div>
          )
        },
        { key: 'validFrom', label: 'Valid From', sortable: true,
          render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        },
        { key: 'validTo', label: 'Valid To', sortable: true,
          render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
      ]
    },
    'poultry-calendar': {
      title: 'Poultry Calendar',
      icon: <FaEgg className="text-orange-600" />,
      description: 'Manage poultry production schedules',
      acceptedTypes: ['.xlsx', '.xls', '.csv'],
      columns: [
        { key: 'region', label: 'Region', sortable: true, filterable: true },
        { key: 'district', label: 'District', sortable: true, filterable: true },
        { key: 'poultryType', label: 'Poultry Type', sortable: true, filterable: true,
          render: (value) => (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
              {value}
            </span>
          )
        },
        { key: 'activity', label: 'Activity', sortable: true, filterable: true },
        { key: 'startWeek', label: 'Start Week', sortable: true, filterable: true },
        { key: 'duration', label: 'Duration (weeks)', sortable: true, filterable: true },
        { key: 'notes', label: 'Notes', sortable: false, filterable: false }
      ]
    },
    'poultry-advisory': {
      title: 'Poultry Advisory',
      icon: <FaLeaf className="text-purple-600" />,
      description: 'Manage poultry health and management advisories',
      acceptedTypes: ['.xlsx', '.xls', '.csv'],
      columns: [
        { key: 'region', label: 'Region', sortable: true, filterable: true },
        { key: 'district', label: 'District', sortable: true, filterable: true },
        { key: 'poultryType', label: 'Poultry Type', sortable: true, filterable: true },
        { key: 'advisory', label: 'Advisory', sortable: false, filterable: false },
        { key: 'category', label: 'Category', sortable: true, filterable: true },
        { key: 'priority', label: 'Priority', sortable: true, filterable: true,
          render: (value) => {
            const colorMap = {
              'High': 'bg-red-100 text-red-800',
              'Medium': 'bg-yellow-100 text-yellow-800',
              'Low': 'bg-green-100 text-green-800'
            };
            return (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorMap[value] || 'bg-gray-100 text-gray-800'}`}>
                {value}
              </span>
            );
          }
        },
        { key: 'validFrom', label: 'Valid From', sortable: true,
          render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
      ]
    }
  };

  const config = dataTypeConfig[dataType] || {
    title: 'Data Management',
    icon: <FaDatabase />,
    description: 'Manage your data',
    acceptedTypes: ['.xlsx', '.xls', '.csv'],
    columns: []
  };

  useEffect(() => {
    loadData();
    loadStats();
  }, [dataType, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await userService.getAgriculturalData(dataType);
      
      if (result.success) {
        setData(result.data || []);
        logger.info(`Loaded ${dataType} data`, { count: result.data?.length || 0 });
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while loading data';
      setError(errorMsg);
      logger.error('Data loading failed', { dataType, error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await userService.getAgriculturalData(dataType);
      if (result.success && result.data) {
        const data = result.data;
        const statsData = {
          total: data.length,
          regions: [...new Set(data.map(item => item.region).filter(Boolean))].length,
          districts: [...new Set(data.map(item => item.district).filter(Boolean))].length,
          lastUpdate: data.length > 0 ? Math.max(...data.map(item => 
            new Date(item.lastUpdated || item.createdAt || 0).getTime()
          )) : null
        };

        // Add type-specific stats
        if (dataType === 'crop-calendar') {
          statsData.crops = [...new Set(data.map(item => item.crop).filter(Boolean))].length;
          statsData.seasons = [...new Set(data.map(item => item.season).filter(Boolean))].length;
        } else if (dataType === 'agromet-advisory') {
          statsData.commodities = [...new Set(data.map(item => item.commodity).filter(Boolean))].length;
          statsData.activities = [...new Set(data.map(item => item.activity).filter(Boolean))].length;
        } else if (dataType.includes('poultry')) {
          statsData.poultryTypes = [...new Set(data.map(item => item.poultryType).filter(Boolean))].length;
        }

        setStats(statsData);
      }
    } catch (err) {
      logger.warn('Failed to load stats', { dataType, error: err.message });
    }
  };

  const handleUploadSuccess = (uploadResult) => {
    logger.userAction('File upload completed successfully', uploadResult);
    setRefreshTrigger(prev => prev + 1);

    // Show success toast notification
    const recordCount = uploadResult.recordCount || 0;
    const fileName = uploadResult.filename || 'file';
    toast.success(
      `✅ Calendar uploaded successfully!\n${fileName} - ${recordCount} records processed`,
      {
        duration: 5000,
        icon: '📅',
      }
    );

    setTimeout(() => {
      setActiveView("table");
    }, 2000);
  };

  const handleUploadError = (error) => {
    logger.error('File upload failed', error);
  };

  const handleView = (row) => {
    logger.userAction('View data record', { dataType, id: row.id });
    setViewModal({ isOpen: true, data: row });
  };

  const handleEdit = (row) => {
    logger.userAction('Edit data record', { dataType, id: row.id });
    setEditModal({ isOpen: true, data: row });
    setEditFormData({ ...row });
  };

  const handleSaveEdit = async () => {
    try {
      // TODO: Backend API endpoint for updating records needs to be implemented
      // For now, we'll show an honest message to users
      toast.error('Edit functionality not yet implemented - backend API required');
      console.log('Edit data that would be saved:', editFormData);

      // Don't close modal or refresh since nothing was actually saved
      // setEditModal({ isOpen: false, data: null });
      // setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Edit save error:', error);
      toast.error('Failed to update record');
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Are you sure you want to delete this ${config.title.toLowerCase()} record?`)) {
      try {
        await userService.deleteAgriculturalData(dataType, row.id);
        logger.userAction('Data record deleted', { dataType, id: row.id });
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        logger.error('Delete operation failed', { dataType, id: row.id, error: error.message });
        alert('Failed to delete record. Please try again.');
      }
    }
  };

  const handleExport = (format, exportData) => {
    logger.userAction('Data export requested', { dataType, format, count: exportData.length });

    if (format === 'excel') {
      exportToExcel(exportData);
    } else if (format === 'csv') {
      exportToCSV(exportData);
    }
  };

  const exportToExcel = (data) => {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Clean data for Excel export - flatten complex objects
      const cleanData = data.map(row => {
        const cleanRow = {};
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            cleanRow[key] = JSON.stringify(value);
          } else {
            cleanRow[key] = value;
          }
        });
        return cleanRow;
      });

      const ws = XLSX.utils.json_to_sheet(cleanData);

      // Auto-size columns
      const colWidths = [];
      Object.keys(cleanData[0] || {}).forEach((key, index) => {
        const maxLength = Math.max(
          key.length,
          ...cleanData.map(row => String(row[key] || '').length)
        );
        colWidths.push({ width: Math.min(Math.max(maxLength + 2, 10), 50) });
      });
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${config.title.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success(`Excel file exported: ${filename}`);

    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const exportToCSV = (data) => {
    try {
      // Clean data for CSV export
      const cleanData = data.map(row => {
        const cleanRow = {};
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            cleanRow[key] = JSON.stringify(value);
          } else {
            cleanRow[key] = value;
          }
        });
        return cleanRow;
      });

      if (cleanData.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Create CSV content
      const headers = Object.keys(cleanData[0]);
      const csvContent = [
        headers.join(','),
        ...cleanData.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${config.title.replace(/\s+/g, '_')}_${timestamp}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`CSV file exported: ${filename}`);

    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV file');
    }
  };

  const renderStats = () => {
    if (!stats) return null;

    const statItems = [
      { label: 'Total Records', value: stats.total, icon: <FaDatabase /> },
      { label: 'Regions', value: stats.regions, icon: <FaChartBar /> },
      { label: 'Districts', value: stats.districts, icon: <FaFilter /> }
    ];

    // Add type-specific stats
    if (stats.crops) statItems.push({ label: 'Crops', value: stats.crops, icon: <FaLeaf /> });
    if (stats.seasons) statItems.push({ label: 'Seasons', value: stats.seasons, icon: <FaCalendarAlt /> });
    if (stats.commodities) statItems.push({ label: 'Commodities', value: stats.commodities, icon: <FaLeaf /> });
    if (stats.activities) statItems.push({ label: 'Activities', value: stats.activities, icon: <FaSync /> });
    if (stats.poultryTypes) statItems.push({ label: 'Poultry Types', value: stats.poultryTypes, icon: <FaEgg /> });

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {statItems.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl text-gray-400 mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{config.icon}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{config.title} Management</h2>
              <p className="text-gray-600">{config.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView("stats")}
              className={`px-4 py-2 rounded-md flex items-center ${
                activeView === "stats" 
                  ? "bg-purple-100 text-purple-700 border border-purple-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaChartBar className="mr-2" />
              Stats
            </button>
            
            <button
              onClick={() => setActiveView("upload")}
              className={`px-4 py-2 rounded-md flex items-center ${
                activeView === "upload" 
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaUpload className="mr-2" />
              Upload
            </button>
            
            <button
              onClick={() => setActiveView("table")}
              className={`px-4 py-2 rounded-md flex items-center ${
                activeView === "table" 
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaDatabase className="mr-2" />
              Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats View */}
      {activeView === "stats" && (
        <div>
          {renderStats()}
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  {data.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.region || item.district || 'Unknown'}</span>
                      <span className="text-gray-500">
                        {item.lastUpdated 
                          ? new Date(item.lastUpdated).toLocaleDateString()
                          : 'No date'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Data Quality</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Complete Records</span>
                    <span className="text-green-600">
                      {Math.round((data.filter(item => 
                        Object.values(item).filter(val => val !== null && val !== undefined && val !== '').length > 3
                      ).length / Math.max(data.length, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>With Locations</span>
                    <span className="text-blue-600">
                      {Math.round((data.filter(item => item.region && item.district).length / Math.max(data.length, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Recent Updates</span>
                    <span className="text-purple-600">
                      {data.filter(item => {
                        const updated = new Date(item.lastUpdated || item.createdAt || 0);
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return updated > weekAgo;
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload View */}
      {activeView === "upload" && (
        <EnhancedFileUploader
          dataType={dataType}
          title={config.title}
          acceptedTypes={config.acceptedTypes}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          allowMultiple={true}
          showTemplateDownload={true}
        />
      )}

      {/* Table View */}
      {activeView === "table" && (
        <UniversalDataTable
          data={data}
          columns={config.columns}
          title={config.title}
          loading={loading}
          error={error}
          onAdd={() => setActiveView("upload")}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          onExport={handleExport}
          showActions={true}
          showSearch={true}
          showFilter={true}
          showExport={true}
          showViewToggle={true}
          itemsPerPage={15}
        />
      )}

      {/* View Modal */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setViewModal({ isOpen: false, data: null })}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                <FaEye className="inline mr-2" />
                View {config.title}
              </h3>
              <button
                onClick={() => setViewModal({ isOpen: false, data: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewModal.data && Object.entries(viewModal.data).map(([key, value]) => {
                  if (key === 'id' || value === null || value === undefined) return null;

                  return (
                    <div key={key} className="border-b border-gray-200 pb-2">
                      <dt className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </dd>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setViewModal({ isOpen: false, data: null })}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewModal({ isOpen: false, data: null });
                  handleEdit(viewModal.data);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <FaEdit className="inline mr-1" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setEditModal({ isOpen: false, data: null })}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                <FaEdit className="inline mr-2" />
                Edit {config.title}
              </h3>
              <button
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                {editModal.data && Object.entries(editModal.data).map(([key, value]) => {
                  if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return null;

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      {typeof value === 'object' ? (
                        <textarea
                          value={JSON.stringify(editFormData[key] || value, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsedValue = JSON.parse(e.target.value);
                              setEditFormData(prev => ({ ...prev, [key]: parsedValue }));
                            } catch {
                              // Keep as string if invalid JSON
                              setEditFormData(prev => ({ ...prev, [key]: e.target.value }));
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                        />
                      ) : (
                        <input
                          type="text"
                          value={editFormData[key] || value || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FaSave className="inline mr-1" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ContentManagerHub.propTypes = {
  dataType: PropTypes.oneOf(['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory']).isRequired,
  onClose: PropTypes.func
};

export default ContentManagerHub;