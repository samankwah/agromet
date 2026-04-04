import { useState } from "react";
import { FaCloudSun, FaCloudRain, FaDownload, FaSun } from "react-icons/fa";
import { GiWaterDrop } from "react-icons/gi";
import SON from "../assets/images/SON.png";
import { FaExclamationCircle } from "react-icons/fa";
import PageTitle from "../components/PageTitle";

const SeasonalForecast = () => {
  const [selectedZone, setSelectedZone] = useState("East Coast");

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
      <div className="container mx-auto p-6 bg-teal-900 text-white pt-24">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold">{selectedZone} Forecast</h1>
        <strong className="text-2xl text-yellow-400">
          NORMAL ONSET AND EARLY CESSATION
        </strong>
      </div>

      <div className="flex justify-between items-center mt-8">
        {/* Zone Selection */}
        <div className="w-1/6 pb-12">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full text-black p-2 rounded-md border border-gray-300"
          >
            {Object.keys(forecastData).map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
        {/* Download Button */}
        <div className=" pb-12">
          <button
            onClick={handleDownload}
            className="flex items-center bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400 w-full md:w-auto"
          >
            <FaDownload className="mr-2" /> Download Forecast
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <div className="bg-white text-black rounded-lg p-4">
          <img
            src={SON}
            alt="Agro-Ecological Zones Map"
            className="w-full h-auto mb-4 max-w-xs mx-auto"
          />
        </div>

        {/* LTM and Forecast Table */}
        <div className="bg-white text-black rounded-lg p-6">
          <GiWaterDrop
            className="inline text-blue-500 mr-2 pt-12"
            style={{ fontSize: "1.5rem" }}
          />
          <FaCloudRain
            className="inline text-blue-500 mr-2"
            style={{ fontSize: "2.5rem" }}
          />
          <GiWaterDrop
            className="inline text-blue-500 mr-2"
            style={{ fontSize: "1.5rem" }}
          />

          <FaCloudSun
            className="inline text-blue-500 mr-2"
            style={{ fontSize: "2.5rem" }}
          />

          <table className="w-full table-fixed border border-gray-300">
            <thead>
              <tr className="border-b">
                <th className="p-2 bg-gray-200 border text-center"></th>
                <th className="p-2 bg-gray-200 border text-center">LTM</th>

                <th className="p-2 bg-gray-200 border text-center">
                  2025 Forecast
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-center border">Start</td>
                <td className="p-2 text-center border">
                  {currentData.startLTM}
                </td>
                <td className="p-2 text-center border">
                  {currentData.startForecast}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-center border">End</td>
                <td className="p-2 text-center border">{currentData.endLTM}</td>
                <td className="p-2 text-center border">
                  {currentData.endForecast}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-center border">
                  Length of Season (Days)
                </td>
                <td className="p-2 text-center border">
                  {currentData.lengthLTM}
                </td>
                <td className="p-2 text-center border">
                  {currentData.lengthForecast}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Rainfall Table */}
        <div className="bg-white text-black rounded-lg p-6">
          <h3 className="text-xl font-bold text-teal-900 mb-4">
            <FaCloudRain
              className="inline text-blue-500 mr-2"
              style={{ fontSize: "2.5rem" }}
            />
            Cumulative Rainfall
          </h3>
          <table className="w-full table-fixed border border-gray-300">
            <thead>
              <tr className="border-b">
                <th className="p-2 bg-gray-200">Season</th>
                <th className="p-2 bg-gray-200">LTM</th>
                <th className="p-2 bg-gray-200">2025 Forecast</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-center border">MAM</td>
                <td className="p-2 text-center border">
                  {currentData.rainfallLTM.mam}
                </td>
                <td className="p-2 text-center border">
                  {currentData.rainfallForecast.mam}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-center border">AMJ</td>
                <td className="p-2 text-center border">
                  {currentData.rainfallLTM.amj}
                </td>
                <td className="p-2 text-center border">
                  {currentData.rainfallForecast.amj}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <h4 className="font-bold text-red-600 flex items-center">
              <FaExclamationCircle className="text-red-600 h-5 w-5 mr-2" />
              Advisories:
            </h4>
            <ul className="list-disc ml-5">
              <li>Harvest rain water and store for irrigation.</li>
              <li>Cultivate early short cycle crops.</li>
              <li>Contact agricultural experts for information</li>
            </ul>
          </div>
        </div>

        {/* Dry Spells Table */}
        <div className="bg-white text-black rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FaSun
              className="text-orange-500 mr-2"
              style={{ fontSize: "2.5rem" }}
            />{" "}
            {/* Adjusted icon size */}
            <h3 className="text-xl font-bold text-teal-900">Dry Spells</h3>
          </div>
          <table className="w-full table-fixed border border-gray-300">
            <thead>
              <tr className="border-b">
                <th className="p-2 bg-gray-200">TYPE</th>
                <th className="p-2 bg-gray-200">LTM</th>
                <th className="p-2 bg-gray-200">2025 Forecast</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-center border">Early</td>
                <td className="p-2 text-center border">
                  {currentData.drySpellsLTM.early}
                </td>
                <td className="p-2 text-center border">
                  {currentData.drySpellsForecast.early}
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-center border">Late</td>
                <td className="p-2 text-center border">
                  {currentData.drySpellsLTM.late}
                </td>
                <td className="p-2 text-center border">
                  {currentData.drySpellsForecast.late}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4">
            <h4 className="font-bold text-red-600 flex items-center">
              <FaExclamationCircle className="text-red-600 h-5 w-5 mr-2" />
              Advisories:
            </h4>
            <ul className="list-disc ml-5">
              <li>Monitor weather updates regularly.</li>
              <li>Prepare for potential irrigation needs.</li>
              <li>Consult with local agronomists for crop management.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="text-center mt-10 text-gray-300">
        <strong>
          Long Term Mean (LTM) is the 30-year average condition of a given zone
          from 1991 - 2020
        </strong>
      </footer>
    </div>
    </>
  );
};

export default SeasonalForecast;
