import PropTypes from "prop-types";
import { AlertTriangle, FileText } from "lucide-react";

import T from "../common/T";
import useT from "../../hooks/useT";
import { SeverityMeter } from "./SeverityBadge";
import { bandMeta, bySeverity } from "./severity";

/**
 * The sixteen regions ranked by the active hazard.
 *
 * This is the page's primary data view, not a sidebar to the map. It is the
 * accessible equivalent of the choropleth (Leaflet layers are technically
 * focusable but the experience is poor), and on narrow screens it is ordered
 * ahead of the map, because a ranked list answers "who is worst off" far better
 * than a map ever does.
 */
export default function RegionRiskList({ regions, hazard, selected, onSelect, id }) {
  const { t } = useT();
  const ranked = [...regions].sort(bySeverity(hazard));

  return (
    <div
      id={id}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-neo-border/50 bg-neo-surface"
    >
      <div className="flex shrink-0 items-baseline justify-between border-b border-neo-border/50 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neo-muted">
          <T>Regions by risk</T>
        </h2>
        <span className="text-[11px] text-neo-muted">
          <T>Highest first</T>
        </span>
      </div>

      <ul className="divide-y divide-neo-border/40 overflow-y-auto">
        {ranked.map((region) => {
          const block = region[hazard] || {};
          const meta = bandMeta(block.band);
          const active = region.region === selected;

          return (
            <li key={region.region}>
              <button
                type="button"
                onClick={() => onSelect(region.region)}
                aria-pressed={active}
                aria-label={t("{{region}}: {{band}} {{hazard}} risk", {
                  region: region.region,
                  band: meta.label,
                  hazard,
                })}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neo-focus ${
                  active ? "bg-neo-bg-soft" : "hover:bg-neo-bg-soft/60"
                }`}
              >
                {/* The colour rule. Always paired with the band word below, so
                    it is never the only carrier of severity. */}
                <span
                  aria-hidden="true"
                  className={`h-8 w-1 shrink-0 rounded-full ${meta.rule}`}
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-neo-text">
                      {region.region}
                    </span>
                    {block.overridden && (
                      <FileText
                        className="h-3 w-3 shrink-0 text-neo-accent"
                        aria-label={t("GMet bulletin in effect")}
                      />
                    )}
                    {block.band === "extreme" && (
                      <AlertTriangle
                        className="h-3 w-3 shrink-0 text-neo-danger"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className="block truncate text-[11px] text-neo-muted">
                    <T>{meta.label}</T>
                    {region.agroZone ? ` · ${region.agroZone}` : ""}
                  </span>
                </span>

                <span className="hidden shrink-0 text-right sm:block">
                  <span className="block text-sm font-semibold tabular-nums text-neo-text">
                    {block.score === null || block.score === undefined
                      ? "—"
                      : Math.round(block.score)}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wide text-neo-muted">
                    <T>of 100</T>
                  </span>
                </span>
                <SeverityMeter band={block.band} score={block.score} className="shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

RegionRiskList.propTypes = {
  regions: PropTypes.arrayOf(PropTypes.object).isRequired,
  hazard: PropTypes.oneOf(["flood", "drought"]).isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  id: PropTypes.string,
};
