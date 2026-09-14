import PropTypes from "prop-types";
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, Minus } from "lucide-react";

/**
 * Status chips shared by the card, the quick view and the commodity page.
 *
 * Colour comes from the neo-* semantic tokens rather than raw Tailwind hues.
 * Tailwind's `dark:` variant is not wired up in this project — the theme is
 * switched by a data-theme attribute — so a literal `bg-green-50` would stay
 * pale green on the dark surface. The neo tokens flip with the theme.
 */

const TREND_STYLES = {
  rising: { text: "text-neo-accent", chip: "bg-neo-accent/10 text-neo-accent border-neo-accent/30" },
  falling: { text: "text-neo-danger", chip: "bg-neo-danger/10 text-neo-danger border-neo-danger/30" },
  volatile: { text: "text-neo-warning", chip: "bg-neo-warning/10 text-neo-warning border-neo-warning/30" },
  seasonal: { text: "text-neo-teal", chip: "bg-neo-teal/10 text-neo-teal border-neo-teal/30" },
  stable: { text: "text-neo-muted", chip: "bg-neo-bg-soft text-neo-muted border-neo-border/50" },
};

const trendStyle = (trend) => TREND_STYLES[trend] || TREND_STYLES.stable;

export const TrendIcon = ({ trend, className = "w-3.5 h-3.5" }) => {
  const style = trendStyle(trend);
  if (trend === "rising") return <ArrowUpRight className={`${className} ${style.text}`} />;
  if (trend === "falling") return <ArrowDownRight className={`${className} ${style.text}`} />;
  if (trend === "volatile") return <BarChart3 className={`${className} ${style.text}`} />;
  if (trend === "seasonal") return <TrendingUp className={`${className} ${style.text}`} />;
  return <Minus className={`${className} ${style.text}`} />;
};
TrendIcon.propTypes = { trend: PropTypes.string, className: PropTypes.string };

export const TrendBadge = ({ trend }) => (
  <span
    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${trendStyle(trend).chip}`}
  >
    <TrendIcon trend={trend} />
    {trend ? trend.charAt(0).toUpperCase() + trend.slice(1) : "N/A"}
  </span>
);
TrendBadge.propTypes = { trend: PropTypes.string };

const DEMAND_CONFIG = {
  "very-high": { color: "bg-red-500", label: "Very High" },
  high: { color: "bg-orange-500", label: "High" },
  moderate: { color: "bg-yellow-500", label: "Moderate" },
  low: { color: "bg-green-500", label: "Low" },
  growing: { color: "bg-blue-500", label: "Growing" },
  export: { color: "bg-purple-500", label: "Export" },
};

export const DemandDot = ({ demand }) => {
  const config = DEMAND_CONFIG[demand] || DEMAND_CONFIG.moderate;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-neo-muted">
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      {config.label} demand
    </span>
  );
};
DemandDot.propTypes = { demand: PropTypes.string };
