"""Convert a trained Keras model to the .tflite asset the mobile app bundles.

Usage:
    python ml/scripts/export_tflite.py --model ml/models/cassava.keras
    python ml/scripts/export_tflite.py --model ml/models/cassava.keras --quantize dynamic

Writes cassava.tflite and labels.json side by side, then checks that the
converted model still agrees with the Keras one. A conversion that changes the
predictions is worse than no conversion, because it fails silently on device.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf

from model_def import CLASS_IDS, IMAGE_SIZE


def convert(model_path: Path, quantize: str) -> bytes:
    model = tf.keras.models.load_model(model_path)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)

    if quantize == "dynamic":
        # Weights to int8, activations stay float. Roughly a 4x size cut with
        # very little accuracy loss and no need for a representative dataset.
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
    elif quantize != "none":
        raise SystemExit(f"unknown --quantize value: {quantize}")

    return converter.convert()


def check_parity(model_path: Path, tflite_bytes: bytes, samples: int = 8) -> float:
    """Largest probability difference between Keras and TFLite on random input.

    Random input is enough to catch a broken conversion: if the graph is wrong
    the outputs diverge regardless of whether the pixels mean anything.

    It is NOT a measure of quantization damage. Uniform noise is far outside the
    distribution the model was trained on, so a quantized model can fail here
    while classifying real leaves identically. Use compare_tflite.py, which runs
    both models over the actual test split, before concluding a quantized export
    is unusable.
    """
    keras_model = tf.keras.models.load_model(model_path)
    rng = np.random.default_rng(0)
    batch = rng.uniform(0, 255, size=(samples, IMAGE_SIZE, IMAGE_SIZE, 3)).astype("float32")

    keras_out = keras_model.predict(batch, verbose=0)

    interpreter = tf.lite.Interpreter(model_content=tflite_bytes)
    interpreter.allocate_tensors()
    in_detail = interpreter.get_input_details()[0]
    out_detail = interpreter.get_output_details()[0]

    worst = 0.0
    for i in range(samples):
        interpreter.set_tensor(in_detail["index"], batch[i : i + 1])
        interpreter.invoke()
        lite_out = interpreter.get_tensor(out_detail["index"])
        worst = max(worst, float(np.max(np.abs(keras_out[i] - lite_out[0]))))
    return worst


def write_labels(out_dir: Path, quantize: str) -> None:
    """Sidecar the app reads so class order and preprocessing cannot drift."""
    payload = {
        "classIds": CLASS_IDS,
        "inputSize": IMAGE_SIZE,
        "inputRange": [0, 255],
        "quantization": quantize,
        "note": "Pixels are fed at 0-255; MobileNetV3 rescales internally.",
    }
    (out_dir / "labels.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True, help="path to a .keras model")
    parser.add_argument("--out", type=Path, default=None, help="output directory")
    # Default is "none", decided by measurement rather than habit. Dynamic-range
    # quantization takes the cassava model from 3.59 MB to 1.08 MB and keeps
    # overall accuracy (0.7500 vs 0.7475 on 400 test images), but it changes the
    # predicted label on roughly 10% of them, with probability gaps up to 0.36.
    # On a model that is only about 75% accurate to begin with, buying 2.5 MB
    # with that much churn on borderline cases is a poor trade, and 3.59 MB is
    # comfortably inside the under-10 MB budget the on-device design assumes.
    # Re-run ml/scripts/compare_tflite.py if the model changes.
    parser.add_argument("--quantize", default="none", choices=["dynamic", "none"])
    parser.add_argument("--skip-parity", action="store_true")
    args = parser.parse_args()

    out_dir = args.out or args.model.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    tflite_bytes = convert(args.model, args.quantize)
    tflite_path = out_dir / "cassava.tflite"
    tflite_path.write_bytes(tflite_bytes)
    write_labels(out_dir, args.quantize)

    size_mb = len(tflite_bytes) / (1024 * 1024)
    print(f"wrote {tflite_path} ({size_mb:.2f} MB)")

    if not args.skip_parity:
        drift = check_parity(args.model, tflite_bytes)
        print(f"max Keras/TFLite probability difference: {drift:.6f}")
        if drift > 0.05:
            raise SystemExit("conversion changed the predictions; do not ship this file")


if __name__ == "__main__":
    main()
