import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { StageId } from '../types'

const TARGETS: Record<StageId, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
  upload: { pos: new THREE.Vector3(0, 0.3, 6.4), look: new THREE.Vector3(0, 0, 0) },
  detect: { pos: new THREE.Vector3(0.4, 0.2, 5.2), look: new THREE.Vector3(0, 0, 0) },
  encode: { pos: new THREE.Vector3(0, 0.9, 5.4), look: new THREE.Vector3(0, 0, 0) },
  search: { pos: new THREE.Vector3(0, 1.4, 7.2), look: new THREE.Vector3(0, 0, 0) },
  match:  { pos: new THREE.Vector3(0, 0.3, 6.2), look: new THREE.Vector3(0, 0, 0) },
  hash:   { pos: new THREE.Vector3(0.6, 0.6, 5.6), look: new THREE.Vector3(0, 0, 0) },
  chain:  { pos: new THREE.Vector3(1.6, 1.1, 6.6), look: new THREE.Vector3(0.4, 0, 0) },
  verify: { pos: new THREE.Vector3(0, 0.3, 5.2), look: new THREE.Vector3(0, -0.2, 0) },
}

const INTRO = { pos: new THREE.Vector3(0, 0.4, 6.8), look: new THREE.Vector3(0, 0, 0) }

/** Smooth cinematic camera rig — glides between pipeline stages. */
export default function CameraRig({ stage, phase }: { stage: StageId; phase: string }) {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0, 0, 0))
  const target = useRef(INTRO)

  useFrame((state, dt) => {
    if (phase === 'intro') {
      target.current = INTRO
    } else {
      target.current = TARGETS[stage] ?? INTRO
    }
    const k = 1 - Math.exp(-dt * 2.2)
    camera.position.lerp(target.current.pos, k)
    look.current.lerp(target.current.look, k)
    camera.lookAt(look.current)
    // gentle orbital drift
    const t = state.clock.elapsedTime
    camera.position.x += Math.sin(t * 0.23) * 0.002
    camera.position.y += Math.cos(t * 0.17) * 0.0015
  })
  return null
}
