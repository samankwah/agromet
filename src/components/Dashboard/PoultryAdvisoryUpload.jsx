import { useState, useEffect } from 'react';
import { 
  FaFileUpload, 
  FaDownload, 
  FaEye, 
  FaTimes, 
  FaCheck,
  FaExclamationTriangle,
  FaInfo,
  FaChevronDown,
  FaChevronUp,
  FaTable,
  FaTh
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { GHANA_REGIONS, POULTRY_TYPES, generateUniqueId, getRegionByCode, getDistrictByCode, getPoultryTypeByCode, getBreedByCode } from '../../data/ghanaCodes';
import userService from '../../services/userService';
import TemplateGenerationService from '../../services/templateGenerationService';

const PoultryAdvisoryUpload = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    regionCode: '',
    districtCode: '',
    poultryTypeCode: '',
    breedCode: '',
    file: null,
    title: '',
    description: ''
  });

  const [uploadStep, setUploadStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [errors, setErrors] = useState({});
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableBreeds, setAvailableBreeds] = useState([]);
  const [parsedSheets, setParsedSheets] = useState([]);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [expandedSheets, setExpandedSheets] = useState({});

  // Update districts when region changes
  useEffect(() => {
    if (formData.regionCode) {
      const region = getRegionByCode(formData.regionCode);
      if (region) {
        setAvailableDistricts(Object.entries(region.districts).map(([code, name]) => ({ code, name })));
        setFormData(prev => ({ ...prev, districtCode: '' }));
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.regionCode]);

  // Update breeds when poultry type changes
  useEffect(() => {
    if (formData.poultryTypeCode) {
      const poultryType = getPoultryTypeByCode(formData.poultryTypeCode);
      if (poultryType) {
        setAvailableBreeds(Object.entries(poultryType.breeds).map(([code, name]) => ({ code, name })));
        setFormData(prev => ({ ...prev, breedCode: '' }));
      }
    } else {
      setAvailableBreeds([]);
    }
  }, [formData.poultryTypeCode]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = async (file) => {
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheets = [];
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const filteredData = jsonData.filter(row => row.some(cell => cell !== undefined && cell !== ''));
        
        if (filteredData.length > 0) {
          const headers = filteredData[0];
          const dataRows = filteredData.slice(1);
          
          sheets.push({
            name: sheetName,
            headers,
            data: dataRows,
            totalRows: dataRows.length,
            summary: generateSheetSummary(headers, dataRows)
          });
        }
      });

      setParsedSheets(sheets);
      setSelectedSheets(sheets.map(sheet => sheet.name));
      setFormData(prev => ({ ...prev, file }));
      
      if (sheets.length > 0) {
        setUploadStep(2);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      setErrors({ file: 'Error parsing Excel file. Please check the format.' });
    } finally {
      setLoading(false);
    }
  };

  const generateSheetSummary = (headers, data) => {
    const summary = {
      totalRecords: data.length,
      columns: headers.length,
      stages: new Set(),
      weeks: new Set(),
      healthActivities: new Set()
    };

    data.forEach(row => {
      headers.forEach((header, index) => {
        const value = row[index];
        if (value) {
          const headerLower = header.toString().toLowerCase();
          if (headerLower.includes('stage') || headerLower.includes('phase')) {
            summary.stages.add(value.toString());
          }
          if (headerLower.includes('week') || headerLower.includes('day')) {
            summary.weeks.add(value.toString());
          }
          if (headerLower.includes('health') || headerLower.includes('vaccine') || headerLower.includes('treatment')) {
            summary.healthActivities.add(value.toString());
          }
        }
      });
    });

    return {
      ...summary,
      stages: Array.from(summary.stages),
      weeks: Array.from(summary.weeks),
      healthActivities: Array.from(summary.healthActivities)
    };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.regionCode) newErrors.regionCode = 'Region is required';
    if (!formData.districtCode) newErrors.districtCode = 'District is required';
    if (!formData.poultryTypeCode) newErrors.poultryTypeCode = 'Poultry type is required';
    if (!formData.file) newErrors.file = 'File is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (selectedSheets.length === 0) newErrors.sheets = 'At least one sheet must be selected';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePreviewData = () => {
    if (!formData.regionCode || !formData.districtCode || !formData.poultryTypeCode) return null;

    const region = getRegionByCode(formData.regionCode);
    const district = getDistrictByCode(formData.districtCode);
    const poultryType = getPoultryTypeByCode(formData.poultryTypeCode);
    const breed = formData.breedCode ? getBreedByCode(formData.breedCode) : null;
    
    const uniqueId = generateUniqueId(formData.regionCode, formData.districtCode, formData.poultryTypeCode);

    return {
      uniqueId,
      regionCode: formData.regionCode,
      regionName: region?.name,
      districtCode: formData.districtCode,
      districtName: district?.name,
      poultryTypeCode: formData.poultryTypeCode,
      poultryTypeName: poultryType?.name,
      breedCode: formData.breedCode,
      breedName: breed?.name,
      title: formData.title,
      description: formData.description,
      totalSheets: selectedSheets.length,
      totalRecords: parsedSheets
        .filter(sheet => selectedSheets.includes(sheet.name))
        .reduce((sum, sheet) => sum + sheet.totalRows, 0),
      sheets: parsedSheets
        .filter(sheet => selectedSheets.includes(sheet.name))
        .map(sheet => ({
          name: sheet.name,
          summary: sheet.summary,
          sampleData: sheet.data.slice(0, 3)
        }))
    };
  };

  const handlePreview = () => {
    if (validateForm()) {
      const preview = generatePreviewData();
      setPreviewData(preview);
      setUploadStep(3);
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !previewData) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const formDataToSubmit = new FormData();
      
      formDataToSubmit.append('uniqueId', previewData.uniqueId);
      formDataToSubmit.append('regionCode', formData.regionCode);
      formDataToSubmit.append('districtCode', formData.districtCode);
      formDataToSubmit.append('poultryTypeCode', formData.poultryTypeCode);
      formDataToSubmit.append('breedCode', formData.breedCode);
      formDataToSubmit.append('title', formData.title);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('selectedSheets', JSON.stringify(selectedSheets));
      formDataToSubmit.append('file', formData.file);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await userService.uploadAgriculturalData(formDataToSubmit, 'poultry-advisory', (progress) => {
        setUploadProgress(progress);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        onSave(result.data);
        setTimeout(() => {
          handleReset();
          onClose();
        }, 1000);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ submit: 'Failed to upload file: ' + error.message });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setFormData({
      regionCode: '',
      districtCode: '',
      poultryTypeCode: '',
      breedCode: '',
      file: null,
      title: '',
      description: ''
    });
    setUploadStep(1);
    setParsedSheets([]);
    setSelectedSheets([]);
    setPreviewData(null);
    setErrors({});
    setUploadProgress(0);
  };

  const handleDownloadTemplate = () => {
    try {
      TemplateGenerationService.downloadTemplate('poultry-advisory', {
        poultryType: formData.poultryTypeCode ? getPoultryTypeByCode(formData.poultryTypeCode)?.name : 'Broiler',
        breed: formData.breedCode ? getBreedByCode(formData.breedCode)?.name : 'Cobb 500',
        region: formData.regionCode ? getRegionByCode(formData.regionCode)?.name : 'Greater Accra Region',
        district: formData.districtCode ? getDistrictByCode(formData.districtCode)?.name : 'Accra Metropolitan'
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error generating template. Please try again.');
    }
  };

  const toggleSheetExpansion = (sheetName) => {
    setExpandedSheets(prev => ({
      ...prev,
      [sheetName]: !prev[sheetName]
    }));
  };

  const toggleSheetSelection = (sheetName) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(name => name !== sheetName)
        : [...prev, sheetName]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-screen sm:max-h-[95vh] overflow-y-auto mt-2 sm:mt-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Poultry Advisory</h2>
            <div className="flex flex-wrap items-center mt-2 gap-2 sm:gap-4">
              <div className={`flex items-center text-sm ${uploadStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-semibold ${uploadStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
                Select & Upload
              </div>
              <div className={`flex items-center text-sm ${uploadStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-semibold ${uploadStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
                Preview Data
              </div>
              <div className={`flex items-center text-sm ${uploadStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-semibold ${uploadStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
                Confirm & Save
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Step 1: Select & Upload */}
          {uploadStep === 1 && (
            <div className="space-y-6">
              {/* Location and Poultry Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.regionCode}
                    onChange={(e) => handleInputChange('regionCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.regionCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Region...</option>
                    {Object.values(GHANA_REGIONS).map(region => (
                      <option key={region.code} value={region.code}>
                        {region.code} - {region.name}
                      </option>
                    ))}
                  </select>
                  {errors.regionCode && <p className="text-red-500 text-xs mt-1">{errors.regionCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.districtCode}
                    onChange={(e) => handleInputChange('districtCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.districtCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!formData.regionCode}
                  >
                    <option value="">Select District...</option>
                    {availableDistricts.map(district => (
                      <option key={district.code} value={district.code}>
                        {district.code} - {district.name}
                      </option>
                    ))}
                  </select>
                  {errors.districtCode && <p className="text-red-500 text-xs mt-1">{errors.districtCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poultry Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.poultryTypeCode}
                    onChange={(e) => handleInputChange('poultryTypeCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.poultryTypeCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Poultry Type...</option>
                    {Object.values(POULTRY_TYPES).map(type => (
                      <option key={type.code} value={type.code}>
                        {type.code} - {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.poultryTypeCode && <p className="text-red-500 text-xs mt-1">{errors.poultryTypeCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breed (Optional)
                  </label>
                  <select
                    value={formData.breedCode}
                    onChange={(e) => handleInputChange('breedCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.poultryTypeCode}
                  >
                    <option value="">Select Breed...</option>
                    {availableBreeds.map(breed => (
                      <option key={breed.code} value={breed.code}>
                        {breed.code} - {breed.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title and Description */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advisory Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Weekly Poultry Management Advisory for Broiler Production"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the poultry advisory content"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
                <FaFileUpload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
                <div className="space-y-2">
                  <p className="text-base sm:text-lg font-medium text-gray-900">Upload Multi-Sheet Excel File</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Support for .xlsx and .xls files with multiple sheets containing poultry management data
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4">
                    <label className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer flex items-center justify-center touch-manipulation">
                      <FaFileUpload className="mr-2" />
                      Choose File
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => handleFileChange(e.target.files[0])}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center touch-manipulation"
                    >
                      <FaDownload className="mr-2" />
                      Download Template
                    </button>
                  </div>
                  {formData.file && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-center">
                        <FaCheck className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          {formData.file.name} ({Math.round(formData.file.size / 1024)} KB)
                        </span>
                      </div>
                    </div>
                  )}
                  {errors.file && <p className="text-red-500 text-sm mt-2">{errors.file}</p>}
                </div>
              </div>

              {loading && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">Processing file...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview Data - Similar to Agromet but with poultry-specific fields */}
          {uploadStep === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FaInfo className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">File Analysis Complete</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Found {parsedSheets.length} sheets in your Excel file. Please review and select which sheets to include in your poultry advisory.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sheet Selection - Similar to agromet but poultry-focused */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Sheets to Include</h3>

                {parsedSheets.map((sheet, index) => (
                  <div key={index} className={`border rounded-lg ${selectedSheets.includes(sheet.name) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedSheets.includes(sheet.name)}
                            onChange={() => toggleSheetSelection(sheet.name)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{sheet.name}</h4>
                            <p className="text-sm text-gray-500">
                              {sheet.totalRows} records • {sheet.headers.length} columns
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSheetExpansion(sheet.name)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          {expandedSheets[sheet.name] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </div>

                      {/* Sheet Summary for Poultry */}
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Stages:</span>
                          <span className="ml-1 text-gray-600">{sheet.summary.stages.length}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Weeks:</span>
                          <span className="ml-1 text-gray-600">{sheet.summary.weeks.length}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Health Activities:</span>
                          <span className="ml-1 text-gray-600">{sheet.summary.healthActivities.length}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Records:</span>
                          <span className="ml-1 text-gray-600">{sheet.totalRows}</span>
                        </div>
                      </div>

                      {/* Expanded Preview */}
                      {expandedSheets[sheet.name] && (
                        <div className="mt-4 border-t pt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Sample Data Preview</h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  {sheet.headers.map((header, idx) => (
                                    <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sheet.data.slice(0, 3).map((row, rowIdx) => (
                                  <tr key={rowIdx}>
                                    {sheet.headers.map((_, colIdx) => (
                                      <td key={colIdx} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {row[colIdx] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {sheet.totalRows > 3 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Showing 3 of {sheet.totalRows} records
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {errors.sheets && <p className="text-red-500 text-sm">{errors.sheets}</p>}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setUploadStep(1)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handlePreview}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={selectedSheets.length === 0}
                >
                  Continue to Preview
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm & Save */}
          {uploadStep === 3 && previewData && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FaCheck className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Ready to Upload</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Please review the summary below and confirm to upload your poultry advisory data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Summary for Poultry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Upload Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Unique ID:</span>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{previewData.uniqueId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Region:</span>
                      <span className="ml-2">{previewData.regionCode} - {previewData.regionName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">District:</span>
                      <span className="ml-2">{previewData.districtCode} - {previewData.districtName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Poultry Type:</span>
                      <span className="ml-2">{previewData.poultryTypeCode} - {previewData.poultryTypeName}</span>
                    </div>
                    {previewData.breedCode && (
                      <div>
                        <span className="font-medium text-gray-700">Breed:</span>
                        <span className="ml-2">{previewData.breedCode} - {previewData.breedName}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Title:</span>
                      <span className="ml-2">{previewData.title}</span>
                    </div>
                    {previewData.description && (
                      <div>
                        <span className="font-medium text-gray-700">Description:</span>
                        <span className="ml-2">{previewData.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Data Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Total Sheets:</span>
                      <span className="ml-2">{previewData.totalSheets}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Total Records:</span>
                      <span className="ml-2">{previewData.totalRecords}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">File Size:</span>
                      <span className="ml-2">{Math.round(formData.file.size / 1024)} KB</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Selected Sheets:</span>
                      <div className="ml-2 mt-1 space-y-1">
                        {previewData.sheets.map((sheet, index) => (
                          <div key={index} className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {sheet.name} ({sheet.summary?.totalRecords || 0} records)
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-blue-700 mb-1">
                        <span>Uploading poultry advisory data...</span>
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

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
                      <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setUploadStep(2)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  disabled={loading}
                >
                  Back
                </button>
                <div className="space-x-3">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    disabled={loading}
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" />
                        Confirm & Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoultryAdvisoryUpload;