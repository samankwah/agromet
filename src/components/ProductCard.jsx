import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import YellowMaizeImage from "../assets/images/yellow maize.png";

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <img
        src={product.image || YellowMaizeImage}
        alt={product.name || "Product Image"}
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-bold">
          {product.name || "Unnamed Product"}
        </h3>
        <p className="text-gray-600">Qty: {product.quantity || 0}</p>
        <p className="text-gray-600">Price: GH₵{product.price || "N/A"}</p>

        {/* Link to the product detail page */}
        <Link
          to={`/product/${product.id}`}
          className="text-blue-500 hover:underline mt-4 inline-block"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    stock: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired, // Added validation for quantity
    image: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    reviewsCount: PropTypes.number.isRequired,
  }).isRequired,
};

export default ProductCard;
