"""Open-Meteo weather, fetched and cached per location.

Structured like `hazard_runtime`: each place's bundle is stored in the database
(`runtime_snapshots`, kind `weather:<lat>,<lng>`) with an in-process dict as this
instance's copy. A cold instance reads a place in one round trip instead of
waiting up to twenty seconds on Open-Meteo, and a stale bundle is served as it
is while a refresh runs behind the response. Each place has its own refresh
lock, so a slow fetch for one town no longer holds up every other town.

What is deliberately *not* here: normalisation. The route hands Open-Meteo's own
response back inside the house envelope, and the mobile app maps it to its
domain types. That is not laziness — the app also calls Open-Meteo directly when
this backend is unreachable, and one mapping written once in TypeScript is
better than two that have to be kept in step across languages. The cost is that
swapping to a different provider later means changing this shape, not just this
file.

Ambee is the road not taken. `main.py` still carries two Ambee routes, but
`AMBEE_API_KEY` has never been set, so every call short-circuits to 503. Ghana's
own hazard index already runs on Open-Meteo (`hazards.py`), which needs no key.
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone

import httpx

from . import snapshot_store

logger = logging.getLogger(__name__)

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# Open-Meteo publishes hourly. Half that keeps "current conditions" honest
# without hammering a free service — the hazards module's six hours is right for
# a daily index and much too slow for a temperature reading.
CACHE_TTL_SECONDS = 30 * 60
UPSTREAM_TIMEOUT = 20.0

# Ghana spans about 5°N-11°N and 3°W-1°E. Rounding the cache key to 2dp is
# roughly a kilometre, so the ten home towns each get their own entry while a
# jittery GPS fix cannot fragment the cache.
CACHE_PRECISION = 2

FORECAST_DAYS = 7

# The cloud cover by height and the visibility are for the sky drawn behind the
# app's forecast: how much low, middle and high cloud there is decides what the
# sky looks like, and a short visibility is harmattan dust or fog. Percent and
# metres respectively.
CURRENT_FIELDS = (
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
    "cloud_cover",
    "cloud_cover_low",
    "cloud_cover_mid",
    "cloud_cover_high",
    "visibility",
)

DAILY_FIELDS = (
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "apparent_temperature_max",
    "precipitation_sum",
    "precipitation_probability_max",
    "sunrise",
    "sunset",
    "wind_speed_10m_max",
    "wind_gusts_10m_max",
)

# The day-detail screen charts the first eight. `apparent_temperature_max`,
# `wind_gusts_10m_max` (daily) and `cape` (hourly) are for the severe-weather
# alert in `mobile/src/shared/domain/weatherHazards.ts` — gusts and feels-like
# heat are what a farmer is warned about, and mean wind / air temp understate
# both. `uv_index` and `cape` are dimensionless; everything else arrives in
# °C / % / mm / km/h, which is what the app assumes.
HOURLY_FIELDS = (
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "precipitation",
    "precipitation_probability",
    "weather_code",
    "wind_speed_10m",
    "uv_index",
    "cape",
)

# How often a warm instance looks in the database for a place it already holds.
RELOAD_INTERVAL_SECONDS = 300.0

# Stored bundles older than this are deleted by the daily cron. Every new place
# a farmer opens the app in adds a row, so without this the table only grows.
PRUNE_AFTER = timedelta(days=2)

KIND_PREFIX = "weather:"

_CACHE: dict[str, dict] = {}
_CACHE_STAMPS: dict[str, float] = {}
_LAST_LOADS: dict[str, float] = {}  # monotonic
_LOCKS: dict[str, asyncio.Lock] = {}
_LAST_ERROR: str | None = None


def cache_key(lat: float, lng: float) -> str:
    return f"{round(lat, CACHE_PRECISION)},{round(lng, CACHE_PRECISION)}"


def is_stale(key: str) -> bool:
    stamp = _CACHE_STAMPS.get(key)
    if not stamp:
        return True
    return (time.time() - stamp) > CACHE_TTL_SECONDS


def cached_bundle(key: str) -> dict | None:
    return _CACHE.get(key)


def _lock_for(key: str) -> asyncio.Lock:
    lock = _LOCKS.get(key)
    if lock is None:
        lock = _LOCKS[key] = asyncio.Lock()
    return lock


async def load_bundle(key: str) -> None:
    """Pick up the stored bundle for one place if it is newer than ours.

    Skipped while this instance holds a fresh copy, so a warm instance does not
    pay a round trip per request. A database failure keeps what is in memory.
    """
    if key in _CACHE and not is_stale(key):
        return
    now = time.monotonic()
    if key in _CACHE and now - _LAST_LOADS.get(key, 0.0) < RELOAD_INTERVAL_SECONDS:
        return
    _LAST_LOADS[key] = now

    try:
        stored = await asyncio.to_thread(snapshot_store.read_latest, KIND_PREFIX + key)
    except Exception:
        logger.exception("could not read the stored weather bundle for %s", key)
        return

    if stored and stored[1] > _CACHE_STAMPS.get(key, 0.0):
        _CACHE[key], _CACHE_STAMPS[key] = stored


async def _fetch(lat: float, lng: float) -> dict:
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lng:.4f}",
        "current": ",".join(CURRENT_FIELDS),
        "daily": ",".join(DAILY_FIELDS),
        "hourly": ",".join(HOURLY_FIELDS),
        # Ghana is UTC+0 year-round with no DST, so asking for local time costs
        # nothing and means the date boundaries in `daily` line up with the
        # farmer's day rather than with UTC midnight somewhere else.
        "timezone": "Africa/Accra",
        "forecast_days": FORECAST_DAYS,
    }

    async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT) as client:
        response = await client.get(FORECAST_URL, params=params)
        response.raise_for_status()
        return response.json()


async def refresh(lat: float, lng: float, force: bool = False) -> bool:
    """Fetch and store one location. True when new data was written.

    The lock is per place: it stops simultaneous requests for the same
    coordinates from each fetching, without making different towns wait on
    each other.
    """
    global _LAST_ERROR

    key = cache_key(lat, lng)
    if not force and not is_stale(key):
        return False

    async with _lock_for(key):
        # Another coroutine may have refreshed this key while we waited.
        if not force and not is_stale(key):
            return False
        try:
            bundle = await _fetch(lat, lng)
        except Exception as exc:
            _LAST_ERROR = f"{type(exc).__name__}: {exc}"
            logger.warning("weather refresh failed for %s: %s", key, _LAST_ERROR)
            return False

        try:
            stamp = await asyncio.to_thread(snapshot_store.store, KIND_PREFIX + key, bundle)
        except Exception:
            logger.exception("could not store the weather bundle for %s", key)
            stamp = time.time()

        _CACHE[key] = bundle
        _CACHE_STAMPS[key] = stamp
        _LAST_ERROR = None
        return True


async def ensure_fresh(lat: float, lng: float) -> None:
    """Block only when there is nothing at all to serve for this location.

    Once a bundle exists the read path returns it immediately and leaves
    revalidation to a background task, so a page load is never held open behind
    a twenty-second upstream timeout.
    """
    key = cache_key(lat, lng)
    await load_bundle(key)
    if key not in _CACHE:
        await refresh(lat, lng, force=True)


def prune() -> int:
    """Delete stored bundles nobody has refreshed in `PRUNE_AFTER`. Blocking."""
    return snapshot_store.prune(KIND_PREFIX, PRUNE_AFTER)


def metadata(key: str) -> dict:
    """Provenance block attached to every response."""
    stamp = _CACHE_STAMPS.get(key)
    return {
        "fetchedAt": datetime.fromtimestamp(stamp, tz=timezone.utc).isoformat() if stamp else None,
        "stale": is_stale(key),
        "source": "Open-Meteo",
        "error": _LAST_ERROR,
    }


def reset_cache() -> None:
    """Test hook. Nothing in the app calls this."""
    global _LAST_ERROR
    _CACHE.clear()
    _CACHE_STAMPS.clear()
    _LAST_LOADS.clear()
    _LOCKS.clear()
    _LAST_ERROR = None
    snapshot_store.clear(KIND_PREFIX)
