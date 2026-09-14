"""Generate the Kaggle notebooks from the cell sources kept below.

Notebooks are JSON, and JSON is a poor thing to edit or review a diff of. The
cells live here as ordinary Python strings, and this script assembles them, so
that changes to the training recipe show up in a readable diff instead of inside
one long escaped line.

    python ml/scripts/build_notebooks.py
"""

from __future__ import annotations

import json
from pathlib import Path

NOTEBOOK_DIR = Path(__file__).resolve().parents[1] / "notebooks"


def md(text: str) -> dict:
    return {"cell_type": "markdown", "metadata": {}, "source": text.strip().splitlines(keepends=True)}


def code(text: str) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": text.strip().splitlines(keepends=True),
    }


def notebook(cells: list[dict]) -> dict:
    return {
        "cells": cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.11"},
            "accelerator": "GPU",
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


# --------------------------------------------------------------------------
# 01 - train on the cassava field dataset
# --------------------------------------------------------------------------

CASSAVA_CELLS = [
    md(
        """
# Cassava disease classifier

Trains the model AgroMet ships on the phone. Run on Kaggle with the
**Cassava Leaf Disease Classification** dataset attached and a **T4 GPU**
accelerator selected.

Output: `cassava.keras`, which `ml/scripts/export_tflite.py` converts to the
`.tflite` asset the app bundles.

## Why this dataset

Roughly 21,000 photographs taken in the field on ordinary phones, in Uganda.
Cluttered backgrounds, uneven light, several leaves in frame, some shots
blurred. That is what an AgroMet user will actually submit.

The obvious alternative, PlantVillage, is 54,000 images of single detached
leaves on a uniform grey background under studio light. Models trained on it
report accuracies close to 99% and then fall over on real photographs.
Notebook `02_train_plantvillage.ipynb` trains that version deliberately so the
size of the gap can be measured rather than assumed.

## Why MobileNetV3-Small

The deployment constraint picks the architecture. Inference runs on a mid-range
Android phone, offline, so the model has to be small enough to bundle and fast
enough to feel instant. A larger backbone would score better and could not ship.
"""
    ),
    code(
        """
import json, os, pathlib, random
import numpy as np
import pandas as pd
import tensorflow as tf
import keras

SEED = 42
random.seed(SEED); np.random.seed(SEED); tf.random.set_seed(SEED)

IMAGE_SIZE = 224
BATCH_SIZE = 32
# Kaggle's own class order. This must match CLASS_IDS in ml/scripts/model_def.py:
# the index the model outputs only means a disease because both sides agree.
CLASS_IDS = ["cbb", "cbsd", "cgm", "cmd", "healthy"]

DATA_DIR = pathlib.Path("/kaggle/input/cassava-leaf-disease-classification")
OUT_DIR = pathlib.Path("/kaggle/working")

print("GPU:", tf.config.list_physical_devices("GPU"))
"""
    ),
    md(
        """
## Load the labels

`train.csv` maps each filename to a label index 0-4. The competition's
`label_num_to_disease_map.json` confirms the order.
"""
    ),
    code(
        """
labels = pd.read_csv(DATA_DIR / "train.csv")
with open(DATA_DIR / "label_num_to_disease_map.json") as handle:
    label_names = json.load(handle)

print(labels.shape)
print(label_names)

# Heavily imbalanced: CMD alone is over 60% of the set. Left alone the model
# learns to answer "CMD" and is right most of the time while being useless.
counts = labels["label"].value_counts().sort_index()
print(counts)
print((counts / counts.sum()).round(3))
"""
    ),
    md(
        """
## Split

Stratified, so every class keeps its proportion in both halves. A plain random
split can leave the rarest class (CBB, about 5%) with too few validation
examples for its recall to mean anything.
"""
    ),
    code(
        """
from sklearn.model_selection import train_test_split

train_df, val_df = train_test_split(
    labels, test_size=0.15, stratify=labels["label"], random_state=SEED
)
print(len(train_df), len(val_df))
"""
    ),
    md(
        """
## Input pipeline

Pixels stay at 0-255. MobileNetV3 in Keras carries its own rescaling layer, so
normalising here would halve the input range and cost accuracy silently. The
app's `preprocess.ts` leaves them at 0-255 for the same reason, and
`labels.json` records the contract next to the model.
"""
    ),
    code(
        """
IMAGE_DIR = DATA_DIR / "train_images"

def make_dataset(frame, *, training):
    paths = [str(IMAGE_DIR / name) for name in frame["image_id"]]
    ds = tf.data.Dataset.from_tensor_slices((paths, frame["label"].values))

    def load(path, label):
        image = tf.io.decode_jpeg(tf.io.read_file(path), channels=3)
        image = tf.image.resize(image, [IMAGE_SIZE, IMAGE_SIZE])
        return image, label  # float32 in 0-255, deliberately not rescaled

    ds = ds.map(load, num_parallel_calls=tf.data.AUTOTUNE)
    if training:
        ds = ds.shuffle(2048, seed=SEED)
    return ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

train_ds = make_dataset(train_df, training=True)
val_ds = make_dataset(val_df, training=False)
"""
    ),
    md(
        """
## Augmentation

Each transform stands for a real difference between a training photograph and
the one a farmer will take:

| Transform | The field condition it stands for |
|---|---|
| Horizontal and vertical flip | A leaf has no canonical orientation |
| Rotation (±20%) | The phone is held at whatever angle is convenient |
| Brightness and contrast | Overcast morning against midday sun |
| Random zoom | How close the farmer chose to stand |

Deliberately absent: hue and heavy saturation shifts. Colour *is* the symptom
for mosaic and vein chlorosis, so distorting it trains the model to ignore the
evidence it needs.
"""
    ),
    code(
        """
augment = keras.Sequential([
    keras.layers.RandomFlip("horizontal_and_vertical", seed=SEED),
    keras.layers.RandomRotation(0.2, seed=SEED),
    keras.layers.RandomZoom(0.2, seed=SEED),
    keras.layers.RandomBrightness(0.2, value_range=(0, 255), seed=SEED),
    keras.layers.RandomContrast(0.2, seed=SEED),
], name="augment")

# Applied in the input pipeline, NOT as a layer inside the model.
#
# Keras augmentation layers are inference-time no-ops, so putting them in the
# model looks harmless. They are still exported into the TFLite graph, and the
# shipped model then stops being the network model_def.py describes. Keeping
# them out here is what lets that file stay the single definition of what gets
# converted.
train_ds = train_ds.map(
    lambda images, labels: (augment(images, training=True), labels),
    num_parallel_calls=tf.data.AUTOTUNE,
)
"""
    ),
    code(
        """
def build_model(num_classes=len(CLASS_IDS), weights="imagenet"):
    \"\"\"Mirrors ml/scripts/model_def.py. Kept inline so the notebook runs on
    Kaggle, where this repository is not checked out.\"\"\"
    backbone = keras.applications.MobileNetV3Small(
        input_shape=(IMAGE_SIZE, IMAGE_SIZE, 3),
        include_top=False,
        weights=weights,
        include_preprocessing=True,
    )
    backbone.trainable = False

    inputs = keras.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3), dtype="float32", name="image")
    x = backbone(inputs, training=False)
    x = keras.layers.GlobalAveragePooling2D(name="pool")(x)
    x = keras.layers.Dropout(0.2, name="dropout")(x)
    outputs = keras.layers.Dense(num_classes, activation="softmax", name="probabilities")(x)
    return keras.Model(inputs, outputs, name="cassava_mobilenetv3s"), backbone

model, backbone = build_model()
model.summary()
"""
    ),
    md(
        """
## Class weights

CMD is over 60% of the data and CBB around 5%. Weighting the loss by inverse
frequency makes a missed CBB cost more than a missed CMD, which is also the
right trade in the field: the majority class is the one a farmer could most
easily guess without an app.
"""
    ),
    code(
        """
from sklearn.utils.class_weight import compute_class_weight

weights = compute_class_weight(
    "balanced", classes=np.arange(len(CLASS_IDS)), y=train_df["label"].values
)
class_weight = dict(enumerate(weights))
print({CLASS_IDS[i]: round(w, 3) for i, w in class_weight.items()})
"""
    ),
    md(
        """
## Stage 1: train the head

The backbone stays frozen. Its ImageNet features are already good at leaves and
edges, and letting a randomly initialised head send large gradients into them
would destroy that before it learns anything.
"""
    ),
    code(
        """
model.compile(
    optimizer=keras.optimizers.Adam(1e-3),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

callbacks = [
    keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True),
    keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2),
]

history_head = model.fit(
    train_ds, validation_data=val_ds, epochs=10,
    class_weight=class_weight, callbacks=callbacks,
)
"""
    ),
    md(
        """
## Stage 2: fine-tune the top of the backbone

Unfreeze the last blocks at a much lower learning rate. The early layers stay
frozen: generic edge and texture filters transfer fine and retraining them on
21,000 images mostly overfits.

1e-5 rather than 1e-3. At the higher rate fine-tuning wipes out the pretrained
features and validation accuracy drops below where stage 1 left it.
"""
    ),
    code(
        """
backbone.trainable = True
for layer in backbone.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=keras.optimizers.Adam(1e-5),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

history_ft = model.fit(
    train_ds, validation_data=val_ds, epochs=15,
    class_weight=class_weight, callbacks=callbacks,
)
"""
    ),
    md(
        """
## Per-class results

Overall accuracy is the wrong headline on an imbalanced set: answering "CMD"
every time scores over 60% while being worthless. Per-class recall is what says
whether the model can find the rare diseases, and the confusion matrix is what
the report needs.
"""
    ),
    code(
        """
from sklearn.metrics import classification_report, confusion_matrix

y_true = np.concatenate([y.numpy() for _, y in val_ds])
y_pred = model.predict(val_ds).argmax(axis=1)

print(classification_report(y_true, y_pred, target_names=CLASS_IDS, digits=3))
print(confusion_matrix(y_true, y_pred))
"""
    ),
    code(
        """
model.save(OUT_DIR / "cassava.keras")
print("saved", OUT_DIR / "cassava.keras")

# Download this, put it in ml/models/, then:
#   python ml/scripts/export_tflite.py --model ml/models/cassava.keras
"""
    ),
]


# --------------------------------------------------------------------------
# 02 - the laboratory-imagery contrast
# --------------------------------------------------------------------------

PLANTVILLAGE_CELLS = [
    md(
        """
# The PlantVillage contrast experiment

Trains the same architecture on laboratory imagery instead of field imagery, so
the difference can be measured rather than asserted.

This notebook is **not** producing a model to ship. It exists to answer one
question: how much of a published accuracy figure survives contact with a real
photograph?

## What to expect

PlantVillage images are single detached leaves, centred, on a uniform grey
background, under even studio light. A model trained here will report something
close to 99% on its own held-out split.

Evaluated on the field photographs collected in Ghana, the same model is
expected to fall a long way, because it has been rewarded for reading a
background that no longer exists rather than the lesion.

The number that goes in the report is the gap between those two figures.
"""
    ),
    code(
        """
# Same recipe as 01, pointed at a different dataset. Everything except the data
# is held constant on purpose: if the pipeline changed too, the gap could not be
# attributed to the imagery.
import pathlib
import numpy as np
import tensorflow as tf
import keras

SEED = 42
IMAGE_SIZE = 224
BATCH_SIZE = 32

# PlantVillage carries 38 classes across many crops. Restrict to the cassava
# ones so the comparison is like for like.
DATA_DIR = pathlib.Path("/kaggle/input/plantvillage-dataset/color")
OUT_DIR = pathlib.Path("/kaggle/working")

cassava_dirs = sorted(p for p in DATA_DIR.iterdir() if "cassava" in p.name.lower())
print([p.name for p in cassava_dirs])
"""
    ),
    code(
        """
train_ds = keras.utils.image_dataset_from_directory(
    DATA_DIR, labels="inferred", label_mode="int",
    class_names=[p.name for p in cassava_dirs],
    image_size=(IMAGE_SIZE, IMAGE_SIZE), batch_size=BATCH_SIZE,
    validation_split=0.15, subset="training", seed=SEED,
)
val_ds = keras.utils.image_dataset_from_directory(
    DATA_DIR, labels="inferred", label_mode="int",
    class_names=[p.name for p in cassava_dirs],
    image_size=(IMAGE_SIZE, IMAGE_SIZE), batch_size=BATCH_SIZE,
    validation_split=0.15, subset="validation", seed=SEED,
)
"""
    ),
    md(
        """
Train with the same two-stage schedule as notebook 01, then save as
`plantvillage.keras`. Notebook 03 evaluates both models against the same
Ghanaian field photographs and produces the comparison table.
"""
    ),
    code(
        """
# ... same build_model / two-stage fit as 01 ...
# model.save(OUT_DIR / "plantvillage.keras")
"""
    ),
]


# --------------------------------------------------------------------------
# 03 - evaluation and the comparison table
# --------------------------------------------------------------------------

EVALUATE_CELLS = [
    md(
        """
# Evaluation

Produces the report's headline table: three systems scored on the same
photographs.

| Column | What it is |
|---|---|
| Field-trained | The model AgroMet ships, trained on cassava field imagery |
| Lab-trained | The same architecture trained on PlantVillage |
| Kindwise | The commercial API the app calls when online |

The test set is the Ghanaian field photographs, labelled with an extension
officer present. None of the three has seen any of them.

Run `ml/scripts/benchmark_kindwise.py` first to produce the Kindwise column.
"""
    ),
    code(
        """
import json, pathlib
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

IMAGE_SIZE = 224
CLASS_IDS = ["cbb", "cbsd", "cgm", "cmd", "healthy"]

FIELD_DIR = pathlib.Path("ml/data/field")      # photographs, one folder per class
LABELS_CSV = FIELD_DIR / "labels.csv"          # filename, class_id, labelled_by, confidence
"""
    ),
    md(
        """
## Load the field set

`labels.csv` carries who labelled each photograph and how sure they were.
Disagreements are kept rather than resolved away: a photograph two officers read
differently is a real fact about how hard the task is, and dropping it flatters
every model in the table.
"""
    ),
    code(
        """
field = pd.read_csv(LABELS_CSV)
print(len(field), "photographs")
print(field["class_id"].value_counts())

if "labelled_by" in field:
    disputed = field[field.duplicated("filename", keep=False)]
    print(f"{disputed['filename'].nunique()} photographs with more than one label")
"""
    ),
    code(
        """
def load_image(path):
    image = tf.io.decode_jpeg(tf.io.read_file(str(path)), channels=3)
    image = tf.image.resize(image, [IMAGE_SIZE, IMAGE_SIZE])
    return tf.expand_dims(image, 0)  # 0-255, matching the app

def score(model_path, frame):
    model = tf.keras.models.load_model(model_path)
    preds = [model.predict(load_image(FIELD_DIR / row.filename), verbose=0).argmax() for row in frame.itertuples()]
    return np.array(preds)

y_true = field["class_id"].map(CLASS_IDS.index).values
"""
    ),
    code(
        """
for name, path in [("field-trained", "ml/models/cassava.keras"), ("lab-trained", "ml/models/plantvillage.keras")]:
    y_pred = score(path, field)
    print(f"\\n===== {name} =====")
    print(classification_report(y_true, y_pred, target_names=CLASS_IDS, digits=3))
    print(confusion_matrix(y_true, y_pred))
"""
    ),
    md(
        """
## Kindwise

Scored from the JSON that `benchmark_kindwise.py` wrote. Its labels are free
text disease names, not our five class ids, so the mapping is explicit and
recorded rather than fuzzy-matched: a comparison that quietly resolves ambiguous
names in the API's favour is not a comparison.
"""
    ),
    code(
        """
kindwise = json.loads(pathlib.Path("ml/data/kindwise_results.json").read_text())

# Filled in by hand after reading the distinct names the API actually returned.
KINDWISE_TO_CLASS = {
    # "Cassava mosaic virus": "cmd",
    # "Cassava brown streak virus": "cbsd",
    # "Cassava bacterial blight": "cbb",
}

names = sorted({entry["disease"] for entry in kindwise if entry.get("disease")})
print("Map these before scoring:")
for name in names:
    print(f"  {name!r}: {KINDWISE_TO_CLASS.get(name, '???')}")
"""
    ),
    md(
        """
## Also record, because they justify the architecture

- On-device inference latency on a real mid-range phone
- Bundled model size
- What fraction of photographs each system declined to answer at all

A model that answers 60% of the time at high precision may serve a farmer better
than one that always answers and is wrong a third of the time. The comparison
table should show both the accuracy and the coverage it was achieved at.
"""
    ),
]


def main() -> None:
    NOTEBOOK_DIR.mkdir(parents=True, exist_ok=True)
    for name, cells in [
        ("01_train_cassava.ipynb", CASSAVA_CELLS),
        ("02_train_plantvillage.ipynb", PLANTVILLAGE_CELLS),
        ("03_evaluate.ipynb", EVALUATE_CELLS),
    ]:
        path = NOTEBOOK_DIR / name
        path.write_text(json.dumps(notebook(cells), indent=1) + "\n", encoding="utf-8")
        print(f"wrote {path} ({len(cells)} cells)")


if __name__ == "__main__":
    main()
