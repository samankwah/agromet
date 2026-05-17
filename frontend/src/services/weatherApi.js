import {
  getWeatherBundleByCoordinates,
  OPEN_METEO_SOURCE,
} from "./openMeteoService";

const GHANA_WEATHER_LOCATIONS = [
  { city: "Accra", region: "Greater Accra", lat: 5.6037, lng: -0.187 },
  { city: "Kumasi", region: "Ashanti", lat: 6.6885, lng: -1.6244 },
  { city: "Tamale", region: "Northern", lat: 9.4034, lng: -0.8424 },
  { city: "Wa", region: "Upper West", lat: 10.06, lng: -2.5057 },
  { city: "Bolgatanga", region: "Upper East", lat: 10.7856, lng: -0.8514 },
];

const DEFAULT_LOCATION = GHANA_WEATHER_LOCATIONS[0];

const toChatbotWeather = (location, bundle) => ({
  city: location.city,
  region: location.region,
  temperature: bundle.current.temperatureValue,
  condition: bundle.current.condition,
  humidity: bundle.current.humidityValue,
  windSpeed: bundle.current.windSpeedValue,
  rainfall: bundle.current.rainfallValue,
  source: OPEN_METEO_SOURCE,
  updatedAt: bundle.current.updatedAt,
});

export const getCurrentWeather = async () => {
  const weather = await Promise.all(
    GHANA_WEATHER_LOCATIONS.map(async (location) => {
      const bundle = await getWeatherBundleByCoordinates(
        location.lat,
        location.lng,
        { forecastDays: 1 }
      );
      return toChatbotWeather(location, bundle);
    })
  );

  const wetLocations = weather.filter((item) => item.rainfall > 5);

  return {
    weather,
    alert:
      wetLocations.length > 0
        ? `Rainfall is active or likely around ${wetLocations
            .map((item) => item.city)
            .join(", ")}.`
        : "No active rainfall alert from Open-Meteo for the monitored Ghana locations.",
    source: OPEN_METEO_SOURCE,
  };
};

export const getForecast = async (location = DEFAULT_LOCATION, days = 5) => {
  const bundle = await getWeatherBundleByCoordinates(location.lat, location.lng, {
    forecastDays: days,
  });

  return bundle.daily.slice(0, days).map((day) => ({
    date: day.date,
    highTemp: day.highTemp,
    lowTemp: day.lowTemp,
    condition: day.condition,
    rainChance: day.rainChance,
    source: OPEN_METEO_SOURCE,
  }));
};
