import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/** Swirling particle galaxy = the face embedding materializing (128-d vector). */
export default function EncodingParticles({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const inner = useRef<THREE.Points>(null!)

  const { diskPos, diskColor, corePos, coreColor, lines } = useMemo(() => {
    const N = 900
    const diskPos = new Float32Array(N * 3)
    const diskColor = new Float32Array(N * 3)
    const c1 = new THREE.Color('#22d3ee')
    const c2 = new THREE.Color('#e879f9')
    for (let i = 0; i < N; i++) {
      const arm = i % 3
      const r = 0.25 + 1.65 * Math.pow(Math.random(), 0.7)
      const a = r * 2.4 + (arm * Math.PI * 2) / 3 + (Math.random() - 0.5) * 0.5
      diskPos[i * 3] = Math.cos(a) * r
      diskPos[i * 3 + 1] = (Math.random() - 0.5) * 0.28 * (1.6 - r * 0.5)
      diskPos[i * 3 + 2] = Math.sin(a) * r
      const c = c1.clone().lerp(c2, Math.min(1, r / 1.9))
      diskColor[i * 3] = c.r; diskColor[i * 3 + 1] = c.g; diskColor[i * 3 + 2] = c.b
    }
    const M = 128 // one point per embedding dimension, inner cluster
    const corePos = new Float32Array(M * 3)
    const coreColor = new Float32Array(M * 3)
    const cg = new THREE.Color('#34d399')
    for (let i = 0; i < M; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.42 + Math.random() * 0.12)
      corePos[i * 3] = v.x; corePos[i * 3 + 1] = v.y; corePos[i * 3 + 2] = v.z
      coreColor[i * 3] = cg.r; coreColor[i * 3 + 1] = cg.g; coreColor[i * 3 + 2] = cg.b
    }
    // connect some core points — neural lattice
    const lp: number[] = []
    for (let i = 0; i < M; i += 2) {
      const j = (i + 7) % M
      lp.push(corePos[i * 3], corePos[i * 3 + 1], corePos[i * 3 + 2])
      lp.push(corePos[j * 3], corePos[j * 3 + 1], corePos[j * 3 + 2])
    }
    return { diskPos, diskColor, corePos, coreColor, lines: new Float32Array(lp) }
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (group.current) group.current.rotation.y += dt * (active ? 0.5 : 0.18)
    if (inner.current) {
      inner.current.rotation.y -= dt * 0.8
      const s = 1 + Math.sin(t * 2.4) * 0.05
      inner.current.scale.setScalar(active ? s : s * 0.9)
    }
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[diskPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[diskColor, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} vertexColors transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <points ref={inner}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[corePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[coreColor, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} vertexColors transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#34d399" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  )
}
