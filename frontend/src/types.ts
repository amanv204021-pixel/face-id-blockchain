export type StageId =
  | 'upload' | 'detect' | 'encode' | 'search'
  | 'match' | 'hash' | 'chain' | 'verify'

export const STAGE_ORDER: StageId[] = [
  'upload', 'detect', 'encode', 'search', 'match', 'hash', 'chain', 'verify',
]

export const STAGE_LABEL: Record<StageId, string> = {
  upload: 'IMAGE',
  detect: 'FACE DETECTION',
  encode: 'ENCODING',
  search: 'REVERSE SEARCH',
  match: 'MATCH',
  hash: 'HASH',
  chain: 'BLOCKCHAIN',
  verify: 'VERIFY',
}

export const STAGE_ICON: Record<StageId, string> = {
  upload: '▣', detect: '⌖', encode: '⁂', search: '🔍',
  match: '⇄', hash: '#', chain: '⛓', verify: '✔',
}

export type StageStatus = 'pending' | 'active' | 'done' | 'error'

export interface FaceBox { x: number; y: number; w: number; h: number; score: number }

export interface PipelineResult {
  mode: string
  pipeline_version: string
  image: { name: string; width: number; height: number; sha256: string; size_bytes: number }
  detection: {
    status: string; message: string; faces_found: number; confidence?: number
    bbox?: FaceBox; landmarks: number[][]; detector: string; time_ms: number; note?: string
  }
  encoding: {
    status: string; message?: string; dims: number; model: string; fallback: boolean
    encoding_hash: string; vector: number[]; time_ms: number; privacy_note?: string
  }
  search: {
    status: string; mode: string; provider: string; notice: string
    candidates: { url: string; domain: string; title: string; similarity: number; thumbnail: string | null }[]
    best: { url: string; domain: string; title: string; similarity: number; thumbnail: string | null } | null
    time_ms: number
  }
  match: { status: string; similarity: number; method: string; source: string; url: string; time_ms: number }
  record: Record<string, unknown>
  record_hash: string
  anchor: { status: string; tx_hash: string; block_number: number; timestamp: string; network: string; simulated: boolean; explorer_note: string }
  verification: { status: string; tx_hash: string; stored_record_hash: string; recomputed_record_hash: string; record: Record<string, unknown>; message: string }
  total_time_ms: number
}

export interface DetectMsg { at: number; text: string; done?: boolean }
