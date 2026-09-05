import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store'
import { STAGE_ICON, STAGE_LABEL, STAGE_ORDER } from '../../types'
import { api } from '../../services/api'

export function TopBar() {
  const { mode, backend, reset, showArch, set } = useStore()
  const [health, setHealth] = useState<'ok' | 'down' | 'checking'>('checking')

  useEffect(() => {
    api.health().then((h) => { setHealth('ok'); set({ backend: h }) }).catch(() => setHealth('down'))
    const iv = setInterval(() => api.health().then(() => setHealth('ok')).catch(() => setHealth('down')), 15000)
    return () => clearInterval(iv)
  }, [set])

  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }}
      className="pointer-events-auto absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-3">
      <div className="glass flex items-center gap-3 rounded-lg px-4 py-2">
        <svg width="22" height="22" viewBox="0 0 32 32"><polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke="#22d3ee" strokeWidth="2" /><circle cx="16" cy="16" r="5" fill="#e879f9" /></svg>
        <div className="text-[13px] font-semibold tracking-[0.18em] text-cyan-100 neon-text-cyan">FACE ID + BLOCKCHAIN VERIFICATION</div>
      </div>
      <div className={`glass rounded-lg px-3 py-2 text-[11px] font-bold tracking-widest ${mode === 'demo' ? 'text-amber-300' : 'text-emerald-300'}`}>
        {mode === 'demo' ? '◉ DEMO MODE' : '◉ LIVE MODE'}
      </div>
      <div className={`glass rounded-lg px-3 py-2 text-[11px] font-semibold tracking-wider ${health === 'ok' ? 'text-emerald-300' : 'text-red-400'}`}>
        {health === 'ok' ? 'BACKEND ONLINE' : health === 'checking' ? 'CONNECTING…' : 'BACKEND OFFLINE'}
      </div>
      <button onClick={() => set({ showArch: !showArch })}
        className="glass rounded-lg px-3 py-2 text-[11px] font-semibold tracking-wider text-cyan-200 transition hover:shadow-glow-cyan">
        ⌗ SYSTEM ARCHITECTURE
      </button>
      <button onClick={reset}
        className="glass rounded-lg px-3 py-2 text-[11px] font-semibold tracking-wider text-fuchsia-200 transition hover:shadow-glow-magenta">
        ↺ RESET
      </button>
    </motion.div>
  )
}

export function PipelineRail() {
  const { statuses, stage, openInspect, data, busy } = useStore()
  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.15 }}
      className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
      <div className="glass scanlines relative flex items-center gap-1 rounded-xl px-4 py-2.5">
        {STAGE_ORDER.map((s, i) => {
          const st = statuses[s]
          const clickable = st === 'done' && !!data[s]
          return (
            <div key={s} className="flex items-center">
              <button
                onClick={() => clickable && openInspect(s)}
                title={clickable ? `Inspect ${STAGE_LABEL[s]}` : STAGE_LABEL[s]}
                className={[
                  'flex flex-col items-center gap-1 rounded-lg px-2.5 py-1.5 transition-all duration-300',
                  st === 'done' ? 'text-cyan-300' : '',
                  st === 'active' ? 'animate-pulse-glow text-emerald-300 scale-110' : '',
                  st === 'pending' ? 'text-slate-600' : '',
                  st === 'error' ? 'text-red-400' : '',
                  clickable ? 'cursor-pointer hover:bg-cyan-400/10' : 'cursor-default',
                ].join(' ')}>
                <span className="text-lg leading-none">{STAGE_ICON[s]}</span>
                <span className="text-[8.5px] font-bold tracking-wider whitespace-nowrap">{STAGE_LABEL[s]}</span>
                <span className={[
                  'h-1 w-8 rounded-full',
                  st === 'done' ? 'bg-cyan-400 shadow-glow-cyan' :
                  st === 'active' ? 'bg-emerald-400 shadow-glow-green' :
                  st === 'error' ? 'bg-red-500' : 'bg-slate-800',
                ].join(' ')} />
              </button>
              {i < STAGE_ORDER.length - 1 && (
                <span className={`mx-0.5 text-[10px] ${st === 'done' ? 'text-cyan-500' : 'text-slate-700'}`}>→</span>
              )}
            </div>
          )
        })}
      </div>
      {busy && (
        <div className="mt-1 text-center text-[10px] tracking-[0.25em] text-emerald-300/80 animate-pulse">
          PIPELINE RUNNING · STAGE {STAGE_ORDER.indexOf(stage) + 1}/8
        </div>
      )}
    </motion.div>
  )
}

export function Toasts() {
  const toast = useStore((s) => s.toast)
  return (
    <div className="pointer-events-none absolute bottom-24 left-4 z-30 flex flex-col gap-2">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.msg} initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -120, opacity: 0 }}
            className={[
              'glass max-w-sm rounded-lg px-4 py-3 text-[12.5px]',
              toast.kind === 'error' ? 'border-red-500/40 text-red-200' :
              toast.kind === 'success' ? 'border-emerald-500/40 text-emerald-200' : 'border-amber-500/40 text-amber-100',
            ].join(' ')}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
