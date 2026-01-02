import PropTypes from "prop-types";

const Modal = ({ isOpen, onClose, product, quantity }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
        <h2 className="text-lg font-semibold mb-4">Product Details</h2>
        <img
          src={product.image || "https://via.placeholder.com/150"}
          alt={product.name}
          className="w-full h-32 object-cover rounded-lg mb-4"
        />
        <h3 className="text-xl font-bold">{product.name}</h3>
        <p className="text-yellow-500 text-lg">
          ★★★★☆ {product.reviewsCount} Customer Reviews
        </p>
        <p className="text-gray-600 text-lg">GH₵{product.price.toFixed(2)}</p>
        <p className="text-lg mt-2">{product.description}</p>
        <p className="mt-2 font-medium">Quantity: {quantity}</p>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// PropTypes validation for the props
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    reviewsCount: PropTypes.number.isRequired,
  }).isRequired,
  quantity: PropTypes.number.isRequired, // Added prop validation for quantity
};

export default Modal;
