import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import ghanaRegionsData from '../assets/ghana-regions.json';
import { Cloud, CloudRain, Sun, Thermometer, Droplets, Wind, Eye, Gauge } from 'lucide-react';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ghana regions with their geographic centers and weather/agricultural info
const GHANA_REGIONS = {
  'Greater Accra': {
    center: [5.6037, -0.1870],
    zoom: 10,
    color: '#3B82F6',
    weatherColor: '#60A5FA',
    population: '5.4M',
    agroZone: 'Coastal Plains',
    majorCrops: ['Maize', 'Vegetables', 'Cassava', 'Coconut'],
    description: 'Urban agricultural zone with focus on market gardening and urban farming',
    weather: {
      temperature: '27°C',
      condition: 'Partly Cloudy',
      humidity: '78%',
      windSpeed: '15 km/h',
      rainfall: '2.5mm',
      visibility: '10km',
      pressure: '1013 hPa',
      icon: 'cloud'
    }
  },
  'Ashanti': {
    center: [6.7924, -1.6180],
    zoom: 9,
    color: '#10B981',
    weatherColor: '#34D399',
    population: '5.8M',
    agroZone: 'Forest Zone',
    majorCrops: ['Cocoa', 'Plantain', 'Cassava', 'Yam', 'Maize'],
    description: 'Rich forest soils ideal for tree crops and root vegetables',
    weather: {
      temperature: '25°C',
      condition: 'Rainy',
      humidity: '85%',
      windSpeed: '12 km/h',
      rainfall: '8.2mm',
      visibility: '8km',
      pressure: '1011 hPa',
      icon: 'cloud-rain'
    }
  },
  'Western': {
    center: [5.5599, -2.6967],
    zoom: 9,
    color: '#45B7D1',
    population: '2.6M',
    agroZone: 'Forest Zone',
    majorCrops: ['Cocoa', 'Oil Palm', 'Rubber', 'Coconut', 'Plantain'],
    description: 'Major cocoa and oil palm production region'
  },
  'Central': {
    center: [5.4518, -1.3955],
    zoom: 10,
    color: '#96CEB4',
    population: '2.9M',
    agroZone: 'Forest Zone',
    majorCrops: ['Cassava', 'Maize', 'Plantain', 'Vegetables'],
    description: 'Coastal and forest zone agriculture with fishing communities'
  },
  'Eastern': {
    center: [6.2187, -0.7079],
    zoom: 9,
    color: '#FECA57',
    population: '2.9M',
    agroZone: 'Forest Zone',
    majorCrops: ['Cocoa', 'Coffee', 'Yam', 'Plantain', 'Vegetables'],
    description: 'Mountainous region with diverse crop production'
  },
  'Volta': {
    center: [6.6014, 0.4197],
    zoom: 9,
    color: '#FF9FF3',
    population: '2.1M',
    agroZone: 'Forest Zone',
    majorCrops: ['Rice', 'Maize', 'Cassava', 'Yam'],
    description: 'River valley agriculture with significant rice production'
  },
  'Northern': {
    center: [9.5084, -0.9270],
    zoom: 8,
    color: '#F38BA8',
    population: '2.5M',
    agroZone: 'Guinea Savannah',
    majorCrops: ['Maize', 'Rice', 'Yam', 'Soybeans', 'Groundnuts'],
    description: 'Guinea savannah zone with cereals and legume production'
  },
  'Upper East': {
    center: [10.7889, -0.8667],
    zoom: 9,
    color: '#A8DADC',
    population: '1.3M',
    agroZone: 'Sudan Savannah',
    majorCrops: ['Millet', 'Sorghum', 'Groundnuts', 'Cowpea'],
    description: 'Drought-resistant crops in Sudan savannah conditions'
  },
  'Upper West': {
    center: [10.3280, -2.3174],
    zoom: 9,
    color: '#457B9D',
    population: '0.9M',
    agroZone: 'Sudan Savannah',
    majorCrops: ['Millet', 'Sorghum', 'Groundnuts', 'Cowpea'],
    description: 'Semi-arid agriculture with traditional farming systems'
  },
  'Brong-Ahafo': {
    center: [7.7139, -1.6225],
    zoom: 8,
    color: '#1D3557',
    population: '2.3M',
    agroZone: 'Forest-Savannah Transition',
    majorCrops: ['Yam', 'Maize', 'Cassava', 'Plantain'],
    description: 'Transition zone agriculture with diverse crop systems'
  },
  'Western North': {
    center: [6.2094, -2.9907],
    zoom: 9,
    color: '#E63946',
    population: '0.7M',
    agroZone: 'Forest Zone',
    majorCrops: ['Cocoa', 'Coffee', 'Plantain', 'Cassava'],
    description: 'Newly created region with focus on tree crop production'
  },
  'Ahafo': {
    center: [6.8756, -2.3280],
    zoom: 9,
    color: '#F77F00',
    population: '0.5M',
    agroZone: 'Forest Zone',
    majorCrops: ['Cocoa', 'Plantain', 'Cassava', 'Maize'],
    description: 'Forest zone with intensive cocoa cultivation'
  },
  'Bono': {
    center: [7.8169, -2.4937],
    zoom: 9,
    color: '#FCBF49',
    population: '0.8M',
    agroZone: 'Forest-Savannah Transition',
    majorCrops: ['Yam', 'Maize', 'Cassava', 'Soybeans'],
    description: 'Major yam production area in transition zone'
  },
  'Bono East': {
    center: [7.7570, -0.9319],
    zoom: 9,
    color: '#003049',
    population: '1.2M',
    agroZone: 'Forest-Savannah Transition',
    majorCrops: ['Yam', 'Maize', 'Rice', 'Plantain'],
    description: 'Diverse agriculture in forest-savannah transition'
  },
  'Oti': {
    center: [8.1378, 0.4707],
    zoom: 9,
    color: '#669BBC',
    population: '1.1M',
    agroZone: 'Guinea Savannah',
    majorCrops: ['Rice', 'Yam', 'Maize', 'Soybeans'],
    description: 'River basin agriculture with rice cultivation focus'
  },
  'North East': {
    center: [10.4734, -0.3729],
    zoom: 9,
    color: '#C1121F',
    population: '0.6M',
    agroZone: 'Sudan Savannah',
    majorCrops: ['Millet', 'Sorghum', 'Rice', 'Groundnuts'],
    description: 'Northern savannah agriculture with drought adaptation'
  },
  'Savannah': {
    center: [8.7642, -1.8094],
    zoom: 8,
    color: '#780000',
    population: '0.7M',
    agroZone: 'Guinea Savannah',
    majorCrops: ['Yam', 'Maize', 'Rice', 'Soybeans'],
    description: 'Guinea savannah with mixed farming systems'
  }
};

// Map control component for zooming to regions
const MapController = ({ selectedRegion, onRegionSelect }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedRegion && GHANA_REGIONS[selectedRegion]) {
      const region = GHANA_REGIONS[selectedRegion];
      map.setView(region.center, region.zoom);
    }
  }, [selectedRegion, map]);

  return null;
};

MapController.propTypes = {
  selectedRegion: PropTypes.string,
  onRegionSelect: PropTypes.func.isRequired,
};

// Region info panel component
const RegionInfoPanel = ({ selectedRegion, selectedDistrict, onClose }) => {
  if (!selectedRegion && !selectedDistrict) return null;

  const regionData = selectedRegion ? GHANA_REGIONS[selectedRegion] : null;

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-sm">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-800">
          {selectedDistrict ? selectedDistrict.name : selectedRegion}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      {selectedDistrict && (
        <div className="space-y-2">
          <p><strong>Region:</strong> {selectedDistrict.region}</p>
          <p><strong>Type:</strong> {selectedDistrict.name.includes('Municipal') ? 'Municipal' : 'District'}</p>
          <p><strong>Coordinates:</strong> {selectedDistrict.coordinates.join(', ')}</p>
        </div>
      )}

      {regionData && (
        <div className="space-y-2">
          <p><strong>Population:</strong> {regionData.population}</p>
          <p><strong>Agro-Zone:</strong> {regionData.agroZone}</p>
          <p><strong>Major Crops:</strong> {regionData.majorCrops.join(', ')}</p>
          <p className="text-sm text-gray-600">{regionData.description}</p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <button
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(selectedRegion || selectedDistrict?.region)}_Region`, '_blank')}
        >
          Learn More →
        </button>
      </div>
    </div>
  );
};

RegionInfoPanel.propTypes = {
  selectedRegion: PropTypes.string,
  selectedDistrict: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

// Main Interactive Map Component
const InteractiveMap = ({ 
  onRegionSelect, 
  onDistrictSelect, 
  showWeatherData = false, 
  showAgriculturalData = false,
  initialRegion = null 
}) => {
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter] = useState([7.9465, -1.0232]); // Center of Ghana
  const [mapZoom] = useState(7);

  // Load districts data
  useEffect(() => {
    try {
      const districtData = ghanaRegionsData.features.map(feature => ({
        name: feature.properties.name,
        region: feature.properties.region,
        coordinates: feature.geometry.coordinates,
        radius: feature.properties.radius || 3000,
      }));
      setDistricts(districtData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading districts data:', error);
      setLoading(false);
    }
  }, []);

  // Group districts by region
  const districtsByRegion = districts.reduce((acc, district) => {
    if (!acc[district.region]) {
      acc[district.region] = [];
    }
    acc[district.region].push(district);
    return acc;
  }, {});

  const handleRegionClick = (regionName) => {
    setSelectedRegion(regionName);
    setSelectedDistrict(null);
    if (onRegionSelect) {
      onRegionSelect(regionName, GHANA_REGIONS[regionName]);
    }
  };

  const handleDistrictClick = (district) => {
    setSelectedDistrict(district);
    setSelectedRegion(district.region);
    if (onDistrictSelect) {
      onDistrictSelect(district);
    }
  };

  const closeInfoPanel = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          selectedRegion={selectedRegion}
          onRegionSelect={handleRegionClick}
        />

        {/* Render district markers */}
        {districts.map((district, index) => {
          const regionInfo = GHANA_REGIONS[district.region];
          const isSelected = selectedDistrict?.name === district.name;
          const isRegionSelected = selectedRegion === district.region;

          return (
            <CircleMarker
              key={index}
              center={[district.coordinates[1], district.coordinates[0]]}
              radius={isSelected ? 12 : isRegionSelected ? 8 : 6}
              fillColor={regionInfo?.color || '#3388ff'}
              color={isSelected ? '#000' : regionInfo?.color || '#3388ff'}
              weight={isSelected ? 3 : 2}
              opacity={0.8}
              fillOpacity={isSelected ? 0.8 : isRegionSelected ? 0.6 : 0.4}
              eventHandlers={{
                click: () => handleDistrictClick(district),
                mouseover: (e) => {
                  e.target.setStyle({
                    radius: 10,
                    fillOpacity: 0.8
                  });
                },
                mouseout: (e) => {
                  e.target.setStyle({
                    radius: isSelected ? 12 : isRegionSelected ? 8 : 6,
                    fillOpacity: isSelected ? 0.8 : isRegionSelected ? 0.6 : 0.4
                  });
                }
              }}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-sm">{district.name}</h4>
                  <p className="text-xs text-gray-600">Region: {district.region}</p>
                  {regionInfo && (
                    <div className="mt-2 text-xs">
                      <p><strong>Agro-Zone:</strong> {regionInfo.agroZone}</p>
                      <p><strong>Major Crops:</strong> {regionInfo.majorCrops.slice(0, 2).join(', ')}</p>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Optional: Add region center markers for major cities */}
        {Object.entries(GHANA_REGIONS).map(([regionName, regionData]) => (
          <Marker
            key={regionName}
            position={regionData.center}
            eventHandlers={{
              click: () => handleRegionClick(regionName)
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-bold">{regionName} Region</h4>
                <p className="text-sm text-gray-600">{regionData.description}</p>
                <p className="text-xs mt-1">
                  <strong>Population:</strong> {regionData.population}
                </p>
                <p className="text-xs">
                  <strong>Major Crops:</strong> {regionData.majorCrops.join(', ')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Region/District Info Panel */}
      <RegionInfoPanel
        selectedRegion={selectedRegion}
        selectedDistrict={selectedDistrict}
        onClose={closeInfoPanel}
      />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="font-bold text-sm mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Districts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500"></div>
            <span>Regional Centers</span>
          </div>
          <p className="text-gray-600 mt-2">Click on markers for details</p>
        </div>
      </div>

      {/* Region Selector */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-48">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Region:
        </label>
        <select
          value={selectedRegion || ''}
          onChange={(e) => handleRegionClick(e.target.value)}
          className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Regions</option>
          {Object.keys(GHANA_REGIONS).map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
        
        {selectedRegion && districtsByRegion[selectedRegion] && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Districts ({districtsByRegion[selectedRegion].length}):
            </label>
            <div className="max-h-32 overflow-y-auto text-xs space-y-1">
              {districtsByRegion[selectedRegion].map(district => (
                <button
                  key={district.name}
                  onClick={() => handleDistrictClick(district)}
                  className="block w-full text-left px-2 py-1 hover:bg-blue-50 rounded"
                >
                  {district.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

InteractiveMap.propTypes = {
  onRegionSelect: PropTypes.func,
  onDistrictSelect: PropTypes.func,
  showWeatherData: PropTypes.bool,
  showAgriculturalData: PropTypes.bool,
  initialRegion: PropTypes.string,
};

export default InteractiveMap;