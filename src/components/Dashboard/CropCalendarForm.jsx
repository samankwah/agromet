import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEye, FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import TemplateGenerationService from '../../services/templateGenerationService';
import { toast } from 'react-hot-toast';
import { getRegionDistrictMapping, getAllRegionNames, getDistrictsByRegionName } from '../../data/ghanaCodes';
import { getSafeDistrictsByRegion, getSafeRegions } from '../../utils/regionDistrictHelpers';
import { SafeDistrictOptions } from '../../components/common/SafeSelectOptions';
import calendarPreviewParser from '../../utils/calendarPreviewParser';

// Common crops in Ghana
const ghanaCommonCrops = [
  "Maize", "Rice", "Cassava", "Yam", "Plantain", "Cocoyam", "Sweet Potato", 
  "Groundnut", "Cowpea", "Soybean", "Millet", "Sorghum", "Cocoa", "Oil Palm",
  "Coconut", "Coffee", "Cashew", "Mango", "Citrus", "Tomato", "Pepper", 
  "Onion", "Okra", "Garden Egg", "Cucumber", "Watermelon", "Pineapple"
];


// Months
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CropCalendarForm = ({ isOpen, onClose, onSave }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    region: '',
    district: '',
    crop: '',
    majorSeason: {
      file: null,
      startMonth: '',
      startWeek: ''
    },
    minorSeason: {
      file: null,
      startMonth: '',
      startWeek: ''
    }
  });

  const [districtData, setDistrictData] = useState({ districts: [], meta: {} });
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [parsingPreview, setParsingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Get regions using safe helpers with error handling
  const { regions: safeRegions } = getSafeRegions();
  const regionNames = safeRegions.map(r => r.name);
  const regionDistrictMapping = getRegionDistrictMapping();

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

  // RESTORE FORM DATA: Only restore if returning from preview (with session flag)
  useEffect(() => {
    const storedFormData = localStorage.getItem('calendarFormData');
    const isReturningFromPreview = sessionStorage.getItem('returningFromCalendarPreview');
    
    if (storedFormData && isReturningFromPreview) {
      try {
        const restored = JSON.parse(storedFormData);
        console.log('🔄 Restoring form data from preview:', restored);
        
        setFormData(prev => ({
          ...prev,
          region: restored.region || '',
          district: restored.district || '', 
          crop: restored.crop || '',
          majorSeason: {
            ...prev.majorSeason,
            // Don't restore file object, but show filename
            startMonth: restored.majorSeason?.startMonth || '',
            startWeek: restored.majorSeason?.startWeek || ''
          },
          minorSeason: {
            ...prev.minorSeason,
            startMonth: restored.minorSeason?.startMonth || '',
            startWeek: restored.minorSeason?.startWeek || ''
          }
        }));
        
        // Clear both storage items after restoring
        localStorage.removeItem('calendarFormData');
        sessionStorage.removeItem('returningFromCalendarPreview');
        
        console.log('✅ Form data restored from preview');
        
      } catch (error) {
        console.error('Error restoring form data:', error);
        localStorage.removeItem('calendarFormData');
        sessionStorage.removeItem('returningFromCalendarPreview');
      }
    } else if (storedFormData) {
      // Clean up old stored data if not returning from preview
      console.log('🧹 Cleaning up old form data (not from preview)');
      localStorage.removeItem('calendarFormData');
    }
  }, []); // Run only on component mount

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

  const handleSeasonChange = (season, field, value) => {
    setFormData(prev => ({
      ...prev,
      [season]: {
        ...prev[season],
        [field]: value
      }
    }));
  };

  const handleFileChange = (season, file) => {
    if (file) {
      setFormData(prev => ({
        ...prev,
        [season]: {
          ...prev[season],
          file: file
        }
      }));
    }
  };

  const removeFile = (season) => {
    setFormData(prev => ({
      ...prev,
      [season]: {
        ...prev[season],
        file: null
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.crop) newErrors.crop = 'Crop is required';

    if (!formData.majorSeason.file) newErrors.majorSeasonFile = 'Major season file is required';
    // Make start month optional for easier testing
    // if (!formData.majorSeason.startMonth) newErrors.majorSeasonMonth = 'Major season start month is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePreviewData = async () => {
    if (!formData.majorSeason.file) {
      setPreviewError('Please upload a major season Excel file first.');
      return null;
    }

    setParsingPreview(true);
    setPreviewError(null);

    try {
      // Parse the major season file with enhanced parser
      const majorSeasonData = await calendarPreviewParser.parseCalendarForPreview(
        formData.majorSeason.file,
        { region: formData.region, district: formData.district, crop: formData.crop }
      );

      let minorSeasonData = null;
      if (formData.minorSeason.file) {
        minorSeasonData = await calendarPreviewParser.parseCalendarForPreview(
          formData.minorSeason.file,
          { region: formData.region, district: formData.district, crop: formData.crop }
        );
      }

      // Combine the data for preview
      const combinedPreview = {
        majorSeason: majorSeasonData,
        minorSeason: minorSeasonData,
        metadata: {
          region: formData.region,
          district: formData.district,
          crop: formData.crop,
          totalFiles: minorSeasonData ? 2 : 1,
          parseDate: new Date().toISOString()
        }
      };

      return combinedPreview;

    } catch (error) {
      console.error('Error parsing calendar preview:', error);
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
        localStorage.setItem('calendarPreviewData', JSON.stringify(preview.majorSeason));
        
        // PRESERVE FORM DATA: Store form data for when user returns from preview
        const formDataForRestore = {
          region: formData.region,
          district: formData.district,
          crop: formData.crop,
          majorSeason: {
            ...formData.majorSeason,
            // Don't store File object, just metadata
            fileName: formData.majorSeason.file?.name,
            startMonth: formData.majorSeason.startMonth,
            startWeek: formData.majorSeason.startWeek
          },
          minorSeason: {
            ...formData.minorSeason,
            // Don't store File object, just metadata  
            fileName: formData.minorSeason.file?.name,
            startMonth: formData.minorSeason.startMonth,
            startWeek: formData.minorSeason.startWeek
          }
        };
        localStorage.setItem('calendarFormData', JSON.stringify(formDataForRestore));
        
        // Set session flag to indicate we're going to preview
        sessionStorage.setItem('returningFromCalendarPreview', 'true');
        
        // Navigate to the full-page preview
        navigate('/production/calendar-preview');
      }
    }
  };

  const handleSave = async () => {
    console.log('🌾 CropCalendar: Save button clicked - BUTTON IS WORKING!');
    console.log('🌾 CropCalendar: Current form state:', {
      region: formData.region || 'NOT SET',
      district: formData.district || 'NOT SET',
      crop: formData.crop || 'NOT SET',
      hasFile: !!formData.majorSeason.file,
      fileName: formData.majorSeason.file?.name || 'NO FILE',
      startMonth: formData.majorSeason.startMonth || 'NOT SET'
    });

    const validationResult = validateForm();
    console.log('🌾 CropCalendar: Validation result:', validationResult);

    if (!validationResult) {
      console.log('❌ CropCalendar: VALIDATION FAILED - This is why save appears broken!');
      console.log('❌ CropCalendar: Validation errors:', errors);
      console.log('❌ CropCalendar: Please fill ALL required fields and try again');

      // Show user feedback
      alert('Please fill all required fields:\n- Region\n- District\n- Crop\n- Excel file\n\n(Start month is optional)');
      return;
    }

    console.log('🌾 CropCalendar: Starting save process...');
    setLoading(true);
    try {
      // Create form data for submission
      const submitData = new FormData();
      
      // Add basic information
      submitData.append('region', formData.region);
      submitData.append('district', formData.district);
      submitData.append('crop', formData.crop);
      
      // Add major season data
      if (formData.majorSeason.file) {
        submitData.append('file', formData.majorSeason.file); // Use 'file' as the backend expects
        submitData.append('majorSeasonMonth', formData.majorSeason.startMonth);
        submitData.append('majorSeasonWeek', formData.majorSeason.startWeek);
      }
      
      // Add minor season data if provided
      if (formData.minorSeason.startMonth) {
        submitData.append('minorSeasonMonth', formData.minorSeason.startMonth);
        submitData.append('minorSeasonWeek', formData.minorSeason.startWeek);
      }

      // Submit using agricultural data service
      const result = await userService.uploadAgriculturalData(submitData, 'crop-calendar');
      
      if (result.success) {
        toast.success(`🌾 ${formData.crop} calendar for ${formData.district}, ${formData.region} created successfully!`, {
          duration: 4000,
          position: 'top-right',
          icon: '✅',
          style: {
            background: '#10B981',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
          }
        });
        onSave(result.data);
        onClose();
        
        // Reset form
        setFormData({
          region: '',
          district: '',
          crop: '',
          majorSeason: { file: null, startMonth: '', startWeek: '' },
          minorSeason: { file: null, startMonth: '', startWeek: '' }
        });
        setPreviewData(null);
        setShowPreview(false);
      } else {
        throw new Error(result.error || result.message || 'Failed to save crop calendar');
      }
    } catch (error) {
      console.error('Error saving crop calendar:', error);

      // More detailed error handling
      let errorMessage = 'Failed to create calendar';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(`❌ ${errorMessage}`, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      TemplateGenerationService.downloadTemplate('crop-calendar', {
        crop: formData.crop || 'Maize',
        region: formData.region || 'Oti Region',
        district: formData.district || 'Biakoye'
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('❌ Error generating template. Please try again.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Crop Calendar</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    Crop <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.crop}
                    onChange={(e) => handleInputChange('crop', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.crop ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Crop...</option>
                    {ghanaCommonCrops.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                  {errors.crop && <p className="text-red-500 text-xs mt-1">{errors.crop}</p>}
                  <p className="text-gray-500 text-xs mt-1">Enter the crop</p>
                </div>
              </div>

              {/* Seasons Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Major Season */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Major Season</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Excel <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => handleFileChange('majorSeason', e.target.files[0])}
                            className="hidden"
                          />
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                            {formData.majorSeason.file ? formData.majorSeason.file.name : 'Choose File'}
                          </div>
                        </label>
                        {formData.majorSeason.file && (
                          <button
                            onClick={() => removeFile('majorSeason')}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      {errors.majorSeasonFile && <p className="text-red-500 text-xs mt-1">{errors.majorSeasonFile}</p>}
                      <p className="text-gray-500 text-xs mt-1">Upload Excel1</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Major Season Start Month <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.majorSeason.startMonth}
                        onChange={(e) => handleSeasonChange('majorSeason', 'startMonth', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.majorSeasonMonth ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Month...</option>
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      {errors.majorSeasonMonth && <p className="text-red-500 text-xs mt-1">{errors.majorSeasonMonth}</p>}
                      <p className="text-gray-500 text-xs mt-1">Enter major season start month</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Week <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.majorSeason.startWeek}
                        onChange={(e) => handleSeasonChange('majorSeason', 'startWeek', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                  </div>
                </div>

                {/* Minor Season */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Minor Season</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Excel</label>
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => handleFileChange('minorSeason', e.target.files[0])}
                            className="hidden"
                          />
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                            {formData.minorSeason.file ? formData.minorSeason.file.name : 'Choose File'}
                          </div>
                        </label>
                        {formData.minorSeason.file && (
                          <button
                            onClick={() => removeFile('minorSeason')}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-1">Upload Excel2</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minor Season Start Month <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.minorSeason.startMonth}
                        onChange={(e) => handleSeasonChange('minorSeason', 'startMonth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Month...</option>
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      <p className="text-gray-500 text-xs mt-1">Enter minor season start month</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Week <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.minorSeason.startWeek}
                        onChange={(e) => handleSeasonChange('minorSeason', 'startWeek', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-8">
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
  );
};

CropCalendarForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default CropCalendarForm;