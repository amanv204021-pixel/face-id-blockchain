"""FACE ID + BLOCKCHAIN VERIFICATION — FastAPI backend entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.endpoints import router
from app.config import UPLOAD_DIR
from app.api.endpoints import health  # re-export for convenience

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Privacy: sweep stale temporary uploads on boot.
    import time
    now = time.time()
    for f in UPLOAD_DIR.glob("*"):
        try:
            if now - f.stat().st_mtime > 3600:
                f.unlink()
        except OSError:
            pass
    yield


app = FastAPI(
    title="FACE ID + BLOCKCHAIN VERIFICATION API",
    version="1.0.0",
    description=("Demo backend: face detection/encoding (OpenCV YuNet+SFace, Apache-2.0), "
                 "reverse-image search provider layer (demo fixtures | Google Vision), "
                 "SHA-256 record hashing and blockchain anchoring (simulated chain or EVM testnet). "
                 "Synthetic/authorized images only. Image similarity ≠ identity."),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=False,
    allow_methods=["*"], allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": f"Internal error: {exc.__class__.__name__}"})


app.include_router(router)


@app.get("/")
async def root():
    return {"service": "face-id-blockchain", "docs": "/docs", "health": "/api/health"}
