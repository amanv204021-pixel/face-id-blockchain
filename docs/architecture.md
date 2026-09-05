# Architecture

## Data flow (one pipeline run)

```
[Browser]                    [FastAPI]                        [Storage]
   │  POST /api/pipeline/run     │                                │
   │──────── file ──────────────▶│                                │
   │                             │ 1. SHA-256(file bytes)         │
   │                             │ 2. YuNet detect → bbox+5 pts   │
   │                             │ 3. SFace align → 128-d vector  │  (RAM only)
   │                             │ 4. search provider             │
   │                             │    ├ demo: fixtures/ + pHash   │  (read-only)
   │                             │    └ live: Google WEB_DETECTION│
   │                             │ 5. match: pHash+HSV similarity │
   │                             │ 6. canonical JSON record       │
   │                             │    SHA-256 → recordHash        │
   │                             │ 7. anchor(recordHash, srcHash)─┼─▶ chain.json /
   │                             │ 8. verify: re-hash + compare ──┼─▶ records/<tx>.json
   │◀──═ PipelineResult ═════════│                                │
   │  (8-stage cinematic anim)   │  9. temp upload deleted        │
```

## What goes on-chain (and what never does)

| Artifact | On-chain? | Why |
|---|---|---|
| image SHA-256 | ✔ (inside record hash) | a digest cannot be reversed into a face |
| match source hash + domain | ✔ (inside record hash) | coarse provenance metadata |
| match status + similarity | ✔ (inside record hash) | non-biometric metadata |
| **raw image** | ✘ never | biometric data |
| **face embedding (128-d)** | ✘ never — RAM only | biometric identifier |
| **names / identities** | ✘ never | personal data |

Note: the *record* JSON itself is stored off-chain (`records/<tx>.json`) and
only its SHA-256 is anchored. Verification re-hashes the stored record and
compares with the chain — if anyone edits the record, hashes diverge and the
UI flips to red HASH MISMATCH (try the demo tamper button).

## Two-tier chain design

1. **Simulated chain (default, zero-setup):** append-only JSON blocks,
   `blockHash = SHA-256(txHash + prevHash + height)` — same tamper-evidence
   *logic*, no wallet needed. Always labeled "simulated" in the UI.
2. **EVM testnet (opt-in):** set RPC/KEY/ADDRESS env vars → the backend calls
   `FaceRecordAnchor.storeRecord(bytes32,bytes32,uint256)` via web3.py and
   waits for the receipt. Event: `RecordAnchored(recordHash, sourceHash, ts)`.

## Model licensing

YuNet (230 KB) + SFace (37 MB) come from OpenCV Zoo and are Apache-2.0 —
safe for commercial use, unlike many research-only model packs.
