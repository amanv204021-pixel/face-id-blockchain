import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../../store'
import { STAGE_LABEL, StageId } from '../../types'

const Row = ({ k, v, mono = true, color = 'text-slate-200' }: { k: string; v: any; mono?: boolean; color?: string }) => (
  <div className="flex items-start justify-between gap-3 py-[3px]">
    <span className="text-[10px] tracking-wider text-slate-500 uppercase">{k}</span>
    <span className={`${mono ? 'hash-font' : ''} max-w-[210px] break-all text-right text-[11px] ${color}`}>{String(v)}</span>
  </div>
)

const JSONView = ({ obj }: { obj: object }) => (
  <pre className="hash-font mt-1 max-h-44 overflow-auto rounded-lg border border-cyan-500/15 bg-black/40 p-2 text-[9.5px] leading-relaxed text-emerald-200/90">
    {JSON.stringify(obj, null, 2)}
  </pre>
)

/** Right-hand glass panel showing live data for the active/completed stage. */
export default function StagePanel() {
  const { stage, statuses, data, busy } = useStore()
  // Show the current stage's data, or persist the most recent completed
  // stage's panel until new data arrives (avoids single-frame flashes).
  const stageOrder: StageId[] = ['upload', 'detect', 'encode', 'search', 'match', 'hash', 'chain', 'verify']
  const panelStage: StageId = (data[stage] && stage) || [...stageOrder].reverse().find((k) => data[k]) || stage
  const sd = data[panelStage]
  if (stage === 'upload' && !data.upload) return null
  if (!sd) return null

  const body = () => {
    switch (panelStage) {
      case 'upload':
        return sd && (
          <>
            <Row k="File" v={sd.name} mono={false} />
            <Row k="Dimensions" v={sd.width && sd.height ? `${sd.width} × ${sd.height} px` : '…'} />
            <Row k="Size" v={sd.size_bytes ? `${(sd.size_bytes / 1024).toFixed(1)} KB` : '…'} />
            <Row k="SHA-256" v={sd.sha256 ? `${String(sd.sha256).slice(0, 24)}…` : 'computing…'} color="text-emerald-300" />
          </>
        )
      case 'detect':
        return sd && (
          <>
            <Row k="Faces Found" v={sd.faces_found ?? '—'} color="text-cyan-200" />
            <Row k="Confidence" v={sd.confidence != null ? `${(sd.confidence * 100).toFixed(1)}%` : '—'} color="text-emerald-300" />
            <Row k="Detector" v={sd.detector || '—'} />
            {sd.bbox && <Row k="Bounding Box" v={`x:${sd.bbox.x} y:${sd.bbox.y} w:${sd.bbox.w} h:${sd.bbox.h}`} />}
            <Row k="Time" v={`${sd.time_ms ?? 0} ms`} />
            <div className="mt-1 rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[9.5px] text-amber-200/80">
              Detection locates a face — it does not identify any person.
            </div>
          </>
        )
      case 'encode':
        return sd && (
          <>
            <Row k="Dimensions" v={sd.dims ? `${sd.dims}-d` : '—'} color="text-cyan-200" />
            <Row k="Model" v={sd.model || '—'} />
            <Row k="Status" v="VALID" color="text-emerald-300" />
            <Row k="Encoding Hash" v={sd.encoding_hash || '—'} color="text-emerald-300" />
            <div className="mt-1 rounded border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[9.5px] text-emerald-200/80">
              {sd.privacy_note || 'Embedding never leaves this machine. Never stored, never anchored.'}
            </div>
          </>
        )
      case 'search':
        return sd && (
          <>
            <Row k="Provider" v={sd.provider || '—'} />
            <Row k="Candidates" v={sd.candidates?.length ?? 0} />
            {sd.notice && (
              <div className="mt-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[9.5px] leading-relaxed text-amber-200">
                {sd.notice}
              </div>
            )}
            <div className="mt-2 space-y-1">
              {(sd.candidates ?? []).slice(0, 4).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded border border-cyan-500/10 bg-cyan-500/5 px-2 py-1">
                  <span className="truncate text-[10px] text-slate-300">{c.domain}</span>
                  <span className={`hash-font text-[10px] ${i === 0 ? 'text-emerald-300' : 'text-slate-400'}`}>{c.similarity}%</span>
                </div>
              ))}
            </div>
          </>
        )
      case 'match':
        return sd && (
          <>
            <Row k="Status" v={sd.status} color={sd.status === 'MATCH_FOUND' ? 'text-emerald-300' : sd.status === 'REVIEW_REQUIRED' ? 'text-amber-300' : 'text-red-300'} />
            <Row k="Similarity" v={`${sd.similarity ?? 0}%`} color="text-cyan-200" />
            <Row k="Method" v={sd.method || '—'} />
            <Row k="Source" v={sd.source || '—'} />
            {sd.url && <Row k="URL" v={sd.url.length > 40 ? sd.url.slice(0, 40) + '…' : sd.url} color="text-fuchsia-300" />}
            <div className="mt-1 rounded border border-fuchsia-500/20 bg-fuchsia-500/5 px-2 py-1 text-[9.5px] text-fuchsia-200/80">
              Image similarity ≠ confirmed human identity.
            </div>
          </>
        )
      case 'hash':
        return sd && (
          <>
            <Row k="Algorithm" v="SHA-256 (canonical JSON)" />
            <Row k="Record Hash" v={sd.record_hash || '—'} color="text-emerald-300" />
            {sd.record && <JSONView obj={sd.record} />}
          </>
        )
      case 'chain':
        return sd && (
          <>
            <Row k="TX Hash" v={`${String(sd.tx_hash).slice(0, 22)}…`} color="text-emerald-300" />
            <Row k="Block #" v={sd.block_number ?? '—'} />
            <Row k="Network" v={sd.network || '—'} />
            <Row k="Timestamp" v={sd.timestamp || '—'} />
            {sd.simulated && (
              <div className="mt-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9.5px] text-amber-200">
                Simulated demo chain — same logic as the Solidity contract (deployable to any EVM testnet).
              </div>
            )}
          </>
        )
      case 'verify':
        return sd && (
          <>
            <Row k="Status" v={sd.status} color={sd.status === 'VERIFIED' ? 'text-emerald-300' : 'text-red-300'} />
            <Row k="Stored Hash" v={sd.stored_record_hash ? `${String(sd.stored_record_hash).slice(0, 22)}…` : '—'} />
            <Row k="Recomputed" v={sd.recomputed_record_hash ? `${String(sd.recomputed_record_hash).slice(0, 22)}…` : '—'} />
            {sd.message && <div className="mt-1 text-[10px] leading-relaxed text-slate-400">{sd.message}</div>}
          </>
        )
      default:
        return null
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sd && (
        <motion.div key={panelStage} initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }} transition={{ duration: 0.4 }}
          className="pointer-events-auto absolute right-4 top-1/2 z-20 w-[300px] -translate-y-1/2">
          <div className="glass scanlines relative rounded-xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                {`STAGE 0${['upload', 'detect', 'encode', 'search', 'match', 'hash', 'chain', 'verify'].indexOf(panelStage) + 1} · ${STAGE_LABEL[panelStage]}`}
              </div>
              <span className={[
                'rounded px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider',
                statuses[panelStage] === 'done' ? 'bg-emerald-500/20 text-emerald-300' :
                statuses[panelStage] === 'active' ? 'animate-pulse-glow bg-cyan-500/20 text-cyan-300' :
                statuses[panelStage] === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700/40 text-slate-500',
              ].join(' ')}>
                {statuses[panelStage] === 'done' ? '✓ COMPLETE' : statuses[panelStage] === 'active' ? (busy ? 'RUNNING' : 'ACTIVE') : statuses[panelStage] === 'error' ? '✗ ERROR' : 'PENDING'}
              </span>
            </div>
            <div className="border-t border-cyan-500/10 pt-1">{body()}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
