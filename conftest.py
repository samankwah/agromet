"""Make the documented test command work from anywhere.

Every test module imports `backend.app.…`, which only resolves when the repo
root is on `sys.path`. Until now that happened by accident: run pytest from the
repo root and the implicit `sys.path[0]` covered it, run it from `backend/` as
the README instructs and every module failed to import.

pytest imports the `conftest.py` nearest the rootdir before collecting, so a
file here fixes the path for both.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
