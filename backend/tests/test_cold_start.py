"""What a fresh serverless instance pays before it can answer.

Every new Vercel instance starts with empty module dicts. These tests wipe the
in-memory copies (the "cold start") while leaving the database alone, and check
that the live feeds are then served from the stored row with no upstream call,
and that startup does not rerun the schema or the market seed.
"""

from __future__ import annotations

import asyncio
import unittest
from datetime import timedelta
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from backend.app import (
    config,
    database,
    hazard_runtime,
    precip_runtime,
    snapshot_store,
    weather_runtime,
)
from backend.app.main import app
from backend.app.routers import market


def _forget_memory(module) -> None:
    """Empty one runtime's in-process copy, as a new instance would have it."""
    module._CACHE = {}
    module._CACHE_STAMP = 0.0
    module._LAST_ERROR = None
    module._LAST_ATTEMPT = 0.0
    module._LAST_LOAD = 0.0


class SnapshotStoreTests(unittest.TestCase):
    def setUp(self):
        snapshot_store.clear("test:")

    def tearDown(self):
        snapshot_store.clear("test:")

    def test_keeps_only_the_newest_row_per_kind(self):
        snapshot_store.store("test:a", {"v": 1})
        snapshot_store.store("test:a", {"v": 2})
        snapshot_store.store("test:b", {"v": 9})

        self.assertEqual(snapshot_store.read_latest("test:a")[0], {"v": 2})
        self.assertEqual(snapshot_store.read_latest("test:b")[0], {"v": 9})
        with database.get_connection() as connection:
            count = connection.execute(
                "SELECT COUNT(*) AS n FROM runtime_snapshots WHERE kind = ?", ("test:a",)
            ).fetchone()
        self.assertEqual(dict(count)["n"], 1)

    def test_missing_kind_reads_as_none(self):
        self.assertIsNone(snapshot_store.read_latest("test:nothing"))

    def test_prune_only_touches_old_rows_under_the_prefix(self):
        snapshot_store.store("test:old", {"v": 1})
        with database.get_connection() as connection:
            connection.execute(
                "UPDATE runtime_snapshots SET computed_at = ? WHERE kind = ?",
                ("2000-01-01 00:00:00", "test:old"),
            )
        snapshot_store.store("test:new", {"v": 2})

        self.assertEqual(snapshot_store.prune("test:", timedelta(days=1)), 1)
        self.assertIsNone(snapshot_store.read_latest("test:old"))
        self.assertIsNotNone(snapshot_store.read_latest("test:new"))


class HazardColdStartTests(unittest.TestCase):
    SNAPSHOT = {"Ashanti": {"region": "Ashanti", "flood": {}, "drought": {}}}

    def setUp(self):
        hazard_runtime.reset_cache()

    def tearDown(self):
        hazard_runtime.reset_cache()

    def test_refresh_stores_the_snapshot(self):
        with patch.object(hazard_runtime, "compute_snapshot", AsyncMock(return_value=self.SNAPSHOT)):
            self.assertTrue(asyncio.run(hazard_runtime.refresh(force=True)))

        self.assertEqual(snapshot_store.read_latest(hazard_runtime.SNAPSHOT_KIND)[0], self.SNAPSHOT)

    def test_a_cold_instance_serves_the_stored_row_without_upstream(self):
        snapshot_store.store(hazard_runtime.SNAPSHOT_KIND, self.SNAPSHOT)
        _forget_memory(hazard_runtime)

        compute = AsyncMock(side_effect=AssertionError("must not fetch"))
        with patch.object(hazard_runtime, "compute_snapshot", compute):
            asyncio.run(hazard_runtime.ensure_fresh())

        self.assertEqual(compute.await_count, 0)
        self.assertEqual(hazard_runtime.cached_snapshot()[0], self.SNAPSHOT)
        self.assertFalse(hazard_runtime.is_stale())

    def test_a_failed_fetch_is_not_retried_on_every_request(self):
        compute = AsyncMock(side_effect=RuntimeError("upstream down"))
        with patch.object(hazard_runtime, "compute_snapshot", compute):
            asyncio.run(hazard_runtime.ensure_fresh())
            asyncio.run(hazard_runtime.ensure_fresh())

        self.assertEqual(compute.await_count, 1)


class HazardCronTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        hazard_runtime.reset_cache()

    def tearDown(self):
        hazard_runtime.reset_cache()

    def test_refuses_without_the_cron_secret(self):
        with patch.object(config, "CRON_SECRET", "s3cret"):
            response = self.client.get("/api/hazards/refresh")
        self.assertEqual(response.status_code, 401)

    def test_refreshes_and_stores_with_the_cron_secret(self):
        snapshot = HazardColdStartTests.SNAPSHOT
        with patch.object(config, "CRON_SECRET", "s3cret"), patch.object(
            hazard_runtime, "compute_snapshot", AsyncMock(return_value=snapshot)
        ):
            response = self.client.get("/api/hazards/refresh", headers={"Authorization": "Bearer s3cret"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["regions"], 1)
        self.assertIsNotNone(snapshot_store.read_latest(hazard_runtime.SNAPSHOT_KIND))


class PrecipitationColdStartTests(unittest.TestCase):
    FIELD = {"times": ["2026-08-27T00:00Z"], "values": [[0.0]]}

    def setUp(self):
        precip_runtime.reset_cache()

    def tearDown(self):
        precip_runtime.reset_cache()

    def test_a_cold_instance_serves_the_stored_field_without_upstream(self):
        snapshot_store.store(precip_runtime.SNAPSHOT_KIND, self.FIELD)
        _forget_memory(precip_runtime)

        fetch = AsyncMock(side_effect=AssertionError("must not fetch"))
        with patch.object(precip_runtime, "_fetch_field", fetch):
            asyncio.run(precip_runtime.ensure_fresh())

        self.assertEqual(fetch.await_count, 0)
        self.assertEqual(precip_runtime.cached_snapshot()[0], self.FIELD)


class WeatherColdStartTests(unittest.TestCase):
    ACCRA = (5.6037, -0.187)
    TAMALE = (9.4034, -0.8424)

    def setUp(self):
        weather_runtime.reset_cache()

    def tearDown(self):
        weather_runtime.reset_cache()

    def test_a_cold_instance_serves_the_stored_bundle_without_upstream(self):
        bundle = {"current": {"temperature_2m": 29.0}}
        with patch.object(weather_runtime, "_fetch", AsyncMock(return_value=bundle)):
            asyncio.run(weather_runtime.ensure_fresh(*self.ACCRA))

        # A new instance: memory gone, database kept.
        weather_runtime._CACHE.clear()
        weather_runtime._CACHE_STAMPS.clear()
        weather_runtime._LAST_LOADS.clear()

        fetch = AsyncMock(side_effect=AssertionError("must not fetch"))
        with patch.object(weather_runtime, "_fetch", fetch):
            asyncio.run(weather_runtime.ensure_fresh(*self.ACCRA))

        self.assertEqual(fetch.await_count, 0)
        key = weather_runtime.cache_key(*self.ACCRA)
        self.assertEqual(weather_runtime.cached_bundle(key), bundle)

    def test_different_places_do_not_wait_on_each_other(self):
        """One global lock made every town queue behind the slowest fetch."""
        accra_started = asyncio.Event()
        release_accra = asyncio.Event()

        async def fake_fetch(lat, lng):
            if (lat, lng) == self.ACCRA:
                accra_started.set()
                await release_accra.wait()
            return {"current": {"temperature_2m": lat}}

        async def scenario():
            accra = asyncio.create_task(weather_runtime.refresh(*self.ACCRA, force=True))
            await accra_started.wait()
            # Tamale must finish while Accra is still stuck upstream.
            tamale_done = await asyncio.wait_for(weather_runtime.refresh(*self.TAMALE, force=True), 2)
            release_accra.set()
            return tamale_done, await accra

        with patch.object(weather_runtime, "_fetch", side_effect=fake_fetch):
            tamale_done, accra_done = asyncio.run(scenario())

        self.assertTrue(tamale_done)
        self.assertTrue(accra_done)


class StartupWorkTests(unittest.TestCase):
    def test_init_db_records_the_schema_version(self):
        database.init_db()
        self.assertEqual(database.get_meta("schema_version"), database.SCHEMA_VERSION)

    def test_init_db_skips_the_script_when_the_schema_is_current(self):
        database.init_db()

        calls = []
        real_connect = database._connect

        def counting_connect():
            calls.append(1)
            return real_connect()

        with patch.object(database, "_connect", side_effect=counting_connect):
            database.init_db()

        # One connection, for the version check, and no schema script.
        self.assertEqual(len(calls), 1)

    def test_market_seed_is_skipped_when_unchanged(self):
        market.seed_market_data()

        calls = []
        real_connect = database._connect

        def counting_connect():
            calls.append(1)
            return real_connect()

        with patch.object(database, "_connect", side_effect=counting_connect):
            market.seed_market_data()

        self.assertEqual(len(calls), 1)
        self.assertEqual(database.get_meta("market_seed_version"), market.SEED_VERSION)


if __name__ == "__main__":
    unittest.main()
