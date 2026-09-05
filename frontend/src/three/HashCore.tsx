import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { FONT } from './font'

/** SHA-256 processing core — glyphs orbit, hash materializes above. */
export default function HashCore({ hash, active }: { hash: string; active: boolean }) {
  const g1 = useRef<THREE.Mesh>(null!)
  const g2 = useRef<THREE.Mesh>(null!)
  const glyphs = useRef<THREE.Points>(null!)
  const ring = useRef<THREE.Group>(null!)

  const glyphPos = useMemo(() => {
    const N = 260
    const p = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const r = 1.1 + Math.random() * 1.1
      const a = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 2.2
      p[i * 3] = Math.cos(a) * r
      p[i * 3 + 1] = y
      p[i * 3 + 2] = Math.sin(a) * r
    }
    return p
  }, [])

  const shown = useMemo(() => (hash || '0000000000000000').slice(0, 32).toUpperCase(), [hash])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (g1.current) { g1.current.rotation.x += dt * 0.5; g1.current.rotation.y += dt * 0.7 }
    if (g2.current) { g2.current.rotation.x -= dt * 0.3; g2.current.rotation.z += dt * 0.5 }
    if (glyphs.current) {
      glyphs.current.rotation.y += dt * (active ? 0.5 : 0.2)
      const m = glyphs.current.material as THREE.PointsMaterial
      m.opacity = 0.5 + Math.sin(t * 3) * 0.25
    }
    if (ring.current) ring.current.rotation.y -= dt * 0.4
  })

  return (
    <group>
      <mesh ref={g1}>
        <octahedronGeometry args={[1.05, 0]} />
        <meshBasicMaterial color="#e879f9" wireframe transparent opacity={0.5} />
      </mesh>
      <mesh ref={g2}>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.8} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#e879f9" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
      </mesh>
      <points ref={glyphs}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glyphPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#22d3ee" size={0.04} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <group ref={ring}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 1.7, -1.4, Math.sin(a) * 1.7]}>
              <cylinderGeometry args={[0.012, 0.012, 2.6, 6]} />
              <meshBasicMaterial color="#34d399" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
            </mesh>
          )
        })}
      </group>
      <Text
      font={FONT} position={[0, 2.0, 0]} fontSize={0.24} color="#34d399" anchorX="center" outlineWidth={0.005} outlineColor="#04060e">
        SHA-256
      </Text>
      <Text
      font={FONT} position={[0, 1.55, 0]} fontSize={0.16} color="#a5f3fc" anchorX="center" maxWidth={4} outlineWidth={0.004} outlineColor="#04060e">
        {shown}
      </Text>
    </group>
  )
}
