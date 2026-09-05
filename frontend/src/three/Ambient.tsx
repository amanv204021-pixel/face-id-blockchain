import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/** Ambient cyber-lab atmosphere: starfield + rising data motes + reflection grid. */
export default function Ambient() {
  const stars = useRef<THREE.Points>(null!)
  const motes = useRef<THREE.Points>(null!)
  const grid = useRef<THREE.GridHelper>(null!)

  const { starPos, motePos } = useMemo(() => {
    const S = 700
    const starPos = new Float32Array(S * 3)
    for (let i = 0; i < S; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(24 + Math.random() * 26)
      starPos[i * 3] = v.x; starPos[i * 3 + 1] = v.y * 0.6; starPos[i * 3 + 2] = v.z
    }
    const M = 180
    const motePos = new Float32Array(M * 3)
    for (let i = 0; i < M; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 18
      motePos[i * 3 + 1] = Math.random() * 8 - 2
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 18
    }
    return { starPos, motePos }
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (stars.current) stars.current.rotation.y += dt * 0.006
    if (motes.current) {
      motes.current.rotation.y -= dt * 0.01
      const arr = (motes.current.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += dt * 0.25
        if (arr[i] > 6) arr[i] = -2
      }
      ;(motes.current.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    }
    if (grid.current) (grid.current.material as THREE.Material).opacity = 0.1 + Math.sin(t * 0.5) * 0.02
  })

  return (
    <group>
      <points ref={stars}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#67e8f9" size={0.05} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <points ref={motes}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[motePos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#e879f9" size={0.06} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <gridHelper ref={grid} args={[60, 60, '#155e75', '#0e7490']} position={[0, -3.2, 0]} />
      <fog attach="fog" args={['#04060e', 18, 46]} />
    </group>
  )
}
