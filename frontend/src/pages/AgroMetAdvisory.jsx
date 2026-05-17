import { useState, useMemo, useEffect } from "react";
import PageTitle from '../components/PageTitle';
import Breadcrumb from '../components/common/Breadcrumb';
import T from "../components/common/T";
import { districtOfGhana } from "../district";
import { TableSkeleton } from "../components/common/SkeletonLoading";
import axios from 'axios';

// Weekly Advisory Components
import ActivitySidebar from '../components/WeeklyAdvisory/ActivitySidebar';
import AdvisoryHeader from '../components/WeeklyAdvisory/AdvisoryHeader';
import WeatherForecastTable from '../components/WeeklyAdvisory/WeatherForecastTable';
import SummarySection from '../components/WeeklyAdvisory/SummarySection';

const AgroMetAdvisory = () => {
  // Region-specific commodities
  const regionSpecificCrops = {
    OTI: ["Maize", "Rice", "Soyabean", "Broiler", "Layer"],
    VOLTA: ["Rice", "Maize", "Tomato", "Broiler", "Layer"],
    NORTHERN: ["Maize", "Rice", "Soyabean", "Sorghum", "Broiler", "Layer"],
    ASHANTI: ["Maize", "Rice", "Tomato", "Broiler", "Layer"],
    WESTERN: ["Maize", "Rice", "Tomato", "Broiler", "Layer"],
    "WESTERN NORTH": ["Maize", "Rice", "Tomato", "Broiler", "Layer"],
    "GREATER ACCRA": ["Maize", "Rice", "Tomato", "Broiler", "Layer"],
    EASTERN: ["Maize", "Rice", "Tomato", "Broiler", "Layer"],
    "UPPER WEST": ["Maize", "Rice", "Sorghum", "Soyabean", "Broiler", "Layer"],
    "UPPER EAST": ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato", "Broiler", "Layer"],
    "NORTH EAST": ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato", "Broiler", "Layer"],
    SAVANNAH: ["Maize", "Rice", "Sorghum", "Soyabean", "Broiler", "Layer"],
    AHAFO: ["Maize", "Rice", "Broiler", "Layer"],
    BONO: ["Maize", "Rice", "Tomato", "Broiler", "Layer"],
    "BONO EAST": ["Maize", "Rice", "Soyabean", "Broiler", "Layer"],
    CENTRAL: ["Maize", "Rice", "Tomato", "Broiler", "Layer"],
  };

  const allCrops = ["Maize", "Rice", "Sorghum", "Soyabean", "Tomato", "Broiler", "Layer"];

  const filterData = {
    region: [
      "OTI", "VOLTA", "NORTHERN", "ASHANTI", "WESTERN", "WESTERN NORTH",
      "GREATER ACCRA", "EASTERN", "UPPER WEST", "UPPER EAST", "NORTH EAST",
      "SAVANNAH", "AHAFO", "BONO", "BONO EAST", "CENTRAL",
    ],
    year: ["2024", "2025", "2026"],
    season: ["Dry Season", "Rainy Season", "Harmattan"],
  };

  const [selected, setSelected] = useState({
    crop: "",
    region: "",
    district: "",
    year: "",
    season: "",
  });

  // Advisory states
  const [showAdvisory, setShowAdvisory] = useState(false);
  const [activitiesList, setActivitiesList] = useState([]);
  const [selectedAdvisory, setSelectedAdvisory] = useState(null);
  const [selectedActivityData, setSelectedActivityData] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [hasWeeklyData, setHasWeeklyData] = useState(false);

  // Available crops based on selected region
  const availableCropsForDropdown = useMemo(() => {
    if (!selected.region) return allCrops;
    return regionSpecificCrops[selected.region] || allCrops;
  }, [selected.region]);

  const handleFilterChange = (e, field) => {
    const value = e.target.value;
    setSelected((prev) => {
      const newSelected = { ...prev, [field]: value };
      if (field === "region") {
        newSelected.crop = "";
        newSelected.district = "";
      }
      return newSelected;
    });
  };

  // Auto-display advisory when required filters are selected
  useEffect(() => {
    if (selected.crop && selected.region && selected.district) {
      setShowAdvisory(true);
    } else {
      setShowAdvisory(false);
    }
  }, [selected.crop, selected.region, selected.district]);

  // Fetch weekly advisories when filters change
  useEffect(() => {
    const fetchWeeklyAdvisories = async () => {
      if (!selected.crop || !selected.district || !selected.region) return;

      setLoadingWeekly(true);
      try {
        const params = new URLSearchParams({
          region: selected.region,
          district: selected.district,
          crop: selected.crop
        });
        if (selected.year) params.append('year', selected.year);

        const response = await axios.get(`/api/weekly-advisories/activities?${params}`);

        if (response.data.success) {
          setActivitiesList(response.data.data);
          setHasWeeklyData(response.data.data.length > 0);
          setSelectedAdvisory(null);
          setSelectedActivityData(null);
        }
      } catch (error) {
        console.error('Error fetching weekly advisories:', error);
        setActivitiesList([]);
        setHasWeeklyData(false);
      } finally {
        setLoadingWeekly(false);
      }
    };

    fetchWeeklyAdvisories();
  }, [selected.crop, selected.district, selected.region, selected.year]);

  // Auto-select the first activity when list loads
  useEffect(() => {
    if (activitiesList.length > 0 && !selectedAdvisory) {
      handleSelectActivity(activitiesList[0]);
    }
  }, [activitiesList]);

  // Fetch full advisory by ID with activity name
  const fetchAdvisoryById = async (advisoryId, activityName) => {
    try {
      const params = activityName ? `?activity=${encodeURIComponent(activityName)}` : '';
      const response = await axios.get(`/api/weekly-advisories/${advisoryId}${params}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching advisory:', error);
    }
    return null;
  };

  // Handle selecting an activity
  const handleSelectActivity = async (activity) => {
    setLoadingWeekly(true);
    const fullAdvisory = await fetchAdvisoryById(activity.advisory_id, activity.activity);
    if (fullAdvisory) {
      setSelectedAdvisory(fullAdvisory);
      setSelectedActivityData(fullAdvisory.activityData || null);
    }
    setLoadingWeekly(false);
  };

  return (
    <>
      <PageTitle title="Agro-Meteorological Advisory" />
      <div className="neo-page min-h-screen pt-32 md:pt-36 relative overflow-hidden">
        <div className="px-4 md:px-8 py-4 md:py-6 relative">
          <Breadcrumb />
          {/* Page Title */}
          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <T>Weekly Advisory</T>
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-3">
              <T>Agro-Meteorological</T>{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                <T>Advisory</T>
              </span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg">
              <T>Get weather-based farming recommendations for your region</T>
            </p>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded border border-gray-200 shadow-sm px-4 py-3 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Year */}
              <div className="flex flex-col">
                <label className="text-xs font-medium mb-1 text-gray-600"><T>Year</T></label>
                <select
                  value={selected.year || ""}
                  onChange={(e) => handleFilterChange(e, "year")}
                  className="text-sm p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">2025</option>
                  {filterData.year.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div className="flex flex-col">
                <label className="text-xs font-medium mb-1 text-gray-600"><T>Season</T></label>
                <select
                  value={selected.season || ""}
                  onChange={(e) => handleFilterChange(e, "season")}
                  className="text-sm p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value=""><T>Select Season</T></option>
                  {filterData.season.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div className="flex flex-col">
                <label className="text-xs font-medium mb-1 text-gray-600"><T>Region</T></label>
                <select
                  value={selected.region || ""}
                  onChange={(e) => handleFilterChange(e, "region")}
                  className="text-sm p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value=""><T>Select Region</T></option>
                  {filterData.region.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div className="flex flex-col">
                <label className="text-xs font-medium mb-1 text-gray-600"><T>District</T></label>
                <select
                  value={selected.district || ""}
                  onChange={(e) => handleFilterChange(e, "district")}
                  className="text-sm p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!selected.region}
                >
                  <option value="">{selected.region ? <T>Select District</T> : <T>Select Region First</T>}</option>
                  {selected.region &&
                    districtOfGhana
                      .filter((d) => {
                        const dataRegion = d.region.toLowerCase().replace(' region', '');
                        const selectedRegion = selected.region.toLowerCase();
                        return dataRegion === selectedRegion;
                      })
                      .flatMap((d) => d.districts)
                      .map((districtName) => (
                        <option key={districtName} value={districtName}>{districtName}</option>
                      ))
                  }
                </select>
              </div>

              {/* Commodity */}
              <div className="flex flex-col">
                <label className="text-xs font-medium mb-1 text-gray-600"><T>Commodity</T></label>
                <select
                  value={selected.crop || ""}
                  onChange={(e) => handleFilterChange(e, "crop")}
                  className="text-sm p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!selected.region}
                >
                  <option value=""><T>Select Commodity</T></option>
                  {availableCropsForDropdown.map((crop) => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loadingWeekly && (
            <div className="py-6">
              <TableSkeleton rows={4} columns={4} />
            </div>
          )}

          {/* Advisory Content */}
          {!loadingWeekly && showAdvisory && hasWeeklyData && activitiesList.length > 0 && selectedAdvisory ? (
            <div className="mb-6">
              {/* Mobile/Tablet: Horizontal activity strip */}
              <div className="lg:hidden">
                <ActivitySidebar
                  variant="mobile"
                  activities={activitiesList.map(a => ({ ...a, activity_stage: a.activity, name: a.activity }))}
                  currentActivity={{ activity_stage: selectedActivityData?.activity || selectedAdvisory.title, name: selectedActivityData?.activity || selectedAdvisory.title }}
                  onSelectActivity={handleSelectActivity}
                />
              </div>

              {/* Desktop: Sidebar + Content as direct flex siblings for sticky to work */}
              <div className="hidden lg:flex lg:items-start lg:gap-0">
                <ActivitySidebar
                  variant="desktop"
                  activities={activitiesList.map(a => ({ ...a, activity_stage: a.activity, name: a.activity }))}
                  currentActivity={{ activity_stage: selectedActivityData?.activity || selectedAdvisory.title, name: selectedActivityData?.activity || selectedAdvisory.title }}
                  onSelectActivity={handleSelectActivity}
                />
                <div className="flex-1 min-w-0 p-6 bg-white border border-gray-200 border-l-0 rounded-r-lg">
                  <AdvisoryHeader advisory={{
                    ...selectedAdvisory,
                    activity_stage: selectedActivityData?.activity || selectedAdvisory.title,
                    crop_type: selectedAdvisory.crop,
                    zone: selectedActivityData?.metadata?.zone || '',
                    month_year: selectedActivityData?.metadata?.month_year || '',
                    weeks_range: selectedActivityData?.metadata?.week || '',
                    start_date: selectedActivityData?.metadata?.start_date || '',
                    end_date: selectedActivityData?.metadata?.end_date || '',
                  }} />

                  <WeatherForecastTable
                    advisory={selectedAdvisory}
                    activityData={selectedActivityData}
                  />

                  <SummarySection summary={
                    selectedActivityData?.summaryBody ||
                    selectedActivityData?.summaryTitle ||
                    selectedAdvisory.summary
                  } />

                  {selectedActivityData?.summaryTitle && selectedActivityData?.summaryBody && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-semibold text-amber-900 text-sm mb-2">
                        {selectedActivityData.summaryTitle}
                      </h4>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile: Content only (sidebar strip already rendered above) */}
              <div className="lg:hidden p-4 bg-white border border-gray-200 rounded-lg">
                <AdvisoryHeader advisory={{
                  ...selectedAdvisory,
                  activity_stage: selectedActivityData?.activity || selectedAdvisory.title,
                  crop_type: selectedAdvisory.crop,
                  zone: selectedActivityData?.metadata?.zone || '',
                  month_year: selectedActivityData?.metadata?.month_year || '',
                  weeks_range: selectedActivityData?.metadata?.week || '',
                  start_date: selectedActivityData?.metadata?.start_date || '',
                  end_date: selectedActivityData?.metadata?.end_date || '',
                }} />

                <WeatherForecastTable
                  advisory={selectedAdvisory}
                  activityData={selectedActivityData}
                />

                <SummarySection summary={
                  selectedActivityData?.summaryBody ||
                  selectedActivityData?.summaryTitle ||
                  selectedAdvisory.summary
                } />

                {selectedActivityData?.summaryTitle && selectedActivityData?.summaryBody && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-900 text-sm mb-2">
                      {selectedActivityData.summaryTitle}
                    </h4>
                  </div>
                )}
              </div>
            </div>
          ) : !loadingWeekly && showAdvisory && (
            /* No Data State */
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="text-gray-400 text-5xl mb-4">📋</div>
              <div className="text-gray-600 text-lg mb-2 font-semibold">
                <T>No advisory data available</T>
              </div>
              <p className="text-gray-500 mb-2">
                <T>No advisory data found for</T> <span className="font-medium text-gray-700">{selected.crop}</span> <T>in</T> <span className="font-medium text-gray-700">{selected.district}</span> <T>district.</T>
              </p>
              <p className="text-sm text-gray-400">
                <T>Advisory data is uploaded by administrators through the dashboard.</T>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AgroMetAdvisory;
