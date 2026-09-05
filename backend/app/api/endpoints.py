"""REST API endpoints."""
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import (ALLOWED_MIME, MAX_UPLOAD_BYTES, PIPELINE_VERSION,
                        UPLOAD_DIR, blockchain_mode, search_mode)
from app.models.schemas import (AnchorResult, DetectionResult, EncodingResult,
                                MatchResult, PipelineResult, SearchResult,
                                VerificationResult)
from app.services import chain, pipeline as pipeline_svc, vision
from app.services.search import reverse_search as _reverse_search
from app.services.match import analyze_match as _analyze_match
from app.services.hashing import sha256_bytes

log = logging.getLogger("api")
router = APIRouter(prefix="/api")


def _validate_image(file: UploadFile, data: bytes) -> None:
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image too large (max 10 MB).")
    mime = file.content_type or ""
    if mime not in ALLOWED_MIME:
        raise HTTPException(415, f"Unsupported type '{mime}'. Use PNG / JPEG / WebP.")


@router.get("/health")
async def health():
    return {"status": "online", "pipeline_version": PIPELINE_VERSION,
            "search_mode": search_mode(), "blockchain_mode": blockchain_mode(),
            "models": vision.model_report()}


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    data = await file.read()
    _validate_image(file, data)
    tmp = UPLOAD_DIR / f"{uuid.uuid4().hex}_{file.filename}"
    tmp.write_bytes(data)
    img = vision.decode_bgr(data)
    if img is None:
        tmp.unlink(missing_ok=True)
        raise HTTPException(422, "Could not decode image.")
    from PIL import Image
    import io
    w, h = Image.open(io.BytesIO(data)).size
    return {"status": "ok", "temp_id": tmp.name, "file_name": file.filename,
            "size_bytes": len(data), "width": w, "height": h,
            "sha256": sha256_bytes(data),
            "note": "Temporary copy — deleted automatically after processing."}


@router.post("/detect-face", response_model=DetectionResult)
async def detect_face(file: UploadFile = File(...)):
    data = await file.read()
    _validate_image(file, data)
    bgr = vision.decode_bgr(data)
    if bgr is None:
        raise HTTPException(422, "Could not decode image.")
    faces, name, ms = vision.detect_faces(bgr)
    if not faces:
        return DetectionResult(status="no_face", message="No face detected. Please upload another authorized test image.",
                               faces_found=0, detector=name, time_ms=ms)
    p = faces[0]
    return DetectionResult(status="ok", message="Face detected.", faces_found=len(faces),
                           confidence=p["score"], bbox=p["bbox"], landmarks=p["landmarks"],
                           detector=name, time_ms=ms,
                           note="Detection locates a face — it does not identify any person.")


@router.post("/encode-face", response_model=EncodingResult)
async def encode_face(file: UploadFile = File(...)):
    import hashlib
    data = await file.read()
    _validate_image(file, data)
    bgr = vision.decode_bgr(data)
    if bgr is None:
        raise HTTPException(422, "Could not decode image.")
    faces, _, _ = vision.detect_faces(bgr)
    if not faces:
        raise HTTPException(422, "No face detected — cannot encode.")
    vec, model, fallback, ms = vision.extract_embedding(bgr, faces[0])
    return EncodingResult(status="ok", dims=int(vec.shape[0]), model=model, fallback=fallback,
                          encoding_hash=hashlib.sha256(vec.tobytes()).hexdigest()[:16],
                          vector=[round(float(v), 3) for v in vec[:128]], time_ms=ms)


@router.post("/reverse-search", response_model=SearchResult)
async def reverse_search(file: UploadFile = File(...)):
    data = await file.read()
    _validate_image(file, data)
    return SearchResult(**_reverse_search(data))


@router.post("/analyze-match", response_model=MatchResult)
async def analyze_match(query: UploadFile = File(...), candidate: UploadFile = File(...)):
    qd, cd = await query.read(), await candidate.read()
    _validate_image(query, qd)
    _validate_image(candidate, cd)
    return MatchResult(**_analyze_match(qd, cd, {}, None))


@router.post("/hash-record")
async def hash_record(record: dict):
    from app.services.hashing import hash_record
    return {"record": record, "record_hash": hash_record(record),
            "note": "SHA-256 over canonical (sorted-key, whitespace-free) JSON."}


@router.post("/blockchain/anchor", response_model=AnchorResult)
async def blockchain_anchor(record: dict):
    from app.services.hashing import hash_record
    rh = hash_record(record)
    sh = record.get("matchSourceHash", "")
    return AnchorResult(**chain.anchor_record(rh, sh, record))


@router.get("/blockchain/verify/{tx_hash}", response_model=VerificationResult)
async def blockchain_verify(tx_hash: str):
    return VerificationResult(**chain.verify_tx(tx_hash))


@router.post("/blockchain/records")
async def blockchain_records():
    """List anchored transactions (demo chain)."""
    from app.config import CHAIN_FILE
    import json
    if not CHAIN_FILE.exists():
        return {"blocks": []}
    return {"blocks": json.loads(CHAIN_FILE.read_text())}


@router.post("/pipeline/run", response_model=PipelineResult)
async def pipeline_run(file: Optional[UploadFile] = File(None)):
    """Run the complete pipeline. Without a file, uses the DEMO test image
    (clearly labeled in the response)."""
    if file is not None:
        data = await file.read()
        _validate_image(file, data)
        name = file.filename or "upload.png"
    else:
        from app.config import DEMO_DIR
        p = DEMO_DIR / "query" / "authorized_test_subject.png"
        data = p.read_bytes()
        name = "authorized_test_subject.png (demo fixture)"
    try:
        return PipelineResult(**pipeline_svc.run_pipeline(data, name))
    except HTTPException:
        raise
    except Exception as e:
        log.exception("pipeline failed")
        if "image" in str(e).lower() or "cannot identify" in str(e).lower():
            raise HTTPException(422, "Could not decode that image — it may be corrupted or an unsupported format. Please use a valid PNG/JPEG/WebP.")
        raise HTTPException(500, f"Pipeline failed: {e.__class__.__name__}: {e}")


# ---- Demo-mode helpers (clearly labeled) -----------------------------------

@router.post("/demo/reset-chain")
async def demo_reset_chain():
    """DEMO ONLY — clears the local simulated chain and stored records."""
    from app.config import CHAIN_FILE, RECORDS_DIR
    import json as _json
    n = 0
    if CHAIN_FILE.exists():
        n = len(_json.loads(CHAIN_FILE.read_text()))
    CHAIN_FILE.unlink(missing_ok=True)
    for f in RECORDS_DIR.glob("*.json"):
        f.unlink()
    return {"status": "reset", "blocks_removed": n}


@router.get("/demo/image")
async def demo_image():
    from app.config import DEMO_DIR
    from fastapi.responses import FileResponse
    return FileResponse(DEMO_DIR / "query" / "authorized_test_subject.png",
                        media_type="image/png",
                        headers={"X-Demo-Mode": "true"})


@router.post("/demo/tamper")
async def demo_tamper(tx_hash: str):
    """DEMO ONLY — mutates the stored off-chain record to demonstrate tamper-evidence."""
    return chain.tamper_record(tx_hash)


@router.post("/demo/restore")
async def demo_restore(tx_hash: str):
    return chain.restore_record(tx_hash)
