import { forwardRef } from "react";
import PropTypes from "prop-types";
import { CheckCircle2, FileText, Info, Waves } from "lucide-react";

import T from "../common/T";
import { SkeletonBlock } from "../common/SkeletonLoading";
import { useTheme } from "../../contexts/ThemeContext";
import { SeverityBadge, SeverityMeter } from "./SeverityBadge";
import {
  DischargeChart,
  RainfallAccumulationChart,
  SoilMoistureChart,
} from "./HazardCharts";

/**
 * One contributing measurement.
 *
 * Every driver shows its own value, its weight in the score and a plain-English
 * gloss. A composite index that will not show its working is just an assertion,
 * and a farmer has no way to judge whether to act on an assertion.
 */
function DriverRow({ driver }) {
  const hasPercentile = driver.percentile !== null && driver.percentile !== undefined;

  return (
    <li className="border-b border-neo-border/40 py-2.5 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-neo-text">
          <T>{driver.label}</T>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-neo-text">
          {driver.value === null ? "—" : driver.value}
          <span className="ml-1 text-[11px] font-normal text-neo-muted">{driver.unit}</span>
        </span>
      </div>
      {driver.gloss && (
        <p className="mt-0.5 text-[11px] leading-relaxed text-neo-muted">
          <T>{driver.gloss}</T>
        </p>
      )}
      {hasPercentile && (
        <div
          className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neo-border/25"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-neo-muted/60"
            style={{ width: `${Math.max(2, Math.min(100, driver.percentile))}%` }}
          />
        </div>
      )}
    </li>
  );
}

DriverRow.propTypes = { driver: PropTypes.object.isRequired };

function AdvisoryList({ advisories, band }) {
  if (!advisories?.length) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-neo-bg-soft px-3 py-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-neo-accent" aria-hidden="true" />
        <p className="text-sm text-neo-muted">
          <T>No action needed beyond normal seasonal practice.</T>
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {advisories.map((advisory) => (
        <li
          key={advisory}
          className="flex gap-2.5 rounded-xl border border-neo-border/50 bg-neo-bg-soft px-3 py-2.5"
        >
          <span
            aria-hidden="true"
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
              band === "extreme" || band === "severe" ? "bg-neo-danger" : "bg-neo-warning"
            }`}
          />
          <p className="text-sm leading-relaxed text-neo-text">
            <T>{advisory}</T>
          </p>
        </li>
      ))}
    </ul>
  );
}

AdvisoryList.propTypes = {
  advisories: PropTypes.arrayOf(PropTypes.string),
  band: PropTypes.string,
};

const RegionDetail = forwardRef(function RegionDetail(
  { detail, hazard, loading, error },
  ref
) {
  const { theme } = useTheme();

  if (loading && !detail) {
    return (
      <section className="space-y-3">
        <SkeletonBlock className="h-8 w-56" tone="neo" />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonBlock className="h-64" tone="neo" rounded="rounded-2xl" />
          <SkeletonBlock className="h-64" tone="neo" rounded="rounded-2xl" />
        </div>
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="rounded-2xl border border-neo-border/50 bg-neo-surface p-6 text-center">
        <p className="text-sm text-neo-muted">
          <T>Select a region to see its readings.</T>
        </p>
      </section>
    );
  }

  const block = detail[hazard] || {};
  const drought = detail.drought || {};

  return (
    <section ref={ref} tabIndex={-1} className="space-y-4 focus:outline-none">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neo-text">
            {detail.region}
          </h2>
          <p className="mt-0.5 text-sm text-neo-muted">
            {detail.agroZone}
            {" · "}
            <T>{hazard === "flood" ? "Flood risk" : "Drought stress"}</T>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SeverityMeter band={block.band} score={block.score} />
          <SeverityBadge band={block.band} />
        </div>
      </div>

      {/* An override is never silent: the reader is told a bulletin is in force
          AND what the model independently said. */}
      {block.overridden && (
        <div className="flex gap-3 rounded-xl border border-neo-accent/30 bg-neo-accent/8 px-4 py-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neo-accent" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-neo-text">
              {block.headline || <T>A published bulletin is in force for this region.</T>}
            </p>
            <p className="mt-0.5 text-[11px] text-neo-muted">
              <T>Issued by</T> {block.issuedBy}
              {block.computed && (
                <>
                  {" · "}
                  <T>the model alone reads</T>{" "}
                  <span className="font-semibold text-neo-text">
                    <T>{block.computed.band}</T>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Guidance sits above the evidence: it is the payload, and the drivers
          and charts exist to support it, not to precede it. */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neo-muted">
          <T>What to do</T>
        </h3>
        <AdvisoryList advisories={block.advisories} band={block.band} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Drivers */}
        <div className="rounded-2xl border border-neo-border/50 bg-neo-surface p-4 sm:p-5">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neo-muted">
            <T>What the score is built from</T>
          </h3>
          {block.drivers?.length ? (
            <ul>
              {block.drivers.map((driver) => (
                <DriverRow key={driver.key} driver={driver} />
              ))}
            </ul>
          ) : (
            <p className="py-3 text-sm text-neo-muted">
              <T>No measurements are available for this region right now.</T>
            </p>
          )}

          {hazard === "flood" && !detail.riverine && (
            <p className="mt-3 flex gap-2 rounded-lg bg-neo-bg-soft px-3 py-2 text-[11px] leading-relaxed text-neo-muted">
              <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <T>
                No major monitored river reach falls in this region, so flood risk here is
                scored from rainfall alone. Flooding is typically drainage-related rather
                than riverine.
              </T>
            </p>
          )}

          {hazard === "drought" && drought.spi === null && (
            <p className="mt-3 flex gap-2 rounded-lg bg-neo-bg-soft px-3 py-2 text-[11px] leading-relaxed text-neo-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <T>
                The rainfall anomaly is outside its valid range this month — a 90-day dry
                season total is too close to zero for the index to be meaningful.
              </T>
            </p>
          )}
        </div>

        {/* Cross-reference to the other hazard, so switching the toggle is
            never the only way to notice the region has a second problem. */}
        <div className="rounded-2xl border border-neo-border/50 bg-neo-surface p-4 sm:p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neo-muted">
            <T>Both hazards</T>
          </h3>
          <dl className="space-y-3">
            {["flood", "drought"].map((key) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <dt className="text-sm text-neo-text">
                  <T>{key === "flood" ? "Flood" : "Drought"}</T>
                </dt>
                <dd className="flex items-center gap-2.5">
                  <SeverityMeter band={detail[key]?.band} score={detail[key]?.score} />
                  <SeverityBadge band={detail[key]?.band} />
                </dd>
              </div>
            ))}
          </dl>

          {drought.spi !== null && drought.spi !== undefined && (
            <div className="mt-4 border-t border-neo-border/40 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neo-muted">
                <T>90-day rainfall anomaly</T>
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-neo-text">
                {drought.spi > 0 ? "+" : ""}
                {drought.spi}
                <span className="ml-2 text-xs font-normal text-neo-muted">
                  <T>{drought.spiClass}</T>
                </span>
              </p>
            </div>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-neo-muted">
            <T>
              Both hazards use the same 0-100 scale, so their severities can be compared
              directly.
            </T>{" "}
            <T>Currently dominant:</T>{" "}
            <span className="font-semibold text-neo-text">
              <T>{detail.dominant === "flood" ? "flood" : "drought"}</T>
            </span>
          </p>
        </div>
      </div>

      {/* key={theme} forces the recharts colour read to re-run on a theme flip. */}
      <div className="grid gap-4 lg:grid-cols-2" key={theme}>
        <RainfallAccumulationChart
          series={detail.series}
          normalMm={drought.precip90dNormalMm}
          totalMm={drought.precip90dMm}
        />
        {hazard === "flood" ? (
          <DischargeChart discharge={detail.discharge} riverine={detail.riverine} />
        ) : (
          <SoilMoistureChart series={detail.series} />
        )}
      </div>
    </section>
  );
});

RegionDetail.propTypes = {
  detail: PropTypes.object,
  hazard: PropTypes.oneOf(["flood", "drought"]).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default RegionDetail;
