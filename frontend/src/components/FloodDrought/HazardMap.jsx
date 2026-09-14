import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { MapContainer, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import T from "../common/T";
import useT from "../../hooks/useT";
import { useTheme } from "../../contexts/ThemeContext";
import { toLeafletPositions } from "../../utils/ghanaGeo";
import ghanaRegionBoundaries from "../../assets/ghana-region-boundaries.json";
import { bandMapStyle, bandMeta } from "./severity";

// Ghana's actual extent. Framing on bounds rather than a centre/zoom pair is
// what stops the country sitting in one corner with dead ocean filling the
// rest of the panel -- a fixed zoom cannot suit both a phone and a desktop.
const GHANA_BOUNDS = [
  [4.5, -3.35],
  [11.25, 1.25],
];

const TILE_LAYERS = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

/**
 * Re-fits Ghana to the panel whenever the panel changes size.
 *
 * The map lives in a responsive grid cell, so its pixel size is not known at
 * mount and changes at every breakpoint. Without this the country is framed for
 * whatever width happened to exist on first paint.
 */
function FitGhana() {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(GHANA_BOUNDS, { padding: [10, 10], animate: false });
    };
    const timer = setTimeout(fit, 60);

    const container = map.getContainer();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(container);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}

export default function HazardMap({ regions, hazard, selected, onSelect, listId }) {
  const { t } = useT();
  const { theme } = useTheme();

  const bandByRegion = useMemo(() => {
    const map = new Map();
    regions.forEach((region) => map.set(region.region, region[hazard]?.band));
    return map;
  }, [regions, hazard]);

  /**
   * One polygon per region.
   *
   * This used to tint 258 individual district shapes by their parent region,
   * which stroked every internal district border across what is meant to read
   * as a single region -- and pulled a 2.9 MB asset onto the route to do it.
   * The dissolved region file is 32 KB and its `properties.name` matches the
   * API's region names exactly, so the district-name matching and the
   * nearest-centroid fallback are gone with it.
   *
   * A few regions are multi-part (Greater Accra is six pieces of coastline), so
   * their rings are combined into one Leaflet multi-polygon: one fill, one
   * outline, one click target.
   */
  const shapes = useMemo(() => {
    const byName = new Map();
    ghanaRegionBoundaries.regions.forEach((feature) => {
      const name = feature.properties?.name;
      if (!name) return;
      byName.set(name, [...(byName.get(name) ?? []), toLeafletPositions(feature.geometry)]);
    });
    return Array.from(byName, ([region, parts]) => ({ region, positions: parts.flat() }));
  }, []);

  const tiles = TILE_LAYERS[theme === "dark" ? "dark" : "light"];

  const summary = useMemo(() => {
    const elevated = regions.filter((region) =>
      ["moderate", "severe", "extreme"].includes(region[hazard]?.band)
    );
    if (elevated.length === 0) {
      return t("Map of Ghana. No region is above normal {{hazard}} risk.", { hazard });
    }
    return t("Map of Ghana. {{count}} regions above normal {{hazard}} risk: {{names}}.", {
      count: String(elevated.length),
      hazard,
      names: elevated.map((region) => region.region).join(", "),
    });
  }, [regions, hazard, t]);

  return (
    <div className="relative h-[380px] overflow-hidden rounded-2xl border border-neo-border/50 bg-neo-surface sm:h-[520px] lg:h-[600px]">
      {/* Leaflet layers are technically focusable but a poor keyboard target,
          so the map is described as one image and the ranked list beside it is
          the real accessible equivalent. */}
      <a
        href={`#${listId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[1000] focus:rounded-lg focus:bg-neo-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-neo-text focus:ring-2 focus:ring-neo-focus"
      >
        <T>Skip map, go to the region list</T>
      </a>

      <div role="img" aria-label={summary} className="h-full w-full">
        <MapContainer
          bounds={GHANA_BOUNDS}
          boundsOptions={{ padding: [10, 10] }}
          // Leaflet snaps to integer zoom levels by default, so fitBounds has
          // to round DOWN to make the bounds fit -- which left Ghana at roughly
          // half the panel height with dead space all round. Fractional zoom
          // lets the country actually fill the space it was given.
          zoomSnap={0}
          zoomDelta={0.5}
          minZoom={4}
          maxZoom={9}
          // Scroll must not be hijacked while a reader is moving down the page.
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl
          className="h-full w-full bg-neo-surface"
        >
          <FitGhana />
          <TileLayer url={tiles.url} attribution={tiles.attribution} subdomains="abcd" />

          {shapes.map(({ region, positions }) => {
            const band = bandByRegion.get(region);
            if (!band) return null;
            const active = region === selected;

            return (
              <Polygon
                key={region}
                positions={positions}
                pathOptions={bandMapStyle(band, { selected: active })}
                eventHandlers={{ click: () => onSelect(region) }}
              >
                <Tooltip sticky>
                  <span className="text-xs font-semibold">{region}</span>
                  <span className="text-xs"> · {bandMeta(band).label}</span>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

HazardMap.propTypes = {
  regions: PropTypes.arrayOf(PropTypes.object).isRequired,
  hazard: PropTypes.oneOf(["flood", "drought"]).isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  listId: PropTypes.string.isRequired,
};
