import PropTypes from "prop-types";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CloudOff } from "lucide-react";

import PageTitle from "../components/PageTitle";
import Breadcrumb from "../components/common/Breadcrumb";
import T from "../components/common/T";
import { SkeletonBlock } from "../components/common/SkeletonLoading";
import { useHazardData, useRegionHazard } from "../hooks/useHazardData";
import HazardStatusBar from "../components/FloodDrought/HazardStatusBar";
import HazardToggle from "../components/FloodDrought/HazardToggle";
import NationalOutlook from "../components/FloodDrought/NationalOutlook";
import RegionRiskList from "../components/FloodDrought/RegionRiskList";
import RegionDetail from "../components/FloodDrought/RegionDetail";
import MethodologyNote from "../components/FloodDrought/MethodologyNote";
import HazardMapLegend from "../components/FloodDrought/HazardMapLegend";
import { bySeverity } from "../components/FloodDrought/severity";

// Leaflet plus 3 MB of district polygons is by far the heaviest thing on this
// route. Splitting it out lets the national figures and the ranked list — the
// parts a reader actually needs first — paint without waiting for either.
const HazardMap = lazy(() => import("../components/FloodDrought/HazardMap"));

const REGION_LIST_ID = "hazard-region-list";

function PageShell({ children }) {
  return (
    <>
      <PageTitle title="Flood & Drought Monitor" />
      <div className="neo-page min-h-screen pt-32 md:pt-36">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </>
  );
}

PageShell.propTypes = { children: PropTypes.node };

function LoadingState() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-10 w-72" tone="neo" />
      <SkeletonBlock className="h-12 w-full" tone="neo" rounded="rounded-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonBlock key={index} className="h-24" tone="neo" rounded="rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SkeletonBlock className="h-[520px]" tone="neo" rounded="rounded-2xl" />
        <SkeletonBlock className="h-[520px]" tone="neo" rounded="rounded-2xl" />
      </div>
    </div>
  );
}

export default function FloodDrought() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { regions, national, meta, unavailable, loading, error, refresh } = useHazardData();

  const hazard = searchParams.get("hazard") === "drought" ? "drought" : "flood";
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get("region") || null);
  const [refreshing, setRefreshing] = useState(false);
  const detailRef = useRef(null);
  const userPicked = useRef(false);

  const setHazard = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams);
      params.set("hazard", next);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Default to the region that most needs attention, so the detail panel is
  // never empty and the page opens on the thing worth reading.
  useEffect(() => {
    if (userPicked.current || !regions.length) return;
    const known = regions.some((region) => region.region === selectedRegion);
    if (known) return;
    const ranked = [...regions].sort(bySeverity(hazard));
    setSelectedRegion(ranked[0]?.region || null);
  }, [regions, hazard, selectedRegion]);

  const handleSelect = useCallback(
    (region) => {
      userPicked.current = true;
      setSelectedRegion(region);
      const params = new URLSearchParams(searchParams);
      params.set("region", region);
      setSearchParams(params, { replace: true });
      // Move focus to the detail heading so a keyboard user is taken to the
      // content their activation produced, rather than being left in the list.
      requestAnimationFrame(() => detailRef.current?.focus());
    },
    [searchParams, setSearchParams]
  );

  const { detail, loading: detailLoading, error: detailError } = useRegionHazard(selectedRegion);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const toggleCounts = useMemo(
    () => ({
      flood: national?.floodElevated || 0,
      drought: national?.droughtElevated || 0,
    }),
    [national]
  );

  if (loading && !regions.length) {
    return (
      <PageShell>
        <Breadcrumb />
        <LoadingState />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Breadcrumb />

      {/* Title. Plain text, no gradient: a monitoring console that decorates
          its own headline undercuts the seriousness of what it reports. */}
      <header className="mb-4">
        <span className="mb-2 inline-block rounded-full bg-neo-accent/12 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neo-accent">
          <T>Hydrometeorological monitoring</T>
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-neo-text lg:text-4xl">
          <T>Flood &amp; Drought</T>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neo-muted sm:text-base">
          <T>
            Current flood and drought conditions across Ghana&apos;s sixteen regions, measured
            against a thirty-year baseline and updated through the day.
          </T>
        </p>
      </header>

      <div className="space-y-4">
        <HazardStatusBar meta={meta} onRefresh={handleRefresh} refreshing={refreshing} />

        {error && regions.length > 0 && (
          <p className="rounded-xl border border-neo-warning/40 bg-neo-warning/10 px-4 py-2.5 text-sm text-neo-text">
            <T>Could not refresh just now — the readings below are the last ones received.</T>
          </p>
        )}

        {unavailable || (!regions.length && !loading) ? (
          <div className="rounded-2xl border border-neo-border/50 bg-neo-surface px-6 py-12 text-center">
            <CloudOff className="mx-auto mb-3 h-10 w-10 text-neo-muted" aria-hidden="true" />
            <p className="text-base font-semibold text-neo-text">
              <T>Readings are not available right now</T>
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neo-muted">
              <T>
                The upstream weather and river services could not be reached. Nothing is shown
                here rather than an estimate, because a guessed flood risk is worse than none.
              </T>
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neo-accent px-4 py-2.5 text-sm font-semibold text-neo-on-accent transition-colors hover:bg-neo-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus disabled:opacity-60"
            >
              <T>Try again</T>
            </button>
          </div>
        ) : (
          <>
            <NationalOutlook national={national} />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <HazardToggle value={hazard} onChange={setHazard} counts={toggleCounts} />
              <HazardMapLegend />
            </div>

            {/* The list comes first in source order and stays first on narrow
                screens: a ranked list answers "who is worst off" better than a
                map, and it is the accessible equivalent of the choropleth. */}
            {/* Ghana is a portrait country -- roughly 6.7 degrees of latitude
                against 4.6 of longitude. Fitting it into a wide cell leaves
                enormous dead margins, so the map column is deliberately the
                narrower of the two and the ranked list takes the rest. That
                also matches which one is doing the work. */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
              <div className="order-2 lg:order-1">
                <Suspense
                  fallback={
                    <SkeletonBlock
                      className="h-[380px] sm:h-[520px] lg:h-[600px]"
                      tone="neo"
                      rounded="rounded-2xl"
                    />
                  }
                >
                  <HazardMap
                    regions={regions}
                    hazard={hazard}
                    selected={selectedRegion}
                    onSelect={handleSelect}
                    listId={REGION_LIST_ID}
                  />
                </Suspense>
              </div>
              <div className="order-1 lg:order-2">
                <RegionRiskList
                  id={REGION_LIST_ID}
                  regions={regions}
                  hazard={hazard}
                  selected={selectedRegion}
                  onSelect={handleSelect}
                />
              </div>
            </div>

            <RegionDetail
              ref={detailRef}
              detail={detail}
              hazard={hazard}
              loading={detailLoading}
              error={detailError}
            />

            <MethodologyNote meta={meta} />
          </>
        )}

        <footer className="border-t border-neo-border/50 pt-5 text-xs leading-relaxed text-neo-muted">
          <p>
            <T>
              Weather and river data by Open-Meteo, using ECMWF ERA5 and the Copernicus Global
              Flood Awareness System. Published bulletins are issued by the Ghana
              Meteorological Agency.
            </T>
          </p>
          <p className="mt-1.5 flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <T>
              These are regional indicators, not a substitute for official warnings. In an
              emergency, follow NADMO instructions for your district.
            </T>
          </p>
        </footer>
      </div>
    </PageShell>
  );
}
