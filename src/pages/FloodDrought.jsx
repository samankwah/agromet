import { useState } from "react";
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
    { year: 2020, incidents: 24, affected: 8, damages: 16 },
    { year: 2021, incidents: 31, affected: 12, damages: 25 },
    { year: 2022, incidents: 38, affected: 17, damages: 34 },
    { year: 2023, incidents: 42, affected: 21, damages: 46 },
    { year: 2024, incidents: 49, affected: 28, damages: 58 },
  ];

  // Ghana-specific drought data
  const droughtData = [
    { year: 2020, regions: 3, affected: 5, damages: 12 },
    { year: 2021, regions: 4, affected: 7, damages: 18 },
    { year: 2022, regions: 5, affected: 9, damages: 24 },
    { year: 2023, regions: 6, affected: 12, damages: 31 },
    { year: 2024, regions: 7, affected: 15, damages: 38 },
  ];

  // Combined economic impact data for Ghana
  const combinedTrendData = [
    { year: 2020, flood: 16, drought: 12 },
    { year: 2021, flood: 25, drought: 18 },
    { year: 2022, flood: 34, drought: 24 },
    { year: 2023, flood: 46, drought: 31 },
    { year: 2024, flood: 58, drought: 38 },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Key Metrics Cards */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Flood Events</h3>
            <Droplet size={24} />
          </div>
          <p className="text-3xl font-bold mt-2">7</p>
          <p className="text-sm opacity-80">2024 • +17% from 2023</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-4 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Drought Zones</h3>
            <Thermometer size={24} />
          </div>
          <p className="text-3xl font-bold mt-2">49</p>
          <p className="text-sm opacity-80">2024 • +17% from 2023</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 p-4 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">People Affected</h3>
            <AlertTriangle size={24} />
          </div>
          <p className="text-3xl font-bold mt-2">43M</p>
          <p className="text-sm opacity-80">2024 • +33% from 2023</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Resilience Score</h3>
            <Award size={24} />
          </div>
          <p className="text-3xl font-bold mt-2">{resilienceScore.score}</p>
          <p className="text-sm opacity-80">Ghana • Moderate</p>
        </div>
      </div>

      {/* Main Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Economic Impact Trends (Million GHS)
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

        <div className="bg-white p-2 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Climate Risk Matrix
          </h3>
          <div className="flex mb-4 space-x-2">
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="bg-white p-1 rounded-xl shadow-md lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Impact Distribution
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

        <div className="bg-white p-4 rounded-xl shadow-md lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Risk Hotspots
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Region</th>
                  <th className="py-3 px-4 text-left">Risk Level</th>
                  <th className="py-3 px-4 text-left">Trend</th>
                  <th className="py-3 px-4 text-left">Impact</th>
                </tr>
              </thead>
              <tbody>
                {globalHotspots.map((spot, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b">
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          spot.type === "Flood"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          spot.risk === "Extreme"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
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
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Droplet size={28} className="text-blue-700" />
          <h3 className="text-2xl font-semibold text-blue-800">
            Flood Trends & Impact
          </h3>
        </div>
        <p className="mb-6 text-gray-700 leading-relaxed">
          Global flood events have shown a concerning upward trend over the past
          five years, with both frequency and severity increasing. Climate
          change, urbanization, and deforestation are primary contributing
          factors to this alarming pattern.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h4 className="font-semibold text-blue-700 mb-3">
              Yearly Flood Incidents
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
            <div className="bg-blue-50 p-4 rounded-xl shadow-md">
              <h4 className="font-semibold text-blue-700 mb-3">
                Key Mitigation Strategies
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-2">
                    <Umbrella size={16} className="text-blue-700" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">Advanced Warning</h5>
                    <p className="text-xs text-gray-600">
                      Real-time monitoring systems
                    </p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-2">
                    <MapPin size={16} className="text-blue-700" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">Urban Planning</h5>
                    <p className="text-xs text-gray-600">
                      Permeable surfaces & green spaces
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl shadow-md">
              <h4 className="font-semibold text-blue-700 mb-3">
                Most Vulnerable Regions
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
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Thermometer size={28} className="text-amber-700" />
          <h3 className="text-2xl font-semibold text-amber-800">
            Drought Analysis & Patterns
          </h3>
        </div>
        <p className="mb-6 text-gray-700 leading-relaxed">
          Drought conditions have intensified globally, with longer duration and
          greater severity becoming increasingly common. Rising temperatures,
          changing precipitation patterns, and increased water demand are major
          contributing factors.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h4 className="font-semibold text-amber-700 mb-3">
              Drought Impact Trend
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
            <div className="bg-amber-50 p-4 rounded-xl shadow-md">
              <h4 className="font-semibold text-amber-700 mb-3">
                Key Adaptation Strategies
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <h5 className="text-sm font-medium">Precision Agriculture</h5>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600">Effectiveness</span>
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
                    Water Conservation Systems
                  </h5>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600">Effectiveness</span>
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
                    Drought-Resistant Crops
                  </h5>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600">Effectiveness</span>
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
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={28} className="text-purple-700" />
          <h3 className="text-2xl font-semibold text-purple-800">
            Climate Vulnerability Matrix
          </h3>
        </div>
        <p className="mb-6 text-gray-700 leading-relaxed">
          The Climate Matrix provides a comprehensive overview of flood and
          drought risks across different regions, along with their current
          adaptation capabilities. This visualization helps identify priority
          areas for intervention.
        </p>

        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
          <h4 className="font-semibold text-purple-700 mb-3">
            Regional Risk Comparison
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
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h4 className="font-semibold text-purple-700 mb-3">
              Risk Factor Analysis
            </h4>
            <table className="min-w-full">
              <thead className="bg-purple-50">
                <tr>
                  <th className="py-2 px-3 text-left text-sm">Region</th>
                  <th className="py-2 px-3 text-left text-sm">Primary Risk</th>
                  <th className="py-2 px-1 text-left text-sm">Vulnerability</th>
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

          <div className="bg-white p-4 rounded-xl shadow-md">
            <h4 className="font-semibold text-purple-700 mb-3">
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

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg mt-20">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Flood and Drought Risk Analysis
      </h2>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center bg-white rounded-xl shadow-md mb-8 p-1">
        <button
          className={`px-4 py-2 m-1 rounded-lg font-medium ${
            activeTab === "dashboard"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 m-1 rounded-lg font-medium ${
            activeTab === "flood"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("flood")}
        >
          Flood Analysis
        </button>
        <button
          className={`px-4 py-2 m-1 rounded-lg font-medium ${
            activeTab === "drought"
              ? "bg-amber-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("drought")}
        >
          Drought Analysis
        </button>
        <button
          className={`px-4 py-1 m-1 rounded-lg font-medium ${
            activeTab === "matrix"
              ? "bg-purple-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("matrix")}
        >
          Climate Matrix
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "flood" && renderFloodAnalysis()}
      {activeTab === "drought" && renderDroughtAnalysis()}
      {activeTab === "matrix" && renderMatrix()}

      <div className="mt-8 border-t pt-6 text-sm text-gray-500 flex justify-between">
        <p>
          Data sources: Ghana Meteorological Agency, Hydromet Research Office
          for Disaster Risk Reduction
        </p>
        <p>Last updated: May 2025</p>
      </div>
    </div>
  );
};

export default FloodDrought;
