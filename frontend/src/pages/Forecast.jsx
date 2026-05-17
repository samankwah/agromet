import { useState, useEffect } from "react";
import ForecastCard from "../components/ForecastCard";
import { getForecast } from "../services/weatherApi";
import PageTitle from "../components/PageTitle";
import T from "../components/common/T";

const Forecast = () => {
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const data = await getForecast();
        setForecast(data);
      } catch (err) {
        setError(err.message || "Forecast unavailable.");
      }
    };
    fetchForecast();
  }, []);

  return (
    <>
      <PageTitle title="5-Day Weather Forecast" />
      <div className="container mx-auto px-4 pb-8 pt-32 md:pt-36">
      <h1 className="text-3xl font-bold mb-4">
        <T>5-Day Forecast</T>
      </h1>
      {error ? (
        <p className="text-red-600">
          <T>{error}</T>
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {forecast.map((day) => (
            <ForecastCard key={day.date} {...day} />
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default Forecast;
