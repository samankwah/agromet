import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import T from "../common/T";
import useT from "../../hooks/useT";
import useMarketRegion from "../../hooks/useMarketRegion";
import PageTitle from "../PageTitle";
import Breadcrumb from "../common/Breadcrumb";
import { PageSkeleton } from "../common/SkeletonLoading";
import marketIntelligenceService from "../../services/marketIntelligenceService";
import { commodities, categories, regions } from "../../data/commodityCatalog";
import { resolveCommodity } from "../../utils/marketInsights";
import { useMarketCart } from "../../contexts/MarketCartContext";
import CommodityCard from "./CommodityCard";
import QuickViewModal from "./QuickViewModal";
import CartDrawer from "./CartDrawer";
import MarketCartButton from "./MarketCartButton";

/**
 * The market grid.
 *
 * This page is now only a grid and its filters. The intelligence that used to
 * live in a slide-in drawer here is split between QuickViewModal (a glance)
 * and pages/CommodityDetail (the deep-dive a card navigates to).
 */

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegion, setSelectedRegion] = useMarketRegion();
  const [quickViewSlug, setQuickViewSlug] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useT();
  const { add } = useMarketCart();

  useEffect(() => {
    marketIntelligenceService.init().finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (commodity, price, unit) => {
    add(commodity, price, unit);
    toast.success(`${commodity.name} added to cart`);
  };

  const filteredCommodities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return commodities.filter((commodity) => {
      const matchesSearch =
        !term ||
        commodity.name.toLowerCase().includes(term) ||
        commodity.description.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === "All" || commodity.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Resolved once per render pass rather than per card, so the price, trend
  // and regional adjustment are derived in one place for both the grid and
  // the quick view.
  const resolvedBySlug = useMemo(() => {
    if (loading) return {};
    return Object.fromEntries(
      commodities.map((commodity) => [
        commodity.slug,
        resolveCommodity(commodity, marketIntelligenceService, selectedRegion),
      ])
    );
  }, [loading, selectedRegion]);

  const risingCount = Object.values(marketIntelligenceService.currentPrices).filter(
    (price) => price.trend === "rising"
  ).length;
  const highDemandCount = Object.values(marketIntelligenceService.currentPrices).filter(
    (price) => price.demand === "high" || price.demand === "very-high"
  ).length;

  if (loading) {
    return (
      <>
        <PageTitle title="Agricultural Market" />
        <div className="neo-page min-h-screen">
          <PageSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Agricultural Market" />
      <div className="neo-page min-h-screen pt-32 md:pt-36 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <Breadcrumb />

          <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
            <div className="min-w-0">
              <span className="inline-block px-3 py-1 rounded-full bg-neo-accent/12 text-neo-accent text-xs font-semibold uppercase tracking-wider mb-3">
                <T>Market Intelligence</T>
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold text-neo-text tracking-tight mb-3">
                <T>Agricultural</T>{" "}
                <span className="bg-gradient-to-r from-neo-accent to-neo-teal bg-clip-text text-transparent">
                  <T>Market</T>
                </span>
              </h1>
              <p className="text-neo-muted text-base sm:text-lg">
                <T>Real-time commodity prices, market trends, and selling insights across Ghana</T>
              </p>
            </div>
            <MarketCartButton onClick={() => setShowCart(true)} />
          </div>

          {/* Market summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <div className="bg-neo-surface rounded-xl border border-neo-border/50 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-semibold text-neo-muted uppercase tracking-wide">
                <T>Commodities</T>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-neo-text mt-1">
                {Object.keys(marketIntelligenceService.currentPrices).length}
              </p>
            </div>
            <div className="bg-neo-surface rounded-xl border border-neo-border/50 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-semibold text-neo-muted uppercase tracking-wide">
                <T>Prices Rising</T>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-neo-accent mt-1">{risingCount}</p>
            </div>
            <div className="bg-neo-surface rounded-xl border border-neo-border/50 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-semibold text-neo-muted uppercase tracking-wide">
                <T>High Demand</T>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-neo-warning mt-1">{highDemandCount}</p>
            </div>
            <div className="bg-neo-surface rounded-xl border border-neo-border/50 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-semibold text-neo-muted uppercase tracking-wide">
                <T>Market Centers</T>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-neo-teal mt-1">
                {Object.keys(marketIntelligenceService.marketCenters).length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-neo-surface rounded-xl border border-neo-border/50 px-4 sm:px-6 py-4 sm:py-5 mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="col-span-2 lg:col-span-1">
                <label
                  htmlFor="market-search"
                  className="block text-xs font-semibold text-neo-muted uppercase tracking-wide mb-1"
                >
                  <T>Search</T>
                </label>
                <div className="relative">
                  <input
                    id="market-search"
                    type="text"
                    placeholder={t("Search commodities...")}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full px-3 py-2.5 pl-10 bg-neo-bg-soft border border-neo-border rounded-lg text-sm font-medium text-neo-text focus:ring-2 focus:ring-neo-focus focus:border-neo-focus focus:bg-neo-surface-strong transition-all"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-neo-muted" />
                </div>
              </div>
              <div>
                <label
                  htmlFor="market-category"
                  className="block text-xs font-semibold text-neo-muted uppercase tracking-wide mb-1"
                >
                  <T>Category</T>
                </label>
                <select
                  id="market-category"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full px-3 py-2.5 bg-neo-bg-soft border border-neo-border rounded-lg text-sm font-medium text-neo-text focus:ring-2 focus:ring-neo-focus focus:border-neo-focus focus:bg-neo-surface-strong transition-all"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="market-region"
                  className="block text-xs font-semibold text-neo-muted uppercase tracking-wide mb-1"
                >
                  <T>Region</T>
                </label>
                <select
                  id="market-region"
                  value={selectedRegion}
                  onChange={(event) => setSelectedRegion(event.target.value)}
                  className="w-full px-3 py-2.5 bg-neo-bg-soft border border-neo-border rounded-lg text-sm font-medium text-neo-text focus:ring-2 focus:ring-neo-focus focus:border-neo-focus focus:bg-neo-surface-strong transition-all"
                >
                  <option value="">{t("National Average")}</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <p className="text-sm text-neo-muted mb-4">
            Showing <span className="font-semibold text-neo-text">{filteredCommodities.length}</span>{" "}
            commodities
            {selectedCategory !== "All" && (
              <span>
                {" "}
                in <span className="font-medium">{selectedCategory}</span>
              </span>
            )}
            {selectedRegion && (
              <span>
                {" "}
                &middot; <span className="font-medium">{selectedRegion}</span> pricing
              </span>
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredCommodities.map((commodity) => {
              const resolved = resolvedBySlug[commodity.slug];
              return (
                <CommodityCard
                  key={commodity.slug}
                  commodity={commodity}
                  marketData={resolved?.market ? { ...resolved.market, price: resolved.price } : null}
                  series={resolved?.series}
                  change={resolved?.change}
                  onQuickView={() => setQuickViewSlug(commodity.slug)}
                />
              );
            })}
          </div>

          {filteredCommodities.length === 0 && (
            <div className="text-center py-16">
              <p className="text-neo-muted text-lg">
                <T>No commodities found matching your search.</T>
              </p>
            </div>
          )}
        </div>
      </div>

      {quickViewSlug && (
        <QuickViewModal
          resolved={resolvedBySlug[quickViewSlug]}
          region={selectedRegion}
          onClose={() => setQuickViewSlug(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showCart && <CartDrawer region={selectedRegion} onClose={() => setShowCart(false)} />}
    </>
  );
};

export default Marketplace;
