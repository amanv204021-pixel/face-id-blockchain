import { useEffect } from 'react'
import { useStore } from '../store'

/** Global hotkeys: F = run full pipeline · R = reset · A = architecture · Esc = close overlays. */
export function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      const s = useStore.getState()
      switch (e.key.toLowerCase()) {
        case 'f': if (!s.busy && s.phase === 'pipeline') s.runFullPipeline(); break
        case 'r': if (s.phase === 'pipeline') s.reset(); break
        case 'a': s.set({ showArch: !s.showArch }); break
        case 'escape': s.set({ showArch: false, inspecting: null }); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
