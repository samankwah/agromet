import { useState, useMemo, useEffect } from "react";
import T from "./common/T";
import useT from "../hooks/useT";
import { Search, TrendingUp, TrendingDown, Minus, BarChart3, ShoppingCart, X, ChevronRight, ArrowUpRight, ArrowDownRight, Info, Plus, Phone, MessageCircle, Package } from "lucide-react";
import PropTypes from "prop-types";
import PageTitle from "./PageTitle";
import Breadcrumb from "./common/Breadcrumb";
import { PageSkeleton } from "./common/SkeletonLoading";
import toast from "react-hot-toast";
import marketIntelligenceService from "../services/marketIntelligenceService";
import YellowMaizeImage from "../assets/images/yellow maize.jpg";
import WhiteMaizeImage from "../assets/images/white maize.png";
import YellowSoyaImage from "../assets/images/yellow soya.jpg";
import Yam from "../assets/images/yam.jpg";
import Tomato from "../assets/images/tomatoes.jpg";
import Rice from "../assets/images/rice.jpg";
import Pepper from "../assets/images/pepper.jpg";
import Pepper2 from "../assets/images/pepper2.jpg";
import Pepper3 from "../assets/images/pepper3.jpg";
import Onion from "../assets/images/onion.jpg";
import Onion2 from "../assets/images/onion2.png";
import Onion3 from "../assets/images/onion3.jpg";
import LiveChicken from "../assets/images/live chicken.jpg";
import DressedChicken from "../assets/images/dressed chicken.png";
import Beans from "../assets/images/beans.jpg";
import Plantain from "../assets/images/plantain.png";
import Cassava from "../assets/images/cassava.jpg";
import Sorghum from "../assets/images/sorghum.jpg";

const commodities = [
  { id: 1, name: "Yellow Maize", slug: "yellow-maize", category: "Maize", image: YellowMaizeImage, description: "Premium quality yellow maize" },
  { id: 2, name: "White Maize", slug: "white-maize", category: "Maize", image: WhiteMaizeImage, description: "High-grade white maize" },
  { id: 3, name: "Yellow Soybeans", slug: "soybeans", category: "Soybeans", image: YellowSoyaImage, description: "Fresh yellow soybeans" },
  { id: 4, name: "Yam", slug: "yam", category: "Yam", image: Yam, description: "Puna yam" },
  { id: 5, name: "Tomatoes", slug: "tomatoes", category: "Tomatoes", image: Tomato, description: "Fresh tomatoes" },
  { id: 6, name: "Rice", slug: "rice", category: "Rice", image: Rice, description: "Jasmine rice" },
  { id: 7, name: "Black Cobra Pepper", slug: "pepper", category: "Pepper", image: Pepper, description: "Black Cobra pepper" },
  { id: 8, name: "Anaheim Pepper", slug: "pepper", category: "Pepper", image: Pepper2, description: "Anaheim pepper" },
  { id: 9, name: "Aleppo Pepper", slug: "pepper", category: "Pepper", image: Pepper3, description: "Aleppo pepper" },
  { id: 10, name: "Red Onion", slug: "onion", category: "Onion", image: Onion, description: "Purple/Red onion" },
  { id: 11, name: "White Onion", slug: "onion", category: "Onion", image: Onion2, description: "White onion" },
  { id: 12, name: "Yellow Onion", slug: "onion", category: "Onion", image: Onion3, description: "Yellow onions" },
  { id: 13, name: "Dressed Chicken", slug: "poultry", category: "Poultry", image: DressedChicken, description: "Dressed chicken meat" },
  { id: 14, name: "Live Chicken", slug: "poultry", category: "Poultry", image: LiveChicken, description: "Live broiler chicken" },
  { id: 15, name: "Beans", slug: "beans", category: "Beans", image: Beans, description: "Premium beans" },
  { id: 16, name: "Plantain", slug: "plantain", category: "Plantain", image: Plantain, description: "Fresh Apem plantain" },
  { id: 17, name: "Cassava", slug: "cassava", category: "Cassava", image: Cassava, description: "Esi Abaaya cassava" },
  { id: 18, name: "Sorghum", slug: "sorghum", category: "Sorghum", image: Sorghum, description: "Premium Kapala sorghum" },
];

const categories = ["All", "Maize", "Soybeans", "Onion", "Pepper", "Poultry", "Tomatoes", "Yam", "Rice", "Beans", "Cassava", "Plantain", "Sorghum"];

// ─── Chart Components ───────────────────────────────────────────────────────

const MiniAreaChart = ({ data }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 88;
  const h = 32;
  const pad = 2;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));

  const linePoints = pts.map(p => `${p.x},${p.y}`).join(" ");
  const areaPoints = `${pts[0].x},${h} ${linePoints} ${pts[pts.length - 1].x},${h}`;
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? "#16a34a" : "#dc2626";
  const fillColor = isUp ? "#16a34a15" : "#dc262615";

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polygon fill={fillColor} points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={linePoints} />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
};
MiniAreaChart.propTypes = { data: PropTypes.array };

const FullPriceChart = ({ data, currentMonth }) => {
  if (!data || data.length < 2) return null;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="space-y-2">
      {/* Chart area */}
      <div className="relative h-36 flex items-end gap-2 px-1">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[9px] text-gray-400">
          <span>GH&#8373;{max.toFixed(0)}</span>
          <span>GH&#8373;{((max + min) / 2).toFixed(0)}</span>
          <span>GH&#8373;{min.toFixed(0)}</span>
        </div>
        {/* Bars */}
        <div className="flex-1 ml-11 flex items-end gap-1.5 h-full pb-6">
          {data.map((val, i) => {
            const pct = ((val - min) / range) * 100;
            const barHeight = Math.max(pct * 0.85, 6);
            const isLast = i === data.length - 1;
            const monthIdx = (currentMonth - data.length + i + 12) % 12;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  GH&#8373;{val.toFixed(2)}
                </div>
                <div
                  className={`w-full rounded-t-sm transition-all duration-200 ${isLast ? "bg-blue-500 group-hover:bg-blue-600" : "bg-gray-200 group-hover:bg-gray-300"}`}
                  style={{ height: `${barHeight}%` }}
                />
                <span className={`text-[10px] ${isLast ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                  {monthNames[monthIdx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Change indicator */}
      <div className="ml-11 flex items-center gap-2 text-xs">
        {data[data.length - 1] >= data[0] ? (
          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +GH&#8373;{(data[data.length - 1] - data[0]).toFixed(2)} over 6 months
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            -GH&#8373;{(data[0] - data[data.length - 1]).toFixed(2)} over 6 months
          </span>
        )}
      </div>
    </div>
  );
};
FullPriceChart.propTypes = { data: PropTypes.array, currentMonth: PropTypes.number };


// ─── Badge Components ───────────────────────────────────────────────────────

const TrendIcon = ({ trend }) => {
  if (trend === "rising") return <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />;
  if (trend === "falling") return <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />;
  if (trend === "volatile") return <BarChart3 className="w-3.5 h-3.5 text-amber-500" />;
  if (trend === "seasonal") return <TrendingUp className="w-3.5 h-3.5 text-blue-500" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
};
TrendIcon.propTypes = { trend: PropTypes.string };

const TrendBadge = ({ trend }) => {
  const colors = {
    rising: "bg-green-50 text-green-700 border-green-200",
    falling: "bg-red-50 text-red-700 border-red-200",
    stable: "bg-gray-50 text-gray-600 border-gray-200",
    volatile: "bg-amber-50 text-amber-700 border-amber-200",
    seasonal: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors[trend] || colors.stable}`}>
      <TrendIcon trend={trend} />
      {trend ? trend.charAt(0).toUpperCase() + trend.slice(1) : "N/A"}
    </span>
  );
};
TrendBadge.propTypes = { trend: PropTypes.string };

const DemandDot = ({ demand }) => {
  const config = {
    "very-high": { color: "bg-red-500", label: "Very High" },
    high: { color: "bg-orange-500", label: "High" },
    moderate: { color: "bg-yellow-500", label: "Moderate" },
    low: { color: "bg-green-500", label: "Low" },
    growing: { color: "bg-blue-500", label: "Growing" },
    export: { color: "bg-purple-500", label: "Export" },
  };
  const c = config[demand] || config.moderate;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
      <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
      {c.label} demand
    </span>
  );
};
DemandDot.propTypes = { demand: PropTypes.string };


// ─── Product Card ───────────────────────────────────────────────────────────

const ProductCard = ({ product, marketData, trendData, onViewInsight, onAddToCart }) => {
  const price = marketData?.price;
  const unit = marketData?.unit || "per bag";

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 group">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img src={product.image} alt={product.name} loading="lazy" decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {marketData && (
          <div className="absolute top-3 left-3">
            <TrendBadge trend={marketData.trend} />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</h3>
          {trendData && <MiniAreaChart data={trendData["6months"]} />}
        </div>
        <p className="text-xs text-gray-500 mb-3">{product.description}</p>

        {price ? (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">GH&#8373;{price.toFixed(2)}</p>
              <p className="text-[11px] text-gray-400">{unit}</p>
            </div>
            <div className="text-right">
              {marketData && <DemandDot demand={marketData.demand} />}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic"><T>Price unavailable</T></p>
        )}

        {/* Action buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewInsight(product)}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-2 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <T>Insight</T>
          </button>
          <button
            onClick={() => onAddToCart(product)}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <T>Add</T>
          </button>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  marketData: PropTypes.object,
  trendData: PropTypes.object,
  onViewInsight: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
};


// ─── Insight Panel (slide-in) ───────────────────────────────────────────────

const InsightPanel = ({ product, marketData, trendData, region, onClose, onAddToCart }) => {
  if (!product) return null;

  const currentMonth = new Date().getMonth() + 1;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const regionInfo = region ? marketIntelligenceService.marketCenters[region] : null;
  const regionalPrice = marketData && regionInfo ? marketData.price * regionInfo.price_premium : marketData?.price;
  const isPeakMonth = trendData?.peak_months?.includes(currentMonth);
  const isLowMonth = trendData?.low_months?.includes(currentMonth);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900"><T>Price Insight</T></h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Product header */}
        <div className="px-4 sm:px-6 py-5 border-b border-gray-50">
          <div className="flex gap-3 sm:gap-4">
            <img src={product.image} alt={product.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-2 truncate">{product.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <TrendBadge trend={marketData?.trend} />
                {marketData && <DemandDot demand={marketData.demand} />}
              </div>
            </div>
          </div>
        </div>

        {/* Price cards */}
        <div className="px-4 sm:px-6 py-5 border-b border-gray-50">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"><T>National Price</T></p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">GH&#8373;{marketData?.price?.toFixed(2) || "—"}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{marketData?.unit || "per bag"}</p>
            </div>
            {regionInfo && (
              <div className="bg-blue-50 rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">{region}</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">GH&#8373;{regionalPrice?.toFixed(2) || "—"}</p>
                <p className="text-[10px] sm:text-xs text-blue-400">
                  {regionInfo.price_premium > 1 ? "+" : ""}{((regionInfo.price_premium - 1) * 100).toFixed(0)}% vs national
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 6-month trend chart */}
        {trendData?.["6months"] && (
          <div className="px-4 sm:px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4"><T>6-Month Price Trend</T></p>
            <FullPriceChart data={trendData["6months"]} currentMonth={currentMonth} />
          </div>
        )}

        {/* Timing signal */}
        <div className="px-4 sm:px-6 py-5 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3"><T>Market Timing</T></p>
          {isPeakMonth ? (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800"><T>Good time to sell</T></p>
                <p className="text-xs text-green-600 mt-0.5"><T>Peak price period. Sell now or within 2-4 weeks for best returns.</T></p>
              </div>
            </div>
          ) : isLowMonth ? (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
              <TrendingDown className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800"><T>Hold if possible</T></p>
                <p className="text-xs text-red-600 mt-0.5"><T>Prices typically lower. Store properly and wait for peak season.</T></p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
              <BarChart3 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800"><T>Moderate timing</T></p>
                <p className="text-xs text-amber-600 mt-0.5"><T>Average price period. Monitor daily prices for opportunities.</T></p>
              </div>
            </div>
          )}
        </div>

        {/* Seasonal pattern */}
        {trendData && (
          <div className="px-4 sm:px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3"><T>Seasonal Pattern</T></p>
            <p className="text-sm text-gray-700 mb-3">{trendData.seasonal_pattern}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-2.5 sm:p-3">
                <p className="text-[10px] font-semibold text-green-600 uppercase mb-1"><T>Peak Months</T></p>
                <p className="text-xs sm:text-sm font-medium text-green-800">{trendData.peak_months?.map(m => monthNames[m - 1]).join(", ")}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2.5 sm:p-3">
                <p className="text-[10px] font-semibold text-orange-600 uppercase mb-1"><T>Low Months</T></p>
                <p className="text-xs sm:text-sm font-medium text-orange-800">{trendData.low_months?.map(m => monthNames[m - 1]).join(", ")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Market centers */}
        {regionInfo && (
          <div className="px-4 sm:px-6 py-5 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3"><T>Nearby Markets</T></p>
            <div className="space-y-2">
              {regionInfo.major_markets.map((market) => (
                <div key={market} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
                  <ShoppingCart className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{market}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-1"><T>Transport access:</T> <span className="font-medium capitalize">{regionInfo.transport_access}</span></p>
            </div>
          </div>
        )}

        {/* Buy action at bottom */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-4">
          <button
            onClick={() => { onAddToCart(product); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart — GH&#8373;{(regionalPrice || marketData?.price || 0).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

InsightPanel.propTypes = {
  product: PropTypes.object,
  marketData: PropTypes.object,
  trendData: PropTypes.object,
  region: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
};


// ─── Cart Drawer ────────────────────────────────────────────────────────────

const CartDrawer = ({ cart, selectedRegion, onUpdateQty, onRemove, onClose, onCheckout }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm h-full bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900"><T>Cart</T></h2>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{cart.length}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm"><T>Your cart is empty</T></p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">GH&#8373;{item.price.toFixed(2)} {item.unit}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button onClick={() => onUpdateQty(item.id, item.qty - 1)}
                      className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold">-</button>
                    <span className="text-sm font-semibold text-gray-800 w-6 text-center">{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.id, item.qty + 1)}
                      className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold">+</button>
                    <button onClick={() => onRemove(item.id)} className="ml-auto text-xs text-red-400 hover:text-red-600"><T>Remove</T></button>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">GH&#8373;{(item.price * item.qty).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 px-4 sm:px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
              <span className="font-bold text-gray-900">GH&#8373;{total.toFixed(2)}</span>
            </div>
            {selectedRegion && (
              <p className="text-xs text-gray-400">Prices reflect {selectedRegion} market rates</p>
            )}
            <button onClick={onCheckout}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <T>Place Order via WhatsApp</T>
            </button>
            <button onClick={onCheckout}
              className="w-full border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" />
              <T>Call to Order</T>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

CartDrawer.propTypes = {
  cart: PropTypes.array.isRequired,
  selectedRegion: PropTypes.string,
  onUpdateQty: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
};


// ─── Main Marketplace ───────────────────────────────────────────────────────

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [insightProduct, setInsightProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useT();

  const regions = ["Greater Accra", "Ashanti", "Northern", "Western"];

  useEffect(() => {
    marketIntelligenceService.init().finally(() => setLoading(false));
  }, []);

  const getProductPrice = (product) => {
    const mktData = marketIntelligenceService.getCurrentPrice(product.slug);
    if (!mktData) return null;
    const regionInfo = selectedRegion ? marketIntelligenceService.marketCenters[selectedRegion] : null;
    return {
      price: regionInfo ? mktData.price * regionInfo.price_premium : mktData.price,
      unit: mktData.unit,
    };
  };

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      const priceInfo = getProductPrice(product);
      return [...prev, {
        id: product.id,
        name: product.name,
        image: product.image,
        price: priceInfo?.price || 0,
        unit: priceInfo?.unit || "per bag",
        qty: 1,
      }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleUpdateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const handleRemoveFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const lines = cart.map(item => `- ${item.name} x${item.qty} = GH\u20B5${(item.price * item.qty).toFixed(2)}`);
    const msg = `Hello, I'd like to place an order:\n\n${lines.join("\n")}\n\nTotal: GH\u20B5${total.toFixed(2)}${selectedRegion ? `\nRegion: ${selectedRegion}` : ""}\n\nPlease confirm availability.`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const filteredProducts = useMemo(() => {
    return commodities.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const insightMarketData = insightProduct ? marketIntelligenceService.getCurrentPrice(insightProduct.slug) : null;
  const insightTrendData = insightProduct ? marketIntelligenceService.historicalTrends[insightProduct.slug] : null;

  const risingCount = Object.values(marketIntelligenceService.currentPrices).filter(p => p.trend === "rising").length;
  const highDemandCount = Object.values(marketIntelligenceService.currentPrices).filter(p => p.demand === "high" || p.demand === "very-high").length;
  const cartItemCount = cart.reduce((s, i) => s + i.qty, 0);

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
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
            <div className="min-w-0">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-3">
                <T>Market Intelligence</T>
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-3">
                <T>Agricultural</T>{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  <T>Market</T>
                </span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg">
                <T>Real-time commodity prices, market trends, and selling insights across Ghana</T>
              </p>
            </div>
            {/* Cart button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative flex-shrink-0 flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm transition-colors mt-1"
            >
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700 hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Market Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide"><T>Commodities</T></p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{Object.keys(marketIntelligenceService.currentPrices).length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide"><T>Prices Rising</T></p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{risingCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide"><T>High Demand</T></p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-1">{highDemandCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide"><T>Market Centers</T></p>
              <p className="text-xl sm:text-2xl font-bold text-teal-600 mt-1">{Object.keys(marketIntelligenceService.marketCenters).length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 sm:px-6 py-4 sm:py-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-3 sm:gap-4">
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"><T>Search</T></label>
                  <div className="relative">
                    <input type="text" placeholder={t("Search commodities...")}
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all" />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"><T>Category</T></label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all">
                    {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"><T>Region</T></label>
                  <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all">
                    <option value="">{t("National Average")}</option>
                    {regions.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> commodities
              {selectedCategory !== "All" && <span> in <span className="font-medium">{selectedCategory}</span></span>}
              {selectedRegion && <span> &middot; <span className="font-medium">{selectedRegion}</span> pricing</span>}
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const mktData = marketIntelligenceService.getCurrentPrice(product.slug);
              const tData = marketIntelligenceService.historicalTrends[product.slug];
              const regionInfo = selectedRegion ? marketIntelligenceService.marketCenters[selectedRegion] : null;
              const adjustedData = mktData && regionInfo
                ? { ...mktData, price: mktData.price * regionInfo.price_premium }
                : mktData;
              return (
                <ProductCard key={product.id} product={product} marketData={adjustedData} trendData={tData}
                  onViewInsight={setInsightProduct} onAddToCart={handleAddToCart} />
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg"><T>No commodities found matching your search.</T></p>
            </div>
          )}
        </div>
      </div>

      {/* Insight panel */}
      {insightProduct && (
        <InsightPanel product={insightProduct} marketData={insightMarketData} trendData={insightTrendData}
          region={selectedRegion} onClose={() => setInsightProduct(null)} onAddToCart={handleAddToCart} />
      )}

      {/* Cart drawer */}
      {showCart && (
        <CartDrawer cart={cart} selectedRegion={selectedRegion} onUpdateQty={handleUpdateQty}
          onRemove={handleRemoveFromCart} onClose={() => setShowCart(false)} onCheckout={handleCheckout} />
      )}
    </>
  );
};

export default Marketplace;
