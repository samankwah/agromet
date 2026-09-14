export const WeatherCard = ({ city, temperature, condition }) => (
  <div className="bg-neo-surface rounded-lg shadow-md p-4 m-1">
    <h3 className="text-lg font-semibold">{city}</h3>
    <p className="text-3xl font-bold">{temperature}°C</p>
    <p>{condition}</p>
  </div>
);

// export default WeatherCard;
