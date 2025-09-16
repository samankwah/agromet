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
    if (!formData.productionCycle.startMonth) newErrors.productionCycleMonth = 'Production cycle start month is required';
    
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
      // Parse the production cycle file with enhanced parser
      const productionCycleData = await calendarPreviewParser.parseCalendarForPreview(
        formData.productionCycle.file,
        { region: formData.region, district: formData.district, poultryType: formData.poultryType }
      );

      // Parse raw Excel content for preview
      const rawExcelContent = await parseRawExcelContent(formData.productionCycle.file);

      // Create preview data structure
      const combinedPreview = {
        productionCycle: productionCycleData,
        rawExcelContent: rawExcelContent,
        metadata: {
          region: formData.region,
          district: formData.district,
          poultryType: formData.poultryType,
          totalFiles: 1,
          parseDate: new Date().toISOString()
        }
      };

      return combinedPreview;

    } catch (error) {
      console.error('Error parsing poultry calendar preview:', error);
      setPreviewError(`Error parsing Excel file: ${error.message}`);
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
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create form data for submission
      const submitData = new FormData();
      
      // Add basic information
      submitData.append('region', formData.region);
      submitData.append('district', formData.district);
      submitData.append('poultryType', formData.poultryType);
      
      // Add production cycle data
      if (formData.productionCycle.file) {
        submitData.append('productionCycleFile', formData.productionCycle.file);
        submitData.append('productionCycleMonth', formData.productionCycle.startMonth);
        submitData.append('productionCycleWeek', formData.productionCycle.startWeek);
      }

      // Submit using agricultural data service
      const result = await userService.uploadAgriculturalData(submitData, 'poultry-calendar');
      
      if (result.success) {
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
      }
    } catch (error) {
      console.error('Error saving poultry calendar:', error);
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
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
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