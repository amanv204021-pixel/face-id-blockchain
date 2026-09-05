# Limitations (honest list)

## Vision
- SFace is a 2021-class encoder. Fine for demos; production identity systems
  need newer models, liveness/anti-spoofing, and demographic-fairness
  evaluation (this project does none of those).
- Match thresholds (≥80 MATCH_FOUND, ≥60 REVIEW_REQUIRED) are heuristic,
  not calibrated probabilities.
- pHash+HSV measures *image* similarity: rescaled/re-compressed copies score
  high; the same person in a different photo will NOT score high. That is by
  design — this is not person re-identification.
- Multiple faces: only the most prominent is processed.

## Search
- DEMO mode searches a 7-file local fixture index — a stand-in for a real
  index, always labeled.
- LIVE mode (Google Vision WEB_DETECTION) finds image/pages matches, and
  never identifies people. Rate limits/quotas apply; failures fall back to
  demo mode with a visible notice.

## Blockchain
- The default chain is a local simulation (append-only, hash-linked). It
  demonstrates the *logic* of tamper-evidence but has no distributed trust.
  Deploy the Solidity contract to a testnet for the real thing.
- Records + chain live in `backend/data/` (gitignored) — a demo store, not a
  database.

## UI/3D
- Bloom + DoF target a normal laptop; reduce DPR on weak GPUs.
- In-3D text uses troika's CDN default font; offline it falls back to plain
  geometry (labels vanish but the app works).
- Mobile works but is not the target; desktop Chrome/Firefox recommended.

## Legal/ethical scope
- This is a hackathon demo. Real biometric systems require lawful basis,
  consent flows, DPIA, retention policy, human review, and compliance with
  e.g. GDPR / BIPA / EU AI Act. The design deliberately keeps biometrics
  off-chain and ephemeral, and never infers identity — keep it that way.
