"""The weeks 2-to-4 subseasonal outlook and the hourly precipitation field
behind the rain map -- two independent GEFS/Open-Meteo-derived products,
each with its own runtime cache, sharing only the serve-then-revalidate
shape `hazards.py`'s endpoints also use."""

from __future__ import annotations

import hmac

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException

from .. import config, precip_runtime, s2s_runtime, seasonal_runtime
from ..deps import require_admin

router = APIRouter(tags=["outlook"])


def _strip_series(cell: dict) -> dict:
    """The map's copy of a cell, without its 15-day chart series.

    The series is 90 numbers per cell per variable; across 165 cells that is
    roughly 100 KB the map never draws. It is served instead by
    `/api/outlook/subseasonal/series`, one cell at a time, when a district is
    actually selected.
    """
    trimmed = dict(cell)
    for variable in ("rainfall", "temperature"):
        reading = trimmed.get(variable)
        if reading:
            trimmed[variable] = {key: value for key, value in reading.items() if key != "series"}
    return trimmed


@router.get("/api/outlook/subseasonal")
async def subseasonal_outlook(background: BackgroundTasks):
    """The weeks 2-to-4 outlook over the model's own grid.

    Serves the 165-point GEFS field, each cell carrying both the tercile
    probabilities and the deterministic ensemble mean. Admin boundaries are the
    client's business: it already ships Ghana's regions and districts, and
    overlaying them here would put the same geometry in two places.

    Same serve-then-revalidate shape as `hazard_summary`: a stale snapshot is
    returned immediately and refreshed behind the response, so a page load never
    waits on the ensemble fetch.

    `unavailable` means nothing could be computed at all. A *missing baseline*
    no longer empties the response, because the deterministic field needs none --
    those cells simply carry no probabilities, and the client shows the
    deterministic view for them.
    """
    await s2s_runtime.ensure_fresh()
    snapshot, _ = s2s_runtime.cached_snapshot()

    if not snapshot:
        return {
            "success": True,
            "data": {
                "cells": [],
                "unavailable": True,
                **s2s_runtime.metadata(),
            },
        }

    if s2s_runtime.is_stale():
        background.add_task(s2s_runtime.refresh, False)

    return {
        "success": True,
        "data": {
            "cells": [_strip_series(cell) for cell in snapshot.values()],
            "unavailable": False,
            **s2s_runtime.metadata(),
        },
    }


@router.get("/api/outlook/subseasonal/refresh")
async def refresh_subseasonal(authorization: str | None = Header(default=None)):
    """Compute and store the field. Called by the daily Vercel cron.

    This is the one place the fetch is allowed to take its full eight seconds or
    so, because nobody is waiting on it. It awaits the work rather than starting
    it, since on serverless a function that has answered is frozen, and a fetch
    left running behind the answer never finishes.

    GET because that is what Vercel's cron sends.
    """
    secret = config.CRON_SECRET
    if not secret:
        raise HTTPException(status_code=503, detail="CRON_SECRET is not configured.")
    if not hmac.compare_digest(authorization or "", f"Bearer {secret}"):
        raise HTTPException(status_code=401, detail="Not authorised.")

    if not await s2s_runtime.refresh(force=True):
        raise HTTPException(status_code=502, detail=f"Refresh failed: {s2s_runtime.last_error()}")

    snapshot, _ = s2s_runtime.cached_snapshot()
    return {"success": True, "data": {"cells": len(snapshot), **s2s_runtime.metadata()}}


@router.get("/api/precipitation/field")
async def precipitation_field(background: BackgroundTasks):
    """Hourly rainfall over Ghana's land grid, for the rain map's forecast half.

    Proxied rather than fetched by the app, which is the exception the rain map
    forces. `fetchCurrentBatch` in the client goes direct and is right to: it is
    32 points for a display strip. This is several hundred, and Open-Meteo
    weights a request by its location count, so direct it would consume the free
    tier in proportion to how many people open the screen. Cached here it is one
    upstream call an hour for everyone. See `precip_runtime` for the arithmetic
    that fixes the interval.

    Same serve-then-revalidate shape as `subseasonal_outlook`: a stale snapshot
    is returned immediately and refreshed behind the response, so opening the map
    never waits on the fetch.

    The grid travels with the values because the two are positional -- every row
    of `values` is parallel to `grid` -- and a client that inferred the lattice
    itself would silently mis-draw the whole field the day either side changed
    its rounding.
    """
    await precip_runtime.ensure_fresh()
    snapshot, _ = precip_runtime.cached_snapshot()

    if not snapshot:
        return {
            "success": True,
            "data": {
                "grid": [],
                "times": [],
                "values": [],
                "unavailable": True,
                **precip_runtime.metadata(),
            },
        }

    if precip_runtime.is_stale():
        background.add_task(precip_runtime.refresh, False)

    return {
        "success": True,
        "data": {
            "grid": [[lat, lng] for lat, lng in precip_runtime.GRID],
            "times": snapshot["times"],
            "values": snapshot["values"],
            "unavailable": False,
            **precip_runtime.metadata(),
        },
    }


@router.get("/api/outlook/subseasonal/series")
async def subseasonal_series(lat: float, lng: float):
    """One grid cell's day-by-day ensemble spread, for the detail chart.

    Read straight from the cached snapshot -- the members were reduced when the
    field was fetched, so selecting a district costs no upstream call. Returns
    404 rather than an empty series when the place falls outside the grid, so a
    bad coordinate is a visible error rather than a flat chart.

    An empty cache is *not* that error. ``cell_at`` returns None both for a point
    off the grid and for a snapshot with nothing in it, and only the first is a
    coverage problem -- reporting the second as one tells the farmer their town
    is not covered when the truth is that the fetch failed.
    """
    await s2s_runtime.ensure_fresh()
    snapshot, _ = s2s_runtime.cached_snapshot()
    if not snapshot:
        return {
            "success": True,
            "data": {
                "rainfall": None,
                "temperature": None,
                "unavailable": True,
                **s2s_runtime.metadata(),
            },
        }

    cell = s2s_runtime.cell_at(lat, lng)
    if not cell:
        raise HTTPException(status_code=404, detail="No subseasonal outlook covers that location.")

    return {
        "success": True,
        "data": {
            "id": cell["id"],
            "lat": cell["lat"],
            "lng": cell["lng"],
            "rainfall": (cell.get("rainfall") or {}).get("series"),
            "temperature": (cell.get("temperature") or {}).get("series"),
            "unavailable": False,
            **s2s_runtime.metadata(),
        },
    }


@router.get("/api/outlook/seasonal")
async def seasonal_outlook(background: BackgroundTasks):
    """The seasonal outlook by region: onset, cessation and dry spells per season,
    and rainfall total, rainy days and temperature per MAM, MJJ and JAS window.

    GMet's own forecast when one is in force, otherwise ECMWF SEAS5 adjusted to
    local climate (see `seasonal_runtime`). Same serve-then-revalidate shape as
    the subseasonal endpoint: a stored snapshot is returned at once, and a
    missed monthly run is refreshed behind the response.
    """
    await seasonal_runtime.ensure_fresh()
    outlook = seasonal_runtime.current()
    if not outlook["seasons"] and not outlook["windows"]:
        return {"success": True, "data": {**outlook, "unavailable": True, **seasonal_runtime.metadata()}}

    if seasonal_runtime.needs_new_run():
        background.add_task(seasonal_runtime.refresh, False)
    return {"success": True, "data": {**outlook, "unavailable": False, **seasonal_runtime.metadata()}}


@router.get("/api/outlook/seasonal/refresh")
async def refresh_seasonal(authorization: str | None = Header(default=None)):
    """Recompute SEAS5 when ECMWF has published a new run. Daily Vercel cron.

    Cheap on most days: it returns without calling upstream unless the stored
    run is from before this month's release.
    """
    secret = config.CRON_SECRET
    if not secret:
        raise HTTPException(status_code=503, detail="CRON_SECRET is not configured.")
    if not hmac.compare_digest(authorization or "", f"Bearer {secret}"):
        raise HTTPException(status_code=401, detail="Not authorised.")

    await seasonal_runtime.load_snapshot(force=True)
    if not seasonal_runtime.needs_new_run():
        return {"success": True, "data": {"refreshed": False, **seasonal_runtime.metadata()}}
    if not await seasonal_runtime.refresh(force=True):
        raise HTTPException(status_code=502, detail=f"Refresh failed: {seasonal_runtime.last_error()}")
    return {"success": True, "data": {"refreshed": True, **seasonal_runtime.metadata()}}


@router.post("/api/outlook/seasonal/ingest")
async def ingest_gmet_seasonal(_admin: dict = Depends(require_admin)):
    """Pull GMet's downscaled seasonal forecast from Azure Storage. Admin only.

    The feed does not exist yet, so this reports that plainly instead of
    pretending: 503 until ``AZURE_SEASONAL_URL`` is set, 501 until the format is
    known and ``seasonal_runtime.ingest_gmet`` is written.
    """
    try:
        result = await seasonal_runtime.ingest_gmet()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    return {"success": True, "data": result}
