import React, { useRef, useEffect } from 'react';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export function WrenchGear() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = 320;
    let height = canvas.height = 320;

    const resizeCanvas = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 50);

    // Animation variables
    let state: 'idle' | 'approaching' | 'tightening' | 'success' | 'backing_off' | 'spinning' = 'idle';
    let timer = 0;
    
    // Gear params
    const gear = {
      x: 0,
      y: 0,
      radius: 65,
      innerRadius: 50,
      teeth: 18,
      angle: 0,
      speed: 0.005, // Ambient slow speed
    };

    // Nut params (fits the wrench jaw)
    const nut = {
      size: 16,
      angle: 0,
    };

    // Wrench params
    const wrench = {
      x: -150,
      y: -150,
      angle: 0,
      size: 20,
    };

    const sparks: Spark[] = [];

    const emitSparks = (x: number, y: number) => {
      const count = 20 + Math.floor(Math.random() * 10);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 3.5;
        const maxLife = 40 + Math.floor(Math.random() * 30);
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.2 + Math.random() * 2.2,
          color: Math.random() > 0.4 ? '#C9A84C' : '#BA0E24', // Gold and Signal Red spark accents
          life: maxLife,
          maxLife,
        });
      }
    };

    const drawWrenchShape = (x: number, y: number, angle: number, size: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Shadow glow for the wrench to look premium
      ctx.shadowColor = 'rgba(201, 168, 76, 0.4)';
      ctx.shadowBlur = 8;

      // Chrome styling
      ctx.strokeStyle = '#C9A84C';
      ctx.fillStyle = 'rgba(201, 168, 76, 0.18)';
      ctx.lineWidth = 1.6;

      // Handle (extends outwards to the top-right)
      ctx.beginPath();
      // We draw the handle along the negative X-axis and round it
      ctx.roundRect(-size * 5.0, -size * 0.26, size * 4.4, size * 0.52, size * 0.1);
      ctx.fill();
      ctx.stroke();

      // Outer wrench jaw head
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Open jaw cutout (hexagonal wrench jaw)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      
      // Cutout facing positive X-axis (towards the center of rotation)
      const jawWidth = size * 0.58;
      const jawDepth = size * 0.9;
      ctx.moveTo(-size * 0.2, -jawWidth);
      ctx.lineTo(jawDepth, -jawWidth);
      ctx.lineTo(jawDepth, jawWidth);
      ctx.lineTo(-size * 0.2, jawWidth);
      
      // Draw hex cutout in the back
      const hexA = Math.PI / 6; // 30 deg
      ctx.lineTo(-size * 0.2 - Math.cos(hexA) * jawWidth * 0.5, jawWidth * 0.5);
      ctx.lineTo(-size * 0.2 - Math.cos(hexA) * jawWidth * 0.5, -jawWidth * 0.5);
      ctx.closePath();
      ctx.fill();

      // Draw jaw stroke
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(jawDepth * 0.85, -jawWidth);
      ctx.lineTo(-size * 0.15, -jawWidth);
      ctx.lineTo(-size * 0.15 - Math.cos(hexA) * jawWidth * 0.5, -jawWidth * 0.5);
      ctx.lineTo(-size * 0.15 - Math.cos(hexA) * jawWidth * 0.5, jawWidth * 0.5);
      ctx.lineTo(-size * 0.15, jawWidth);
      ctx.lineTo(jawDepth * 0.85, jawWidth);
      ctx.stroke();

      // Detail hole in the handle end
      ctx.beginPath();
      ctx.arc(-size * 4.5, 0, size * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#0D0D12';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    const drawGearShape = (x: number, y: number, rOut: number, rIn: number, teeth: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Glow on the gear
      ctx.shadowColor = 'rgba(201, 168, 76, 0.2)';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      const numPoints = teeth * 2;
      const delta = Math.PI / teeth;

      for (let i = 0; i < numPoints; i++) {
        const isOuter = i % 2 === 0;
        const r = isOuter ? rOut : rIn;
        const angleOffset = isOuter ? -0.015 : 0.015;
        const a = i * delta + angleOffset;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#C9A84C';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Hollow spokey gear details
      ctx.globalCompositeOperation = 'destination-out';
      const spokeCutoutRadius = rIn * 0.26;
      const spokeCenterDist = rIn * 0.62;
      const spokes = 5;
      for (let s = 0; s < spokes; s++) {
        const sa = (s * Math.PI * 2) / spokes;
        ctx.beginPath();
        ctx.arc(
          Math.cos(sa) * spokeCenterDist,
          Math.sin(sa) * spokeCenterDist,
          spokeCutoutRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Center hole cutout (makes space for the hex nut)
      ctx.beginPath();
      ctx.arc(0, 0, rIn * 0.44, 0, Math.PI * 2);
      ctx.fill();

      // Reset composite for central elements
      ctx.globalCompositeOperation = 'source-over';

      // Draw gear hub outline
      ctx.beginPath();
      ctx.arc(0, 0, rIn * 0.42, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
      ctx.stroke();

      ctx.restore();
    };

    const drawHexNutShape = (x: number, y: number, size: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.beginPath();
      const sides = 6;
      const delta = (Math.PI * 2) / sides;
      for (let i = 0; i < sides; i++) {
        const a = i * delta;
        const px = Math.cos(a) * size;
        const py = Math.sin(a) * size;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = '#C9A84C';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Thread detail inside nut
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0D0D12';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    const update = () => {
      timer++;
      gear.x = width / 2;
      gear.y = height / 2;

      // Sparks animation update
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.02; // Spark gravity
        s.life--;
        if (s.life <= 0) sparks.splice(i, 1);
      }

      // STATE MACHINE
      if (state === 'idle') {
        // Gear spins slowly
        gear.angle += gear.speed;
        nut.angle = gear.angle;

        // Position wrench far off-screen
        wrench.x = width + 100;
        wrench.y = -100;
        wrench.angle = -Math.PI / 4; // Slanted

        // Start approach after 1.3 seconds
        if (timer > 80) {
          state = 'approaching';
          timer = 0;
        }
      }

      else if (state === 'approaching') {
        // Ambient spinning
        gear.angle += gear.speed;
        nut.angle = gear.angle;

        // Smoothly glide wrench to hover just above the gear nut
        // Target: Center of gear (width/2, height/2)
        // Wrench angle matches the current nut angle, tilted so jaw fits
        const targetAngle = nut.angle + Math.PI; // jaw faces center

        const targetX = gear.x + Math.cos(targetAngle) * 5;
        const targetY = gear.y + Math.sin(targetAngle) * 5;

        wrench.x += (targetX - wrench.x) * 0.14;
        wrench.y += (targetY - wrench.y) * 0.14;
        
        // Wrap angle difference to shortest path
        let angleDiff = targetAngle - wrench.angle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        wrench.angle += angleDiff * 0.14;

        const dist = Math.sqrt((targetX - wrench.x) ** 2 + (targetY - wrench.y) ** 2);
        if (dist < 2.0 && Math.abs(angleDiff) < 0.05) {
          // Engaged!
          wrench.x = targetX;
          wrench.y = targetY;
          wrench.angle = targetAngle;
          state = 'tightening';
          timer = 0;
        }
      }

      else if (state === 'tightening') {
        // Turn wrench and gear together by 45 degrees (0.8 rad)
        const totalTightenAngle = 0.8;
        const duration = 50; // frames (0.83 seconds)
        const progress = Math.min(timer / duration, 1.0);
        
        // Smooth sine ease in-out
        const easeProgress = Math.sin((progress * Math.PI) / 2);
        
        // Spin the wrench and gear/nut together
        const startAngle = wrench.angle - easeProgress * totalTightenAngle;
        
        // Save rotation
        const currentTurn = easeProgress * totalTightenAngle;
        wrench.angle = startAngle;
        
        // Gear turns in matching direction
        gear.angle += 0.005; // Keep background speed going
        nut.angle = gear.angle + currentTurn;
        wrench.angle = nut.angle + Math.PI;

        // Keep wrench locked to center nut coordinates
        wrench.x = gear.x + Math.cos(wrench.angle) * 2;
        wrench.y = gear.y + Math.sin(wrench.angle) * 2;

        if (progress >= 1.0) {
          state = 'success';
          timer = 0;
          
          // Align final angle parameters
          gear.angle = nut.angle;
        }
      }

      else if (state === 'success') {
        // Emit sparks on tightening completion!
        emitSparks(gear.x, gear.y);
        state = 'spinning';
        timer = 0;
        
        // Give gear high speed boost
        gear.speed = 0.12;
      }

      else if (state === 'spinning') {
        // Gear spins fast, slowly decelerating back to normal
        gear.angle += gear.speed;
        nut.angle = gear.angle;
        gear.speed += (0.005 - gear.speed) * 0.035;

        // Back wrench off-screen
        const escapeAngle = wrench.angle - Math.PI / 4;
        const targetWrenchX = gear.x + Math.cos(escapeAngle) * 300;
        const targetWrenchY = gear.y + Math.sin(escapeAngle) * 300;

        wrench.x += (targetWrenchX - wrench.x) * 0.10;
        wrench.y += (targetWrenchY - wrench.y) * 0.10;
        wrench.angle += 0.02;

        if (timer > 150) {
          state = 'idle';
          timer = 0;
          gear.speed = 0.005; // Lock back to idle speed
        }
      }
    };

    const draw = () => {
      // Clear canvas with dark obsidian
      ctx.fillStyle = '#0D0D12';
      ctx.fillRect(0, 0, width, height);

      // Technical blueprint grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw faint crosshair alignment guides
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.03)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width / 2 - 100, height / 2);
      ctx.lineTo(width / 2 + 100, height / 2);
      ctx.moveTo(width / 2, height / 2 - 100);
      ctx.lineTo(width / 2, height / 2 + 100);
      ctx.stroke();

      // Render Gear Shape
      drawGearShape(gear.x, gear.y, gear.radius, gear.innerRadius, gear.teeth, gear.angle);

      // Render central hex nut
      drawHexNutShape(gear.x, gear.y, nut.size, nut.angle);

      // Render Wrench (only when visible / approaching / tightening / backing_off)
      if (state !== 'idle' || wrench.x < width + 80) {
        drawWrenchShape(wrench.x, wrench.y, wrench.angle, wrench.size);
      }

      // Render Sparks particles
      for (const s of sparks) {
        ctx.save();
        const alpha = s.life / s.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Status text indicator (subtle details for premium editorial look)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      const statusLabel = 
        state === 'idle' ? 'SYSTEM DIAGNOSTIC' :
        state === 'approaching' ? 'ALIGNING REPAIR INTERFACE' :
        state === 'tightening' ? 'ENGAGING TORQUE CALIBRATION' :
        state === 'success' ? 'SYSTEM ONLINE' :
        state === 'spinning' ? 'COMPILING TELEMETRY DATA' : 'DIAGNOSTIC';
      ctx.fillText(statusLabel, width / 2, height - 16);
    };

    const tick = () => {
      update();
      draw();
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[220px] max-h-[300px] flex items-center justify-center relative select-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full border border-white/5 rounded-[2rem] bg-black/40" />
    </div>
  );
}
