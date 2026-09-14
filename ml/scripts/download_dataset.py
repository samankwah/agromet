"""Fetch the Kaggle cassava dataset, for training locally instead of on Kaggle.

Only needed if you are not running the notebook on Kaggle itself, where the
dataset is already attached and this script is unnecessary.

    pip install kaggle
    # put your API token at ~/.kaggle/kaggle.json (Kaggle > Settings > Create New Token)
    python ml/scripts/download_dataset.py

About 6 GB. Training it on CPU is not realistic; use Kaggle's free T4, or a
machine with a GPU.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

COMPETITION = "cassava-leaf-disease-classification"
DEFAULT_DEST = Path("ml/data/cassava")


def check_credentials() -> None:
    """Fail early with the actual fix rather than a stack trace from the SDK."""
    token = Path.home() / ".kaggle" / "kaggle.json"
    if token.exists() or os.environ.get("KAGGLE_USERNAME"):
        return
    raise SystemExit(
        f"No Kaggle credentials found.\n"
        f"  1. Kaggle > Settings > API > Create New Token\n"
        f"  2. Save the downloaded kaggle.json to {token}\n"
        f"  3. Accept the competition rules at\n"
        f"     https://www.kaggle.com/competitions/{COMPETITION}/rules\n"
        f"     Downloads 403 until the rules are accepted, even with a valid token."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dest", type=Path, default=DEFAULT_DEST)
    args = parser.parse_args()

    check_credentials()

    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except ImportError:
        raise SystemExit("pip install kaggle") from None

    args.dest.mkdir(parents=True, exist_ok=True)

    api = KaggleApi()
    api.authenticate()
    print(f"Downloading {COMPETITION} to {args.dest} (about 6 GB)...")
    api.competition_download_files(COMPETITION, path=str(args.dest), quiet=False)

    archive = args.dest / f"{COMPETITION}.zip"
    if archive.exists():
        import zipfile

        print("Extracting...")
        with zipfile.ZipFile(archive) as zf:
            zf.extractall(args.dest)
        print(f"Extracted. Delete {archive} to reclaim the space.")

    expected = args.dest / "train.csv"
    if not expected.exists():
        print(f"Warning: {expected} not found; check the archive layout.", file=sys.stderr)
    else:
        print(f"Ready. Point DATA_DIR in the training notebook at {args.dest}")


if __name__ == "__main__":
    main()
