'use client';
import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type SpotlightProps = {
  className?: string;
  size?: number;
  fill?: string;
};

export function Spotlight({
  className,
  size = 350,
  fill = '#BA0E24',
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    // Ensure parent is styled correctly for absolute positioning
    parent.style.position = 'relative';
    parent.style.overflow = 'hidden';

    const handleMouseMove = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      setPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseenter', handleMouseEnter);
    parent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseenter', handleMouseEnter);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Format colors based on fill prop.
  // We use opacity value of 40% (66 in hex) for center and 12% (22 in hex) for mid-glow.
  // This makes the flashlight glow highly visible on pure dark backgrounds.
  const gradientStyle = {
    width: size,
    height: size,
    left: `${position.x - size / 2}px`,
    top: `${position.y - size / 2}px`,
    backgroundImage: `radial-gradient(circle at center, ${fill}66 0%, ${fill}22 40%, transparent 75%)`,
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute rounded-full blur-2xl transition-opacity duration-300 ease-out will-change-[left,top] z-30',
        isHovered ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={gradientStyle}
    />
  );
}
