https://faceid-blockchain.vercel.app/

# FACE ID + BLOCKCHAIN VERIFICATION

A futuristic **3D interactive pipeline** that demonstrates an end-to-end
face-verification + tamper-evident-anchoring flow:

```
UPLOAD → 3D FACE SCAN → ENCODING PARTICLES → DIGITAL GLOBE SEARCH
       → MATCH VISUALIZATION → SHA-256 HASH → 3D BLOCKCHAIN BLOCK
       → GREEN "VERIFIED" RESULT
```

Built as a **hackathon demo**: every stage of the pipeline is a real,
working service — the 3D interface is wired to a live FastAPI backend that
performs genuine face detection (OpenCV **YuNet**), genuine 128-d face
embeddings (OpenCV **SFace**), real perceptual-similarity matching
(DCT-pHash + HSV histograms), real SHA-256 canonical-JSON hashing, and real
blockchain anchoring (local simulated chain by default, any EVM testnet with
the included Solidity contract).

```
                       ┌──────────────────────────────────────────┐
                       │            FRONTEND (React/TS)           │
                       │  Three.js · R3F · Drei · Framer Motion   │
                       │   3D scenes ── persistent pipeline HUD   │
                       └───────────────┬──────────────────────────┘
                                       │  REST (vite proxy /api)
                       ┌───────────────▼──────────────────────────┐
                       │             BACKEND (FastAPI)            │
                       │ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │
   image bytes ───────▶│ │ VISION  │ │ SEARCH  │ │ MATCH ENGINE│  │
                       │ │YuNet +  │ │demo idx │ │pHash + HSV  │  │
                       │ │SFace    │ │| Google │ │             │  │
                       │ └────┬────┘ └────┬────┘ └──────┬──────┘  │
                       │      └─────┬─────┘             │         │
                       │      canonical JSON record       │         │
                       │      (hashes + metadata ONLY)    │         │
                       │            │                     │         │
                       │ ┌──────────▼──────────┐  ┌───────▼──────┐  │
                       │ │ HASH ENGINE SHA-256 │  │ (similarities│  │
                       │ └──────────┬──────────┘  │  stay here)  │  │
                       │            │             └──────────────┘  │
                       │ ┌──────────▼──────────────────────────┐    │
                       │ │ BLOCKCHAIN ANCHOR                   │    │
                       │ │ simulated chain │ EVM testnet contract│  │
                       │ └──────────┬──────────────────────────┘    │
                       └────────────┼──────────────────────────────┘
                                    │ recordHash (bytes32)
                       ┌────────────▼──────────────────────────────┐
                       │ FaceRecordAnchor.sol (testnet/local EVM)  │
                       │ RecordAnchored(recordHash, sourceHash, ts)│
                       └───────────────────────────────────────────┘
```

---

## ✨ What it does — stage by stage

| Stage | 3D scene | Real work behind it |
|---|---|---|
| 01 IMAGE | Holographic frame + drag & drop | MIME/size validation, SHA-256 of bytes, temp-file cleanup |
| 02 FACE DETECTION | Image in scanner, landmarks, % progress, laser sweep | YuNet CNN detector (face box, 5 landmarks, confidence) |
| 03 ENCODING | Particle galaxy + 128-node neural lattice | SFace ResNet-50 → normalized 128-d embedding (kept in RAM only) |
| 04 REVERSE SEARCH | Rotating globe, arcs, pulsing packets | Provider layer: **local demo fixture index** (default) or **Google Cloud Vision WEB_DETECTION** (live) |
| 05 MATCH | Split screens + beam + flowing data | DCT-pHash + HSV-histogram similarity, status classification |
| 06 HASH | Octahedron core + orbiting glyphs | Canonical JSON record → SHA-256 (`imageHash`, `matchSourceHash`, `sourceDomain`, `matchStatus`, `similarity`, `timestamp`, `pipelineVersion`) |
| 07 BLOCKCHAIN | Glass blocks chained by glowing links | `anchor(recordHash, sourceHash)` — simulated chain or `FaceRecordAnchor.storeRecord` on testnet |
| 08 VERIFY | Expanding green rings + check badge | Re-hash the stored record, compare with chain — **tamper-evident** (try the DEMO tamper button!) |

## 🔐 Privacy & ethics (please read)

- **Synthetic / authorized images only.** The demo fixture is an AI-generated
  image supplied by the project author. Do not point this at people without
  consent.
- **On-chain = hashes only.** No images, embeddings, names or personal data
  ever touch the chain — only SHA-256 digests + coarse metadata.
- **Embeddings are ephemeral.** The 128-d vector lives in memory for the
  duration of a request and is then discarded.
- **Image similarity ≠ identity.** The UI states this at the match stage.
  Detection/encoding does *not* tell you *who* someone is.
- **Demo data is labeled.** In demo mode every result says
  `DEMO MODE — local fixture index`. Nothing pretends to be a real web hit.
- **No scraping.** No social media scraping anywhere. The live provider is an
  official Google Cloud API (and it does not identify people either).

## 🧰 Technology stack

**Frontend** React 18 · TypeScript · Three.js 0.160 · React Three Fiber ·
Drei · @react-three/postprocessing (bloom / DoF / vignette) · Framer Motion ·
Tailwind CSS · Zustand · Vite

**Backend** Python 3.11+ · FastAPI · OpenCV (`opencv-python-headless`) ·
YuNet + SFace ONNX (Apache-2.0, OpenCV Zoo) · Pillow · httpx · Pydantic

**Blockchain** Solidity ^0.8.20 (`FaceRecordAnchor.sol`) · py-solc-x compile ·
ethers.js deploy/verify scripts · web3.py in-process test · simulated-chain
fallback · works with any EVM testnet (Anvil, Hardhat, Sepolia via RPC)

## 🚀 Quickstart (local, ~3 minutes)

### 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate     # optional
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
> Models are auto-downloaded? No — they're included under `backend/models/`
> (YuNet 230 KB + SFace 37 MB, Apache-2.0). If you cloned without them, grab:
> https://github.com/opencv/opencv_zoo/tree/main/models

### 2. Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173  (proxies /api → :8000)
```

### 3. Click START VERIFICATION → RUN FULL PIPELINE. Done.

### 4. Blockchain (optional — simulated chain needs nothing)
```bash
cd blockchain
pip install py-solc-x && python3 scripts/compile.py
pip install web3 eth-tester py-evm && python3 scripts/test_contract.py   # real EVM test, no node needed

# real testnet deployment:
npm install ethers
RPC_URL=<sepolia rpc> PRIVATE_KEY=<test wallet key> node scripts/deploy.js
# → put CONTRACT_ADDRESS + RPC_URL + PRIVATE_KEY in backend/.env
```

## ⚙️ Environment variables (`.env.example` at repo root)

```ini
REVERSE_SEARCH_PROVIDER=demo          # demo | google_vision
GOOGLE_VISION_API_KEY=                # required for google_vision
BLOCKCHAIN_RPC_URL=                   # optional EVM testnet RPC
BLOCKCHAIN_PRIVATE_KEY=               # test wallet key (NEVER a real one)
CONTRACT_ADDRESS=                     # deployed FaceRecordAnchor address
```

| Mode | Search | Chain |
|---|---|---|
| **DEMO (default)** | local fixture index, clearly labeled | local simulated chain, clearly labeled |
| **LIVE** | Google Vision WEB_DETECTION | EVM testnet contract |

Modes upgrade automatically when credentials are present — and degrade
gracefully (with a visible notice) when an API fails or a quota is hit.

## 📡 API

Interactive docs at **http://localhost:8000/docs**.

```
GET  /api/health                  POST /api/upload
POST /api/detect-face             POST /api/encode-face
POST /api/reverse-search          POST /api/analyze-match
POST /api/hash-record             POST /api/blockchain/anchor
GET  /api/blockchain/verify/{tx}  POST /api/blockchain/records
POST /api/pipeline/run            (no file → runs the demo fixture)
GET  /demo/image                  POST /demo/tamper  /demo/restore  /demo/reset-chain
```

## 🧪 Testing

```bash
# backend pipeline (real detection + encoding + anchoring)
cd backend && python3 -c "from fastapi.testclient import TestClient; from app.main import app;\
print(TestClient(app).post('/api/pipeline/run').json()['verification'])"

# smart contract (in-process EVM)
cd blockchain && python3 scripts/test_contract.py

# frontend types
cd frontend && npm run build
```

## 🎬 Demo script (60 seconds on stage)

1. `START VERIFICATION` → 3D lab fades in.
2. `RUN FULL PIPELINE` → watch the 8 stages light up: scanner sweep,
   embedding galaxy, globe search, match beam, hash core, new block glowing.
3. Green **VERIFICATION COMPLETE** box.
4. Judges' favorite: hit **simulate tampering** in the verify panel → the
   3D badge flips to red **HASH MISMATCH** — tamper-evidence, live. Restore →
   green again.
5. `SYSTEM ARCHITECTURE` button → exploded architecture for the Q&A.

## 🧱 Project structure

```
face-id-blockchain/
├── frontend/          # React + Three.js 3D experience
│   └── src/{components/{hud,panels},scenes,three,services,hooks}
├── backend/           # FastAPI + OpenCV YuNet/SFace + anchoring
│   ├── app/{api,services,models}
│   ├── models/        # ONNX weights (Apache-2.0)
│   └── data/          # runtime temp + chain + records (gitignored)
├── blockchain/        # Solidity contract + scripts + tests
│   ├── contracts/  scripts/  test/  artifacts/
├── demo-data/         # clearly-labeled synthetic fixtures (demo index)
├── docs/              # architecture · limitations · demo script
├── docker-compose.yml
├── .env.example
└── README.md
```

## ⚠️ Known limitations

- Demo search matches *image copies/similar images* in the local fixture
  index — it is not a web index.
- The default chain is a **simulation** for zero-setup demos; deploy the
  included contract for real anchoring (testnet only!).
- SFace is a 2019-2021-class encoder — great for a demo, not for production
  identity verification (which would need liveness detection, demographic
  evaluation, consent flows, DPIA, etc.).
- Similarity thresholds (80% match / 60% review) are heuristics, not ML
  calibration.

See `docs/limitations.md` for the full list.

## 📄 Licenses & attribution

- YuNet & SFace ONNX models — OpenCV Zoo, **Apache-2.0** (commercial-safe).
- This project code — MIT (do whatever, no warranty).
- Not affiliated with, endorsed by, or connected to any identity provider.

---

*Built for hackathon judging: the animation is the architecture — every
particle you see flying between scenes corresponds to a real HTTP call or a
real hash computation happening in the backend.*
<img width="1180" height="720" alt="image" src="https://github.com/user-attachments/assets/7443ff4a-0949-4047-8e64-8a90270975f1" />
<img width="1180" height="720" alt="image" src="https://github.com/user-attachments/assets/01b986cf-c51e-4079-94a7-7757414083c4" />
<img width="1180" height="720" alt="image" src="https://github.com/user-attachments/assets/85455c05-1a0e-41f0-8b88-b8c48eb24465" />
<img width="1180" height="720" alt="image" src="https://github.com/user-attachments/assets/65308536-77b5-4c93-8d19-c57ad15784ab" />
<img width="1180" height="720" alt="image" src="https://github.com/user-attachments/assets/19aff76c-45dc-4571-8fb8-90b684a23284" />
<img width="1180" height="720" alt="image" src="https://github.com/user-attachments/assets/874b8546-eb03-4513-af0f-05470a05166b" />
<img width="1180" height="720" alt="image" src="https://github.com/user-attachments/assets/e18e04c3-ad8b-4723-8a6c-8ee6ff29336e" />








