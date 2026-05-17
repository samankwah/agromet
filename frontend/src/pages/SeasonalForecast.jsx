import { useState } from "react";
import { FaCloudSun, FaCloudRain, FaDownload, FaSun, FaExclamationCircle } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import SON from "../assets/images/SON.png";
import PageTitle from "../components/PageTitle";
import Breadcrumb from "../components/common/Breadcrumb";
import T from "../components/common/T";

const formatUpdatedTime = (timestamp) => {
  const date = timestamp ? new Date(timestamp) : new Date();

  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseRange = (value) => {
  if (typeof value === "number") return { min: value, max: value, mid: value };
  const match = String(value).match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return { min: 0, max: 0, mid: 0 };
  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;
  return { min, max, mid: (min + max) / 2 };
};

const SeasonalForecast = () => {
  const [selectedZone, setSelectedZone] = useState("East Coast");
  const [updatedAt] = useState(() => new Date().toISOString());

  // Data for different agro-ecological zones
  const forecastData = {
    "East Coast": {
      startLTM: "1st Week of March - 3rd Week of April",
      endLTM: "1st Week of July - 3rd Week of July",
      lengthLTM: "91-112 days",
      startForecast: "1st Week of March - 3rd Week of April",
      endForecast: "1st Week of July - 2nd Week of July",
      lengthForecast: "121-147 days",
      rainfallLTM: { mam: "217-420 mm", amj: "391-478 mm" },
      rainfallForecast: { mam: "283-430 mm", amj: "346-580 mm" },
      drySpellsLTM: { early: 9, late: 13 },
      drySpellsForecast: { early: 10, late: "14-18" },
    },
    "West Coast": {
      startLTM: "1st Week of March - 2nd Week of April",
      endLTM: "3rd Week of July - 1st Week of August",
      lengthLTM: "95-115 days",
      startForecast: "1st Week of March - 2nd Week of April",
      endForecast: "1st Week of August - 2nd Week of August",
      lengthForecast: "125-140 days",
      rainfallLTM: { mam: "250-430 mm", amj: "390-510 mm" },
      rainfallForecast: { mam: "320-460 mm", amj: "360-600 mm" },
      drySpellsLTM: { early: 8, late: 10 },
      drySpellsForecast: { early: 12, late: "10-15" },
    },
    "Forest Zone": {
      startLTM: "2nd Week of March - 1st Week of April",
      endLTM: "1st Week of July - 2nd Week of August",
      lengthLTM: "92-115 days",
      startForecast: "2nd Week of March - 1st Week of April",
      endForecast: "1st Week of August - 3rd Week of August",
      lengthForecast: "130-145 days",
      rainfallLTM: { mam: "230-420 mm", amj: "400-500 mm" },
      rainfallForecast: { mam: "290-450 mm", amj: "370-590 mm" },
      drySpellsLTM: { early: 7, late: 12 },
      drySpellsForecast: { early: 9, late: "12-16" },
    },
    "Transition Zone": {
      startLTM: "3rd Week of March - 1st Week of April",
      endLTM: "1st Week of July - 2nd Week of July",
      lengthLTM: "90-115 days",
      startForecast: "3rd Week of March - 1st Week of April",
      endForecast: "2nd Week of July - 3rd Week of July",
      lengthForecast: "120-135 days",
      rainfallLTM: { mam: "210-400 mm", amj: "380-490 mm" },
      rainfallForecast: { mam: "260-430 mm", amj: "320-550 mm" },
      drySpellsLTM: { early: 10, late: 11 },
      drySpellsForecast: { early: 11, late: "10-14" },
    },
    "Northern Zone": {
      startLTM: "1st Week of April - 2nd Week of May",
      endLTM: "3rd Week of July - 2nd Week of August",
      lengthLTM: "95-120 days",
      startForecast: "1st Week of April - 3rd Week of May",
      endForecast: "3rd Week of July - 4th Week of July",
      lengthForecast: "125-150 days",
      rainfallLTM: { mam: "240-420 mm", amj: "390-490 mm" },
      rainfallForecast: { mam: "310-450 mm", amj: "400-610 mm" },
      drySpellsLTM: { early: 9, late: 10 },
      drySpellsForecast: { early: 8, late: "14-16" },
    },
    "Upper East": {
      startLTM: "1st Week of April - 2nd Week of May",
      endLTM: "3rd Week of October - 2nd Week of November",
      lengthLTM: "95-120 days",
      startForecast: "1st Week of April - 3rd Week of May",
      endForecast: "1st Week of October - 4th Week of November",
      lengthForecast: "125-150 days",
      rainfallLTM: { mam: "140-520 mm", amj: "390-490 mm" },
      rainfallForecast: { mam: "310-450 mm", amj: "400-610 mm" },
      drySpellsLTM: { early: 8, late: 11 },
      drySpellsForecast: { early: 12, late: "16-22" },
    },
    "Upper West": {
      startLTM: "1st Week of April - 2nd Week of May",
      endLTM: "2nd Week of October - 2nd Week of November",
      lengthLTM: "95-120 days",
      startForecast: "3rd Week of April - 2nd Week of May",
      endForecast: "3rd Week of October - 3rd Week of November",
      lengthForecast: "125-150 days",
      rainfallLTM: { mam: "122-540 mm", amj: "390-490 mm" },
      rainfallForecast: { mam: "310-450 mm", amj: "400-610 mm" },
      drySpellsLTM: { early: 7, late: 11 },
      drySpellsForecast: { early: 11, late: "13-19" },
    },
  };

  const currentData = forecastData[selectedZone];

  // Derived chart data
  const lengthLTM = parseRange(currentData.lengthLTM);
  const lengthForecast = parseRange(currentData.lengthForecast);
  const lengthDomainMin = 60;
  const lengthDomainMax = 160;
  const toPct = (v) =>
    ((v - lengthDomainMin) / (lengthDomainMax - lengthDomainMin)) * 100;

  const rainfallChartData = [
    {
      season: "MAM",
      LTM: parseRange(currentData.rainfallLTM.mam).mid,
      Forecast: parseRange(currentData.rainfallForecast.mam).mid,
    },
    {
      season: "AMJ",
      LTM: parseRange(currentData.rainfallLTM.amj).mid,
      Forecast: parseRange(currentData.rainfallForecast.amj).mid,
    },
  ];

  const drySpellsChartData = [
    {
      period: "Early",
      LTM: parseRange(currentData.drySpellsLTM.early).mid,
      Forecast: parseRange(currentData.drySpellsForecast.early).mid,
    },
    {
      period: "Late",
      LTM: parseRange(currentData.drySpellsLTM.late).mid,
      Forecast: parseRange(currentData.drySpellsForecast.late).mid,
    },
  ];

  const handleDownload = () => {
    const forecastText = `
    Seasonal Forecast for ${selectedZone}:
    - Start (LTM): ${currentData.startLTM}
    - End (LTM): ${currentData.endLTM}
    - Rainfall MAM: ${currentData.rainfallLTM.mam} | Forecast: ${currentData.rainfallForecast.mam}
    - Dry Spells Early: ${currentData.drySpellsLTM.early} | Forecast: ${currentData.drySpellsForecast.early}
    `;
    const link = document.createElement("a");
    link.href = "/public/FORECAST FOR THE MINOR RAINY SEASON-2024-1 final.pdf"; // Relative path to the PDF in the public directory
    link.download = "minor-season-forecast.pdf"; // Filename for the downloaded file
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    const blob = new Blob([forecastText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedZone}_forecast.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <PageTitle title="Seasonal Weather Forecast" />
      <div className="neo-page min-h-screen pt-32 md:pt-36 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
      <Breadcrumb />
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
          {selectedZone}{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            <T>Seasonal Forecast</T>
          </span>
        </h1>
        <p className="mt-2 text-sm font-semibold text-emerald-700 uppercase tracking-wider">
          <T>Normal Onset and Early Cessation</T>
        </p>
        <p className="mt-2 text-sm font-medium text-slate-500">
          <T>Updated</T> {formatUpdatedTime(updatedAt)}
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {/* Zone Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(forecastData).map((zone) => {
            const active = zone === selectedZone;
            return (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {zone}
              </button>
            );
          })}
        </div>
        {/* Download Button */}
        <div className="flex justify-end">
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <FaDownload /> <T>Download Forecast</T>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-sm">
          <img
            src={SON}
            alt="Agro-Ecological Zones Map"
            className="w-full h-auto mb-4 max-w-xs mx-auto"
          />
        </div>

        {/* LTM and Forecast Table */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
              <FaCloudSun style={{ fontSize: "1.25rem" }} />
            </span>
            <h3 className="text-xl font-semibold text-slate-900"><T>Season Length</T></h3>
          </div>

          {/* Season length range bars */}
          <div className="mb-5 space-y-4">
            {[
              { label: "LTM", range: lengthLTM, color: "bg-slate-300", dot: "bg-slate-500" },
              { label: "2026 Forecast", range: lengthForecast, color: "bg-emerald-200", dot: "bg-emerald-600" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>{row.label}</span>
                  <span>{row.range.min}–{row.range.max} days</span>
                </div>
                <div className="relative h-3 rounded-full bg-slate-100">
                  <div
                    className={`absolute top-0 h-3 rounded-full ${row.color}`}
                    style={{
                      left: `${toPct(row.range.min)}%`,
                      width: `${Math.max(2, toPct(row.range.max) - toPct(row.range.min))}%`,
                    }}
                  />
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${row.dot}`}
                    style={{ left: `calc(${toPct(row.range.mid)}% - 6px)` }}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{lengthDomainMin}d</span>
              <span>{(lengthDomainMin + lengthDomainMax) / 2}d</span>
              <span>{lengthDomainMax}d</span>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full table-fixed border border-slate-200 text-sm">
            <thead>
              <tr>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600 text-center"></th>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600 text-center">LTM</th>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600 text-center">
                  2026 Forecast
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 text-center border border-slate-200 text-slate-700"><T>Start</T></td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.startLTM}
                </td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.startForecast}
                </td>
              </tr>
              <tr>
                <td className="p-2 text-center border border-slate-200 text-slate-700"><T>End</T></td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">{currentData.endLTM}</td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.endForecast}
                </td>
              </tr>
              <tr>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  <T>Length of Season (Days)</T>
                </td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.lengthLTM}
                </td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.lengthForecast}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        {/* Rainfall Table */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
              <FaCloudRain style={{ fontSize: "1.25rem" }} />
            </span>
            <h3 className="text-xl font-semibold text-slate-900"><T>Cumulative Rainfall</T></h3>
          </div>
          <div className="mb-5" style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={rainfallChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="season" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit=" mm" />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="LTM" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Forecast" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full table-fixed border border-slate-200 text-sm">
            <thead>
              <tr>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600"><T>Season</T></th>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600">LTM</th>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600">2026 Forecast</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 text-center border border-slate-200 text-slate-700">MAM</td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.rainfallLTM.mam}
                </td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.rainfallForecast.mam}
                </td>
              </tr>
              <tr>
                <td className="p-2 text-center border border-slate-200 text-slate-700">AMJ</td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.rainfallLTM.amj}
                </td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.rainfallForecast.amj}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold text-red-600 flex items-center">
              <FaExclamationCircle className="text-red-600 h-5 w-5 mr-2" />
              <T>Advisories:</T>
            </h4>
            <ul className="list-disc ml-5 text-sm text-slate-600 mt-1 space-y-1">
              <li><T>Harvest rain water and store for irrigation.</T></li>
              <li><T>Cultivate early short cycle crops.</T></li>
              <li><T>Contact agricultural experts for information</T></li>
            </ul>
          </div>
        </div>

        {/* Dry Spells Table */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 items-center justify-center">
              <FaSun style={{ fontSize: "1.25rem" }} />
            </span>
            <h3 className="text-xl font-semibold text-slate-900"><T>Dry Spells</T></h3>
          </div>
          <div className="mb-5" style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={drySpellsChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit=" d" />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="LTM" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Forecast" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full table-fixed border border-slate-200 text-sm">
            <thead>
              <tr>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600"><T>TYPE</T></th>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600">LTM</th>
                <th className="p-2 bg-slate-50 border border-slate-200 text-slate-600">2026 Forecast</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 text-center border border-slate-200 text-slate-700"><T>Early</T></td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.drySpellsLTM.early}
                </td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.drySpellsForecast.early}
                </td>
              </tr>
              <tr>
                <td className="p-2 text-center border border-slate-200 text-slate-700"><T>Late</T></td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.drySpellsLTM.late}
                </td>
                <td className="p-2 text-center border border-slate-200 text-slate-700">
                  {currentData.drySpellsForecast.late}
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-red-600 flex items-center">
              <FaExclamationCircle className="text-red-600 h-5 w-5 mr-2" />
              <T>Advisories:</T>
            </h4>
            <ul className="list-disc ml-5 text-sm text-slate-600 mt-1 space-y-1">
              <li><T>Monitor weather updates regularly.</T></li>
              <li><T>Prepare for potential irrigation needs.</T></li>
              <li><T>Consult with local agronomists for crop management.</T></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="text-center mt-10 text-xs text-slate-500">
        <T>Long Term Mean (LTM) is the 30-year average condition of a given zone from 1991 - 2020</T>
      </footer>
      </div>
    </div>
    </>
  );
};

export default SeasonalForecast;
