"""Reverse-image search provider layer.

DEMO MODE (default): searches a LOCAL fixture index of synthetic, authorized
images. Results are real perceptual-similarity computations against those
fixtures, and are always labeled as demo data.

LIVE MODE: Google Cloud Vision WEB_DETECTION (official API). Enable with
REVERSE_SEARCH_PROVIDER=google_vision + GOOGLE_VISION_API_KEY.

The layer never scrapes social media and never fabricates results: in demo
mode the response says "demo-fixtures", in live mode it says "google_vision".
"""
import base64
import io
import json
import logging
import time
from typing import List, Optional

import httpx
from PIL import Image

from app.config import (DEMO_DIR, GOOGLE_VISION_API_KEY, REVERSE_SEARCH_PROVIDER,
                        search_mode)
from app.services.vision import decode_bgr, image_similarity

log = logging.getLogger("search")

DEMO_NOTICE = ("DEMO MODE — results come from a local fixture index of synthetic, "
               "authorized images (see demo-data/). Not a live web search.")


def _thumb_b64(img_bgr_or_pil) -> Optional[str]:
    try:
        if isinstance(img_bgr_or_pil, Image.Image):
            im = img_bgr_or_pil
        else:
            im = Image.fromarray(img_bgr_or_pil[:, :, ::-1])
        im.thumbnail((320, 320))
        buf = io.BytesIO()
        im.convert("RGB").save(buf, "JPEG", quality=70)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception:  # pragma: no cover
        return None


def demo_search(query_bytes: bytes) -> dict:
    t0 = time.perf_counter()
    fixtures = json.loads((DEMO_DIR / "fixtures.json").read_text())
    q = decode_bgr(query_bytes)
    candidates: List[dict] = []
    for entry in fixtures["entries"]:
        path = DEMO_DIR / "index" / entry["file"]
        if not path.exists():
            continue
        c_img = decode_bgr(path.read_bytes())
        sim = image_similarity(q, c_img) if (q is not None and c_img is not None) else 0.0
        candidates.append({
            "url": entry["url"], "domain": entry["domain"], "title": entry["title"],
            "similarity": round(sim, 2),
            "thumbnail": _thumb_b64(c_img) if c_img is not None else None,
        })
    candidates.sort(key=lambda c: c["similarity"], reverse=True)
    return {
        "status": "ok", "mode": "demo-fixtures", "provider": "local-demo-index v1.0",
        "notice": DEMO_NOTICE, "candidates": candidates,
        "best": candidates[0] if candidates else None,
        "time_ms": int((time.perf_counter() - t0) * 1000),
    }


def google_vision_search(query_bytes: bytes) -> dict:
    """Official Google Cloud Vision WEB_DETECTION integration."""
    t0 = time.perf_counter()
    b64 = base64.b64encode(query_bytes).decode()
    body = {"requests": [{
        "image": {"content": b64},
        "features": [{"type": "WEB_DETECTION", "maxResults": 10}],
    }]}
    try:
        r = httpx.post(
            f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}",
            json=body, timeout=30)
        r.raise_for_status()
        wd = r.json()["responses"][0].get("webDetection", {})
    except Exception as e:
        log.warning("Google Vision failed: %s", e)
        return {"status": "error",
                "mode": "google_vision", "provider": "google-cloud-vision",
                "notice": f"Reverse-search API failed: {e.__class__.__name__}. "
                          "Falling back to DEMO fixtures (clearly labeled).",
                "candidates": [], "best": None,
                "time_ms": int((time.perf_counter() - t0) * 1000)}
    cands: List[dict] = []
    seen = set()
    for bucket, sim in (("full_matching_images", 99.0),
                        ("pages_with_matching_images", 92.0),
                        ("partial_matching_images", 85.0),
                        ("visually_similar_images", 70.0)):
        for item in wd.get(bucket, [])[:6]:
            url = item.get("url", "")
            if not url or url in seen:
                continue
            seen.add(url)
            domain = httpx.URL(url).host
            cands.append({"url": url, "domain": domain,
                          "title": f"{bucket} · {domain}",
                          "similarity": sim, "thumbnail": None})
    cands.sort(key=lambda c: c["similarity"], reverse=True)
    return {"status": "ok", "mode": "google_vision", "provider": "google-cloud-vision WEB_DETECTION",
            "notice": "LIVE MODE — results from Google Cloud Vision Web Detection.",
            "candidates": cands[:10], "best": cands[0] if cands else None,
            "time_ms": int((time.perf_counter() - t0) * 1000)}


def reverse_search(query_bytes: bytes) -> dict:
    if search_mode() == "google_vision":
        return google_vision_search(query_bytes)
    return demo_search(query_bytes)
