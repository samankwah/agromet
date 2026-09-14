"""Compare Keras and TFLite predictions on real images, not on noise.

`export_tflite.py`'s parity guard feeds the two models uniform random pixels.
That is a cheap smoke test for a structurally broken conversion, but it is a
poor measure of quantization damage: random noise is far outside the
distribution the model was trained on, so quantization error there says little
about behaviour on leaves.

What actually matters is whether the quantized model puts the same images in the
same classes. This runs both over the held-out test split and reports agreement
and accuracy side by side, so the decision to ship a quantized model is made on
evidence.

    python ml/scripts/compare_tflite.py --model ../models/cassava.keras --tflite ../models/cassava.tflite
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import tensorflow as tf
import tensorflow_datasets as tfds

from model_def import CLASS_IDS, IMAGE_SIZE


def load_test(limit: int | None, batch_size: int = 32) -> tf.data.Dataset:
    ds = tfds.load("cassava", split="test", as_supervised=True, shuffle_files=False)
    if limit:
        ds = ds.take(limit)

    def resize(image, label):
        return tf.image.resize(tf.cast(image, tf.float32), [IMAGE_SIZE, IMAGE_SIZE]), label

    return ds.map(resize, num_parallel_calls=tf.data.AUTOTUNE).batch(batch_size).prefetch(tf.data.AUTOTUNE)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--tflite", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=400, help="test images to compare")
    args = parser.parse_args()

    keras_model = tf.keras.models.load_model(args.model)
    interpreter = tf.lite.Interpreter(model_path=str(args.tflite))
    interpreter.allocate_tensors()
    in_detail = interpreter.get_input_details()[0]
    out_detail = interpreter.get_output_details()[0]

    truth, keras_pred, lite_pred, worst_gap, confidences = [], [], [], 0.0, []

    for images, labels in load_test(args.limit):
        keras_out = keras_model.predict(images, verbose=0)
        for i in range(images.shape[0]):
            interpreter.set_tensor(in_detail["index"], images[i : i + 1].numpy())
            interpreter.invoke()
            lite_out = interpreter.get_tensor(out_detail["index"])[0]

            truth.append(int(labels[i].numpy()))
            keras_pred.append(int(keras_out[i].argmax()))
            lite_pred.append(int(lite_out.argmax()))
            confidences.append(float(lite_out.max()))
            worst_gap = max(worst_gap, float(np.max(np.abs(keras_out[i] - lite_out))))

    truth = np.array(truth)
    keras_pred = np.array(keras_pred)
    lite_pred = np.array(lite_pred)

    print(f"images compared:        {len(truth)}")
    print(f"keras accuracy:         {(keras_pred == truth).mean():.4f}")
    print(f"tflite accuracy:        {(lite_pred == truth).mean():.4f}")
    print(f"label agreement:        {(keras_pred == lite_pred).mean():.4f}")
    print(f"worst probability gap:  {worst_gap:.4f}")

    # The confidence distribution is what sets the app's reporting floor, so it
    # is printed here rather than guessed at in the client.
    conf = np.array(confidences)
    correct = lite_pred == truth
    print("\nthreshold  coverage  precision-above")
    for t in (0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.70, 0.80):
        above = conf >= t
        coverage = above.mean()
        precision = correct[above].mean() if above.any() else float("nan")
        print(f"  {t:.2f}      {coverage:6.1%}    {precision:6.1%}")


if __name__ == "__main__":
    main()
