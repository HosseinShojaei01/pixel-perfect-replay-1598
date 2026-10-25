"""Pretrained MobileNetV2 features + photographic color/layout features. No face classifier."""
import hashlib
import io
import os
from pathlib import Path
import threading
import warnings

import cv2
import numpy as np
import onnx
import onnxruntime as ort
from PIL import Image, ImageOps, UnidentifiedImageError
from sklearn.metrics.pairwise import cosine_similarity

MODEL_ID = "mobilenetv2-imagenet-photo-v1"
MODEL_SHA = "c0c3f76d93fa3fd6580652a45618618a220fced18babf65774ed169de0432ad5"
MAX_BYTES = 10 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 20_000_000
_session = None
_lock = threading.Lock()

def session():
    global _session
    with _lock:
        if _session is None:
            path = Path(os.environ.get("MODEL_PATH", str(Path(__file__).parent / "models/mobilenetv2-12.onnx")))
            raw = path.read_bytes()
            if hashlib.sha256(raw).hexdigest() != MODEL_SHA:
                raise RuntimeError("Model checksum mismatch")
            model = onnx.load_from_string(raw)
            # Use the 1280-dimensional pooled features BEFORE the ImageNet classifier.
            feature = model.graph.node[-1].input[0]
            del model.graph.output[:]
            model.graph.output.append(onnx.helper.make_tensor_value_info(feature, onnx.TensorProto.FLOAT, [1, 1280]))
            options = ort.SessionOptions()
            options.intra_op_num_threads = 2
            options.inter_op_num_threads = 1
            _session = ort.InferenceSession(model.SerializeToString(), sess_options=options, providers=["CPUExecutionProvider"])
    return _session

def decode(raw: bytes) -> Image.Image:
    if not raw or len(raw) > MAX_BYTES:
        raise ValueError("Image must be between 1 byte and 10 MB")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            image = Image.open(io.BytesIO(raw))
            if image.format not in {"JPEG", "PNG", "WEBP"}:
                raise ValueError("Use JPG, PNG or WEBP")
            if image.width < 32 or image.height < 32:
                raise ValueError("Image must be at least 32 × 32 pixels")
            image.load()
            return ImageOps.exif_transpose(image).convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ValueError("Not a usable image (invalid or too many pixels)") from exc

def embedding(image: Image.Image) -> np.ndarray:
    resized = image.resize((224, 224), Image.Resampling.BILINEAR)
    rgb = np.asarray(resized, dtype=np.float32) / 255.0
    tensor = ((rgb - np.array([.485, .456, .406], dtype=np.float32)) / np.array([.229, .224, .225], dtype=np.float32)).transpose(2, 0, 1)[None]
    model = session()
    deep = model.run(None, {model.get_inputs()[0].name: tensor})[0].reshape(-1)
    deep /= max(float(np.linalg.norm(deep)), 1e-12)
    # Actual color/layout measurements supplement pretrained semantic features.
    layout = cv2.resize(rgb, (8, 8), interpolation=cv2.INTER_AREA).flatten()
    layout /= max(float(np.linalg.norm(layout)), 1e-12)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    edges = cv2.resize(np.abs(cv2.Sobel(gray, cv2.CV_32F, 1, 0)) + np.abs(cv2.Sobel(gray, cv2.CV_32F, 0, 1)), (8, 8)).flatten()
    edges /= max(float(np.linalg.norm(edges)), 1e-12)
    vector = np.concatenate([deep * .8, layout * .5, edges * .3]).astype(np.float32)
    return vector / max(float(np.linalg.norm(vector)), 1e-12)

def scores(query, references):
    return np.clip(cosine_similarity(query.reshape(1, -1), np.stack(references))[0], -1, 1)

def thumbnail(image):
    image = image.copy()
    image.thumbnail((512, 512))
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=85)
    return output.getvalue()