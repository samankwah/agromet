import PropTypes from "prop-types";

import T from "../common/T";
import { SEVERITY_ORDER, bandMeta } from "./severity";

/**
 * Lives in its own module rather than inside HazardMap.jsx on purpose: the page
 * renders the legend eagerly, and importing any named export from HazardMap
 * would drag leaflet and the 3 MB boundary asset into the main bundle, quietly
 * cancelling the React.lazy split.
 */
export default function HazardMapLegend({ className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neo-muted">
        <T>Severity</T>
      </span>
      {SEVERITY_ORDER.map((band) => {
        const meta = bandMeta(band);
        return (
          <span key={band} className="inline-flex items-center gap-1.5">
            {/* The ring matters: at these opacities the fill alone does not
                reach the 3:1 contrast minimum for a non-text indicator. */}
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-[3px] ring-1 ring-neo-border/60 ${meta.dot}`}
            />
            <span className="text-[11px] text-neo-text">
              <T>{meta.label}</T>
            </span>
          </span>
        );
      })}
    </div>
  );
}

HazardMapLegend.propTypes = { className: PropTypes.string };
