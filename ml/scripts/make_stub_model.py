"""Emit a random-weights model with the real shapes, so mobile work can start now.

The trained model takes days: the dataset has to be downloaded, the notebook has
to run, and the field photographs have to be collected and labelled. None of that
blocks the app. This script produces a .tflite with the correct input shape,
output shape and class order but meaningless weights, so the whole on-device
path can be built and tested end to end and the trained model is later a file
swap rather than an integration.

    python ml/scripts/make_stub_model.py

Predictions from this file are noise. It exists to prove the plumbing.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import tensorflow as tf

from export_tflite import check_parity, write_labels
from model_def import CLASS_IDS, build_model

DEFAULT_OUT = Path(__file__).resolve().parents[1] / "models"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    # weights=None keeps this offline and instant; the shapes are what matter.
    model = build_model(weights=None)
    keras_path = args.out / "cassava_stub.keras"
    model.save(keras_path)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_bytes = converter.convert()

    tflite_path = args.out / "cassava.tflite"
    tflite_path.write_bytes(tflite_bytes)
    write_labels(args.out, "dynamic")

    size_mb = len(tflite_bytes) / (1024 * 1024)
    drift = check_parity(keras_path, tflite_bytes, samples=4)

    print(f"stub model: {tflite_path} ({size_mb:.2f} MB)")
    print(f"classes:    {', '.join(CLASS_IDS)}")
    print(f"parity:     {drift:.6f}")
    print("\nThis model predicts noise. Replace it with the trained export before any demo.")


if __name__ == "__main__":
    main()
