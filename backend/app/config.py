"""Central configuration — all secrets come from environment variables (see .env.example)."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # repo root (face-id-blockchain/)
BACKEND = Path(__file__).resolve().parents[1]       # backend/
APP_ROOT = Path(__file__).resolve().parents[1]      # backend/app
MODELS_DIR = BACKEND / "models"
DATA_DIR = BACKEND / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
RECORDS_DIR = DATA_DIR / "records"
CHAIN_FILE = DATA_DIR / "chain.json"
DEMO_DIR = Path(os.getenv("DEMO_DIR", str(ROOT / "demo-data")))

for d in (DATA_DIR, UPLOAD_DIR, RECORDS_DIR):
    d.mkdir(parents=True, exist_ok=True)

YUNET_PATH = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
SFACE_PATH = MODELS_DIR / "face_recognition_sface_2021dec.onnx"

PIPELINE_VERSION = "1.0.0"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp"}

# --- Reverse search -------------------------------------------------------
# "demo"  -> local fixture index (clearly labeled demo data)
# "google_vision" -> Google Cloud Vision WEB_DETECTION (needs API key)
REVERSE_SEARCH_PROVIDER = os.getenv("REVERSE_SEARCH_PROVIDER", "demo")
GOOGLE_VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY", "")

# --- Blockchain -----------------------------------------------------------
# If RPC URL + private key + contract address are set AND web3 is installed,
# anchors go to a real EVM chain (testnet!). Otherwise a clearly-labeled
# local simulated chain is used (demo default).
BLOCKCHAIN_RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "")
BLOCKCHAIN_PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY", "")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")


def blockchain_mode() -> str:
    if BLOCKCHAIN_RPC_URL and BLOCKCHAIN_PRIVATE_KEY and CONTRACT_ADDRESS:
        try:
            import web3  # noqa: F401
            return "evm-testnet"
        except ImportError:
            return "simulated (web3 not installed)"
    return "simulated-local"


def search_mode() -> str:
    if REVERSE_SEARCH_PROVIDER == "google_vision" and GOOGLE_VISION_API_KEY:
        return "google_vision"
    return "demo-fixtures"
