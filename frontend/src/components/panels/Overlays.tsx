import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../../store'

/** Center-bottom progress readout during the detection stage. */
export function DetectProgress() {
  const { stage, statuses, progress, detectMsg } = useStore()
  if (stage !== 'detect' || statuses.detect !== 'active') return null
  return (
    <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 w-[420px] -translate-x-1/2 text-center">
      <div className="hash-font text-4xl font-bold text-cyan-300 neon-text-cyan">{progress}%</div>
      <div className="mt-2 h-1 overflow-hidden rounded bg-slate-800">
        <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 text-[12px] tracking-[0.2em] text-emerald-300">{detectMsg}…</div>
    </div>
  )
}

/** Verify stage control panel (enter tx hash, tamper-demo, restore). */
export function VerifyPanel() {
  const { verifyForm, set, verifyTx, verifyBusy, tamper, restore, lastTx, data } = useStore()
  const v = data.verify
  const show = ['chain', 'verify'].includes(useStore((s) => s.stage)) && !!lastTx
  if (!show) return null
  return (
    <motion.div initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="pointer-events-auto absolute bottom-24 left-1/2 z-20 w-[560px] -translate-x-1/2">
      <div className="glass rounded-xl p-3">
        <div className="flex gap-2">
          <input
            value={verifyForm}
            onChange={(e) => set({ verifyForm: e.target.value })}
            placeholder={lastTx || 'Paste transaction hash or record hash…'}
            className="hash-font flex-1 rounded-lg border border-cyan-500/25 bg-black/40 px-3 py-2 text-[11px] text-cyan-100 outline-none placeholder:text-slate-600 focus:border-cyan-400/60"
          />
          <button disabled={verifyBusy} onClick={() => verifyTx()}
            className="rounded-lg bg-emerald-500/20 px-4 py-2 text-[11px] font-bold tracking-widest text-emerald-200 transition hover:bg-emerald-400/30 disabled:opacity-40">
            {verifyBusy ? 'CHECKING…' : 'VERIFY RECORD'}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-500">
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-bold tracking-wider text-amber-300">DEMO TOOLS</span>
          <button onClick={tamper} className="text-amber-200/80 underline decoration-dotted hover:text-amber-200">simulate tampering</button>
          <span>·</span>
          <button onClick={restore} className="text-emerald-200/80 underline decoration-dotted hover:text-emerald-200">restore record</button>
          {v && (
            <span className="ml-auto">
              result:&nbsp;
              <b className={v.status === 'VERIFIED' ? 'text-emerald-300' : v.status === 'HASH_MISMATCH' ? 'text-red-400' : 'text-slate-400'}>{v.status}</b>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/** Final verdict box. */
export function FinalBox() {
  const { finalBox, lastResult, reset } = useStore()
  const det = lastResult?.detection
  const lines: [string, boolean][] = [
    ['Face Detected', det?.status === 'ok'],
    ['Image Match', ['MATCH_FOUND', 'REVIEW_REQUIRED'].includes(lastResult?.match?.status ?? '')],
    ['Record Hashed', !!lastResult?.record_hash],
    ['Blockchain', lastResult?.anchor?.status === 'ok'],
    ['Integrity Verified', lastResult?.verification?.status === 'VERIFIED'],
  ]
  return (
    <AnimatePresence>
      {finalBox && lastResult && (
        <motion.div initial={{ scale: 0.8, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="pointer-events-auto absolute left-1/2 top-16 z-30 -translate-x-1/2">
          <div className="glass rounded-xl border-emerald-400/30 p-5 shadow-[0_0_50px_rgba(52,211,153,0.25)]">
            <div className="hash-font whitespace-pre text-[13px] leading-relaxed text-emerald-300 neon-text-green">
              {'╔══════════════════════════════════╗\n║      VERIFICATION COMPLETE       ║\n╠══════════════════════════════════╣'}
              {'\n' + lines.map(([k, ok]) => `║ ${k.padEnd(18)} ${ok ? '✓' : '✗'}${' '.repeat(13)}║`).join('\n')}
              {'\n╚══════════════════════════════════╝'}
            </div>
            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
              <span>total {lastResult.total_time_ms} ms · block #{lastResult.anchor.block_number} · tx {String(lastResult.anchor.tx_hash).slice(0, 14)}…</span>
              <button onClick={reset} className="ml-3 rounded bg-cyan-500/20 px-2 py-1 font-bold tracking-wider text-cyan-200 hover:bg-cyan-400/30">NEW VERIFICATION →</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Stage data inspector modal (opened from the pipeline rail). */
export function InspectModal() {
  const { inspecting, set, data } = useStore()
  return (
    <AnimatePresence>
      {inspecting && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => set({ inspecting: null })}
          className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-[620px] max-w-[90vw] rounded-xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[12px] font-bold tracking-[0.3em] text-cyan-300">STAGE INSPECTOR · {inspecting.toUpperCase()}</div>
              <button onClick={() => set({ inspecting: null })} className="rounded bg-slate-700/50 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-600/50">CLOSE ✕</button>
            </div>
            <pre className="hash-font max-h-[55vh] overflow-auto rounded-lg border border-cyan-500/15 bg-black/50 p-3 text-[10.5px] leading-relaxed text-emerald-200/90">
              {JSON.stringify(data[inspecting] ?? { note: 'no data captured for this stage yet' }, null, 2)}
            </pre>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const ARCH = [
  ['IMAGE INPUT', 'upload · MIME/size validation · SHA-256'],
  ['COMPUTER VISION', 'OpenCV YuNet face detection (Apache-2.0)'],
  ['FACE ENCODER', 'SFace 128-d embedding (stays off-chain)'],
  ['REVERSE IMAGE SEARCH', 'provider layer: demo fixtures | Google Vision'],
  ['MATCH ENGINE', 'pHash + HSV similarity · clearly labeled'],
  ['HASH ENGINE', 'canonical JSON → SHA-256'],
  ['BLOCKCHAIN', 'simulated chain | EVM testnet contract'],
  ['VERIFICATION', 'recompute + compare hash · tamper-evident'],
]

/** Exploded system-architecture overlay for judges. */
export function ArchOverlay() {
  const { showArch, set } = useStore()
  return (
    <AnimatePresence>
      {showArch && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => set({ showArch: false })}
          className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} className="glass w-[560px] max-w-[92vw] rounded-xl p-6">
            <div className="mb-4 text-center text-[13px] font-bold tracking-[0.35em] text-cyan-300 neon-text-cyan">SYSTEM ARCHITECTURE</div>
            <div className="flex flex-col items-center gap-1">
              {ARCH.map(([t, d], i) => (
                <div key={t} className="w-full">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.07 }}
                    className="w-full rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-bold tracking-[0.18em] text-cyan-200">{t}</span>
                      <span className="text-[9.5px] text-slate-400">{d}</span>
                    </div>
                  </motion.div>
                  {i < ARCH.length - 1 && <div className="py-0.5 text-center text-[10px] text-fuchsia-400">↓</div>}
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-cyan-500/10 pt-3 text-center text-[9.5px] leading-relaxed text-slate-500">
              Only hashes & non-sensitive metadata are anchored. No images, embeddings or personal data ever touch the chain.
            </div>
            <button onClick={() => set({ showArch: false })}
              className="mt-3 w-full rounded-lg bg-fuchsia-500/15 py-2 text-[11px] font-bold tracking-[0.25em] text-fuchsia-200 hover:bg-fuchsia-400/25">
              CLOSE
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
