import React, { useState } from "react";
import { FaCalendarAlt, FaFileExcel, FaTimes } from "react-icons/fa";
import { useSpring, animated } from "react-spring";
import { districtOfGhana } from "../../districts";
import { POULTRY_TYPES } from "../../data/ghanaCodes";
import { logger } from "../../utils/logger";
import { validateFile, FileValidationError } from "../../utils/fileValidation";

const CreatePoultryCalendar = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    region: "",
    district: "",
    poultryType: "",
    productionCycleExcel: null,
    productionCycleStartMonth: "",
    productionCycleStartWeek: "",
    productionCycleType: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation for modal
  const modalAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "translateY(0)" : "translateY(-50px)",
    config: { tension: 300, friction: 30 },
  });

  const backdropAnimation = useSpring({
    opacity: isOpen ? 0.5 : 0,
    config: { tension: 300, friction: 30 },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    logger.userAction('Form field changed', { field: name, value: value ? 'filled' : 'empty' });
    
    if (name === "region") {
      // Reset district when region changes
      setFormData({ ...formData, region: value, district: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    
    if (!file) return;

    try {
      // Validate file
      const validation = validateFile(file, {
        ALLOWED_EXCEL_TYPES: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ],
        ALLOWED_EXTENSIONS: ['.xlsx', '.xls']
      });

      setFormData({ ...formData, [field]: file });
      setErrors(prev => ({ ...prev, [field]: null }));
      
      logger.info('File selected and validated', { 
        field, 
        filename: file.name, 
        size: validation.sizeFormatted 
      });

    } catch (error) {
      if (error instanceof FileValidationError) {
        setErrors(prev => ({ ...prev, [field]: error.message }));
        logger.warn('File validation failed', { 
          field, 
          error: error.message, 
          filename: file.name 
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.poultryType) newErrors.poultryType = 'Poultry type is required';
    if (!formData.productionCycleExcel) newErrors.productionCycleExcel = 'Production cycle Excel file is required';
    if (!formData.productionCycleStartMonth) newErrors.productionCycleStartMonth = 'Production cycle start month is required';
    if (!formData.productionCycleStartWeek) newErrors.productionCycleStartWeek = 'Production cycle start week is required';
    if (!formData.productionCycleType) newErrors.productionCycleType = 'Production cycle type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    logger.userAction('Poultry calendar form submitted');

    if (!validateForm()) {
      logger.warn('Form validation failed', { errorCount: Object.keys(errors).length });
      return;
    }

    setIsSubmitting(true);

    try {
      logger.info('Poultry calendar data', formData);
      
      // TODO: Add API call here when backend endpoint is ready
      // const result = await userService.createPoultryCalendar(formData);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('Poultry calendar created successfully');
      
      // Reset form and close modal
      setFormData({
        region: "",
        district: "",
        poultryType: "",
        productionCycleExcel: null,
        productionCycleStartMonth: "",
        productionCycleStartWeek: "",
        productionCycleType: "",
      });
      
      onClose();
      
    } catch (error) {
      logger.error('Error creating poultry calendar', error);
      setErrors({ submit: 'Failed to create poultry calendar. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    logger.userAction('Poultry calendar modal closed');
    onClose();
  };

  // Get the districts for the selected region
  const selectedRegion = districtOfGhana.find(
    (regionData) => regionData.region === formData.region
  );
  const districts = selectedRegion ? selectedRegion.districts : [];

  // Get poultry types for dropdown
  const poultryTypes = Object.values(POULTRY_TYPES).map(type => ({
    value: type.name.toLowerCase(),
    label: type.name
  }));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <animated.div
        style={backdropAnimation}
        className="fixed inset-0 bg-black z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <animated.div
        style={modalAnimation}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Create Poultry Calendar
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Region, District, Poultry Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.region ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Region...</option>
                    {districtOfGhana.map((regionData) => (
                      <option key={regionData.region} value={regionData.region}>
                        {regionData.region}
                      </option>
                    ))}
                  </select>
                  {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.district ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    disabled={!formData.region}
                  >
                    <option value="">Select District...</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poultry Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="poultryType"
                    value={formData.poultryType}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.poultryType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Poultry Type...</option>
                    {poultryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.poultryType && <p className="text-red-500 text-sm mt-1">{errors.poultryType}</p>}
                </div>
              </div>

              {/* Production Cycle Section */}
              <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Production Cycle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excel File <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="w-1/3 p-3 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-pointer hover:bg-gray-100 transition-all text-center">
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={(e) => handleFileChange(e, "productionCycleExcel")}
                          className="hidden"
                        />
                        Choose File
                      </label>
                      <span className="text-sm text-gray-500 truncate flex-1">
                        {formData.productionCycleExcel
                          ? formData.productionCycleExcel.name
                          : "No file chosen"}
                      </span>
                    </div>
                    {errors.productionCycleExcel && <p className="text-red-500 text-sm mt-1">{errors.productionCycleExcel}</p>}
                    <p className="text-xs text-gray-500 mt-2">
                      Upload Excel file for Production Cycle
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Week <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="productionCycleStartWeek"
                        value={formData.productionCycleStartWeek}
                        onChange={handleInputChange}
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.productionCycleStartWeek ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.productionCycleStartWeek && <p className="text-red-500 text-sm mt-1">{errors.productionCycleStartWeek}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="productionCycleStartMonth"
                      value={formData.productionCycleStartMonth}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.productionCycleStartMonth ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select Month...</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                    {errors.productionCycleStartMonth && <p className="text-red-500 text-sm mt-1">{errors.productionCycleStartMonth}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Production Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="productionCycleType"
                      value={formData.productionCycleType}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.productionCycleType ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select Production Type...</option>
                      <option value="commercial">Commercial</option>
                      <option value="smallholder">Smallholder</option>
                      <option value="intensive">Intensive</option>
                      <option value="semi-intensive">Semi-Intensive</option>
                      <option value="extensive">Extensive</option>
                    </select>
                    {errors.productionCycleType && <p className="text-red-500 text-sm mt-1">{errors.productionCycleType}</p>}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaFileExcel className="mr-2" />
                      Create Calendar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </animated.div>
    </>
  );
};

export default CreatePoultryCalendar;