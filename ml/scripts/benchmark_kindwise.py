"""Score the commercial API over the same photographs the local model is tested on.

The report's central claim is a comparison, and a comparison is only worth
making if both systems saw exactly the same images. This sends the Ghanaian
field set through AgroMet's own `/api/crop-diagnosis` endpoint, which is the
path the app uses, so what gets measured is the diagnosis a farmer would
actually have received rather than a cleaner lab version of it.

    python ml/scripts/benchmark_kindwise.py --field-dir ml/data/field

Requires the backend running with KINDWISE_CROP_HEALTH_API_KEY set:

    backend/.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000

Every call costs money and quota. Results are written incrementally and
already-scored photographs are skipped on a re-run, so an interrupted pass
resumes instead of paying twice.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import sys
import time
from pathlib import Path

import httpx

DEFAULT_BACKEND = "http://localhost:8000"
#: Long enough for the provider's own round trip; the app allows 30s.
REQUEST_TIMEOUT = 60.0


def load_manifest(field_dir: Path) -> list[dict[str, str]]:
    """Read labels.csv: filename, class_id, and whatever else was recorded.

    Rows with no filename or no class_id are skipped loudly rather than
    silently, because a half-filled manifest quietly shrinks the test set and
    flatters every number computed from it.
    """
    manifest_path = field_dir / "labels.csv"
    if not manifest_path.exists():
        raise SystemExit(f"No manifest at {manifest_path}. See ml/README.md for the expected columns.")

    rows: list[dict[str, str]] = []
    with manifest_path.open(newline="", encoding="utf-8") as handle:
        for line_no, row in enumerate(csv.DictReader(handle), start=2):
            filename = (row.get("filename") or "").strip()
            class_id = (row.get("class_id") or "").strip()
            if not filename or not class_id:
                print(f"  skipping {manifest_path}:{line_no}, missing filename or class_id", file=sys.stderr)
                continue
            rows.append(row)
    return rows


def encode_image(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def diagnose(client: httpx.Client, backend: str, image_b64: str, crop: str, region: str) -> dict:
    response = client.post(
        f"{backend}/api/crop-diagnosis",
        json={"image": image_b64, "crop": crop, "region": region, "context": {}},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--field-dir", type=Path, default=Path("ml/data/field"))
    parser.add_argument("--out", type=Path, default=Path("ml/data/kindwise_results.json"))
    parser.add_argument("--backend", default=DEFAULT_BACKEND)
    parser.add_argument("--crop", default="cassava")
    parser.add_argument("--region", default="Ashanti")
    parser.add_argument("--limit", type=int, default=0, help="stop after N photographs (0 = all)")
    parser.add_argument("--delay", type=float, default=1.0, help="seconds between calls")
    args = parser.parse_args()

    rows = load_manifest(args.field_dir)
    if args.limit:
        rows = rows[: args.limit]

    args.out.parent.mkdir(parents=True, exist_ok=True)
    results: list[dict] = json.loads(args.out.read_text(encoding="utf-8")) if args.out.exists() else []
    already = {entry["filename"] for entry in results}

    todo = [row for row in rows if row["filename"] not in already]
    print(f"{len(rows)} photographs, {len(already)} already scored, {len(todo)} to go")

    with httpx.Client() as client:
        for index, row in enumerate(todo, start=1):
            path = args.field_dir / row["filename"]
            if not path.exists():
                print(f"  [{index}/{len(todo)}] missing file: {path}", file=sys.stderr)
                continue

            try:
                body = diagnose(client, args.backend, encode_image(path), args.crop, args.region)
            except Exception as error:  # noqa: BLE001 - the failure itself is a result
                # A refusal, a timeout, or a rate limit is part of what the
                # commercial API delivers in practice. Recording it keeps the
                # comparison honest: a system that answers 80% of the time is
                # not the same as one that always answers.
                print(f"  [{index}/{len(todo)}] {row['filename']}: {type(error).__name__}: {error}", file=sys.stderr)
                results.append({"filename": row["filename"], "truth": row["class_id"], "error": str(error)})
            else:
                results.append(
                    {
                        "filename": row["filename"],
                        "truth": row["class_id"],
                        "status": body.get("status"),
                        "plant": body.get("plant"),
                        "disease": body.get("disease"),
                        "confidence": body.get("confidence"),
                        "severity": body.get("severity"),
                        "source": body.get("source"),
                        "providerProduct": body.get("providerProduct"),
                    }
                )
                print(f"  [{index}/{len(todo)}] {row['filename']}: {body.get('disease')} ({body.get('confidence')})")

            # Written after every call, not at the end. The run costs quota and
            # can be interrupted; losing an hour of paid calls to a Ctrl+C is
            # avoidable.
            args.out.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
            time.sleep(args.delay)

    answered = sum(1 for entry in results if entry.get("status") == "ok")
    print(f"\n{len(results)} scored, {answered} answered, {len(results) - answered} declined or failed")
    print(f"wrote {args.out}")
    print("\nMap the distinct disease names to class ids in 03_evaluate.ipynb before scoring.")


if __name__ == "__main__":
    main()
