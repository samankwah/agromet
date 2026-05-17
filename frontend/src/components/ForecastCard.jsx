import PropTypes from "prop-types";
import T from "./common/T";

const ForecastCard = ({ date, highTemp, lowTemp, condition, rainChance }) => (
  <div className="m-2 rounded-lg bg-white p-4 shadow-md">
    <h3 className="text-lg font-semibold">{date}</h3>
    <p>
      <T>High</T>: {Math.round(highTemp)}&deg;C
    </p>
    <p>
      <T>Low</T>: {Math.round(lowTemp)}&deg;C
    </p>
    <p>
      <T>Rain</T>: {rainChance ?? 0}%
    </p>
    <p>
      <T>{condition}</T>
    </p>
  </div>
);

ForecastCard.propTypes = {
  date: PropTypes.string.isRequired,
  highTemp: PropTypes.number.isRequired,
  lowTemp: PropTypes.number.isRequired,
  condition: PropTypes.string.isRequired,
  rainChance: PropTypes.number,
};

export default ForecastCard;
