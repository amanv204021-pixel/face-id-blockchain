# Deploying FACE ID + BLOCKCHAIN VERIFICATION

## Backend on Render

1. Open Render and choose **New > Blueprint**.
2. Select the GitHub repository `amanv204021-pixel/face-id-blockchain`.
3. Render will read [`render.yaml`](./render.yaml) and build the Docker service.
4. After deployment, copy the generated backend URL and confirm:
   `https://<backend>.onrender.com/api/health`

The default configuration uses the local demo fixture search and a simulated
chain. Optional secrets can be added in Render:

```text
GOOGLE_VISION_API_KEY=
BLOCKCHAIN_RPC_URL=
BLOCKCHAIN_PRIVATE_KEY=
CONTRACT_ADDRESS=
```

## Frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Use the Vite defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add `VITE_API_URL` with the Render backend URL, for example:
   `https://face-id-blockchain-api.onrender.com`
5. Deploy.

The frontend uses `VITE_API_URL` in production and the Vite `/api` proxy for
local development.

## Verify the deployment

Open the Vercel URL, click **START VERIFICATION**, and run the demo pipeline.
The final screen should show **VERIFIED**. The backend health endpoint should
report `status: online`, `search_mode: demo-fixtures`, and
`blockchain_mode: simulated-local`.

Render's free service may sleep when idle, so the first request after a period
of inactivity can take longer.
