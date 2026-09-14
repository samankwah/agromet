import PropTypes from "prop-types";

/**
 * The sparkline on a commodity card.
 *
 * Deliberately hand-drawn rather than a Recharts chart: the grid renders one of
 * these per card, and pulling in a full charting runtime — plus a
 * ResponsiveContainer and its resize observer — eighteen times over for an
 * 88x32 glyph is a real cost for no gain. The commodity page, which draws one
 * chart the reader actually studies, uses Recharts.
 */

const MiniAreaChart = ({ data, width = 88, height = 32 }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((value, index) => ({
    x: pad + (index / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (value - min) / range) * (height - pad * 2),
  }));

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${points[0].x},${height} ${line} ${points[points.length - 1].x},${height}`;
  const isUp = data[data.length - 1] >= data[0];

  // currentColor lets the caller tint the whole sparkline with a text-* class,
  // so it inherits the same theme-aware token as the change label beside it.
  return (
    <svg
      width={width}
      height={height}
      className={`flex-shrink-0 ${isUp ? "text-neo-accent" : "text-neo-danger"}`}
      aria-hidden="true"
      focusable="false"
    >
      <polygon fill="currentColor" fillOpacity="0.12" points={area} />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill="currentColor" />
    </svg>
  );
};

MiniAreaChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number),
  width: PropTypes.number,
  height: PropTypes.number,
};

export default MiniAreaChart;
