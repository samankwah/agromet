"""The published legal copy and the AI report write path.

The legal text is checked for claims, not wording: the stores reject an app
whose policy leaves out a service it sends data to, and the app is published
as independent, so the policy has to say it is not an official government app.
"""

from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.database import get_connection, row_to_dict
from backend.app.main import app
from backend.app.routers import content

REPORT = {"kind": "chat", "text": "Spray the maize at noon every day.", "reason": "wrong"}


def all_text(document: dict) -> list[str]:
    texts = [document["title"], document["summary"], document["updated"]]
    for section in document["sections"]:
        texts.extend([section["title"], section["body"], *(section.get("items") or [])])
    return texts


class LegalDocumentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def fetch(self, slug: str) -> dict:
        response = self.client.get(f"/api/legal/{slug}")
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_privacy_names_the_ai_services_and_says_it_is_not_official(self):
        text = " ".join(all_text(self.fetch("privacy")))

        self.assertIn("Kindwise", text)
        self.assertIn("OpenAI", text)
        self.assertIn("not an official government app", text)

    def test_no_dashes_in_any_text_field(self):
        for slug in ("privacy", "terms"):
            for text in all_text(self.fetch(slug)):
                self.assertNotIn("—", text, f"{slug}: {text[:60]!r}")
                self.assertNotIn("–", text, f"{slug}: {text[:60]!r}")

    def test_terms_do_not_mention_creating_an_account(self):
        text = " ".join(all_text(self.fetch("terms"))).lower()

        self.assertNotIn("create an account", text)
        self.assertNotIn("creating an account", text)
        self.assertNotIn("account credentials", text)
        self.assertIn("not an official government", text)

    def test_contact_line_uses_the_email_only_when_one_is_set(self):
        with patch("backend.app.config.CONTACT_EMAIL", ""):
            text = " ".join(all_text(self.fetch("privacy")))
        self.assertIn("use the Contact screen in the app", text)
        self.assertNotIn("email us at", text)

        with patch("backend.app.config.CONTACT_EMAIL", "help@example.com"):
            text = " ".join(all_text(self.fetch("privacy")))
        self.assertIn("email us at help@example.com", text)

    def test_unknown_slug_is_404(self):
        self.assertEqual(self.client.get("/api/legal/cookies").status_code, 404)


class AiReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Process-wide, like chat's, so one test's reports must not spend
        # another's quota.
        content.ai_report_limiter.reset()

    def stored(self, reference: int) -> dict:
        with get_connection() as connection:
            row = connection.execute("SELECT * FROM ai_reports WHERE id = ?", (reference,)).fetchone()
        return row_to_dict(row)

    def test_stores_the_report_and_returns_its_reference(self):
        response = self.client.post("/api/ai-reports", json={**REPORT, "note": "  Noon is too hot.  "})

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Thank you. We will look at this answer.")

        row = self.stored(body["reference"])
        self.assertEqual(row["kind"], "chat")
        self.assertEqual(row["reason"], "wrong")
        self.assertEqual(row["text"], REPORT["text"])
        self.assertEqual(row["note"], "Noon is too hot.")
        self.assertIsNone(row["device_id"])
        self.assertIsNone(row["handled_at"])
        self.assertTrue(row["created_at"])

    def test_stores_the_device_id_when_sent(self):
        response = self.client.post(
            "/api/ai-reports",
            json={**REPORT, "kind": "diagnosis", "reason": "harmful"},
            headers={"X-Device-Id": "guest-abc123"},
        )

        self.assertEqual(response.status_code, 201)
        row = self.stored(response.json()["reference"])
        self.assertEqual(row["device_id"], "guest-abc123")
        self.assertEqual(row["kind"], "diagnosis")

    def test_rejects_bad_input(self):
        cases = {
            "bad kind": {**REPORT, "kind": "weather"},
            "bad reason": {**REPORT, "reason": "boring"},
            "empty text": {**REPORT, "text": ""},
            "blank text": {**REPORT, "text": "   "},
            "text too long": {**REPORT, "text": "x" * 4001},
            "note too long": {**REPORT, "note": "x" * 501},
            "missing reason": {"kind": "chat", "text": "hello"},
        }
        for name, payload in cases.items():
            with self.subTest(name):
                self.assertEqual(self.client.post("/api/ai-reports", json=payload).status_code, 422)

    def test_accepts_text_at_the_limit(self):
        response = self.client.post("/api/ai-reports", json={**REPORT, "text": "x" * 4000})
        self.assertEqual(response.status_code, 201)

    def test_one_phone_cannot_flood_the_table(self):
        headers = {"X-Device-Id": "guest-flood"}
        for _ in range(content.ai_report_limiter.limit):
            self.assertEqual(self.client.post("/api/ai-reports", json=REPORT, headers=headers).status_code, 201)

        refused = self.client.post("/api/ai-reports", json=REPORT, headers=headers)
        self.assertEqual(refused.status_code, 429)
        self.assertIn("Retry-After", refused.headers)


if __name__ == "__main__":
    unittest.main()
