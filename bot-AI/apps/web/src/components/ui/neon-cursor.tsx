'use client';

import { useEffect, useRef } from 'react';

export function NeonCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on mobile / touch devices
    if (window.matchMedia('(max-width: 768px), (hover: none)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let rafId: number;

    // Move dot immediately with mouse
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';

      spawnTrail(mouseX, mouseY);
    };

    // Animate ring with lerp (smooth lag)
    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      rafId = requestAnimationFrame(animateRing);
    };
    rafId = requestAnimationFrame(animateRing);

    // Spawn single trail particle
    let trailThrottle = 0;
    const spawnTrail = (x: number, y: number) => {
      const now = Date.now();
      if (now - trailThrottle < 40) return; // throttle to ~25/s
      trailThrottle = now;

      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.left = x + 'px';
      trail.style.top = y + 'px';
      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 600);
    };

    // Hover effect on interactive elements
    const interactiveSelectors = 'a, button, input, textarea, select, [role="button"], label';
    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(interactiveSelectors)) {
        document.body.classList.add('cursor-hover');
      }
    };
    const onMouseOut = (e: MouseEvent) => {
      if ((e.target as Element).closest(interactiveSelectors)) {
        document.body.classList.remove('cursor-hover');
      }
    };

    // Click ripple effect
    const onMouseDown = (e: MouseEvent) => {
      dot.classList.add('clicking');
      setTimeout(() => dot.classList.remove('clicking'), 300);

      const ripple = document.createElement('div');
      ripple.className = 'cursor-click-effect';
      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('mousedown', onMouseDown);
      document.body.classList.remove('cursor-hover');
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
