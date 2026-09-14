import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  TrendingUp,
  MapPin,
  Truck,
  AlertCircle,
  Minus,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import T from "../components/common/T";
import useT from "../hooks/useT";
import useMarketRegion from "../hooks/useMarketRegion";
import PageTitle from "../components/PageTitle";
import Breadcrumb from "../components/common/Breadcrumb";
import NotFound from "../components/NotFound";
import { PageSkeleton } from "../components/common/SkeletonLoading";
import marketIntelligenceService from "../services/marketIntelligenceService";
import { getCommodityBySlug, getRelatedCommodities, regions } from "../data/commodityCatalog";
import {
  resolveCommodity,
  getTimingSignal,
  getRegionalPrices,
  formatCedi,
  formatMonths,
} from "../utils/marketInsights";
import { TrendBadge, DemandDot } from "../components/Market/MarketBadges";
import { TIMING_TONES } from "../components/Market/timingTones";
import PriceTrendChart from "../components/Market/PriceTrendChart";
import CartDrawer from "../components/Market/CartDrawer";
import MarketCartButton from "../components/Market/MarketCartButton";
import { useMarketCart } from "../contexts/MarketCartContext";
import { buildWhatsAppOrderUrl, canPlaceOrder } from "../utils/marketOrder";

/**
 * One commodity, in full.
 *
 * This is the authoritative surface: everything the quick view deliberately
 * leaves out — the price history proper, the seasonal calendar, how the price
 * differs at every market centre, and what that means for when to sell — is
 * here, and it is where a card click lands.
 */

const Section = ({ title, children, className = "" }) => (
  <section className={`bg-neo-surface rounded-2xl border border-neo-border/50 p-5 sm:p-6 ${className}`}>
    <h2 className="text-xs font-semibold text-neo-muted uppercase tracking-wide mb-4">
      <T>{title}</T>
    </h2>
    {children}
  </section>
);

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
};

const Stat = ({ label, value, tone = "text-neo-text" }) => (
  <div className="bg-neo-bg-soft rounded-xl px-3 py-2.5">
    <p className="text-[10px] font-semibold text-neo-muted uppercase tracking-wide">
      <T>{label}</T>
    </p>
    <p className={`text-base sm:text-lg font-bold mt-0.5 ${tone}`}>{value}</p>
  </div>
);

Stat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  tone: PropTypes.string,
};

const CommodityDetail = () => {
  const { slug } = useParams();
  const { t } = useT();
  const [selectedRegion, setSelectedRegion] = useMarketRegion();
  const [quantity, setQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const { add } = useMarketCart();

  const commodity = getCommodityBySlug(slug);

  useEffect(() => {
    marketIntelligenceService.init().finally(() => setLoading(false));
  }, []);

  // Quantity is per-commodity; landing on a new page should not inherit the
  // count the reader picked on the last one.
  useEffect(() => setQuantity(1), [slug]);

  const resolved = useMemo(
    () => (loading || !commodity ? null : resolveCommodity(commodity, marketIntelligenceService, selectedRegion)),
    [loading, commodity, selectedRegion]
  );

  if (!commodity) return <NotFound />;

  if (loading || !resolved) {
    return (
      <>
        <PageTitle title={commodity.name} />
        <div className="neo-page min-h-screen">
          <PageSkeleton />
        </div>
      </>
    );
  }

  const { market, trend, series, change, basePrice, price } = resolved;
  const currentMonth = new Date().getMonth() + 1;
  const timing = getTimingSignal(trend, currentMonth);
  const tone = TIMING_TONES[timing.tone];
  const regionalPrices = getRegionalPrices(basePrice, marketIntelligenceService.marketCenters);
  const related = getRelatedCommodities(commodity);
  const average = series ? series.reduce((sum, value) => sum + value, 0) / series.length : null;
  const lineTotal = (price ?? 0) * quantity;

  const handleAddToCart = () => {
    add(commodity, price ?? basePrice, market?.unit, quantity);
    toast.success(`${quantity} × ${commodity.name} added to cart`);
  };

  const directOrderUrl = buildWhatsAppOrderUrl(
    [
      {
        name: commodity.name,
        qty: quantity,
        unit: market?.unit || "per bag",
        price: price ?? 0,
      },
    ],
    selectedRegion
  );

  return (
    <>
      <PageTitle title={`${commodity.name} - Market Price & Trend`} />
      <div className="neo-page min-h-screen pt-32 md:pt-36">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb label={commodity.name} parent="Market Intelligence" parentPath="/market-page" />

          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              to="/market-page"
              className="inline-flex items-center gap-2 text-sm font-medium text-neo-muted hover:text-neo-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <T>All commodities</T>
            </Link>
            <MarketCartButton onClick={() => setShowCart(true)} />
          </div>

          {/* Hero */}
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5 mb-5">
            <div className="bg-neo-surface rounded-2xl border border-neo-border/50 overflow-hidden">
              <div className="grid sm:grid-cols-2">
                <img
                  src={commodity.image}
                  alt={commodity.name}
                  className="w-full h-56 sm:h-full object-cover"
                />
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-semibold text-neo-muted uppercase tracking-wide mb-2">
                    {commodity.category}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-neo-text tracking-tight mb-2">
                    {commodity.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <TrendBadge trend={market?.trend} />
                    {market && <DemandDot demand={market.demand} />}
                  </div>
                  <p className="text-sm text-neo-text/80 leading-relaxed">{commodity.about}</p>
                </div>
              </div>
            </div>

            {/* Order panel */}
            <div className="bg-neo-surface rounded-2xl border border-neo-border/50 p-5 sm:p-6 flex flex-col">
              <label
                htmlFor="detail-region"
                className="block text-xs font-semibold text-neo-muted uppercase tracking-wide mb-1"
              >
                <T>Price for</T>
              </label>
              <select
                id="detail-region"
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="w-full px-3 py-2.5 mb-4 bg-neo-bg-soft border border-neo-border rounded-lg text-sm font-medium text-neo-text focus:ring-2 focus:ring-neo-focus focus:border-neo-focus transition-all"
              >
                <option value="">{t("National Average")}</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              {price != null ? (
                <>
                  <p className="text-4xl font-bold text-neo-text leading-none">{formatCedi(price)}</p>
                  <p className="text-sm text-neo-muted mt-1 mb-5">
                    {market?.unit || "per bag"}
                    {selectedRegion && basePrice !== price && (
                      <span className="ml-1">
                        ({price > basePrice ? "+" : ""}
                        {(((price - basePrice) / basePrice) * 100).toFixed(0)}% <T>vs national</T>)
                      </span>
                    )}
                  </p>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-semibold text-neo-muted uppercase tracking-wide">
                      <T>Quantity</T>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        aria-label="Reduce quantity"
                        className="w-8 h-8 rounded-lg bg-neo-bg-soft border border-neo-border flex items-center justify-center text-neo-muted hover:text-neo-text transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-neo-text">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        aria-label="Increase quantity"
                        className="w-8 h-8 rounded-lg bg-neo-bg-soft border border-neo-border flex items-center justify-center text-neo-muted hover:text-neo-text transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="ml-auto text-sm font-bold text-neo-text">{formatCedi(lineTotal)}</span>
                  </div>

                  <div className="mt-auto space-y-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 bg-neo-accent hover:bg-neo-accent-strong text-neo-on-accent font-semibold py-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <T>Add to cart</T>
                    </button>
                    {canPlaceOrder && directOrderUrl && (
                      <a
                        href={directOrderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 border border-neo-border hover:border-neo-accent hover:text-neo-accent text-neo-text font-semibold py-3 rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <T>Order this on WhatsApp</T>
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2 bg-neo-warning/10 border border-neo-warning/30 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-neo-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-neo-text/80">
                    <T>No price is published for this commodity yet.</T>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Price trend */}
            {series && (
              <Section title="6-Month Price Trend" className="lg:col-span-2">
                <PriceTrendChart series={series} currentMonth={currentMonth} average={average} />
                {change && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
                    <Stat label="Current" value={formatCedi(change.last)} />
                    <Stat
                      label="6-month change"
                      value={`${change.delta >= 0 ? "+" : "−"}${formatCedi(Math.abs(change.delta))}`}
                      tone={change.direction === "down" ? "text-neo-danger" : "text-neo-accent"}
                    />
                    <Stat label="Period high" value={formatCedi(change.high)} />
                    <Stat label="Period low" value={formatCedi(change.low)} />
                  </div>
                )}
                <p className="text-xs text-neo-muted mt-3">
                  <T>
                    National average price per unit, over the six months ending this month. Regional
                    prices apply each market centre&apos;s premium to this line.
                  </T>
                </p>
              </Section>
            )}

            {/* Market timing */}
            <Section title="Market Timing">
              <div className={`rounded-xl border px-4 py-3.5 mb-4 ${tone.wrapper}`}>
                <p className={`text-sm font-semibold ${tone.title}`}>
                  <T>{timing.title}</T>
                </p>
                <p className={`text-xs mt-1 ${tone.detail}`}>
                  <T>{timing.detail}</T>
                </p>
              </div>
              {trend ? (
                <>
                  <p className="text-sm text-neo-text/85 leading-relaxed mb-4">{trend.seasonal_pattern}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neo-accent/10 border border-neo-accent/25 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-neo-accent uppercase tracking-wide mb-1">
                        <T>Peak months</T>
                      </p>
                      <p className="text-sm font-medium text-neo-text">{formatMonths(trend.peak_months)}</p>
                    </div>
                    <div className="bg-neo-warning/10 border border-neo-warning/25 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-neo-warning uppercase tracking-wide mb-1">
                        <T>Low months</T>
                      </p>
                      <p className="text-sm font-medium text-neo-text">{formatMonths(trend.low_months)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neo-muted">
                  <T>No seasonal history is published for this commodity yet.</T>
                </p>
              )}
            </Section>

            {/* Regional comparison */}
            <Section title="Price by Market Centre">
              {regionalPrices.length > 0 ? (
                <div className="space-y-2">
                  {regionalPrices.map((row) => {
                    const isSelected = row.region === selectedRegion;
                    return (
                      <button
                        key={row.region}
                        type="button"
                        onClick={() => setSelectedRegion(isSelected ? "" : row.region)}
                        className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
                          isSelected
                            ? "bg-neo-accent/10 border-neo-accent/40"
                            : "bg-neo-bg-soft border-transparent hover:border-neo-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neo-text">
                            <MapPin className="w-3.5 h-3.5 text-neo-muted" />
                            {row.region}
                          </span>
                          <span className="text-sm font-bold text-neo-text">{formatCedi(row.price)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <span className="text-[11px] text-neo-muted truncate">
                            {row.majorMarkets.join(" · ")}
                          </span>
                          <span
                            className={`text-[11px] font-semibold flex-shrink-0 ${
                              row.premiumPct >= 0 ? "text-neo-accent" : "text-neo-danger"
                            }`}
                          >
                            {row.premiumPct >= 0 ? "+" : ""}
                            {row.premiumPct.toFixed(0)}%
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-neo-muted mt-1 capitalize">
                          <Truck className="w-3 h-3" />
                          {row.transportAccess} transport access
                        </span>
                      </button>
                    );
                  })}
                  <p className="text-xs text-neo-muted pt-1">
                    <T>Select a centre to price the whole market against it.</T>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neo-muted">
                  <T>No market centre pricing is available.</T>
                </p>
              )}
            </Section>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-5">
              <h2 className="text-xs font-semibold text-neo-muted uppercase tracking-wide mb-3">
                <T>More in</T> {commodity.category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {related.map((item) => {
                  const itemMarket = marketIntelligenceService.getCurrentPrice(item.commoditySlug);
                  return (
                    <Link
                      key={item.slug}
                      to={`/market-page/${item.slug}`}
                      className="group bg-neo-surface rounded-xl border border-neo-border/50 hover:border-neo-accent/50 overflow-hidden transition-colors"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-neo-bg">
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-neo-text truncate">{item.name}</p>
                        <p className="text-xs text-neo-muted mt-0.5">
                          {itemMarket ? formatCedi(itemMarket.price) : "—"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* A quiet pointer back to the wider market */}
          <Link
            to="/market-page"
            className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-neo-muted hover:text-neo-accent transition-colors py-4"
          >
            <TrendingUp className="w-4 h-4" />
            <T>Browse all commodity prices</T>
          </Link>
        </div>
      </div>

      {showCart && <CartDrawer region={selectedRegion} onClose={() => setShowCart(false)} />}
    </>
  );
};

export default CommodityDetail;
