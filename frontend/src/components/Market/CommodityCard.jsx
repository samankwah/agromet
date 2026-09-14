import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";
import T from "../common/T";
import MiniAreaChart from "./MiniAreaChart";
import { TrendBadge } from "./MarketBadges";
import { formatCedi } from "../../utils/marketInsights";

/**
 * One commodity in the market grid.
 *
 * The card has exactly two jobs, and nothing else competes with them:
 *
 *   the card itself  -> the commodity page, the authoritative deep-dive
 *   the eye button   -> the quick view, a glance that keeps you on the grid
 *
 * Everything that used to crowd this card — the description, the demand dot,
 * and a pair of equally-weighted "Insight" / "Add" buttons — moved to whichever
 * of those two surfaces it belongs on. Buying happens where the price has been
 * explained, not from a thumbnail.
 */

const CommodityCard = ({ commodity, marketData, series, change, onQuickView }) => {
  const price = marketData?.price;
  const unit = marketData?.unit || "per bag";

  return (
    <div className="group relative bg-neo-surface rounded-xl border border-neo-border/50 hover:border-neo-border hover:shadow-lg transition-all duration-200">
      <Link
        to={`/market-page/${commodity.slug}`}
        className="block rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-neo-bg">
          <img
            src={commodity.image}
            alt={commodity.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {marketData && (
            <div className="absolute top-3 left-3">
              <TrendBadge trend={marketData.trend} />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold text-neo-text leading-tight mb-2">{commodity.name}</h3>

          {price ? (
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-bold text-neo-text leading-none">{formatCedi(price)}</p>
                <p className="text-[11px] text-neo-muted mt-1">{unit}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <MiniAreaChart data={series} />
                {change && change.direction !== "flat" && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                      change.direction === "up" ? "text-neo-accent" : "text-neo-danger"
                    }`}
                  >
                    {change.direction === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {change.pct >= 0 ? "+" : ""}
                    {change.pct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neo-muted italic">
              <T>Price unavailable</T>
            </p>
          )}
        </div>
      </Link>

      {/* Sits above the link rather than inside it, so a click here never
          navigates and no anchor ends up nested in another anchor. */}
      <button
        type="button"
        onClick={() => onQuickView(commodity)}
        aria-label={`Quick view of ${commodity.name} prices`}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-neo-surface/90 border border-neo-border/60 text-neo-muted backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus hover:text-neo-accent hover:border-neo-accent/50 transition-all max-md:opacity-100"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
};

CommodityCard.propTypes = {
  commodity: PropTypes.object.isRequired,
  marketData: PropTypes.object,
  series: PropTypes.arrayOf(PropTypes.number),
  change: PropTypes.object,
  onQuickView: PropTypes.func.isRequired,
};

export default CommodityCard;
