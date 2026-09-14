import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";

import T from "../common/T";
import hazardService from "../../services/hazardService";

/**
 * The disclosure that makes the rest of the page believable.
 *
 * A number with no stated method is a rumour. This panel carries how each index
 * is computed, what it is measured against, and -- the part that usually gets
 * left out -- what it cannot tell you. It is served from the backend rather
 * than hardcoded here so the caveats can never drift away from the maths that
 * needs them.
 *
 * Closed by default: it earns its place by being one click away, not by taking
 * up the page.
 */
export default function MethodologyNote({ meta }) {
  const [methodology, setMethodology] = useState(null);

  useEffect(() => {
    let active = true;
    hazardService
      .getMethodology()
      .then((payload) => active && setMethodology(payload))
      .catch(() => {
        /* The panel simply stays minimal if this fails. */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <details className="group rounded-2xl border border-neo-border/50 bg-neo-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neo-focus sm:px-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-neo-muted">
          <T>How these figures are produced, and what they cannot tell you</T>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-neo-muted transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="space-y-4 border-t border-neo-border/50 px-4 py-4 sm:px-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-neo-text">
              <T>Flood</T>
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-neo-muted">
              <T>
                Forecast river discharge ranked against the full 30-year record for that
                reach, combined with forecast rainfall over the coming week, the heaviest
                single forecast day, and how saturated the topsoil already is.
              </T>
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neo-text">
              <T>Drought</T>
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-neo-muted">
              <T>
                The Standardised Precipitation Index over 90 days, fitted to a gamma
                distribution against the same 30-year baseline, supported by soil moisture,
                the length of the current dry spell, and how far evapotranspiration is
                expected to outrun rainfall.
              </T>
            </p>
          </div>
        </div>

        {methodology?.bands?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-neo-text">
              <T>Bands</T>
            </h3>
            <p className="mt-1 text-[13px] text-neo-muted">
              {methodology.bands
                .map((entry) => `${entry.band} ${entry.minScore}+`)
                .join(" · ")}
            </p>
          </div>
        )}

        {methodology?.limits?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-neo-text">
              <T>Limits</T>
            </h3>
            <ul className="mt-1 space-y-1.5">
              {methodology.limits.map((limit) => (
                <li
                  key={limit}
                  className="flex gap-2 text-[13px] leading-relaxed text-neo-muted"
                >
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neo-border" />
                  <T>{limit}</T>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-neo-border/40 pt-3">
          <h3 className="text-xs font-semibold text-neo-text">
            <T>Sources</T>
          </h3>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {(methodology?.sources || meta?.sources || []).map((source) => (
              <li key={source.id || source.label} className="text-[13px] text-neo-muted">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-neo-border underline-offset-2 hover:text-neo-accent"
                  >
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
                {source.detail ? ` — ${source.detail}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

MethodologyNote.propTypes = {
  meta: PropTypes.shape({
    sources: PropTypes.array,
  }),
};
