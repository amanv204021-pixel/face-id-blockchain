import { create } from 'zustand'
import { api } from './services/api'
import { PipelineResult, StageId, StageStatus, STAGE_ORDER } from './types'

/** Animation speed multiplier — set ?speed=0.2 for slow-motion demos/captures. */
const SPEED = (() => {
  try { return Math.min(Math.max(Number(new URLSearchParams(window.location.search).get('speed') ?? '1'), 0.1), 3) } catch { return 1 }
})()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms / SPEED))

export type Phase = 'intro' | 'pipeline'

interface Toast { kind: 'error' | 'info' | 'success'; msg: string }

interface AppState {
  phase: Phase
  stage: StageId
  statuses: Record<StageId, StageStatus>
  data: Record<StageId, any>
  imagePreview: string | null
  candidateImage: string | null
  mode: 'demo' | 'live'
  backend: any
  busy: boolean
  progress: number
  detectMsg: string
  toast: Toast | null
  inspecting: StageId | null
  showArch: boolean
  finalBox: boolean
  verifyForm: string
  verifyBusy: boolean
  lastTx: string
  lastResult: PipelineResult | null

  set: (p: Partial<AppState>) => void
  showToast: (kind: Toast['kind'], msg: string) => void
  start: () => void
  reset: () => void
  setStage: (s: StageId, status: StageStatus, data?: any) => void
  uploadAndRun: (file: File) => Promise<void>
  runDemo: () => Promise<void>
  runFullPipeline: () => Promise<void>
  verifyTx: (tx?: string) => Promise<void>
  tamper: () => Promise<void>
  restore: () => Promise<void>
  openInspect: (s: StageId) => void
}

const initialStatuses: Record<StageId, StageStatus> = {
  upload: 'pending', detect: 'pending', encode: 'pending', search: 'pending',
  match: 'pending', hash: 'pending', chain: 'pending', verify: 'pending',
}

const emptyData: Record<StageId, any> = { upload: null, detect: null, encode: null, search: null, match: null, hash: null, chain: null, verify: null }

export const useStore = create<AppState>((setState, get) => ({
  phase: 'intro',
  stage: 'upload',
  statuses: { ...initialStatuses },
  data: emptyData,
  imagePreview: null,
  candidateImage: null,
  mode: 'demo',
  backend: null,
  busy: false,
  progress: 0,
  detectMsg: '',
  toast: null,
  inspecting: null,
  showArch: false,
  finalBox: false,
  verifyForm: '',
  verifyBusy: false,
  lastTx: '',
  lastResult: null,

  set: (p) => setState(p),
  showToast: (kind, msg) => {
    setState({ toast: { kind, msg } })
    setTimeout(() => { if (get().toast?.msg === msg) setState({ toast: null }) }, 4200)
  },

  start: () => setState({ phase: 'pipeline', stage: 'upload' }),

  reset: () => setState({
    phase: 'pipeline', stage: 'upload', statuses: { ...initialStatuses }, data: emptyData,
    imagePreview: null, candidateImage: null, busy: false, progress: 0, detectMsg: '',
    inspecting: null, finalBox: false, lastResult: null, lastTx: '',
  }),

  setStage: (s, status, data) => setState((st) => ({
    statuses: { ...st.statuses, [s]: status },
    data: data !== undefined ? { ...st.data, [s]: data } : st.data,
  })),

  openInspect: (s) => setState({ inspecting: s }),

  uploadAndRun: async (file) => {
    if (get().busy) return
    setState((st) => ({
      busy: true, statuses: { ...initialStatuses, upload: 'active' }, data: { ...emptyData, upload: { name: file.name, size_bytes: file.size, type: file.type } },
      finalBox: false, imagePreview: URL.createObjectURL(file),
      stage: 'upload', inspecting: null,
    }))
    try {
      const res: PipelineResult = await api.runPipeline(file)
      await animatePipeline(res, setState, get)
    } catch (e: any) {
      setState((st) => ({ statuses: { ...st.statuses, upload: 'error' }, busy: false }))
      get().showToast('error', friendlyError(e))
    }
  },

  runDemo: async () => {
    if (get().busy) return
    try {
      const file = await api.fetchDemoImage()
      await get().uploadAndRun(file)
    } catch (e: any) {
      get().showToast('error', 'Demo image unavailable — is the backend running?')
    }
  },

  runFullPipeline: async () => {
    if (get().busy) return
    await get().runDemo()
  },

  verifyTx: async (tx) => {
    const hash = tx ?? get().verifyForm
    if (!hash.trim()) { get().showToast('error', 'Enter a transaction hash first.'); return }
    setState({ verifyBusy: true, stage: 'verify', statuses: { ...get().statuses, verify: 'active' } })
    try {
      const v = await api.verify(hash)
      await sleep(900)
      setState((st) => ({
        verifyBusy: false,
        data: { ...st.data, verify: v },
        statuses: { ...st.statuses, verify: v.status === 'VERIFIED' ? 'done' : 'error' },
        lastTx: v.tx_hash || hash,
      }))
      if (v.status === 'NOT_FOUND') get().showToast('error', v.message)
    } catch (e: any) {
      setState({ verifyBusy: false, statuses: { ...get().statuses, verify: 'error' } })
      get().showToast('error', friendlyError(e))
    }
  },

  tamper: async () => {
    const tx = get().lastTx
    if (!tx) { get().showToast('error', 'No anchored record yet — run the pipeline first.'); return }
    try {
      await api.tamper(tx)
      get().showToast('info', 'Off-chain record mutated (DEMO). Verifying…')
      await sleep(400)
      await get().verifyTx(tx)
    } catch (e: any) { get().showToast('error', friendlyError(e)) }
  },

  restore: async () => {
    const tx = get().lastTx
    if (!tx) return
    try {
      await api.restore(tx)
      get().showToast('success', 'Record restored.')
      await sleep(300)
      await get().verifyTx(tx)
    } catch (e: any) { get().showToast('error', friendlyError(e)) }
  },
}))

function friendlyError(e: any): string {
  const m = String(e?.message || e)
  if (/Failed to fetch|NetworkError/.test(m)) return 'Backend unreachable — is the FastAPI server running on :8000?'
  return m
}

/** Sequences the 3D stage animation from a completed backend pipeline result. */
async function animatePipeline(
  res: PipelineResult,
  setState: (p: Partial<AppState> | ((st: AppState) => Partial<AppState>)) => void,
  get: () => AppState,
) {
  const set = (s: StageId, status: StageStatus, data?: any) => setState((st) => ({
    statuses: { ...st.statuses, [s]: status },
    data: data !== undefined ? { ...st.data, [s]: data } : st.data,
    stage: s,
  }))

  setState({ lastResult: res, mode: res.search.mode === 'demo-fixtures' ? 'demo' : 'live', candidateImage: res.search.best?.thumbnail ?? null })

  // 1 — upload
  set('upload', 'active', { name: res.image.name, size_bytes: res.image.size_bytes, width: res.image.width, height: res.image.height, sha256: res.image.sha256 })
  await sleep(1300)
  set('upload', 'done')

  // 2 — detection (with progress + status messages)
  const det = res.detection
  set('detect', 'active', null)
  const msgs = ['Initializing Vision Engine', 'Detecting Face', 'Extracting Facial Landmarks', 'Generating Encoding']
  for (let i = 0; i < 40; i++) {
    setState({ progress: Math.round(((i + 1) / 40) * 100), detectMsg: msgs[Math.min(3, Math.floor(i / 10))] })
    await sleep(38)
  }
  setState({ progress: 100 })
  await sleep(350)
  if (det.status !== 'ok') {
    set('detect', 'error', det)
    setState({ busy: false, detectMsg: '' })
    get().showToast('error', det.message || 'Detection failed — upload another authorized test image.')
    return
  }
  set('detect', 'done', det)
  setState({ detectMsg: '' })

  // 3 — encoding
  set('encode', 'active', null)
  await sleep(1400)
  set('encode', 'done', res.encoding)

  // 4 — reverse search
  set('search', 'active', null)
  await sleep(1600)
  if (res.search.status === 'error') {
    set('search', 'error', res.search)
    get().showToast('error', res.search.notice)
    setState({ busy: false })
    return
  }
  set('search', 'done', res.search)

  // 5 — match
  set('match', 'active', null)
  await sleep(1400)
  set('match', 'done', res.match)

  // 6 — hash
  set('hash', 'active', null)
  await sleep(1500)
  set('hash', 'done', { record: res.record, record_hash: res.record_hash })

  // 7 — blockchain
  set('chain', 'active', null)
  await sleep(1800)
  set('chain', 'done', res.anchor)
  setState({ lastTx: res.anchor.tx_hash })

  // 8 — verify
  set('verify', 'active', null)
  await sleep(1300)
  set('verify', 'done', res.verification)

  setState({ busy: false, finalBox: true, progress: 0 })
}
