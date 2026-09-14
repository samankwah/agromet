/**
 * The severity scale, and the rules that keep it calm and legible.
 *
 * One scale is shared by both hazards, so a reader can compare a flood
 * severity against a drought severity directly. Flood and drought are told
 * apart by icon and column, never by hue -- if flood were blue and drought
 * orange, the two could not be compared at a glance, which is the whole point
 * of the page.
 *
 * Two rules that carry the visual design:
 *
 * 1. **The band word is always rendered in `text-neo-text`.** Never in the band
 *    colour. `--neo-warning` (#d9a441) on `--neo-surface` (#eef3f7) measures
 *    about 2:1, which fails WCAG AA for text outright. Colour is carried by a
 *    dot or a left rule; the word stays high-contrast. This solves contrast and
 *    tone at the same time -- nothing shouts.
 *
 * 2. **Only `extreme` gets a filled treatment.** On an ordinary day most of the
 *    sixteen regions sit at `normal` and render in plain neutral grey, so the
 *    eye lands on the one or two that do not. That restraint is the design.
 *
 * Severity is never encoded by colour alone: every readout carries the band
 * word and a five-segment meter, so it survives greyscale and screen readers.
 */

/** Ordered lowest to highest. Mirrors SEVERITY_BANDS in backend/app/hazards.py. */
export const SEVERITY_ORDER = ["normal", "watch", "moderate", "severe", "extreme"];

export const BAND_META = {
  normal: {
    label: "Normal",
    rank: 0,
    // Neutral on purpose: "nothing to report" should look like nothing.
    dot: "bg-neo-muted/45",
    chip: "bg-neo-bg-soft text-neo-text border-neo-border/50",
    rule: "bg-neo-muted/35",
    meterOn: "bg-neo-muted/50",
    cssVar: "--neo-muted",
    fillOpacity: 0.22,
  },
  watch: {
    label: "Watch",
    rank: 1,
    dot: "bg-neo-teal",
    chip: "bg-neo-teal/10 text-neo-text border-neo-teal/35",
    rule: "bg-neo-teal",
    meterOn: "bg-neo-teal",
    cssVar: "--neo-teal",
    fillOpacity: 0.3,
  },
  moderate: {
    label: "Moderate",
    rank: 2,
    dot: "bg-neo-warning",
    chip: "bg-neo-warning/12 text-neo-text border-neo-warning/40",
    rule: "bg-neo-warning",
    meterOn: "bg-neo-warning",
    cssVar: "--neo-warning",
    fillOpacity: 0.38,
  },
  severe: {
    label: "Severe",
    rank: 3,
    dot: "bg-neo-danger",
    chip: "bg-neo-danger/12 text-neo-text border-neo-danger/40",
    rule: "bg-neo-danger",
    meterOn: "bg-neo-danger",
    cssVar: "--neo-danger",
    fillOpacity: 0.48,
  },
  extreme: {
    label: "Extreme",
    rank: 4,
    dot: "bg-neo-danger",
    // The only solid fill on the page.
    chip: "bg-neo-danger text-neo-on-danger border-neo-danger",
    rule: "bg-neo-danger",
    meterOn: "bg-neo-danger",
    cssVar: "--neo-danger",
    fillOpacity: 0.62,
  },
  unavailable: {
    label: "No data",
    rank: -1,
    dot: "bg-neo-border",
    chip: "bg-neo-bg-soft text-neo-muted border-neo-border/40 border-dashed",
    rule: "bg-neo-border",
    meterOn: "bg-neo-border",
    cssVar: "--neo-border",
    fillOpacity: 0.1,
  },
};

export const bandMeta = (band) => BAND_META[band] || BAND_META.unavailable;

export const bandRank = (band) => bandMeta(band).rank;

/**
 * Read a themed colour at call time.
 *
 * Recharts and Leaflet paint SVG and canvas, so they cannot see Tailwind
 * classes -- the values have to be resolved from the CSS custom properties
 * that flip under `[data-theme="dark"]`. Matches the helper established in
 * components/Market/PriceTrendChart.jsx.
 *
 * Because this reads at render time, any component using it must be re-rendered
 * when the theme changes; the callers do that with `key={theme}`.
 */
export const cssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

const BAND_FALLBACK_COLORS = {
  "--neo-muted": "#586b78",
  "--neo-teal": "#0b7070",
  "--neo-warning": "#d9a441",
  "--neo-danger": "#be4141",
  "--neo-border": "#7e919e",
};

/** Fill and stroke for one region on the choropleth. */
export const bandMapStyle = (band, { selected = false } = {}) => {
  const meta = bandMeta(band);
  const color = cssVar(meta.cssVar, BAND_FALLBACK_COLORS[meta.cssVar] || "#7e919e");
  return {
    fillColor: color,
    fillOpacity: meta.fillOpacity,
    // Selection is shown with the text colour, not by changing the fill --
    // otherwise selection and severity would compete for the same channel.
    color: selected ? cssVar("--neo-text", "#20303b") : color,
    weight: selected ? 2.5 : 1,
    opacity: selected ? 1 : 0.65,
  };
};

/** Sort helper: worst first, then alphabetical.
 *
 * The name tiebreak matters -- without it, rows with equal scores reshuffle
 * between refreshes for no reason a reader can see. */
export const bySeverity = (hazard) => (a, b) => {
  const rankDelta = bandRank(b[hazard]?.band) - bandRank(a[hazard]?.band);
  if (rankDelta !== 0) return rankDelta;
  const scoreDelta = (b[hazard]?.score ?? -1) - (a[hazard]?.score ?? -1);
  if (scoreDelta !== 0) return scoreDelta;
  return a.region.localeCompare(b.region);
};
