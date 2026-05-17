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
import { InlineBusySkeleton } from '../common/SkeletonLoading';

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

const buildPoultryPreviewForViewer = (previewResult, formData) => {
  const extracted = previewResult.extracted || {};
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
      },
      sourceSheets: previewResult.sourceSheets || [],
      workbookMeta: previewResult.workbookMeta || {},
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
        viewerPayload: buildPoultryPreviewForViewer(previewResult, formData)
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
    navigate('/poultry-calendar-preview');
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
    <div className="fixed inset-0 z-50 bg-neo-text/35 flex items-start justify-center p-4 overflow-y-auto">
      <div className="neo-surface max-w-4xl w-full my-8 max-h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
          <div className="flex-shrink-0">
            <div className="flex justify-between items-center p-6 border-b neo-divider">
              <h2 className="text-xl font-semibold text-neo-text">Create Poultry Calendar</h2>
              <button onClick={onClose} className="neo-icon-button h-10 w-10">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="neo-label mb-1 block">Region <span className="text-red-500">*</span></label>
                <select value={formData.region} onChange={(e) => handleInputChange('region', e.target.value)} className={`neo-control w-full px-3 py-2 ${errors.region ? 'border-red-500' : ''}`}>
                  <option value="">Select Region...</option>
                  {regionNames.map((region) => <option key={region} value={region}>{region}</option>)}
                </select>
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>

              <div>
                <label className="neo-label mb-1 block">District <span className="text-red-500">*</span></label>
                <select value={formData.district} onChange={(e) => handleInputChange('district', e.target.value)} className={`neo-control w-full px-3 py-2 ${errors.district ? 'border-red-500' : ''}`} disabled={!formData.region}>
                  <SafeDistrictOptions districts={districtData.districts} placeholder="Select District..." includeEmpty={true} />
                </select>
                {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
              </div>

              <div>
                <label className="neo-label mb-1 block">Poultry Type <span className="text-red-500">*</span></label>
                <select value={formData.poultryType} onChange={(e) => handleInputChange('poultryType', e.target.value)} className={`neo-control w-full px-3 py-2 ${errors.poultryType ? 'border-red-500' : ''}`}>
                  <option value="">Select Poultry Type...</option>
                  {Object.keys(poultryTypes).map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                {errors.poultryType && <p className="text-red-500 text-xs mt-1">{errors.poultryType}</p>}
              </div>
            </div>

            <div className="neo-surface-soft p-6 mb-8">
              <h3 className="text-lg font-medium text-neo-text mb-6">Production Cycle</h3>
              <div className="space-y-6">
                <div>
                  <label className="neo-label mb-1 block">Excel <span className="text-red-500">*</span></label>
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 cursor-pointer">
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFileChange(e.target.files[0])} className="hidden" />
                      <div className="neo-control w-full px-3 py-2 text-neo-muted hover:text-neo-accent-strong">
                        {formData.productionCycle.file ? formData.productionCycle.file.name : 'Choose File'}
                      </div>
                    </label>
                    {formData.productionCycle.file && <button onClick={removeFile} className="p-2 text-red-500 hover:text-red-700"><FaTrash /></button>}
                  </div>
                  {errors.productionCycleFile && <p className="text-red-500 text-xs mt-1">{errors.productionCycleFile}</p>}
                </div>
                <div>
                  <label className="neo-label mb-1 block">Production Cycle Start Month</label>
                  <select value={formData.productionCycle.startMonth} onChange={(e) => handleCycleChange('startMonth', e.target.value)} className="neo-control w-full px-3 py-2">
                    <option value="">Select Month...</option>
                    {months.map((month) => <option key={month} value={month}>{month}</option>)}
                  </select>
                </div>
                <div>
                  <label className="neo-label mb-1 block">Start Week</label>
                  <input type="date" value={formData.productionCycle.startWeek} onChange={(e) => handleCycleChange('startWeek', e.target.value)} className="neo-input" />
                </div>
              </div>
            </div>
          </div>

          {saveSuccess && <div className="mx-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm font-medium text-green-800">Poultry calendar saved successfully.</p></div>}
          {saveError && <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>}
          {previewError && <div className="mx-6 mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">{previewError}</div>}

          <div className="flex-shrink-0 border-t neo-divider px-6 py-4 bg-white/25">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button onClick={handleDownloadTemplate} className="neo-button"><FaDownload />Download Template</button>
                <button onClick={handlePreview} className="neo-button" disabled={loading || parsingPreview}>
                  {parsingPreview ? <InlineBusySkeleton label="Parsing..." tone="slate" /> : <><FaEye className="mr-2" />Preview Calendar</>}
                </button>
              </div>
              <button onClick={handleSave} className={`neo-button-primary ${saveSuccess ? 'cursor-not-allowed opacity-75' : loading ? 'cursor-not-allowed opacity-75' : ''}`} disabled={loading || saveSuccess}>
                {loading ? <InlineBusySkeleton label="Saving..." /> : saveSuccess ? <><svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Saved Successfully!</> : <><FaPlus className="mr-2" />Save</>}
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
