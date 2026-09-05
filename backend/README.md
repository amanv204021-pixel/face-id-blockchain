# Backend — FastAPI + OpenCV

Real computer vision + hashing + anchoring service.

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- `POST /api/pipeline/run` — full pipeline (no file → demo fixture)
- `POST /api/{detect-face,encode-face,reverse-search,analyze-match}`
- `POST /api/hash-record` · `POST /api/blockchain/anchor`
- `GET  /api/blockchain/verify/{tx}` · `POST /api/blockchain/records`
- `GET  /api/health` — modes + loaded models
- `POST /demo/{tamper,restore,reset-chain}` — tamper-evidence demos
- Swagger UI: `/docs`

Models in `models/` (OpenCV Zoo, Apache-2.0): YuNet detector + SFace encoder.
Runtime artifacts in `data/` (gitignored): temp uploads (auto-deleted),
`chain.json`, `records/<tx>.json`.
