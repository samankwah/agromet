const mockWeatherData = {
  weather: [
    { city: "New York", temperature: 22, condition: "Sunny" },
    { city: "London", temperature: 18, condition: "Cloudy" },
    { city: "Tokyo", temperature: 28, condition: "Rainy" },
  ],
  alert: "Heat wave expected in New York this weekend",
};

const mockForecastData = [
  { date: "2024-09-11", highTemp: 25, lowTemp: 18, condition: "Sunny" },
  { date: "2024-09-12", highTemp: 27, lowTemp: 19, condition: "Partly Cloudy" },
  { date: "2024-09-13", highTemp: 23, lowTemp: 17, condition: "Rainy" },
  { date: "2024-09-14", highTemp: 22, lowTemp: 16, condition: "Cloudy" },
  { date: "2024-09-15", highTemp: 24, lowTemp: 18, condition: "Sunny" },
];

export const getCurrentWeather = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockWeatherData), 500);
  });
};

export const getForecast = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockForecastData), 500);
  });
};
