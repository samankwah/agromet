"""Seasonal advice: conditions, rule coverage, copy rules, published text, routes."""

from __future__ import annotations

import re
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app import config, database, seasonal_advice, seasonal_runtime
from backend.app.main import app
from backend.app.seasonal_advice import CONDITIONS, LABELS, RULES, _GENERAL, apply_published, classify, region_advice, rule_for


def reading(category: str | None = None, **extra) -> dict:
    block = {"available": True, "display": "x", "normalDisplay": "y"}
    if category:
        block.update({"category": category, "probabilities": {"below": 0.2, "normal": 0.3, "above": 0.5}, "confidence": "medium"})
    block.update(extra)
    return block


def outlook() -> dict:
    """Greater Accra: a late start and a long early dry spell, MAM drier than usual.
    Southern Minor Season beyond the model's reach."""
    accra_season = {
        "id": "Greater Accra", "region": "Greater Accra",
        "onset": reading("above"),
        "earlyDrySpell": reading("above"),
        "lateDrySpell": reading("normal"),
        "cessation": reading("normal"),
    }
    accra_window = {
        "id": "Greater Accra", "region": "Greater Accra",
        "rainfallTotal": reading("below"),
        "rainyDays": reading("below"),
        "temperature": reading("above"),
    }
    far = {"available": False, "availableFrom": "2027-05", "normal": 1, "normalDisplay": "Week 2 of September"}
    minor = {"id": "Greater Accra", "region": "Greater Accra", **{v: dict(far) for v in ("onset", "earlyDrySpell", "lateDrySpell", "cessation")}}
    son = {"id": "Greater Accra", "region": "Greater Accra", **{v: dict(far) for v in ("rainfallTotal", "rainyDays", "temperature")}}
    return {
        "source": "seas5",
        "issuedBy": None,
        "runDate": "2026-10-05",
        "seasons": {
            "southern-major": {"key": "southern-major", "label": "Southern Major Season", "year": 2027, "cells": [accra_season]},
            "southern-minor": {"key": "southern-minor", "label": "Southern Minor Season", "year": 2027, "cells": [minor]},
            "northern": {"key": "northern", "label": "Northern Single Season", "year": 2027, "cells": []},
        },
        "windows": {
            "MAM": {"key": "MAM", "label": "March to May", "year": 2027, "cells": [accra_window]},
            "SON": {"key": "SON", "label": "September to November", "year": 2026, "cells": [son]},
        },
    }


class ClassifyTests(unittest.TestCase):
    def test_terciles_read_in_each_variable_s_own_words(self):
        self.assertEqual(classify("onset", reading("below")), "early")
        self.assertEqual(classify("onset", reading("above")), "late")
        self.assertEqual(classify("cessation", reading("below")), "early")
        self.assertEqual(classify("earlyDrySpell", reading("above")), "long")
        self.assertEqual(classify("lateDrySpell", reading("below")), "short")
        self.assertEqual(classify("rainfallTotal", reading("below")), "less")
        self.assertEqual(classify("rainyDays", reading("below")), "fewer")
        self.assertEqual(classify("temperature", reading("above")), "warmer")
        self.assertEqual(classify("temperature", reading("normal")), "usual")

    def test_a_season_beyond_reach_is_normal_only(self):
        self.assertEqual(classify("onset", {"available": False}), "normal_only")
        self.assertEqual(classify("onset", None), "normal_only")

    def test_a_dry_window_and_a_flat_ensemble_are_their_own_conditions(self):
        self.assertEqual(classify("rainfallTotal", reading("below", dryWindow=True)), "dry_season")
        self.assertEqual(classify("onset", reading("above", noSignal=True)), "no_signal")
        self.assertEqual(classify("onset", reading()), "no_signal")

    def test_missing_category_falls_back_to_the_likeliest_tercile(self):
        block = reading(probabilities={"below": 0.6, "normal": 0.3, "above": 0.1})
        self.assertEqual(classify("rainfallTotal", block), "less")


class RuleCoverageTests(unittest.TestCase):
    def test_every_variable_and_condition_has_advice(self):
        for variable, conditions in CONDITIONS.items():
            for condition in conditions:
                rule = rule_for(variable, condition, {"availableFrom": "2027-05"})
                self.assertTrue(rule["title"], (variable, condition))
                self.assertTrue(rule["summary"], (variable, condition))
                self.assertGreaterEqual(len(rule["actions"]), 1, (variable, condition))
                self.assertLessEqual(len(rule["actions"]), 4, (variable, condition))

    def test_copy_has_no_dashes_and_ends_as_a_sentence(self):
        texts: list[str] = list(LABELS.values()) + [seasonal_advice.NOTE]
        for rule in list(RULES.values()) + list(_GENERAL.values()):
            texts += [rule["title"], rule["summary"], *rule["actions"]]
        for text in texts:
            self.assertNotRegex(text, r"[‒-―]| - ", text)
        for rule in list(RULES.values()) + list(_GENERAL.values()):
            for sentence in [rule["summary"], *rule["actions"]]:
                self.assertTrue(re.search(r"[.!?]$", sentence), sentence)

    def test_normal_only_says_when_the_forecast_comes(self):
        rule = rule_for("onset", "normal_only", {"availableFrom": "2027-05"})
        self.assertIn("May 2027", rule["summary"])
        self.assertIn("May 2027", rule["actions"][-1])


class RegionAdviceTests(unittest.TestCase):
    def test_the_main_season_and_its_heart_are_the_defaults(self):
        advice = region_advice(outlook(), "Greater Accra")
        self.assertEqual(advice["season"], {"key": "southern-major", "label": "Southern Major Season", "year": 2027})
        self.assertEqual(advice["window"]["key"], "MAM")
        self.assertEqual([item["variable"] for item in advice["conditions"]],
                         ["onset", "earlyDrySpell", "lateDrySpell", "cessation", "rainfallTotal", "rainyDays", "temperature"])

    def test_the_headline_is_the_condition_that_matters_most(self):
        advice = region_advice(outlook(), "Greater Accra")
        self.assertEqual(advice["headline"], "The rains may start later than usual.")
        onset = advice["conditions"][0]
        self.assertEqual((onset["condition"], onset["title"]), ("late", "Rains may start late"))
        self.assertEqual(onset["reading"]["category"], "above")

    def test_a_season_beyond_reach_gets_planning_advice(self):
        advice = region_advice(outlook(), "Greater Accra", "southern-minor")
        self.assertEqual(advice["window"]["key"], "SON")
        self.assertTrue(all(item["condition"] == "normal_only" for item in advice["conditions"]))
        self.assertIn("May 2027", advice["headline"])

    def test_a_season_the_region_does_not_have_is_refused(self):
        with self.assertRaises(KeyError):
            region_advice(outlook(), "Greater Accra", "northern")
        with self.assertRaises(KeyError):
            region_advice(outlook(), "Upper East", "southern-major")

    def test_published_text_replaces_only_what_it_sets(self):
        advice = region_advice(outlook(), "Greater Accra")
        rows = [
            {"variable": "onset", "title": None, "summary": "Plant after the second good rain.", "actions": ["Wait for two good rains."],
             "issued_by": "MoFA Accra", "created_at": "2026-10-05 10:00:00"},
            {"variable": None, "title": None, "summary": "Start late, plan for it.", "actions": [],
             "issued_by": "MoFA Accra", "created_at": "2026-10-05 11:00:00"},
        ]
        published = apply_published(advice, rows)
        self.assertEqual(published["source"], "published")
        self.assertEqual(published["issuedBy"], "MoFA Accra")
        self.assertEqual(published["headline"], "Start late, plan for it.")
        onset = published["conditions"][0]
        self.assertEqual(onset["title"], "Rains may start late")
        self.assertEqual(onset["summary"], "Plant after the second good rain.")
        self.assertEqual(onset["actions"], ["Wait for two good rains."])
        self.assertTrue(onset["published"])
        self.assertNotIn("published", published["conditions"][1])
        self.assertEqual(apply_published(advice, [])["source"], "rules")


class AdviceRouteTests(unittest.TestCase):
    def setUp(self):
        with database.get_connection() as connection:
            connection.execute("DELETE FROM seasonal_advisories")
        self.patches = [
            patch.object(seasonal_runtime, "current", outlook),
            patch.object(seasonal_runtime, "ensure_fresh", self._noop),
        ]
        for item in self.patches:
            item.start()

    def tearDown(self):
        for item in self.patches:
            item.stop()

    @staticmethod
    async def _noop():
        return None

    def test_rules_by_default_and_unknown_regions_are_404(self):
        with TestClient(app) as client:
            data = client.get("/api/outlook/seasonal/advice/greater accra").json()["data"]
            self.assertEqual(data["region"], "Greater Accra")
            self.assertEqual(data["source"], "rules")
            self.assertEqual(data["outlookSource"], "seas5")
            self.assertEqual(len(data["conditions"]), 7)
            self.assertIn("not an official advisory", data["note"])
            self.assertEqual(client.get("/api/outlook/seasonal/advice/Atlantis").status_code, 404)
            self.assertEqual(client.get("/api/outlook/seasonal/advice/Greater Accra?season=northern").status_code, 400)

    def test_only_administrators_publish_and_published_text_is_served(self):
        body = {"season": "southern-major", "variable": "onset", "summary": "Plant after the second good rain.",
                "actions": ["Wait for two good rains.", "  "], "issuedBy": "MoFA Accra"}
        with TestClient(app) as client:
            self.assertEqual(client.put("/api/outlook/seasonal/advice/Greater Accra", json=body).status_code, 401)
            token = register_and_login(client, "advice-admin@example.com")
            headers = {"Authorization": f"Bearer {token}"}
            with patch.object(config, "ADMIN_EMAILS", set()):
                self.assertEqual(client.put("/api/outlook/seasonal/advice/Greater Accra", json=body, headers=headers).status_code, 403)
            with patch.object(config, "ADMIN_EMAILS", {"advice-admin@example.com"}):
                first = client.put("/api/outlook/seasonal/advice/Greater Accra", json=body, headers=headers)
                self.assertEqual(first.status_code, 200, first.text)
                self.assertEqual(first.json()["data"]["year"], 2027)
                # Publishing again is an edit, not a second row.
                client.put("/api/outlook/seasonal/advice/Greater Accra", json={**body, "actions": ["Wait."]}, headers=headers)

                data = client.get("/api/outlook/seasonal/advice/Greater Accra").json()["data"]
                self.assertEqual(data["source"], "published")
                self.assertEqual(data["issuedBy"], "MoFA Accra")
                self.assertEqual(data["conditions"][0]["actions"], ["Wait."])

                gone = client.delete("/api/outlook/seasonal/advice/Greater Accra?season=southern-major", headers=headers)
                self.assertEqual(gone.status_code, 200)
                self.assertEqual(client.get("/api/outlook/seasonal/advice/Greater Accra").json()["data"]["source"], "rules")


def register_and_login(client: TestClient, email: str) -> str:
    client.post("/api/v1/auth/register", json={"email": email, "password": "secret123", "name": "Test"})
    response = client.post("/api/v1/auth/login", data={"username": email, "password": "secret123"})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


if __name__ == "__main__":
    unittest.main()
