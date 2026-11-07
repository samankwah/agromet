from __future__ import annotations

import asyncio
import json
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from backend.app import config, weather_runtime
from backend.app.database import get_connection
from backend.app.main import app
from backend.app.routers import push

TOKEN = "ExponentPushToken[abc123]"
OTHER = "ExponentPushToken[def456]"
ATEBUBU = {"lat": 7.7527, "lng": -0.9815}

CASES = json.loads((Path(__file__).parent / "fixtures" / "weather_warnings_cases.json").read_text(encoding="utf-8"))["cases"]
HEAT_BUNDLE = CASES[0]["bundle"]  # extreme heat on 2026-11-07
NOON = datetime(2026, 11, 7, 12, 0, tzinfo=timezone.utc)


def register(client: TestClient, token: str = TOKEN, **overrides):
    body = {"token": token, "platform": "android", "placeName": "Atebubu", "region": "Bono East", **ATEBUBU, **overrides}
    return client.post("/api/push/register", json=body)


def ok_tickets(messages):
    return [{"status": "ok", "id": str(i)} for i, _ in enumerate(messages)]


class PushTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        with get_connection() as connection:
            connection.execute("DELETE FROM push_devices")
            connection.execute("DELETE FROM push_sent")
        weather_runtime.reset_cache()
        key = weather_runtime.cache_key(ATEBUBU["lat"], ATEBUBU["lng"])
        weather_runtime._CACHE[key] = HEAT_BUNDLE
        weather_runtime._CACHE_STAMPS[key] = 9e12  # far future: never stale
        weather_runtime._LAST_LOADS[key] = 9e12

    def tearDown(self):
        weather_runtime.reset_cache()

    def device_rows(self):
        with get_connection() as connection:
            return [dict(r) for r in connection.execute("SELECT * FROM push_devices").fetchall()]

    def test_registers_and_rounds_the_place_to_about_a_kilometre(self):
        self.assertEqual(register(self.client).status_code, 200)
        [row] = self.device_rows()
        self.assertEqual((row["lat"], row["lng"]), (7.75, -0.98))
        self.assertEqual(row["hazards"], "thunderstorm,heavy-rain,extreme-heat,strong-wind")

    def test_registering_again_updates_rather_than_duplicates(self):
        register(self.client)
        register(self.client, hazards=["thunderstorm"])
        rows = self.device_rows()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["hazards"], "thunderstorm")

    def test_refuses_what_is_not_an_expo_token(self):
        self.assertEqual(register(self.client, token="not-a-token-at-all").status_code, 422)

    def test_unregister_forgets_the_phone(self):
        register(self.client)
        self.client.post("/api/push/unregister", json={"token": TOKEN})
        self.assertEqual(self.device_rows(), [])

    def test_dispatch_needs_the_cron_secret(self):
        with patch.object(config, "CRON_SECRET", "s3cret"):
            self.assertEqual(self.client.get("/api/push/dispatch").status_code, 401)

    def test_sends_a_due_warning_once(self):
        register(self.client)
        send = AsyncMock(side_effect=ok_tickets)
        with patch.object(push, "send_expo", send):
            first = asyncio.run(push.dispatch(NOON))
            second = asyncio.run(push.dispatch(NOON))

        self.assertEqual(first["sent"], 1)
        self.assertEqual(second["sent"], 0)
        [message] = send.await_args_list[0].args[0]
        self.assertEqual(message["to"], TOKEN)
        self.assertEqual(message["title"], "Extreme heat warning")
        self.assertEqual(message["body"], "Extreme heat today, feels like 41°C. Atebubu, Bono East")
        self.assertEqual(message["channelId"], "weather-alerts")
        self.assertEqual(message["data"]["type"], "weather-alert")

    def test_skips_a_warning_type_the_farmer_switched_off(self):
        register(self.client, hazards=["thunderstorm", "heavy-rain"])
        send = AsyncMock(side_effect=ok_tickets)
        with patch.object(push, "send_expo", send):
            result = asyncio.run(push.dispatch(NOON))
        self.assertEqual(result["sent"], 0)
        send.assert_not_awaited()

    def test_sends_nothing_in_quiet_hours_for_an_ordinary_warning(self):
        register(self.client)
        send = AsyncMock(side_effect=ok_tickets)
        with patch.object(push, "send_expo", send):
            result = asyncio.run(push.dispatch(datetime(2026, 11, 7, 22, 0, tzinfo=timezone.utc)))
        self.assertEqual(result["sent"], 0)

    def test_drops_a_phone_expo_says_is_gone(self):
        register(self.client)
        register(self.client, token=OTHER)
        tickets = [
            {"status": "error", "details": {"error": "DeviceNotRegistered"}},
            {"status": "ok", "id": "1"},
        ]
        with patch.object(push, "send_expo", AsyncMock(return_value=tickets)):
            result = asyncio.run(push.dispatch(NOON))
        self.assertEqual(result["removed"], 1)
        self.assertEqual([row["token"] for row in self.device_rows()], [OTHER])

    def test_a_failed_send_is_retried_next_time(self):
        register(self.client)
        with patch.object(push, "send_expo", AsyncMock(return_value=[{"status": "error"}])):
            asyncio.run(push.dispatch(NOON))
        send = AsyncMock(side_effect=ok_tickets)
        with patch.object(push, "send_expo", send):
            result = asyncio.run(push.dispatch(NOON))
        self.assertEqual(result["sent"], 1)

    def test_test_notification_is_limited_to_registered_phones_once_a_minute(self):
        with patch.object(push, "send_expo", AsyncMock(side_effect=ok_tickets)):
            self.assertEqual(self.client.post("/api/push/test", json={"token": TOKEN}).status_code, 429)
            register(self.client)
            self.assertEqual(self.client.post("/api/push/test", json={"token": TOKEN}).status_code, 200)
            self.assertEqual(self.client.post("/api/push/test", json={"token": TOKEN}).status_code, 429)


if __name__ == "__main__":
    unittest.main()
