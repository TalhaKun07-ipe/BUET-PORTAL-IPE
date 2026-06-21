'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";
import { Canvas } from "@react-three/fiber"
import { ShaderPlane, EnergyRing } from "@/components/ui/background-paper-shaders"
 
export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] md:h-[600px] bg-black/[0.96] border border-white/5 relative overflow-hidden rounded-[2.5rem] shadow-2xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="#BA0E24"
      />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Left content */}
        <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-none tracking-tighter uppercase">
            Industrial & <br />
            Production Engineering
          </h1>
        </div>

        {/* Right content */}
        <div className="flex-1 relative w-full h-[250px] md:h-full min-h-[250px] flex items-center justify-center">
          {/* Animated 3D Shader Background behind the robot */}
          <div className="absolute inset-0 z-0 opacity-35 pointer-events-none blur-md">
            <Canvas camera={{ position: [0, 0, 2] }}>
              <ambientLight intensity={1.5} />
              <ShaderPlane position={[0, 0, -0.5]} color1="#ffffff" color2="#cccccc" />
            </Canvas>
          </div>

          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full relative z-10"
          />
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
