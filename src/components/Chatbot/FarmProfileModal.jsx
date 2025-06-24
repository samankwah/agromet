import { useState } from 'react';
import { FaTimes, FaUser, FaMapMarkerAlt, FaSeedling, FaBullseye } from 'react-icons/fa';
import PropTypes from 'prop-types';
import personalizedFarmingService from '../../services/personalizedFarmingService';

const FarmProfileModal = ({ isOpen, onClose, onProfileCreated }) => {
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

  const ghanaRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta',
    'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo', 'Western North',
    'Ahafo', 'Bono', 'Bono East', 'Oti', 'North East', 'Savannah'
  ];

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Create Your Farm Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  stepNum <= step 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Personal Info</span>
            <span>Farm Details</span>
            <span>Crops & Goals</span>
            <span>Resources</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaUser className="text-green-500" />
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.personal.name}
                  onChange={(e) => handleInputChange('personal', 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your full name"
                />
                {errors['personal.name'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['personal.name']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region *
                </label>
                <select
                  value={formData.personal.region}
                  onChange={(e) => handleInputChange('personal', 'region', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select your region</option>
                  {ghanaRegions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                {errors['personal.region'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['personal.region']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farming Experience
                </label>
                <select
                  value={formData.personal.experience}
                  onChange={(e) => handleInputChange('personal', 'experience', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="beginner">Beginner (0-2 years)</option>
                  <option value="intermediate">Intermediate (2-5 years)</option>
                  <option value="experienced">Experienced (5+ years)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Farm Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaMapMarkerAlt className="text-green-500" />
                <h3 className="text-lg font-semibold">Farm Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farm Size *
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
                    <p className="text-red-500 text-xs mt-1">{errors['farm.size.value']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.farm.size.unit}
                    onChange={(e) => handleInputChange('farm', 'size', { ...formData.farm.size, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soil Type *
                </label>
                <select
                  value={formData.farm.soilType}
                  onChange={(e) => handleInputChange('farm', 'soilType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select soil type</option>
                  <option value="sandy">Sandy</option>
                  <option value="clay">Clay</option>
                  <option value="loam">Loam</option>
                  <option value="laterite">Laterite</option>
                  <option value="mixed">Mixed</option>
                </select>
                {errors['farm.soilType'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['farm.soilType']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Water Source *
                </label>
                <select
                  value={formData.farm.waterSource}
                  onChange={(e) => handleInputChange('farm', 'waterSource', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select water source</option>
                  <option value="rain-fed">Rain-fed</option>
                  <option value="irrigation">Irrigation system</option>
                  <option value="borehole">Borehole</option>
                  <option value="river">River/Stream</option>
                  <option value="well">Well</option>
                </select>
                {errors['farm.waterSource'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['farm.waterSource']}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Crops & Goals */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaSeedling className="text-green-500" />
                <h3 className="text-lg font-semibold">Crops & Goals</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Crops * (Select all that apply)
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
                      <span className="capitalize">{crop}</span>
                    </label>
                  ))}
                </div>
                {errors['crops.current'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['crops.current']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Farming Goal
                </label>
                <select
                  value={formData.goals.primary}
                  onChange={(e) => handleInputChange('goals', 'primary', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select your main goal</option>
                  <option value="income">Generate income</option>
                  <option value="food_security">Food security</option>
                  <option value="export">Export market</option>
                  <option value="processing">Value addition/processing</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Resources */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaBullseye className="text-green-500" />
                <h3 className="text-lg font-semibold">Resources & Preferences</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Range
                </label>
                <select
                  value={formData.resources.budget.range}
                  onChange={(e) => handleInputChange('resources', 'budget', { ...formData.resources.budget, range: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select budget range</option>
                  <option value="limited">Limited (Under GHS 1,000)</option>
                  <option value="moderate">Moderate (GHS 1,000 - 5,000)</option>
                  <option value="substantial">Substantial (GHS 5,000 - 20,000)</option>
                  <option value="extensive">Extensive (Above GHS 20,000)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labor Source
                </label>
                <select
                  value={formData.resources.labor}
                  onChange={(e) => handleInputChange('resources', 'labor', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select labor source</option>
                  <option value="family">Family labor</option>
                  <option value="hired">Hired labor</option>
                  <option value="community">Community support</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Facilities
                </label>
                <select
                  value={formData.resources.storage}
                  onChange={(e) => handleInputChange('resources', 'storage', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select storage type</option>
                  <option value="none">No storage facility</option>
                  <option value="on-farm">On-farm storage</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="cooperative">Cooperative storage</option>
                </select>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-red-600 text-sm">{errors.general}</p>
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
              Previous
            </button>

            <span className="text-sm text-gray-500">
              Step {step} of 4
            </span>

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
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