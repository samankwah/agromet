"""The maths behind the seasonal outlook.

Pure functions only, no I/O. The bake script
(``backend/scripts/build_seasonal_climatology.py``) and the runtime
(``backend/app/seasonal_runtime.py``) both import from here, for the reason
``s2s.py`` gives: if the months the baseline is summed over ever drifted from the
months the forecast is summed over, every probability would be quietly wrong.

**Windows.** A seasonal outlook speaks about three-month seasons, the IRI and C3S
convention: a run made in October covers November to January, December to
February and January to March. The first window starts next month, so the
month the forecast is made in, already partly over, never counts.

**Bias.** ECMWF SEAS5 as Open-Meteo serves it is not bias-corrected. Comparing
raw member totals against an ERA5 baseline would turn the model's own wet or dry
habit into a "signal" every single year. The correction here is linear scaling:
Open-Meteo reports each month's anomaly against the *model's* climate, so
subtracting it from the ensemble mean gives the model's idea of normal, and the
ERA5 tercile boundaries are moved by the gap between that and ERA5's normal
(scaled for rain, shifted for temperature). It is the simple, honest version of
what the major centres do with full hindcasts, and the response says which
method was used.
"""

from __future__ import annotations

from datetime import date, timedelta

from .s2s import agreement_confidence, dominant_category, tercile_probabilities

WINDOW_MONTHS = 3
WINDOW_COUNT = 3

# Below about 30 mm a month the record is mostly dry days, the terciles sit
# within a few millimetres of each other, and a "wetter than normal" call means
# a shower or two. Calling that a seasonal signal would mislead, so such windows
# are marked dry and the app says it is the dry season instead.
DRY_MONTHLY_MM = 30.0

# How much of the raw ensemble split to trust. Seasonal ensembles are
# overconfident: 51 members agree closely on a three-month average, while real
# seasons vary far more, so raw counts routinely say "100% warmer". Blending
# with the climatological 1/3 each is the standard remedy when hindcast skill is
# not available: with 0.6 a unanimous ensemble reads about 73%, and a weak
# signal stays near even odds. Revisit if a hindcast skill estimate is added.
SKILL_WEIGHT = 0.6

MONTH_NAMES = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def add_months(day: date, months: int) -> date:
    """The first day of the month ``months`` after ``day``'s month."""
    index = day.year * 12 + (day.month - 1) + months
    return date(index // 12, index % 12 + 1, 1)


def window_bounds(start_month: date) -> tuple[date, date]:
    """First and last day of the three-month window starting at ``start_month``."""
    first = date(start_month.year, start_month.month, 1)
    last = add_months(first, WINDOW_MONTHS) - timedelta(days=1)
    return first, last


def window_label(start_month: date) -> str:
    """"Nov to Jan": plain words, no dashes, as the app shows them."""
    first = start_month.month - 1
    return f"{MONTH_NAMES[first]} to {MONTH_NAMES[(first + WINDOW_MONTHS - 1) % 12]}"


def upcoming_windows(run_day: date) -> list[dict]:
    """The windows a run made on ``run_day`` speaks about."""
    windows = []
    for offset in range(1, WINDOW_COUNT + 1):
        start = add_months(run_day, offset)
        first, last = window_bounds(start)
        windows.append({
            "key": first.strftime("%Y-%m"),
            "startMonth": first.month,
            "label": window_label(first),
            "start": first.isoformat(),
            "end": last.isoformat(),
        })
    return windows


def reduce_window(times: list[str], series: list[float | None], start: str, end: str, *, mean: bool) -> float | None:
    """One member's window total (rain) or mean (temperature).

    None when any day in the window is missing. A run that stops part way
    through would otherwise report a short total as a dry season.
    """
    values = [value for day, value in zip(times, series) if start <= day <= end]
    expected = (date.fromisoformat(end) - date.fromisoformat(start)).days + 1
    if len(values) < expected or any(value is None for value in values):
        return None
    total = sum(float(value) for value in values)  # type: ignore[arg-type]
    return total / len(values) if mean else total


def months_in_window(start: str) -> list[str]:
    """The ``YYYY-MM`` keys of a window's months, to pick monthly anomalies."""
    first = date.fromisoformat(start)
    return [add_months(first, step).strftime("%Y-%m") for step in range(WINDOW_MONTHS)]


def model_normal(ensemble_value: float, anomalies: list[float | None], *, mean: bool) -> float | None:
    """The model's own normal for the window: its forecast minus its anomaly.

    Rain anomalies are monthly totals and add up over the window; temperature
    anomalies are averaged, like the temperature value itself.
    """
    usable = [float(value) for value in anomalies if value is not None]
    if len(usable) < len(anomalies) or not usable:
        return None
    anomaly = sum(usable) / len(usable) if mean else sum(usable)
    return ensemble_value - anomaly


def corrected_bounds(baseline: dict, prefix: str, model_norm: float | None, *, scale: bool) -> tuple[float, float] | None:
    """ERA5 tercile boundaries moved onto the model's climate.

    Rain is scaled by the ratio of the two normals, so a model that rains 20%
    too much has its boundaries raised 20% and its wet habit stops counting as a
    signal. Temperature is shifted by the difference. Without a usable model
    normal the ERA5 boundaries are used as they are, and the response marks the
    cell uncorrected.
    """
    p33 = baseline.get(f"{prefix}P33")
    p67 = baseline.get(f"{prefix}P67")
    normal = baseline.get(f"{prefix}Normal")
    if p33 is None or p67 is None:
        return None
    if model_norm is None or normal is None:
        return float(p33), float(p67)
    if scale:
        if normal <= 0 or model_norm <= 0:
            return float(p33), float(p67)
        ratio = model_norm / normal
        return float(p33) * ratio, float(p67) * ratio
    delta = model_norm - normal
    return float(p33) + delta, float(p67) + delta


def shrink_to_climatology(probabilities: dict, weight: float = SKILL_WEIGHT) -> dict:
    """Blend an ensemble split with climatology's even thirds (see SKILL_WEIGHT)."""
    shrunk = dict(probabilities)
    for name in ("below", "normal", "above"):
        shrunk[name] = weight * probabilities[name] + (1 - weight) / 3
    return shrunk


def is_dry_window(rain_normal_mm: float | None) -> bool:
    return rain_normal_mm is not None and rain_normal_mm < DRY_MONTHLY_MM * WINDOW_MONTHS


def summarise_variable(
    members: list[float | None],
    baseline: dict,
    prefix: str,
    anomalies: list[float | None],
    *,
    mean: bool,
    scale: bool,
) -> dict | None:
    """One variable for one place and window, ready for the response."""
    usable = [value for value in members if value is not None]
    if not usable:
        return None
    ensemble_value = sum(usable) / len(usable)
    norm = model_normal(ensemble_value, anomalies, mean=mean)
    bounds = corrected_bounds(baseline, prefix, norm, scale=scale)

    built: dict = {
        "value": round(ensemble_value, 2),
        "members": len(usable),
        "normal": baseline.get(f"{prefix}Normal"),
        "biasCorrected": norm is not None,
    }
    if bounds is not None:
        probabilities = tercile_probabilities(members, bounds[0], bounds[1])
        if probabilities is not None:
            probabilities = shrink_to_climatology(probabilities)
            built.update({
                "probabilities": {
                    "below": round(probabilities["below"], 3),
                    "normal": round(probabilities["normal"], 3),
                    "above": round(probabilities["above"], 3),
                },
                "category": dominant_category(probabilities),
                "confidence": agreement_confidence(probabilities),
                "noSignal": probabilities["degenerate"],
            })
    return built
