import { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import PropTypes from 'prop-types';
import userService from '../../services/userService';
import TemplateGenerationService from '../../services/templateGenerationService';

// Ghana regions and districts data
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

  const [districts, setDistricts] = useState([]);
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
    if (!formData.majorSeason.startMonth) newErrors.majorSeasonMonth = 'Major season start month is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePreviewData = () => {
    const baseData = {
      region: formData.region,
      district: formData.district,
      crop: formData.crop,
      commodityCode: `CT${Math.random().toString().substring(2, 12)}`, // Generate sample commodity code
    };

    const previewRows = [];
    
    if (formData.majorSeason.file) {
      previewRows.push({
        ...baseData,
        season: 'Major',
        startMonth: formData.majorSeason.startMonth,
        startWeek: formData.majorSeason.startWeek || 'TBD',
        type: 'General',
        activities: 'Sample activities from uploaded file',
        recommendations: 'Sample recommendations from uploaded file'
      });
    }

    if (formData.minorSeason.file) {
      previewRows.push({
        ...baseData,
        season: 'Minor',
        startMonth: formData.minorSeason.startMonth,
        startWeek: formData.minorSeason.startWeek || 'TBD',
        type: 'General',
        activities: 'Sample activities from uploaded file',
        recommendations: 'Sample recommendations from uploaded file'
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
        alert('Crop calendar saved successfully!');
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
        throw new Error(result.error || 'Failed to save crop calendar');
      }
    } catch (error) {
      console.error('Error saving crop calendar:', error);
      alert('Error saving crop calendar: ' + error.message);
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
      alert('Error generating template. Please try again.');
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
          {!showPreview ? (
            <>
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
                <h3 className="text-lg font-semibold text-gray-900">Calendar Data Preview</h3>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Season</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Week</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activities</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData?.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.region}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.district}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.crop}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            row.season === 'Major' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {row.season}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.startMonth}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.startWeek}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.activities}</td>
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

CropCalendarForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default CropCalendarForm;