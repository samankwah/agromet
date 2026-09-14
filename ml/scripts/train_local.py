"""Train the cassava classifier locally, on CPU, from the TFDS Cassava dataset.

The Kaggle notebook in ml/notebooks is still the better path: more data, a GPU,
and full fine-tuning. This exists so a real model can be produced without a
Kaggle account, a GPU, or an internet dataset that needs credentials.

    python ml/scripts/train_local.py

## Why it is fast enough to run on a CPU

The backbone stays frozen and its features are computed exactly once, cached in
memory, and reused for every epoch. Only the classification head trains, so
epochs after the first cost milliseconds instead of minutes.

The price is that augmentation is impossible: a cached feature vector cannot be
re-augmented, because the augmentation would have to happen before the backbone
that produced it. The Kaggle notebook augments properly. This trades that away
for being runnable at all on the machine at hand, and the evaluation below
reports what that actually costs rather than hiding it.

## The dataset

TFDS `cassava` is Mwebaze et al.'s Ugandan field photographs, and its label
order is `['cbb', 'cbsd', 'cgm', 'cmd', 'healthy']`, which is exactly CLASS_IDS
in model_def.py. That is checked at runtime rather than assumed, because a
silent mismatch would make every diagnosis confidently wrong.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
import tensorflow_datasets as tfds
import keras

from model_def import CLASS_IDS, IMAGE_SIZE, build_model

DEFAULT_OUT = Path(__file__).resolve().parents[1] / "models"


def prepare_split(split: str, batch_size: int, limit: int | None) -> tf.data.Dataset:
    ds = tfds.load("cassava", split=split, as_supervised=True, shuffle_files=False)
    if limit:
        ds = ds.take(limit)

    def resize(image, label):
        # 0-255 float32, deliberately not rescaled: MobileNetV3 carries its own
        # rescaling layer, and the app's preprocess.ts feeds it the same way.
        return tf.image.resize(tf.cast(image, tf.float32), [IMAGE_SIZE, IMAGE_SIZE]), label

    return ds.map(resize, num_parallel_calls=tf.data.AUTOTUNE).batch(batch_size).prefetch(tf.data.AUTOTUNE)


def extract_features(extractor: keras.Model, ds: tf.data.Dataset, name: str) -> tuple[np.ndarray, np.ndarray]:
    """One forward pass through the frozen backbone, kept for every epoch."""
    features, labels = [], []
    for step, (images, batch_labels) in enumerate(ds):
        features.append(extractor(images, training=False).numpy())
        labels.append(batch_labels.numpy())
        if step % 20 == 0:
            print(f"  {name}: batch {step}", flush=True)
    return np.concatenate(features), np.concatenate(labels)


def per_class_report(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Precision, recall and F1 per class, plus the confusion matrix.

    Overall accuracy is not enough on this dataset: CMD alone is most of it, so
    a model that always answers CMD scores well while being useless.
    """
    from sklearn.metrics import classification_report, confusion_matrix

    report = classification_report(
        y_true, y_pred, target_names=CLASS_IDS, digits=3, output_dict=True, zero_division=0
    )
    print(classification_report(y_true, y_pred, target_names=CLASS_IDS, digits=3, zero_division=0))
    matrix = confusion_matrix(y_true, y_pred, labels=range(len(CLASS_IDS)))
    print("confusion matrix (rows = truth, cols = predicted):")
    print(matrix)
    return {"report": report, "confusion_matrix": matrix.tolist()}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--limit", type=int, default=None, help="cap examples per split, for a smoke run")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    info = tfds.builder("cassava").info
    if list(info.features["label"].names) != CLASS_IDS:
        raise SystemExit(
            f"Label order mismatch.\n  TFDS:      {info.features['label'].names}\n  CLASS_IDS: {CLASS_IDS}\n"
            "The model's output index only means a disease because these agree."
        )
    print(f"classes verified: {CLASS_IDS}")
    print({k: v.num_examples for k, v in info.splits.items()})

    # The full model, so the exported graph is exactly what model_def describes.
    model = build_model(weights="imagenet")
    # Everything up to and including the pooling layer is the frozen part.
    extractor = keras.Model(model.inputs, model.get_layer("pool").output, name="extractor")

    print("\nextracting features (one pass, then cached)...")
    train_x, train_y = extract_features(extractor, prepare_split("train", args.batch_size, args.limit), "train")
    val_x, val_y = extract_features(extractor, prepare_split("validation", args.batch_size, args.limit), "val")
    test_x, test_y = extract_features(extractor, prepare_split("test", args.batch_size, args.limit), "test")
    print(f"train {train_x.shape} val {val_x.shape} test {test_x.shape}")

    # Inverse-frequency weighting. CMD dominates, and a missed CBB should cost
    # more than a missed CMD: the majority class is the one a farmer could most
    # easily guess without an app.
    counts = np.bincount(train_y, minlength=len(CLASS_IDS))
    weights = counts.sum() / (len(CLASS_IDS) * np.maximum(counts, 1))
    class_weight = {i: float(w) for i, w in enumerate(weights)}
    print("class counts:", dict(zip(CLASS_IDS, counts.tolist())))
    print("class weights:", {CLASS_IDS[i]: round(w, 3) for i, w in class_weight.items()})

    head = keras.Sequential(
        [
            keras.Input(shape=(train_x.shape[1],)),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(len(CLASS_IDS), activation="softmax", name="head_dense"),
        ],
        name="head",
    )
    head.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    head.fit(
        train_x,
        train_y,
        validation_data=(val_x, val_y),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weight,
        callbacks=[
            keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=6, restore_best_weights=True),
            keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3),
        ],
        verbose=2,
    )

    # Copy the trained weights into the real model, so what gets exported is the
    # network model_def.py defines rather than a separate head artefact.
    model.get_layer("probabilities").set_weights(head.get_layer("head_dense").get_weights())

    print("\n===== held-out test split =====")
    test_pred = head.predict(test_x, verbose=0).argmax(axis=1)
    metrics = per_class_report(test_y, test_pred)

    keras_path = args.out / "cassava.keras"
    model.save(keras_path)
    (args.out / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"\nsaved {keras_path}")
    print(f"saved {args.out / 'metrics.json'}")
    print("\nNext: python ml/scripts/export_tflite.py --model ml/models/cassava.keras")


if __name__ == "__main__":
    main()
