import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'

export function UploadPanel() {
  const { uploadAndRun, runDemo, runFullPipeline, busy } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [localErr, setLocalErr] = useState('')

  const handle = (f?: File | null) => {
    if (!f) return
    if (!/image\/(png|jpeg|webp)/.test(f.type)) { setLocalErr('Only PNG / JPEG / WebP images are supported.'); return }
    if (f.size > 10 * 1024 * 1024) { setLocalErr('Image too large — 10 MB maximum.'); return }
    setLocalErr('')
    uploadAndRun(f)
  }

  return (
    <motion.div initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
      className="pointer-events-auto absolute left-4 top-1/2 z-20 w-[320px] -translate-y-1/2">
      <div className="glass rounded-xl p-4">
        <div className="mb-1 text-[10px] font-bold tracking-[0.3em] text-cyan-400">STAGE 01 · IMAGE INPUT</div>
        <div className="mb-3 text-[11px] leading-relaxed text-slate-400">
          Upload a <span className="text-cyan-300">synthetic / authorized</span> test image, or use the built-in demo fixture.
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]) }}
          onClick={() => input.current?.click()}
          className={[
            'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all',
            drag ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-400/5',
          ].join(' ')}>
          <div className="text-3xl">▣</div>
          <div className="mt-1 text-[12px] font-semibold text-cyan-200">DROP IMAGE / CLICK TO UPLOAD</div>
          <div className="text-[10px] text-slate-500">PNG · JPEG · WebP · max 10 MB</div>
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
          onChange={(e) => handle(e.target.files?.[0])} />
        {localErr && <div className="mt-2 rounded border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-300">{localErr}</div>}
        <button disabled={busy} onClick={runDemo}
          className="mt-3 w-full rounded-lg bg-cyan-500/15 py-2.5 text-[12px] font-bold tracking-[0.2em] text-cyan-200 transition hover:bg-cyan-400/25 hover:shadow-glow-cyan disabled:opacity-40">
          ⚡ UPLOAD TEST IMAGE (DEMO)
        </button>
        <button disabled={busy} onClick={runFullPipeline}
          className="mt-2 w-full rounded-lg bg-fuchsia-500/15 py-2.5 text-[12px] font-bold tracking-[0.2em] text-fuchsia-200 transition hover:bg-fuchsia-400/25 hover:shadow-glow-magenta disabled:opacity-40">
          ▶ RUN FULL PIPELINE
        </button>
        <div className="mt-3 border-t border-cyan-500/10 pt-2 text-[9.5px] leading-relaxed text-slate-500">
          Demo mode searches a local fixture index of AI-generated images. No person identification is performed; image similarity ≠ identity.
        </div>
      </div>
    </motion.div>
  )
}
