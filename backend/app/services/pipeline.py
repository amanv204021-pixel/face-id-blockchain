"""End-to-end pipeline orchestrator: upload → detect → encode → search →
match → canonical record → SHA-256 → anchor → verify.

Privacy rules enforced here:
- only hashes + non-sensitive metadata enter the record (no images, no
  embeddings, no names) — see docs/architecture.md
- temporary uploads are deleted when the pipeline finishes
"""
import io
import logging
import time
from datetime import datetime, timezone

from PIL import Image

from app.config import PIPELINE_VERSION, search_mode
from app.services import chain, match as match_svc, search as search_svc, vision

log = logging.getLogger("pipeline")


def _utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def run_pipeline(image_bytes: bytes, filename: str = "upload.png") -> dict:
    t0 = time.perf_counter()
    result: dict = {}

    # ---- Stage 1: image intake + SHA-256 ---------------------------------
    import hashlib
    image_hash = hashlib.sha256(image_bytes).hexdigest()
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size
    result["image"] = {"name": filename, "width": w, "height": h,
                       "sha256": image_hash, "size_bytes": len(image_bytes)}

    # ---- Stage 2: face detection -----------------------------------------
    bgr = vision.decode_bgr(image_bytes)
    if bgr is None:
        result["detection"] = {"status": "error", "message": "Could not decode image."}
        result["encoding"] = {"status": "skipped"}
        result["search"] = {"status": "skipped"}
        result["match"] = {"status": "skipped"}
        result["record"], result["record_hash"] = {}, ""
        result["anchor"] = {"status": "skipped"}
        result["verification"] = {"status": "skipped"}
        result["total_time_ms"] = int((time.perf_counter() - t0) * 1000)
        return result

    faces, detector, d_ms = vision.detect_faces(bgr)
    if not faces:
        result["detection"] = {"status": "no_face",
                               "message": "No face detected. Please upload another authorized test image.",
                               "faces_found": 0, "detector": detector, "time_ms": d_ms}
        result["encoding"] = {"status": "skipped", "message": "Skipped — no face.", "dims": 0, "model": "",
                              "fallback": False, "encoding_hash": "", "vector": [], "time_ms": 0}
        result["search"] = {"status": "skipped", "mode": search_mode(), "provider": "n/a", "notice": "",
                            "candidates": [], "best": None, "time_ms": 0}
        result["match"] = {"status": "SKIPPED", "similarity": 0.0, "method": "", "source": "", "url": "", "time_ms": 0}
        result["record"], result["record_hash"] = {}, ""
        result["anchor"] = {"status": "skipped", "tx_hash": "", "block_number": 0, "timestamp": "",
                            "network": "", "simulated": True, "explorer_note": ""}
        result["verification"] = {"status": "SKIPPED", "tx_hash": "", "stored_record_hash": "",
                                  "recomputed_record_hash": "", "record": {}, "message": ""}
        result["mode"] = search_mode()
        result["pipeline_version"] = PIPELINE_VERSION
        result["total_time_ms"] = int((time.perf_counter() - t0) * 1000)
        return result

    primary = faces[0]
    result["detection"] = {
        "status": "ok", "message": "Face detected.",
        "faces_found": len(faces), "confidence": primary["score"],
        "bbox": primary["bbox"], "landmarks": primary["landmarks"],
        "detector": detector, "time_ms": d_ms,
        "note": ("Multiple faces detected — processing the most prominent one (demo behavior)."
                 if len(faces) > 1 else ""),
    }

    # ---- Stage 3: encoding ------------------------------------------------
    vec, enc_model, fallback, e_ms = vision.extract_embedding(bgr, primary)
    import hashlib as _hl
    enc_hash = _hl.sha256(vec.tobytes()).hexdigest()[:16]
    result["encoding"] = {"status": "ok",
                          "dims": int(vec.shape[0]), "model": enc_model, "fallback": fallback,
                          "encoding_hash": enc_hash,
                          "vector": [round(float(v), 3) for v in vec[:128]],
                          "time_ms": e_ms,
                          "privacy_note": "Embedding stays off-chain and in-memory only — never stored, never anchored."}

    # ---- Stage 4: reverse search ------------------------------------------
    sres = search_svc.reverse_search(image_bytes)
    result["search"] = sres

    # ---- Stage 5: match verification ---------------------------------------
    best = sres.get("best")
    if best is None:
        mres = {"status": "NO_MATCH_FOUND", "similarity": 0.0,
                "method": "no candidates returned", "source": "", "url": ""}
    else:
        cand_bytes = None
        if sres.get("mode") == "demo-fixtures":
            from app.config import DEMO_DIR
            fname = best["url"].rsplit("/", 1)[-1]
            p = DEMO_DIR / "index" / fname
            cand_bytes = p.read_bytes() if p.exists() else None
        mres = match_svc.analyze_match(image_bytes, cand_bytes, best,
                                       best.get("similarity"))
    result["match"] = mres

    # ---- Stage 6: canonical record (non-sensitive only!) -------------------
    record = {
        "recordType": "FaceVerificationDemo",
        "imageHash": image_hash,
        "matchSourceHash": _hl.sha256((best["url"] if best else "no-match").encode()).hexdigest(),
        "sourceDomain": (best or {}).get("domain", "none"),
        "matchStatus": mres["status"],
        "similarity": mres["similarity"],
        "timestamp": _utc(),
        "pipelineVersion": PIPELINE_VERSION,
    }
    record_hash = _hl.sha256(
        __import__("json").dumps(record, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    result["record"] = record
    result["record_hash"] = record_hash

    # ---- Stage 7: anchor on blockchain --------------------------------------
    source_hash = record["matchSourceHash"]
    anchor = chain.anchor_record(record_hash, source_hash, record)
    result["anchor"] = anchor

    # ---- Stage 8: verify read-back ------------------------------------------
    result["verification"] = chain.verify_tx(anchor["tx_hash"])

    result["mode"] = search_mode()
    result["pipeline_version"] = PIPELINE_VERSION
    result["total_time_ms"] = int((time.perf_counter() - t0) * 1000)
    return result
