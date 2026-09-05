import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing'

export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.32} mipmapBlur radius={0.72} />
      <DepthOfField focusDistance={0.015} focalLength={0.06} bokehScale={2.2} />
      <Vignette eskil={false} offset={0.18} darkness={0.85} />
    </EffectComposer>
  )
}
