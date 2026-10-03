"""Bake the seasonal tercile baseline into a committed JSON asset.

Run manually, not on a request path:

    python -m backend.scripts.build_seasonal_climatology

It needs no network. ``build_s2s_climatology`` already downloaded thirty years
of daily ERA5 for every 0.5 degree cell over Ghana into
``backend/app/data/.s2s_grid_cache.json`` (gitignored); this reads that cache.
Run that script first on a machine without it.

**What it computes.** For each of Ghana's sixteen regions, across 1995 to 2024,
the 33rd, 50th and 67th percentiles of:

* onset date, cessation date and the early and late dry spells, for each season
  the region has (the south's major and minor seasons, or the north's single
  season), using the rules in ``app/agro_season.py``;
* rainfall total, number of rainy days and mean daily maximum temperature over
  the fixed MAM, MJJ, JAS and SON windows.

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
from backend.app.agro_season import (  # noqa: E402
    SEASON_VARIABLES,
    SEASONS,
    WINDOW_VARIABLES,
    WINDOWS,
    Season,
    Series,
    day_of_year,
    on,
    season_indices,
    sector_of,
    window_bounds,
    window_indices,
)

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


def _stats(values: list[float], *, decimals: int) -> dict:
    ordered = sorted(values)
    return {
        "n": len(ordered),
        "p33": round(quantile(ordered, 1 / 3), decimals),
        "p67": round(quantile(ordered, 2 / 3), decimals),
        "median": round(quantile(ordered, 0.5), decimals),
        "mean": round(sum(ordered) / len(ordered), decimals),
    }


def _season_baseline(rain: Series, season: Season) -> dict:
    """Onset, cessation and dry spells across 1995-2024 for one region.

    A year with no onset counts as the latest possible start (the day after the
    search ends) for the onset percentiles, the same way the forecast counts a
    member with no onset, and adds nothing to the other three variables.
    """
    collected: dict[str, list[float]] = {name: [] for name in SEASON_VARIABLES}
    no_onset = 0
    years = range(START.year, END.year + 1)
    for year in years:
        if on(year, season.season_end) > END:
            continue
        found = season_indices(rain, season, year)
        if found["onset"] is None:
            no_onset += 1
            collected["onset"].append(day_of_year(on(year, season.onset_end)) + 1)
            continue
        for name in SEASON_VARIABLES:
            collected[name].append(found[name])
    baseline = {name: _stats(values, decimals=1) for name, values in collected.items() if values}
    baseline["onset"]["noOnsetShare"] = round(no_onset / len(collected["onset"]), 3)
    return baseline


def _window_baseline(rain: Series, temp: Series, key: str) -> dict:
    collected: dict[str, list[float]] = {name: [] for name in WINDOW_VARIABLES}
    for year in range(START.year, END.year + 1):
        _, last = window_bounds(key, year)
        if last > END:
            continue
        found = window_indices(rain, temp, key, year)
        for name in WINDOW_VARIABLES:
            if found[name] is not None:
                collected[name].append(found[name])
    return {
        "rainfallTotal": _stats(collected["rainfallTotal"], decimals=1),
        "rainyDays": _stats(collected["rainyDays"], decimals=1),
        "temperature": _stats(collected["temperature"], decimals=2),
    }


def _monthly_rain_normals(rain: Series) -> list[float]:
    """Mean rainfall total of each calendar month, January first.

    The runtime scales each forecast's daily rain by observed normal over model
    normal for the months a season spans, so it needs these per month.
    """
    totals = [[] for _ in range(12)]
    for year in range(START.year, END.year + 1):
        for month in range(1, 13):
            first = date(year, month, 1)
            last = (date(year + (month == 12), month % 12 + 1, 1)) - timedelta(days=1)
            totals[month - 1].append(sum(rain.slice(first, last)))
    return [round(sum(values) / len(values), 1) for values in totals]


def build() -> dict:
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    points = ghana_grid_points()
    regions: dict[str, dict] = {}
    for name, region in GHANA_REGIONS.items():
        if nearest_cell(region.lat, region.lon, points) is None:
            raise SystemExit(f"{name} falls outside the grid")
        rain_key = nearest_clean_cell(region.lat, region.lon, cache, points, "precipitation")
        temp_key = nearest_clean_cell(region.lat, region.lon, cache, points, "temperature")
        rain = Series(START, cache[rain_key]["precipitation"])
        temp = Series(START, cache[temp_key]["temperature"])
        seasons = {
            key: _season_baseline(rain, season)
            for key, season in SEASONS.items()
            if season.sector == sector_of(name)
        }
        windows = {key: _window_baseline(rain, temp, key) for key in WINDOWS}
        regions[name] = {
            "lat": region.lat,
            "lng": region.lon,
            "sector": sector_of(name),
            "rainCell": rain_key,
            "tempCell": temp_key,
            "seasons": seasons,
            "windows": windows,
            "monthlyRain": _monthly_rain_normals(rain),
        }
    return {
        "baseline": "ERA5 1995-2024",
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
