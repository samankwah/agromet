import PropTypes from "prop-types"; // Import PropTypes for validation
import { FaTimes } from "react-icons/fa";

const Modal = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-neo-surface rounded-lg shadow-lg p-6 relative max-w-md w-full">
        <button
          className="absolute top-2 right-2 text-neo-muted hover:text-neo-text"
          onClick={onClose}
        >
          <FaTimes />
        </button>
        <h2 className="text-xl font-semibold text-blue-600 mb-4">{title}</h2>
        <div className="text-neo-text">{children}</div>
      </div>
    </div>
  );
};

// PropTypes validation for Modal component
Modal.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Modal;
