import PropTypes from "prop-types";

import T from "../common/T";
import { SEVERITY_ORDER, bandMeta, bandRank } from "./severity";

/**
 * A five-segment step meter.
 *
 * This is the redundant, non-colour encoding of severity. It reads correctly in
 * greyscale, and `role="meter"` gives assistive technology the same reading in
 * words. Filled segments carry the band colour; the rest stay neutral.
 */
export function SeverityMeter({ band, score, className = "" }) {
  const meta = bandMeta(band);
  const filled = Math.max(0, bandRank(band) + 1);
  const readout =
    score === null || score === undefined
      ? meta.label
      : `${meta.label}, ${Math.round(score)} of 100`;

  return (
    <span
      role="meter"
      aria-valuenow={Math.max(0, bandRank(band) + 1)}
      aria-valuemin={0}
      aria-valuemax={SEVERITY_ORDER.length}
      aria-valuetext={readout}
      className={`inline-flex items-center gap-[3px] ${className}`}
    >
      {SEVERITY_ORDER.map((_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`h-3 w-[5px] rounded-[2px] ${
            index < filled ? meta.meterOn : "bg-neo-border/30"
          }`}
        />
      ))}
    </span>
  );
}

SeverityMeter.propTypes = {
  band: PropTypes.string,
  score: PropTypes.number,
  className: PropTypes.string,
};

/**
 * A band chip.
 *
 * The word itself is `text-neo-text` at every level except `extreme`, where the
 * chip is filled and the text flips to the on-danger token. See severity.js for
 * why the band colour is never used for the text.
 */
export function SeverityBadge({ band, className = "" }) {
  const meta = bandMeta(band);
  const isExtreme = band === "extreme";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.chip} ${className}`}
    >
      {!isExtreme && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ring-1 ring-neo-border/50 ${meta.dot}`}
        />
      )}
      <T>{meta.label}</T>
    </span>
  );
}

SeverityBadge.propTypes = {
  band: PropTypes.string,
  className: PropTypes.string,
};

/** A bare dot, for dense rows where a full chip would be noise. */
export function SeverityDot({ band, className = "" }) {
  const meta = bandMeta(band);
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-neo-border/50 ${meta.dot} ${className}`}
    />
  );
}

SeverityDot.propTypes = {
  band: PropTypes.string,
  className: PropTypes.string,
};

export default SeverityBadge;
