import { useState, useEffect } from 'react';
import { 
  FaFileUpload, 
  FaDownload, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaPlus,
  FaTable,
  FaTh
} from 'react-icons/fa';
import userService from '../../services/userService';
import TemplateGenerationService from '../../services/templateGenerationService';
import { safeRender, safeRenderForCard } from '../../utils/renderUtils';
import AgrometAdvisoryUpload from './AgrometAdvisoryUpload';
import { GHANA_REGIONS, COMMODITY_CODES, getRegionByCode, getDistrictByCode, getCommodityByCode } from '../../data/ghanaCodes';

const AgrometAdvisoryManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegionCode, setSelectedRegionCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedCommodityCode, setSelectedCommodityCode] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('table');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await userService.getAgriculturalData('agromet-advisory');
      if (result.success) {
        setData(result.data || []);
      } else {
        setError('Failed to load agromet advisory data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  // Update available districts when region changes
  useEffect(() => {
    if (selectedRegionCode) {
      const region = getRegionByCode(selectedRegionCode);
      if (region) {
        setAvailableDistricts(Object.entries(region.districts).map(([code, name]) => ({ code, name })));
        setSelectedDistrictCode(''); // Reset district when region changes
      }
    } else {
      setAvailableDistricts([]);
      setSelectedDistrictCode('');
    }
  }, [selectedRegionCode]);

  // Filter data based on search and filter criteria with unique codes
  const filteredData = data.filter(item => {
    const matchesSearch = searchTerm === '' || 
      Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesRegion = selectedRegionCode === '' || item.regionCode === selectedRegionCode;
    const matchesDistrict = selectedDistrictCode === '' || item.districtCode === selectedDistrictCode;
    const matchesCommodity = selectedCommodityCode === '' || item.commodityCode === selectedCommodityCode;
    const matchesActivity = selectedActivity === '' || item.activity === selectedActivity;
    
    return matchesSearch && matchesRegion && matchesDistrict && matchesCommodity && matchesActivity;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // Get unique values for filters from codes
  const uniqueRegionCodes = [...new Set(data.map(item => item.regionCode).filter(Boolean))];
  const uniqueDistrictCodes = [...new Set(data.map(item => item.districtCode).filter(Boolean))];
  const uniqueCommodityCodes = [...new Set(data.map(item => item.commodityCode).filter(Boolean))];
  const uniqueActivities = [...new Set(data.map(item => item.activity).filter(Boolean))];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', 'agromet-advisory');

      // Simulate progress for multi-sheet processing
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await userService.uploadAgriculturalData(formData, 'agromet-advisory', (progress) => {
        setUploadProgress(progress);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        await loadData();
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file: ' + err.message);
      setUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleDownloadTemplate = () => {
    try {
      TemplateGenerationService.downloadTemplate('agromet-advisory', {
        crop: 'Tomato',
        region: 'Greater Accra Region',
        district: 'La-Dade-Kotopon'
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error generating template. Please try again.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRegionCode('');
    setSelectedDistrictCode('');
    setSelectedCommodityCode('');
    setSelectedActivity('');
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this advisory?')) {
      try {
        await userService.deleteAgriculturalData('agromet-advisory', id);
        loadData();
      } catch (err) {
        console.error('Error deleting advisory:', err);
      }
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agromet_advisory_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadSuccess = (result) => {
    setShowUploadModal(false);
    loadData(); // Refresh the data after successful upload
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading agromet advisory data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Agromet Advisory Management</h3>
            <p className="text-sm text-gray-500">
              {filteredData.length} advisories found from {data.length} total records
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
            >
              <FaDownload className="mr-2" />
              Download Template
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center cursor-pointer">
              <FaFileUpload className="mr-2" />
              Upload Multi-Sheet Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
              disabled={filteredData.length === 0}
            >
              <FaDownload className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="px-4 sm:px-6 py-4 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-blue-700 mb-1">
                <span>Uploading multi-sheet Excel file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <FaSearch className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
          
          {/* Region Filter */}
          <select
            value={selectedRegionCode}
            onChange={(e) => setSelectedRegionCode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="">All Regions</option>
            {Object.values(GHANA_REGIONS).map(region => (
              <option key={region.code} value={region.code}>{region.code} - {region.name}</option>
            ))}
          </select>

          {/* District Filter */}
          <select
            value={selectedDistrictCode}
            onChange={(e) => setSelectedDistrictCode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            disabled={!selectedRegionCode}
          >
            <option value="">All Districts</option>
            {availableDistricts.map(district => (
              <option key={district.code} value={district.code}>{district.code} - {district.name}</option>
            ))}
          </select>

          {/* Commodity Filter */}
          <select
            value={selectedCommodityCode}
            onChange={(e) => setSelectedCommodityCode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="">All Commodities</option>
            {Object.entries(COMMODITY_CODES).map(([code, name]) => (
              <option key={code} value={code}>{code} - {name}</option>
            ))}
          </select>

          {/* Activity Filter */}
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="">All Activities</option>
            {uniqueActivities.map(activity => (
              <option key={activity} value={activity}>{activity}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >
            Clear Filters
          </button>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
            >
              <FaTable />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded ${viewMode === 'card' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
            >
              <FaTh />
            </button>
          </div>
        </div>
      </div>

      {/* Data Display */}
      {filteredData.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="text-gray-400 mb-4">
            <FaEye className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Advisory Data Available</h3>
          <p className="text-gray-500 mb-4">
            No agromet advisory data has been uploaded yet. Upload a multi-sheet Excel file to get started.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center mx-auto"
          >
            <FaPlus className="mr-2" />
            Upload Your First Advisory File
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(paginatedData[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    {Object.entries(item).map(([key, value]) => {
                      // Handle display with codes
                      let displayValue = value;
                      let className = "";
                      
                      if (key === 'regionCode') {
                        const region = getRegionByCode(value);
                        displayValue = region ? `${value} - ${region.name}` : value;
                        className = "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800";
                      } else if (key === 'districtCode') {
                        const district = getDistrictByCode(value);
                        displayValue = district ? `${value} - ${district.name}` : value;
                        className = "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800";
                      } else if (key === 'commodityCode') {
                        const commodity = getCommodityByCode(value);
                        displayValue = commodity ? `${value} - ${commodity}` : value;
                        className = "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800";
                      } else if (key === 'activity') {
                        className = "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800";
                      }
                      
                      return (
                        <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {className ? (
                            <span className={className}>
                              {safeRender(displayValue)}
                            </span>
                          ) : (
                            <span>
                              {safeRender(displayValue)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => console.log('View details:', item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => console.log('Edit:', item)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    return startPage + i;
                  }).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        currentPage === page 
                          ? 'bg-green-500 text-white border-green-500' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Card View */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {paginatedData.map((item, index) => (
              <div key={item.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {item.commodityCode ? getCommodityByCode(item.commodityCode) || 'Unknown Commodity' : 'Unknown Commodity'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.regionCode && getRegionByCode(item.regionCode)?.name} - {item.districtCode && getDistrictByCode(item.districtCode)?.name}
                    </p>
                    <p className="text-sm text-purple-600 font-medium">{item.activity}</p>
                    <p className="text-xs text-gray-500">ID: {item.uniqueId || item.id}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => console.log('View details:', item)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => console.log('Edit:', item)}
                      className="text-yellow-600 hover:text-yellow-900 p-1"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  {Object.entries(item)
                    .filter(([key]) => !['id', 'uniqueId', 'regionCode', 'districtCode', 'commodityCode', 'activity'].includes(key))
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                        <span className="truncate ml-2">
                          {safeRenderForCard(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination for Card View */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    return startPage + i;
                  }).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        currentPage === page 
                          ? 'bg-green-500 text-white border-green-500' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      <AgrometAdvisoryUpload
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSave={handleUploadSuccess}
      />
    </div>
  );
};

export default AgrometAdvisoryManager;