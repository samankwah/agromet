import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaEye, FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import TemplateGenerationService from '../../services/templateGenerationService';
import { toast } from 'react-hot-toast';
import { getRegionDistrictMapping, POULTRY_TYPES } from '../../data/ghanaCodes';
import { getSafeDistrictsByRegion, getSafeRegions } from '../../utils/regionDistrictHelpers';
import { SafeDistrictOptions } from '../../components/common/SafeSelectOptions';

const getPoultryTypesForForm = () => {
  const formattedTypes = {};
  Object.values(POULTRY_TYPES).forEach((type) => {
    formattedTypes[type.name] = Object.values(type.breeds);
  });
  return formattedTypes;
};

const poultryTypes = getPoultryTypesForForm();

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const buildPoultryPreviewForViewer = (extracted, formData) => {
  const totalWeeks = extracted.totalWeeks || 8;
  const timelineColumns = Array.from({ length: totalWeeks }, (_, index) => ({
    label: `WK${index + 1}`,
    weekLabel: `WK${index + 1}`,
    dateRange: `W${index + 1}`,
    monthLabel: `Cycle ${Math.floor(index / 4) + 1}`
  }));

  return {
    success: true,
    data: {
      title: extracted.title,
      type: 'cycle',
      commodity: extracted.crop || formData.poultryType,
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
            background: '#2563EB',
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
            return { active, background: active ? '#2563EB' : null };
          })
        }))
      },
      metadata: {
        warnings: extracted.warnings || [],
        sheets: extracted.sheets || [],
      }
    }
  };
};

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
  const [parseToken, setParseToken] = useState(null);

  const { regions: safeRegions } = getSafeRegions();
  const regionNames = safeRegions.map((r) => r.name);
  getRegionDistrictMapping();

  useEffect(() => {
    const storedFormData = localStorage.getItem('poultryCalendarFormData');
    if (storedFormData && isOpen) {
      try {
        const parsedFormData = JSON.parse(storedFormData);
        setFormData((prev) => ({
          ...prev,
          region: parsedFormData.region || '',
          district: parsedFormData.district || '',
          poultryType: parsedFormData.poultryType || '',
          productionCycle: {
            ...prev.productionCycle,
            startMonth: parsedFormData.productionCycle?.startMonth || '',
            startWeek: parsedFormData.productionCycle?.startWeek || ''
          }
        }));
      } catch (error) {
        console.error('Error restoring form data:', error);
      } finally {
        localStorage.removeItem('poultryCalendarFormData');
      }
    }
  }, [isOpen]);

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setParseToken(null);
  };

  const handleCycleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      productionCycle: {
        ...prev.productionCycle,
        [field]: value
      }
    }));
    setParseToken(null);
  };

  const handleFileChange = (file) => {
    if (!file) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      productionCycle: {
        ...prev.productionCycle,
        file
      }
    }));
    setParseToken(null);
  };

  const removeFile = () => {
    setFormData((prev) => ({
      ...prev,
      productionCycle: {
        ...prev.productionCycle,
        file: null
      }
    }));
    setParseToken(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.poultryType) newErrors.poultryType = 'Poultry type is required';
    if (!formData.productionCycle.file) newErrors.productionCycleFile = 'Production cycle file is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const requestPreview = async () => {
    const previewForm = new FormData();
    previewForm.append('region', formData.region);
    previewForm.append('district', formData.district);
    previewForm.append('poultryType', formData.poultryType);
    previewForm.append('title', `${formData.poultryType} Calendar`);
    previewForm.append('description', `${formData.poultryType} calendar for ${formData.district}, ${formData.region}`);
    previewForm.append('productionCycleMonth', formData.productionCycle.startMonth || '');
    previewForm.append('productionCycleWeek', formData.productionCycle.startWeek || '');
    previewForm.append('file', formData.productionCycle.file);
    const result = await userService.previewPoultryCalendar(previewForm);
    if (!result.success) {
      throw new Error(result.error || 'Backend preview failed');
    }
    setParseToken(result.data.parseToken);
    return result.data;
  };

  const generatePreviewData = async () => {
    if (!formData.productionCycle.file) {
      setPreviewError('Please upload a production cycle Excel file first.');
      return null;
    }
    setParsingPreview(true);
    setPreviewError(null);
    try {
      const previewResult = await requestPreview();
      return {
        viewerPayload: buildPoultryPreviewForViewer(previewResult.extracted || {}, formData)
      };
    } catch (error) {
      console.error('Error parsing poultry calendar preview:', error);
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
    localStorage.setItem('poultryCalendarPreviewData', JSON.stringify(preview.viewerPayload));
    localStorage.setItem('poultryCalendarFormData', JSON.stringify({
      region: formData.region,
      district: formData.district,
      poultryType: formData.poultryType,
      productionCycle: {
        fileName: formData.productionCycle.file?.name,
        startMonth: formData.productionCycle.startMonth,
        startWeek: formData.productionCycle.startWeek
      }
    }));
    navigate('/production/poultry-calendar-preview');
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fill all required fields:\n- Region\n- District\n- Poultry Type\n- Excel file\n\n(Start month is optional)');
      return;
    }
    setLoading(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      let activeParseToken = parseToken;
      if (!activeParseToken) {
        const previewResult = await requestPreview();
        activeParseToken = previewResult.parseToken;
      }
      const commitData = new FormData();
      commitData.append('parseToken', activeParseToken);
      const result = await userService.commitPoultryCalendar(commitData);
      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to save poultry calendar');
      }
      setSaveSuccess(true);
      toast.success(`${formData.poultryType} calendar for ${formData.district}, ${formData.region} created successfully!`, {
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
      setTimeout(() => {
        onSave(result.data);
        onClose();
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
        setParseToken(null);
        setSaveSuccess(false);
      }, 1200);
    } catch (error) {
      console.error('Error saving poultry calendar:', error);
      setSaveError(error.response?.data?.message || error.message || 'Failed to save poultry calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      TemplateGenerationService.downloadTemplate('poultry-calendar', {
        poultryType: formData.poultryType || 'Broiler',
        region: formData.region || 'Greater Accra Region',
        district: formData.district || 'Accra Metro'
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('❌ Error generating template. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
          <div className="flex-shrink-0">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Poultry Calendar</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poultry Type <span className="text-red-500">*</span></label>
                <select value={formData.poultryType} onChange={(e) => handleInputChange('poultryType', e.target.value)} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.poultryType ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select Poultry Type...</option>
                  {Object.keys(poultryTypes).map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                {errors.poultryType && <p className="text-red-500 text-xs mt-1">{errors.poultryType}</p>}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Production Cycle</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excel <span className="text-red-500">*</span></label>
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 cursor-pointer">
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFileChange(e.target.files[0])} className="hidden" />
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                        {formData.productionCycle.file ? formData.productionCycle.file.name : 'Choose File'}
                      </div>
                    </label>
                    {formData.productionCycle.file && <button onClick={removeFile} className="p-2 text-red-500 hover:text-red-700"><FaTrash /></button>}
                  </div>
                  {errors.productionCycleFile && <p className="text-red-500 text-xs mt-1">{errors.productionCycleFile}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Production Cycle Start Month</label>
                  <select value={formData.productionCycle.startMonth} onChange={(e) => handleCycleChange('startMonth', e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300">
                    <option value="">Select Month...</option>
                    {months.map((month) => <option key={month} value={month}>{month}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Week</label>
                  <input type="date" value={formData.productionCycle.startWeek} onChange={(e) => handleCycleChange('startWeek', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>
          </div>

          {saveSuccess && <div className="mx-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm font-medium text-green-800">Poultry calendar saved successfully.</p></div>}
          {saveError && <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>}
          {previewError && <div className="mx-6 mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">{previewError}</div>}

          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"><FaDownload className="mr-2" />Download Template</button>
                <button onClick={handlePreview} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center" disabled={loading || parsingPreview}>
                  {parsingPreview ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Parsing...</> : <><FaEye className="mr-2" />Preview Calendar</>}
                </button>
              </div>
              <button onClick={handleSave} className={`px-6 py-2 rounded-md flex items-center transition-colors ${saveSuccess ? 'bg-green-700 text-white cursor-not-allowed' : loading ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`} disabled={loading || saveSuccess}>
                {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</> : saveSuccess ? <><svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Saved Successfully!</> : <><FaPlus className="mr-2" />Save</>}
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
