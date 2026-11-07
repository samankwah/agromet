"""Severe-weather warnings from an Open-Meteo bundle, and when to send them.

A line-for-line port of the app's `mobile/src/shared/domain/weatherHazards.ts`
(`evaluateDay`, `synthesiseWeatherAlerts`): same four hazards, same thresholds,
same wording, so the notification a farmer gets says what the banner in the app
says. The shared fixture in `tests/fixtures/weather_warnings_cases.json`, with a
copy in the mobile repo, keeps the two in step. Change a threshold in one and
the other's test fails.

Pure: no I/O. `routers/push.py` feeds it bundles from `weather_runtime` and
sends what `is_due` says is due.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

# WMO weather codes 95-99 are all thunderstorm; 96 and 99 add hail.
STORM_MIN_CODE = 95
STORM_HAIL_CODES = {96, 99}

# A day's rain total. 30 mm stops field work; 60 mm floods compounds. Both need
# the chance of rain to be more than even.
HEAVY_RAIN_MM = 30
TORRENTIAL_RAIN_MM = 60
RAIN_PROBABILITY_FLOOR = 60

# Feels-like daily high.
EXTREME_HEAT_C = 40
DANGEROUS_HEAT_C = 43

# Peak wind gust.
STRONG_GUST_KPH = 60
DAMAGING_GUST_KPH = 85

HAZARDS = ("thunderstorm", "heavy-rain", "extreme-heat", "strong-wind")

HAZARD_TYPE = {
    "thunderstorm": "Thunderstorm",
    "heavy-rain": "Heavy rain",
    "extreme-heat": "Extreme heat",
    "strong-wind": "Strong wind",
}

HAZARD_PRIORITY = ["thunderstorm", "heavy-rain", "strong-wind", "extreme-heat"]
SEVERITY_ORDER = ["advisory", "watch", "warning", "emergency"]


def js_round(value: float) -> int:
    """JavaScript's Math.round: halves go up. Python's round() sends 2.5 to 2,
    which would make a notification disagree with the banner by a degree."""
    return math.floor(value + 0.5)


def _number(value) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value) if math.isfinite(value) else None


def _daily_at(daily: dict, name: str, index: int) -> float | None:
    values = daily.get(name) or []
    return _number(values[index]) if index < len(values) else None


def _day_offset(date: str, now: datetime) -> int | None:
    try:
        target = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        return None
    return (target - now.astimezone(timezone.utc).date()).days


def _storm_hour(hourly: dict, date: str) -> int | None:
    times = hourly.get("time") or []
    codes = hourly.get("weather_code") or []
    capes = hourly.get("cape") or []
    for i, stamp in enumerate(times):
        if not str(stamp).startswith(date):
            continue
        code = _number(codes[i]) if i < len(codes) else None
        cape = _number(capes[i]) if i < len(capes) else None
        if (code is not None and code >= STORM_MIN_CODE) or (cape is not None and cape >= 1500):
            return int(str(stamp)[11:13])
    return None


def _when(offset: int, hour: int | None) -> str:
    if offset != 0:
        return "tomorrow"
    if hour is None:
        return "today"
    if hour < 11:
        return "this morning"
    if hour < 16:
        return "this afternoon"
    if hour < 20:
        return "this evening"
    return "tonight"


@dataclass
class Warning:
    id: str
    hazard: str
    hazard_type: str
    severity: str
    headline: str
    date: str
    expires_at: datetime
    onset: datetime | None
    place_name: str
    region: str
    evidence: list[str] = field(default_factory=list)


def _evaluate_day(daily: dict, hourly: dict, index: int, offset: int) -> list[dict]:
    date = str((daily.get("time") or [""])[index])
    findings: list[dict] = []

    code = _daily_at(daily, "weather_code", index)
    if code is not None and code >= STORM_MIN_CODE:
        hail = int(code) in STORM_HAIL_CODES
        hour = _storm_hour(hourly, date) if offset == 0 else None
        findings.append(
            {
                "hazard": "thunderstorm",
                "severity": "emergency" if hail else "warning",
                "headline": f"Thunderstorms likely {_when(offset, hour)}{', with hail possible' if hail else ''}",
                "evidence": [f"Forecast: thunderstorms (weather code {int(code)})"],
                "onset_hour": hour,
            }
        )

    rain = _daily_at(daily, "precipitation_sum", index)
    probability = _daily_at(daily, "precipitation_probability_max", index)
    probability = 100.0 if probability is None else probability
    if rain is not None and rain >= HEAVY_RAIN_MM and probability >= RAIN_PROBABILITY_FLOOR:
        findings.append(
            {
                "hazard": "heavy-rain",
                "severity": "emergency" if rain >= TORRENTIAL_RAIN_MM else "warning",
                "headline": f"Heavy rain expected {_when(offset, None)}, around {js_round(rain)} mm",
                "evidence": [f"Rain total: about {js_round(rain)} mm", f"Chance of rain: {js_round(probability)}%"],
                "onset_hour": None,
            }
        )

    feels = _daily_at(daily, "apparent_temperature_max", index)
    air = _daily_at(daily, "temperature_2m_max", index)
    heat = feels if feels is not None else air
    if heat is not None and heat >= EXTREME_HEAT_C:
        using_feels = feels is not None
        findings.append(
            {
                "hazard": "extreme-heat",
                "severity": "emergency" if heat >= DANGEROUS_HEAT_C else "warning",
                "headline": f"Extreme heat {_when(offset, None)}, {'feels like ' if using_feels else 'up to '}{js_round(heat)}°C",
                "evidence": [f"Feels-like high: {js_round(heat)}°C"] if using_feels else [f"Air temperature high: {js_round(heat)}°C"],
                "onset_hour": None,
            }
        )

    gust = _daily_at(daily, "wind_gusts_10m_max", index)
    mean = _daily_at(daily, "wind_speed_10m_max", index)
    wind = gust if gust is not None else mean
    if wind is not None and wind >= STRONG_GUST_KPH:
        using_gust = gust is not None
        findings.append(
            {
                "hazard": "strong-wind",
                "severity": "emergency" if wind >= DAMAGING_GUST_KPH else "warning",
                "headline": f"Strong winds {_when(offset, None)}, {'gusts to ' if using_gust else 'winds to '}{js_round(wind)} km/h",
                "evidence": [f"Peak gusts: {js_round(wind)} km/h"] if using_gust else [f"Sustained wind: {js_round(wind)} km/h"],
                "onset_hour": None,
            }
        )

    return findings


def warnings_for(bundle: dict, place_key: str, place_name: str, region: str, now: datetime) -> list[Warning]:
    """Today's and tomorrow's warnings for one place, most serious first."""
    daily = bundle.get("daily") or {}
    hourly = bundle.get("hourly") or {}
    dates = daily.get("time") or []
    out: list[Warning] = []
    for index, date in enumerate(dates):
        offset = _day_offset(str(date), now)
        if offset not in (0, 1):
            continue
        for finding in _evaluate_day(daily, hourly, index, offset):
            day = datetime.strptime(str(date), "%Y-%m-%d").replace(tzinfo=timezone.utc)
            onset = day + timedelta(hours=finding["onset_hour"]) if finding["onset_hour"] is not None else None
            out.append(
                Warning(
                    id=f"weather:{place_key}:{finding['hazard']}:{date}",
                    hazard=finding["hazard"],
                    hazard_type=HAZARD_TYPE[finding["hazard"]],
                    severity=finding["severity"],
                    headline=finding["headline"],
                    date=str(date),
                    expires_at=day + timedelta(hours=23, minutes=59, seconds=59),
                    onset=onset,
                    place_name=place_name,
                    region=region,
                    evidence=finding["evidence"],
                )
            )
    out.sort(
        key=lambda w: (
            -SEVERITY_ORDER.index(w.severity),
            w.expires_at,
            HAZARD_PRIORITY.index(w.hazard),
        )
    )
    return out


# --------------------------------------------------------------------------
# When to send
# --------------------------------------------------------------------------

EVENING_BEFORE_HOUR = 18
MORNING_HOUR = 6
QUIET_FROM_HOUR = 21
STORM_LEAD = timedelta(hours=2)


def is_due(warning: Warning, now: datetime) -> bool:
    """Whether a warning should go out now. Ghana keeps GMT, so UTC hours are
    local hours.

    - Tomorrow's warnings from 18:00 the evening before.
    - Today's from 06:00, or as soon as one appears later in the day.
    - A thunderstorm with a known start: from two hours before it.
    - Never after it has expired.
    - Quiet from 21:00 to 06:00, except for emergencies.
    """
    now = now.astimezone(timezone.utc)
    if now >= warning.expires_at:
        return False

    quiet = now.hour >= QUIET_FROM_HOUR or now.hour < MORNING_HOUR
    if quiet and warning.severity != "emergency":
        return False

    day = datetime.strptime(warning.date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    if warning.onset is not None:
        return now >= warning.onset - STORM_LEAD
    if now < day:
        # Tomorrow's: from the evening before.
        return now >= day - timedelta(hours=24 - EVENING_BEFORE_HOUR)
    return now >= day + timedelta(hours=MORNING_HOUR) or warning.severity == "emergency"


def notification_text(warning: Warning) -> tuple[str, str]:
    """Title and body. The title names the hazard and its level, the body is the
    banner's own headline with the place."""
    level = "emergency" if warning.severity == "emergency" else "warning"
    title = f"{warning.hazard_type} {level}"
    place = ", ".join(part for part in (warning.place_name, warning.region) if part)
    body = f"{warning.headline}. {place}" if place else warning.headline
    return title, body
