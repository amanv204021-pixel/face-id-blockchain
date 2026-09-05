import { Suspense } from 'react'
import { useStore } from '../store'
import HoloFace from '../three/HoloFace'
import ImageFrame from '../three/ImageFrame'
import EncodingParticles from '../three/EncodingParticles'
import Globe from '../three/Globe'
import MatchView from '../three/MatchView'
import HashCore from '../three/HashCore'
import ChainBlocks from '../three/ChainBlocks'
import VerifyBadge from '../three/VerifyBadge'

/** Maps the current pipeline stage to its 3D scene. */
export default function SceneController() {
  const phase = useStore((s) => s.phase)
  const stage = useStore((s) => s.stage)
  const statuses = useStore((s) => s.statuses)
  const data = useStore((s) => s.data)
  const imagePreview = useStore((s) => s.imagePreview)
  const candidateImage = useStore((s) => s.candidateImage)
  const busy = useStore((s) => s.busy)

  const st = (k: keyof typeof statuses) => statuses[k]
  const d = (k: keyof typeof data) => data[k] ?? {}

  if (phase === 'intro') {
    return (
      <Suspense fallback={null}>
        <HoloFace scale={1.5} />
      </Suspense>
    )
  }

  switch (stage) {
    case 'upload':
      return (
        <Suspense fallback={null}>
          {imagePreview ? (
            <ImageFrame url={imagePreview} width={d('upload').width ?? 0} height={d('upload').height ?? 0} mode="upload" />
          ) : (
            <HoloFace scale={1.1} scanActive={false} />
          )}
        </Suspense>
      )
    case 'detect':
      return (
        <Suspense fallback={null}>
          {imagePreview && (
            <ImageFrame url={imagePreview} width={d('upload').width ?? 0} height={d('upload').height ?? 0} mode="detect" />
          )}
        </Suspense>
      )
    case 'encode':
      return <EncodingParticles active={st('encode') === 'active' || busy} />
    case 'search':
      return <Globe active={st('search') === 'active'} />
    case 'match':
      return (
        <Suspense fallback={null}>
          {imagePreview && (
            <MatchView
              queryUrl={imagePreview}
              candidateUrl={candidateImage}
              hasMatch={!!d('match')?.url || d('match')?.status === 'MATCH_FOUND'}
            />
          )}
        </Suspense>
      )
    case 'hash':
      return <HashCore hash={d('hash')?.record_hash ?? ''} active={st('hash') === 'active'} />
    case 'chain':
      return (
        <ChainBlocks
          txHash={d('chain')?.tx_hash ?? ''}
          blockNumber={d('chain')?.block_number ?? 1}
          timestamp={d('chain')?.timestamp ?? ''}
          stage={st('chain') === 'done' ? 'done' : 'active'}
        />
      )
    case 'verify':
      return <VerifyBadge status={d('verify')?.status ?? (st('verify') === 'active' ? 'CHECKING' : 'IDLE')} />
    default:
      return <HoloFace scale={1.1} scanActive={false} />
  }
}
