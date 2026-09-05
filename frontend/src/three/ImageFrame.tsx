import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'

/** Holographic image frame with sweeping scanline — used for UPLOAD and DETECT stages. */
export default function ImageFrame({ url, width, height, mode }: {
  url: string
  width: number
  height: number
  mode: 'upload' | 'detect'
}) {
  const tex = useLoader(TextureLoader, url)
  const scan = useRef<THREE.Mesh>(null!)
  const group = useRef<THREE.Group>(null!)
  const aspect = width && height ? width / height : 1
  const H = 2.6
  const W = H * Math.min(Math.max(aspect, 0.6), 1.8)

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.3) * 0.12
      group.current.position.y = Math.sin(t * 0.7) * 0.04
    }
    if (scan.current) {
      scan.current.position.y = ((t * 0.55) % 1 - 0.5) * H
      const m = scan.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.35 + Math.sin(t * 9) * 0.1
    }
    void dt
  })

  return (
    <group ref={group}>
      {/* the image */}
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* holo tint */}
      <mesh position={[0, 0, 0.013]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* scanline */}
      {mode === 'detect' && (
        <mesh ref={scan} position={[0, 0, 0.02]}>
          <planeGeometry args={[W, 0.05]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      {/* frame brackets */}
      {([[-1, 1], [1, 1], [-1, -1], [1, -1]] as const).map(([sx, sy], i) => (
        <group key={i} position={[sx * W / 2, sy * H / 2, 0.02]}>
          <mesh position={[-sx * 0.18, 0, 0]}>
            <boxGeometry args={[0.36, 0.03, 0.01]} />
            <meshBasicMaterial color="#22d3ee" toneMapped={false} />
          </mesh>
          <mesh position={[0, -sy * 0.18, 0]}>
            <boxGeometry args={[0.03, 0.36, 0.01]} />
            <meshBasicMaterial color="#22d3ee" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* bounding box (appears in detect mode) */}
      {mode === 'detect' && (
        <group>
          <lineSegments position={[0, 0, 0.03]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(W * 0.56, H * 0.66).toNonIndexed()]} />
            <lineBasicMaterial color="#e879f9" transparent opacity={0.9} />
          </lineSegments>
          {([[-1, 1], [1, 1], [-1, -1], [1, -1]] as const).map(([sx, sy], i) => (
            <group key={i} position={[sx * W * 0.28, sy * H * 0.33, 0.035]}>
              <mesh position={[-sx * 0.09, 0, 0]}>
                <boxGeometry args={[0.18, 0.022, 0.01]} />
                <meshBasicMaterial color="#e879f9" toneMapped={false} />
              </mesh>
              <mesh position={[0, -sy * 0.09, 0]}>
                <boxGeometry args={[0.022, 0.18, 0.01]} />
                <meshBasicMaterial color="#e879f9" toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  )
}
