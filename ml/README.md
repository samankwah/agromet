# ml/

Training and evaluation for the on-device cassava disease classifier.

Kept out of `backend/` on purpose. The backend deploys to Vercel Python
serverless functions with a 250 MB bundle cap and currently declares six
dependencies; TensorFlow is roughly 600 MB and would not fit even if it were
needed there. Inference runs on the phone, so nothing in this directory is ever
deployed. It produces one artefact: `mobile/assets/models/cassava.tflite`.

## Setup

```bash
python -m venv ml/.venv
./ml/.venv/Scripts/python.exe -m pip install -r ml/requirements.txt
```

## The input contract

`ml/scripts/model_def.py` is the single definition of the network and, more
importantly, of what the app must feed it:

| | |
|---|---|
| shape | `(1, 224, 224, 3)` |
| dtype | `float32` |
| range | **0-255**, not 0-1 |

MobileNetV3 in Keras rescales internally. Handing it 0-1 pixels halves the input
range and costs accuracy without raising an error anywhere, which is the kind of
bug that survives to submission. `mobile/.../localModel/preprocess.ts` leaves
pixels at 0-255 for this reason, and `labels.json` records the contract next to
the model so the two cannot drift apart unnoticed.

## Workflow

**1. Stub model, so app work is not blocked.**

```bash
./ml/.venv/Scripts/python.exe ml/scripts/make_stub_model.py
```

Correct shapes, correct class order, random weights. It predicts noise; it
exists so the whole on-device path can be built and tested before the real model
is trained, making that model a file swap rather than an integration.

**1b. Optional, only to train locally.** Running the notebook on Kaggle already
has the data attached, so most people skip this.

```bash
./ml/.venv/Scripts/python.exe -m pip install kaggle
./ml/.venv/Scripts/python.exe ml/scripts/download_dataset.py
```

About 6 GB, and it needs a Kaggle API token plus acceptance of the competition
rules. Training it on CPU is not realistic.

**1c. Or train locally with no credentials at all.**

```bash
./ml/.venv/Scripts/python.exe -m pip install tensorflow-datasets importlib_resources
./ml/.venv/Scripts/python.exe ml/scripts/train_local.py
```

Uses the TFDS `cassava` dataset (Mwebaze et al., Ugandan field photographs),
which downloads from a public URL and whose label order is already exactly
`CLASS_IDS`. The script asserts that rather than trusting it.

It runs on a CPU because the frozen backbone's features are computed once and
cached, so only the classification head trains. The cost of that shortcut is
that augmentation becomes impossible, since a cached feature vector cannot be
re-augmented. Expect it to score below the Kaggle notebook, which augments
properly and fine-tunes on a GPU. It writes `metrics.json` next to the model so
the difference is measured rather than guessed.

**2. Train on Kaggle.** Upload `notebooks/01_train_cassava.ipynb`, attach the
Cassava Leaf Disease Classification dataset, and run on a T4. Download
`cassava.keras` into `ml/models/`.

**3. Export.**

```bash
./ml/.venv/Scripts/python.exe ml/scripts/export_tflite.py --model ml/models/cassava.keras
cp ml/models/cassava.tflite ml/models/labels.json mobile/assets/models/
```

The export refuses to write a model whose predictions drifted from the Keras
original during conversion. A silently broken conversion is worse than a failed
one because it only shows up on a phone.

**4. Evaluate.** `notebooks/03_evaluate.ipynb` produces the per-class metrics and
confusion matrices, and `scripts/benchmark_kindwise.py` scores the commercial API
over the same photographs so the three systems can be compared on one table.

## Datasets

| Purpose | Dataset |
|---|---|
| Training | Cassava Leaf Disease Classification (Kaggle) - ~21k field photographs, 5 classes |
| Contrast | PlantVillage - laboratory imagery, uniform backgrounds |
| Test | Field photographs collected in Ghana, labelled with an extension officer |

The contrast experiment is not decoration. A model trained on PlantVillage scores
near-perfectly on PlantVillage's own split and much worse on real field
photographs, and measuring that gap on our own data is a finding the report needs.
