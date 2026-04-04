import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Calendar, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { getRegionDistrictMapping, getAllRegionNames, getDistrictsByRegionName } from '../data/ghanaCodes';
import userService from '../services/userService';

const EnhancedCalendarUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const fileInputRef = useRef(null);

  const regionNames = getAllRegionNames();

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
      
      // Auto-generate title from filename if not set
      if (!title) {
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(baseName);
      }
    }
  };

  const handleRegionChange = (regionName) => {
    setSelectedRegion(regionName);
    setSelectedDistrict(''); // Reset district when region changes
  };

  const getDistrictsForRegion = (regionName) => {
    return getDistrictsByRegionName(regionName);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a calendar file to upload');
      return;
    }

    if (!selectedRegion || !selectedDistrict) {
      alert('Please select both region and district');
      return;
    }

    try {
      setUploading(true);
      setUploadResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', 'enhanced-calendar');
      formData.append('regionCode', selectedRegion);
      formData.append('districtCode', selectedDistrict);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('year', year.toString());

      const result = await userService.uploadAgriculturalData(
        formData, 
        'enhanced-calendar',
        (progress) => {
          console.log('Upload progress:', progress);
        }
      );

      console.log('Enhanced calendar upload result:', result);
      setUploadResult(result);

      if (result.success) {
        // Reset form
        setFile(null);
        setTitle('');
        setDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

    } catch (error) {
      console.error('Enhanced calendar upload error:', error);
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed',
        error: error.response?.data?.error || 'Unknown error'
      });
    } finally {
      setUploading(false);
    }
  };

  const getCalendarTypeIcon = (calendarType) => {
    switch (calendarType) {
      case 'seasonal':
        return <Calendar className="h-5 w-5 text-green-600" />;
      case 'cycle':
        return <div className="h-5 w-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                 <div className="h-2 w-2 rounded-full bg-blue-600"></div>
               </div>;
      default:
        return <FileSpreadsheet className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCalendarTypeDescription = (calendarType) => {
    switch (calendarType) {
      case 'seasonal':
        return 'Fixed seasonal calendar - activities tied to specific months/seasons';
      case 'cycle':
        return 'Flexible production cycle - can start at any time with relative timing';
      default:
        return 'Calendar type will be automatically detected from file content';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Calendar Upload</h2>
        <p className="text-gray-600">
          Upload Excel-based agricultural calendars. The system automatically detects whether it's a seasonal calendar (crops) or production cycle template (poultry).
        </p>
      </div>

      {/* File Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calendar File (Excel format)
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center space-x-2">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-900 mb-1">
                  Click to upload calendar file
                </p>
                <p className="text-sm text-gray-500">
                  Excel files (.xlsx, .xls) up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Region Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select a region</option>
            {regionNames.map((regionName) => (
              <option key={regionName} value={regionName}>
                {regionName}
              </option>
            ))}
          </select>
        </div>

        {/* District Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={!selectedRegion}
            required
          >
            <option value="">Select a district</option>
            {selectedRegion && getDistrictsForRegion(selectedRegion).map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calendar Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter calendar title"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            min="2020"
            max="2030"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          rows="3"
          placeholder="Add notes or description for this calendar"
        />
      </div>

      {/* Upload Button */}
      <div className="mb-6">
        <button
          onClick={handleUpload}
          disabled={!file || uploading || !selectedRegion || !selectedDistrict}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing Calendar...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Enhanced Calendar
            </>
          )}
        </button>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start">
            {uploadResult.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {uploadResult.success ? 'Calendar Uploaded Successfully!' : 'Upload Failed'}
              </h3>
              <p className={`mt-1 text-sm ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {uploadResult.message}
              </p>
              
              {uploadResult.success && uploadResult.calendarType && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    {getCalendarTypeIcon(uploadResult.calendarType)}
                    <span className="font-medium">
                      {uploadResult.calendarType === 'seasonal' ? 'Seasonal Calendar' : 'Production Cycle Template'}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({typeof uploadResult.commodity === 'object' ? uploadResult.commodity.name : uploadResult.commodity})
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getCalendarTypeDescription(uploadResult.calendarType)}
                  </p>
                  <div className="text-sm text-gray-600">
                    <strong>Activities detected:</strong> {uploadResult.activities || 0}
                  </div>
                </div>
              )}
              
              {!uploadResult.success && uploadResult.error && (
                <p className="mt-1 text-sm text-red-600">
                  Error: {uploadResult.error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-2">Smart Calendar Processing:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Seasonal Calendars:</strong> For crops with fixed planting seasons (maize, rice, vegetables)</li>
              <li>• <strong>Production Cycles:</strong> For poultry with flexible start dates (broiler, layer, etc.)</li>
              <li>• <strong>Auto-Detection:</strong> System identifies calendar type from Excel structure and commodity</li>
              <li>• <strong>Activity Mapping:</strong> Extracts activities and timeline from Excel layout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCalendarUpload;