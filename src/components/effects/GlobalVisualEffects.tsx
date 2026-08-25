import React, { useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';

export const GlobalVisualEffects: React.FC = () => {
  const { settings } = useStore();
  const effects = settings.effects || {};
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check if any visual effect is active
  const hasCanvasEffect =
    effects.snow ||
    effects.cherryBlossom ||
    effects.neonParticles ||
    effects.sparkles ||
    effects.shootingStars ||
    effects.matrixRain ||
    effects.glowCursor;

  // Particle Density Multiplier
  const densityMultiplier =
    effects.particleDensity === 'high' ? 1.5 : effects.particleDensity === 'low' ? 0.5 : 1.0;

  // High-performance 60-120 FPS Animation Loop (Zero React State Lag)
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
    window.addEventListener('resize', handleResize, { passive: true });

    // Mouse tracking in memory (prevents React re-render lag)
    const mousePos = { x: -100, y: -100, targetX: -100, targetY: -100, isOver: false };
    const ripples: Array<{ x: number; y: number; radius: number; opacity: number }> = [];

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.targetX = e.clientX;
      mousePos.targetY = e.clientY;
      mousePos.isOver = true;
    };

    const handleMouseLeave = () => {
      mousePos.isOver = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (effects.glowCursor) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 2,
          opacity: 1,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });

    // Particle Structure
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      baseSpeedY: number;
      swayAmp: number;
      swaySpeed: number;
      seed: number;
      opacity: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
      char?: string;
    }

    const particles: Particle[] = [];

    // 1. SAKURA PETALS (Silky smooth 3D flutter & gentle wind)
    if (effects.cherryBlossom) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 6 + 5,
          speedX: Math.random() * 0.8 + 0.3,
          speedY: Math.random() * 1.0 + 0.6,
          baseSpeedY: Math.random() * 1.0 + 0.6,
          swayAmp: Math.random() * 1.2 + 0.6,
          swaySpeed: Math.random() * 0.002 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.4 + 0.45,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 1.5,
          color: '#FFB7C5',
        });
      }
    }

    // 2. SOFT SNOWFLAKES (Continuous gentle snowfall)
    if (effects.snow) {
      const count = Math.floor(55 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.5 + 1.2,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: Math.random() * 0.9 + 0.4,
          baseSpeedY: Math.random() * 0.9 + 0.4,
          swayAmp: Math.random() * 0.8 + 0.3,
          swaySpeed: Math.random() * 0.0015 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.5 + 0.3,
          rotation: 0,
          rotationSpeed: 0,
          color: '#FFFFFF',
        });
      }
    }

    // 3. NEON CYBER PARTICLES (Continuous upward floating embers with glow)
    if (effects.neonParticles) {
      const count = Math.floor(40 * densityMultiplier);
      const colors = ['#06B6D4', '#7C3AED', '#C084FC', '#22D3EE', '#F43F5E', '#10B981'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.5 + 1,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: -(Math.random() * 0.8 + 0.3),
          baseSpeedY: -(Math.random() * 0.8 + 0.3),
          swayAmp: Math.random() * 0.6 + 0.2,
          swaySpeed: Math.random() * 0.002 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.6 + 0.3,
          rotation: 0,
          rotationSpeed: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    // 4. SPARKLES / TWINKLING STARS
    if (effects.sparkles) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.15,
          baseSpeedY: 0,
          swayAmp: 0.2,
          swaySpeed: 0.002,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.7 + 0.2,
          rotation: 0,
          rotationSpeed: 0,
          color: '#FDE047',
        });
      }
    }

    // 5. MATRIX DIGITAL RAIN (Endless streams)
    const matrixChars = '0123456789ABCDEFTHAN0XVIP';
    if (effects.matrixRain) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 4 + 11,
          speedX: 0,
          speedY: Math.random() * 1.8 + 1.4,
          baseSpeedY: Math.random() * 1.8 + 1.4,
          swayAmp: 0,
          swaySpeed: 0,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.6 + 0.3,
          rotation: 0,
          rotationSpeed: 0,
          color: '#10B981',
          char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
        });
      }
    }

    // 6. SHOOTING STARS
    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      life: number;
      maxLife: number;
    }
    const shootingStars: ShootingStar[] = [];
    let lastStarTime = performance.now();

    // Delta-time loop variables
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 16.667, 2.0);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // A. Smooth Mouse Position Interpolation (Lerp for silky cursor glow)
      if (effects.glowCursor && mousePos.isOver) {
        mousePos.x += (mousePos.targetX - mousePos.x) * 0.2 * delta;
        mousePos.y += (mousePos.targetY - mousePos.y) * 0.2 * delta;

        // Render Cursor Glow Aura
        const glowGrad = ctx.createRadialGradient(
          mousePos.x,
          mousePos.y,
          0,
          mousePos.x,
          mousePos.y,
          35
        );
        glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        glowGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.15)');
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 35, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Inner Sharp Dot
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#22D3EE';
        ctx.shadowColor = '#06B6D4';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // B. Render Click Ripples
      if (effects.glowCursor) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.radius += 2.5 * delta;
          r.opacity -= 0.03 * delta;

          if (r.opacity <= 0 || r.radius > 50) {
            ripples.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(192, 132, 252, ${r.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#7C3AED';
          ctx.shadowBlur = 6;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // C. Render Shooting Stars
      if (effects.shootingStars) {
        if (currentTime - lastStarTime > 2800 && shootingStars.length < 2) {
          lastStarTime = currentTime;
          shootingStars.push({
            x: Math.random() * (width * 0.7) + 50,
            y: Math.random() * (height * 0.35),
            length: Math.random() * 70 + 40,
            speed: Math.random() * 8 + 7,
            angle: Math.PI / 4,
            life: 1.0,
            maxLife: 1.0,
          });
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const star = shootingStars[i];
          star.x += Math.cos(star.angle) * star.speed * delta;
          star.y += Math.sin(star.angle) * star.speed * delta;
          star.life -= 0.015 * delta;

          if (star.life <= 0 || star.x > width || star.y > height) {
            shootingStars.splice(i, 1);
            continue;
          }

          const tailX = star.x - Math.cos(star.angle) * star.length;
          const tailY = star.y - Math.sin(star.angle) * star.length;

          const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
          grad.addColorStop(0.7, `rgba(124, 58, 237, ${star.life * 0.5})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${star.life})`);

          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.x, star.y);
          ctx.stroke();
        }
      }

      // D. Render All Continuous Flowing Particles
      for (const p of particles) {
        // Continuous Sinusoidal Drift (Zero stutter)
        const sway = Math.sin(currentTime * p.swaySpeed + p.seed) * p.swayAmp;
        p.x += (p.speedX + sway) * delta;
        p.y += p.speedY * delta;

        if (p.rotationSpeed !== 0) {
          p.rotation += p.rotationSpeed * delta;
        }

        // Seamless Boundary Wrapping (No clumped resets)
        if (p.speedY > 0 && p.y > height + 25) {
          p.y = -25;
          p.x = Math.random() * width;
        } else if (p.speedY < 0 && p.y < -25) {
          p.y = height + 25;
          p.x = Math.random() * width;
        }

        if (p.x > width + 25) p.x = -25;
        else if (p.x < -25) p.x = width + 25;

        // Draw particle by type
        if (p.char) {
          // Matrix Rain
          ctx.font = `${p.size}px monospace`;
          ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
          ctx.fillText(p.char, p.x, p.y);
          if (Math.random() < 0.03) {
            p.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          }
        } else if (p.rotationSpeed !== 0) {
          // Sakura Petal Flutter
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 183, 197, ${p.opacity})`;
          ctx.shadowColor = '#FF69B4';
          ctx.shadowBlur = 3;
          ctx.fill();
          ctx.restore();
        } else {
          // Glowing Orbs / Snowflakes / Embers
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;

          if (effects.neonParticles) {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
          }

          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, [hasCanvasEffect, effects, densityMultiplier]);

  return (
    <>
      {/* 1. Unified 60-120 FPS Canvas Layer */}
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
    </>
  );
};
