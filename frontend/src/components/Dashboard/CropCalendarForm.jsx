import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEye, FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import TemplateGenerationService from '../../services/templateGenerationService';
import { toast } from 'react-hot-toast';
import { getRegionDistrictMapping } from '../../data/ghanaCodes';
import { getSafeDistrictsByRegion, getSafeRegions } from '../../utils/regionDistrictHelpers';
import { SafeDistrictOptions } from '../../components/common/SafeSelectOptions';

const ghanaCommonCrops = [
  'Maize', 'Rice', 'Cassava', 'Yam', 'Plantain', 'Cocoyam', 'Sweet Potato',
  'Groundnut', 'Cowpea', 'Soybean', 'Millet', 'Sorghum', 'Cocoa', 'Oil Palm',
  'Coconut', 'Coffee', 'Cashew', 'Mango', 'Citrus', 'Tomato', 'Pepper',
  'Onion', 'Okra', 'Garden Egg', 'Cucumber', 'Watermelon', 'Pineapple'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const buildCalendarPreviewForViewer = (extracted, formData) => {
  const totalWeeks = extracted.totalWeeks || 24;
  const timelineColumns = Array.from({ length: totalWeeks }, (_, index) => ({
    label: `WK${index + 1}`,
    weekLabel: `WK${index + 1}`,
    dateRange: `W${index + 1}`,
    monthLabel: `P${Math.floor(index / 4) + 1}`
  }));

  return {
    success: true,
    data: {
      title: extracted.title,
      type: 'seasonal',
      commodity: extracted.crop || formData.crop,
      region: formData.region,
      district: formData.district,
      timeline: {
        columns: timelineColumns,
        totalSpan: totalWeeks,
        months: []
      },
      activities: (extracted.activities || []).map((activity) => ({
        name: activity.activityName,
        activePeriods: Array.from(
          { length: Math.max(0, activity.endWeek - activity.startWeek + 1) },
          (_, offset) => ({
            columnIndex: activity.startWeek + offset - 1,
            background: '#32CD32',
            active: true,
          })
        )
      })),
      calendarGrid: {
        rows: (extracted.activities || []).map((activity) => ({
          activity: activity.activityName,
          cells: timelineColumns.map((_, index) => {
            const week = index + 1;
            const active = week >= activity.startWeek && week <= activity.endWeek;
            return { active, background: active ? '#32CD32' : null };
          })
        }))
      },
      metadata: {
        warnings: extracted.warnings || [],
        seasons: extracted.seasons || [],
        sheets: extracted.sheets || [],
      }
    }
  };
};

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
  const [errors, setErrors] = useState({});
  const [parsingPreview, setParsingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [parseToken, setParseToken] = useState(null);

  const { regions: safeRegions } = getSafeRegions();
  const regionNames = safeRegions.map((r) => r.name);
  getRegionDistrictMapping();

  useEffect(() => {
    if (formData.region) {
      try {
        const result = getSafeDistrictsByRegion(formData.region, {
          preferNewData: true,
          fallbackToLegacy: true,
          enableCaching: true
        });
        setDistrictData(result);
        setFormData((prev) => ({ ...prev, district: '' }));
      } catch (error) {
        console.error('Error loading districts for region:', formData.region, error);
        setDistrictData({ districts: [], meta: { error: error.message } });
      }
    } else {
      setDistrictData({ districts: [], meta: {} });
    }
  }, [formData.region]);

  useEffect(() => {
    const storedFormData = localStorage.getItem('calendarFormData');
    const isReturningFromPreview = sessionStorage.getItem('returningFromCalendarPreview');
    if (storedFormData && isReturningFromPreview) {
      try {
        const restored = JSON.parse(storedFormData);
        setFormData((prev) => ({
          ...prev,
          region: restored.region || '',
          district: restored.district || '',
          crop: restored.crop || '',
          majorSeason: {
            ...prev.majorSeason,
            startMonth: restored.majorSeason?.startMonth || '',
            startWeek: restored.majorSeason?.startWeek || ''
          },
          minorSeason: {
            ...prev.minorSeason,
            startMonth: restored.minorSeason?.startMonth || '',
            startWeek: restored.minorSeason?.startWeek || ''
          }
        }));
      } catch (error) {
        console.error('Error restoring form data:', error);
      } finally {
        localStorage.removeItem('calendarFormData');
        sessionStorage.removeItem('returningFromCalendarPreview');
      }
    } else if (storedFormData) {
      localStorage.removeItem('calendarFormData');
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (field === 'region' || field === 'district' || field === 'crop') {
      setParseToken(null);
    }
  };

  const handleSeasonChange = (season, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [season]: {
        ...prev[season],
        [field]: value
      }
    }));
    setParseToken(null);
  };

  const handleFileChange = (season, file) => {
    if (!file) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [season]: {
        ...prev[season],
        file
      }
    }));
    setParseToken(null);
  };

  const removeFile = (season) => {
    setFormData((prev) => ({
      ...prev,
      [season]: {
        ...prev[season],
        file: null
      }
    }));
    setParseToken(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.crop) newErrors.crop = 'Crop is required';
    if (!formData.majorSeason.file) newErrors.majorSeasonFile = 'Major season file is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const requestPreview = async () => {
    const previewForm = new FormData();
    previewForm.append('region', formData.region);
    previewForm.append('district', formData.district);
    previewForm.append('crop', formData.crop);
    previewForm.append('title', `${formData.crop} Calendar`);
    previewForm.append('description', `${formData.crop} calendar for ${formData.district}, ${formData.region}`);
    previewForm.append('majorSeasonMonth', formData.majorSeason.startMonth || '');
    previewForm.append('majorSeasonWeek', formData.majorSeason.startWeek || '');
    previewForm.append('minorSeasonMonth', formData.minorSeason.startMonth || '');
    previewForm.append('minorSeasonWeek', formData.minorSeason.startWeek || '');
    previewForm.append('file', formData.majorSeason.file);
    const result = await userService.previewCropCalendar(previewForm);
    if (!result.success) {
      throw new Error(result.error || 'Backend preview failed');
    }
    setParseToken(result.data.parseToken);
    return result.data;
  };

  const generatePreviewData = async () => {
    if (!formData.majorSeason.file) {
      setPreviewError('Please upload a major season Excel file first.');
      return null;
    }
    setParsingPreview(true);
    setPreviewError(null);
    try {
      const previewResult = await requestPreview();
      return {
        viewerPayload: buildCalendarPreviewForViewer(previewResult.extracted || {}, formData),
      };
    } catch (error) {
      console.error('Error parsing calendar preview:', error);
      setPreviewError(`Error parsing Excel file: ${error.message}`);
      return null;
    } finally {
      setParsingPreview(false);
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) {
      return;
    }
    const preview = await generatePreviewData();
    if (!preview) {
      return;
    }
    localStorage.setItem('calendarPreviewData', JSON.stringify(preview.viewerPayload));
    localStorage.setItem('calendarFormData', JSON.stringify({
      region: formData.region,
      district: formData.district,
      crop: formData.crop,
      majorSeason: {
        fileName: formData.majorSeason.file?.name,
        startMonth: formData.majorSeason.startMonth,
        startWeek: formData.majorSeason.startWeek
      },
      minorSeason: {
        fileName: formData.minorSeason.file?.name,
        startMonth: formData.minorSeason.startMonth,
        startWeek: formData.minorSeason.startWeek
      }
    }));
    sessionStorage.setItem('returningFromCalendarPreview', 'true');
    navigate('/production/calendar-preview');
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fill all required fields:\n- Region\n- District\n- Crop\n- Excel file\n\n(Start month is optional)');
      return;
    }
    setLoading(true);
    try {
      let activeParseToken = parseToken;
      if (!activeParseToken) {
        const previewResult = await requestPreview();
        activeParseToken = previewResult.parseToken;
      }
      const commitData = new FormData();
      commitData.append('parseToken', activeParseToken);
      const result = await userService.commitCropCalendar(commitData);
      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to save crop calendar');
      }
      toast.success(`${formData.crop} calendar for ${formData.district}, ${formData.region} created successfully!`, {
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
      setFormData({
        region: '',
        district: '',
        crop: '',
        majorSeason: { file: null, startMonth: '', startWeek: '' },
        minorSeason: { file: null, startMonth: '', startWeek: '' }
      });
      setParseToken(null);
    } catch (error) {
      console.error('Error saving crop calendar:', error);
      toast.error(`❌ ${error.response?.data?.message || error.message || 'Failed to create calendar'}`, {
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
      toast.error('❌ Error generating template. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Crop Calendar</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region <span className="text-red-500">*</span></label>
              <select value={formData.region} onChange={(e) => handleInputChange('region', e.target.value)} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.region ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select Region...</option>
                {regionNames.map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District <span className="text-red-500">*</span></label>
              <select value={formData.district} onChange={(e) => handleInputChange('district', e.target.value)} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.district ? 'border-red-500' : 'border-gray-300'}`} disabled={!formData.region}>
                <SafeDistrictOptions districts={districtData.districts} placeholder="Select District..." includeEmpty={true} />
              </select>
              {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
              {districtData.meta.hasErrors && <p className="text-orange-500 text-xs mt-1">Using fallback data source</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop <span className="text-red-500">*</span></label>
              <select value={formData.crop} onChange={(e) => handleInputChange('crop', e.target.value)} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.crop ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select Crop...</option>
                {ghanaCommonCrops.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
              </select>
              {errors.crop && <p className="text-red-500 text-xs mt-1">{errors.crop}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Major Season</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excel <span className="text-red-500">*</span></label>
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 cursor-pointer">
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFileChange('majorSeason', e.target.files[0])} className="hidden" />
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                        {formData.majorSeason.file ? formData.majorSeason.file.name : 'Choose File'}
                      </div>
                    </label>
                    {formData.majorSeason.file && <button onClick={() => removeFile('majorSeason')} className="p-2 text-red-500 hover:text-red-700"><FaTrash /></button>}
                  </div>
                  {errors.majorSeasonFile && <p className="text-red-500 text-xs mt-1">{errors.majorSeasonFile}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Major Season Start Month</label>
                  <select value={formData.majorSeason.startMonth} onChange={(e) => handleSeasonChange('majorSeason', 'startMonth', e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300">
                    <option value="">Select Month...</option>
                    {months.map((month) => <option key={month} value={month}>{month}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Week</label>
                  <input type="date" value={formData.majorSeason.startWeek} onChange={(e) => handleSeasonChange('majorSeason', 'startWeek', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Minor Season</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excel</label>
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 cursor-pointer">
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFileChange('minorSeason', e.target.files[0])} className="hidden" />
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                        {formData.minorSeason.file ? formData.minorSeason.file.name : 'Choose File'}
                      </div>
                    </label>
                    {formData.minorSeason.file && <button onClick={() => removeFile('minorSeason')} className="p-2 text-red-500 hover:text-red-700"><FaTrash /></button>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minor Season Start Month</label>
                  <select value={formData.minorSeason.startMonth} onChange={(e) => handleSeasonChange('minorSeason', 'startMonth', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select Month...</option>
                    {months.map((month) => <option key={month} value={month}>{month}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Week</label>
                  <input type="date" value={formData.minorSeason.startWeek} onChange={(e) => handleSeasonChange('minorSeason', 'startWeek', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>
          </div>

          {previewError && <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">{previewError}</div>}

          <div className="flex justify-between items-center mt-8">
            <div className="flex space-x-2">
              <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"><FaDownload className="mr-2" />Download Template</button>
              <button onClick={handlePreview} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center" disabled={loading || parsingPreview}>
                {parsingPreview ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Parsing...</> : <><FaEye className="mr-2" />Preview Calendar</>}
              </button>
            </div>
            <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center" disabled={loading}>
              {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</> : <><FaPlus className="mr-2" />Save</>}
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
