import PropTypes from "prop-types";
import { RefreshCw } from "lucide-react";

import T from "../common/T";
import useT from "../../hooks/useT";

const formatStamp = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Provenance strip: when the reading was taken, what it was measured against,
 * and whether it is currently fresh.
 *
 * This sits directly under the title rather than in a footer because on a
 * monitoring page the age of the data is part of the data. A reading with no
 * timestamp is not a reading.
 */
export default function HazardStatusBar({ meta, onRefresh, refreshing }) {
  const { t } = useT();
  const stamp = formatStamp(meta?.computedAt);
  const stale = Boolean(meta?.stale);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-neo-border/50 bg-neo-surface px-4 py-2.5"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neo-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              stale ? "bg-neo-warning" : "bg-neo-accent"
            }`}
          />
          {stamp ? (
            <span>
              <T>Updated</T> <span className="font-semibold text-neo-text">{stamp}</span>
            </span>
          ) : (
            <T>Awaiting first reading</T>
          )}
        </span>

        {meta?.baseline && (
          <>
            <span aria-hidden="true" className="text-neo-border">|</span>
            <span>
              <T>Baseline</T>{" "}
              <span className="font-medium text-neo-text">{meta.baseline}</span>
            </span>
          </>
        )}

        {meta?.sources?.length > 0 && (
          <>
            <span aria-hidden="true" className="text-neo-border">|</span>
            <span>{meta.sources.map((source) => source.label).join(" · ")}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {stale && (
          <span className="text-xs font-semibold text-neo-text">
            <T>Refreshing in the background</T>
          </span>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label={t("Refresh flood and drought data")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neo-border/60 px-2.5 py-1 text-xs font-semibold text-neo-muted transition-colors hover:border-neo-accent/50 hover:text-neo-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <T>Refresh</T>
        </button>
      </div>
    </div>
  );
}

HazardStatusBar.propTypes = {
  meta: PropTypes.shape({
    computedAt: PropTypes.string,
    stale: PropTypes.bool,
    baseline: PropTypes.string,
    sources: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string })),
  }),
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
};
