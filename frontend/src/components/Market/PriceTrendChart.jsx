import PropTypes from "prop-types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { MONTH_NAMES, formatCedi } from "../../utils/marketInsights";

/**
 * Six months of price history, on the commodity page.
 *
 * Recharts is the project's chart library — it is what the forecast pages use
 * and the only one actually imported anywhere — so this follows the pattern in
 * pages/FloodDrought.jsx: a ResponsiveContainer inside a fixed-height parent.
 *
 * Recharts renders to SVG and cannot read Tailwind classes on its internal
 * elements, so the theme tokens are read as CSS variables and passed through
 * as literal colours.
 */

const cssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

/** The six months ending with the current one, oldest first. */
function buildSeriesData(series, currentMonth) {
  if (!series || series.length === 0) return [];
  return series.map((price, index) => ({
    month: MONTH_NAMES[(currentMonth - series.length + index + 12) % 12],
    price,
    isCurrent: index === series.length - 1,
  }));
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neo-surface-strong border border-neo-border/60 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[11px] text-neo-muted">{label}</p>
      <p className="text-sm font-bold text-neo-text">{formatCedi(payload[0].value)}</p>
    </div>
  );
};
ChartTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

const PriceTrendChart = ({ series, currentMonth, average }) => {
  const data = buildSeriesData(series, currentMonth);
  if (data.length < 2) return null;

  const accent = cssVar("--neo-accent", "#23785c");
  const muted = cssVar("--neo-muted", "#586b78");
  const border = cssVar("--neo-border", "rgba(111, 132, 146, 0.42)");

  // A little headroom either side, so the line never runs along the frame.
  const values = data.map((point) => point.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min || max * 0.1) * 0.15;

  return (
    <div className="h-64 sm:h-72 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={border} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: muted, fontSize: 12 }}
            axisLine={{ stroke: border }}
            tickLine={false}
          />
          <YAxis
            domain={[min - padding, max + padding]}
            tick={{ fill: muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={62}
            tickFormatter={(value) => `GH₵${Math.round(value)}`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: muted, strokeDasharray: "3 3" }} />
          {typeof average === "number" && (
            <ReferenceLine
              y={average}
              stroke={muted}
              strokeDasharray="4 4"
              label={{ value: "6-mo avg", position: "insideTopRight", fill: muted, fontSize: 10 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="price"
            stroke={accent}
            strokeWidth={2.5}
            fill="url(#priceTrendFill)"
            dot={{ r: 3, fill: accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: accent, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

PriceTrendChart.propTypes = {
  series: PropTypes.arrayOf(PropTypes.number),
  currentMonth: PropTypes.number.isRequired,
  average: PropTypes.number,
};

export default PriceTrendChart;
