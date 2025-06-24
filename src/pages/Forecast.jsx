import { useState, useEffect } from "react";
import ForecastCard from "../components/ForecastCard";
import { getForecast } from "../services/weatherApi";

const Forecast = () => {
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    const fetchForecast = async () => {
      const data = await getForecast();
      setForecast(data);
    };
    fetchForecast();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">5-Day Forecast</h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {forecast.map((day) => (
          <ForecastCard key={day.date} {...day} />
        ))}
      </div>
    </div>
  );
};

export default Forecast;
