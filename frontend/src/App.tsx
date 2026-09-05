import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import ErrorBoundary from './components/ErrorBoundary'
import SceneController from './scenes/SceneController'
import Effects from './three/Effects'
import Ambient from './three/Ambient'
import CameraRig from './three/CameraRig'
import { TopBar, PipelineRail, Toasts } from './components/hud/Chrome'
import IntroOverlay from './components/hud/IntroOverlay'
import { UploadPanel } from './components/panels/UploadPanel'
import StagePanel from './components/panels/StagePanel'
import { DetectProgress, VerifyPanel, FinalBox, InspectModal, ArchOverlay } from './components/panels/Overlays'
import { useStore } from './store'
import { useHotkeys } from './hooks/useHotkeys'

export default function App() {
  const phase = useStore((s) => s.phase)
  const stage = useStore((s) => s.stage)
  const busy = useStore((s) => s.busy)
  useHotkeys()

  return (
    <div className="relative h-full w-full overflow-hidden bg-abyss">
      <ErrorBoundary>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, 6.8], fov: 50, near: 0.1, far: 140 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#04060e']} />
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <Ambient />
          <SceneController />
        </Suspense>
        <CameraRig stage={stage} phase={phase} />
        <Effects />
      </Canvas>
      </ErrorBoundary>

      {phase === 'intro' ? (
        <IntroOverlay />
      ) : (
        <>
          <TopBar />
          {stage === 'upload' && !busy && <UploadPanel />}
          <StagePanel />
          <DetectProgress />
          <VerifyPanel />
          <FinalBox />
          <PipelineRail />
        </>
      )}

      <Toasts />
      <InspectModal />
      <ArchOverlay />
    </div>
  )
}
