import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const Sidebar = ({ products }) => {
  return (
    <div className="sidebar w-64 bg-gray-100 h-full p-4">
      <h2 className="text-2xl font-bold mb-4">Commodities</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id} className="mb-2">
            <Link
              to={`/product/${product.id}`}
              className="text-blue-500 hover:underline"
            >
              {product.name} (ID: {product.id})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

Sidebar.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Sidebar;
