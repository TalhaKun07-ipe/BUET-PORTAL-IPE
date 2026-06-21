import React from 'react';

interface GearShapeProps {
  radius: number;
  innerRadius: number;
  teeth: number;
  color: string;
  strokeColor: string;
  spokes?: number;
  className?: string;
  style?: React.CSSProperties;
}

const GearShape = ({
  radius,
  innerRadius,
  teeth,
  color,
  strokeColor,
  spokes = 4,
  className = "",
  style
}: GearShapeProps) => {
  const delta = 360 / teeth;
  const teethElements = [];
  
  // Base width and top width of tooth based on innerRadius
  const baseW = innerRadius * 0.22;
  const topW = innerRadius * 0.13;
  const hBase = -innerRadius;
  const hTop = -radius;

  for (let i = 0; i < teeth; i++) {
    const angle = i * delta;
    teethElements.push(
      <polygon
        key={i}
        points={`${-baseW/2},${hBase} ${-topW/2},${hTop} ${topW/2},${hTop} ${baseW/2},${hBase}`}
        transform={`rotate(${angle})`}
        fill={strokeColor}
      />
    );
  }

  // Draw spokes
  const spokeElements = [];
  if (spokes > 0) {
    const spokeAngle = 360 / spokes;
    const spokeW = innerRadius * 0.15;
    for (let i = 0; i < spokes; i++) {
      const angle = i * spokeAngle;
      spokeElements.push(
        <line
          key={i}
          x1={0}
          y1={0}
          x2={0}
          y2={-innerRadius + 0.8}
          stroke={strokeColor}
          strokeWidth={spokeW}
          strokeLinecap="round"
          transform={`rotate(${angle})`}
        />
      );
    }
  }

  return (
    <g className={className} style={style}>
      {/* Outer teeth */}
      {teethElements}
      {/* Main gear wheel body */}
      <circle r={innerRadius} fill={color} stroke={strokeColor} strokeWidth={1.2} />
      {/* Spokes */}
      {spokeElements}
      {/* Central hole rim */}
      <circle r={innerRadius * 0.32} fill="none" stroke={strokeColor} strokeWidth={0.8} />
      {/* Shaft hole */}
      <circle r={innerRadius * 0.15} fill="#0d0d12" stroke={strokeColor} strokeWidth={1.0} />
    </g>
  );
};

export function GearClock() {
  return (
    <div className="relative w-56 h-56 flex items-center justify-center select-none">
      <svg 
        className="w-full h-full fill-none stroke-current" 
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @keyframes spin-cw {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes spin-ccw {
              from { transform: rotate(0deg); }
              to { transform: rotate(-360deg); }
            }
            
            .g-main {
              animation: spin-cw 24s linear infinite;
              transform-origin: 0px 0px;
            }
            .g-left {
              animation: spin-ccw 18s linear infinite;
              transform-origin: 0px 0px;
            }
            .g-bottom {
              animation: spin-ccw 12s linear infinite;
              transform-origin: 0px 0px;
            }
            .g-hand {
              animation: spin-cw 8s linear infinite;
              transform-origin: 0px 0px;
            }
            .g-pulse-ring {
              animation: pulse-ring 4s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
              transform-origin: 50px 50px;
            }
            
            @keyframes pulse-ring {
              0% { r: 5px; opacity: 0.8; stroke-width: 0.5px; }
              50% { r: 12px; opacity: 0.3; stroke-width: 0.8px; }
              100% { r: 20px; opacity: 0; stroke-width: 0.1px; }
            }
          `}</style>
        </defs>

        {/* Outer technical dial rings */}
        <circle cx="50" cy="50" r="46" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" strokeDasharray="1 3" />
        <circle cx="50" cy="50" r="44" stroke="rgba(201, 168, 76, 0.08)" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="41" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.5" strokeDasharray="6 3" />

        {/* Quadrant grid tick markers */}
        <path d="M 50 2 L 50 6 M 50 94 L 50 98 M 2 50 L 6 50 M 94 50 L 98 50" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 16 16 L 19 19 M 81 81 L 84 84 M 16 84 L 19 81 M 81 16 L 84 19" stroke="rgba(201, 168, 76, 0.25)" strokeWidth="0.8" strokeLinecap="round" />

        {/* Dynamic pulsing core glow */}
        <circle cx="50" cy="50" r="12" stroke="#C9A84C" strokeWidth="0.5" className="g-pulse-ring" />

        {/* Gear 1: Central Driver (Gold/Champagne, 16 teeth, radius 22, inner 16.5) */}
        <g transform="translate(50, 50)">
          <GearShape
            radius={22}
            innerRadius={16.5}
            teeth={16}
            color="rgba(201, 168, 76, 0.08)"
            strokeColor="#C9A84C"
            spokes={4}
            className="g-main"
          />
        </g>

        {/* Gear 2: Left follower (Slate/Cream, 12 teeth, radius 17, inner 12) */}
        <g transform="translate(12.2, 50) rotate(15)">
          <GearShape
            radius={17}
            innerRadius={12}
            teeth={12}
            color="rgba(242, 230, 201, 0.04)"
            strokeColor="rgba(242, 230, 201, 0.6)"
            spokes={3}
            className="g-left"
          />
        </g>

        {/* Gear 3: Bottom follower (Ivory/Grey, 8 teeth, radius 12, inner 8) */}
        <g transform="translate(50, 82.8) rotate(22.5)">
          <GearShape
            radius={12}
            innerRadius={8}
            teeth={8}
            color="rgba(255, 255, 255, 0.02)"
            strokeColor="rgba(255, 255, 255, 0.45)"
            spokes={0}
            className="g-bottom"
          />
        </g>

        {/* Central Scheduling Hand & Indicators */}
        <g transform="translate(50, 50)">
          <g className="g-hand">
            <line x1="0" y1="0" x2="0" y2="-15" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round" />
            <polygon points="0,-18 -1.5,-15 1.5,-15" fill="#C9A84C" />
            <line x1="0" y1="0" x2="12" y2="0" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="0.8" strokeLinecap="round" />
          </g>
        </g>

        {/* Center core cap */}
        <circle cx="50" cy="50" r="2.2" fill="#C9A84C" />
        <circle cx="50" cy="50" r="0.8" fill="#0d0d12" />
      </svg>
    </div>
  );
}
