import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import PageTitle from "./PageTitle";

const ProductDetail = ({ products }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.id === parseInt(id));

  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <p>Product not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-800 text-white px-4 py-2 rounded-full mb-4"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    console.log(`Added ${quantity} of ${product.name} to the cart`);
  };

  return (
    <>
      <PageTitle title={`${product.name} - Product Details`} />
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-8">
        {" "}
        {/* Gradient Background */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/market-page")}
          className="text-teal-500 hover:text-teal-600 flex items-center gap-2 transition-colors mb-6"
        >
          <span>←</span>
          <span className="text-sm font-medium">GO BACK</span>
        </button>
        <div className="bg-white rounded-lg shadow-lg p-8 pb-20">
          {" "}
          {/* Card with white background and shadow */}
          {/* Flexbox: Stacks vertically on smaller screens */}
          <div className="flex flex-col md:flex-row md:space-x-16 space-y-6 md:space-y-8/">
            <img
              src={product.image || "https://via.placeholder.com/150"}
              alt={product.name}
              className="w-full md:w-96 h-auto object-cover rounded-lg shadow-md"
            />
            <div>
              <h1 className="text-2xl md:text-4xl font-semibold mb-4">
                {product.name}
              </h1>
              <p className="text-yellow-500 text-lg md:text-xl">
                ★★★★★ {product.reviewsCount} Customer Reviews
              </p>
              <p className="text-gray-600 text-lg mt-2">
                GH₵{product.price.toFixed(2)}
              </p>
              <p className="text-lg mt-2">
                {product.stock === 0 ? (
                  <span className="text-red-600">Out of Stock</span>
                ) : (
                  <span className="text-green-600">In Stock</span>
                )}
              </p>

              <div className="mt-6">
                <label className="block text-gray-600 mb-2 text-lg">
                  Choose Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="bg-gray-200 px-3 py-2 rounded text-lg"
                  >
                    -
                  </button>
                  <span className="text-xl">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="bg-gray-200 px-3 py-2 rounded text-lg"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="bg-green-600 text-white px-6 py-3 rounded mt-6 hover:bg-green-700 text-lg font-semibold w-full md:w-auto"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-semibold">Description</h2>
            <p className="text-gray-700 mt-4 text-lg md:text-xl">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

// PropTypes validation
ProductDetail.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      stock: PropTypes.number.isRequired,
      description: PropTypes.string,
      image: PropTypes.string,
      reviewsCount: PropTypes.number.isRequired,
    })
  ).isRequired,
};
export default ProductDetail;
