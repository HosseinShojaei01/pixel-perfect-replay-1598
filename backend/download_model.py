import hashlib
from pathlib import Path
import urllib.request

URL = "https://github.com/onnx/models/raw/refs/heads/main/validated/vision/classification/mobilenet/model/mobilenetv2-12.onnx"
SHA = "c0c3f76d93fa3fd6580652a45618618a220fced18babf65774ed169de0432ad5"
path = Path(__file__).parent / "models/mobilenetv2-12.onnx"
path.parent.mkdir(exist_ok=True)
data = urllib.request.urlopen(URL, timeout=120).read()
if hashlib.sha256(data).hexdigest() != SHA:
    raise RuntimeError("Model checksum mismatch")
path.write_bytes(data)
print("Verified pretrained MobileNetV2 model downloaded")