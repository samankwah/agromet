import PropTypes from "prop-types";

const Modal = ({ isOpen, onClose, product, quantity }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-neo-text/35 p-4">
      <div className="neo-surface p-6 max-w-lg w-full">
        <h2 className="text-lg font-semibold mb-4 text-neo-text">Product Details</h2>
        <img
          src={product.image || "https://via.placeholder.com/150"}
          alt={product.name}
          className="w-full h-32 object-cover rounded-neo mb-4"
        />
        <h3 className="text-xl font-bold text-neo-text">{product.name}</h3>
        <p className="text-yellow-500 text-lg">
          ★★★★☆ {product.reviewsCount} Customer Reviews
        </p>
        <p className="text-gray-600 text-lg">GH₵{product.price.toFixed(2)}</p>
        <p className="text-lg mt-2 text-neo-muted">{product.description}</p>
        <p className="mt-2 font-medium text-neo-text">Quantity: {quantity}</p>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="neo-button-primary"
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
