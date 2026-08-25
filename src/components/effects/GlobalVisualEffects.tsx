import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';

export const GlobalVisualEffects: React.FC = () => {
  const { settings } = useStore();
  const effects = settings.effects || {};
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse trail state for glowCursor
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // Check if any canvas particle effect is enabled
  const hasCanvasEffect =
    effects.snow ||
    effects.cherryBlossom ||
    effects.neonParticles ||
    effects.sparkles ||
    effects.shootingStars ||
    effects.matrixRain;

  // Particle Density Multiplier
  const densityMultiplier =
    effects.particleDensity === 'high' ? 1.5 : effects.particleDensity === 'low' ? 0.5 : 1.0;

  // Canvas animation loop
  useEffect(() => {
    if (!hasCanvasEffect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle Classes
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      rotation?: number;
      rotationSpeed?: number;
      color?: string;
      char?: string;
    }

    const particles: Particle[] = [];

    // 1. Sakura Petals
    if (effects.cherryBlossom) {
      const count = Math.floor(25 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 8 + 6,
          speedX: Math.random() * 1.5 + 0.5,
          speedY: Math.random() * 1.5 + 0.8,
          opacity: Math.random() * 0.5 + 0.4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2,
          color: '#FFB7C5',
        });
      }
    }

    // 2. Snow
    if (effects.snow) {
      const count = Math.floor(45 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 3 + 1.5,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: Math.random() * 1.2 + 0.6,
          opacity: Math.random() * 0.6 + 0.3,
          color: '#FFFFFF',
        });
      }
    }

    // 3. Neon Particles
    if (effects.neonParticles) {
      const count = Math.floor(30 * densityMultiplier);
      const colors = ['#06B6D4', '#7C3AED', '#C084FC', '#22D3EE', '#F43F5E'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.6,
          speedY: -(Math.random() * 1 + 0.4), // float upwards
          opacity: Math.random() * 0.7 + 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    // 4. Sparkles / Stars
    if (effects.sparkles) {
      const count = Math.floor(25 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.5 + 1,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.8 + 0.2,
          color: '#FDE047',
        });
      }
    }

    // 5. Matrix Rain Characters
    const matrixChars = '0123456789ABCDEFTHAN0X';
    if (effects.matrixRain) {
      const count = Math.floor(30 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 6 + 10,
          speedX: 0,
          speedY: Math.random() * 2.5 + 2,
          opacity: Math.random() * 0.6 + 0.3,
          color: '#10B981',
          char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
        });
      }
    }

    // Shooting Stars Queue
    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
      life: number;
    }
    const shootingStars: ShootingStar[] = [];

    let lastStarTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render shooting stars
      if (effects.shootingStars) {
        if (Date.now() - lastStarTime > 2500 && shootingStars.length < 3) {
          lastStarTime = Date.now();
          shootingStars.push({
            x: Math.random() * width * 0.8,
            y: Math.random() * height * 0.4,
            length: Math.random() * 80 + 50,
            speed: Math.random() * 12 + 10,
            angle: Math.PI / 4,
            opacity: 1,
            life: 1,
          });
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const star = shootingStars[i];
          star.x += Math.cos(star.angle) * star.speed;
          star.y += Math.sin(star.angle) * star.speed;
          star.life -= 0.02;

          if (star.life <= 0 || star.x > width || star.y > height) {
            shootingStars.splice(i, 1);
            continue;
          }

          const tailX = star.x - Math.cos(star.angle) * star.length;
          const tailY = star.y - Math.sin(star.angle) * star.length;

          const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
          grad.addColorStop(1, `rgba(255, 255, 255, ${star.life})`);

          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.x, star.y);
          ctx.stroke();
        }
      }

      // Render standard particles
      for (const p of particles) {
        // Update positions
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          p.rotation += p.rotationSpeed;
        }

        // Loop boundaries
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        } else if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        else if (p.x < -20) p.x = width + 20;

        // Draw particle based on type
        if (p.char) {
          // Matrix Rain
          ctx.font = `${p.size}px monospace`;
          ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
          ctx.fillText(p.char, p.x, p.y);
          if (Math.random() < 0.05) {
            p.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          }
        } else if (p.rotation !== undefined) {
          // Sakura Petal
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 183, 197, ${p.opacity})`;
          ctx.shadowColor = '#FF69B4';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.restore();
        } else {
          // Dot / Snowflake / Embers
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color || '#FFFFFF';
          ctx.globalAlpha = p.opacity;
          if (effects.neonParticles) {
            ctx.shadowColor = p.color || '#06B6D4';
            ctx.shadowBlur = 8;
          }
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [hasCanvasEffect, effects, densityMultiplier]);

  // Glow Cursor Listener
  useEffect(() => {
    if (!effects.glowCursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e: MouseEvent) => {
      const newRipple = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev.slice(-5), newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 700);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [effects.glowCursor]);

  return (
    <>
      {/* 1. Canvas Layer for Particles */}
      {hasCanvasEffect && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-500"
          style={{ width: '100vw', height: '100vh' }}
        />
      )}

      {/* 2. RGB Rainbow Border Glow Effect */}
      {effects.rgbBorder && (
        <div className="fixed inset-0 pointer-events-none z-40 rgb-rainbow-border" />
      )}

      {/* 3. Cyber Neon Glow Cursor Trail */}
      {effects.glowCursor && cursorPos && (
        <div
          className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${cursorPos.x - 12}px, ${cursorPos.y - 12}px)`,
          }}
        >
          <div className="w-6 h-6 rounded-full bg-cyan-400/30 border border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse" />
        </div>
      )}

      {/* 4. Click Ripple Rings */}
      {effects.glowCursor &&
        ripples.map((rip) => (
          <div
            key={rip.id}
            className="fixed pointer-events-none z-50 w-10 h-10 rounded-full border-2 border-[#C084FC] shadow-[0_0_20px_#7C3AED] animate-ping"
            style={{
              left: rip.x - 20,
              top: rip.y - 20,
              animationDuration: '600ms',
            }}
          />
        ))}
    </>
  );
};
