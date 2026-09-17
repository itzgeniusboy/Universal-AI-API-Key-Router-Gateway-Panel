import React, { useEffect, useRef } from 'react';

/**
 * Interactive 3D Canvas element with subtle floating frosted glass prisms & geometric planes.
 * Follows the design language:
 * - Deep graphite/charcoal tones
 * - Subtle ambient light, low opacity reflections
 * - Mouse parallax tilt
 * - NO loud neon glow
 */
export const ThreeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / width - 0.5) * 2;
      targetMouseY = ((e.clientY - rect.top) / height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 3D Nodes representing abstract floating glass geometric facets
    interface Node3D {
      x: number;
      y: number;
      z: number;
      size: number;
      rx: number;
      ry: number;
      rz: number;
      speedX: number;
      speedY: number;
      speedZ: number;
      rotSpeedX: number;
      rotSpeedY: number;
      shape: 'cube' | 'octa' | 'plane';
      opacity: number;
    }

    const nodes: Node3D[] = [
      { x: -280, y: -90, z: 200, size: 48, rx: 0.2, ry: 0.4, rz: 0.1, speedX: 0.2, speedY: -0.15, speedZ: 0.1, rotSpeedX: 0.003, rotSpeedY: 0.004, shape: 'plane', opacity: 0.14 },
      { x: 320, y: -120, z: 150, size: 56, rx: 0.8, ry: 0.2, rz: 0.5, speedX: -0.15, speedY: 0.2, speedZ: -0.1, rotSpeedX: -0.002, rotSpeedY: 0.003, shape: 'cube', opacity: 0.12 },
      { x: -180, y: 140, z: 120, size: 40, rx: 0.4, ry: 0.7, rz: 0.2, speedX: 0.18, speedY: 0.12, speedZ: 0.05, rotSpeedX: 0.004, rotSpeedY: -0.002, shape: 'octa', opacity: 0.15 },
      { x: 260, y: 130, z: 180, size: 52, rx: 0.5, ry: 0.3, rz: 0.8, speedX: -0.12, speedY: -0.18, speedZ: 0.08, rotSpeedX: 0.002, rotSpeedY: 0.004, shape: 'plane', opacity: 0.13 },
      { x: 0, y: -160, z: 240, size: 64, rx: 0.1, ry: 0.9, rz: 0.3, speedX: 0.1, speedY: 0.08, speedZ: -0.12, rotSpeedX: -0.003, rotSpeedY: 0.002, shape: 'octa', opacity: 0.16 },
      { x: -340, y: 30, z: 300, size: 36, rx: 0.7, ry: 0.1, rz: 0.4, speedX: 0.14, speedY: -0.1, speedZ: 0.06, rotSpeedX: 0.003, rotSpeedY: 0.003, shape: 'cube', opacity: 0.1 },
      { x: 380, y: 10, z: 220, size: 44, rx: 0.3, ry: 0.6, rz: 0.2, speedX: -0.1, speedY: 0.15, speedZ: -0.08, rotSpeedX: -0.002, rotSpeedY: -0.003, shape: 'plane', opacity: 0.12 },
    ];

    // Background ambient particles
    const particles = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600,
      z: Math.random() * 400 + 50,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.3 + 0.1,
    }));

    const render = () => {
      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const fov = 450;
      const centerX = width / 2 + mouseX * 40;
      const centerY = height / 2 + mouseY * 30;

      // Draw subtle ambient particles
      for (const p of particles) {
        p.z -= 0.25;
        if (p.z < 20) p.z = 450;

        const scale = fov / (fov + p.z);
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, p.radius * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160, 175, 210, ${p.alpha * scale * 0.8})`;
          ctx.fill();
        }
      }

      // Draw 3D geometric shapes
      for (const node of nodes) {
        // Update rotations
        node.rx += node.rotSpeedX;
        node.ry += node.rotSpeedY;

        // Hover movement
        node.x += node.speedX;
        node.y += node.speedY;

        if (Math.abs(node.x) > 420) node.speedX *= -1;
        if (Math.abs(node.y) > 220) node.speedY *= -1;

        const scale = fov / (fov + node.z);
        const scrX = centerX + node.x * scale;
        const scrY = centerY + node.y * scale;

        ctx.save();
        ctx.translate(scrX, scrY);
        ctx.scale(scale, scale);

        // Subtle glass outline & soft tinted fill (indigo/slate tones)
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${node.opacity})`;
        ctx.fillStyle = `rgba(91, 108, 255, ${node.opacity * 0.22})`;

        if (node.shape === 'plane') {
          // Floating tilted glass card
          const w = node.size * 1.6;
          const h = node.size * 1.0;
          const cosY = Math.cos(node.ry);
          const sinY = Math.sin(node.ry);

          ctx.beginPath();
          ctx.moveTo(-w / 2 * cosY, -h / 2 + sinY * 10);
          ctx.lineTo(w / 2 * cosY, -h / 2 - sinY * 10);
          ctx.lineTo(w / 2 * cosY, h / 2 - sinY * 10);
          ctx.lineTo(-w / 2 * cosY, h / 2 + sinY * 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Internal subtle refraction accent line
          ctx.beginPath();
          ctx.moveTo(-w / 3 * cosY, -h / 4);
          ctx.lineTo(w / 3 * cosY, -h / 4);
          ctx.strokeStyle = `rgba(255, 255, 255, ${node.opacity * 0.5})`;
          ctx.stroke();
        } else if (node.shape === 'cube') {
          // Glass cube projection
          const s = node.size;
          const cos = Math.cos(node.ry);
          const sin = Math.sin(node.rx);

          ctx.beginPath();
          ctx.rect(-s / 2 * cos, -s / 2 * sin, s * cos, s * sin);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.rect(-s / 3 * cos, -s / 3 * sin, s * cos, s * sin);
          ctx.strokeStyle = `rgba(255, 255, 255, ${node.opacity * 0.4})`;
          ctx.stroke();
        } else {
          // Octahedron facet
          const s = node.size;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.8, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60"
    />
  );
};
