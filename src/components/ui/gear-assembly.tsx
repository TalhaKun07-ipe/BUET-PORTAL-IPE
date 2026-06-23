import { useRef, useEffect } from 'react';

interface Gear {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  innerRadius: number;
  teeth: number;
  angle: number;
  speed: number;
  color: string;
  strokeColor: string;
  state: 'floating' | 'approaching' | 'locked' | 'decoupling' | 'disappearing';
  parent: Gear | null;
  targetX?: number;
  targetY?: number;
  lockAngleStart?: number;
  parentAngleStart?: number;
  timer: number;
  spokes: number;
  scale?: number;
}

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

export function GearAssembly() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;
    let initialized = false;

    // Set up gears
    let gearIdCounter = 0;
    const gears: Gear[] = [];
    const sparks: Spark[] = [];

    // Center gear is the driver
    const centerGear: Gear = {
      id: gearIdCounter++,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 46,
      innerRadius: 36,
      teeth: 22,
      angle: 0,
      speed: 0.012, // Slow driving speed
      color: 'rgba(201, 168, 76, 0.15)', // Glassy golden center
      strokeColor: '#C9A84C', // Crisp gold outline
      state: 'locked',
      parent: null,
      timer: 0,
      spokes: 5,
    };
    gears.push(centerGear);

    // Gear templates
    const createRandomGear = (x: number, y: number, state: 'floating' | 'locked' = 'floating'): Gear => {
      const teethOptions = [10, 14, 18];
      const teeth = teethOptions[Math.floor(Math.random() * teethOptions.length)];
      
      // Calculate radius matching teeth density (approx 2.1px per tooth radius)
      const innerRadius = teeth * 2.1;
      const radius = innerRadius + 8;
      
      const colors = [
        'rgba(242, 230, 201, 0.12)', // Slate cream
        'rgba(201, 168, 76, 0.1)',   // Semi-transparent champagne
        'rgba(255, 255, 255, 0.06)', // Frost white
      ];
      
      const strokeColors = [
        'rgba(242, 230, 201, 0.7)',  // Ivory
        'rgba(201, 168, 76, 0.75)',  // Champagne
        'rgba(255, 255, 255, 0.55)', // Light grey
      ];

      const colorIdx = Math.floor(Math.random() * colors.length);

      return {
        id: gearIdCounter++,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius,
        innerRadius,
        teeth,
        angle: Math.random() * Math.PI * 2,
        speed: 0,
        color: colors[colorIdx],
        strokeColor: strokeColors[colorIdx],
        state,
        parent: null,
        timer: 0,
        spokes: Math.floor(Math.random() * 2) + 3,
      };
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.width;
      const newHeight = rect.height;
      
      if (newWidth === width && newHeight === height) return;
      
      width = canvas.width = newWidth;
      height = canvas.height = newHeight;
      
      centerGear.x = width / 2;
      centerGear.y = height / 2;

      if (!initialized && width > 0 && height > 0) {
        initialized = true;
        // Pre-populate with 3 gears at nice floating positions surrounding the center gear
        const angles = [0.5, 2.5, 4.5];
        const dists = [95, 105, 115];
        for (let i = 0; i < 3; i++) {
          const gx = width / 2 + Math.cos(angles[i]) * dists[i];
          const gy = height / 2 + Math.sin(angles[i]) * dists[i];
          gears.push(createRandomGear(gx, gy, 'floating'));
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Spark emitter
    const emitSparks = (x: number, y: number) => {
      const count = 12 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        const maxLife = 30 + Math.floor(Math.random() * 20);
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1 + Math.random() * 2,
          color: Math.random() > 0.35 ? '#C9A84C' : '#BA0E24', // Champagne and signal-red sparks
          life: maxLife,
          maxLife,
        });
      }
    };

    const drawGearShape = (
      g: Gear,
      currentAngle: number
    ) => {
      ctx.save();
      ctx.translate(g.x, g.y);
      const currentScale = g.scale ?? 1.0;
      ctx.scale(currentScale, currentScale);
      ctx.globalAlpha = Math.max(0, Math.min(1, currentScale));
      ctx.rotate(currentAngle);

      // Create subtle drop glow for locked active gears
      if (g.state === 'locked') {
        ctx.shadowColor = g.strokeColor;
        ctx.shadowBlur = 6;
      }

      ctx.beginPath();
      const numPoints = g.teeth * 2;
      const delta = Math.PI / g.teeth;

      // Draw outer teeth
      for (let i = 0; i < numPoints; i++) {
        const isOuter = i % 2 === 0;
        const r = isOuter ? g.radius : g.innerRadius;
        
        // Add trapezoidal shape to teeth for realism
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

      // Fill gear body
      ctx.fillStyle = g.color;
      ctx.fill();

      // Stroke gear outline
      ctx.shadowBlur = 0; // Disable shadow for clean stroke lines
      ctx.strokeStyle = g.strokeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Draw spoke cutouts (destructive composite cutout for premium hollow look)
      ctx.globalCompositeOperation = 'destination-out';
      const spokeCutoutRadius = g.innerRadius * 0.22;
      const spokeCenterDist = g.innerRadius * 0.6;
      for (let s = 0; s < g.spokes; s++) {
        const sa = (s * Math.PI * 2) / g.spokes;
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

      // Draw inner hub circle cutout
      ctx.beginPath();
      ctx.arc(0, 0, g.innerRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Return to normal source-over rendering for hub accents
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw hub inner rim
      ctx.beginPath();
      ctx.arc(0, 0, g.innerRadius * 0.32, 0, Math.PI * 2);
      ctx.strokeStyle = g.strokeColor;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Draw shaft hole in center
      ctx.beginPath();
      ctx.arc(0, 0, g.innerRadius * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#0D0D12';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    // Limit gear count and transition oldest to disappearing
    const addGearWithLimit = (newGear: Gear) => {
      const activeGears = gears.filter(g => g.id !== centerGear.id && g.state !== 'disappearing');
      
      // Limit to 5 active non-center gears (6 total)
      if (activeGears.length >= 5) {
        const oldest = activeGears[0];
        if (oldest) {
          oldest.state = 'disappearing';
          oldest.timer = 0;
          oldest.scale = 1.0;
          
          // Decouple children of the disappearing gear
          for (const g of gears) {
            if (g.parent && g.parent.id === oldest.id) {
              g.parent = null;
              g.state = 'decoupling';
              g.timer = 0;
            }
          }
        }
      }
      gears.push(newGear);
    };

    // Click handler to spawn user gears
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Add a gear at clicked point with limit logic
      addGearWithLimit(createRandomGear(clickX, clickY, 'floating'));
    };

    canvas.addEventListener('click', handleCanvasClick);

    // Main loops
    const update = () => {
      // 1. Spawning system (Maintain 5 to 6 gears dynamically)
      const activeCount = gears.filter(g => g.state !== 'disappearing').length;
      if (activeCount < 5 && Math.random() < 0.005) {
        // Spawn at border
        const side = Math.floor(Math.random() * 4);
        let sx = 0, sy = 0;
        if (side === 0) { sx = Math.random() * width; sy = -10; }
        else if (side === 1) { sx = width + 10; sy = Math.random() * height; }
        else if (side === 2) { sx = Math.random() * width; sy = height + 10; }
        else { sx = -10; sy = Math.random() * height; }
        addGearWithLimit(createRandomGear(sx, sy, 'floating'));
      }

      // 2. Update gears (iterating backward to allow splicing)
      for (let i = gears.length - 1; i >= 0; i--) {
        const g = gears[i];
        g.timer++;

        if (g.id === centerGear.id) {
          // Drive center gear
          g.angle += g.speed;
          continue;
        }

        // --- STATE: DISAPPEARING ---
        if (g.state === 'disappearing') {
          g.scale = (g.scale ?? 1.0) - 0.04;
          g.x += g.vx * 0.5;
          g.y += g.vy * 0.5;
          g.angle += 0.005;

          if (g.scale <= 0) {
            gears.splice(i, 1);
          }
          continue;
        }

        // --- STATE: FLOATING ---
        if (g.state === 'floating') {
          // Apply basic drift velocities
          g.x += g.vx;
          g.y += g.vy;
          g.angle += 0.005; // Slow ambient spinning

          // Boundary check (gently bounce off edges)
          const margin = g.radius;
          if (g.x < margin) { g.x = margin; g.vx *= -1; }
          if (g.x > width - margin) { g.x = width - margin; g.vx *= -1; }
          if (g.y < margin) { g.y = margin; g.vy *= -1; }
          if (g.y > height - margin) { g.y = height - margin; g.vy *= -1; }

          // Magnetic attraction: gravitate towards closest locked gear cluster
          let nearestLocked: Gear | null = null;
          let minDist = Infinity;

          for (const other of gears) {
            if (other.state === 'locked') {
              const dx = other.x - g.x;
              const dy = other.y - g.y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < minDist) {
                minDist = d;
                nearestLocked = other;
              }
            }
          }

          if (nearestLocked) {
            const dx = nearestLocked.x - g.x;
            const dy = nearestLocked.y - g.y;
            const targetDist = nearestLocked.radius + g.radius - 2.8; // Tooth overlap mesh

            // If in magnetic pull range (150px)
            if (minDist < 140) {
              const force = 0.035;
              g.vx += (dx / minDist) * force;
              g.vy += (dy / minDist) * force;

              // Apply drag so it snaps cleanly
              g.vx *= 0.94;
              g.vy *= 0.94;

              // Check if extremely close, initiate locking protocol
              if (minDist <= targetDist + 10) {
                g.state = 'approaching';
                g.parent = nearestLocked;
                const phi = Math.atan2(dy, dx);
                g.targetX = nearestLocked.x - Math.cos(phi) * targetDist;
                g.targetY = nearestLocked.y - Math.sin(phi) * targetDist;
                g.timer = 0;
              }
            }
          }
        }

        // --- STATE: APPROACHING ---
        else if (g.state === 'approaching' && g.parent && g.targetX !== undefined && g.targetY !== undefined) {
          // Interpolate to locked center position
          g.x += (g.targetX - g.x) * 0.18;
          g.y += (g.targetY - g.y) * 0.18;

          // Check if distance is sub-pixel, snap in!
          const dx = g.targetX - g.x;
          const dy = g.targetY - g.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 0.8) {
            g.x = g.targetX;
            g.y = g.targetY;
            g.state = 'locked';
            g.timer = 0;

            // Compute math for locked meshed teeth phase
            const phi = Math.atan2(g.y - g.parent.y, g.x - g.parent.x);
            
            // Align gear teeth perfectly relative to parent contact angle
            g.lockAngleStart = phi + Math.PI + Math.PI / g.teeth - (g.parent.angle - phi) * (g.parent.teeth / g.teeth);
            g.parentAngleStart = g.parent.angle;

            // Spawn snapping spark burst
            emitSparks(
              g.parent.x + Math.cos(phi) * g.parent.radius,
              g.parent.y + Math.sin(phi) * g.parent.radius
            );
          }
        }

        // --- STATE: LOCKED ---
        else if (g.state === 'locked' && g.parent && g.lockAngleStart !== undefined && g.parentAngleStart !== undefined) {
          // Tie rotation exactly to the parent gear orientation to avoid numerical drift
          const parentRotationDiff = g.parent.angle - g.parentAngleStart;
          const gearRatio = g.parent.teeth / g.teeth;
          g.angle = g.lockAngleStart - parentRotationDiff * gearRatio;

          // Decouple after 8 seconds to prevent cluster clutter and keep loop dynamic
          if (g.timer > 480) {
            g.state = 'decoupling';
            const pushAngle = Math.atan2(g.y - g.parent.y, g.x - g.parent.x);
            g.vx = Math.cos(pushAngle) * 1.5;
            g.vy = Math.sin(pushAngle) * 1.5;
            g.parent = null;
            g.timer = 0;
          }
        }

        // --- STATE: DECOUPLING ---
        else if (g.state === 'decoupling') {
          // Push away from cluster
          g.x += g.vx;
          g.y += g.vy;
          g.vx *= 0.95;
          g.vy *= 0.95;
          g.angle += 0.01;

          if (g.timer > 30) {
            g.state = 'floating';
            // Give minor float drift
            g.vx = (Math.random() - 0.5) * 0.4;
            g.vy = (Math.random() - 0.5) * 0.4;
          }
        }
      }

      // 3. Update sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.02; // Minor gravity pull on sparks
        s.life--;
        if (s.life <= 0) {
          sparks.splice(i, 1);
        }
      }
    };

    const draw = () => {
      // Solid dark obsidian background matching page aesthetics
      ctx.fillStyle = '#0D0D12';
      ctx.fillRect(0, 0, width, height);

      // Draw a subtle technical blueprint design grid
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

      // Draw faint center alignment crosshair lines
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.04)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width / 2 - 80, height / 2);
      ctx.lineTo(width / 2 + 80, height / 2);
      ctx.moveTo(width / 2, height / 2 - 80);
      ctx.lineTo(width / 2, height / 2 + 80);
      ctx.stroke();

      // Render gears
      for (const g of gears) {
        drawGearShape(g, g.angle);
      }

      // Render sparks
      for (const s of sparks) {
        ctx.save();
        const alpha = s.life / s.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        
        // Dynamic glowing spark effects
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 4;
        
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          // Resume animation loop when scrolling back into view
          tick();
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const tick = () => {
      if (!isVisible) return;
      update();
      draw();
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('click', handleCanvasClick);
      resizeObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative cursor-crosshair select-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full rounded-[2rem]" />
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[9px] font-mono text-white/35 pointer-events-none tracking-widest uppercase bg-black/60 px-2.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
        Click to spawn gear pieces
      </div>
    </div>
  );
}
