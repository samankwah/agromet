import PropTypes from "prop-types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import T from "../common/T";
import { cssVar } from "./severity";

/**
 * Recharts paints SVG and cannot read Tailwind classes, so colours are resolved
 * from the CSS custom properties at render time -- the pattern established in
 * components/Market/PriceTrendChart.jsx.
 *
 * Because that read happens during render, a theme switch only reaches the
 * chart if the component re-renders. Callers pass `key={theme}` for exactly
 * this reason; without it the axes keep the old theme's colours.
 */
const usePalette = () => ({
  accent: cssVar("--neo-accent", "#23785c"),
  teal: cssVar("--neo-teal", "#0b7070"),
  muted: cssVar("--neo-muted", "#586b78"),
  text: cssVar("--neo-text", "#20303b"),
  danger: cssVar("--neo-danger", "#be4141"),
  warning: cssVar("--neo-warning", "#d9a441"),
  border: cssVar("--neo-border", "rgba(111, 132, 146, 0.42)"),
});

const shortDate = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neo-border/60 bg-neo-surface px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold text-neo-muted">{shortDate(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs font-semibold text-neo-text">
          {entry.name}: {Number(entry.value).toFixed(entry.value < 10 ? 2 : 0)} {unit}
        </p>
      ))}
    </div>
  );
}

ChartTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
  unit: PropTypes.string,
};

function Figure({ title, caption, children }) {
  return (
    <figure className="rounded-2xl border border-neo-border/50 bg-neo-surface p-4 sm:p-5">
      <figcaption className="mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neo-muted">
          <T>{title}</T>
        </h3>
        {/* Also the screen-reader summary: a recharts SVG conveys nothing on
            its own, so the one-sentence reading is the accessible content. */}
        <p className="mt-0.5 text-[11px] text-neo-muted">{caption}</p>
      </figcaption>
      <div className="h-56 -ml-2 sm:h-64">{children}</div>
    </figure>
  );
}

Figure.propTypes = {
  title: PropTypes.string.isRequired,
  caption: PropTypes.node,
  children: PropTypes.node,
};

/**
 * Cumulative rainfall over the 90-day window, against the long-term normal.
 *
 * Ninety daily bars would be visual noise no reader could total up. The
 * cumulative curve against a single horizontal normal answers the only
 * question that matters -- are we ahead of or behind the season -- at a glance,
 * and it is the exact quantity the SPI is computed from, so the chart and the
 * headline figure cannot disagree.
 */
export function RainfallAccumulationChart({ series, normalMm, totalMm }) {
  const palette = usePalette();
  const observed = series?.observed;
  if (!observed?.dates?.length) return null;

  let running = 0;
  const data = observed.dates.map((date, index) => {
    running += observed.precipitation?.[index] || 0;
    return { date, cumulative: Math.round(running * 10) / 10 };
  });

  const ahead = normalMm ? totalMm >= normalMm : null;
  const caption =
    normalMm != null ? (
      <>
        {Math.round(totalMm)} mm <T>against a normal of</T> {Math.round(normalMm)} mm —{" "}
        <T>{ahead ? "ahead of the seasonal average" : "behind the seasonal average"}</T>
      </>
    ) : (
      <>{Math.round(totalMm || 0)} mm <T>over 90 days</T></>
    );

  return (
    <Figure title="Rainfall against normal" caption={caption}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="hazardRainFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.teal} stopOpacity={0.28} />
              <stop offset="100%" stopColor={palette.teal} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={palette.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: palette.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: palette.border }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: palette.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={46}
            tickFormatter={(value) => `${Math.round(value)}`}
          />
          <Tooltip
            content={<ChartTooltip unit="mm" />}
            cursor={{ stroke: palette.muted, strokeDasharray: "3 3" }}
          />
          {normalMm != null && (
            <ReferenceLine
              y={normalMm}
              stroke={palette.muted}
              strokeDasharray="5 4"
              label={{
                value: "Normal",
                position: "insideTopLeft",
                fill: palette.muted,
                fontSize: 11,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="cumulative"
            name="Cumulative rainfall"
            stroke={palette.teal}
            strokeWidth={2}
            fill="url(#hazardRainFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Figure>
  );
}

RainfallAccumulationChart.propTypes = {
  series: PropTypes.object,
  normalMm: PropTypes.number,
  totalMm: PropTypes.number,
};

/**
 * River discharge against its own 30-year distribution.
 *
 * The reference lines are what make the series interpretable: a raw m3/s figure
 * means nothing without knowing what is normal for that reach.
 */
export function DischargeChart({ discharge, riverine }) {
  const palette = usePalette();
  if (!riverine || !discharge?.dates?.length) return null;

  const data = discharge.dates.map((date, index) => ({
    date,
    value: discharge.values?.[index] ?? null,
  }));
  const forecastFrom = discharge.forecastFrom;
  const lastDate = discharge.dates[discharge.dates.length - 1];

  return (
    <Figure
      title="River discharge"
      caption={
        <>
          <T>Shaded area is forecast. Reference lines are the 30-year median and 95th percentile for this reach.</T>
        </>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="hazardDischargeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.accent} stopOpacity={0.26} />
              <stop offset="100%" stopColor={palette.accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={palette.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: palette.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: palette.border }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: palette.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            content={<ChartTooltip unit="m³/s" />}
            cursor={{ stroke: palette.muted, strokeDasharray: "3 3" }}
          />
          {forecastFrom && (
            <ReferenceArea
              x1={forecastFrom}
              x2={lastDate}
              fill={palette.muted}
              fillOpacity={0.07}
            />
          )}
          {discharge.median != null && (
            <ReferenceLine y={discharge.median} stroke={palette.muted} strokeDasharray="5 4" />
          )}
          {discharge.p95 != null && (
            <ReferenceLine y={discharge.p95} stroke={palette.danger} strokeDasharray="5 4" />
          )}
          <Area
            type="monotone"
            dataKey="value"
            name="Discharge"
            stroke={palette.accent}
            strokeWidth={2}
            fill="url(#hazardDischargeFill)"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </Figure>
  );
}

DischargeChart.propTypes = {
  discharge: PropTypes.object,
  riverine: PropTypes.bool,
};

/** Daily soil moisture, the corroborating drought signal. */
export function SoilMoistureChart({ series }) {
  const palette = usePalette();
  const soil = series?.soilMoisture;
  if (!soil?.dates?.length) return null;

  const data = soil.dates.map((date, index) => ({
    date,
    value: soil.values?.[index] ?? null,
  }));

  return (
    <Figure
      title="Soil moisture"
      caption={<T>Mean water content of the top 9 cm, cubic metres per cubic metre.</T>}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={palette.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: palette.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: palette.border }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: palette.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={46}
            domain={["auto", "auto"]}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip
            content={<ChartTooltip unit="m³/m³" />}
            cursor={{ stroke: palette.muted, strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Soil moisture"
            stroke={palette.warning}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </Figure>
  );
}

SoilMoistureChart.propTypes = { series: PropTypes.object };
