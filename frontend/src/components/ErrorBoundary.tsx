import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

/** Keeps the HUD alive if the WebGL/3D layer ever throws. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D layer error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="glass pointer-events-auto max-w-md rounded-xl p-6 text-center">
            <div className="text-2xl text-amber-300">⚠ 3D ENGINE UNAVAILABLE</div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
              WebGL could not start on this device/GPU. The backend pipeline still works —
              try another browser or enable hardware acceleration.
            </p>
            <p className="hash-font mt-2 text-[10px] text-slate-600">{this.state.error.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
