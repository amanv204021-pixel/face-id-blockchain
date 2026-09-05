import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line, Text } from '@react-three/drei'
import { FONT } from './font'

const NODES: { label: string; pos: [number, number, number] }[] = [
  { label: 'WEB', pos: [2.6, 0.9, 0.4] },
  { label: 'IMAGE INDEX', pos: [-2.5, 0.4, 0.9] },
  { label: 'PUBLIC SOURCES', pos: [1.9, -1.2, 1.2] },
  { label: 'DEMO FIXTURES', pos: [-1.7, 1.5, -0.6] },
]

/** Rotating digital globe with search arcs + labeled nodes. */
export default function Globe({ active }: { active: boolean }) {
  const globe = useRef<THREE.Group>(null!)
  const pulses = useRef<THREE.Group>(null!)

  const arcs = useMemo(() => {
    const target = new THREE.Vector3(0, 0, 0)
    return NODES.map((n) => {
      const start = new THREE.Vector3(0, 0, 0)
      const end = new THREE.Vector3(...n.pos).multiplyScalar(0.92)
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.4)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      void target
      return { curve, label: n.label }
    })
  }, [])

  const cityPoints = useMemo(() => {
    const N = 90
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(1.62)
      pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z
    }
    return pos
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (globe.current) globe.current.rotation.y += dt * 0.22
    if (pulses.current) {
      pulses.current.children.forEach((c, i) => {
        const tt = (t * (0.28 + i * 0.05) + i * 0.3) % 1
        const p = arcs[i % arcs.length].curve.getPoint(tt)
        c.position.copy(p)
        const s = 0.7 + Math.sin(tt * Math.PI) * 1.1
        c.scale.setScalar(active ? s : s * 0.5)
      })
    }
  })

  return (
    <group>
      <group ref={globe}>
        <mesh>
          <sphereGeometry args={[1.6, 26, 18]} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.16} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.58, 32, 32]} />
          <meshBasicMaterial color="#04060e" transparent opacity={0.85} />
        </mesh>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cityPoints, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#34d399" size={0.045} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.05, 0.004, 8, 100]} />
          <meshBasicMaterial color="#e879f9" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {arcs.map((a, i) => (
        <Line key={i} points={a.curve.getPoints(40)} color={i % 2 ? '#e879f9' : '#22d3ee'} lineWidth={1.1} transparent opacity={0.4} />
      ))}

      <group ref={pulses}>
        {arcs.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshBasicMaterial color="#34d399" blending={THREE.AdditiveBlending} transparent opacity={0.95} />
          </mesh>
        ))}
      </group>

      {NODES.map((n, i) => (
        <group key={i} position={n.pos}>
          <mesh>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color="#e879f9" blending={THREE.AdditiveBlending} transparent opacity={0.9} />
          </mesh>
          <Text
      font={FONT} position={[0, 0.24, 0]} fontSize={0.13} color="#a5f3fc" anchorX="center" outlineWidth={0.004} outlineColor="#04060e">
            {n.label}
          </Text>
        </group>
      ))}
    </group>
  )
}
