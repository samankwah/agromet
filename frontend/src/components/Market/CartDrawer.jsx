import { useEffect } from "react";
import PropTypes from "prop-types";
import { ShoppingCart, X, Package, Phone, MessageCircle, AlertCircle } from "lucide-react";
import T from "../common/T";
import { useMarketCart } from "../../contexts/MarketCartContext";
import { formatCedi } from "../../utils/marketInsights";
import { buildWhatsAppOrderUrl, buildCallUrl, canPlaceOrder } from "../../utils/marketOrder";

/**
 * The cart, as a slide-in drawer.
 *
 * Contents come from MarketCartContext rather than props, so the same drawer
 * works from the grid and from a commodity page without either of them having
 * to own the cart.
 */

const CartDrawer = ({ region, onClose }) => {
  const { items, updateQty, remove, total, count } = useMarketCart();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const whatsAppUrl = buildWhatsAppOrderUrl(items, region);
  const callUrl = buildCallUrl();

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-end" role="dialog" aria-modal="true" aria-label="Cart">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm h-full bg-neo-surface shadow-2xl flex flex-col">
        <div className="border-b border-neo-border/50 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-neo-text" />
            <h2 className="text-lg font-bold text-neo-text">
              <T>Cart</T>
            </h2>
            <span className="bg-neo-accent/15 text-neo-accent text-xs font-semibold px-2 py-0.5 rounded-full">
              {count}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="p-1.5 rounded-lg text-neo-muted hover:bg-neo-surface-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-neo-muted mx-auto mb-3" />
              <p className="text-neo-muted text-sm">
                <T>Your cart is empty</T>
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.slug} className="flex gap-3 bg-neo-bg-soft rounded-xl p-3">
                <img src={item.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neo-text truncate">{item.name}</p>
                  <p className="text-xs text-neo-muted">
                    {formatCedi(item.price)} {item.unit}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => updateQty(item.slug, item.qty - 1)}
                      aria-label={`Reduce ${item.name} quantity`}
                      className="w-6 h-6 rounded-md bg-neo-surface border border-neo-border flex items-center justify-center text-neo-muted hover:bg-neo-surface-strong text-xs font-bold"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold text-neo-text w-6 text-center">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.slug, item.qty + 1)}
                      aria-label={`Increase ${item.name} quantity`}
                      className="w-6 h-6 rounded-md bg-neo-surface border border-neo-border flex items-center justify-center text-neo-muted hover:bg-neo-surface-strong text-xs font-bold"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.slug)}
                      className="ml-auto text-xs text-neo-danger/80 hover:text-neo-danger"
                    >
                      <T>Remove</T>
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-neo-text whitespace-nowrap">
                  {formatCedi(item.price * item.qty)}
                </p>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neo-border/50 px-4 sm:px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neo-muted">
                <T>Subtotal</T> ({count} <T>items</T>)
              </span>
              <span className="font-bold text-neo-text">{formatCedi(total)}</span>
            </div>
            {region && (
              <p className="text-xs text-neo-muted">Prices reflect {region} market rates</p>
            )}

            {canPlaceOrder ? (
              <>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-neo-accent hover:bg-neo-accent-strong text-neo-on-accent font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <T>Place order on WhatsApp</T>
                </a>
                {callUrl && (
                  <a
                    href={callUrl}
                    className="w-full border border-neo-border hover:border-neo-accent hover:text-neo-accent text-neo-text font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <T>Call to order</T>
                  </a>
                )}
              </>
            ) : (
              /* Better an honest notice than a button that opens an empty
                 WhatsApp compose window, which is what shipped before. */
              <div className="flex items-start gap-2 bg-neo-warning/10 border border-neo-warning/30 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-neo-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neo-text/80">
                  <T>
                    No order desk is configured yet. Set VITE_MARKET_WHATSAPP to enable ordering.
                  </T>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

CartDrawer.propTypes = {
  region: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default CartDrawer;
