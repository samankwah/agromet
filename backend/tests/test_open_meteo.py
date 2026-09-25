"""The retrying GET that every Open-Meteo read-path call goes through.

The behaviour that matters is which failures it retries and which it does not: a
429 is the quota clearing in seconds, while a 400 is a request that will fail
identically forever, and retrying the second only delays the error the caller
needs to see.
"""

from __future__ import annotations

import unittest
from unittest.mock import AsyncMock, patch

import httpx

from backend.app import open_meteo

URL = "https://example.invalid/v1/forecast"


def response(status: int, payload: dict | list | None = None) -> httpx.Response:
    return httpx.Response(
        status,
        json=payload if payload is not None else {"ok": True},
        request=httpx.Request("GET", URL),
    )


class RetryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # The delays are the point of the module, not of the tests: sleeping
        # through them would add six real seconds per case.
        patcher = patch.object(open_meteo.asyncio, "sleep", AsyncMock())
        self.sleep = patcher.start()
        self.addCleanup(patcher.stop)

    async def test_returns_the_payload_on_the_first_try(self):
        get = AsyncMock(return_value=response(200, {"latitude": 8.0}))
        with patch("httpx.AsyncClient.get", get):
            payload = await open_meteo.get_json(URL, {}, timeout=5.0)

        self.assertEqual(payload, {"latitude": 8.0})
        self.assertEqual(get.await_count, 1)
        self.sleep.assert_not_awaited()

    async def test_recovers_from_a_429(self):
        """The failure this exists for: one quota rejection is not an outage."""
        get = AsyncMock(side_effect=[response(429), response(200, {"latitude": 8.0})])
        with patch("httpx.AsyncClient.get", get):
            payload = await open_meteo.get_json(URL, {}, timeout=5.0)

        self.assertEqual(payload, {"latitude": 8.0})
        self.assertEqual(get.await_count, 2)
        self.sleep.assert_awaited_once()

    async def test_recovers_from_a_dropped_connection(self):
        get = AsyncMock(
            side_effect=[httpx.ConnectError("reset"), response(200, {"latitude": 8.0})]
        )
        with patch("httpx.AsyncClient.get", get):
            payload = await open_meteo.get_json(URL, {}, timeout=5.0)

        self.assertEqual(payload, {"latitude": 8.0})
        self.assertEqual(get.await_count, 2)

    async def test_does_not_retry_a_bad_request(self):
        """A 400 is our own bug. Retrying it hides it behind a delay."""
        get = AsyncMock(return_value=response(400))
        with patch("httpx.AsyncClient.get", get):
            with self.assertRaises(httpx.HTTPStatusError):
                await open_meteo.get_json(URL, {}, timeout=5.0)

        self.assertEqual(get.await_count, 1)
        self.sleep.assert_not_awaited()

    async def test_gives_up_after_the_last_attempt_and_raises_the_real_error(self):
        # The caller records this in `_LAST_ERROR`, which is what reaches the
        # client as `error`, so the status code has to survive.
        get = AsyncMock(return_value=response(429))
        with patch("httpx.AsyncClient.get", get):
            with self.assertRaises(httpx.HTTPStatusError) as caught:
                await open_meteo.get_json(URL, {}, timeout=5.0)

        self.assertEqual(caught.exception.response.status_code, 429)
        self.assertEqual(get.await_count, open_meteo.ATTEMPTS)

    async def test_stops_when_the_budget_cannot_fit_another_wait(self):
        """A retry that lands after the client has given up is wasted work."""
        get = AsyncMock(return_value=response(503))
        with patch("httpx.AsyncClient.get", get):
            with self.assertRaises(httpx.HTTPStatusError):
                await open_meteo.get_json(URL, {}, timeout=5.0, attempts=5, budget=0.0)

        self.assertEqual(get.await_count, 1)
        self.sleep.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
