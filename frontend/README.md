# Frontend — React + Three.js 3D experience

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api → :8000)
```

- `src/three/` — HoloFace, ImageFrame, EncodingParticles, Globe, MatchView,
  HashCore, ChainBlocks, VerifyBadge, Ambient, CameraRig
- `src/scenes/SceneController.tsx` — maps pipeline stage → 3D scene
- `src/store.ts` — zustand state machine + backend-driven animation timing
- `npm run build` — typecheck + production bundle
