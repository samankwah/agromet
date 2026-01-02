// Districts data structure for backwards compatibility
// This file provides the districtOfGhana array format used by various components

import { GHANA_REGIONS } from './data/ghanaCodes';

/**
 * Export districts in the legacy array format
 * Structure: Array of { region: string, districts: string[] }
 */
export const districtOfGhana = Object.values(GHANA_REGIONS).map(regionData => ({
  region: regionData.name,
  districts: Object.values(regionData.districts)
}));

// Export a flat list of all districts
export const allDistricts = Object.values(GHANA_REGIONS).flatMap(region =>
  Object.values(region.districts)
);

// Export region names only
export const allRegions = Object.values(GHANA_REGIONS).map(region => region.name);

// Helper function to get districts by region name
export const getDistrictsByRegion = (regionName) => {
  const regionData = districtOfGhana.find(r => r.region === regionName);
  return regionData ? regionData.districts : [];
};

// Helper function to find which region a district belongs to
export const getRegionByDistrict = (districtName) => {
  const regionData = districtOfGhana.find(r =>
    r.districts.includes(districtName)
  );
  return regionData ? regionData.region : null;
};

export default districtOfGhana;
