/**
 * Pure derivations over the market data.
 *
 * marketIntelligenceService owns the data and, past getCurrentPrice(), speaks
 * only in markdown paragraphs meant for the chatbot. The market UI needs the
 * same reasoning as structured values it can lay out, so it lives here instead
 * of being parsed back out of prose.
 *
 * Everything below is a pure function of its arguments — no React, no service
 * import, no clock unless the caller passes the month in. That keeps it
 * testable, and it is the module the React Native port is transcribed from.
 */

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Ghana cedi, always two decimals. */
export function formatCedi(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `GH₵${value.toFixed(2)}`;
}

/** 1-indexed month numbers (the shape peak_months / low_months use) to labels. */
export function formatMonths(months) {
  if (!Array.isArray(months) || months.length === 0) return "—";
  return months.map((m) => MONTH_NAMES[m - 1]).filter(Boolean).join(", ");
}

/**
 * Movement across a price series.
 *
 * Returns null for a series too short to have moved, so callers can skip the
 * change indicator entirely rather than render a confident "+GH₵0.00".
 */
export function getPriceChange(series) {
  if (!Array.isArray(series) || series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const delta = last - first;
  return {
    first,
    last,
    delta,
    pct: first === 0 ? 0 : (delta / first) * 100,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    high: Math.max(...series),
    low: Math.min(...series),
    months: series.length,
  };
}

/**
 * Where this month sits against the commodity's seasonal peaks and troughs.
 *
 * `tone` drives the colour, and is deliberately three-valued: there is no
 * useful fourth answer to "should I sell this month?".
 */
export function getTimingSignal(trendData, month) {
  const inPeak = trendData?.peak_months?.includes(month);
  const inLow = trendData?.low_months?.includes(month);

  if (inPeak) {
    return {
      tone: "sell",
      title: "Good time to sell",
      detail: "Peak price period. Sell now, or within 2-4 weeks, for the best return.",
      short: "Peak season — sell now",
    };
  }
  if (inLow) {
    return {
      tone: "hold",
      title: "Hold if you can",
      detail: "Prices are typically at their lowest. Store properly and wait for the peak.",
      short: "Trough season — hold",
    };
  }
  return {
    tone: "watch",
    title: "Moderate timing",
    detail: "An average price period. Watch daily prices for an opening.",
    short: "Average season — watch",
  };
}

/**
 * The same commodity priced at every market centre, dearest first.
 *
 * Regional pricing is the national price times that centre's premium, which is
 * the same rule the grid and the quick view apply to a single region — this
 * just applies it to all of them at once so they can be compared.
 */
export function getRegionalPrices(basePrice, marketCenters) {
  if (typeof basePrice !== "number" || !marketCenters) return [];
  return Object.entries(marketCenters)
    .map(([region, info]) => ({
      region,
      price: basePrice * info.price_premium,
      premiumPct: (info.price_premium - 1) * 100,
      majorMarkets: info.major_markets ?? [],
      transportAccess: info.transport_access,
    }))
    .sort((a, b) => b.price - a.price);
}

/** The national price adjusted for one region, or the national price itself. */
export function applyRegionPremium(basePrice, marketCenters, region) {
  if (typeof basePrice !== "number") return null;
  const info = region ? marketCenters?.[region] : null;
  return info ? basePrice * info.price_premium : basePrice;
}

/**
 * Join a catalogue entry to its price and trend data.
 *
 * The catalogue and the price data are keyed differently on purpose — see
 * data/commodityCatalog.js — so this is the one place that knows a card's
 * `commoditySlug` is what the service is filed under.
 */
export function resolveCommodity(commodity, service, region) {
  if (!commodity) return null;
  const market = service.getCurrentPrice(commodity.commoditySlug);
  const trend = service.historicalTrends[commodity.commoditySlug] ?? null;
  const series = trend?.["6months"] ?? null;
  const basePrice = market?.price ?? null;

  return {
    commodity,
    market,
    trend,
    series,
    basePrice,
    price: applyRegionPremium(basePrice, service.marketCenters, region),
    change: getPriceChange(series),
    regionInfo: region ? service.marketCenters[region] ?? null : null,
  };
}
