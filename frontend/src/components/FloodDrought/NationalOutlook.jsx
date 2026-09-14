import PropTypes from "prop-types";

import T from "../common/T";
import { SeverityBadge } from "./SeverityBadge";

/**
 * The national roll-up.
 *
 * Counts, never averages. A mean severity across sixteen regions is exactly the
 * statistic that hides the one region in trouble, which is the only thing on
 * this page worth knowing.
 *
 * The headline figures render in `text-neo-text` -- neutral. Colouring them red
 * whenever a number is non-zero is the reflex that turns a monitor into an
 * alarm, and after a week of red the reader stops seeing it. Severity is
 * carried by the small chip underneath instead.
 */
function Tile({ label, value, hint, badge }) {
  return (
    <div className="rounded-xl border border-neo-border/50 bg-neo-surface p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neo-muted sm:text-xs">
        <T>{label}</T>
      </p>
      <p className="mt-1 truncate text-xl font-bold tabular-nums text-neo-text sm:text-2xl">
        {value}
      </p>
      <div className="mt-1.5 flex min-h-[20px] items-center gap-2">
        {badge ? <SeverityBadge band={badge} /> : null}
        {hint ? <span className="truncate text-[11px] text-neo-muted">{hint}</span> : null}
      </div>
    </div>
  );
}

Tile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  hint: PropTypes.string,
  badge: PropTypes.string,
};

export default function NationalOutlook({ national }) {
  if (!national) return null;

  const total = national.regionCount;
  const flood = national.highestFlood;
  const drought = national.highestDrought;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
      <Tile
        label="Regions on flood alert"
        value={`${national.floodElevated} / ${total}`}
        hint="Moderate or above"
      />
      <Tile
        label="Regions in drought stress"
        value={`${national.droughtElevated} / ${total}`}
        hint="Moderate or above"
      />
      <Tile
        label="Highest flood risk"
        value={flood ? flood.region : "—"}
        badge={flood ? flood.band : undefined}
      />
      <Tile
        label="Highest drought stress"
        value={drought ? drought.region : "—"}
        badge={drought ? drought.band : undefined}
      />
    </div>
  );
}

NationalOutlook.propTypes = {
  national: PropTypes.shape({
    regionCount: PropTypes.number,
    floodElevated: PropTypes.number,
    droughtElevated: PropTypes.number,
    highestFlood: PropTypes.shape({ region: PropTypes.string, band: PropTypes.string }),
    highestDrought: PropTypes.shape({ region: PropTypes.string, band: PropTypes.string }),
  }),
};
