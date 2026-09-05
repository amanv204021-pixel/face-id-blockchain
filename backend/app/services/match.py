"""Match verification: compares the query image with the best search candidate.

IMPORTANT (mirrored in the UI): a high IMAGE similarity is NOT proof of a
person's identity. This module only measures how alike two pictures are.
"""
import time

from app.services.vision import decode_bgr, image_similarity


def classify(similarity: float) -> str:
    if similarity >= 80.0:
        return "MATCH_FOUND"
    if similarity >= 60.0:
        return "REVIEW_REQUIRED"
    return "NO_MATCH_FOUND"


def analyze_match(query_bytes: bytes, candidate_bytes: bytes | None,
                  candidate_meta: dict | None, live_similarity: float | None) -> dict:
    t0 = time.perf_counter()
    meta = candidate_meta or {}
    if candidate_bytes is not None:
        a, b = decode_bgr(query_bytes), decode_bgr(candidate_bytes)
        if a is None or b is None:
            sim, method = 0.0, "decode-failed"
        else:
            sim, method = image_similarity(a, b), "pHash(DCT)+HSV histogram"
    else:
        sim, method = float(live_similarity or 0.0), "provider-reported similarity"
    return {
        "status": classify(sim),
        "similarity": round(sim, 2),
        "method": method,
        "source": meta.get("domain", ""),
        "url": meta.get("url", ""),
        "time_ms": int((time.perf_counter() - t0) * 1000),
    }
