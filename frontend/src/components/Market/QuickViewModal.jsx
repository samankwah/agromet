import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { X, ShoppingCart, ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import T from "../common/T";
import MiniAreaChart from "./MiniAreaChart";
import { TrendBadge, DemandDot } from "./MarketBadges";
import { TIMING_TONES } from "./timingTones";
import { formatCedi, getTimingSignal } from "../../utils/marketInsights";

/**
 * The lightweight intelligence layer.
 *
 * This is a glance, not a report: enough to decide whether to buy now or go
 * and read properly, and nothing more. The seasonal calendar, the regional
 * comparison and the full price history all live on the commodity page, and
 * the link at the bottom is how you get there. If something new wants to be
 * added here, it almost certainly belongs on that page instead.
 */

const QuickViewModal = ({ resolved, region, onClose, onAddToCart }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    // The grid behind keeps its scroll position instead of drifting to the top.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (!resolved) return null;

  const { commodity, market, trend, series, change, basePrice, price } = resolved;
  const timing = getTimingSignal(trend, new Date().getMonth() + 1);
  const tone = TIMING_TONES[timing.tone];
  const showRegional = Boolean(region) && price != null && price !== basePrice;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-neo-surface rounded-2xl border border-neo-border/50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-neo-surface border-b border-neo-border/40 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={commodity.image}
              alt=""
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h2 id="quick-view-title" className="font-semibold text-neo-text truncate">
                {commodity.name}
              </h2>
              <p className="text-xs text-neo-muted">{commodity.category}</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="p-1.5 rounded-lg text-neo-muted hover:bg-neo-surface-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Price */}
          <div className={`grid gap-3 ${showRegional ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="bg-neo-bg-soft rounded-xl p-3">
              <p className="text-[10px] font-semibold text-neo-muted uppercase tracking-wide mb-1">
                <T>National</T>
              </p>
              <p className="text-2xl font-bold text-neo-text leading-none">{formatCedi(basePrice)}</p>
              <p className="text-[11px] text-neo-muted mt-1">{market?.unit || "per bag"}</p>
            </div>
            {showRegional && (
              <div className="bg-neo-teal/10 border border-neo-teal/25 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-neo-teal uppercase tracking-wide mb-1 truncate">
                  {region}
                </p>
                <p className="text-2xl font-bold text-neo-text leading-none">{formatCedi(price)}</p>
                <p className="text-[11px] text-neo-muted mt-1">
                  {price > basePrice ? "+" : ""}
                  {(((price - basePrice) / basePrice) * 100).toFixed(0)}% <T>vs national</T>
                </p>
              </div>
            )}
          </div>

          {/* Six-month movement */}
          {series && change && (
            <div className="flex items-center justify-between gap-3 bg-neo-bg-soft rounded-xl px-3 py-2.5">
              <div>
                <p className="text-[10px] font-semibold text-neo-muted uppercase tracking-wide">
                  <T>6-month change</T>
                </p>
                <p
                  className={`inline-flex items-center gap-1 text-sm font-semibold mt-0.5 ${
                    change.direction === "down" ? "text-neo-danger" : "text-neo-accent"
                  }`}
                >
                  {change.direction === "down" ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                  {change.delta >= 0 ? "+" : "−"}
                  {formatCedi(Math.abs(change.delta))}
                  <span className="text-neo-muted font-normal">
                    ({change.pct >= 0 ? "+" : ""}
                    {change.pct.toFixed(1)}%)
                  </span>
                </p>
              </div>
              <MiniAreaChart data={series} width={104} height={38} />
            </div>
          )}

          {/* Standing */}
          <div className="flex items-center gap-2 flex-wrap">
            <TrendBadge trend={market?.trend} />
            {market && <DemandDot demand={market.demand} />}
          </div>

          {/* One-line verdict */}
          <div className={`rounded-xl border px-3 py-2.5 ${tone.wrapper}`}>
            <p className={`text-sm font-semibold ${tone.title}`}>
              <T>{timing.title}</T>
            </p>
            <p className={`text-xs mt-0.5 ${tone.detail}`}>
              <T>{timing.detail}</T>
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-neo-surface border-t border-neo-border/40 px-5 py-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onAddToCart(commodity, price ?? basePrice, market?.unit);
              onClose();
            }}
            disabled={price == null}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-neo-on-accent bg-neo-accent hover:bg-neo-accent-strong disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus"
          >
            <ShoppingCart className="w-4 h-4" />
            <T>Add to cart</T>
          </button>
          <Link
            to={`/market-page/${commodity.slug}`}
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-neo-text border border-neo-border hover:border-neo-accent hover:text-neo-accent rounded-xl py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus"
          >
            <T>Full analysis</T>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

QuickViewModal.propTypes = {
  resolved: PropTypes.object,
  region: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
};

export default QuickViewModal;
