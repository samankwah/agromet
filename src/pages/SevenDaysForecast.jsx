import { useState, useEffect } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  Wind,
  Droplet,
  Thermometer,
  MapPin,
  Loader,
} from "lucide-react";
import PageTitle from "../components/PageTitle";

const SevenDaysForecast = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [tempUnit, setTempUnit] = useState("celsius"); // celsius or fahrenheit
  const [location, setLocation] = useState({
    city: "Accra",
    region: "Greater Accra",
    country: "Ghana",
  });
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [forecastData, setForecastData] = useState([]);

  // Function to get formatted date string (e.g., "May 21")
  const getFormattedDate = (daysToAdd = 0) => {
    const date = new Date(currentDateTime);
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Function to get day name
  const getDayName = (daysToAdd = 0) => {
    const date = new Date(currentDateTime);
    date.setDate(date.getDate() + daysToAdd);

    if (daysToAdd === 0) return "Today";
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Get user's location
  useEffect(() => {
    const getUserLocation = async () => {
      setLoading(true);
      try {
        // In a real app, you would use a geolocation API to get the actual location
        // For demonstration, we'll use a mock location service with fallback to Accra

        // This simulates getting location from browser's geolocation API
        // navigator.geolocation.getCurrentPosition() would be used in a real app

        // Simulate location detection (defaulting to Accra for demonstration)
        setTimeout(() => {
          setLocation({
            city: "Accra",
            region: "Greater Accra",
            country: "Ghana",
          });
          setLoading(false);
          generateForecastData();
        }, 1000);
      } catch (error) {
        console.error("Error getting location:", error);
        setLocation({
          city: "Accra",
          region: "Greater Accra",
          country: "Ghana",
        });
        setLoading(false);
      }
    };

    getUserLocation();

    // Update the current time every minute
    const timeInterval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Generate forecast data based on current date
  const generateForecastData = () => {
    // Mock data for 7-day forecast with dynamic dates
    const newForecastData = [
      {
        day: getDayName(0),
        date: getFormattedDate(0),
        high: 31,
        low: 24,
        condition: "partly-cloudy",
        humidity: 70,
        rainChance: 10,
        windSpeed: 12,
        hourly: [
          { time: "6AM", temp: 24, condition: "clear", rainChance: 0 },
          { time: "9AM", temp: 26, condition: "partly-cloudy", rainChance: 0 },
          {
            time: "12PM",
            temp: 30,
            condition: "partly-cloudy",
            rainChance: 10,
          },
          { time: "3PM", temp: 31, condition: "partly-cloudy", rainChance: 10 },
          { time: "6PM", temp: 28, condition: "partly-cloudy", rainChance: 5 },
          { time: "9PM", temp: 26, condition: "clear", rainChance: 0 },
          { time: "12AM", temp: 25, condition: "clear", rainChance: 0 },
          { time: "3AM", temp: 24, condition: "clear", rainChance: 0 },
        ],
      },
      {
        day: getDayName(1),
        date: getFormattedDate(1),
        high: 32,
        low: 24,
        condition: "clear",
        humidity: 65,
        rainChance: 0,
        windSpeed: 10,
        hourly: [
          { time: "6AM", temp: 24, condition: "clear", rainChance: 0 },
          { time: "9AM", temp: 27, condition: "clear", rainChance: 0 },
          { time: "12PM", temp: 30, condition: "clear", rainChance: 0 },
          { time: "3PM", temp: 32, condition: "clear", rainChance: 0 },
          { time: "6PM", temp: 29, condition: "clear", rainChance: 0 },
          { time: "9PM", temp: 26, condition: "clear", rainChance: 0 },
          { time: "12AM", temp: 25, condition: "clear", rainChance: 0 },
          { time: "3AM", temp: 24, condition: "clear", rainChance: 0 },
        ],
      },
      {
        day: getDayName(2),
        date: getFormattedDate(2),
        high: 30,
        low: 25,
        condition: "partly-cloudy",
        humidity: 75,
        rainChance: 30,
        windSpeed: 14,
        hourly: [
          { time: "6AM", temp: 25, condition: "partly-cloudy", rainChance: 10 },
          { time: "9AM", temp: 27, condition: "partly-cloudy", rainChance: 20 },
          {
            time: "12PM",
            temp: 29,
            condition: "partly-cloudy",
            rainChance: 30,
          },
          { time: "3PM", temp: 30, condition: "cloudy", rainChance: 30 },
          { time: "6PM", temp: 28, condition: "cloudy", rainChance: 25 },
          { time: "9PM", temp: 27, condition: "partly-cloudy", rainChance: 20 },
          {
            time: "12AM",
            temp: 26,
            condition: "partly-cloudy",
            rainChance: 10,
          },
          { time: "3AM", temp: 25, condition: "partly-cloudy", rainChance: 10 },
        ],
      },
      {
        day: getDayName(3),
        date: getFormattedDate(3),
        high: 29,
        low: 24,
        condition: "rain",
        humidity: 85,
        rainChance: 80,
        windSpeed: 18,
        hourly: [
          { time: "6AM", temp: 24, condition: "cloudy", rainChance: 40 },
          { time: "9AM", temp: 25, condition: "cloudy", rainChance: 60 },
          { time: "12PM", temp: 27, condition: "rain", rainChance: 80 },
          { time: "3PM", temp: 29, condition: "rain", rainChance: 80 },
          { time: "6PM", temp: 27, condition: "rain", rainChance: 70 },
          { time: "9PM", temp: 26, condition: "rain", rainChance: 60 },
          { time: "12AM", temp: 25, condition: "cloudy", rainChance: 40 },
          { time: "3AM", temp: 24, condition: "cloudy", rainChance: 30 },
        ],
      },
      {
        day: getDayName(4),
        date: getFormattedDate(4),
        high: 30,
        low: 23,
        condition: "rain",
        humidity: 80,
        rainChance: 60,
        windSpeed: 15,
        hourly: [
          { time: "6AM", temp: 23, condition: "cloudy", rainChance: 30 },
          { time: "9AM", temp: 25, condition: "cloudy", rainChance: 40 },
          { time: "12PM", temp: 28, condition: "rain", rainChance: 60 },
          { time: "3PM", temp: 30, condition: "rain", rainChance: 60 },
          { time: "6PM", temp: 27, condition: "rain", rainChance: 50 },
          { time: "9PM", temp: 25, condition: "cloudy", rainChance: 30 },
          {
            time: "12AM",
            temp: 24,
            condition: "partly-cloudy",
            rainChance: 20,
          },
          { time: "3AM", temp: 23, condition: "partly-cloudy", rainChance: 10 },
        ],
      },
      {
        day: getDayName(5),
        date: getFormattedDate(5),
        high: 31,
        low: 23,
        condition: "partly-cloudy",
        humidity: 70,
        rainChance: 20,
        windSpeed: 12,
        hourly: [
          { time: "6AM", temp: 23, condition: "partly-cloudy", rainChance: 10 },
          { time: "9AM", temp: 26, condition: "partly-cloudy", rainChance: 10 },
          {
            time: "12PM",
            temp: 29,
            condition: "partly-cloudy",
            rainChance: 20,
          },
          { time: "3PM", temp: 31, condition: "partly-cloudy", rainChance: 20 },
          { time: "6PM", temp: 28, condition: "partly-cloudy", rainChance: 10 },
          { time: "9PM", temp: 26, condition: "clear", rainChance: 0 },
          { time: "12AM", temp: 24, condition: "clear", rainChance: 0 },
          { time: "3AM", temp: 23, condition: "clear", rainChance: 0 },
        ],
      },
      {
        day: getDayName(6),
        date: getFormattedDate(6),
        high: 32,
        low: 24,
        condition: "clear",
        humidity: 65,
        rainChance: 0,
        windSpeed: 10,
        hourly: [
          { time: "6AM", temp: 24, condition: "clear", rainChance: 0 },
          { time: "9AM", temp: 27, condition: "clear", rainChance: 0 },
          { time: "12PM", temp: 30, condition: "clear", rainChance: 0 },
          { time: "3PM", temp: 32, condition: "clear", rainChance: 0 },
          { time: "6PM", temp: 29, condition: "clear", rainChance: 0 },
          { time: "9PM", temp: 26, condition: "clear", rainChance: 0 },
          { time: "12AM", temp: 25, condition: "clear", rainChance: 0 },
          { time: "3AM", temp: 24, condition: "clear", rainChance: 0 },
        ],
      },
    ];

    setForecastData(newForecastData);
  };

  // Helper function to convert celsius to fahrenheit
  const celsiusToFahrenheit = (celsius) => {
    return Math.round((celsius * 9) / 5 + 32);
  };

  // Helper function to get temperature with unit
  const getTemp = (temp) => {
    return tempUnit === "celsius"
      ? `${temp}°C`
      : `${celsiusToFahrenheit(temp)}°F`;
  };

  // Helper function to get weather icon based on condition
  const getWeatherIcon = (condition, size = 24) => {
    switch (condition) {
      case "clear":
        return <Sun size={size} className="text-yellow-500" />;
      case "partly-cloudy":
        return <Cloud size={size} className="text-gray-400" />;
      case "cloudy":
        return <Cloud size={size} className="text-gray-600" />;
      case "rain":
        return <CloudRain size={size} className="text-blue-500" />;
      case "thunderstorm":
        return <CloudLightning size={size} className="text-purple-600" />;
      case "drizzle":
        return <CloudDrizzle size={size} className="text-blue-400" />;
      default:
        return <Sun size={size} className="text-yellow-500" />;
    }
  };

  // Get background color based on time of day and condition
  const getBackgroundColor = () => {
    if (!forecastData || !forecastData[selectedDay])
      return "from-blue-400 to-blue-600";

    const condition = forecastData[selectedDay].condition;
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour >= 18;

    if (condition === "clear")
      return isNight
        ? "from-indigo-900 to-blue-900"
        : "from-blue-400 to-blue-600";
    if (condition === "partly-cloudy")
      return isNight
        ? "from-gray-800 to-blue-900"
        : "from-blue-300 to-blue-500";
    if (condition === "cloudy")
      return isNight
        ? "from-gray-700 to-gray-900"
        : "from-gray-300 to-gray-500";
    if (condition === "rain" || condition === "drizzle")
      return isNight
        ? "from-blue-800 to-gray-900"
        : "from-blue-700 to-blue-900";
    if (condition === "thunderstorm")
      return isNight
        ? "from-purple-900 to-gray-900"
        : "from-purple-700 to-purple-900";

    return isNight
      ? "from-indigo-900 to-blue-900"
      : "from-blue-400 to-blue-600";
  };

  // Format time for display with AM/PM
  const formatTime = () => {
    return currentDateTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading || forecastData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-blue-50">
        <Loader className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="mt-4 text-lg text-blue-800">
          Loading weather forecast...
        </p>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="7-Day Weather Forecast" />
      <div className="container mx-auto mt-10 px-4 sm:px-6 lg:px-8 mt-24">
      {/* Location and last updated info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="flex items-center mb-2 sm:mb-0">
          <MapPin className="h-5 w-5 text-blue-600 mr-1" />
          <h1 className="text-xl font-semibold text-gray-800">
            {location.city}, {location.region}, {location.country}
          </h1>
        </div>
        <div className="text-sm text-gray-500">
          Last updated:{" "}
          {currentDateTime.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          {formatTime()}
        </div>
      </div>

      {/* Main forecast card */}
      <div
        className={`bg-gradient-to-br ${getBackgroundColor()} rounded-2xl shadow-lg text-white overflow-hidden`}
      >
        {/* Current day overview */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-semibold">
                {forecastData[selectedDay].day}
              </h2>
              <p className="text-lg opacity-90">
                {forecastData[selectedDay].date}
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setTempUnit("celsius")}
                className={`px-3 py-1 rounded-l-lg ${
                  tempUnit === "celsius"
                    ? "bg-white text-blue-600"
                    : "bg-blue-700 text-white"
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setTempUnit("fahrenheit")}
                className={`px-3 py-1 rounded-r-lg ${
                  tempUnit === "fahrenheit"
                    ? "bg-white text-blue-600"
                    : "bg-blue-700 text-white"
                }`}
              >
                °F
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-6">
            <div className="flex items-center">
              {getWeatherIcon(forecastData[selectedDay].condition, 64)}
              <div className="ml-4">
                <div className="text-6xl font-light">
                  {getTemp(forecastData[selectedDay].high)}
                </div>
                <div className="text-lg">
                  Low: {getTemp(forecastData[selectedDay].low)}
                </div>
                <div className="text-lg capitalize">
                  {forecastData[selectedDay].condition.replace("-", " ")}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex items-center">
                <Droplet size={16} className="mr-2" />
                <span>Humidity: {forecastData[selectedDay].humidity}%</span>
              </div>
              <div className="flex items-center">
                <CloudRain size={16} className="mr-2" />
                <span>Rain: {forecastData[selectedDay].rainChance}%</span>
              </div>
              <div className="flex items-center">
                <Wind size={16} className="mr-2" />
                <span>Wind: {forecastData[selectedDay].windSpeed} km/h</span>
              </div>
              <div className="flex items-center">
                <Thermometer size={16} className="mr-2" />
                <span>
                  Feels like: {getTemp(forecastData[selectedDay].high - 1)}
                </span>
              </div>
            </div>
          </div>

          {/* Hourly forecast for selected day */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Hourly Forecast</h3>
            <div className="flex overflow-x-auto pb-2 space-x-4">
              {forecastData[selectedDay].hourly.map((hour, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 min-w-[70px]"
                >
                  <span className="text-sm font-medium mb-1">{hour.time}</span>
                  {getWeatherIcon(hour.condition, 28)}
                  <span className="mt-1 font-medium">{getTemp(hour.temp)}</span>
                  {hour.rainChance > 0 && (
                    <div className="flex items-center mt-1 text-xs">
                      <CloudRain size={10} className="mr-1" />
                      {hour.rainChance}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7-day forecast row */}
        <div className="bg-gray-800/40 backdrop-blur-sm p-4">
          <h3 className="text-lg font-semibold mb-3">7-Day Forecast</h3>
          <div className="grid grid-cols-7 gap-2">
            {forecastData.map((day, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedDay === idx ? "bg-white/20" : "hover:bg-white/10"
                }`}
                onClick={() => setSelectedDay(idx)}
              >
                <span className="text-sm font-medium">{day.day}</span>
                <div className="my-2">{getWeatherIcon(day.condition)}</div>
                <div className="flex flex-col items-center text-xs sm:text-sm">
                  <span className="font-medium">
                    {getTemp(day.high).split("°")[0]}°
                  </span>
                  <span className="opacity-80">
                    {getTemp(day.low).split("°")[0]}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast matrix (similar to iPhone weather app) */}
      <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Weather Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  DAY
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  CONDITION
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  HIGH / LOW
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  RAIN %
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  HUMIDITY
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  WIND
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {forecastData.map((day, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-blue-50 cursor-pointer ${
                    selectedDay === idx ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedDay(idx)}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium">{day.day}</div>
                    <div className="text-xs text-gray-500">{day.date}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {getWeatherIcon(day.condition)}
                      <span className="ml-2 capitalize">
                        {day.condition.replace("-", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {getTemp(day.high)} / {getTemp(day.low)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          className="h-1.5 rounded-full bg-blue-600"
                          style={{ width: `${day.rainChance}%` }}
                        ></div>
                      </div>
                      <span>{day.rainChance}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          className="h-1.5 rounded-full bg-purple-600"
                          style={{ width: `${day.humidity}%` }}
                        ></div>
                      </div>
                      <span>{day.humidity}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Wind size={16} className="mr-2 text-gray-500" />
                      <span>{day.windSpeed} km/h</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-sm text-gray-500 mb-8">
        <p>
          Weather data provided by Ghana Meteorological Agency • Last updated:{" "}
          {formatTime()}
        </p>
      </div>
    </div>
    </>
  );
};

export default SevenDaysForecast;
