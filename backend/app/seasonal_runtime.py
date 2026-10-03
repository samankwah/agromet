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
from .seasonal import (
    is_dry_window,
    months_in_window,
    reduce_window,
    summarise_variable,
    upcoming_windows,
)

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"
CLIMATOLOGY_PATH = DATA_DIR / "seasonal_climatology.json"

SEASONAL_URL = "https://seasonal-api.open-meteo.com/v1/seasonal"
SEASONAL_MODEL = "ecmwf_seas5"
DAILY_VARIABLES = ("precipitation_sum", "temperature_2m_max")
MONTHLY_VARIABLES = ("precipitation_anomaly", "temperature_2m_anomaly")

# Enough days to reach the end of the third window from any day of the month,
# inside SEAS5's ~215-day reach.
FORECAST_DAYS = 200

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


def _window_baseline(region: str, start_month: int) -> dict:
    return ((CLIMATOLOGY.get("regions") or {}).get(region) or {}).get("windows", {}).get(f"{start_month:02d}") or {}


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


def _monthly_anomalies(monthly: dict, variable: str, window_start: str) -> list[float | None]:
    times = [stamp[:7] for stamp in monthly.get("time") or []]
    values = monthly.get(variable) or []
    lookup = dict(zip(times, values))
    return [lookup.get(month) for month in months_in_window(window_start)]


def _build_region(name: str, lat: float, lng: float, daily_entry: dict, monthly_entry: dict, window: dict) -> dict | None:
    daily = daily_entry.get("daily") or {}
    monthly = monthly_entry.get("monthly") or {}
    times = daily.get("time") or []
    baseline = _window_baseline(name, window["startMonth"])

    rain_members = [
        reduce_window(times, series, window["start"], window["end"], mean=False)
        for series in _members(daily, "precipitation_sum")
    ]
    temp_members = [
        reduce_window(times, series, window["start"], window["end"], mean=True)
        for series in _members(daily, "temperature_2m_max")
    ]

    rainfall = summarise_variable(
        rain_members, baseline, "rain",
        _monthly_anomalies(monthly, "precipitation_anomaly", window["start"]),
        mean=False, scale=True,
    )
    temperature = summarise_variable(
        temp_members, baseline, "temp",
        _monthly_anomalies(monthly, "temperature_2m_anomaly", window["start"]),
        mean=True, scale=False,
    )
    if rainfall is None and temperature is None:
        return None
    if rainfall is not None:
        rainfall["dryWindow"] = is_dry_window(baseline.get("rainNormal"))
    return {"id": name, "region": name, "lat": lat, "lng": lng, "rainfall": rainfall, "temperature": temperature}


async def compute_snapshot(run_day: date | None = None) -> dict:
    """Fetch SEAS5 and reduce it to region outlooks for the next three windows."""
    run_day = run_day or datetime.now(GHANA_TZ).date()
    points = _region_points()
    daily_entries, monthly_entries = await _fetch(points)

    windows = []
    for window in upcoming_windows(run_day):
        cells = []
        for index, (name, lat, lng) in enumerate(points):
            if index >= len(daily_entries) or index >= len(monthly_entries):
                break
            try:
                cell = _build_region(name, lat, lng, daily_entries[index], monthly_entries[index], window)
                if cell:
                    cells.append(cell)
            except Exception:
                logger.exception("failed to reduce %s for %s", name, window["key"])
        windows.append({**window, "cells": cells})

    if not any(window["cells"] for window in windows):
        raise RuntimeError("upstream returned no usable regions")
    return {"source": "seas5", "runDate": run_day.isoformat(), "windows": windows}


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

    With GMet in force the SEAS5 windows travel as ``modelWindows``, so the app
    can show what the model alone reads, as the hazard screen does for an
    issued bulletin.
    """
    if _GMET:
        return {
            "source": "gmet",
            "issuedBy": _GMET.get("issuedBy") or "Ghana Meteorological Agency",
            "issuedAt": _GMET.get("issuedAt"),
            "validFrom": _GMET.get("validFrom"),
            "validTo": _GMET.get("validTo"),
            "pdfUrl": _GMET.get("pdfUrl"),
            "runDate": _GMET.get("runDate"),
            "windows": _GMET.get("windows") or [],
            "modelWindows": (_SEAS5 or {}).get("windows") or [],
        }
    return {
        "source": "seas5",
        "issuedBy": None,
        "runDate": (_SEAS5 or {}).get("runDate"),
        "windows": (_SEAS5 or {}).get("windows") or [],
        "modelWindows": [],
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
  "issuedAt": "2027-02-24",           # date GMet issued it
  "validFrom": "2027-03-01 00:00:00", # UTC, database timestamp format
  "validTo": "2027-07-31 23:59:59",
  "pdfUrl": "https://...",            # optional, the published bulletin
  "runDate": "2027-02-24",
  "windows": [
    {"key": "2027-03", "startMonth": 3, "label": "Mar to May",
     "start": "2027-03-01", "end": "2027-05-31",
     "cells": [
       {"id": "Greater Accra", "region": "Greater Accra", "lat": 5.69, "lng": -0.09,
        "rainfall": {"probabilities": {"below": 0.2, "normal": 0.35, "above": 0.45},
                     "category": "above", "confidence": "moderate",
                     "noSignal": false, "dryWindow": false,
                     "value": 320.0, "normal": 298.5},
        "temperature": {...same keys...}}
     ]}
  ]
}

Region names must be the sixteen in ``hazards.GHANA_REGIONS``. Store it with
``store_snapshot(payload, source="gmet", valid_from=..., valid_to=...)``.
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
