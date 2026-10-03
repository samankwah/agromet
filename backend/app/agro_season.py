"""Agro-climatic season indices: onset, cessation, dry spells, totals.

Pure functions, no I/O. The bake script and ``seasonal_runtime`` both use them,
so the baseline and the forecast are measured by exactly the same rules.

**Definitions.** The standard AGRHYMET / Sivakumar rules, as GMet applies them.
Every threshold lives in the block below, so GMet's own values can replace them
in one place:

* **Rainy day**: at least 1 mm.
* **Onset**: the first day from the season's search start with at least 20 mm
  over three consecutive days, *not followed* by a dry spell longer than 7 days
  in the next 30. A first heavy shower that is followed by a long dry spell is a
  false start, which costs farmers who plant on it their seed. No such day
  before the search ends means no onset that season.
* **Cessation**: from onset, a 70 mm soil water store fills with rain and loses
  5 mm a day. The first day after the season's reference date that the store is
  empty is the end of the season.
* **Early dry spell**: the longest run of dry days in the first 50 days after
  onset. **Late dry spell**: the longest from day 51 to cessation.

Ghana has two rainfall regimes. The south has a major season (from March) and a
minor season (from September); the north has a single season (from mid-April).
Each region belongs to one of the two sectors.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

# ---------------------------------------------------------------------------
# Thresholds (one place, so GMet's own values can be swapped in)
# ---------------------------------------------------------------------------

RAINY_DAY_MM = 1.0
ONSET_RAIN_MM = 20.0
ONSET_DAYS = 3
FALSE_START_DRY_DAYS = 7
FALSE_START_LOOKAHEAD_DAYS = 30
SOIL_CAPACITY_MM = 70.0
EVAPORATION_MM_PER_DAY = 5.0
EARLY_DRY_SPELL_DAYS = 50

# How far ahead SEAS5 reaches, in days from the run. Open-Meteo returns nulls
# after about day 215; a day of margin keeps a ragged last day out of the sums.
FORECAST_REACH_DAYS = 214
SEAS5_RELEASE_DAY = 5

NORTHERN_REGIONS = ("Northern", "Savannah", "North East", "Upper East", "Upper West")

MONTH_NAMES = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)


@dataclass(frozen=True)
class Season:
    key: str
    label: str
    sector: str  # "north" or "south"
    onset_start: tuple[int, int]  # (month, day)
    onset_end: tuple[int, int]
    cessation_reference: tuple[int, int]
    season_end: tuple[int, int]


SEASONS: dict[str, Season] = {
    "southern-major": Season("southern-major", "Southern Major Season", "south", (3, 1), (5, 31), (6, 15), (8, 15)),
    "southern-minor": Season("southern-minor", "Southern Minor Season", "south", (9, 1), (10, 31), (11, 1), (12, 15)),
    "northern": Season("northern", "Northern Single Season", "north", (4, 15), (7, 15), (9, 1), (11, 30)),
}

# The fixed three-month windows (MAM, MJJ, JAS, SON) rainfall totals, rainy days and temperature use.
WINDOWS: dict[str, tuple[int, str]] = {
    "MAM": (3, "March to May"),
    "MJJ": (5, "May to July"),
    "JAS": (7, "July to September"),
    "SON": (9, "September to November"),
}

SEASON_VARIABLES = ("onset", "cessation", "earlyDrySpell", "lateDrySpell")
WINDOW_VARIABLES = ("rainfallTotal", "rainyDays", "temperature")


def sector_of(region: str) -> str:
    return "north" if region in NORTHERN_REGIONS else "south"


def regions_in(season: Season, regions: list[str]) -> list[str]:
    return [name for name in regions if sector_of(name) == season.sector]


# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------

def on(year: int, month_day: tuple[int, int]) -> date:
    return date(year, month_day[0], month_day[1])


def next_season_year(season: Season, run_day: date) -> int:
    """The year of the next season whose onset search has not started yet."""
    year = run_day.year
    return year if on(year, season.onset_start) >= run_day else year + 1


def window_bounds(key: str, year: int) -> tuple[date, date]:
    start_month = WINDOWS[key][0]
    first = date(year, start_month, 1)
    end_month = start_month + 2
    last = date(year, end_month + 1, 1) - timedelta(days=1) if end_month < 12 else date(year, 12, 31)
    return first, last


def next_window_year(key: str, run_day: date) -> int:
    """The year of the next window that has not started yet."""
    first, _ = window_bounds(key, run_day.year)
    return run_day.year if first >= run_day else run_day.year + 1


def required_end(season: Season, year: int, variable: str) -> date:
    """The last day of data a season variable needs."""
    onset_end = on(year, season.onset_end)
    if variable == "onset":
        return onset_end + timedelta(days=FALSE_START_LOOKAHEAD_DAYS)
    if variable == "earlyDrySpell":
        return onset_end + timedelta(days=EARLY_DRY_SPELL_DAYS)
    return on(year, season.season_end)


def reach_end(run_day: date) -> date:
    return run_day + timedelta(days=FORECAST_REACH_DAYS)


def available_from(needed_end: date) -> str:
    """The first SEAS5 release (5th of a month) whose reach covers ``needed_end``."""
    earliest = needed_end - timedelta(days=FORECAST_REACH_DAYS)
    release = date(earliest.year, earliest.month, SEAS5_RELEASE_DAY)
    if release < earliest:
        month = earliest.month + 1
        release = date(earliest.year + (month > 12), (month - 1) % 12 + 1, SEAS5_RELEASE_DAY)
    return release.strftime("%Y-%m")


def week_label(day: date) -> str:
    """"Week 3 of March": plain words, no dashes, as the app shows dates."""
    week = min((day.day - 1) // 7 + 1, 4)
    return f"Week {week} of {MONTH_NAMES[day.month - 1]}"


def day_of_year(day: date) -> int:
    return day.timetuple().tm_yday


def from_day_of_year(year: int, doy: float) -> date:
    return date(year, 1, 1) + timedelta(days=round(doy) - 1)


# ---------------------------------------------------------------------------
# Indices on one daily series
# ---------------------------------------------------------------------------

class Series:
    """A daily rainfall (or temperature) series indexed by date."""

    def __init__(self, first_day: date, values: list[float | None]):
        self.first = first_day
        self.values = values

    def index(self, day: date) -> int:
        return (day - self.first).days

    def covers(self, start: date, end: date) -> bool:
        lo, hi = self.index(start), self.index(end)
        if lo < 0 or hi >= len(self.values):
            return False
        return all(value is not None for value in self.values[lo : hi + 1])

    @property
    def last(self) -> date:
        return self.first + timedelta(days=len(self.values) - 1)

    def slice(self, start: date, end: date) -> list[float]:
        lo, hi = self.index(start), self.index(end)
        return [0.0 if value is None else float(value) for value in self.values[max(lo, 0) : hi + 1]]


def longest_dry_spell(rain: list[float]) -> int:
    longest = current = 0
    for value in rain:
        current = current + 1 if value < RAINY_DAY_MM else 0
        longest = max(longest, current)
    return longest


def onset_day(series: Series, season: Season, year: int) -> date | None:
    """First day meeting the onset rule, or None for no onset this season."""
    day = on(year, season.onset_start)
    last = on(year, season.onset_end)
    while day <= last:
        block = series.slice(day, day + timedelta(days=ONSET_DAYS - 1))
        if sum(block) >= ONSET_RAIN_MM:
            ahead = series.slice(day + timedelta(days=1), day + timedelta(days=FALSE_START_LOOKAHEAD_DAYS))
            if longest_dry_spell(ahead) <= FALSE_START_DRY_DAYS:
                return day
        day += timedelta(days=1)
    return None


def cessation_day(series: Series, season: Season, year: int, onset: date) -> date:
    """End of season by the soil water balance; the season end if it never empties.

    A forecast can stop before the season does. The walk then stops with the
    data, and the caller must not use the answer (``required_end`` says so).
    """
    reference = on(year, season.cessation_reference)
    end = min(on(year, season.season_end), series.last)
    store = 0.0
    day = onset
    while day <= end:
        rain = series.slice(day, day)[0]
        store = min(SOIL_CAPACITY_MM, max(0.0, store + rain - EVAPORATION_MM_PER_DAY))
        if day >= reference and store <= 0.0:
            return day
        day += timedelta(days=1)
    return end


def season_indices(series: Series, season: Season, year: int) -> dict:
    """Onset and cessation as day of year, and the two dry spells in days.

    A season with no onset has no cessation or dry spells either; ``onset`` is
    then None and the caller counts it as a late (failed) start.
    """
    onset = onset_day(series, season, year)
    if onset is None:
        return {"onset": None, "cessation": None, "earlyDrySpell": None, "lateDrySpell": None}
    cessation = cessation_day(series, season, year, onset)
    early_end = min(onset + timedelta(days=EARLY_DRY_SPELL_DAYS - 1), cessation)
    early = longest_dry_spell(series.slice(onset, early_end))
    late_start = onset + timedelta(days=EARLY_DRY_SPELL_DAYS)
    late = longest_dry_spell(series.slice(late_start, cessation)) if late_start <= cessation else 0
    return {
        "onset": day_of_year(onset),
        "cessation": day_of_year(cessation),
        "earlyDrySpell": early,
        "lateDrySpell": late,
    }


def window_indices(rain: Series, temp: Series | None, key: str, year: int) -> dict:
    first, last = window_bounds(key, year)
    values = rain.slice(first, last)
    result = {
        "rainfallTotal": round(sum(values), 1),
        "rainyDays": sum(1 for value in values if value >= RAINY_DAY_MM),
        "temperature": None,
    }
    if temp is not None:
        heat = temp.slice(first, last)
        if heat:
            result["temperature"] = round(sum(heat) / len(heat), 2)
    return result
