"""Shared model definition.

Both the stub generator and the real training notebooks build the network here so
that the input contract can never drift between them. If this file changes, the
stub and the trained model change together.

Input contract (must match mobile/src/features/farm-tools/diagnose/localModel/preprocess.ts):
    shape       (1, 224, 224, 3)
    dtype       float32
    range       0-255, NOT 0-1

MobileNetV3 in Keras carries its own rescaling layer when include_preprocessing
is True, which is the default. Feeding it 0-1 values silently halves the input
range and costs accuracy without raising an error, so the mobile preprocessor
deliberately leaves pixels at 0-255 and this file is the reason why.
"""

from __future__ import annotations

import keras

IMAGE_SIZE = 224
CLASS_IDS = ["cbb", "cbsd", "cgm", "cmd", "healthy"]
NUM_CLASSES = len(CLASS_IDS)


def build_model(num_classes: int = NUM_CLASSES, *, weights: str | None = "imagenet") -> keras.Model:
    """MobileNetV3-Small with a fresh classification head.

    weights=None gives random initialisation, which is what the stub generator
    wants: same shapes, no 20 MB download.
    """
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

    return keras.Model(inputs, outputs, name="cassava_mobilenetv3s")
