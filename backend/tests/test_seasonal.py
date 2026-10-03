"""The seasonal outlook: windows, bias correction, storage, precedence, routes."""

from __future__ import annotations

import unittest
from datetime import date, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app import config, database, seasonal_runtime
from backend.app.hazards import GHANA_REGIONS
from backend.app.main import app
from backend.app.seasonal import (
    SKILL_WEIGHT,
    corrected_bounds,
    is_dry_window,
    model_normal,
    reduce_window,
    shrink_to_climatology,
    summarise_variable,
    upcoming_windows,
    window_label,
)

RUN_DAY = date(2026, 10, 6)


class WindowTests(unittest.TestCase):
    def test_a_run_speaks_about_the_next_three_seasons_not_the_current_month(self):
        windows = upcoming_windows(RUN_DAY)
        self.assertEqual([w["label"] for w in windows], ["Nov to Jan", "Dec to Feb", "Jan to Mar"])
        self.assertEqual(windows[0]["start"], "2026-11-01")
        self.assertEqual(windows[0]["end"], "2027-01-31")
        self.assertEqual(windows[2]["end"], "2027-03-31")

    def test_labels_wrap_the_year_and_use_no_dashes(self):
        self.assertEqual(window_label(date(2026, 12, 1)), "Dec to Feb")
        self.assertNotIn("-", window_label(date(2026, 12, 1)))

    def test_a_member_with_a_missing_day_is_dropped_not_summed_short(self):
        times = ["2026-11-01", "2026-11-02", "2026-11-03"]
        self.assertEqual(reduce_window(times, [1.0, 2.0, 3.0], "2026-11-01", "2026-11-03", mean=False), 6.0)
        self.assertIsNone(reduce_window(times, [1.0, None, 3.0], "2026-11-01", "2026-11-03", mean=False))
        self.assertIsNone(reduce_window(times[:2], [1.0, 2.0], "2026-11-01", "2026-11-03", mean=False))


class BiasCorrectionTests(unittest.TestCase):
    baseline = {"rainP33": 100.0, "rainP67": 200.0, "rainNormal": 150.0, "tempP33": 30.0, "tempP67": 31.0, "tempNormal": 30.5}

    def test_model_normal_is_the_forecast_minus_its_own_anomaly(self):
        self.assertEqual(model_normal(300.0, [20.0, 20.0, 20.0], mean=False), 240.0)
        self.assertEqual(model_normal(32.0, [1.0, 2.0, 3.0], mean=True), 30.0)
        self.assertIsNone(model_normal(300.0, [20.0, None, 20.0], mean=False))

    def test_a_wet_model_has_its_rain_boundaries_raised_in_proportion(self):
        # The model's normal is 20% above ERA5's, so a 20% wetter forecast is normal.
        self.assertEqual(corrected_bounds(self.baseline, "rain", 180.0, scale=True), (120.0, 240.0))

    def test_a_warm_model_has_its_temperature_boundaries_shifted(self):
        self.assertEqual(corrected_bounds(self.baseline, "temp", 32.5, scale=False), (32.0, 33.0))

    def test_without_a_model_normal_the_era5_boundaries_stand(self):
        self.assertEqual(corrected_bounds(self.baseline, "rain", None, scale=True), (100.0, 200.0))

    def test_a_model_wet_habit_alone_is_not_a_signal(self):
        # Every member 20% above ERA5's normal, and the anomaly says that is the
        # model's own normal: the corrected outlook must not call it wetter.
        members = [180.0] * 51
        result = summarise_variable(members, self.baseline, "rain", [0.0, 0.0, 0.0], mean=False, scale=True)
        self.assertEqual(result["category"], "normal")
        self.assertTrue(result["biasCorrected"])


class ShrinkageTests(unittest.TestCase):
    def test_a_unanimous_ensemble_does_not_read_as_certain(self):
        shrunk = shrink_to_climatology({"below": 0.0, "normal": 0.0, "above": 1.0})
        self.assertAlmostEqual(shrunk["above"], SKILL_WEIGHT + (1 - SKILL_WEIGHT) / 3)
        self.assertAlmostEqual(sum(shrunk[k] for k in ("below", "normal", "above")), 1.0)
        self.assertLess(shrunk["above"], 0.8)

    def test_even_odds_stay_even(self):
        shrunk = shrink_to_climatology({"below": 1 / 3, "normal": 1 / 3, "above": 1 / 3})
        for name in ("below", "normal", "above"):
            self.assertAlmostEqual(shrunk[name], 1 / 3)


class DryWindowTests(unittest.TestCase):
    def test_under_thirty_millimetres_a_month_is_the_dry_season(self):
        self.assertTrue(is_dry_window(60.0))
        self.assertFalse(is_dry_window(120.0))
        self.assertFalse(is_dry_window(None))


# ---------------------------------------------------------------------------
# Runtime and routes
# ---------------------------------------------------------------------------

def fake_climatology() -> dict:
    window = {"n": 30, "rainP33": 100.0, "rainP67": 200.0, "rainNormal": 150.0,
              "tempP33": 30.0, "tempP67": 31.0, "tempNormal": 30.5}
    return {"regions": {name: {"windows": {f"{m:02d}": dict(window) for m in range(1, 13)}} for name in GHANA_REGIONS}}


def fake_fetch(rain_per_day: float = 2.5, temp: float = 31.5, rain_anomaly: float = 0.0):
    """What Open-Meteo returns for the sixteen regions: daily members and monthly anomalies."""
    times = [(RUN_DAY + timedelta(days=i)).isoformat() for i in range(200)]
    daily = {"time": times, "precipitation_sum": [rain_per_day] * 200, "temperature_2m_max": [temp] * 200}
    for member in range(1, 51):
        daily[f"precipitation_sum_member{member:02d}"] = [rain_per_day] * 200
        daily[f"temperature_2m_max_member{member:02d}"] = [temp] * 200
    months = [f"{(RUN_DAY.replace(day=1) + timedelta(days=31 * i)).strftime('%Y-%m')}-01" for i in range(7)]
    monthly = {"time": months, "precipitation_anomaly": [rain_anomaly] * 7, "temperature_2m_anomaly": [0.0] * 7}

    async def fetch(points):
        return [{"daily": daily}] * len(points), [{"monthly": monthly}] * len(points)

    return fetch


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        database.init_db()
        seasonal_runtime.reset_cache()
        with database.get_connection() as connection:
            connection.execute("DELETE FROM seasonal_snapshots")

    def tearDown(self):
        seasonal_runtime.reset_cache()

    def compute(self, **kwargs):
        import asyncio

        with patch.object(seasonal_runtime, "CLIMATOLOGY", fake_climatology()), \
             patch.object(seasonal_runtime, "_fetch", fake_fetch(**kwargs)):
            return asyncio.run(seasonal_runtime.compute_snapshot(RUN_DAY))

    def test_every_region_and_window_is_reduced(self):
        snapshot = self.compute()
        self.assertEqual(len(snapshot["windows"]), 3)
        for window in snapshot["windows"]:
            self.assertEqual(len(window["cells"]), len(GHANA_REGIONS))
        cell = snapshot["windows"][0]["cells"][0]
        probabilities = cell["rainfall"]["probabilities"]
        self.assertAlmostEqual(sum(probabilities.values()), 1.0, places=2)
        self.assertIn("dryWindow", cell["rainfall"])

    def test_a_wetter_season_reads_wetter(self):
        # 92 days at 5 mm is 460 mm, and the model says 100 mm a month of that
        # is above its own normal: a real wet signal, not the model's habit.
        cell = self.compute(rain_per_day=5.0, rain_anomaly=100.0)["windows"][0]["cells"][0]
        self.assertEqual(cell["rainfall"]["category"], "above")

    def test_rain_the_model_calls_normal_is_not_a_wet_signal(self):
        # The same 460 mm with no anomaly is the model's own normal.
        cell = self.compute(rain_per_day=5.0)["windows"][0]["cells"][0]
        self.assertEqual(cell["rainfall"]["category"], "normal")

    def test_a_gmet_snapshot_in_force_is_served_first_with_the_model_alongside(self):
        seasonal_runtime.store_snapshot(self.compute())
        gmet = {"source": "gmet", "issuedBy": "Ghana Meteorological Agency", "runDate": "2026-10-01",
                "windows": [{"key": "2026-11", "label": "Nov to Jan", "cells": []}]}
        seasonal_runtime.store_snapshot(gmet, source="gmet", valid_from="2026-01-01 00:00:00", valid_to="2099-01-01 00:00:00")

        import asyncio
        asyncio.run(seasonal_runtime.load_snapshot(force=True))
        current = seasonal_runtime.current()
        self.assertEqual(current["source"], "gmet")
        self.assertEqual(current["issuedBy"], "Ghana Meteorological Agency")
        self.assertEqual(len(current["modelWindows"]), 3)

    def test_an_expired_gmet_snapshot_falls_back_to_the_model(self):
        seasonal_runtime.store_snapshot(self.compute())
        gmet = {"source": "gmet", "windows": [{"key": "2020-03", "cells": []}]}
        seasonal_runtime.store_snapshot(gmet, source="gmet", valid_from="2020-01-01 00:00:00", valid_to="2020-06-01 00:00:00")

        import asyncio
        asyncio.run(seasonal_runtime.load_snapshot(force=True))
        self.assertEqual(seasonal_runtime.current()["source"], "seas5")

    def test_a_new_run_is_needed_only_after_the_monthly_release(self):
        seasonal_runtime._SEAS5 = {"runDate": "2026-10-06"}
        self.assertFalse(seasonal_runtime.needs_new_run(date(2026, 10, 20)))
        self.assertFalse(seasonal_runtime.needs_new_run(date(2026, 11, 3)))
        self.assertTrue(seasonal_runtime.needs_new_run(date(2026, 11, 5)))
        seasonal_runtime._SEAS5 = {"runDate": "2026-10-02"}
        self.assertTrue(seasonal_runtime.needs_new_run(date(2026, 10, 6)))


class RouteTests(unittest.TestCase):
    def setUp(self):
        database.init_db()
        seasonal_runtime.reset_cache()
        with database.get_connection() as connection:
            connection.execute("DELETE FROM seasonal_snapshots")

    def tearDown(self):
        seasonal_runtime.reset_cache()

    def test_the_first_reader_computes_and_every_reader_after_gets_it(self):
        with patch.object(seasonal_runtime, "CLIMATOLOGY", fake_climatology()), \
             patch.object(seasonal_runtime, "_fetch", fake_fetch()):
            with TestClient(app) as client:
                data = client.get("/api/outlook/seasonal").json()["data"]
        self.assertFalse(data["unavailable"])
        self.assertEqual(data["source"], "seas5")
        self.assertEqual(data["geography"], "region")
        self.assertEqual(len(data["windows"]), 3)
        self.assertIn("ECMWF SEAS5", data["model"])

    def test_an_upstream_failure_is_reported_not_hidden(self):
        async def failing(points):
            raise RuntimeError("boom")

        with patch.object(seasonal_runtime, "_fetch", failing):
            with TestClient(app) as client:
                data = client.get("/api/outlook/seasonal").json()["data"]
        self.assertTrue(data["unavailable"])
        self.assertTrue(data["fetchFailed"])

    def test_refresh_requires_the_cron_secret(self):
        with TestClient(app) as client:
            with patch.object(config, "CRON_SECRET", ""):
                self.assertEqual(client.get("/api/outlook/seasonal/refresh").status_code, 503)
            with patch.object(config, "CRON_SECRET", "s3cret"):
                wrong = client.get("/api/outlook/seasonal/refresh", headers={"Authorization": "Bearer nope"})
                self.assertEqual(wrong.status_code, 401)

    def test_ingest_is_for_administrators_only_and_says_the_feed_is_not_set_up(self):
        with TestClient(app) as client:
            self.assertEqual(client.post("/api/outlook/seasonal/ingest").status_code, 401)
            token = register_and_login(client, "someone@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            with patch.object(config, "ADMIN_EMAILS", set()):
                self.assertEqual(client.post("/api/outlook/seasonal/ingest", headers=headers).status_code, 403)
            with patch.object(config, "ADMIN_EMAILS", {"someone@example.com"}), \
                 patch.object(config, "AZURE_SEASONAL_URL", ""):
                self.assertEqual(client.post("/api/outlook/seasonal/ingest", headers=headers).status_code, 503)


def register_and_login(client: TestClient, email: str) -> str:
    client.post("/api/v1/auth/register", json={"email": email, "password": "secret123", "name": "Test"})
    response = client.post("/api/v1/auth/login", data={"username": email, "password": "secret123"})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


if __name__ == "__main__":
    unittest.main()
