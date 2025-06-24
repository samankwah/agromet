import { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import TemplateGenerationService from '../../services/templateGenerationService';

// Ghana regions and districts data (same as crop calendar)
const ghanaRegionsDistricts = {
  "Ahafo Region": ["Asunafo North", "Asunafo South", "Asutifi North", "Asutifi South", "Tano North", "Tano South"],
  "Ashanti Region": ["Adansi North", "Adansi South", "Afigya Kwabre North", "Afigya Kwabre South", "Afigya Sekyere East", "Ahafo Ano North", "Ahafo Ano South East", "Ahafo Ano South West", "Amansie Central", "Amansie South", "Amansie West", "Atwima Kwanwoma", "Atwima Mponua", "Atwima Nwabiagya North", "Atwima Nwabiagya South", "Bekwai", "Bosome Freho", "Bosomtwe", "Ejisu", "Ejura Sekyedumase", "Juaben", "Kwabre East", "Kumasi", "Mampong", "Nsuta Kwamang Beposo", "Obuasi East", "Obuasi West", "Offinso North", "Offinso South", "Oforikrom", "Old Tafo", "Sekyere Afram Plains", "Sekyere Central", "Sekyere East", "Sekyere Kumawu", "Sekyere South"],
  "Bono Region": ["Banda", "Berekum East", "Berekum West", "Dormaa Central", "Dormaa East", "Dormaa West", "Jaman North", "Jaman South", "Sunyani", "Sunyani West", "Tain", "Wenchi"],
  "Bono East Region": ["Atebubu Amantin", "Kintampo North", "Kintampo South", "Nkoranza North", "Nkoranza South", "Pru East", "Pru West", "Sene East", "Sene West", "Techiman North", "Techiman South"],
  "Central Region": ["Abura Asebu Kwamankese", "Agona East", "Agona West", "Ajumako Enyan Essiam", "Asikuma Odoben Brakwa", "Assin Central", "Assin North", "Assin South", "Awutu Senya", "Awutu Senya East", "Cape Coast", "Effutu", "Ekumfi", "Gomoa Central", "Gomoa East", "Gomoa West", "Kasoa", "Komenda Edina Eguafo Abirem", "Mfantsiman", "Twifo Ati Morkwa", "Twifo Hemang Lower Denkyira", "Upper Denkyira East", "Upper Denkyira West"],
  "Eastern Region": ["Abuakwa North", "Abuakwa South", "Achiase", "Afram Plains North", "Afram Plains South", "Akim East", "Akim West", "Akuapim North", "Akuapim South", "Asene Manso Akroso", "Atiwa East", "Atiwa West", "Ayensuano", "Birim Central", "Birim North", "Birim South", "Denkyembour", "East Akim", "Fanteakwa North", "Fanteakwa South", "Kwaebibirem", "Kwahu Afram Plains South", "Kwahu East", "Kwahu South", "Kwahu West", "Lower Manya Krobo", "New Juaben North", "New Juaben South", "Nsawam Adoagyir", "Okere", "Suhum", "Upper Manya Krobo", "Upper West Akim", "West Akim", "Yilo Krobo"],
  "Greater Accra Region": ["Ablekuma Central", "Ablekuma North", "Ablekuma West", "Accra", "Ada East", "Ada West", "Adenta", "Ashaiman", "Ayawaso Central", "Ayawaso East", "Ayawaso North", "Ayawaso West Wuogon", "Ga Central", "Ga East", "Ga North", "Ga South", "Ga West", "Kpone Katamanso", "Krowor", "La Dade Kotopon", "La Nkwantanang Madina", "Ledzokuku", "Okaikwei North", "Okaikwei South", "Shai Osudoku", "Tema East", "Tema West", "Weija Gbawe"],
  "North East Region": ["Bunkpurugu Nakpanduri", "Chereponi", "East Mamprusi", "Mamprugu Moagduri", "West Mamprusi", "Yunyoo Nasuan"],
  "Northern Region": ["Bole", "Central Gonja", "East Gonja", "Gushegu", "Karaga", "Kpandai", "Kumbungu", "Mion", "Nanumba North", "Nanumba South", "North Gonja", "Saboba", "Savelugu", "Sawla Tuna Kalba", "Tamale", "Tatale Sanguli", "Tolon", "West Gonja", "Yendi", "Zabzugu"],
  "Oti Region": ["Biakoye", "Jasikan", "Kadjebi", "Krachi East", "Krachi Nchumuru", "Krachi West", "Nkwanta North", "Nkwanta South"],
  "Savannah Region": ["Bole", "Central Gonja", "East Gonja", "North Gonja", "Sawla Tuna Kalba", "West Gonja", "Yapei Kusawgu"],
  "Upper East Region": ["Bawku", "Bawku West", "Binduri", "Bolgatanga", "Builsa North", "Builsa South", "Garu", "Kassena Nankana East", "Kassena Nankana West", "Nabdam", "Pusiga", "Talensi", "Tempane"],
  "Upper West Region": ["Daffiama Bussie Issa", "Jirapa", "Lambussie Karni", "Lawra", "Nadowli Kaleo", "Nandom", "Sissala East", "Sissala West", "Wa East", "Wa West"],
  "Volta Region": ["Adaklu", "Agotime Ziope", "Akatsi North", "Akatsi South", "Central Tongu", "Ho", "Ho West", "Hohoe", "Keta", "Ketu North", "Ketu South", "North Dayi", "North Tongu", "South Dayi", "South Tongu", "Volta Region"],
  "Western Region": ["Ahanta West", "Ellembelle", "Jomoro", "Mpohor", "Nzema East", "Prestea Huni Valley", "Sekondi Takoradi", "Shama", "Tarkwa Nsuaem", "Wassa Amenfi Central", "Wassa Amenfi East", "Wassa Amenfi West", "Wassa East", "Wiawso"],
  "Western North Region": ["Aowin", "Bia East", "Bia West", "Bibiani Anhwiaso Bekwai", "Bodi", "Juaboso", "Sefwi Akontombra", "Sefwi Wiawso", "Suaman"]
};

// Poultry types and breeds
const poultryTypes = {
  "Broiler": ["Cobb 500", "Ross 308", "Arbor Acres", "Hubbard Classic"],
  "Layer": ["Isa Brown", "Lohmann Brown", "Bovans Brown", "Dekalb White"],
  "Cockerel": ["Sasso", "Kuroiler", "Noiler", "Local Breeds"],
  "Duck": ["Pekin", "Khaki Campbell", "Muscovy", "Local Duck"],
  "Turkey": ["Broad Breasted White", "Bronze", "Local Turkey"],
  "Guinea Fowl": ["Helmeted Guinea", "Local Guinea Fowl"],
  "Goose": ["Embden", "Toulouse", "Local Goose"]
};

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
  const [formData, setFormData] = useState({
    region: '',
    district: '',
    poultryType: '',
    breed: '',
    majorCycle: {
      file: null,
      startMonth: '',
      startWeek: ''
    },
    minorCycle: {
      file: null,
      startMonth: '',
      startWeek: ''
    }
  });

  const [districts, setDistricts] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  // Update districts when region changes
  useEffect(() => {
    if (formData.region && ghanaRegionsDistricts[formData.region]) {
      setDistricts(ghanaRegionsDistricts[formData.region]);
      setFormData(prev => ({ ...prev, district: '' }));
    }
  }, [formData.region]);

  // Update breeds when poultry type changes
  useEffect(() => {
    if (formData.poultryType && poultryTypes[formData.poultryType]) {
      setBreeds(poultryTypes[formData.poultryType]);
      setFormData(prev => ({ ...prev, breed: '' }));
    }
  }, [formData.poultryType]);

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

  const handleCycleChange = (cycle, field, value) => {
    setFormData(prev => ({
      ...prev,
      [cycle]: {
        ...prev[cycle],
        [field]: value
      }
    }));
  };

  const handleFileChange = (cycle, file) => {
    if (file) {
      setFormData(prev => ({
        ...prev,
        [cycle]: {
          ...prev[cycle],
          file: file
        }
      }));
    }
  };

  const removeFile = (cycle) => {
    setFormData(prev => ({
      ...prev,
      [cycle]: {
        ...prev[cycle],
        file: null
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.poultryType) newErrors.poultryType = 'Poultry type is required';
    if (!formData.breed) newErrors.breed = 'Breed is required';
    
    if (!formData.majorCycle.file) newErrors.majorCycleFile = 'Major cycle file is required';
    if (!formData.majorCycle.startMonth) newErrors.majorCycleMonth = 'Major cycle start month is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePreviewData = () => {
    const baseData = {
      region: formData.region,
      district: formData.district,
      poultryType: formData.poultryType,
      breed: formData.breed,
      commodityCode: `PT${Math.random().toString().substring(2, 12)}`, // Generate sample poultry code
    };

    const previewRows = [];
    
    if (formData.majorCycle.file) {
      previewRows.push({
        ...baseData,
        cycle: 'Major',
        startMonth: formData.majorCycle.startMonth,
        startWeek: formData.majorCycle.startWeek || 'TBD',
        stage: 'General',
        healthManagement: 'Standard',
        activities: 'Sample activities from uploaded file',
        requirements: 'Sample requirements from uploaded file'
      });
    }

    if (formData.minorCycle.file) {
      previewRows.push({
        ...baseData,
        cycle: 'Minor',
        startMonth: formData.minorCycle.startMonth,
        startWeek: formData.minorCycle.startWeek || 'TBD',
        stage: 'General',
        healthManagement: 'Standard',
        activities: 'Sample activities from uploaded file',
        requirements: 'Sample requirements from uploaded file'
      });
    }

    return previewRows;
  };

  const handlePreview = () => {
    if (validateForm()) {
      const preview = generatePreviewData();
      setPreviewData(preview);
      setShowPreview(true);
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
      submitData.append('breed', formData.breed);
      
      // Add major cycle data
      if (formData.majorCycle.file) {
        submitData.append('majorCycleFile', formData.majorCycle.file);
        submitData.append('majorCycleMonth', formData.majorCycle.startMonth);
        submitData.append('majorCycleWeek', formData.majorCycle.startWeek);
      }
      
      // Add minor cycle data
      if (formData.minorCycle.file) {
        submitData.append('minorCycleFile', formData.minorCycle.file);
        submitData.append('minorCycleMonth', formData.minorCycle.startMonth);
        submitData.append('minorCycleWeek', formData.minorCycle.startWeek);
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
          breed: '',
          majorCycle: { file: null, startMonth: '', startWeek: '' },
          minorCycle: { file: null, startMonth: '', startWeek: '' }
        });
        setPreviewData(null);
        setShowPreview(false);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Poultry Calendar</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!showPreview ? (
            <>
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    {Object.keys(ghanaRegionsDistricts).map(region => (
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
                    <option value="">Select District...</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
                  <p className="text-gray-500 text-xs mt-1">Enter the district</p>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breed <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.breed}
                    onChange={(e) => handleInputChange('breed', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.breed ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!formData.poultryType}
                  >
                    <option value="">Select Breed...</option>
                    {breeds.map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                  {errors.breed && <p className="text-red-500 text-xs mt-1">{errors.breed}</p>}
                  <p className="text-gray-500 text-xs mt-1">Enter the breed</p>
                </div>
              </div>

              {/* Production Cycles Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Major Cycle */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Major Production Cycle</h3>
                  
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
                            onChange={(e) => handleFileChange('majorCycle', e.target.files[0])}
                            className="hidden"
                          />
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                            {formData.majorCycle.file ? formData.majorCycle.file.name : 'Choose File'}
                          </div>
                        </label>
                        {formData.majorCycle.file && (
                          <button
                            onClick={() => removeFile('majorCycle')}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      {errors.majorCycleFile && <p className="text-red-500 text-xs mt-1">{errors.majorCycleFile}</p>}
                      <p className="text-gray-500 text-xs mt-1">Upload Excel1</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Major Cycle Start Month <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.majorCycle.startMonth}
                        onChange={(e) => handleCycleChange('majorCycle', 'startMonth', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.majorCycleMonth ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Month...</option>
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      {errors.majorCycleMonth && <p className="text-red-500 text-xs mt-1">{errors.majorCycleMonth}</p>}
                      <p className="text-gray-500 text-xs mt-1">Enter major cycle start month</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Week <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.majorCycle.startWeek}
                        onChange={(e) => handleCycleChange('majorCycle', 'startWeek', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>


                  </div>
                </div>

                {/* Minor Cycle */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Minor Production Cycle</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Excel</label>
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => handleFileChange('minorCycle', e.target.files[0])}
                            className="hidden"
                          />
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                            {formData.minorCycle.file ? formData.minorCycle.file.name : 'Choose File'}
                          </div>
                        </label>
                        {formData.minorCycle.file && (
                          <button
                            onClick={() => removeFile('minorCycle')}
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
                        Minor Cycle Start Month
                      </label>
                      <select
                        value={formData.minorCycle.startMonth}
                        onChange={(e) => handleCycleChange('minorCycle', 'startMonth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Month...</option>
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      <p className="text-gray-500 text-xs mt-1">Enter minor cycle start month</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Week
                      </label>
                      <input
                        type="date"
                        value={formData.minorCycle.startWeek}
                        onChange={(e) => handleCycleChange('minorCycle', 'startWeek', e.target.value)}
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
                    disabled={loading}
                  >
                    <FaEye className="mr-2" />
                    Preview
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
            </>
          ) : (
            /* Preview Section */
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Poultry Calendar Data Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Back to Edit
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poultry Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Mgmt</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData?.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.region}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.district}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.poultryType}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.breed}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            row.cycle === 'Major' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {row.cycle}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.startMonth}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.stage}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.healthManagement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
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
                      Confirm & Save
                    </>
                  )}
                </button>
              </div>
            </>
          )}
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