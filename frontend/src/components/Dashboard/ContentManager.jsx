import { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaFilter,
  FaSearch,
  FaTable,
  FaList,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import PropTypes from "prop-types";
import userService from "../../services/userService";
import { safeRenderForTable, safeRenderForCard } from "../../utils/renderUtils";

const ContentManager = ({ dataType, title }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [viewMode, setViewMode] = useState("table"); // table or cards
  const [selectedItems, setSelectedItems] = useState([]);
  const [regions, setRegions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [dataType]);

  // Filter and sort data when dependencies change
  useEffect(() => {
    filterAndSortData();
  }, [data, searchTerm, filterRegion, sortField, sortDirection]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await userService.getAgriculturalData(dataType);
      if (result.success) {
        setData(result.data);
        
        // Extract unique regions for filtering
        const uniqueRegions = [...new Set(result.data.map(item => item.region))].filter(Boolean);
        setRegions(uniqueRegions);
        
        setPagination(prev => ({
          ...prev,
          total: result.data.length
        }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortData = () => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply region filter
    if (filterRegion) {
      filtered = filtered.filter(item => item.region === filterRegion);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      
      if (sortDirection === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    setFilteredData(filtered);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const result = await userService.deleteAgriculturalData(dataType, id);
        if (result.success) {
          setData(data.filter(item => item.id !== id));
          setSelectedItems(selectedItems.filter(item => item !== id));
          // Reload data to ensure consistency
          loadData();
        } else {
          alert("Failed to delete record: " + (result.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Error deleting record:", error);
        alert("Error deleting record. Please try again.");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected records?`)) {
      try {
        const deletePromises = selectedItems.map(id => 
          userService.deleteAgriculturalData(dataType, id)
        );
        const results = await Promise.all(deletePromises);
        
        // Check if all deletions were successful
        const failedDeletions = results.filter(result => !result.success);
        if (failedDeletions.length > 0) {
          alert(`${failedDeletions.length} records failed to delete. Please try again.`);
        } else {
          alert(`Successfully deleted ${selectedItems.length} records.`);
        }
        
        setData(data.filter(item => !selectedItems.includes(item.id)));
        setSelectedItems([]);
        // Reload data to ensure consistency
        loadData();
      } catch (error) {
        console.error("Error deleting records:", error);
        alert("Error deleting records. Please try again.");
      }
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map(item => item.id));
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => 
        headers.map(header => `"${row[header] || ""}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />;
  };

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
            </th>
            {filteredData.length > 0 && Object.keys(filteredData[0]).slice(0, 6).map(header => (
              <th
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort(header)}
              >
                <div className="flex items-center space-x-1">
                  <span>{header.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  {getSortIcon(header)}
                </div>
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit).map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="rounded border-gray-300"
                />
              </td>
              {Object.values(item).slice(0, 6).map((value, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {safeRenderForTable(value, 'truncated', 50)}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <FaEye />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
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
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredData.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit).map((item) => (
        <div key={item.id} className="bg-white border rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <input
              type="checkbox"
              checked={selectedItems.includes(item.id)}
              onChange={() => handleSelectItem(item.id)}
              className="rounded border-gray-300"
            />
            <div className="flex space-x-2">
              <button className="text-blue-600 hover:text-blue-900">
                <FaEye />
              </button>
              <button className="text-green-600 hover:text-green-900">
                <FaEdit />
              </button>
              <button 
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-900"
              >
                <FaTrash />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {Object.entries(item).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                </span>
                <span className="text-sm text-gray-900">
                  {safeRenderForCard(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title} Management</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {viewMode === "table" ? <FaList /> : <FaTable />}
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <FaTrash className="mr-2" />
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Display */}
      <div className="px-6 py-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No records found.</p>
          </div>
        ) : (
          <>
            {viewMode === "table" ? renderTableView() : renderCardView()}
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, filteredData.length)} of{" "}
                {filteredData.length} results
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(Math.ceil(filteredData.length / prev.limit), prev.page + 1) }))}
                  disabled={pagination.page >= Math.ceil(filteredData.length / pagination.limit)}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

ContentManager.propTypes = {
  dataType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export default ContentManager;