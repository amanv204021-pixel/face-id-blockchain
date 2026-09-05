# Demo script (stage / judging walkthrough, ~90 s)

## Setup (before the audience)
1. Backend: `cd backend && uvicorn app.main:app --port 8000`
2. Frontend: `cd frontend && npm run dev` → open http://localhost:5173
3. Optional: pre-run once so the chain has a block or two.

## The 90 seconds
1. **Intro scene** — holographic face, rings, laser. Say: "Every stage you
   are about to see is real code running locally — not a video."
2. Click **START VERIFICATION**.
3. Click **RUN FULL PIPELINE** (left panel). Narrate as stages light:
   - *Scan*: "OpenCV YuNet — a real CNN face detector, running on CPU."
   - *Galaxy*: "That's the actual 128-dimensional SFace embedding drawn as
     particles — 128 green nodes, one per dimension."
   - *Globe*: "Reverse-image search provider layer — demo fixture index by
     default, Google Vision when API keys are configured. No scraping."
   - *Beam*: "Perceptual hashing compares the images — similarity, not
     identity. We are very explicit about that."
   - *Core*: "The record — hashes and metadata ONLY — is serialized
     canonically and SHA-256 hashed."
   - *Blocks*: "Anchored. By default on a local simulated chain; the same
     Solidity contract deploys to any EVM testnet with one script."
4. **VERIFICATION COMPLETE** box appears. Open the bottom rail icons to
   inspect each stage's raw JSON.
5. **The killer moment**: in the verify panel click **simulate tampering**
   → 3D badge turns red **HASH MISMATCH**. "The chain didn't change; the
   file did. That's tamper-evidence." Click **restore** → green again.
6. Click **SYSTEM ARCHITECTURE** for the Q&A diagram.

## Q&A ammo
- "Where do embeddings go?" → Nowhere. RAM only, discarded per request.
- "What stops fake search results?" → Demo mode is labeled; live mode calls
  Google's official API; the app refuses to fabricate results.
- "Why is the block glowing?" → It's the block this run just created;
  connect it to `backend/data/chain.json` to see the stored hashes.
