"""The seasonal outlook, fetched, reduced and stored.

Two sources share one table, ``seasonal_snapshots``:

* ``seas5`` -- ECMWF SEAS5 through Open-Meteo's seasonal API, computed here on
  a daily cron. SEAS5 publishes once a month (on the 5th), so the cron only
  recomputes when the stored run is from an earlier month.
* ``gmet`` -- the Ghana Meteorological Agency's own downscaled seasonal
  forecast, which GMet will publish to Azure Storage. Not wired yet: see
  ``ingest_gmet``. When a GMet snapshot is in force it is served first, and the
  SEAS5 reading travels alongside it, the way a hazard bulletin keeps the
  computed band visible.

**Why sixteen region centres, not the 0.5 degree grid.** The weeks 2-to-4
outlook samples the grid because GEFS is cheap to fetch. SEAS5 returns 51
members for every day of about six months, and Open-Meteo weights a request by
its variables and days, so the full grid would cost a large share of the free
daily quota every month. Sixteen points is a small fraction of it, and it
matches how seasonal forecasts are read: GMet itself reports by zone. The
consequence is stated plainly to the reader: the map shows regions, and has no
district view, because a district map drawn from sixteen points would invent
everything between them.

Same storage design as ``s2s_runtime``: readers load the newest row, a
per-instance copy avoids a database read per request, and only the cron (or a
first reader on an empty table) computes, always inside a hard time limit.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from . import database, open_meteo
from .hazards import GHANA_REGIONS
from .agro_season import (
    FORECAST_REACH_DAYS,
    SEASON_VARIABLES,
    SEASONS,
    WINDOW_VARIABLES,
    WINDOWS,
    Series,
    available_from,
    day_of_year,
    from_day_of_year,
    next_season_year,
    next_window_year,
    on,
    reach_end,
    required_end,
    season_indices,
    sector_of,
    week_label,
    window_bounds,
    window_indices,
)
from .s2s import agreement_confidence, dominant_category, quantile, tercile_probabilities
from .seasonal import is_dry_window, shrink_to_climatology

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"
CLIMATOLOGY_PATH = DATA_DIR / "seasonal_climatology.json"

SEASONAL_URL = "https://seasonal-api.open-meteo.com/v1/seasonal"
SEASONAL_MODEL = "ecmwf_seas5"
DAILY_VARIABLES = ("precipitation_sum", "temperature_2m_max")
MONTHLY_VARIABLES = ("precipitation_anomaly", "temperature_2m_anomaly")

# Enough days to reach the end of the third window from any day of the month,
# inside SEAS5's ~215-day reach.
FORECAST_DAYS = FORECAST_REACH_DAYS + 1

UPSTREAM_TIMEOUT = 40.0
REFRESH_BUDGET_SECONDS = 45.0
RELOAD_INTERVAL_SECONDS = 300.0
RETRY_COOLDOWN_SECONDS = 60.0

# ECMWF publishes SEAS5 on the 5th. A run fetched before then is last month's.
SEAS5_RELEASE_DAY = 5

# A month plus slack: past this the snapshot missed a release and is stale.
STALE_AFTER_DAYS = 35

GHANA_TZ = timezone(timedelta(0))

MODEL_LABEL = "ECMWF SEAS5 (51 members), adjusted to local climate"
BASELINE_LABEL = "ERA5 1995-2024"

DATA_SOURCES = [
    {
        "id": "seas5",
        "label": "ECMWF SEAS5",
        "detail": "Seasonal forecast system, 51 members, through Open-Meteo",
        "url": "https://open-meteo.com/en/docs/seasonal-forecast-api",
    },
    {
        "id": "era5",
        "label": "ERA5",
        "detail": "ECMWF reanalysis, 1995-2024 tercile baseline",
        "url": "https://www.ecmwf.int/en/forecasts/dataset/ecmwf-reanalysis-v5",
    },
]

_SEAS5: dict | None = None
_SEAS5_STAMP: float = 0.0
_GMET: dict | None = None
_LAST_LOAD: float = 0.0
_REFRESH_LOCK = asyncio.Lock()
_LAST_ERROR: str | None = None
_LAST_ATTEMPT: float = 0.0


# ---------------------------------------------------------------------------
# Climatology
# ---------------------------------------------------------------------------

def _load_climatology() -> dict:
    if not CLIMATOLOGY_PATH.exists():
        logger.warning(
            "seasonal climatology missing at %s; run "
            "'python -m backend.scripts.build_seasonal_climatology'.",
            CLIMATOLOGY_PATH,
        )
        return {"regions": {}}
    try:
        return json.loads(CLIMATOLOGY_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        logger.exception("seasonal climatology asset is unreadable")
        return {"regions": {}}


CLIMATOLOGY = _load_climatology()


def _region_clim(region: str) -> dict:
    return (CLIMATOLOGY.get("regions") or {}).get(region) or {}


# ---------------------------------------------------------------------------
# Fetch and reduce
# ---------------------------------------------------------------------------

def _region_points() -> list[tuple[str, float, float]]:
    return [(name, region.lat, region.lon) for name, region in GHANA_REGIONS.items()]


async def _fetch(points: list[tuple[str, float, float]]) -> tuple[list[dict], list[dict]]:
    """The daily members and the monthly anomalies, one request each."""
    base = {
        "latitude": ",".join(f"{lat:.4f}" for _, lat, _ in points),
        "longitude": ",".join(f"{lng:.4f}" for _, _, lng in points),
        "models": SEASONAL_MODEL,
        "timezone": "Africa/Accra",
    }
    daily = await open_meteo.get_json(
        SEASONAL_URL,
        {**base, "daily": ",".join(DAILY_VARIABLES), "forecast_days": FORECAST_DAYS},
        timeout=UPSTREAM_TIMEOUT,
    )
    monthly = await open_meteo.get_json(
        SEASONAL_URL,
        {**base, "monthly": ",".join(MONTHLY_VARIABLES)},
        timeout=UPSTREAM_TIMEOUT,
    )
    as_list = lambda payload: [payload] if isinstance(payload, dict) else list(payload)  # noqa: E731
    return as_list(daily), as_list(monthly)


def _members(daily: dict, variable: str) -> list[list]:
    keys = sorted(key for key in daily if key == variable or key.startswith(f"{variable}_member"))
    return [daily[key] for key in keys]


def _anomaly_lookup(monthly: dict, variable: str) -> dict[str, float | None]:
    times = [stamp[:7] for stamp in monthly.get("time") or []]
    return dict(zip(times, monthly.get(variable) or []))


def _months_between(first: date, last: date) -> list[date]:
    months, cursor = [], date(first.year, first.month, 1)
    while cursor <= last:
        months.append(cursor)
        cursor = date(cursor.year + (cursor.month == 12), cursor.month % 12 + 1, 1)
    return months


def _rain_bias_ratio(members: list[Series], anomalies: dict, monthly_normals: list[float], first: date, last: date) -> float:
    """Observed normal over model normal, for the months ``first`` to ``last`` span.

    The model normal is the ensemble's monthly mean minus Open-Meteo's anomaly
    against the model's own climate, so a model that rains too much has its rain
    scaled down before onset or totals are worked out. Months the forecast or
    the anomalies do not cover are left out; with none left the ratio is 1.
    Clamped, because a near-dry month can make the ratio explode.
    """
    observed = model = 0.0
    for month in _months_between(first, last):
        anomaly = anomalies.get(month.strftime("%Y-%m"))
        month_end = date(month.year + (month.month == 12), month.month % 12 + 1, 1) - timedelta(days=1)
        if anomaly is None or not members or not members[0].covers(month, month_end):
            continue
        mean_total = sum(sum(series.slice(month, month_end)) for series in members) / len(members)
        model += mean_total - float(anomaly)
        observed += monthly_normals[month.month - 1] if monthly_normals else 0.0
    if model <= 0 or observed <= 0:
        return 1.0
    return min(2.0, max(0.5, observed / model))


def _scaled(series: Series, ratio: float) -> Series:
    if ratio == 1.0:
        return series
    return Series(series.first, [None if value is None else float(value) * ratio for value in series.values])


def _probability_block(values: list[float], stats: dict) -> dict:
    """Terciles of the members against the ERA5 boundaries, shrunk to climatology."""
    probabilities = tercile_probabilities(values, stats["p33"], stats["p67"])
    if probabilities is None:
        return {}
    probabilities = shrink_to_climatology(probabilities)
    return {
        "probabilities": {name: round(probabilities[name], 3) for name in ("below", "normal", "above")},
        "category": dominant_category(probabilities),
        "confidence": agreement_confidence(probabilities),
        "noSignal": probabilities["degenerate"],
    }


def _display(variable: str, value: float | None, year: int, *, no_onset_from: float | None = None) -> str | None:
    """How a value reads on screen: a week for dates, days or mm otherwise."""
    if value is None:
        return None
    if variable in ("onset", "cessation"):
        if no_onset_from is not None and value >= no_onset_from:
            return "No clear start in most years" if variable == "onset" else None
        return week_label(from_day_of_year(year, value))
    if variable in ("earlyDrySpell", "lateDrySpell", "rainyDays"):
        return f"{round(value)} days"
    if variable == "rainfallTotal":
        return f"{round(value)} mm"
    if variable == "temperature":
        return f"{value:.1f}°C"
    return str(value)


def _unavailable(variable: str, stats: dict | None, year: int, needed: date, *, sentinel: float | None = None) -> dict:
    normal = (stats or {}).get("median")
    return {
        "available": False,
        "availableFrom": available_from(needed),
        "normal": normal,
        "normalDisplay": _display(variable, normal, year, no_onset_from=sentinel),
    }


def _season_cell(name: str, lat: float, lng: float, rain_members: list[Series], anomalies: dict, key: str, run_day: date) -> dict:
    season = SEASONS[key]
    year = next_season_year(season, run_day)
    clim = _region_clim(name)
    baseline = (clim.get("seasons") or {}).get(key) or {}
    sentinel = day_of_year(on(year, season.onset_end)) + 1
    reach = reach_end(run_day)
    cell: dict = {"id": name, "region": name, "lat": lat, "lng": lng}

    reachable = [
        variable for variable in SEASON_VARIABLES
        if required_end(season, year, variable) <= reach
        and rain_members and rain_members[0].covers(on(year, season.onset_start), required_end(season, year, variable))
    ]
    indices: list[dict] = []
    if reachable:
        ratio = _rain_bias_ratio(
            rain_members, anomalies, clim.get("monthlyRain") or [],
            on(year, season.onset_start), min(on(year, season.season_end), reach),
        )
        indices = [season_indices(_scaled(series, ratio), season, year) for series in rain_members]

    for variable in SEASON_VARIABLES:
        stats = baseline.get(variable)
        needed = required_end(season, year, variable)
        if variable not in reachable or stats is None:
            cell[variable] = _unavailable(variable, stats, year, needed, sentinel=sentinel if variable == "onset" else None)
            continue
        if variable == "onset":
            values = [sentinel if found["onset"] is None else found["onset"] for found in indices]
        else:
            values = [found[variable] for found in indices if found[variable] is not None]
        if not values:
            cell[variable] = _unavailable(variable, stats, year, needed)
            continue
        median = quantile(sorted(values), 0.5)
        block = {
            "available": True,
            "value": round(median, 1),
            "display": _display(variable, median, year, no_onset_from=sentinel if variable == "onset" else None),
            "members": len(values),
            "normal": stats.get("median"),
            "normalDisplay": _display(variable, stats.get("median"), year, no_onset_from=sentinel if variable == "onset" else None),
        }
        block.update(_probability_block(values, stats))
        cell[variable] = block
    return cell


def _window_cell(
    name: str, lat: float, lng: float,
    rain_members: list[Series], temp_members: list[Series],
    rain_anomalies: dict, temp_anomalies: dict, key: str, run_day: date,
) -> dict:
    year = next_window_year(key, run_day)
    first, last = window_bounds(key, year)
    clim = _region_clim(name)
    baseline = (clim.get("windows") or {}).get(key) or {}
    cell: dict = {"id": name, "region": name, "lat": lat, "lng": lng}
    reachable = last <= reach_end(run_day) and bool(rain_members) and rain_members[0].covers(first, last)

    if not reachable:
        for variable in WINDOW_VARIABLES:
            cell[variable] = _unavailable(variable, baseline.get(variable), year, last)
        rain_stats = baseline.get("rainfallTotal") or {}
        cell["rainfallTotal"]["dryWindow"] = is_dry_window(rain_stats.get("mean"))
        return cell

    ratio = _rain_bias_ratio(rain_members, rain_anomalies, clim.get("monthlyRain") or [], first, last)
    found = [window_indices(_scaled(series, ratio), None, key, year) for series in rain_members]
    for variable in ("rainfallTotal", "rainyDays"):
        stats = baseline.get(variable) or {}
        values = [entry[variable] for entry in found]
        median = quantile(sorted(values), 0.5)
        block = {
            "available": True,
            "value": round(median, 1),
            "display": _display(variable, median, year),
            "members": len(values),
            "normal": stats.get("median"),
            "normalDisplay": _display(variable, stats.get("median"), year),
        }
        if stats:
            block.update(_probability_block(values, stats))
        cell[variable] = block
    cell["rainfallTotal"]["dryWindow"] = is_dry_window((baseline.get("rainfallTotal") or {}).get("mean"))

    # Temperature: the model's warm or cool habit is removed by shifting each
    # member by (model normal minus observed normal), the model normal being the
    # ensemble mean minus its own anomaly over the window's months.
    stats = baseline.get("temperature") or {}
    heats = [
        value for value in (
            (sum(series.slice(first, last)) / len(series.slice(first, last))) if series.covers(first, last) else None
            for series in temp_members
        ) if value is not None
    ]
    if not heats or not stats:
        cell["temperature"] = _unavailable("temperature", stats, year, last)
        return cell
    mean_heat = sum(heats) / len(heats)
    anomalies = [temp_anomalies.get(month.strftime("%Y-%m")) for month in _months_between(first, last)]
    shift = 0.0
    if anomalies and all(value is not None for value in anomalies):
        model_norm = mean_heat - sum(float(value) for value in anomalies) / len(anomalies)
        shift = model_norm - float(stats.get("mean", model_norm))
    corrected = [value - shift for value in heats]
    median = quantile(sorted(corrected), 0.5)
    block = {
        "available": True,
        "value": round(median, 2),
        "display": _display("temperature", median, year),
        "members": len(corrected),
        "normal": stats.get("median"),
        "normalDisplay": _display("temperature", stats.get("median"), year),
    }
    block.update(_probability_block(corrected, stats))
    cell["temperature"] = block
    return cell


async def compute_snapshot(run_day: date | None = None) -> dict:
    """Fetch SEAS5 and reduce it to region outlooks per season and window."""
    run_day = run_day or datetime.now(GHANA_TZ).date()
    points = _region_points()
    daily_entries, monthly_entries = await _fetch(points)

    seasons: dict[str, dict] = {key: {"cells": []} for key in SEASONS}
    windows: dict[str, dict] = {key: {"cells": []} for key in WINDOWS}
    for index, (name, lat, lng) in enumerate(points):
        if index >= len(daily_entries) or index >= len(monthly_entries):
            break
        try:
            daily = daily_entries[index].get("daily") or {}
            monthly = monthly_entries[index].get("monthly") or {}
            times = daily.get("time") or []
            if not times:
                continue
            first_day = date.fromisoformat(times[0][:10])
            rain_members = [Series(first_day, series) for series in _members(daily, "precipitation_sum")]
            temp_members = [Series(first_day, series) for series in _members(daily, "temperature_2m_max")]
            rain_anomalies = _anomaly_lookup(monthly, "precipitation_anomaly")
            temp_anomalies = _anomaly_lookup(monthly, "temperature_2m_anomaly")
            for key, season in SEASONS.items():
                if season.sector == sector_of(name):
                    seasons[key]["cells"].append(_season_cell(name, lat, lng, rain_members, rain_anomalies, key, run_day))
            for key in WINDOWS:
                windows[key]["cells"].append(
                    _window_cell(name, lat, lng, rain_members, temp_members, rain_anomalies, temp_anomalies, key, run_day)
                )
        except Exception:
            logger.exception("failed to reduce %s", name)

    for key, season in SEASONS.items():
        seasons[key].update({"key": key, "label": season.label, "year": next_season_year(season, run_day), "sector": season.sector})
    for key, (start_month, label) in WINDOWS.items():
        year = next_window_year(key, run_day)
        windows[key].update({"key": key, "label": label, "year": year, "start": window_bounds(key, year)[0].isoformat(), "end": window_bounds(key, year)[1].isoformat()})

    if not any(block["cells"] for block in seasons.values()) and not any(block["cells"] for block in windows.values()):
        raise RuntimeError("upstream returned no usable regions")
    return {"source": "seas5", "runDate": run_day.isoformat(), "reachEnd": reach_end(run_day).isoformat(), "seasons": seasons, "windows": windows}


# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------

def _stamp_to_epoch(stamp: str) -> float:
    return datetime.strptime(stamp, database.TIMESTAMP_FORMAT).replace(tzinfo=timezone.utc).timestamp()


def store_snapshot(snapshot: dict, *, source: str = "seas5", valid_from: str | None = None, valid_to: str | None = None) -> float:
    """Write a snapshot. Older rows of the same source are removed."""
    stamp = database.utc_stamp()
    with database.get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO seasonal_snapshots (source, run_date, computed_at, valid_from, valid_to, payload) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                source,
                snapshot.get("runDate") or stamp[:10],
                stamp,
                valid_from,
                valid_to,
                json.dumps(snapshot, separators=(",", ":")),
            ),
        )
        connection.execute(
            "DELETE FROM seasonal_snapshots WHERE source = ? AND id < ?",
            (source, cursor.lastrowid),
        )
    return _stamp_to_epoch(stamp)


def _read_latest() -> tuple[dict | None, float, dict | None]:
    """The newest SEAS5 row, and the newest GMet row in force today."""
    now = database.utc_stamp()
    with database.get_connection() as connection:
        seas5 = connection.execute(
            "SELECT computed_at, payload FROM seasonal_snapshots WHERE source = 'seas5' ORDER BY id DESC LIMIT 1"
        ).fetchone()
        gmet = connection.execute(
            "SELECT computed_at, valid_from, valid_to, payload FROM seasonal_snapshots "
            "WHERE source = 'gmet' AND (valid_from IS NULL OR valid_from <= ?) "
            "AND (valid_to IS NULL OR valid_to >= ?) ORDER BY id DESC LIMIT 1",
            (now, now),
        ).fetchone()
    seas5_payload, seas5_stamp = None, 0.0
    if seas5 is not None:
        row = dict(seas5)
        seas5_payload, seas5_stamp = json.loads(row["payload"]), _stamp_to_epoch(row["computed_at"])
    gmet_payload = json.loads(dict(gmet)["payload"]) if gmet is not None else None
    return seas5_payload, seas5_stamp, gmet_payload


async def load_snapshot(force: bool = False) -> None:
    global _SEAS5, _SEAS5_STAMP, _GMET, _LAST_LOAD
    now = time.monotonic()
    if not force and _SEAS5 and now - _LAST_LOAD < RELOAD_INTERVAL_SECONDS:
        return
    _LAST_LOAD = now
    try:
        seas5, stamp, gmet = await asyncio.to_thread(_read_latest)
    except Exception:
        logger.exception("could not read the stored seasonal snapshot")
        return
    if seas5 and stamp >= _SEAS5_STAMP:
        _SEAS5, _SEAS5_STAMP = seas5, stamp
    _GMET = gmet


def needs_new_run(today: date | None = None) -> bool:
    """True when SEAS5 has published a run newer than the stored one."""
    if not _SEAS5:
        return True
    today = today or datetime.now(GHANA_TZ).date()
    try:
        stored = date.fromisoformat(_SEAS5["runDate"])
    except (KeyError, ValueError):
        return True
    if (today - stored).days > STALE_AFTER_DAYS:
        return True
    released_this_month = today.day >= SEAS5_RELEASE_DAY
    stored_before_release = (stored.year, stored.month) < (today.year, today.month) or stored.day < SEAS5_RELEASE_DAY
    return released_this_month and stored_before_release


def is_stale() -> bool:
    if not _SEAS5:
        return True
    try:
        stored = date.fromisoformat(_SEAS5["runDate"])
    except (KeyError, ValueError):
        return True
    return (datetime.now(GHANA_TZ).date() - stored).days > STALE_AFTER_DAYS


async def refresh(force: bool = False) -> bool:
    """Fetch, reduce and store SEAS5. True when new data was stored."""
    global _SEAS5, _SEAS5_STAMP, _LAST_ERROR, _LAST_ATTEMPT
    if not force and not needs_new_run():
        return False
    if not force and _LAST_ERROR and time.time() - _LAST_ATTEMPT < RETRY_COOLDOWN_SECONDS:
        return False

    async with _REFRESH_LOCK:
        if not force and not needs_new_run():
            return False
        _LAST_ATTEMPT = time.time()
        try:
            snapshot = await asyncio.wait_for(compute_snapshot(), REFRESH_BUDGET_SECONDS)
        except asyncio.TimeoutError:
            _LAST_ERROR = "upstream took too long"
            logger.warning("seasonal refresh failed: %s", _LAST_ERROR)
            return False
        except Exception as exc:
            _LAST_ERROR = open_meteo.describe(exc)
            logger.warning("seasonal refresh failed: %s", _LAST_ERROR)
            return False
        try:
            stamp = await asyncio.to_thread(store_snapshot, snapshot)
        except Exception:
            logger.exception("could not store the seasonal snapshot")
            stamp = time.time()
        _SEAS5, _SEAS5_STAMP = snapshot, stamp
        _LAST_ERROR = None
        return True


def is_refreshing() -> bool:
    return _REFRESH_LOCK.locked()


async def ensure_fresh() -> None:
    """Make sure there is something to serve, computing only on an empty table."""
    await load_snapshot()
    if _SEAS5 or is_refreshing():
        return
    if _LAST_ERROR and time.time() - _LAST_ATTEMPT < RETRY_COOLDOWN_SECONDS:
        return
    await refresh(force=True)


def last_error() -> str | None:
    return _LAST_ERROR


def reset_cache() -> None:
    """Tests only."""
    global _SEAS5, _SEAS5_STAMP, _GMET, _LAST_LOAD, _LAST_ERROR, _LAST_ATTEMPT
    _SEAS5, _SEAS5_STAMP, _GMET = None, 0.0, None
    _LAST_LOAD, _LAST_ERROR, _LAST_ATTEMPT = 0.0, None, 0.0


# ---------------------------------------------------------------------------
# What the endpoint serves
# ---------------------------------------------------------------------------

def current() -> dict:
    """The outlook to show: GMet's when one is in force, otherwise SEAS5.

    With GMet in force the SEAS5 reading travels as ``modelSeasons`` and
    ``modelWindows``, so the app can show what the model alone reads, as the
    hazard screen does for an issued bulletin.
    """
    seas5 = _SEAS5 or {}
    if _GMET:
        return {
            "source": "gmet",
            "issuedBy": _GMET.get("issuedBy") or "Ghana Meteorological Agency",
            "issuedAt": _GMET.get("issuedAt"),
            "validFrom": _GMET.get("validFrom"),
            "validTo": _GMET.get("validTo"),
            "pdfUrl": _GMET.get("pdfUrl"),
            "runDate": _GMET.get("runDate"),
            "reachEnd": _GMET.get("reachEnd"),
            "seasons": _GMET.get("seasons") or {},
            "windows": _GMET.get("windows") or {},
            "modelSeasons": seas5.get("seasons") or {},
            "modelWindows": seas5.get("windows") or {},
        }
    return {
        "source": "seas5",
        "issuedBy": None,
        "runDate": seas5.get("runDate"),
        "reachEnd": seas5.get("reachEnd"),
        "seasons": seas5.get("seasons") or {},
        "windows": seas5.get("windows") or {},
        "modelSeasons": {},
        "modelWindows": {},
    }


def metadata() -> dict:
    issued = (
        datetime.fromtimestamp(_SEAS5_STAMP, tz=timezone.utc).isoformat().replace("+00:00", "Z")
        if _SEAS5_STAMP
        else None
    )
    empty = not _SEAS5 and not _GMET
    return {
        "model": MODEL_LABEL,
        "baseline": BASELINE_LABEL,
        "geography": "region",
        "issuedAt": issued,
        "stale": is_stale(),
        "hasClimatology": bool(CLIMATOLOGY.get("regions")),
        "sources": DATA_SOURCES,
        "error": _LAST_ERROR,
        "computing": empty and is_refreshing(),
        "fetchFailed": empty and _LAST_ERROR is not None and not is_refreshing(),
    }


# ---------------------------------------------------------------------------
# GMet's downscaled forecast (not wired yet)
# ---------------------------------------------------------------------------

GMET_PAYLOAD_CONTRACT = """
A GMet seasonal snapshot must have the same shape as a SEAS5 one, so the app
needs no second code path:

{
  "source": "gmet",
  "issuedBy": "Ghana Meteorological Agency",
  "issuedAt": "2027-02-24",
  "validFrom": "2027-03-01 00:00:00",   # UTC, database timestamp format
  "validTo": "2027-11-30 23:59:59",
  "pdfUrl": "https://...",               # optional, the published bulletin
  "runDate": "2027-02-24",
  "seasons": {
    "southern-major": {"key": "southern-major", "label": "Southern Major Season",
      "year": 2027, "sector": "south",
      "cells": [{"id": "Ashanti", "region": "Ashanti", "lat": 6.7, "lng": -1.6,
        "onset":         {"available": true, "value": 80, "display": "Week 3 of March",
                          "normal": 75, "normalDisplay": "Week 2 of March",
                          "probabilities": {"below": 0.2, "normal": 0.35, "above": 0.45},
                          "category": "above", "confidence": "moderate", "noSignal": false},
        "cessation":     {...same keys...},
        "earlyDrySpell": {...value in days...},
        "lateDrySpell":  {...}}]},
    "southern-minor": {...}, "northern": {...}
  },
  "windows": {
    "MAM": {"key": "MAM", "label": "March to May", "year": 2027,
      "cells": [{"id": "Ashanti", ..., "rainfallTotal": {..., "dryWindow": false},
                 "rainyDays": {...}, "temperature": {...}}]},
    "MJJ": {...}, "JAS": {...}
  }
}

Region names are the sixteen in ``hazards.GHANA_REGIONS``. Onset and cessation
values are day of year. "below" means earlier (dates) or less (amounts).
Store it with ``store_snapshot(payload, source="gmet", valid_from=..., valid_to=...)``.
"""


async def ingest_gmet() -> dict:
    """Pull GMet's latest downscaled seasonal forecast from Azure Storage.

    Not implemented until GMet publishes the feed and its file format is known.
    The endpoint that calls this already exists and is admin-only, so wiring the
    feed is a change to this function alone: read ``config.AZURE_SEASONAL_URL``,
    convert the files to ``GMET_PAYLOAD_CONTRACT``, then ``store_snapshot``.
    """
    from . import config

    if not config.AZURE_SEASONAL_URL:
        raise RuntimeError("AZURE_SEASONAL_URL is not configured.")
    raise NotImplementedError("GMet seasonal ingest is not built yet: the Azure feed format is not known.")
