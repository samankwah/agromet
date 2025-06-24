const Weather = () => {
  const weatherData = [
    {
      day: "Monday",
      temperature: "25°C",
      condition: "Sunny",
      icon: "☀️",
    },
    {
      day: "Tuesday",
      temperature: "22°C",
      condition: "Partly Cloudy",
      icon: "🌤️",
    },
    {
      day: "Wednesday",
      temperature: "20°C",
      condition: "Rainy",
      icon: "🌧️",
    },
    {
      day: "Thursday",
      temperature: "24°C",
      condition: "Sunny",
      icon: "☀️",
    },
    {
      day: "Friday",
      temperature: "23°C",
      condition: "Cloudy",
      icon: "☁️",
    },
    // Add more days as needed
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-blue-800 text-3xl font-bold mb-4 text-center">
          Weekly Weather Forecast
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weatherData.map((day, index) => (
            <div key={index} className="bg-blue-100 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-blue-600 text-center">
                {day.day}
              </h2>
              <div className="flex justify-center text-4xl mb-2">
                {day.icon}
              </div>
              <p className="text-lg text-center">{day.temperature}</p>
              <p className="text-sm text-gray-600 text-center">
                {day.condition}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Weather;
