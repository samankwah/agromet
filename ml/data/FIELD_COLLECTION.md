# Collecting the Ghanaian field test set

Start this first. It is the only part of the project that depends on other
people's time, travel and weather, so everything else can be rescheduled around
it and this cannot.

It is also the part that makes the work original. Anyone can download the Kaggle
cassava set. Nobody else has photographs from these farms, labelled by these
officers.

## What is needed

**150 to 250 photographs**, cassava, spread across the five classes. Perfect
balance is not achievable in a real field and should not be faked: record what
was found. If a class turns out to be absent locally, that is a finding to state,
not a gap to quietly fill from Kaggle.

**Taken on a mid-range Android phone**, the kind an AgroMet user actually owns.
Not a DSLR, not the newest iPhone. The test set has to look like the input.

**Deliberately imperfect.** Overcast and bright light, morning and midday,
several leaves in frame, some shots slightly blurred or at an awkward angle. A
test set of careful, well-framed photographs measures the wrong thing and will
overstate every accuracy figure in the report.

## Labelling

**With an extension officer present, at the plant.** Not from memory afterwards,
and not from the photographs later. A label attached to a photograph hours later
is a guess about a picture, not a diagnosis of a plant.

**Record disagreement rather than resolving it.** Where two officers read the
same plant differently, keep both rows. How often trained humans disagree is a
real measurement, it belongs in the report, and it sets a sensible ceiling on
what any model should be expected to achieve.

## Layout

```
ml/data/field/
  labels.csv
  IMG_0001.jpg
  IMG_0002.jpg
  ...
```

`labels.csv` columns:

| Column | Notes |
|---|---|
| `filename` | Must match the file on disk |
| `class_id` | One of `cbb`, `cbsd`, `cgm`, `cmd`, `healthy` |
| `labelled_by` | Officer identifier, so disagreement can be traced |
| `confidence` | The officer's own certainty: `sure`, `probable`, `unsure` |
| `date` | ISO 8601 |
| `location` | District, or GPS if available |
| `growth_stage` | Approximate weeks after planting |
| `phone_model` | So results can be read against the hardware |
| `notes` | Anything unusual about the plant or the shot |

A photograph carrying two officer rows appears twice, with the same `filename`.
`03_evaluate.ipynb` counts those and reports them.

## Consent and ethics

Get **written permission from the farm owner** before photographing, explain
what the photographs are for, and record that it was obtained. Photograph plants
and not people. The report needs an ethics paragraph, and it should describe
something that actually happened.

## Why this set is never trained on

It is the test set for all three systems: the field-trained model, the
lab-trained model, and the commercial API. Training on any part of it, even
once, destroys the only unbiased measurement in the project. Keep it separate
and keep it untouched.
