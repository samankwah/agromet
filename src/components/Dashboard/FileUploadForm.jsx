import { useState } from "react";
import PropTypes from "prop-types";
import {
  FaUpload,
  FaFile,
  FaFilePdf,
  FaFileImage,
  FaFileCsv,
  FaFileAlt,
  FaFileExcel,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import userService from "../../services/userService";
import { validateFile, FileValidationError, formatFileSize } from "../../utils/fileValidation";
import { logger } from "../../utils/logger";

const FileUploadForm = ({ reportType, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // File types mapping (available for future use)
  // const fileTypes = {
  //   pdf: [".pdf"],
  //   image: [".jpg", ".jpeg", ".png", ".gif"],
  //   csv: [".csv"],
  //   txt: [".txt"],
  //   excel: [".xlsx", ".xls"],
  // };

  // Get report specific title
  const getReportTitle = () => {
    return reportType || "File Upload";
  };

  // Get file icon based on extension
  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile />;

    const extension = fileName.split(".").pop().toLowerCase();

    if (["pdf"].includes(extension))
      return <FaFilePdf className="text-red-500" />;
    if (["jpg", "jpeg", "png", "gif"].includes(extension))
      return <FaFileImage className="text-blue-500" />;
    if (["csv"].includes(extension))
      return <FaFileCsv className="text-green-500" />;
    if (["txt"].includes(extension))
      return <FaFileAlt className="text-gray-500" />;
    if (["xlsx", "xls"].includes(extension))
      return <FaFileExcel className="text-green-700" />;

    return <FaFile />;
  };

  // Handle file change with validation
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      logger.userAction('File selected for upload', { 
        filename: selectedFile.name, 
        size: selectedFile.size 
      });

      // Validate file
      const validation = validateFile(selectedFile);
      
      setFile(selectedFile);
      setErrorMessage("");
      
      logger.info('File validation passed', validation);
      
    } catch (error) {
      if (error instanceof FileValidationError) {
        setErrorMessage(error.message);
        logger.warn('File validation failed', { 
          error: error.message, 
          code: error.code,
          filename: selectedFile.name 
        });
      } else {
        setErrorMessage('An unexpected error occurred during file validation');
        logger.error('Unexpected file validation error', error);
      }
      setFile(null);
    }
  };

  // Get agricultural data type mapping
  const getAgriculturalDataType = (reportType) => {
    const mapping = {
      "Crop Calendar Data": "crop-calendar",
      "Agromet Advisory Data": "agromet-advisory", 
      "Production Calendar Data": "production-calendar",
      "Poultry Calendar Data": "poultry-calendar"
    };
    return mapping[reportType] || null;
  };

  // Check if this is an agricultural data upload
  const isAgriculturalUpload = () => {
    return getAgriculturalDataType(reportType) !== null;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setErrorMessage("Please select a file to upload");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Please enter a title");
      return;
    }

    // File validation is already done in handleFileChange, no need to re-validate here
    logger.userAction('Upload form submitted', { 
      filename: file.name, 
      title: title.trim(),
      reportType: reportType 
    });

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setUploadProgress(0);

    try {
      // Prepare file data for upload
      const fileData = {
        file: file,
        title: title.trim(),
        description: description.trim(),
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      };

      let result;

      // Use agricultural data upload service for agricultural data
      if (isAgriculturalUpload()) {
        const dataType = getAgriculturalDataType(reportType);
        result = await userService.uploadAgriculturalData(
          fileData,
          dataType,
          (progress) => {
            setUploadProgress(progress);
          }
        );
      } else {
        // Use regular file upload service for other types
        result = await userService.uploadFile(
          fileData,
          reportType,
          (progress) => {
            setUploadProgress(progress);
          }
        );
      }

      if (result.success) {
        const recordCount = result.data?.recordCount || result.data?.data?.length || 0;
        setSuccessMessage(
          `File "${file.name}" uploaded successfully! ${recordCount > 0 ? `Processed ${recordCount} records.` : ''}`
        );

        // Reset form after successful upload
        setTimeout(() => {
          setFile(null);
          setTitle("");
          setDescription("");
          setTags("");
          setUploadProgress(0);

          // Notify parent component
          if (onUploadSuccess) {
            onUploadSuccess({
              ...result.data,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              reportType: reportType,
              title: title,
              description: description,
              uploadDate: new Date().toISOString(),
              recordCount: recordCount,
              dataType: isAgriculturalUpload() ? getAgriculturalDataType(reportType) : 'general'
            });
          }
        }, 2000);
      } else {
        const errorMsg = result.error || "Upload failed. Please try again.";
        setErrorMessage(errorMsg);
        logger.error('Upload failed', { error: errorMsg, reportType, filename: file.name });
      }
    } catch (error) {
      const errorMsg = "Network error occurred. Please check your connection and try again.";
      setErrorMessage(errorMsg);
      logger.error('Network error during upload', { 
        error: error.message, 
        reportType, 
        filename: file.name 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Upload {getReportTitle()}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File (PDF, Image, CSV, TXT, Excel)
            {isAgriculturalUpload() && (
              <span className="text-green-600 text-sm block mt-1">
                • Upload Excel/CSV files containing agricultural data
                <br />• Use the template to ensure proper format
              </span>
            )}
          </label>

          <div className="flex items-center justify-center w-full">
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-green-700 rounded-lg shadow-lg tracking-wide border border-green-700 border-dashed cursor-pointer hover:bg-green-50">
              {file ? (
                <div className="flex items-center">
                  {getFileIcon(file.name)}
                  <span className="ml-2 text-sm">{file.name}</span>
                </div>
              ) : (
                <>
                  <FaUpload className="w-8 h-8" />
                  <span className="mt-2 text-base">
                    Drag and drop or click to select
                  </span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.csv,.txt,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>

          {file && (
            <div className="mt-2 text-xs text-gray-500">
              <p>{formatFileSize(file.size)}</p>
              <p className="text-green-600">✓ File validated successfully</p>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter file title"
            disabled={isUploading}
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description (optional)"
            rows="3"
            disabled={isUploading}
          />
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas (optional)"
            disabled={isUploading}
          />
          <p className="mt-1 text-xs text-gray-500">
            e.g., weather, forecast, agriculture
          </p>
        </div>

        {/* Upload Progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 mr-2" />
              <span className="text-green-700 text-sm">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading}
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <FaSpinner className="animate-spin mr-2" />
              Uploading...
            </span>
          ) : (
            "Upload File"
          )}
        </button>
      </form>
    </div>
  );
};

FileUploadForm.propTypes = {
  reportType: PropTypes.string.isRequired,
  onUploadSuccess: PropTypes.func,
};

export default FileUploadForm;
