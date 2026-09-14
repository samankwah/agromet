/**
 * The tone returned by getTimingSignal, mapped to a card style.
 *
 * Kept out of MarketBadges.jsx so that file exports components and nothing
 * else, which is what react-refresh needs to hot-reload it cleanly.
 */
export const TIMING_TONES = {
  sell: {
    wrapper: "bg-neo-accent/10 border-neo-accent/30",
    title: "text-neo-accent",
    detail: "text-neo-text/80",
  },
  hold: {
    wrapper: "bg-neo-danger/10 border-neo-danger/30",
    title: "text-neo-danger",
    detail: "text-neo-text/80",
  },
  watch: {
    wrapper: "bg-neo-warning/10 border-neo-warning/30",
    title: "text-neo-warning",
    detail: "text-neo-text/80",
  },
};
