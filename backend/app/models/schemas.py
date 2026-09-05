"""Pydantic models for API requests/responses."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class FaceBox(BaseModel):
    x: int
    y: int
    w: int
    h: int
    score: float


class DetectionResult(BaseModel):
    status: str = Field(default="ok", description="ok | no_face | error")
    message: str = ""
    faces_found: int = 0
    confidence: Optional[float] = None
    bbox: Optional[FaceBox] = None
    landmarks: List[List[float]] = []
    detector: str = ""
    time_ms: int = 0


class EncodingResult(BaseModel):
    status: str = "ok"
    message: str = ""
    dims: int = 0
    model: str = ""
    fallback: bool = False
    encoding_hash: str = ""
    vector: List[float] = []
    time_ms: int = 0


class SearchCandidate(BaseModel):
    url: str
    domain: str
    title: str = ""
    similarity: float = 0.0
    thumbnail: Optional[str] = None  # base64 data URL (demo fixtures only)


class SearchResult(BaseModel):
    status: str = "ok"
    mode: str = Field(description="demo-fixtures | google_vision")
    provider: str = "local-demo-index"
    notice: str = ""
    candidates: List[SearchCandidate] = []
    best: Optional[SearchCandidate] = None
    time_ms: int = 0


class MatchResult(BaseModel):
    status: str = Field(default="NO_MATCH_FOUND", description="MATCH_FOUND | REVIEW_REQUIRED | NO_MATCH_FOUND")
    similarity: float = 0.0
    method: str = ""
    source: str = ""
    url: str = ""
    time_ms: int = 0


class AnchorResult(BaseModel):
    status: str = "ok"
    tx_hash: str = ""
    block_number: int = 0
    timestamp: str = ""
    network: str = ""
    simulated: bool = True
    explorer_note: str = ""


class VerificationResult(BaseModel):
    status: str = Field(default="NOT_FOUND", description="VERIFIED | HASH_MISMATCH | NOT_FOUND | SKIPPED")
    tx_hash: str = ""
    stored_record_hash: str = ""
    recomputed_record_hash: str = ""
    record: Dict[str, Any] = {}
    message: str = ""


class PipelineResult(BaseModel):
    mode: str
    pipeline_version: str
    image: Dict[str, Any]
    detection: DetectionResult
    encoding: EncodingResult
    search: SearchResult
    match: MatchResult
    record: Dict[str, Any]
    record_hash: str
    anchor: AnchorResult
    verification: VerificationResult
    total_time_ms: int
