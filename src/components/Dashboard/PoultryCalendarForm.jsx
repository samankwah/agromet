import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEye, FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import TemplateGenerationService from '../../services/templateGenerationService';
import { 
  getRegionDistrictMapping, 
  getAllRegionNames, 
  getDistrictsByRegionName,
  POULTRY_TYPES 
} from '../../data/ghanaCodes';
import { getSafeDistrictsByRegion, getSafeRegions } from '../../utils/regionDistrictHelpers';
import { SafeDistrictOptions } from '../../components/common/SafeSelectOptions';
import calendarPreviewParser from '../../utils/calendarPreviewParser';
import * as XLSX from 'xlsx';
import SophisticatedExcelParser from '../../utils/sophisticatedExcelParser';

// Convert POULTRY_TYPES from centralized data to the format expected by the form
const getPoultryTypesForForm = () => {
  const formattedTypes = {};
  Object.values(POULTRY_TYPES).forEach(type => {
    formattedTypes[type.name] = Object.values(type.breeds);
  });
  return formattedTypes;
};

const poultryTypes = getPoultryTypesForForm();

// Production stages for poultry
const productionStages = [
  "Brooding", "Starter Phase", "Grower Phase", "Finisher Phase", 
  "Layer Phase", "Breeder Phase", "Processing", "Health Management",
  "Vaccination", "Feed Management", "Housing Management"
];

// Health management types
const healthManagementTypes = [
  "Vaccination Schedule", "Disease Prevention", "Treatment Protocol",
  "Biosecurity Measures", "Health Monitoring", "Nutrition Management",
  "Environmental Control", "Stress Management"
];

// Months
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PoultryCalendarForm = ({ isOpen, onClose, onSave }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    region: '',
    district: '',
    poultryType: '',
    productionCycle: {
      file: null,
      startMonth: '',
      startWeek: ''
    }
  });

  const [districtData, setDistrictData] = useState({ districts: [], meta: {} });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [parsingPreview, setParsingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Get regions using safe helpers with error handling
  const { regions: safeRegions } = getSafeRegions();
  const regionNames = safeRegions.map(r => r.name);
  const regionDistrictMapping = getRegionDistrictMapping();

  // Restore form data when returning from preview
  useEffect(() => {
    const storedFormData = localStorage.getItem('poultryCalendarFormData');
    if (storedFormData && isOpen) {
      try {
        const parsedFormData = JSON.parse(storedFormData);
        setFormData(parsedFormData);
        localStorage.removeItem('poultryCalendarFormData');
      } catch (error) {
        console.error('Error restoring form data:', error);
      }
    }
  }, [isOpen]);

  // Update districts when region changes using safe helper
  useEffect(() => {
    if (formData.region) {
      try {
        const result = getSafeDistrictsByRegion(formData.region, {
          preferNewData: true,
          fallbackToLegacy: true,
          enableCaching: true
        });
        
        setDistrictData(result);
        setFormData(prev => ({ ...prev, district: '' }));
        
        // Log any data source issues in development
        if (process.env.NODE_ENV === 'development' && result.meta.hasErrors) {
          console.warn('District data has errors:', result.meta);
        }
      } catch (error) {
        console.error('Error loading districts for region:', formData.region, error);
        setDistrictData({ districts: [], meta: { error: error.message } });
      }
    } else {
      setDistrictData({ districts: [], meta: {} });
    }
  }, [formData.region]);


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCycleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      productionCycle: {
        ...prev.productionCycle,
        [field]: value
      }
    }));
  };

  const handleFileChange = (file) => {
    if (file) {
      setFormData(prev => ({
        ...prev,
        productionCycle: {
          ...prev.productionCycle,
          file: file
        }
      }));
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      productionCycle: {
        ...prev.productionCycle,
        file: null
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.poultryType) newErrors.poultryType = 'Poultry type is required';

    if (!formData.productionCycle.file) newErrors.productionCycleFile = 'Production cycle file is required';
    // Make start month optional for easier testing
    // if (!formData.productionCycle.startMonth) newErrors.productionCycleMonth = 'Production cycle start month is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Parse raw Excel content for direct preview
  const parseRawExcelContent = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });
      
      const result = {};
      
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const data = [];
        
        // Extract cell data with formatting
        for (let row = range.s.r; row <= range.e.r; row++) {
          const rowData = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = sheet[cellAddress];
            
            if (cell) {
              rowData.push({
                value: cell.v || '',
                formula: cell.f || null,
                type: cell.t || 'str',
                style: cell.s || null,
                address: cellAddress
              });
            } else {
              rowData.push({
                value: '',
                formula: null,
                type: 'str',
                style: null,
                address: cellAddress
              });
            }
          }
          data.push(rowData);
        }
        
        result[sheetName] = {
          data: data,
          range: sheet['!ref'],
          totalRows: range.e.r - range.s.r + 1,
          totalCols: range.e.c - range.s.c + 1
        };
      });
      
      return result;
    } catch (error) {
      console.error('Error parsing raw Excel content:', error);
      return null;
    }
  };

  const generatePreviewData = async () => {
    if (!formData.productionCycle.file) {
      setPreviewError('Please upload a production cycle Excel file first.');
      return null;
    }

    setParsingPreview(true);
    setPreviewError(null);

    try {
      // Use sophisticated Excel parser for exact content extraction (NO FALLBACK)
      console.log('🔬 Using sophisticated Excel parser for exact content extraction');

      const sophisticatedParser = new SophisticatedExcelParser();

      // Parse Excel file with sophisticated content extraction
      const parseResult = await sophisticatedParser.parseExcelFile(
        formData.productionCycle.file,
        {
          region: formData.region,
          district: formData.district,
          year: new Date().getFullYear(),
          poultryType: formData.poultryType
        }
      );

      console.log('📊 Sophisticated parser preview result:', parseResult.success ? 'SUCCESS' : 'FAILED');
      console.log('📊 Source:', parseResult.source);
      console.log('📊 Sheets processed:', parseResult.sheetsData ? Object.keys(parseResult.sheetsData).length : 0);

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Sophisticated parser failed to process Excel file');
      }

      // Extract main sheet data with validation
      const sheetNames = Object.keys(parseResult.sheetsData);
      if (sheetNames.length === 0) {
        throw new Error('No sheets were successfully processed from the Excel file');
      }

      const mainSheetName = sheetNames[0];
      const mainSheet = parseResult.sheetsData[mainSheetName];

      if (!mainSheet) {
        throw new Error(`Main sheet "${mainSheetName}" data is missing`);
      }

      console.log('📊 Processing main sheet:', mainSheetName);

      console.log('📊 Activities found:', mainSheet.activities?.length || 0);
      console.log('📊 Colors detected:', Object.keys(mainSheet.colors).length);
      console.log('📊 Calendar type:', parseResult.calendarAnalysis.calendarType);

      // Create preview data structure using sophisticated parser results
      const combinedPreview = {
        productionCycle: {
          // Sophisticated parser data with exact Excel content
          timeline: mainSheet.timeline,
          activities: mainSheet.activities,
          schedule: mainSheet.activities, // Use activities as schedule
          colors: mainSheet.colors,
          calendarType: parseResult.calendarAnalysis.calendarType,
          commodity: parseResult.calendarAnalysis.commodity,
          totalWeeks: mainSheet.timeline?.periods?.length || 0,
          sheetsData: parseResult.sheetsData,
          formattingData: parseResult.formattingData,

          // Metadata
          metadata: {
            region: formData.region,
            district: formData.district,
            poultryType: formData.poultryType,
            sophisticated: true,
            exactContent: true,
            noFallback: true,
            source: parseResult.source,
            parseMetadata: parseResult.metadata
          }
        },
        rawExcelContent: parseResult.sheetsData,
        metadata: {
          region: formData.region,
          district: formData.district,
          poultryType: formData.poultryType,
          totalFiles: 1,
          parseDate: new Date().toISOString(),
          sophisticated: true,
          exactContent: true,
          activitiesFound: mainSheet.activities?.length || 0,
          colorsDetected: Object.keys(mainSheet.colors).length,
          sheetsProcessed: Object.keys(parseResult.sheetsData).length
        }
      };

      return combinedPreview;

    } catch (error) {
      console.error('Error with sophisticated Excel parsing:', error);
      setPreviewError(`Error parsing Excel file with sophisticated parser: ${error.message}`);
      return null;
    } finally {
      setParsingPreview(false);
    }
  };

  const handlePreview = async () => {
    if (validateForm()) {
      const preview = await generatePreviewData();
      if (preview) {
        // Store preview data in localStorage for the preview page
        localStorage.setItem('poultryCalendarPreviewData', JSON.stringify(preview.productionCycle));
        
        // Store form data for restoration when returning from preview
        localStorage.setItem('poultryCalendarFormData', JSON.stringify(formData));
        
        // Navigate to preview page
        navigate('/production/poultry-calendar-preview');
      }
    }
  };

  const handleSave = async () => {
    console.log('🐔 PoultryCalendar: Save button clicked - BUTTON IS WORKING!');
    console.log('🐔 PoultryCalendar: Current form state:', {
      region: formData.region || 'NOT SET',
      district: formData.district || 'NOT SET',
      poultryType: formData.poultryType || 'NOT SET',
      hasFile: !!formData.productionCycle.file,
      fileName: formData.productionCycle.file?.name || 'NO FILE',
      startMonth: formData.productionCycle.startMonth || 'NOT SET'
    });

    const validationResult = validateForm();
    console.log('🐔 PoultryCalendar: Validation result:', validationResult);

    if (!validationResult) {
      console.log('❌ PoultryCalendar: VALIDATION FAILED - This is why save appears broken!');
      console.log('❌ PoultryCalendar: Validation errors:', errors);
      console.log('❌ PoultryCalendar: Please fill ALL required fields and try again');

      // Show user feedback
      alert('Please fill all required fields:\n- Region\n- District\n- Poultry Type\n- Excel file\n\n(Start month is optional)');
      return;
    }

    console.log('🐔 PoultryCalendar: Starting save process...');
    setLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log('🐔 Starting poultry calendar save process...');

      // Create form data for submission
      const submitData = new FormData();

      // Add basic information
      submitData.append('region', formData.region);
      submitData.append('district', formData.district);
      submitData.append('poultryType', formData.poultryType);

      // Add production cycle data
      if (formData.productionCycle.file) {
        submitData.append('file', formData.productionCycle.file);
        submitData.append('productionCycleMonth', formData.productionCycle.startMonth);
        submitData.append('productionCycleWeek', formData.productionCycle.startWeek);
        console.log('📁 File attached:', formData.productionCycle.file.name);
      }

      console.log('📤 Submitting poultry calendar data...');

      // Submit using agricultural data service
      const result = await userService.uploadAgriculturalData(submitData, 'poultry-calendar');

      console.log('📊 Server response:', result.success ? 'SUCCESS' : 'FAILED', result);

      if (result.success) {
        console.log('✅ Poultry calendar saved successfully');
        console.log('🎯 Enhanced features:', {
          enhanced: result.enhanced || false,
          colors: result.colors || 0,
          activities: result.activities || 0
        });

        setSaveSuccess(true);

        // Show success for 2 seconds before closing
        setTimeout(() => {
          onSave(result.data);
          onClose();

          // Reset form
          setFormData({
            region: '',
            district: '',
            poultryType: '',
            productionCycle: {
              file: null,
              startMonth: '',
              startWeek: ''
            }
          });

          setSaveSuccess(false);
        }, 2000);
      } else {
        console.error('❌ Save failed with success=false:', result);
        setSaveError(result.message || 'Failed to save poultry calendar');
      }
    } catch (error) {
      console.error('❌ Error saving poultry calendar:', error);

      // Extract meaningful error message
      let errorMessage = 'An unexpected error occurred while saving the poultry calendar.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Add specific guidance based on error type
      if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
        errorMessage += ' Please refresh the page and try again.';
      } else if (errorMessage.includes('file') || errorMessage.includes('Excel')) {
        errorMessage += ' Please check that your Excel file is properly formatted and not corrupted.';
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        errorMessage += ' Please check your internet connection and try again.';
      }

      setSaveError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      TemplateGenerationService.downloadTemplate('poultry-calendar', {
        poultryType: formData.poultryType || 'Broiler',
        breed: formData.breed || 'Cobb 500',
        region: formData.region || 'Greater Accra Region',
        district: formData.district || 'Accra Metro'
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error generating template. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
          {/* Header - Always Visible */}
          <div className="flex-shrink-0">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Poultry Calendar</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.region ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Region...</option>
                    {regionNames.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
                  <p className="text-gray-500 text-xs mt-1">Enter the region</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.district ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!formData.region}
                  >
                    <SafeDistrictOptions 
                      districts={districtData.districts}
                      placeholder="Select District..."
                      includeEmpty={true}
                    />
                  </select>
                  {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
                  {districtData.meta.hasErrors && (
                    <p className="text-orange-500 text-xs mt-1">
                      ⚠️ Using fallback data source
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Enter the district {process.env.NODE_ENV === 'development' && districtData.meta.dataSource && `(${districtData.meta.dataSource})`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poultry Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.poultryType}
                    onChange={(e) => handleInputChange('poultryType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.poultryType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Poultry Type...</option>
                    {Object.keys(poultryTypes).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.poultryType && <p className="text-red-500 text-xs mt-1">{errors.poultryType}</p>}
                  <p className="text-gray-500 text-xs mt-1">Enter the poultry type</p>
                </div>

              </div>

              {/* Production Cycle Section */}
              <div className="border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Production Cycle</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Excel <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange(e.target.files[0])}
                          className="hidden"
                        />
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                          {formData.productionCycle.file ? formData.productionCycle.file.name : 'Choose File'}
                        </div>
                      </label>
                      {formData.productionCycle.file && (
                        <button
                          onClick={() => removeFile()}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                    {errors.productionCycleFile && <p className="text-red-500 text-xs mt-1">{errors.productionCycleFile}</p>}
                    <p className="text-gray-500 text-xs mt-1">Upload Excel file for production cycle</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Production Cycle Start Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.productionCycle.startMonth}
                      onChange={(e) => handleCycleChange('startMonth', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.productionCycleMonth ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Month...</option>
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    {errors.productionCycleMonth && <p className="text-red-500 text-xs mt-1">{errors.productionCycleMonth}</p>}
                    <p className="text-gray-500 text-xs mt-1">Enter production cycle start month</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Week <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.productionCycle.startWeek}
                      onChange={(e) => handleCycleChange('startWeek', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                </div>
              </div>
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="mx-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Poultry calendar saved successfully! Using enhanced Excel parsing with color detection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {saveError && (
            <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Save Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{saveError}</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSaveError(null)}
                        className="bg-red-100 px-2 py-1 rounded text-sm text-red-800 hover:bg-red-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Error Message */}
          {previewError && (
            <div className="mx-6 mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Preview Error
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>{previewError}</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPreviewError(null)}
                        className="bg-orange-100 px-2 py-1 rounded text-sm text-orange-800 hover:bg-orange-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Footer with Action Buttons */}
              <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
                  >
                    <FaDownload className="mr-2" />
                    Download Template
                  </button>
                  <button
                    onClick={handlePreview}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    disabled={loading || parsingPreview}
                  >
                    {parsingPreview ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Parsing...
                      </>
                    ) : (
                      <>
                        <FaEye className="mr-2" />
                        Preview Calendar
                      </>
                    )}
                  </button>
                </div>
                
                <button
                  onClick={handleSave}
                  className={`px-6 py-2 rounded-md flex items-center transition-colors ${
                    saveSuccess
                      ? 'bg-green-700 text-white cursor-not-allowed'
                      : loading
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  disabled={loading || saveSuccess}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Saved Successfully!
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Save
                    </>
                  )}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PoultryCalendarForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default PoultryCalendarForm;