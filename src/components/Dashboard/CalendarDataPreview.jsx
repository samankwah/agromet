import { useState, useEffect } from "react";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaPlus,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import PropTypes from "prop-types";
import userService from "../../services/userService";
import { safeRender, safeRenderForCard } from "../../utils/renderUtils";

const CalendarDataPreview = ({ dataType, title, onAddNew }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'

  useEffect(() => {
    loadData();
  }, [dataType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await userService.getAgriculturalData(dataType);
      if (result.success) {
        // Ensure data is always an array with defensive programming
        const responseData = result.data || [];
        const finalData = Array.isArray(responseData) ? responseData : [];
        setData(finalData);
      } else {
        setError(result.error || "Failed to load data");
        setData([]); // Ensure empty array on error
      }
    } catch (err) {
      console.error('CalendarDataPreview loadData error:', err);
      setError(err.message || "An error occurred while loading data");
      setData([]); // Ensure empty array on exception
    } finally {
      setLoading(false);
    }
  };

  // Ensure data is always an array before filtering
  const safeData = Array.isArray(data) ? data : [];

  const filteredData = safeData.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      Object.values(item).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesRegion =
      selectedRegion === "" || item.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const uniqueRegions = [...new Set(safeData.map((item) => item.region))];

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await userService.deleteAgriculturalData(dataType, id);
        loadData();
      } catch (err) {
        console.error("Error deleting record:", err);
      }
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading calendar data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Data
            </h3>
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
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title} Data</h3>
            <p className="text-sm text-gray-500">
              {filteredData.length} records found
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onAddNew}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <FaPlus className="mr-2" />
              Add New
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={filteredData.length === 0}
            >
              <FaDownload className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
<div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Regions</option>
              {uniqueRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded ${
                viewMode === "table"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1 rounded ${
                viewMode === "card"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Cards
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500 mb-4">
            No {title.toLowerCase()} data has been uploaded yet.
          </p>
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center mx-auto"
          >
            <FaPlus className="mr-2" />
            Create Your First {title}
          </button>
        </div>
      ) : viewMode === "table" ? (
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
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
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
                    {Object.entries(item).map(([key, value]) => (
                      <td
                        key={key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {key === "region" && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {safeRender(value)}
                          </span>
                        )}
                        {key === "crop" || key === "poultryType" ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {safeRender(value)}
                          </span>
                        ) : (
                          key !== "region" && <span>{safeRender(value)}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => console.log("View details:", item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => console.log("Edit:", item)}
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
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                  {filteredData.length} results
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
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
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
              <div
                key={item.id || index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {item.crop || item.poultryType || "Unknown"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.region} - {item.district}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => console.log("View details:", item)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => console.log("Edit:", item)}
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
                    .filter(
                      ([key]) =>
                        ![
                          "id",
                          "crop",
                          "poultryType",
                          "region",
                          "district",
                        ].includes(key)
                    )
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                          :
                        </span>
                        <span>{safeRenderForCard(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination for Card View */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                  {filteredData.length} results
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    return startPage + i;
                  }).map((page) => (
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
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
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

CalendarDataPreview.propTypes = {
  dataType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  onAddNew: PropTypes.func.isRequired,
};

export default CalendarDataPreview;
