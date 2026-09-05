import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text, Edges } from '@react-three/drei'
import { FONT } from './font'

interface BlockInfo { n: number; hash: string; ts: string; current: boolean }

/** 3D blockchain — glass blocks chained by glowing links; the new one pulses. */
export default function ChainBlocks({ txHash, blockNumber, timestamp, stage }: {
  txHash: string
  blockNumber: number
  timestamp: string
  stage: 'active' | 'done'
}) {
  const group = useRef<THREE.Group>(null!)
  const pulse = useRef<THREE.Mesh>(null!)

  const blocks: BlockInfo[] = useMemo(() => {
    const out: BlockInfo[] = []
    const total = Math.max(blockNumber, 1)
    for (let i = Math.max(1, total - 3); i <= total; i++) {
      out.push({
        n: i,
        hash: (txHash || '').slice(2 + (total - i) * 5, 2 + (total - i) * 5 + 12).toUpperCase() || '————',
        ts: i === total ? timestamp : '',
        current: i === total,
      })
    }
    return out
  }, [txHash, blockNumber, timestamp])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.6) * 0.08
      group.current.rotation.y = Math.sin(t * 0.15) * 0.06
    }
    if (pulse.current) {
      const s = 1 + Math.sin(t * (stage === 'active' ? 5 : 2)) * 0.06
      pulse.current.scale.setScalar(s)
    }
    void dt
  })

  return (
    <group ref={group} position={[-((blocks.length - 1) * 2.3) / 2, 0, 0]}>
      {blocks.map((b, i) => {
        const x = i * 2.3
        const isCurrent = b.current
        return (
          <group key={b.n} position={[x, i % 2 ? 0.12 : -0.06, 0]}>
            <mesh ref={isCurrent ? pulse : undefined}>
              <RoundedBox args={[1.9, 1.25, 0.4]} radius={0.07} smoothness={4}>
                <meshBasicMaterial color={isCurrent ? '#e879f9' : '#22d3ee'} transparent opacity={isCurrent ? 0.16 : 0.1} />
              </RoundedBox>
            </mesh>
            <RoundedBox args={[1.9, 1.25, 0.4]} radius={0.07} smoothness={4}>
              <meshBasicMaterial visible={false} />
              <Edges color={isCurrent ? '#e879f9' : '#22d3ee'} scale={1.01} />
            </RoundedBox>
            <Text
      font={FONT} position={[0, 0.34, 0.22]} fontSize={0.13} color={isCurrent ? '#e879f9' : '#a5f3fc'} anchorX="center">
              {`BLOCK #${String(b.n).padStart(3, '0')}`}
            </Text>
            <Text
      font={FONT} position={[0, 0.05, 0.22]} fontSize={0.105} color="#34d399" anchorX="center" maxWidth={1.7} clipRect={[-0.9, -0.2, 0.9, 0.12]}>
              {b.hash}
            </Text>
            <Text
      font={FONT} position={[0, -0.3, 0.22]} fontSize={0.09} color="#64748b" anchorX="center" maxWidth={1.7}>
              {isCurrent ? (stage === 'done' ? 'STATUS: VERIFIED' : 'ANCHORING…') : 'LINKED'}
            </Text>
            {i < blocks.length - 1 && (
              <group position={[1.15, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <torusGeometry args={[0.14, 0.03, 8, 18]} />
                  <meshBasicMaterial color="#22d3ee" transparent opacity={0.85} />
                </mesh>
              </group>
            )}
          </group>
        )
      })}
      <Text
      font={FONT} position={[0, -1.35, 0]} fontSize={0.13} color="#64748b" anchorX="center">
        {txHash ? `TX ${txHash.slice(0, 22)}…` : ''}
      </Text>
    </group>
  )
}
