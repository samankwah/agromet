import PropTypes from "prop-types";
import { ShoppingCart } from "lucide-react";
import { useMarketCart } from "../../contexts/MarketCartContext";

/** The cart button and its count badge, shared by the grid and commodity pages. */
const MarketCartButton = ({ onClick }) => {
  const { count } = useMarketCart();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
      className="relative flex-shrink-0 flex items-center gap-2 bg-neo-surface border border-neo-border hover:border-neo-accent hover:text-neo-accent rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus"
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-neo-accent text-neo-on-accent text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
};

MarketCartButton.propTypes = { onClick: PropTypes.func.isRequired };

export default MarketCartButton;
