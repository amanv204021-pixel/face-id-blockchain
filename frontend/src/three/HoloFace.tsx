import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'

/** Procedural holographic human-face silhouette (no textures, no assets). */
export function headPoints(count: number): Float32Array {
  const pos = new Float32Array(count * 3)
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const th = phi * i
    // deform sphere into a head/face silhouette
    let x = Math.cos(th) * r
    let z = Math.sin(th) * r
    // flatten back of head slightly, push face forward
    z = z * 0.86 + (z > 0 ? 0.1 : 0)
    // widen cheeks slightly so the silhouette reads as a head, not an egg
    x *= 0.82
    // jaw taper
    const taper = y < -0.15 ? 1 - (-y - 0.15) * 0.42 : 1
    x *= taper
    z *= taper
    // chin pull
    if (y < -0.72) z += (y + 0.72) * 0.22
    pos[i * 3] = x * 0.78
    pos[i * 3 + 1] = y * 0.98
    pos[i * 3 + 2] = z * 0.78
  }
  return pos
}

const LANDMARKS: [number, number, number][] = [
  [-0.28, 0.18, 0.62], // left eye
  [0.28, 0.18, 0.62],  // right eye
  [0, -0.05, 0.74],    // nose
  [-0.16, -0.32, 0.6], // mouth L
  [0.16, -0.32, 0.6],  // mouth R
  [0, -0.8, 0.42],     // chin
]

export default function HoloFace({ scanActive = true, color = '#22d3ee', scale = 1 }: { scanActive?: boolean; color?: string; scale?: number }) {
  const group = useRef<THREE.Group>(null!)
  const ring1 = useRef<THREE.Mesh>(null!)
  const ring2 = useRef<THREE.Mesh>(null!)
  const ring3 = useRef<THREE.Mesh>(null!)
  const laser = useRef<THREE.Mesh>(null!)
  const pts = useRef<THREE.Points>(null!)

  const positions = useMemo(() => headPoints(1400), [])
  const lmLine = useMemo(() => ({
    points: LANDMARKS.map((p) => new THREE.Vector3(...p)),
    color,
  }), [color])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.24) * 0.42
      group.current.position.y = Math.sin(t * 0.8) * 0.05
    }
    if (ring1.current) ring1.current.rotation.z += dt * 0.9
    if (ring2.current) ring2.current.rotation.z -= dt * 0.6
    if (ring3.current) ring3.current.rotation.z += dt * 0.35
    if (laser.current && scanActive) {
      laser.current.position.y = Math.sin(t * 1.4) * 0.95
      const m = laser.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.12 + Math.sin(t * 8) * 0.04
    }
    if (pts.current) {
      const m = pts.current.material as THREE.PointsMaterial
      m.size = 0.018 + Math.sin(t * 3) * 0.005
    }
  })

  return (
    <group ref={group} scale={scale}>
      {/* wireframe head */}
      <mesh scale={[0.78, 1.0, 0.8]}>
        <sphereGeometry args={[1, 28, 22]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.14} />
      </mesh>
      {/* point cloud skin */}
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.02} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      {/* landmarks */}
      {LANDMARKS.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color="#e879f9" blending={THREE.AdditiveBlending} transparent opacity={0.95} />
        </mesh>
      ))}
      <Line points={lmLine.points} color="#e879f9" lineWidth={1.2} transparent opacity={0.6} />
      {/* scanning rings */}
      <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.006, 8, 90]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2.4, 0.4, 0]}>
        <torusGeometry args={[1.42, 0.004, 8, 90]} />
        <meshBasicMaterial color="#e879f9" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring3} rotation={[Math.PI / 1.8, -0.5, 0]}>
        <torusGeometry args={[1.6, 0.003, 8, 90]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* laser sweep plane — subtle scan sheet */}
      <mesh ref={laser} position={[0, 0, 0]}>
        <boxGeometry args={[1.7, 0.012, 1.7]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* core glow */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#e879f9" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}
