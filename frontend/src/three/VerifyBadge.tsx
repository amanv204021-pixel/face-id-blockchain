import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { FONT } from './font'

/** Dramatic VERIFIED / MISMATCH result badge. */
export default function VerifyBadge({ status }: { status: string }) {
  const ring = useRef<THREE.Group>(null!)
  const check = useRef<THREE.Group>(null!)
  const waves = useRef<THREE.Group>(null!)
  const ok = status === 'VERIFIED'
  const color = ok ? '#34d399' : status === 'HASH_MISMATCH' ? '#f87171' : '#fbbf24'

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (ring.current) ring.current.rotation.z += dt * 0.5
    if (check.current) {
      const s = 1 + Math.sin(t * 3) * 0.06
      check.current.scale.setScalar(s)
    }
    if (waves.current) {
      waves.current.children.forEach((c, i) => {
        const tt = (t * 0.5 + i * 0.33) % 1
        c.scale.setScalar(1 + tt * 2.4)
        const m = ((c as THREE.Mesh).material as THREE.MeshBasicMaterial)
        m.opacity = 0.5 * (1 - tt)
      })
    }
  })

  return (
    <group>
      <group ref={waves}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <torusGeometry args={[1.15, 0.015, 8, 80]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
      <group ref={ring}>
        <mesh>
          <torusGeometry args={[1.15, 0.03, 12, 90]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh rotation={[0, 0, 0.5]}>
          <torusGeometry args={[1.32, 0.006, 8, 90, Math.PI * 1.3]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      </group>
      <group ref={check}>
        {status === 'VERIFIED' ? (
          <>
            <mesh rotation={[0, 0, 0.65]} position={[-0.16, -0.1, 0]}>
              <boxGeometry args={[0.62, 0.11, 0.06]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <mesh rotation={[0, 0, -0.95]} position={[0.22, 0.14, 0]}>
              <boxGeometry args={[1.0, 0.11, 0.06]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          </>
        ) : (
          <Text
      font={FONT} fontSize={1.1} color={color} anchorX="center" anchorY="middle">
            {status === 'HASH_MISMATCH' ? '!' : '?'}
          </Text>
        )}
      </group>
      <Text
      font={FONT} position={[0, -1.9, 0]} fontSize={0.3} color={color} anchorX="center" outlineWidth={0.008} outlineColor="#04060e">
        {ok ? 'RECORD VERIFIED' : status === 'HASH_MISMATCH' ? 'HASH MISMATCH' : 'CHECKING…'}
      </Text>
      <Text
      font={FONT} position={[0, -2.35, 0]} fontSize={0.13} color="#94a3b8" anchorX="center">
        {ok ? 'DATA INTEGRITY CONFIRMED — NO DETECTED MODIFICATION'
            : status === 'HASH_MISMATCH' ? 'RECORD MAY HAVE BEEN MODIFIED' : 'recomputing canonical hash…'}
      </Text>
    </group>
  )
}
