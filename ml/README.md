# AgroMet Crop Disease Model

Trains the cassava disease model that runs inside the mobile app. Nothing here is
deployed; the output is one file, `cassava.tflite`, copied into
`mobile/assets/models/`.

## The model

- MobileNetV3-Small with a new classification head, 3.6 MB
- 5 classes: bacterial blight (`cbb`), brown streak (`cbsd`), green mottle
  (`cgm`), mosaic (`cmd`), healthy
- Input: a 224 x 224 colour photo, pixel values 0 to 255 (not 0 to 1)

Results on 1,885 test photos (`models/metrics.json`):

| Class | Precision | Recall | F1 |
|---|---|---|---|
| Bacterial blight | 0.37 | 0.48 | 0.42 |
| Brown streak | 0.74 | 0.63 | 0.68 |
| Green mottle | 0.57 | 0.60 | 0.59 |
| Mosaic | 0.87 | 0.81 | 0.84 |
| Healthy | 0.51 | 0.87 | 0.65 |

**Accuracy 71.5%.** Always guessing the most common class would score 47%.
Bacterial blight is the weakest class, so the app shows a disclaimer with every
result.

## Setup

```bash
python -m venv ml/.venv
ml\.venv\Scripts\activate
pip install -r ml/requirements.txt
```

## Steps

1. **Train.** Either way works:
   - On a laptop CPU: `python ml/scripts/train_local.py`. This uses the TFDS
     `cassava` dataset and needs no login. It first needs
     `pip install tensorflow-datasets importlib_resources`.
   - On a Kaggle GPU: run `notebooks/01_train_cassava.ipynb` with the Cassava
     Leaf Disease dataset, then save `cassava.keras` into `ml/models/`.
2. **Export.** This step stops if the exported model's answers differ from the
   original:
   ```bash
   python ml/scripts/export_tflite.py --model ml/models/cassava.keras
   cp ml/models/cassava.tflite ml/models/labels.json mobile/assets/models/
   ```
3. **Evaluate.** `notebooks/03_evaluate.ipynb` gives per-class scores and the
   confusion matrix. `scripts/benchmark_kindwise.py` scores the Kindwise API on
   the same photos for comparison.

`scripts/make_stub_model.py` makes a model with the right shape but random
weights, so app work can go on before training finishes.

## Files

```
scripts/model_def.py   Network definition and input format
scripts/               Training, export, evaluation and comparison scripts
notebooks/             Kaggle training (cassava, PlantVillage) and evaluation
models/                labels.json and metrics.json
data/                  Notes on collecting field photos in Ghana
```
