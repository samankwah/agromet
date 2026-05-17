import { useEffect, useState } from "react";
import PageTitle from "../components/PageTitle";
import AnimatedWeatherIcon from "../components/AnimatedWeatherIcon";
import { getForecast } from "../services/weatherApi";
import T from "../components/common/T";
import { ForecastSkeleton } from "../components/common/SkeletonLoading";

const toIconCondition = (condition) => {
  const normalized = String(condition || "").toLowerCase();
  if (normalized.includes("thunder")) return "thunderstorm";
  if (
    normalized.includes("rain") ||
    normalized.includes("drizzle") ||
    normalized.includes("shower")
  ) {
    return "light rain";
  }
  if (normalized.includes("cloud") || normalized.includes("fog")) {
    return "partly cloudy";
  }
  return "sunny intervals";
};

const Weather = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getForecast(undefined, 5);
        if (isMounted) {
          setWeatherData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Weather forecast unavailable.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <PageTitle title="Weather Forecast" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-8 pb-8 pt-32 md:pt-36">
        <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-lg">
          <h1 className="mb-4 text-center text-3xl font-bold text-blue-800">
            <T>Weekly Weather Forecast</T>
          </h1>

          {loading ? (
            <ForecastSkeleton showSearch={false} />
          ) : error ? (
            <p className="text-center text-red-600">
              <T>{error}</T>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {weatherData.map((day) => (
                <div key={day.date} className="rounded-lg bg-blue-100 p-4 shadow-md">
                  <h2 className="text-center text-xl font-semibold text-blue-600">
                    {new Date(`${day.date}T00:00:00`).toLocaleDateString("en-GB", {
                      weekday: "long",
                    })}
                  </h2>
                  <div className="my-3 flex justify-center">
                    <AnimatedWeatherIcon
                      condition={toIconCondition(day.condition)}
                      size="lg"
                      showParticles
                      interactive
                    />
                  </div>
                  <p className="text-center text-lg">
                    {Math.round(day.highTemp)}&deg;C / {Math.round(day.lowTemp)}
                    &deg;C
                  </p>
                  <p className="text-center text-sm text-gray-600">
                    <T>{day.condition}</T>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Weather;
