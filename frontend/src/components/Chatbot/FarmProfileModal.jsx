import { useState } from 'react';
import { FaTimes, FaUser, FaMapMarkerAlt, FaSeedling, FaBullseye } from 'react-icons/fa';
import PropTypes from 'prop-types';
import personalizedFarmingService from '../../services/personalizedFarmingService';
import { getAllRegionNames } from '../../data/ghanaCodes';
import T from '../common/T';
import useT from '../../hooks/useT';

const FarmProfileModal = ({ isOpen, onClose, onProfileCreated }) => {
  const { t } = useT();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    personal: {
      name: '',
      experience: 'beginner',
      language: 'en',
      region: '',
      district: ''
    },
    farm: {
      size: { value: '', unit: 'acres' },
      soilType: '',
      waterSource: '',
      farmingSystem: '',
      elevation: '',
      slope: ''
    },
    crops: {
      current: [],
      preferred: [],
      experience: {},
      varieties: {},
      yields: {}
    },
    goals: {
      primary: '',
      yield_target: {},
      market_focus: '',
      sustainability: []
    },
    resources: {
      budget: { range: '', currency: 'GHS' },
      equipment: [],
      labor: '',
      storage: '',
      transportation: ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Get regions from centralized data
  const ghanaRegions = getAllRegionNames();

  const commonCrops = [
    'maize', 'rice', 'cassava', 'yam', 'plantain', 'cocoyam', 'tomatoes',
    'pepper', 'onion', 'beans', 'groundnuts', 'soybeans', 'millet', 'sorghum',
    'cocoa', 'oil palm', 'vegetables', 'fruits'
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear errors for this field
    if (errors[`${section}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (section, field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: checked 
          ? [...prev[section][field], value]
          : prev[section][field].filter(item => item !== value)
      }
    }));
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!formData.personal.name.trim()) {
        newErrors['personal.name'] = 'Name is required';
      }
      if (!formData.personal.region) {
        newErrors['personal.region'] = 'Region is required';
      }
    }

    if (stepNumber === 2) {
      if (!formData.farm.size.value || formData.farm.size.value <= 0) {
        newErrors['farm.size.value'] = 'Farm size must be greater than 0';
      }
      if (!formData.farm.soilType) {
        newErrors['farm.soilType'] = 'Soil type is required';
      }
      if (!formData.farm.waterSource) {
        newErrors['farm.waterSource'] = 'Water source is required';
      }
    }

    if (stepNumber === 3) {
      if (formData.crops.current.length === 0) {
        newErrors['crops.current'] = 'Please select at least one current crop';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    
    try {
      const result = await personalizedFarmingService.createFarmProfile(formData);
      
      if (result.success) {
        onProfileCreated(result.profile);
        onClose();
      } else {
        setErrors(result.errors || { general: 'Failed to create profile' });
      }
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neo-text/35 flex items-center justify-center z-50 p-4">
      <div className="neo-surface max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b neo-divider">
          <h2 className="text-xl font-bold text-neo-text">
            <T>Create Your Farm Profile</T>
          </h2>
          <button
            onClick={onClose}
            className="neo-icon-button h-10 w-10"
            aria-label={t('Close profile form')}
          >
            <FaTimes />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b neo-divider">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  stepNum <= step 
                    ? 'bg-neo-accent text-white shadow-neo-soft' 
                    : 'bg-neo-bg text-neo-muted shadow-neo-pressed'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-neo-muted">
            <span><T>Personal Info</T></span>
            <span><T>Farm Details</T></span>
            <span><T>Crops & Goals</T></span>
            <span><T>Resources</T></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaUser className="text-neo-accent" />
                <h3 className="text-lg font-semibold text-neo-text">
                  <T>Personal Information</T>
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Full Name</T> *
                </label>
                <input
                  type="text"
                  value={formData.personal.name}
                  onChange={(e) => handleInputChange('personal', 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('Enter your full name')}
                />
                {errors['personal.name'] && (
                  <p className="text-red-500 text-xs mt-1"><T>{errors['personal.name']}</T></p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Region</T> *
                </label>
                <select
                  value={formData.personal.region}
                  onChange={(e) => handleInputChange('personal', 'region', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t('Select your region')}</option>
                  {ghanaRegions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                {errors['personal.region'] && (
                  <p className="text-red-500 text-xs mt-1"><T>{errors['personal.region']}</T></p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Farming Experience</T>
                </label>
                <select
                  value={formData.personal.experience}
                  onChange={(e) => handleInputChange('personal', 'experience', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="beginner">{t('Beginner (0-2 years)')}</option>
                  <option value="intermediate">{t('Intermediate (2-5 years)')}</option>
                  <option value="experienced">{t('Experienced (5+ years)')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Farm Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaMapMarkerAlt className="text-green-500" />
                <h3 className="text-lg font-semibold">
                  <T>Farm Details</T>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <T>Farm Size</T> *
                  </label>
                  <input
                    type="number"
                    value={formData.farm.size.value}
                    onChange={(e) => handleInputChange('farm', 'size', { ...formData.farm.size, value: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                  {errors['farm.size.value'] && (
                    <p className="text-red-500 text-xs mt-1"><T>{errors['farm.size.value']}</T></p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <T>Unit</T>
                  </label>
                  <select
                    value={formData.farm.size.unit}
                    onChange={(e) => handleInputChange('farm', 'size', { ...formData.farm.size, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="acres">{t('Acres')}</option>
                    <option value="hectares">{t('Hectares')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Soil Type</T> *
                </label>
                <select
                  value={formData.farm.soilType}
                  onChange={(e) => handleInputChange('farm', 'soilType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t('Select soil type')}</option>
                  <option value="sandy">{t('Sandy')}</option>
                  <option value="clay">{t('Clay')}</option>
                  <option value="loam">{t('Loam')}</option>
                  <option value="laterite">{t('Laterite')}</option>
                  <option value="mixed">{t('Mixed')}</option>
                </select>
                {errors['farm.soilType'] && (
                  <p className="text-red-500 text-xs mt-1"><T>{errors['farm.soilType']}</T></p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Primary Water Source</T> *
                </label>
                <select
                  value={formData.farm.waterSource}
                  onChange={(e) => handleInputChange('farm', 'waterSource', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t('Select water source')}</option>
                  <option value="rain-fed">{t('Rain-fed')}</option>
                  <option value="irrigation">{t('Irrigation system')}</option>
                  <option value="borehole">{t('Borehole')}</option>
                  <option value="river">{t('River/Stream')}</option>
                  <option value="well">{t('Well')}</option>
                </select>
                {errors['farm.waterSource'] && (
                  <p className="text-red-500 text-xs mt-1"><T>{errors['farm.waterSource']}</T></p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Crops & Goals */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaSeedling className="text-green-500" />
                <h3 className="text-lg font-semibold">
                  <T>Crops & Goals</T>
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <T>Current Crops</T> * (<T>Select all that apply</T>)
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {commonCrops.map((crop) => (
                    <label key={crop} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.crops.current.includes(crop)}
                        onChange={(e) => handleArrayChange('crops', 'current', crop, e.target.checked)}
                        className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                      />
                      <span className="capitalize"><T>{crop}</T></span>
                    </label>
                  ))}
                </div>
                {errors['crops.current'] && (
                  <p className="text-red-500 text-xs mt-1"><T>{errors['crops.current']}</T></p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Primary Farming Goal</T>
                </label>
                <select
                  value={formData.goals.primary}
                  onChange={(e) => handleInputChange('goals', 'primary', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t('Select your main goal')}</option>
                  <option value="income">{t('Generate income')}</option>
                  <option value="food_security">{t('Food security')}</option>
                  <option value="export">{t('Export market')}</option>
                  <option value="processing">{t('Value addition/processing')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Resources */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaBullseye className="text-green-500" />
                <h3 className="text-lg font-semibold">
                  <T>Resources & Preferences</T>
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Budget Range</T>
                </label>
                <select
                  value={formData.resources.budget.range}
                  onChange={(e) => handleInputChange('resources', 'budget', { ...formData.resources.budget, range: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t('Select budget range')}</option>
                  <option value="limited">{t('Limited (Under GHS 1,000)')}</option>
                  <option value="moderate">{t('Moderate (GHS 1,000 - 5,000)')}</option>
                  <option value="substantial">{t('Substantial (GHS 5,000 - 20,000)')}</option>
                  <option value="extensive">{t('Extensive (Above GHS 20,000)')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Labor Source</T>
                </label>
                <select
                  value={formData.resources.labor}
                  onChange={(e) => handleInputChange('resources', 'labor', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t('Select labor source')}</option>
                  <option value="family">{t('Family labor')}</option>
                  <option value="hired">{t('Hired labor')}</option>
                  <option value="community">{t('Community support')}</option>
                  <option value="mixed">{t('Mixed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T>Storage Facilities</T>
                </label>
                <select
                  value={formData.resources.storage}
                  onChange={(e) => handleInputChange('resources', 'storage', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t('Select storage type')}</option>
                  <option value="none">{t('No storage facility')}</option>
                  <option value="on-farm">{t('On-farm storage')}</option>
                  <option value="warehouse">{t('Warehouse')}</option>
                  <option value="cooperative">{t('Cooperative storage')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-red-600 text-sm"><T>{errors.general}</T></p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <T>Previous</T>
            </button>

            <span className="text-sm text-gray-500">
              <T>Step</T> {step} <T>of</T> 4
            </span>

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <T>Next</T>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? <T>Creating Profile...</T> : <T>Create Profile</T>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

FarmProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onProfileCreated: PropTypes.func.isRequired,
};

export default FarmProfileModal;
