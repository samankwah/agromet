import { useState, useRef, useCallback } from "react";
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
  FaDownload,
  FaTimes,
  FaPlus,
  FaTrash,
  FaEye
} from "react-icons/fa";
import userService from "../../services/userService";
import { validateFile, FileValidationError, formatFileSize } from "../../utils/fileValidation";
import { logger } from "../../utils/logger";

const EnhancedFileUploader = ({ 
  dataType, 
  title, 
  onUploadSuccess, 
  onUploadError,
  acceptedTypes = [".xlsx", ".xls", ".csv"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowMultiple = false,
  showTemplateDownload = true,
  className = ""
}) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadResults, setUploadResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Get file icon based on extension
  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile />;
    const extension = fileName.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf": return <FaFilePdf className="text-red-500" />;
      case "jpg": case "jpeg": case "png": case "gif": 
        return <FaFileImage className="text-blue-500" />;
      case "csv": return <FaFileCsv className="text-green-500" />;
      case "txt": return <FaFileAlt className="text-gray-500" />;
      case "xlsx": case "xls": return <FaFileExcel className="text-green-700" />;
      default: return <FaFile />;
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Validate and add files
  const handleFiles = (newFiles) => {
    const validFiles = [];
    const newErrors = [];

    newFiles.forEach((file, index) => {
      try {
        // Check file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!acceptedTypes.some(type => type.replace('.', '') === extension)) {
          throw new FileValidationError(
            `File type .${extension} not supported. Accepted types: ${acceptedTypes.join(', ')}`,
            'INVALID_TYPE'
          );
        }

        // Check file size
        if (file.size > maxFileSize) {
          throw new FileValidationError(
            `File size (${formatFileSize(file.size)}) exceeds limit (${formatFileSize(maxFileSize)})`,
            'FILE_TOO_LARGE'
          );
        }

        // Check if file already added
        if (files.some(f => f.name === file.name && f.size === file.size)) {
          throw new FileValidationError('File already added', 'DUPLICATE');
        }

        validFiles.push({
          id: `${Date.now()}-${index}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'ready'
        });

        logger.info('File validated and added', { filename: file.name, size: file.size });

      } catch (error) {
        const fileError = {
          id: `error-${Date.now()}-${index}`,
          filename: file.name,
          message: error.message,
          type: 'validation'
        };
        newErrors.push(fileError);
        logger.warn('File validation failed', fileError);
      }
    });

    if (allowMultiple) {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
    }

    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
      setTimeout(() => {
        setErrors(prev => prev.filter(err => !newErrors.includes(err)));
      }, 5000);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await userService.downloadTemplate(dataType);
      if (response.success) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dataType}-template.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        logger.userAction('Template downloaded', { dataType });
      }
    } catch (error) {
      logger.error('Template download failed', error);
      setErrors(prev => [...prev, {
        id: `template-error-${Date.now()}`,
        message: 'Failed to download template',
        type: 'download'
      }]);
    }
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadResults([]);
    const results = [];

    for (const fileItem of files) {
      try {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading' } : f
        ));

        const result = await userService.uploadAgriculturalData(
          {
            file: fileItem.file,
            title: fileItem.name.replace(/\.[^/.]+$/, ""), // Remove extension
            description: `${title} data upload`,
            tags: [dataType, title.toLowerCase()]
          },
          dataType,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileItem.id]: progress
            }));
          }
        );

        if (result.success) {
          const uploadResult = {
            id: fileItem.id,
            filename: fileItem.name,
            status: 'success',
            recordCount: result.data?.recordCount || 0,
            message: `Successfully processed ${result.data?.recordCount || 0} records`
          };
          results.push(uploadResult);

          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, status: 'success' } : f
          ));

          logger.userAction('File uploaded successfully', uploadResult);

          if (onUploadSuccess) {
            onUploadSuccess({
              ...result.data,
              filename: fileItem.name,
              dataType,
              uploadDate: new Date().toISOString()
            });
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }

      } catch (error) {
        const uploadError = {
          id: fileItem.id,
          filename: fileItem.name,
          status: 'error',
          message: error.message
        };
        results.push(uploadError);

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' } : f
        ));

        logger.error('File upload failed', uploadError);

        if (onUploadError) {
          onUploadError(uploadError);
        }
      }
    }

    setUploadResults(results);
    setUploading(false);

    // Clear successful uploads after delay
    setTimeout(() => {
      setFiles(prev => prev.filter(f => f.status !== 'success'));
      setUploadProgress({});
    }, 3000);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Upload {title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload Excel/CSV files containing {title.toLowerCase()} data
            </p>
          </div>
          
          {showTemplateDownload && (
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaDownload className="mr-2" />
              Download Template
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div className="p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-green-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={allowMultiple}
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <FaUpload className="w-full h-full" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {dragActive ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-sm text-gray-600">
                or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  browse to select
                </button>
              </p>
            </div>

            <div className="text-xs text-gray-500">
              <p>Accepted formats: {acceptedTypes.join(', ')}</p>
              <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
              {allowMultiple && <p>Multiple files allowed</p>}
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Files to Upload ({files.length})
            </h4>
            
            <div className="space-y-2">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0 mr-3">
                      {getFileIcon(fileItem.name)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileItem.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileItem.size)}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0 ml-4">
                      {fileItem.status === 'uploading' && (
                        <div className="flex items-center">
                          <FaSpinner className="animate-spin text-blue-500 mr-2" />
                          <span className="text-xs text-blue-600">
                            {uploadProgress[fileItem.id] || 0}%
                          </span>
                        </div>
                      )}
                      {fileItem.status === 'success' && (
                        <FaCheckCircle className="text-green-500" />
                      )}
                      {fileItem.status === 'error' && (
                        <FaExclamationTriangle className="text-red-500" />
                      )}
                    </div>
                  </div>

                  {fileItem.status === 'ready' && (
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading files...</span>
                  <span>
                    {files.filter(f => f.status === 'success').length} of {files.length} completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(files.filter(f => f.status === 'success').length / files.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading || files.every(f => f.status !== 'ready')}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Upload {files.length} File{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mt-6 space-y-2">
            {errors.map((error) => (
              <div
                key={error.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md"
              >
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {error.filename || 'Error'}
                    </p>
                    <p className="text-xs text-red-600">{error.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => setErrors(prev => prev.filter(e => e.id !== error.id))}
                  className="text-red-400 hover:text-red-600"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Upload Results</h4>
            <div className="space-y-2">
              {uploadResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 rounded-md ${
                    result.status === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center">
                    {result.status === 'success' ? (
                      <FaCheckCircle className="text-green-500 mr-2" />
                    ) : (
                      <FaExclamationTriangle className="text-red-500 mr-2" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${
                        result.status === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.filename}
                      </p>
                      <p className={`text-xs ${
                        result.status === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

EnhancedFileUploader.propTypes = {
  dataType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  onUploadSuccess: PropTypes.func,
  onUploadError: PropTypes.func,
  acceptedTypes: PropTypes.arrayOf(PropTypes.string),
  maxFileSize: PropTypes.number,
  allowMultiple: PropTypes.bool,
  showTemplateDownload: PropTypes.bool,
  className: PropTypes.string
};

export default EnhancedFileUploader;