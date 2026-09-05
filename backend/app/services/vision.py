"""Computer-vision service: face detection (YuNet, Haar fallback) and
face embeddings (SFace 128-d, deterministic fallback encoder).

Models are Apache-2.0 licensed (OpenCV Zoo). If a model file is missing the
service degrades gracefully and flags the result as a fallback.
"""
import logging
import time
from typing import List, Optional, Tuple

import cv2
import numpy as np

from app.config import YUNET_PATH, SFACE_PATH

log = logging.getLogger("vision")

_yunet = None
_sface = None
FALLBACK_PROJ = np.random.default_rng(42).normal(size=(256, 128)).astype(np.float32)


def _get_yunet():
    global _yunet
    if _yunet is None and YUNET_PATH.exists():
        _yunet = cv2.FaceDetectorYN.create(str(YUNET_PATH), "", (320, 320), 0.6, 0.3, 5000)
    return _yunet


def _get_sface():
    global _sface
    if _sface is None and SFACE_PATH.exists():
        _sface = cv2.FaceRecognizerSF.create(str(SFACE_PATH), "")
    return _sface


def model_report() -> dict:
    return {
        "detector": "YuNet (OpenCV Zoo, Apache-2.0)" if YUNET_PATH.exists() else "Haar cascade fallback",
        "encoder": "SFace 128-d (OpenCV Zoo, Apache-2.0)" if SFACE_PATH.exists() else "Deterministic demo encoder (fallback)",
    }


def detect_faces(img_bgr: np.ndarray) -> Tuple[List[dict], str, int]:
    """Return (faces, detector_name, elapsed_ms). faces: bbox + landmarks + score."""
    t0 = time.perf_counter()
    h, w = img_bgr.shape[:2]
    det = _get_yunet()
    faces: List[dict] = []
    if det is not None:
        det.setInputSize((w, h))
        _, fm = det.detect(img_bgr)
        if fm is not None:
            for f in fm:
                x, y, fw, fh = [int(v) for v in f[:4]]
                faces.append({
                    "bbox": {"x": max(x, 0), "y": max(y, 0), "w": fw, "h": fh, "score": round(float(f[14]), 4)},
                    "landmarks": [[float(f[4 + 2 * i]), float(f[5 + 2 * i])] for i in range(5)],
                    "score": round(float(f[14]), 4),
                })
        name = "YuNet"
    else:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        rects = cas.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))
        for (x, y, fw, fh) in rects:
            faces.append({"bbox": {"x": int(x), "y": int(y), "w": int(fw), "h": int(fh), "score": 0.9},
                          "landmarks": [], "score": 0.9})
        name = "Haar cascade"
    ms = int((time.perf_counter() - t0) * 1000)
    faces.sort(key=lambda f: f["bbox"]["w"] * f["bbox"]["h"], reverse=True)
    return faces, name, ms


def extract_embedding(img_bgr: np.ndarray, face: dict) -> Tuple[np.ndarray, str, bool, int]:
    """Return (vector, model_name, is_fallback, elapsed_ms)."""
    t0 = time.perf_counter()
    rec = _get_sface()
    x, y, w, h = face["bbox"]["x"], face["bbox"]["y"], face["bbox"]["w"], face["bbox"]["h"]
    if rec is not None:
        row = np.array([[x, y, w, h] + [0.0] * 10 + [face.get("score", 0.9)]], dtype=np.float32)
        try:
            aligned = rec.alignCrop(img_bgr, row)
            feat = rec.feature(aligned).flatten().astype(np.float32)
            n = np.linalg.norm(feat)
            if n > 0:
                feat = feat / n
            return feat, "SFace ResNet50 (128-d)", False, int((time.perf_counter() - t0) * 1000)
        except cv2.error as e:  # pragma: no cover
            log.warning("SFace failed (%s); using fallback encoder", e)
    # Fallback: deterministic demo encoder from normalized aligned crop.
    pad = int(0.25 * w)
    crop = img_bgr[max(y - pad, 0):y + h + pad, max(x - pad, 0):x + w + pad]
    if crop.size == 0:
        crop = img_bgr
    small = cv2.resize(cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY), (16, 16)).astype(np.float32) / 255.0
    v = (small.flatten() @ FALLBACK_PROJ)
    v = np.tanh(v)
    n = np.linalg.norm(v)
    if n > 0:
        v = v / n
    return v, "Deterministic demo encoder (128-d, fallback)", True, int((time.perf_counter() - t0) * 1000)


def _dct_phash(img_bgr: np.ndarray) -> int:
    small = cv2.resize(img_bgr, (32, 32)).astype(np.float32)
    if small.ndim == 3:
        small = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    d = cv2.dct(small)
    low = d[:8, :8].flatten()[1:]
    med = np.median(low)
    bits = (low > med)
    v = 0
    for b in bits:
        v = (v << 1) | int(b)
    return v


def image_similarity(a_bgr: np.ndarray, b_bgr: np.ndarray) -> float:
    """Perceptual similarity 0-100: 70% DCT-pHash + 30% HSV histogram correlation."""
    ha, hb = _dct_phash(a_bgr), _dct_phash(b_bgr)
    ham = bin(ha ^ hb).count("1")
    phash_sim = (1.0 - ham / 64.0) * 100.0
    ha_h = cv2.calcHist([cv2.resize(a_bgr, (128, 128))], [0, 1, 2], None, [8, 8, 8], [0, 256] * 3)
    hb_h = cv2.calcHist([cv2.resize(b_bgr, (128, 128))], [0, 1, 2], None, [8, 8, 8], [0, 256] * 3)
    corr = cv2.compareHist(ha_h, hb_h, cv2.HISTCMP_CORREL)
    return round(0.7 * phash_sim + 0.3 * max(corr, 0.0) * 100.0, 2)


def decode_bgr(data: bytes) -> Optional[np.ndarray]:
    arr = np.frombuffer(data, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)
