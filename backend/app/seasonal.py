"""Shared settings for the seasonal outlook: shrinkage and the dry-window test.

The indices themselves (onset, cessation, dry spells, totals) live in
``agro_season.py``; the fetch, bias scaling and storage in ``seasonal_runtime.py``.

**Bias.** ECMWF SEAS5 as Open-Meteo serves it is not bias-corrected. The runtime
uses linear scaling: Open-Meteo reports each month's anomaly against the
*model's* climate, so the ensemble mean minus that anomaly is the model's idea of
normal, and member rain is scaled by observed normal over model normal (and
temperature shifted by the gap) before any index is computed.
"""

from __future__ import annotations

WINDOW_MONTHS = 3

# Below about 30 mm a month the record is mostly dry days, the terciles sit
# within a few millimetres of each other, and a "wetter than normal" call means
# a shower or two. Calling that a seasonal signal would mislead, so such windows
# are marked dry and the app says it is the dry season instead.
DRY_MONTHLY_MM = 30.0

# How much of the raw ensemble split to trust. Seasonal ensembles are
# overconfident: 51 members agree closely on a seasonal value, while real
# seasons vary far more, so raw counts routinely say "100% warmer". Blending
# with the climatological 1/3 each is the standard remedy when hindcast skill is
# not available: with 0.6 a unanimous ensemble reads about 73%, and a weak
# signal stays near even odds. Revisit if a hindcast skill estimate is added.
SKILL_WEIGHT = 0.6


def shrink_to_climatology(probabilities: dict, weight: float = SKILL_WEIGHT) -> dict:
    """Blend an ensemble split with climatology's even thirds (see SKILL_WEIGHT)."""
    shrunk = dict(probabilities)
    for name in ("below", "normal", "above"):
        shrunk[name] = weight * probabilities[name] + (1 - weight) / 3
    return shrunk


def is_dry_window(rain_normal_mm: float | None) -> bool:
    """True when a three-month window's normal total is dry-season rain."""
    return rain_normal_mm is not None and rain_normal_mm < DRY_MONTHLY_MM * WINDOW_MONTHS
