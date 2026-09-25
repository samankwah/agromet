"""One retrying GET for the Open-Meteo calls on the read path.

The bake scripts already have this (``build_s2s_climatology.request_json``), and
for the same reason: Open-Meteo enforces quotas, so a large call gets a 429 often
enough to plan for. The runtime modules never got the same treatment -- they did
a single ``get`` and let one 429 empty a whole response.

The budget here is much tighter than the scripts'. A script can wait fifteen
minutes because nobody is looking at it; these calls happen with a farmer waiting
on a cold cache and a client that gives up after ten seconds, so the retries have
to fit in the gap between "worth another try" and "the screen has already failed".
Three attempts inside about twenty-five seconds is that gap.
"""

from __future__ import annotations

import asyncio
import logging
import random
import time

import httpx

logger = logging.getLogger(__name__)

# 429 is the quota. The 5xx trio is Open-Meteo's load balancer shedding, which
# clears in seconds. Every other 4xx is a bad request that will fail identically
# on the next attempt, so retrying only delays the error.
RETRY_STATUS = frozenset({429, 502, 503, 504})

ATTEMPTS = 3
FIRST_DELAY = 2.0
TOTAL_BUDGET = 25.0


async def get_json(
    url: str,
    params: dict,
    *,
    timeout: float,
    attempts: int = ATTEMPTS,
    budget: float = TOTAL_BUDGET,
) -> dict | list:
    """GET with jittered exponential backoff on transient failures.

    Raises the last error when every attempt fails, so the caller's handler still
    sees a real exception to record. ``budget`` bounds the sleeping, not an
    in-flight request: a retry is skipped when there is no room left for it,
    which keeps a slow upstream from stacking timeouts on top of each other.
    """
    started = time.monotonic()
    delay = FIRST_DELAY

    for attempt in range(attempts):
        last = attempt == attempts - 1
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            if last or exc.response.status_code not in RETRY_STATUS:
                raise
            pending, reason = exc, f"HTTP {exc.response.status_code}"
        except (httpx.TransportError, httpx.StreamError) as exc:
            if last:
                raise
            pending, reason = exc, type(exc).__name__

        # Jitter matters more here than in the scripts: the two runtime callers
        # fire at the same moment from the same screen, and a fixed delay would
        # have them retry in lockstep into the same quota.
        wait = delay * (0.75 + random.random() * 0.5)
        if time.monotonic() - started + wait > budget:
            logger.warning("open-meteo %s, no budget left to retry (%s)", reason, url)
            raise pending
        logger.warning("open-meteo %s, retrying in %.1fs (%s)", reason, wait, url)
        await asyncio.sleep(wait)
        delay *= 2

    raise RuntimeError("unreachable")


def describe(exc: BaseException) -> str:
    """A short reason for an upstream failure, safe to put in a response body.

    The obvious `f"{type(exc).__name__}: {exc}"` is not safe here. httpx puts the
    full request URL in an HTTPStatusError, and these URLs carry 165 comma-joined
    coordinate pairs, so the "reason" came out at about four kilobytes of query
    string -- attached to every response, and logged. `logging_config` already
    silences httpx's own INFO lines for exactly that reason; this closes the same
    hole on the path that reaches the client.
    """
    if isinstance(exc, httpx.HTTPStatusError):
        return f"upstream returned HTTP {exc.response.status_code}"
    if isinstance(exc, httpx.TimeoutException):
        return "upstream timed out"
    if isinstance(exc, httpx.TransportError):
        return f"upstream unreachable ({type(exc).__name__})"
    return (str(exc) or type(exc).__name__)[:160]
