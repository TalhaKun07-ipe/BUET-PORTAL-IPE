# Gemini Template Reference & Component Recipes

This document outlines the design tokens, layout patterns, and component recipes implemented in the **BUET Student Portal** project. It serves as a high-fidelity blueprint for future templates.

---

## 1. Core Architecture & Design Tokens

### Aesthetic Direction: "Midnight Luxe" (Dark Editorial)
* **Identity**: Premium dashboard/editorial feel with high-contrast accent highlights.
* **Color Palette (Tailwind / Vanilla CSS)**:
  * **Obsidian**: `#0D0D12` (Base dark backgrounds)
  * **Slate Dark**: `#121217` / `#0d0d12` (Cards and surface panels)
  * **Champagne**: `#C9A84C` (Primary metallic accent, status metrics)
  * **Ivory**: `#FAF8F5` (High-contrast text & light mode widgets)
  * **Signal Red**: `#BA0E24` (Focus highlights, hover states, errors)
* **Typography**:
  * Headings: Sans-serif (e.g., *Inter*, *Outfit*) with tight tracking.
  * Emphasis/Drama: High-contrast serif italic (e.g., *Playfair Display*).
  * Data/Code: Monospace (e.g., *JetBrains Mono*, *Fira Code*).

### Global Noise Overlay
To eliminate flat digital gradients, apply an overlay using an inline SVG turbulence filter:
```html
<!-- Inject into the root app layout container -->
<div className="noise-overlay" />
```
```css
/* Styling in index.css */
.noise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  content: "";
  opacity: 0.05;
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}
```

---

## 2. Advanced React Component Recipes

### A. Vanilla Mouse-Tracking Spotlight (Flashlight Effect)
A lightweight cursor-tracking flashlight container that is fully React 19/Vite HMR compatible, bypassing hooks context issues common in standard animation packages:

```tsx
import React, { useRef, useState, useEffect } from 'react';

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
}

export function Spotlight({ children, className = "" }: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    const el = containerRef.current;
    if (el) {
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (el) {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300 z-30"
        style={{
          opacity,
          background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, rgba(186,14,36,0.15), transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}
```

### B. Fault-Tolerant Spline 3D Scene Wrapper
To prevent the application from crashing when a WebGL scene fails to load (e.g., due to network issues, missing browser assets, or WebGL context failures), wrap lazy Spline components in a React Error Boundary:

```tsx
import React, { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class SplineErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Spline load failure caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/40 p-8 text-center font-mono">
          <span className="text-red-500 font-bold uppercase tracking-widest text-xs mb-2">/ 3D Telemetry Link Offline</span>
          <span className="text-[10px] text-white/40">Fallback scene render active. WebGL context unavailable.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className = "" }: SplineSceneProps) {
  return (
    <SplineErrorBoundary>
      <Suspense 
        fallback={
          <div className="w-full h-full flex items-center justify-center min-h-[300px]">
            <div className="w-6 h-6 border-2 border-champagne border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Spl scene={scene} className={className} />
      </Suspense>
    </SplineErrorBoundary>
  );
}
```

---

## 3. Layout and Animation Strategies

### A. Window Scroll vs. Inner Scroll
> [!IMPORTANT]
> When implementing sticky stacking scroll elements (like cards using GSAP `ScrollTrigger` pin properties), **never** set `overflow-y-auto` or `overflow-y-scroll` on the `<main>` layout container.
> GSAP tracks the window scrolling offset by default. Restricting overflow on parent wrappers causes the window scroller to report `0` offset, breaking dynamic pinning calculations and causing layout lag. Keep `<main>` free of internal scroll boundaries:
> ```jsx
> <main className="flex-1 md:pl-72 pb-16 md:pb-0">
> ```

### B. Shared-State React Pattern
Lifting all user-editable states (`notices`, `attachments`, `schedule`) to the root element (`App()`) allows real-time data sync across sub-pages and dashboard elements. For high performance:
1. Initialize states as empty collections (`[]`) to support blank dashboard presets.
2. In dashboard card list renders, check the lengths of filtered collections to show clean database placeholder messages:
```javascript
{displayNotices.length > 0 ? (
  displayNotices.map(notice => <NoticeCard key={notice.id} notice={notice} />)
) : (
  <EmptyPlaceholder label="No notices posted in database." />
)}
```

---

## 4. GSAP Stacking Cards Setup

Standard CSS sticky cards can behave inconsistently across browsers. Use GSAP's timeline wrapper to pin full-screen stacking layouts:

```javascript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Inside layout component:
useEffect(() => {
  let ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * 2.5}`,
        pin: true,
        scrub: 1.2,
        anticipatePin: 1
      }
    });

    // Animate panels stacking sequentially
    tl.fromTo(card2.current, { yPercent: 100, scale: 0.95 }, { yPercent: 0, scale: 1, ease: 'none' });
    tl.to(card1.current, { scale: 0.9, opacity: 0.4, filter: 'blur(10px)', ease: 'none' }, '<');

    tl.fromTo(card3.current, { yPercent: 100, scale: 0.95 }, { yPercent: 0, scale: 1, ease: 'none' });
    tl.to(card2.current, { scale: 0.9, opacity: 0.4, filter: 'blur(10px)', ease: 'none' }, '<');
  });

  return () => ctx.revert();
}, []);
```
