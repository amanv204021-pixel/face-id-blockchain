# Deploying FACE ID + BLOCKCHAIN VERIFICATION

Recommended split (works with zero code changes):

```
┌────────────────────┐         ┌─────────────────────────────┐
│ FRONTEND → Vercel  │  /api/* │ BACKEND → Railway / Render  │
│ static Vite build  │ ──────▶ │ FastAPI (always-on service) │
│ vercel.json rewrite│  proxy  │ Dockerfile included         │
└────────────────────┘         └─────────────────────────────┘
```

## 1. Backend — Railway (or Render/Fly — anything that runs Python 24/7)

> Why not Vercel for the backend? Two hard constraints: (a) serverless
> functions have an **ephemeral filesystem**, so the simulated chain
> (`data/chain.json`, `records/*.json`) would forget every anchor between
> requests; (b) the 37 MB SFace model makes cold starts painful. An
> always-on container avoids both. (All-Vercel is possible with an external
> store like Vercel KV — ask if you want that variant.)

**Railway steps**
1. Push this repo to GitHub.
2. railway.app → New Project → Deploy from GitHub repo.
3. Settings → Root Directory = `/` (repo root — the app needs `demo-data/`).
   - Build command: `pip install -r backend/requirements.txt`
   - Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Variables → add (from your dashboard screenshot):
   ```
   REVERSE_SEARCH_PROVIDER=demo          # or google_vision
   GOOGLE_VISION_API_KEY=                # only if google_vision
   BLOCKCHAIN_RPC_URL=                   # optional (all 3 for live chain)
   BLOCKCHAIN_PRIVATE_KEY=               # TESTNET wallet only
   CONTRACT_ADDRESS=                     # from scripts/deploy.js
   ```
5. Deploy → Settings → Networking → Generate Domain → copy `https://…up.railway.app`
6. Sanity check: open `https://…/api/health` → expect
   `{"status":"online","search_mode":"…","blockchain_mode":"…","models":{…}}`

**Render steps** (equivalent): New Web Service → repo → Root Directory `backend`
(then add a `demo-data` copy inside backend/ or use repo-root like Railway) →
Build `pip install -r backend/requirements.txt` → Start
`cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` → add env vars
→ optionally mount a disk at `/app/data` for chain persistence.

## 2. Frontend — Vercel

1. vercel.com → Add New Project → import the repo.
2. Project settings: **Root Directory = `frontend`** (Vite preset auto-detected).
   Build `npm run build`, Output `dist`.
3. Edit `frontend/vercel.json` → replace
   `https://REPLACE-WITH-YOUR-BACKEND.up.railway.app` with your backend URL (step 1.5).
4. Deploy.
5. Frontend needs **no environment variables** — it calls `/api/*` relatively,
   and vercel.json rewrites those to the backend (keeps code unchanged and
   avoids CORS entirely).

## 3. Verify the full stack

```
https://<frontend>.vercel.app          → 3D intro renders
                …/api/health (via site)→ backend modes report
RUN FULL PIPELINE                      → all 8 stages, VERIFIED badge
simulate tampering                     → red HASH MISMATCH (live demo!)
```

## 4. Live-mode activation checklist

| Want | Do |
|---|---|
| Google Vision live search | backend vars: `REVERSE_SEARCH_PROVIDER=google_vision` + `GOOGLE_VISION_API_KEY` (key needs a billing-enabled GCP project) |
| Live testnet anchoring | backend vars: all three `BLOCKCHAIN_*` + deploy contract (`blockchain/scripts/compile.py` then `deploy.js`) + `pip install web3` |
| Fresh demo chain | `POST /api/demo/reset-chain` |

## Production notes

- Set `allow_origins` in `backend/app/main.py` to your Vercel domain if you
  expose the backend directly (the rewrite path doesn't need it).
- Add Vercel Auth / rate limiting in front of expensive endpoints if public.
- Never commit `.env`; platform Variables UI is the right place for secrets.
