/**
 * Geometry helpers shared by the Ghana maps.
 *
 * These were duplicated inside WeatherInteractiveMap.jsx; they are pure
 * functions over GeoJSON, so any map that renders the district boundary asset
 * needs exactly the same four. Keeping one copy means a fix to the district
 * name matching benefits every map rather than one of them.
 */

/**
 * Fold a district name down to something comparable.
 *
 * The boundary asset (geoBoundaries ADM2) and the district gazetteer disagree
 * about administrative suffixes -- "Tamale Metropolitan" against "Tamale", and
 * so on -- so both sides are stripped before matching. The Kassena/Kasena
 * substitution is a genuine spelling split between the two sources.
 */
export const normalizeDistrictName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/\bkassena\b/g, "kasena")
    .replace(
      /\b(municipal|municipality|metropolitan|metropolis|district|assembly)\b/g,
      ""
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Convert GeoJSON rings to Leaflet positions.
 *
 * GeoJSON is [lng, lat] and Leaflet is [lat, lng]. Getting this backwards puts
 * Ghana in the Indian Ocean, which is at least easy to spot.
 */
export const toLeafletPositions = (geometry) => {
  if (!geometry?.coordinates) return [];

  const convertRing = (ring) => ring.map(([lng, lat]) => [lat, lng]);

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(convertRing);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygon.map(convertRing));
  }

  return [];
};

/** Collect every [lng, lat] pair out of an arbitrarily nested coordinate array. */
export const flattenCoordinates = (coordinates, result = []) => {
  if (!Array.isArray(coordinates)) return result;

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    result.push(coordinates);
    return result;
  }

  coordinates.forEach((item) => flattenCoordinates(item, result));
  return result;
};

/**
 * Bounding-box centre of a geometry, as [lng, lat].
 *
 * Deliberately the bbox centre rather than a true centroid: it is cheap, and
 * it is only ever used to anchor a label or pick a nearest match, where the
 * difference does not show.
 */
export const getGeometryCenter = (geometry) => {
  const points = flattenCoordinates(geometry?.coordinates);

  if (points.length === 0) return null;

  const bounds = points.reduce(
    (acc, [lng, lat]) => ({
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
    }),
    {
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
    }
  );

  return [
    (bounds.minLng + bounds.maxLng) / 2,
    (bounds.minLat + bounds.maxLat) / 2,
  ];
};
