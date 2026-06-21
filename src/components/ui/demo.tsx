'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";
import { Canvas } from "@react-three/fiber"
import { ShaderPlane, EnergyRing } from "@/components/ui/background-paper-shaders"
 
import { useState, useEffect } from "react";
 
export function SplineSceneBasic() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <Card className="w-full h-[400px] md:h-[600px] bg-black/[0.96] border border-white/5 relative overflow-hidden rounded-[2.5rem] shadow-2xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="#BA0E24"
      />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Left content */}
        <div className="flex-1 p-6 md:p-12 relative z-10 flex flex-col justify-center space-y-4 md:space-y-6">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-none tracking-tighter uppercase">
            Industrial & <br />
            Production Engineering
          </h1>
        </div>
 
        {/* Right content */}
        <div className="flex-1 relative w-full h-[180px] md:h-full min-h-[180px] flex items-center justify-center">
          {/* Animated 3D Shader Background behind the robot */}
          <div className="absolute inset-0 z-0 opacity-35 pointer-events-none blur-md">
            <Canvas camera={{ position: [0, 0, 2] }}>
              <ambientLight intensity={1.5} />
              <ShaderPlane position={[0, 0, -0.5]} color1="#ffffff" color2="#cccccc" />
            </Canvas>
          </div>
 
          {!isMobile ? (
            <SplineScene 
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full relative z-10"
            />
          ) : (
            // Lightweight beautiful replacement on mobile
            <div className="w-full h-full relative z-10 flex items-center justify-center p-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Tech target outline rings */}
                <div className="absolute inset-0 rounded-full border border-champagne/20 animate-spin-slow" />
                <div className="absolute -inset-4 rounded-full border border-dashed border-white/10 animate-spin-reverse" />
                <div className="w-16 h-16 rounded-full bg-champagne/10 border border-champagne/30 flex items-center justify-center">
                  <span className="text-2xl animate-pulse">⚙️</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

const Default = () => {
  return <SmokeBackground />;
};

const Customized = () => {
  return <SmokeBackground smokeColor="#FF0000" />;
};

export { Default, Customized };
