"""The Postgres schema split, checked without a Postgres server.

`test_database_dialects` proves parity against a real Postgres, so it skips
wherever `TEST_DATABASE_URL` is unset, which is everywhere this suite
normally runs. That left a gap SQLite cannot see: `executescript` on SQLite
parses comments properly, while `_split_statements` cuts the script at every
`;`, comments included. One semicolon in a schema comment sent half a
sentence to Postgres as a statement, and production failed to import the app
on every route while every test here stayed green.
"""

from __future__ import annotations

import unittest

from backend.app import database


class SchemaSplitTests(unittest.TestCase):
    def test_every_postgres_statement_is_ddl(self):
        for statement in database._split_statements(database._postgres_ddl(database._SCHEMA)):
            code = [line for line in statement.splitlines() if line.strip() and not line.strip().startswith("--")]
            self.assertTrue(code, f"a statement is only comments: {statement[:80]!r}")
            self.assertIn(
                code[0].split()[0].upper(),
                {"CREATE", "ALTER"},
                f"the split produced a non-DDL statement, likely a ';' in a comment: {code[0][:80]!r}",
            )

    def test_newer_tables_survive_the_split(self):
        # A ';' in a comment above a table cuts its CREATE off from the
        # comment and still parses, so check the late additions arrive whole.
        statements = database._split_statements(database._postgres_ddl(database._SCHEMA))
        for table in ("contact_messages", "ai_reports", "s2s_snapshots", "seasonal_snapshots"):
            with self.subTest(table):
                self.assertTrue(
                    any(f"CREATE TABLE IF NOT EXISTS {table} (" in statement for statement in statements),
                    f"no whole CREATE TABLE for {table}",
                )
        self.assertTrue(any("idx_ai_reports_unhandled" in statement for statement in statements))


if __name__ == "__main__":
    unittest.main()
