from __future__ import annotations

import json
import unittest
from datetime import datetime, timezone
from pathlib import Path

from backend.app.weather_warnings import Warning, is_due, js_round, notification_text, warnings_for

CASES = json.loads((Path(__file__).parent / "fixtures" / "weather_warnings_cases.json").read_text(encoding="utf-8"))["cases"]


def at(stamp: str) -> datetime:
    return datetime.fromisoformat(stamp.replace("Z", "+00:00"))


class ParityTests(unittest.TestCase):
    """The same cases the app's own test runs, so a notification says what the
    banner says."""

    def test_matches_the_shared_cases(self):
        for case in CASES:
            with self.subTest(case["name"]):
                got = [
                    {"hazard": w.hazard, "severity": w.severity, "date": w.date, "headline": w.headline}
                    for w in warnings_for(case["bundle"], "5.6,-0.19", "Accra", "Greater Accra", at(case["now"]))
                ]
                self.assertEqual(got, case["expected"])

    def test_rounds_halves_up_as_javascript_does(self):
        self.assertEqual(js_round(40.5), 41)
        self.assertEqual(js_round(60.5), 61)
        self.assertEqual(js_round(2.5), 3)


def warning(date: str, severity: str = "warning", onset: str | None = None, hazard: str = "extreme-heat") -> Warning:
    day = at(f"{date}T00:00:00Z")
    return Warning(
        id=f"weather:x:{hazard}:{date}",
        hazard=hazard,
        hazard_type="Extreme heat",
        severity=severity,
        headline="Extreme heat today, feels like 41°C",
        date=date,
        expires_at=day.replace(hour=23, minute=59, second=59),
        onset=at(onset) if onset else None,
        place_name="Atebubu",
        region="Bono East",
    )


class DueTests(unittest.TestCase):
    def test_tomorrows_warning_goes_out_from_six_the_evening_before(self):
        w = warning("2026-11-08")
        self.assertFalse(is_due(w, at("2026-11-07T17:59:00Z")))
        self.assertTrue(is_due(w, at("2026-11-07T18:00:00Z")))

    def test_todays_warning_goes_out_from_six_in_the_morning(self):
        w = warning("2026-11-07")
        self.assertFalse(is_due(w, at("2026-11-07T05:30:00Z")))
        self.assertTrue(is_due(w, at("2026-11-07T06:00:00Z")))
        self.assertTrue(is_due(w, at("2026-11-07T15:00:00Z")))

    def test_nothing_after_it_has_expired(self):
        self.assertFalse(is_due(warning("2026-11-06"), at("2026-11-07T08:00:00Z")))

    def test_quiet_at_night_except_for_emergencies(self):
        self.assertFalse(is_due(warning("2026-11-07"), at("2026-11-07T21:30:00Z")))
        self.assertTrue(is_due(warning("2026-11-07", "emergency"), at("2026-11-07T21:30:00Z")))
        self.assertTrue(is_due(warning("2026-11-07", "emergency"), at("2026-11-07T02:00:00Z")))

    def test_a_storm_goes_out_two_hours_before_it_starts(self):
        w = warning("2026-11-07", onset="2026-11-07T15:00:00Z", hazard="thunderstorm")
        self.assertFalse(is_due(w, at("2026-11-07T12:30:00Z")))
        self.assertTrue(is_due(w, at("2026-11-07T13:00:00Z")))

    def test_the_text_names_the_hazard_level_and_place(self):
        title, body = notification_text(warning("2026-11-07"))
        self.assertEqual(title, "Extreme heat warning")
        self.assertEqual(body, "Extreme heat today, feels like 41°C. Atebubu, Bono East")


if __name__ == "__main__":
    unittest.main()
