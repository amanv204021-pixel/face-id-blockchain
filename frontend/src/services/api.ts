const j = async (r: Response): Promise<any> => {
  if (!r.ok) {
    const body = await r.json().catch(() => ({ detail: r.statusText }))
    throw new Error(body.detail || r.statusText)
  }
  return r.json()
}

export const api = {
  health: () => fetch('/api/health').then(j),

  runPipeline: (file?: File) => {
    const fd = new FormData()
    if (file) fd.append('file', file)
    return fetch('/api/pipeline/run', { method: 'POST', body: fd }).then(j)
  },

  verify: (tx: string) =>
    fetch(`/api/blockchain/verify/${encodeURIComponent(tx.trim())}`).then(j),

  tamper: (tx: string) =>
    fetch(`/api/demo/tamper?tx_hash=${encodeURIComponent(tx)}`, { method: 'POST' }).then(j),

  restore: (tx: string) =>
    fetch(`/api/demo/restore?tx_hash=${encodeURIComponent(tx)}`, { method: 'POST' }).then(j),

  resetChain: () => fetch('/api/demo/reset-chain', { method: 'POST' }).then(j),

  fetchDemoImage: async (): Promise<File> => {
    const r = await fetch('/api/demo/image')
    if (!r.ok) throw new Error('demo image unavailable')
    const blob = await r.blob()
    if (!blob.type.startsWith('image/')) throw new Error('demo fixture is not an image — check backend')
    return new File([blob], 'authorized_test_subject.png (demo fixture)', { type: 'image/png' })
  },
}
