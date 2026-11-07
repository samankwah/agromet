"""One stored JSON document per live feed, shared by every instance.

``hazard_runtime``, ``precip_runtime`` and ``weather_runtime`` used to keep their
data only in a module-level dict. On Vercel every new instance starts with that
dict empty, so the first reader on each one waited on Open-Meteo (up to 30 s)
and spent the upstream quota again. ``s2s_runtime`` solved the same problem with
its own table. This module is that solution made generic: a feed writes its
latest payload under a ``kind`` key, and a cold instance reads it back in one
round trip instead of refetching it.

Only the newest row of each kind is kept. ``store`` deletes *older* rows of the
same kind, never "every row but mine", so two writers racing cannot leave the
kind empty.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from . import database


def _stamp_to_epoch(stamp: str) -> float:
    return datetime.strptime(stamp, database.TIMESTAMP_FORMAT).replace(tzinfo=timezone.utc).timestamp()


def store(kind: str, payload) -> float:
    """Write ``payload`` as the newest document for ``kind``. Returns its stamp as epoch."""
    stamp = database.utc_stamp()
    with database.get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO runtime_snapshots (kind, computed_at, payload) VALUES (?, ?, ?)",
            (kind, stamp, json.dumps(payload, separators=(",", ":"))),
        )
        connection.execute(
            "DELETE FROM runtime_snapshots WHERE kind = ? AND id < ?",
            (kind, cursor.lastrowid),
        )
    return _stamp_to_epoch(stamp)


def read_latest(kind: str):
    """The newest document for ``kind`` and its stamp as epoch, or None."""
    with database.get_connection() as connection:
        row = connection.execute(
            "SELECT computed_at, payload FROM runtime_snapshots WHERE kind = ? ORDER BY id DESC LIMIT 1",
            (kind,),
        ).fetchone()
    if row is None:
        return None
    row = dict(row)
    return json.loads(row["payload"]), _stamp_to_epoch(row["computed_at"])


def prune(prefix: str, older_than: timedelta) -> int:
    """Delete documents whose kind starts with ``prefix`` and that are older than ``older_than``.

    For per-location kinds (weather), whose count grows with every new place a
    farmer opens the app in. Returns how many rows were deleted.
    """
    cutoff = (datetime.now(timezone.utc) - older_than).strftime(database.TIMESTAMP_FORMAT)
    with database.get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM runtime_snapshots WHERE kind LIKE ? AND computed_at < ?",
            (f"{prefix}%", cutoff),
        )
        return cursor.rowcount or 0


def clear(prefix: str = "") -> None:
    """Delete every document whose kind starts with ``prefix``. For tests."""
    with database.get_connection() as connection:
        connection.execute("DELETE FROM runtime_snapshots WHERE kind LIKE ?", (f"{prefix}%",))
