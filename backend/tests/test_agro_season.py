"""Onset, cessation, dry spells and window totals on synthetic daily rain."""

from __future__ import annotations

import unittest
from datetime import date, timedelta

from backend.app.agro_season import (
    SEASONS,
    Series,
    available_from,
    cessation_day,
    longest_dry_spell,
    next_season_year,
    next_window_year,
    onset_day,
    regions_in,
    required_end,
    season_indices,
    week_label,
    window_indices,
)

YEAR = 2027
MAJOR = SEASONS["southern-major"]


def rain_year(wet: dict[date, float] | None = None, base: float = 0.0) -> Series:
    """A whole year of ``base`` mm a day, with the given days overridden."""
    first = date(YEAR, 1, 1)
    values = [base] * 365
    for day, amount in (wet or {}).items():
        values[(day - first).days] = amount
    return Series(first, values)


def every(start: date, end: date, step: int, amount: float) -> dict[date, float]:
    days, day = {}, start
    while day <= end:
        days[day] = amount
        day += timedelta(days=step)
    return days


class OnsetTests(unittest.TestCase):
    def test_twenty_millimetres_in_three_days_then_steady_rain_is_the_onset(self):
        wet = {date(YEAR, 3, 20): 12.0, date(YEAR, 3, 21): 10.0}
        wet.update(every(date(YEAR, 3, 24), date(YEAR, 6, 30), 3, 6.0))
        self.assertEqual(onset_day(rain_year(wet), MAJOR, YEAR), date(YEAR, 3, 19))

    def test_a_heavy_shower_followed_by_a_long_dry_spell_is_a_false_start(self):
        wet = {date(YEAR, 3, 5): 30.0}  # then ten dry days
        wet.update(every(date(YEAR, 3, 16), date(YEAR, 6, 30), 2, 12.0))
        found = onset_day(rain_year(wet), MAJOR, YEAR)
        self.assertGreater(found, date(YEAR, 3, 5))

    def test_a_season_that_never_gets_going_has_no_onset(self):
        self.assertIsNone(onset_day(rain_year(base=2.0), MAJOR, YEAR))
        self.assertEqual(season_indices(rain_year(base=2.0), MAJOR, YEAR)["onset"], None)


class CessationAndDrySpellTests(unittest.TestCase):
    def test_the_season_ends_when_the_soil_store_runs_dry_after_the_reference_date(self):
        wet = every(date(YEAR, 3, 1), date(YEAR, 6, 30), 1, 8.0)
        series = rain_year(wet)
        # A full 70 mm store, then 5 mm a day out from 1 July: empty on 14 July.
        self.assertEqual(cessation_day(series, MAJOR, YEAR, date(YEAR, 3, 1)), date(YEAR, 7, 14))

    def test_rain_that_never_stops_ends_at_the_season_end(self):
        series = rain_year(base=8.0)
        self.assertEqual(cessation_day(series, MAJOR, YEAR, date(YEAR, 3, 1)), date(YEAR, 8, 15))

    def test_dry_spells_are_split_at_fifty_days_after_onset(self):
        wet = every(date(YEAR, 3, 1), date(YEAR, 8, 15), 1, 8.0)
        for offset in range(10, 16):  # six dry days early
            wet[date(YEAR, 3, 1) + timedelta(days=offset)] = 0.0
        for offset in range(70, 79):  # nine dry days late
            wet[date(YEAR, 3, 1) + timedelta(days=offset)] = 0.0
        found = season_indices(rain_year(wet), MAJOR, YEAR)
        self.assertEqual(found["onset"], date(YEAR, 3, 1).timetuple().tm_yday)
        self.assertEqual(found["earlyDrySpell"], 6)
        self.assertEqual(found["lateDrySpell"], 9)

    def test_drizzle_under_a_millimetre_is_a_dry_day(self):
        self.assertEqual(longest_dry_spell([0.5, 0.9, 1.0, 0.0, 0.0]), 2)


class WindowTests(unittest.TestCase):
    def test_totals_and_rainy_days_cover_the_three_months(self):
        series = rain_year(every(date(YEAR, 3, 1), date(YEAR, 5, 31), 2, 4.0))
        found = window_indices(series, None, "MAM", YEAR)
        self.assertEqual(found["rainyDays"], 46)
        self.assertEqual(found["rainfallTotal"], 184.0)
        self.assertIsNone(found["temperature"])


class CalendarTests(unittest.TestCase):
    def test_a_season_or_window_already_under_way_moves_to_next_year(self):
        self.assertEqual(next_season_year(MAJOR, date(2026, 10, 3)), 2027)
        self.assertEqual(next_season_year(SEASONS["southern-minor"], date(2026, 8, 1)), 2026)
        self.assertEqual(next_window_year("JAS", date(2026, 10, 3)), 2027)
        self.assertEqual(next_window_year("MAM", date(2027, 2, 10)), 2027)

    def test_ready_from_is_the_first_monthly_release_that_reaches_far_enough(self):
        needed = required_end(MAJOR, 2027, "onset")  # 30 June 2027
        self.assertEqual(needed, date(2027, 6, 30))
        self.assertEqual(available_from(needed), "2026-12")

    def test_dates_read_as_weeks_with_no_dashes(self):
        self.assertEqual(week_label(date(2027, 3, 17)), "Week 3 of March")
        self.assertEqual(week_label(date(2027, 3, 31)), "Week 4 of March")

    def test_each_season_covers_only_its_own_half_of_the_country(self):
        names = ["Ashanti", "Northern", "Upper East", "Volta"]
        self.assertEqual(regions_in(SEASONS["northern"], names), ["Northern", "Upper East"])
        self.assertEqual(regions_in(MAJOR, names), ["Ashanti", "Volta"])


if __name__ == "__main__":
    unittest.main()
