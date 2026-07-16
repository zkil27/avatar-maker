import React, { useRef, useEffect, useState } from 'react';

export default function Badge3D({ textureUrl, badgeHue = 0 }) {
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(true);
  const rafRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  if (!textureUrl) return null;

  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      if (!isDragging.current) {
        if (autoRotateRef.current) {
          // Auto-rotate horizontally
          rotationRef.current.y += 60 * delta; // 60 degrees per second
        }
        
        // Apply velocity decay from drag release
        if (Math.abs(velocityRef.current.x) > 0.1 || Math.abs(velocityRef.current.y) > 0.1) {
          rotationRef.current.x += velocityRef.current.x * delta;
          rotationRef.current.y += velocityRef.current.y * delta;
          velocityRef.current.x *= 0.95;
          velocityRef.current.y *= 0.95;
        }
        
        // Clamp X rotation
        rotationRef.current.x = Math.max(-60, Math.min(60, rotationRef.current.x));
      }
      
      setRotation({ ...rotationRef.current });
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Mouse/touch handlers for orbit control
  const handlePointerDown = (e) => {
    isDragging.current = true;
    autoRotateRef.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    rotationRef.current.y += dx * 0.5;
    rotationRef.current.x += dy * 0.3;
    rotationRef.current.x = Math.max(-60, Math.min(60, rotationRef.current.x));
    velocityRef.current = { x: dy * 15, y: dx * 15 };
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    // Resume auto-rotate after 2 seconds of no interaction
    setTimeout(() => {
      if (!isDragging.current) autoRotateRef.current = true;
    }, 2000);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        cursor: 'grab',
        perspective: '800px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${-rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging.current ? 'none' : undefined,
        }}
      >
        {/* Front face */}
        <img
          src={textureUrl}
          alt="Badge front"
          draggable={false}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(9px)',
            userSelect: 'none',
          }}
        />
        {/* Back face */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(9px)',
            background: `linear-gradient(135deg, hsl(calc(94 + ${badgeHue || 0}), 24%, 10%), hsl(calc(94 + ${badgeHue || 0}), 24%, 17%))`,
            userSelect: 'none',
          }}
        />
        {/* Thick edge — stack of layers from -8px to +8px */}
        {Array.from({ length: 17 }, (_, i) => {
          const z = -8 + i;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: i % 2 === 0 
                  ? `hsl(calc(94 + ${badgeHue || 0}), 24%, 17%)` 
                  : `hsl(calc(100 + ${badgeHue || 0}), 26%, 23%)`,
                transform: `translateZ(${z}px)`,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
