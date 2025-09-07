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
  FaEgg
} from "react-icons/fa";
import UniversalDataTable from "./UniversalDataTable";
import EnhancedFileUploader from "./EnhancedFileUploader";
import userService from "../../services/userService";
import { logger } from "../../utils/logger";

const ContentManagerHub = ({ dataType, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("table"); // "table", "upload", "stats"
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    
    // Show success notification
    setTimeout(() => {
      setActiveView("table");
    }, 2000);
  };

  const handleUploadError = (error) => {
    logger.error('File upload failed', error);
  };

  const handleView = (row) => {
    logger.userAction('View data record', { dataType, id: row.id });
    // TODO: Implement view modal
    console.log('View:', row);
  };

  const handleEdit = (row) => {
    logger.userAction('Edit data record', { dataType, id: row.id });
    // TODO: Implement edit modal
    console.log('Edit:', row);
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
      // TODO: Implement Excel export via backend
      console.log('Export to Excel:', exportData);
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
    </div>
  );
};

ContentManagerHub.propTypes = {
  dataType: PropTypes.oneOf(['crop-calendar', 'agromet-advisory', 'poultry-calendar', 'poultry-advisory']).isRequired,
  onClose: PropTypes.func
};

export default ContentManagerHub;