import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaPlus,
  FaTable,
  FaTh,
  FaFileCsv,
  FaFileExcel,
  FaFilePdf,
  FaRefresh,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { safeRender, safeRenderForCard } from "../../utils/renderUtils";

const UniversalDataTable = ({
  data = [],
  columns = [],
  title = "Data Table",
  loading = false,
  error = null,
  onAdd = null,
  onView = null,
  onEdit = null,
  onDelete = null,
  onRefresh = null,
  onExport = null,
  showActions = true,
  showSearch = true,
  showFilter = true,
  showExport = true,
  showViewToggle = true,
  itemsPerPage = 10,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Auto-generate columns from data if not provided
  const tableColumns = useMemo(() => {
    if (columns.length > 0) return columns;
    if (data.length === 0) return [];

    const firstRow = data[0];
    return Object.keys(firstRow).map(key => ({
      key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      sortable: true,
      filterable: true,
      render: (value) => safeRender(value)
    }));
  }, [data, columns]);

  // Get unique values for each filterable column
  const filterOptions = useMemo(() => {
    const options = {};
    tableColumns.forEach(column => {
      if (column.filterable) {
        const uniqueValues = [...new Set(data.map(row => row[column.key]))]
          .filter(val => val !== null && val !== undefined && val !== "")
          .sort();
        options[column.key] = uniqueValues;
      }
    });
    return options;
  }, [data, tableColumns]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row => row[key] === value);
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, selectedFilters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilters, sortConfig]);

  // Sorting
  const handleSort = (columnKey) => {
    setSortConfig(prevSort => ({
      key: columnKey,
      direction: 
        prevSort.key === columnKey && prevSort.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }));
  };

  // Filters
  const handleFilterChange = (columnKey, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [columnKey]: value || undefined
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setSearchTerm("");
  };

  // Row selection
  const toggleRowSelection = (rowId) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
      } else {
        newSelection.add(rowId);
      }
      return newSelection;
    });
  };

  const selectAllRows = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id || row.uniqueId)));
    }
  };

  // Export functions
  const handleExportCSV = () => {
    if (processedData.length === 0) return;

    const headers = tableColumns.map(col => col.label);
    const csvContent = [
      headers.join(","),
      ...processedData.map(row =>
        tableColumns.map(col => `"${row[col.key] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "_")}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (onExport) {
      onExport('excel', processedData);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-600">Loading {title.toLowerCase()}...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded flex items-center"
                  >
                    <FaRefresh className="mr-1" />
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {processedData.length} record{processedData.length !== 1 ? 's' : ''} found
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onAdd && (
              <button
                onClick={onAdd}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <FaPlus className="mr-2" />
                Add New
              </button>
            )}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
              >
                <FaRefresh />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          {showSearch && (
            <div className="flex items-center space-x-2 flex-1">
              <FaSearch className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {/* Column Filters */}
          {showFilter && Object.keys(filterOptions).length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <FaFilter className="text-gray-400 flex-shrink-0" />
              {Object.entries(filterOptions).slice(0, 3).map(([columnKey, options]) => {
                const column = tableColumns.find(col => col.key === columnKey);
                return (
                  <select
                    key={columnKey}
                    value={selectedFilters[columnKey] || ''}
                    onChange={(e) => handleFilterChange(columnKey, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All {column?.label || columnKey}</option>
                    {options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                );
              })}
              
              {(searchTerm || Object.keys(selectedFilters).some(key => selectedFilters[key])) && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* View Toggle and Export */}
          <div className="flex items-center space-x-2">
            {showViewToggle && (
              <div className="flex items-center space-x-1 border border-gray-300 rounded-md p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded ${
                    viewMode === "table" 
                      ? "bg-green-100 text-green-600" 
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <FaTable />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-2 rounded ${
                    viewMode === "card" 
                      ? "bg-green-100 text-green-600" 
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <FaTh />
                </button>
              </div>
            )}

            {showExport && processedData.length > 0 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleExportCSV}
                  className="p-2 text-gray-600 hover:text-green-600 border border-gray-300 rounded-md"
                  title="Export CSV"
                >
                  <FaFileCsv />
                </button>
                {onExport && (
                  <button
                    onClick={handleExportExcel}
                    className="p-2 text-gray-600 hover:text-green-600 border border-gray-300 rounded-md"
                    title="Export Excel"
                  >
                    <FaFileExcel />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Display */}
      {processedData.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="text-gray-400 mb-4">
            <FaTable className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-4">
            {data.length === 0 
              ? `No ${title.toLowerCase()} data has been uploaded yet.`
              : "No data matches your current filters."
            }
          </p>
          {onAdd && data.length === 0 && (
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center mx-auto"
            >
              <FaPlus className="mr-2" />
              Add First Record
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedRows.size > 0 && (
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === paginatedData.length}
                          onChange={selectAllRows}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </th>
                    )}
                    {tableColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.sortable && (
                            <button
                              onClick={() => handleSort(column.key)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {sortConfig.key === column.key ? (
                                sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                              ) : (
                                <FaSort />
                              )}
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    {showActions && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((row, index) => {
                    const rowId = row.id || row.uniqueId || index;
                    return (
                      <tr 
                        key={rowId} 
                        className={`hover:bg-gray-50 ${
                          selectedRows.has(rowId) ? 'bg-green-50' : ''
                        }`}
                      >
                        {selectedRows.size > 0 && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(rowId)}
                              onChange={() => toggleRowSelection(rowId)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </td>
                        )}
                        {tableColumns.map((column) => (
                          <td
                            key={column.key}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {column.render 
                              ? column.render(row[column.key], row) 
                              : safeRender(row[column.key])
                            }
                          </td>
                        ))}
                        {showActions && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {onView && (
                                <button
                                  onClick={() => onView(row)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                              )}
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(row)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(row)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {paginatedData.map((row, index) => {
                const rowId = row.id || row.uniqueId || index;
                return (
                  <div
                    key={rowId}
                    className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                      selectedRows.has(rowId) ? 'border-green-300 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {selectedRows.size > 0 && (
                            <input
                              type="checkbox"
                              checked={selectedRows.has(rowId)}
                              onChange={() => toggleRowSelection(rowId)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          )}
                          <h4 className="font-semibold text-gray-900 flex-1">
                            {row[tableColumns[0]?.key] || 'Item'}
                          </h4>
                        </div>
                        {tableColumns[1] && (
                          <p className="text-sm text-gray-600 mt-1">
                            {safeRenderForCard(row[tableColumns[1].key])}
                          </p>
                        )}
                      </div>
                      
                      {showActions && (
                        <div className="flex space-x-1 ml-2">
                          {onView && (
                            <button
                              onClick={() => onView(row)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="text-yellow-600 hover:text-yellow-900 p-1"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      {tableColumns.slice(2, 5).map((column) => (
                        <div key={column.key} className="flex justify-between">
                          <span className="font-medium">{column.label}:</span>
                          <span className="text-right">
                            {column.render 
                              ? column.render(row[column.key], row) 
                              : safeRenderForCard(row[column.key])
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, processedData.length)} of{" "}
                  {processedData.length} results
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center"
                  >
                    <FaChevronLeft className="mr-1" />
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    const page = startPage + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded-md ${
                          currentPage === page
                            ? "bg-green-500 text-white border-green-500"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center"
                  >
                    Next
                    <FaChevronRight className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

UniversalDataTable.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    sortable: PropTypes.bool,
    filterable: PropTypes.bool,
    render: PropTypes.func
  })),
  title: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onAdd: PropTypes.func,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRefresh: PropTypes.func,
  onExport: PropTypes.func,
  showActions: PropTypes.bool,
  showSearch: PropTypes.bool,
  showFilter: PropTypes.bool,
  showExport: PropTypes.bool,
  showViewToggle: PropTypes.bool,
  itemsPerPage: PropTypes.number,
  className: PropTypes.string
};

export default UniversalDataTable;