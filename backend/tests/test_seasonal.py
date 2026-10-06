"""The seasonal outlook: seasons and windows, bias scaling, reach, storage, precedence, routes."""

from __future__ import annotations

import unittest
from datetime import date, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app import config, database, seasonal_runtime
from backend.app.agro_season import NORTHERN_REGIONS, week_label
from backend.app.hazards import GHANA_REGIONS
from backend.app.main import app
from backend.app.seasonal import SKILL_WEIGHT, is_dry_window, shrink_to_climatology

# A February run reaches into September: the southern major season and MAM are
# in reach, the northern season's end and the minor season are not.
RUN_DAY = date(2027, 2, 6)
DAYS = 215


class ShrinkageTests(unittest.TestCase):
    def test_a_unanimous_ensemble_does_not_read_as_certain(self):
        shrunk = shrink_to_climatology({"below": 0.0, "normal": 0.0, "above": 1.0})
        self.assertAlmostEqual(shrunk["above"], SKILL_WEIGHT + (1 - SKILL_WEIGHT) / 3)
        self.assertAlmostEqual(sum(shrunk[k] for k in ("below", "normal", "above")), 1.0)

    def test_under_thirty_millimetres_a_month_is_the_dry_season(self):
        self.assertTrue(is_dry_window(60.0))
        self.assertFalse(is_dry_window(300.0))
        self.assertFalse(is_dry_window(None))


# ---------------------------------------------------------------------------
# Runtime and routes
# ---------------------------------------------------------------------------

def stats(p33: float, p67: float, median: float) -> dict:
    return {"n": 30, "p33": p33, "p67": p67, "median": median, "mean": median}


def fake_climatology(monthly_rain: list[float] | None = None) -> dict:
    season = {
        "onset": stats(70, 90, 80),  # around 11 to 31 March
        "cessation": stats(200, 215, 208),
        "earlyDrySpell": stats(4, 8, 6),
        "lateDrySpell": stats(4, 8, 6),
    }
    northern = {**season, "onset": stats(140, 160, 150)}
    window = {"rainfallTotal": stats(300, 500, 400), "rainyDays": stats(40, 60, 50), "temperature": stats(30, 31, 30.5)}
    regions = {}
    for name in GHANA_REGIONS:
        regions[name] = {
            "seasons": {"southern-major": season, "southern-minor": season, "northern": northern},
            "windows": {key: dict(window) for key in ("MAM", "MJJ", "JAS", "SON")},
            "monthlyRain": monthly_rain or [],
        }
    return {"regions": regions}


def fake_fetch(
    rain_per_day: float = 8.0, temp: float = 31.5, rain_anomaly: float = 0.0, run_day: date = RUN_DAY,
    rain_days: int = DAYS, temp_days: int = DAYS,
):
    """What Open-Meteo returns for the sixteen regions: daily members and monthly anomalies.

    ``rain_days`` and ``temp_days`` cut a variable short with nulls, as the
    real feed does: its daily rain stops about a month before its daily high.
    """
    times = [(run_day + timedelta(days=i)).isoformat() for i in range(DAYS)]
    rain = [rain_per_day] * rain_days + [None] * (DAYS - rain_days)
    heat = [temp] * temp_days + [None] * (DAYS - temp_days)
    daily = {"time": times, "precipitation_sum": rain, "temperature_2m_max": heat}
    for member in range(1, 51):
        daily[f"precipitation_sum_member{member:02d}"] = list(rain)
        daily[f"temperature_2m_max_member{member:02d}"] = list(heat)
    months = [f"{run_day.year + (run_day.month - 1 + i) // 12}-{(run_day.month - 1 + i) % 12 + 1:02d}-01" for i in range(8)]
    monthly = {"time": months, "precipitation_anomaly": [rain_anomaly] * 8, "temperature_2m_anomaly": [0.0] * 8}

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

    def compute(self, monthly_rain=None, run_day: date = RUN_DAY, **kwargs):
        import asyncio

        with patch.object(seasonal_runtime, "CLIMATOLOGY", fake_climatology(monthly_rain)), \
             patch.object(seasonal_runtime, "_fetch", fake_fetch(run_day=run_day, **kwargs)):
            return asyncio.run(seasonal_runtime.compute_snapshot(run_day))

    def test_each_season_holds_only_its_own_sector_and_every_window_all_regions(self):
        snapshot = self.compute()
        self.assertEqual(set(snapshot["seasons"]), {"northern", "southern-major", "southern-minor"})
        self.assertEqual(set(snapshot["windows"]), {"MAM", "MJJ", "JAS", "SON"})
        northern = {cell["region"] for cell in snapshot["seasons"]["northern"]["cells"]}
        southern = {cell["region"] for cell in snapshot["seasons"]["southern-major"]["cells"]}
        self.assertEqual(northern, set(NORTHERN_REGIONS))
        self.assertFalse(northern & southern)
        self.assertEqual(len(northern) + len(southern), len(GHANA_REGIONS))
        for block in snapshot["windows"].values():
            self.assertEqual(len(block["cells"]), len(GHANA_REGIONS))
        self.assertEqual(snapshot["seasons"]["northern"]["label"], "Northern Single Season")

    def test_an_early_steady_start_reads_earlier_than_normal(self):
        onset = self.compute()["seasons"]["southern-major"]["cells"][0]["onset"]
        self.assertTrue(onset["available"])
        self.assertEqual(onset["display"], "Week 1 of March")
        self.assertEqual(onset["category"], "below")
        self.assertAlmostEqual(sum(onset["probabilities"].values()), 1.0, places=2)

    def test_a_season_beyond_the_model_reach_shows_the_normal_and_when_it_will_be_ready(self):
        snapshot = self.compute()
        minor = snapshot["seasons"]["southern-minor"]["cells"][0]["onset"]
        self.assertFalse(minor["available"])
        self.assertEqual(minor["availableFrom"], "2027-06")
        self.assertEqual(minor["normalDisplay"], week_label(date(2027, 1, 1) + timedelta(days=79)))
        self.assertNotIn("probabilities", minor)
        north = snapshot["seasons"]["northern"]["cells"][0]
        self.assertTrue(north["onset"]["available"])
        self.assertFalse(north["cessation"]["available"])

    def test_a_wet_model_is_scaled_down_before_onset_is_found(self):
        # The model's 8 mm a day against a normal near 4 mm halves every member:
        # 12 mm in three days never makes an onset, so all members read late.
        onset = self.compute(monthly_rain=[120.0] * 12)["seasons"]["southern-major"]["cells"][0]["onset"]
        self.assertEqual(onset["category"], "above")
        self.assertEqual(onset["display"], "No clear start in most years")

    def test_window_totals_and_rainy_days_come_from_the_daily_rain(self):
        snapshot = self.compute()
        cell = snapshot["windows"]["MAM"]["cells"][0]
        self.assertEqual(cell["rainyDays"]["value"], 92)
        self.assertEqual(cell["rainfallTotal"]["value"], 736.0)
        self.assertEqual(cell["rainfallTotal"]["category"], "above")
        self.assertIn("dryWindow", cell["rainfallTotal"])
        # The run reaches 8 September: two thirds of July to September, not of
        # September to November.
        self.assertTrue(snapshot["windows"]["JAS"]["cells"][0]["rainfallTotal"]["available"])
        self.assertFalse(snapshot["windows"]["SON"]["cells"][0]["rainfallTotal"]["available"])

    def test_a_window_two_thirds_in_reach_gets_chances_with_the_rest_filled_by_the_usual(self):
        # An October run reaches 8 May: 69 of March to May's 92 days. The seen
        # days are scaled by the usual over the model in March and April
        # (200 / 244 mm); the last 23 days of May get the usual 100 mm / 31.
        snapshot = self.compute(monthly_rain=[100.0] * 12, run_day=date(2026, 10, 6), rain_per_day=4.0)
        cell = snapshot["windows"]["MAM"]["cells"][0]
        self.assertTrue(cell["rainfallTotal"]["available"])
        self.assertIn("probabilities", cell["rainfallTotal"])
        self.assertAlmostEqual(cell["rainfallTotal"]["value"], 69 * 4.0 * 200 / 244 + 23 * 100 / 31, delta=0.2)
        self.assertTrue(cell["rainyDays"]["available"])
        self.assertTrue(cell["temperature"]["available"])

    def test_a_window_mostly_past_the_reach_waits_and_says_when(self):
        snapshot = self.compute(monthly_rain=[100.0] * 12, run_day=date(2026, 10, 6))
        mjj = snapshot["windows"]["MJJ"]["cells"][0]["rainfallTotal"]
        self.assertFalse(mjj["available"])
        self.assertNotIn("probabilities", mjj)
        # Two thirds of May to July is 1 July. The daily rain runs 180 days from
        # a release, so the January run is the first to reach it.
        self.assertEqual(mjj["availableFrom"], "2027-01")

    def test_temperature_gets_chances_while_the_rain_data_falls_short(self):
        # The October 2026 run as it came back: rain to 3 April (179 days from
        # the 6th), daily highs to 3 May (209 days).
        snapshot = self.compute(monthly_rain=[100.0] * 12, run_day=date(2026, 10, 6), rain_days=180, temp_days=210)
        cell = snapshot["windows"]["MAM"]["cells"][0]
        self.assertFalse(cell["rainfallTotal"]["available"])
        self.assertEqual(cell["rainfallTotal"]["availableFrom"], "2026-11")
        self.assertFalse(cell["rainyDays"]["available"])
        self.assertTrue(cell["temperature"]["available"])
        self.assertIn("probabilities", cell["temperature"])

    def test_a_gmet_snapshot_in_force_is_served_first_with_the_model_alongside(self):
        seasonal_runtime.store_snapshot(self.compute())
        gmet = {"source": "gmet", "issuedBy": "Ghana Meteorological Agency", "runDate": "2027-02-01",
                "seasons": {"southern-major": {"key": "southern-major", "cells": []}}, "windows": {}}
        seasonal_runtime.store_snapshot(gmet, source="gmet", valid_from="2026-01-01 00:00:00", valid_to="2099-01-01 00:00:00")

        import asyncio
        asyncio.run(seasonal_runtime.load_snapshot(force=True))
        current = seasonal_runtime.current()
        self.assertEqual(current["source"], "gmet")
        self.assertEqual(current["issuedBy"], "Ghana Meteorological Agency")
        self.assertEqual(set(current["modelSeasons"]), {"northern", "southern-major", "southern-minor"})
        self.assertEqual(set(current["modelWindows"]), {"MAM", "MJJ", "JAS", "SON"})

    def test_an_expired_gmet_snapshot_falls_back_to_the_model(self):
        seasonal_runtime.store_snapshot(self.compute())
        gmet = {"source": "gmet", "seasons": {}, "windows": {}}
        seasonal_runtime.store_snapshot(gmet, source="gmet", valid_from="2020-01-01 00:00:00", valid_to="2020-06-01 00:00:00")

        import asyncio
        asyncio.run(seasonal_runtime.load_snapshot(force=True))
        self.assertEqual(seasonal_runtime.current()["source"], "seas5")

    def test_a_snapshot_stored_in_the_old_shape_counts_as_none(self):
        old = {"source": "seas5", "runDate": "2026-10-03", "windows": [{"key": "2026-11", "cells": []}]}
        seasonal_runtime.store_snapshot(old)

        import asyncio
        asyncio.run(seasonal_runtime.load_snapshot(force=True))
        self.assertTrue(seasonal_runtime.needs_new_run(date(2026, 10, 4)))
        self.assertEqual(seasonal_runtime.current()["seasons"], {})

    def test_a_snapshot_made_under_an_older_window_rule_counts_as_none(self):
        stored = self.compute()
        stored.pop("windowRule")
        seasonal_runtime.store_snapshot(stored)

        import asyncio
        asyncio.run(seasonal_runtime.load_snapshot(force=True))
        self.assertTrue(seasonal_runtime.needs_new_run(date(2027, 2, 7)))

    def test_a_snapshot_missing_a_window_this_code_defines_counts_as_none(self):
        snapshot = self.compute()
        del snapshot["windows"]["SON"]
        seasonal_runtime.store_snapshot(snapshot)

        import asyncio
        asyncio.run(seasonal_runtime.load_snapshot(force=True))
        self.assertEqual(seasonal_runtime.current()["windows"], {})

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
        self.assertEqual(len(data["seasons"]), 3)
        self.assertEqual(len(data["windows"]), 4)
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
