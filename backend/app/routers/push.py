"""Weather warnings sent to phones as notifications, even with the app closed.

The app registers its Expo push token with the farmer's place (town or
district, rounded to about a kilometre) and the warning types left switched on.
Every 30 minutes a scheduled job calls `/api/push/dispatch`, which works out
each place's warnings from the cached forecast (`weather_warnings.py`, the same
rules as the banner in the app), picks the ones due, and sends each to each
phone once through Expo's push service.

The schedule is a GitHub Actions workflow (`.github/workflows/push-dispatch.yml`)
because Vercel's Hobby plan runs its own crons only once a day.
"""

from __future__ import annotations

import asyncio
import hmac
import logging
import re
import time
from dataclasses import replace
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from .. import config, weather_runtime
from ..database import get_connection, row_to_dict, utc_stamp
from ..weather_warnings import HAZARDS, Warning, is_due, notification_text, warnings_for

router = APIRouter(tags=["push"])
logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_BATCH = 100
CHANNEL_ID = "weather-alerts"

# Inside the function's 60 s, leaving room to record what was sent.
DISPATCH_BUDGET_SECONDS = 45.0

SENT_KEEP = timedelta(days=3)
DEVICE_KEEP = timedelta(days=60)

TOKEN_PATTERN = re.compile(r"^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_\-]+\]$")


class RegisterPush(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    platform: str = Field(default="", max_length=16)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    placeName: str = Field(default="", max_length=80)
    region: str = Field(default="", max_length=80)
    hazards: list[str] = Field(default_factory=lambda: list(HAZARDS))
    enabled: bool = True


class TokenOnly(BaseModel):
    token: str = Field(min_length=10, max_length=200)


def _check_token(token: str) -> str:
    if not TOKEN_PATTERN.match(token):
        raise HTTPException(status_code=422, detail="Not an Expo push token.")
    return token


def _stamp(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


# --------------------------------------------------------------------------
# Register
# --------------------------------------------------------------------------

def _upsert_device(body: RegisterPush) -> None:
    hazards = ",".join(h for h in body.hazards if h in HAZARDS)
    now = utc_stamp()
    # Rounded here as well as on the phone: this table never holds more than
    # about a kilometre of precision, whatever a client sends.
    lat, lng = round(body.lat, 2), round(body.lng, 2)
    with get_connection() as connection:
        existing = connection.execute("SELECT id FROM push_devices WHERE token = ?", (body.token,)).fetchone()
        if existing:
            connection.execute(
                """UPDATE push_devices SET platform = ?, lat = ?, lng = ?, place_name = ?, region = ?,
                   hazards = ?, enabled = ?, updated_at = ?, last_seen_at = ? WHERE token = ?""",
                (body.platform, lat, lng, body.placeName, body.region, hazards, int(body.enabled), now, now, body.token),
            )
        else:
            connection.execute(
                """INSERT INTO push_devices
                   (token, platform, lat, lng, place_name, region, hazards, enabled, created_at, updated_at, last_seen_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (body.token, body.platform, lat, lng, body.placeName, body.region, hazards, int(body.enabled), now, now, now),
            )


@router.post("/api/push/register")
async def register_push(body: RegisterPush):
    """Add or update this phone. Called on every app start, so `last_seen_at`
    also tells the job which phones are still in use."""
    _check_token(body.token)
    await asyncio.to_thread(_upsert_device, body)
    return {"success": True, "data": {"registered": True}}


def _delete_device(token: str) -> None:
    with get_connection() as connection:
        connection.execute("DELETE FROM push_devices WHERE token = ?", (token,))
        connection.execute("DELETE FROM push_sent WHERE token = ?", (token,))


@router.post("/api/push/unregister")
async def unregister_push(body: TokenOnly):
    """Forget this phone: warnings switched off, or notifications refused."""
    await asyncio.to_thread(_delete_device, body.token)
    return {"success": True, "data": {"registered": False}}


# --------------------------------------------------------------------------
# Send
# --------------------------------------------------------------------------

async def send_expo(messages: list[dict]) -> list[dict]:
    """Send to Expo in batches. Returns one ticket per message, in order. A
    batch that fails outright comes back as error tickets, so nothing is
    recorded as sent and the next run tries again."""
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if config.EXPO_ACCESS_TOKEN:
        headers["Authorization"] = f"Bearer {config.EXPO_ACCESS_TOKEN}"
    tickets: list[dict] = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for start in range(0, len(messages), EXPO_BATCH):
            batch = messages[start : start + EXPO_BATCH]
            try:
                response = await client.post(EXPO_PUSH_URL, json=batch, headers=headers)
                response.raise_for_status()
                data = response.json().get("data") or []
                tickets.extend(data if len(data) == len(batch) else [{"status": "error"}] * len(batch))
            except Exception as exc:
                logger.warning("Expo push batch failed: %s", exc)
                tickets.extend([{"status": "error", "message": str(exc)}] * len(batch))
    return tickets


def _message(token: str, warning: Warning) -> dict:
    title, body = notification_text(warning)
    return {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
        "channelId": CHANNEL_ID,
        "data": {"type": "weather-alert", "alertId": warning.id, "hazard": warning.hazard},
    }


def _load_devices() -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT token, lat, lng, place_name, region, hazards FROM push_devices WHERE enabled = 1"
        ).fetchall()
        return [row_to_dict(row) for row in rows]


def _already_sent(pairs: list[tuple[str, str]]) -> set[tuple[str, str]]:
    if not pairs:
        return set()
    tokens = sorted({token for token, _ in pairs})
    sent: set[tuple[str, str]] = set()
    with get_connection() as connection:
        for token in tokens:
            rows = connection.execute("SELECT alert_id FROM push_sent WHERE token = ?", (token,)).fetchall()
            sent.update((token, row_to_dict(row)["alert_id"]) for row in rows)
    return sent


def _record(sent: list[tuple[str, str]], gone: list[str]) -> None:
    now = utc_stamp()
    with get_connection() as connection:
        for token, alert_id in sent:
            exists = connection.execute(
                "SELECT 1 FROM push_sent WHERE token = ? AND alert_id = ?", (token, alert_id)
            ).fetchone()
            if not exists:
                connection.execute(
                    "INSERT INTO push_sent (token, alert_id, sent_at) VALUES (?, ?, ?)", (token, alert_id, now)
                )
        for token in gone:
            connection.execute("DELETE FROM push_devices WHERE token = ?", (token,))
            connection.execute("DELETE FROM push_sent WHERE token = ?", (token,))


def _prune(now: datetime) -> None:
    with get_connection() as connection:
        connection.execute("DELETE FROM push_sent WHERE sent_at < ?", (_stamp(now - SENT_KEEP),))
        connection.execute("DELETE FROM push_devices WHERE last_seen_at < ?", (_stamp(now - DEVICE_KEEP),))


def _require_cron(authorization: str | None) -> None:
    secret = config.CRON_SECRET
    if not secret:
        raise HTTPException(status_code=503, detail="CRON_SECRET is not configured.")
    if not hmac.compare_digest(authorization or "", f"Bearer {secret}"):
        raise HTTPException(status_code=401, detail="Not authorised.")


async def dispatch(now: datetime | None = None) -> dict:
    """One pass: every place, its due warnings, each phone once."""
    now = now or datetime.now(timezone.utc)
    started = time.monotonic()
    devices = await asyncio.to_thread(_load_devices)

    places: dict[str, list[dict]] = {}
    for device in devices:
        places.setdefault(weather_runtime.cache_key(device["lat"], device["lng"]), []).append(device)

    pending: list[tuple[str, Warning]] = []
    checked = 0
    for key, members in places.items():
        if time.monotonic() - started > DISPATCH_BUDGET_SECONDS:
            break
        lat, lng = members[0]["lat"], members[0]["lng"]
        await weather_runtime.ensure_fresh(lat, lng)
        await weather_runtime.refresh(lat, lng)  # no-op unless the cached bundle is stale
        bundle = weather_runtime.cached_bundle(key)
        checked += 1
        if not bundle:
            continue
        due = [w for w in warnings_for(bundle, key, "", "", now) if is_due(w, now)]
        for device in members:
            wanted = set(filter(None, (device.get("hazards") or "").split(",")))
            for warning in due:
                if warning.hazard in wanted:
                    pending.append(
                        (device["token"], replace(warning, place_name=device["place_name"], region=device["region"]))
                    )

    already = await asyncio.to_thread(_already_sent, [(token, w.id) for token, w in pending])
    to_send = [(token, w) for token, w in pending if (token, w.id) not in already]

    tickets = await send_expo([_message(token, w) for token, w in to_send]) if to_send else []
    sent: list[tuple[str, str]] = []
    gone: list[str] = []
    for (token, warning), ticket in zip(to_send, tickets):
        if ticket.get("status") == "ok":
            sent.append((token, warning.id))
        elif (ticket.get("details") or {}).get("error") == "DeviceNotRegistered":
            gone.append(token)

    await asyncio.to_thread(_record, sent, gone)
    await asyncio.to_thread(_prune, now)
    return {"devices": len(devices), "places": len(places), "checked": checked, "sent": len(sent), "removed": len(gone)}


@router.get("/api/push/dispatch")
async def push_dispatch(authorization: str | None = Header(default=None)):
    """Send the warnings that are due. Called every 30 minutes by the scheduled
    workflow, with the cron secret. GET, as schedulers send."""
    _require_cron(authorization)
    return {"success": True, "data": await dispatch()}


# --------------------------------------------------------------------------
# Test
# --------------------------------------------------------------------------

def _claim_test_slot(token: str, now: datetime) -> bool:
    """One test a minute per phone, held in `push_sent` so it survives cold
    starts. False when this minute's slot is taken or the phone is unknown."""
    slot = f"test:{now.strftime('%Y%m%d%H%M')}"
    with get_connection() as connection:
        if not connection.execute("SELECT 1 FROM push_devices WHERE token = ?", (token,)).fetchone():
            return False
        if connection.execute("SELECT 1 FROM push_sent WHERE token = ? AND alert_id = ?", (token, slot)).fetchone():
            return False
        connection.execute("INSERT INTO push_sent (token, alert_id, sent_at) VALUES (?, ?, ?)", (token, slot, utc_stamp()))
    return True


@router.post("/api/push/test")
async def push_test(body: TokenOnly):
    """Send one test notification to a registered phone, from Settings."""
    _check_token(body.token)
    if not await asyncio.to_thread(_claim_test_slot, body.token, datetime.now(timezone.utc)):
        raise HTTPException(status_code=429, detail="Register first, and send at most one test a minute.")
    tickets = await send_expo(
        [
            {
                "to": body.token,
                "title": "AgroMet weather warnings are on",
                "body": "You will be told here when heavy rain, a storm, strong wind or extreme heat is coming.",
                "sound": "default",
                "priority": "high",
                "channelId": CHANNEL_ID,
                "data": {"type": "weather-alert-test"},
            }
        ]
    )
    ok = bool(tickets) and tickets[0].get("status") == "ok"
    if not ok:
        raise HTTPException(status_code=502, detail="Expo did not accept the test notification.")
    return {"success": True, "data": {"sent": True}}
