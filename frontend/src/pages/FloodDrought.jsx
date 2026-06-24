import { useState } from "react";
import PageTitle from '../components/PageTitle';
import Breadcrumb from '../components/common/Breadcrumb';
import T from '../components/common/T';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Droplet,
  Umbrella,
  Thermometer,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Award,
} from "lucide-react";

const FloodDrought = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRegion, setSelectedRegion] = useState("global");

  // Ghana-specific flood data
  const floodData = [
    { year: 2022, incidents: 31, affected: 12, damages: 25 },
    { year: 2023, incidents: 38, affected: 17, damages: 34 },
    { year: 2024, incidents: 42, affected: 21, damages: 46 },
    { year: 2025, incidents: 49, affected: 28, damages: 58 },
    { year: 2026, incidents: 55, affected: 33, damages: 68 },
  ];

  // Ghana-specific drought data
  const droughtData = [
    { year: 2022, regions: 4, affected: 7, damages: 18 },
    { year: 2023, regions: 5, affected: 9, damages: 24 },
    { year: 2024, regions: 6, affected: 12, damages: 31 },
    { year: 2025, regions: 7, affected: 15, damages: 38 },
    { year: 2026, regions: 8, affected: 18, damages: 45 },
  ];

  // Combined economic impact data for Ghana
  const combinedTrendData = [
    { year: 2022, flood: 25, drought: 18 },
    { year: 2023, flood: 34, drought: 24 },
    { year: 2024, flood: 46, drought: 31 },
    { year: 2025, flood: 58, drought: 38 },
    { year: 2026, flood: 68, drought: 45 },
  ];

  // Ghana's agroecological zones climate risk data
  const climateMatrixData = [
    {
      region: "Sudan Savannah",
      floodRisk: 65,
      droughtRisk: 90,
      adaptationScore: 45,
    },
    {
      region: "Guinea Savannah",
      floodRisk: 70,
      droughtRisk: 85,
      adaptationScore: 50,
    },
    {
      region: "Transition Zone",
      floodRisk: 75,
      droughtRisk: 70,
      adaptationScore: 60,
    },
    {
      region: "Deciduous Forest",
      floodRisk: 80,
      droughtRisk: 55,
      adaptationScore: 65,
    },
    {
      region: "Rainforest",
      floodRisk: 85,
      droughtRisk: 40,
      adaptationScore: 70,
    },
    {
      region: "Coastal Savannah",
      floodRisk: 90,
      droughtRisk: 60,
      adaptationScore: 55,
    },
  ];

  // Ghana's climate vulnerability hotspots
  const globalHotspots = [
    {
      type: "Flood",
      region: "Coastal Savannah",
      risk: "Extreme",
      trend: "Increasing",
      impact: 90,
    },
    {
      type: "Flood",
      region: "Rainforest",
      risk: "High",
      trend: "Increasing",
      impact: 85,
    },
    {
      type: "Flood",
      region: "Deciduous Forest",
      risk: "High",
      trend: "Stable",
      impact: 80,
    },
    {
      type: "Drought",
      region: "Sudan Savannah",
      risk: "Extreme",
      trend: "Worsening",
      impact: 90,
    },
    {
      type: "Drought",
      region: "Guinea Savannah",
      risk: "High",
      trend: "Worsening",
      impact: 85,
    },
    {
      type: "Drought",
      region: "Transition Zone",
      risk: "Moderate",
      trend: "Fluctuating",
      impact: 70,
    },
  ];

  // Impact distribution data for Ghana
  const impactData = [
    { name: "Agriculture", value: 60 },
    { name: "Infrastructure", value: 20 },
    { name: "Health", value: 12 },
    { name: "Economy", value: 8 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Climate resilience score calculation
  const calculateResilienceScore = (region) => {
    const regionData = climateMatrixData.find((item) => item.region === region);
    if (!regionData) return { score: 65, color: "#FFA500" }; // Default for global

    const score = Math.round(regionData.adaptationScore);
    let color = "#FF0000"; // Red for low scores

    if (score > 75) color = "#00CC00"; // Green for high scores
    else if (score > 50) color = "#FFA500"; // Orange for medium scores

    return { score, color };
  };

  const resilienceScore = calculateResilienceScore(
    selectedRegion === "global" ? "Global" : selectedRegion
  );

  // Tabs content
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Key Metrics Cards */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
          <span className="inline-flex w-10 h-10 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 items-center justify-center">
            <Droplet size={20} />
          </span>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4"><T>Flood Events</T></p>
          <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">7</p>
          <p className="text-xs text-slate-500 mt-1">2026 • +17% from 2025</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
          <span className="inline-flex w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 items-center justify-center">
            <Thermometer size={20} />
          </span>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4"><T>Drought Zones</T></p>
          <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">49</p>
          <p className="text-xs text-slate-500 mt-1">2026 • +17% from 2025</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
          <span className="inline-flex w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-200 items-center justify-center">
            <AlertTriangle size={20} />
          </span>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4"><T>People Affected</T></p>
          <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">43M</p>
          <p className="text-xs text-slate-500 mt-1">2026 • +33% from 2025</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
          <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 items-center justify-center">
            <Award size={20} />
          </span>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4"><T>Resilience Score</T></p>
          <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{resilienceScore.score}</p>
          <p className="text-xs text-slate-500 mt-1">Ghana • Moderate</p>
        </div>
      </div>

      {/* Main Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-5 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">
            <T>Economic Impact Trends (Million GHS)</T>
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="flood"
                  stroke="#0088FE"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Flood Damages"
                />
                <Line
                  type="monotone"
                  dataKey="drought"
                  stroke="#FF8042"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Drought Damages"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-5 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">
            <T>Climate Risk Matrix</T>
          </h3>
          <div className="flex mb-4 space-x-2">
            <select
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="global">All Agroecological Zones</option>
              {climateMatrixData.map((region, index) => (
                <option key={index} value={region.region}>
                  {region.region}
                </option>
              ))}
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  selectedRegion === "global"
                    ? climateMatrixData
                    : [
                        climateMatrixData.find(
                          (r) => r.region === selectedRegion
                        ),
                      ].filter(Boolean)
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="floodRisk" name="Flood Risk" fill="#0088FE" />
                <Bar dataKey="droughtRisk" name="Drought Risk" fill="#FF8042" />
                <Bar
                  dataKey="adaptationScore"
                  name="Adaptation Score"
                  fill="#00C49F"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Impact Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">
            <T>Impact Distribution</T>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={impactData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {impactData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">
            <T>Risk Hotspots</T>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"><T>Type</T></th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"><T>Region</T></th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"><T>Risk Level</T></th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"><T>Trend</T></th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"><T>Impact</T></th>
                </tr>
              </thead>
              <tbody>
                {globalHotspots.map((spot, index) => (
                  <tr key={index} className="hover:bg-slate-50 border-b border-slate-200">
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          spot.type === "Flood"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {spot.type === "Flood" ? (
                          <Droplet size={12} className="mr-1" />
                        ) : (
                          <Thermometer size={12} className="mr-1" />
                        )}
                        {spot.type}
                      </span>
                    </td>
                    <td className="py-2 px-4">{spot.region}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          spot.risk === "Extreme"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {spot.risk}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className="inline-flex items-center text-sm">
                        <TrendingUp
                          size={14}
                          className={`mr-1 ${
                            spot.trend === "Increasing" ||
                            spot.trend === "Worsening"
                              ? "text-red-500"
                              : spot.trend === "Stable"
                              ? "text-gray-500"
                              : "text-amber-500"
                          }`}
                        />
                        {spot.trend}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            spot.impact > 80
                              ? "bg-red-600"
                              : spot.impact > 60
                              ? "bg-orange-500"
                              : "bg-yellow-400"
                          }`}
                          style={{ width: `${spot.impact}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFloodAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
            <Droplet size={20} />
          </span>
          <h3 className="text-2xl font-semibold text-slate-900">
            <T>Flood Trends & Impact</T>
          </h3>
        </div>
        <p className="mb-6 text-slate-600 leading-relaxed">
          <T>Global flood events have shown a concerning upward trend over the past five years, with both frequency and severity increasing. Climate change, urbanization, and deforestation are primary contributing factors to this alarming pattern.</T>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h4 className="font-semibold text-slate-900 mb-3">
              <T>Yearly Flood Incidents</T>
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={floodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="incidents" name="Incidents" fill="#0088FE" />
                  <Bar
                    dataKey="affected"
                    name="Population (millions)"
                    fill="#00C49F"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <h4 className="font-semibold text-slate-900 mb-3">
                <T>Key Mitigation Strategies</T>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-2">
                    <Umbrella size={16} className="text-blue-700" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium"><T>Advanced Warning</T></h5>
                    <p className="text-xs text-gray-600">
                      <T>Real-time monitoring systems</T>
                    </p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-2">
                    <MapPin size={16} className="text-blue-700" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium"><T>Urban Planning</T></h5>
                    <p className="text-xs text-gray-600">
                      <T>Permeable surfaces & green spaces</T>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <h4 className="font-semibold text-slate-900 mb-3">
                <T>Most Vulnerable Regions</T>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bangladesh Delta</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: "95%" }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Yangtze River Basin</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mississippi Basin</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDroughtAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
            <Thermometer size={20} />
          </span>
          <h3 className="text-2xl font-semibold text-slate-900">
            <T>Drought Analysis & Patterns</T>
          </h3>
        </div>
        <p className="mb-6 text-slate-600 leading-relaxed">
          <T>Drought conditions have intensified globally, with longer duration and greater severity becoming increasingly common. Rising temperatures, changing precipitation patterns, and increased water demand are major contributing factors.</T>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h4 className="font-semibold text-slate-900 mb-3">
              <T>Drought Impact Trend</T>
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={droughtData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="regions"
                    name="Affected Regions"
                    stroke="#FF8042"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="damages"
                    name="Economic Damage ($B)"
                    stroke="#FFBB28"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <h4 className="font-semibold text-slate-900 mb-3">
                <T>Key Adaptation Strategies</T>
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <h5 className="text-sm font-medium"><T>Precision Agriculture</T></h5>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600"><T>Effectiveness</T></span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <h5 className="text-sm font-medium">
                    <T>Water Conservation Systems</T>
                  </h5>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600"><T>Effectiveness</T></span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <h5 className="text-sm font-medium">
                    <T>Drought-Resistant Crops</T>
                  </h5>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600"><T>Effectiveness</T></span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMatrix = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
            <AlertTriangle size={20} />
          </span>
          <h3 className="text-2xl font-semibold text-slate-900">
            <T>Climate Vulnerability Matrix</T>
          </h3>
        </div>
        <p className="mb-6 text-slate-600 leading-relaxed">
          <T>The Climate Matrix provides a comprehensive overview of flood and drought risks across different regions, along with their current adaptation capabilities. This visualization helps identify priority areas for intervention.</T>
        </p>

        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
          <h4 className="font-semibold text-slate-900 mb-3">
            <T>Regional Risk Comparison</T>
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={climateMatrixData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="floodRisk"
                  name="Flood Risk Score"
                  fill="#0088FE"
                />
                <Bar
                  dataKey="droughtRisk"
                  name="Drought Risk Score"
                  fill="#FF8042"
                />
                <Bar
                  dataKey="adaptationScore"
                  name="Adaptation Score"
                  fill="#00C49F"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h4 className="font-semibold text-slate-900 mb-3">
              <T>Risk Factor Analysis</T>
            </h4>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-2 px-3 text-left text-sm"><T>Region</T></th>
                  <th className="py-2 px-3 text-left text-sm"><T>Primary Risk</T></th>
                  <th className="py-2 px-1 text-left text-sm"><T>Vulnerability</T></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 px-3 text-sm">South Asia</td>
                  <td className="py-2 px-3 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      Flood
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <span className="text-red-600">Critical</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-sm">Sub-Saharan Africa</td>
                  <td className="py-2 px-3 text-sm">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                      Drought
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <span className="text-red-600">Critical</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-sm">Western Europe</td>
                  <td className="py-2 px-3 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      Flood
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <span className="text-green-600">Moderate</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-sm">Australia</td>
                  <td className="py-2 px-3 text-sm">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                      Drought
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <span className="text-amber-600">High</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h4 className="font-semibold text-slate-900 mb-3">
              Impact Distribution
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={impactData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {impactData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabBtn = (id, label) =>
    `px-4 py-2 m-1 rounded-lg text-sm font-semibold transition-colors ${
      activeTab === id
        ? "bg-emerald-600 text-white shadow-sm"
        : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
    }`;

  return (
    <>
      <PageTitle title="Flood & Drought Alerts" />
      <div className="neo-page min-h-screen pt-32 md:pt-36 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
      <Breadcrumb />
      <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-6">
        <T>Flood and Drought</T>{" "}
        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          <T>Risk Analysis</T>
        </span>
      </h1>

      {/* Tab Navigation */}
      <div className="flex flex-wrap bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm mb-8 p-1">
        <button className={tabBtn("dashboard")} onClick={() => setActiveTab("dashboard")}>
          <T>Dashboard</T>
        </button>
        <button className={tabBtn("flood")} onClick={() => setActiveTab("flood")}>
          <T>Flood Analysis</T>
        </button>
        <button className={tabBtn("drought")} onClick={() => setActiveTab("drought")}>
          <T>Drought Analysis</T>
        </button>
        <button className={tabBtn("matrix")} onClick={() => setActiveTab("matrix")}>
          <T>Climate Matrix</T>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "flood" && renderFloodAnalysis()}
      {activeTab === "drought" && renderDroughtAnalysis()}
      {activeTab === "matrix" && renderMatrix()}

      <div className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
        <p>
          <T>Data sources: Ghana Meteorological Agency, Hydromet Research Office for Disaster Risk Reduction</T>
        </p>
        <p><T>Last updated: April 2026</T></p>
      </div>
      </div>
      </div>
    </>
  );
};

export default FloodDrought;
