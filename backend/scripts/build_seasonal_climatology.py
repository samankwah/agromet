"""Bake the seasonal tercile baseline into a committed JSON asset.

Run manually, not on a request path:

    python -m backend.scripts.build_seasonal_climatology

It needs no network. ``build_s2s_climatology`` already downloaded thirty years
of daily ERA5 for every 0.5 degree cell over Ghana into
``backend/app/data/.s2s_grid_cache.json`` (gitignored); this reads that cache.
Run that script first on a machine without it.

**What it computes.** For each of Ghana's sixteen regions and each of the twelve
three-month windows (Jan to Mar, Feb to Apr, ... Dec to Feb), the 33rd and 67th
percentiles and the mean of the window's rainfall total and of its mean daily
maximum temperature, across 1995 to 2024: 30 samples, 29 for the windows that
wrap into the next year.

**Why regions, not the grid.** The seasonal forecast is sampled at the sixteen
region centres (see ``seasonal_runtime``), so the baseline must be too. Each
region takes the grid cell nearest its centre.

**Broken cells are skipped.** A handful of cells in the archive change abruptly
in 2017: the Greater Accra coastal cell's daily maximum drops about 4 C, and
several western forest cells gain 70 to 80% more rain, while their neighbours
stay flat. That is a change of data source, not climate, and a baseline that
straddles it splits "normal" between two regimes. So for each region and
variable the nearest cell *without* such a step is used, and the asset records
which cell that was.
"""

from __future__ import annotations

import json
import sys
from datetime import date, timedelta
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT.parent))

from backend.app.hazards import GHANA_REGIONS  # noqa: E402
from backend.app.s2s import cell_id, ghana_grid_points, nearest_cell, quantile  # noqa: E402
from backend.app.seasonal import WINDOW_MONTHS, add_months  # noqa: E402

CACHE_PATH = BACKEND_ROOT / "app" / "data" / ".s2s_grid_cache.json"
OUTPUT_PATH = BACKEND_ROOT / "app" / "data" / "seasonal_climatology.json"

START = date(1995, 1, 1)
END = date(2024, 12, 31)

# Where the archive's source change shows up, and how big a step counts as one.
BREAK_YEAR = 2017
TEMP_STEP_C = 1.5
RAIN_STEP_RATIO = 1.6


def has_break(series: list, *, rain: bool) -> bool:
    """True when the record steps abruptly at ``BREAK_YEAR``."""
    cut = (date(BREAK_YEAR, 1, 1) - START).days
    before = [float(value) for value in series[:cut] if value is not None]
    after = [float(value) for value in series[cut:] if value is not None]
    if not before or not after:
        return True
    mean_before = sum(before) / len(before)
    mean_after = sum(after) / len(after)
    if rain:
        if mean_before <= 0:
            return False
        ratio = mean_after / mean_before
        return ratio > RAIN_STEP_RATIO or ratio < 1 / RAIN_STEP_RATIO
    return abs(mean_after - mean_before) > TEMP_STEP_C


def nearest_clean_cell(lat: float, lng: float, cache: dict, points: list, variable: str) -> str:
    """The nearest grid cell whose ``variable`` record has no source break."""
    ranked = sorted(points, key=lambda p: (p[0] - lat) ** 2 + (p[1] - lng) ** 2)
    for point in ranked:
        key = cell_id(*point)
        if key in cache and not has_break(cache[key][variable], rain=variable == "precipitation"):
            return key
    raise SystemExit(f"no clean {variable} cell near {lat},{lng}")


def _window_samples(precip: list, temp: list, start_month: int) -> tuple[list[float], list[float]]:
    rain_totals: list[float] = []
    temp_means: list[float] = []
    for year in range(START.year, END.year + 1):
        first = date(year, start_month, 1)
        last = add_months(first, WINDOW_MONTHS) - timedelta(days=1)
        if last > END:
            continue
        lo = (first - START).days
        hi = (last - START).days + 1
        rain = precip[lo:hi]
        heat = temp[lo:hi]
        if len(rain) < hi - lo or any(value is None for value in rain) or any(value is None for value in heat):
            continue
        rain_totals.append(sum(float(value) for value in rain))
        temp_means.append(sum(float(value) for value in heat) / len(heat))
    return rain_totals, temp_means


def build() -> dict:
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    points = ghana_grid_points()
    regions: dict[str, dict] = {}
    for name, region in GHANA_REGIONS.items():
        if nearest_cell(region.lat, region.lon, points) is None:
            raise SystemExit(f"{name} falls outside the grid")
        rain_key = nearest_clean_cell(region.lat, region.lon, cache, points, "precipitation")
        temp_key = nearest_clean_cell(region.lat, region.lon, cache, points, "temperature")
        windows: dict[str, dict] = {}
        for month in range(1, 13):
            rain, _ = _window_samples(cache[rain_key]["precipitation"], cache[rain_key]["temperature"], month)
            _, heat = _window_samples(cache[temp_key]["precipitation"], cache[temp_key]["temperature"], month)
            rain.sort()
            heat.sort()
            windows[f"{month:02d}"] = {
                "n": len(rain),
                "rainP33": round(quantile(rain, 1 / 3), 1),
                "rainP67": round(quantile(rain, 2 / 3), 1),
                "rainNormal": round(sum(rain) / len(rain), 1),
                "tempP33": round(quantile(heat, 1 / 3), 2),
                "tempP67": round(quantile(heat, 2 / 3), 2),
                "tempNormal": round(sum(heat) / len(heat), 2),
            }
        regions[name] = {
            "lat": region.lat,
            "lng": region.lon,
            "rainCell": rain_key,
            "tempCell": temp_key,
            "windows": windows,
        }
    return {
        "baseline": "ERA5 1995-2024",
        "windowMonths": WINDOW_MONTHS,
        "builtAt": date.today().isoformat(),
        "regions": regions,
    }


def main() -> None:
    if not CACHE_PATH.exists():
        raise SystemExit(f"{CACHE_PATH} is missing. Run build_s2s_climatology first.")
    OUTPUT_PATH.write_text(json.dumps(build(), indent=1), encoding="utf-8")
    print(f"wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
