const ForecastCard = ({ date, highTemp, lowTemp, condition }) => (
  <div className="bg-white rounded-lg shadow-md p-4 m-2">
    <h3 className="text-lg font-semibold">{date}</h3>
    <p>High: {highTemp}°C</p>
    <p>Low: {lowTemp}°C</p>
    <p>{condition}</p>
  </div>
);

export default ForecastCard;
