import PropTypes from "prop-types";
import ProductCard from "../components/ProductCard"; // Assuming you have a ProductCard component

const ProductList = ({ products }) => {
  return (
    <div className="product-list grid grid-cols-3 gap-4 p-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// Add prop validation to ensure products is passed as an array of objects
ProductList.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      stock: PropTypes.number.isRequired,
      image: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      reviewsCount: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default ProductList;
