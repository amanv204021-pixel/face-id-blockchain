import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import { Text } from '@react-three/drei'
import { FONT } from './font'

function Panel({ url, x, label, dim }: { url: string; x: number; label: string; dim?: boolean }) {
  const tex = useLoader(TextureLoader, url)
  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <planeGeometry args={[2.1, 2.1]} />
        <meshBasicMaterial map={tex} toneMapped={false} transparent opacity={dim ? 0.35 : 1} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshBasicMaterial color={dim ? '#64748b' : '#22d3ee'} transparent opacity={dim ? 0.5 : 0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <lineSegments position={[0, 0, 0.02]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.1, 2.1)]} />
        <lineBasicMaterial color={dim ? '#475569' : '#22d3ee'} transparent opacity={0.9} />
      </lineSegments>
      <Text
      font={FONT} position={[0, -1.35, 0]} fontSize={0.14} color={dim ? '#64748b' : '#a5f3fc'} anchorX="center">
        {label}
      </Text>
    </group>
  )
}

/** Split holographic display: query vs matched candidate + connection beam. */
export default function MatchView({ queryUrl, candidateUrl, hasMatch }: {
  queryUrl: string
  candidateUrl: string | null
  hasMatch: boolean
}) {
  const beam = useRef<THREE.Mesh>(null!)
  const flow = useRef<THREE.Points>(null!)

  const flowPos = useMemo(() => {
    const N = 60
    const p = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 3.4
      p[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.4
    }
    return p
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.3 + Math.sin(t * 6) * 0.15
      beam.current.scale.x = 1 + Math.sin(t * 3) * 0.06
    }
    if (flow.current && hasMatch) {
      const arr = (flow.current.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] += dt * 1.4
        if (arr[i] > 1.7) arr[i] = -1.7
      }
      ;(flow.current.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    }
  })

  return (
    <group>
      <Panel url={queryUrl} x={-2.2} label="ORIGINAL TEST IMAGE" />
      {candidateUrl && hasMatch ? (
        <Panel url={candidateUrl} x={2.2} label="BEST MATCH (DEMO INDEX)" />
      ) : (
        <group position={[2.2, 0, 0]}>
          <mesh>
            <planeGeometry args={[2.1, 2.1]} />
            <meshBasicMaterial color="#0a1120" transparent opacity={0.7} />
          </mesh>
          <lineSegments position={[0, 0, 0.02]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(2.1, 2.1)]} />
            <lineBasicMaterial color="#475569" />
          </lineSegments>
          <Text
      font={FONT} position={[0, 0, 0.03]} fontSize={0.2} color="#f87171" anchorX="center">
            NO MATCH
          </Text>
        </group>
      )}
      {hasMatch && (
        <>
          <mesh ref={beam}>
            <cylinderGeometry args={[0.05, 0.05, 2.4, 12]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
          </mesh>
          <points ref={flow}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[flowPos, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#34d399" size={0.05} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
          </points>
        </>
      )}
      <Text
      font={FONT} position={[0, 1.7, 0]} fontSize={0.22} color="#e879f9" anchorX="center" outlineWidth={0.005} outlineColor="#04060e">
        IMAGE SIMILARITY ANALYSIS
      </Text>
      <Text
      font={FONT} position={[0, -1.85, 0]} fontSize={0.11} color="#64748b" anchorX="center">
        similarity of pictures ≠ identity of a person
      </Text>
    </group>
  )
}
