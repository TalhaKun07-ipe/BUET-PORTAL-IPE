'use client'

import React, { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SplineErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Spline load error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const fallbackUI = (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-2xl p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-[#BA0E24]/10 flex items-center justify-center text-[#BA0E24] border border-[#BA0E24]/20">
        <span className="text-xl animate-spin-slow">⚙️</span>
      </div>
      <div className="space-y-1">
        <p className="font-sans font-bold text-xs text-white uppercase tracking-wider">3D Telemetry Offline</p>
        <p className="font-mono text-[9px] text-neutral-500">WebGL context or scene asset unavailable</p>
      </div>
    </div>
  );

  return (
    <SplineErrorBoundary fallback={fallbackUI}>
      <Suspense 
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="loader"></span>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
        />
      </Suspense>
    </SplineErrorBoundary>
  )
}
