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
    effects.glowCursor ||
    effects.autumnLeaves ||
    effects.fireflies ||
    effects.plexus ||
    effects.volcanoEmbers ||
    effects.cyberRain ||
    effects.bubbles ||
    effects.goldCoins ||
    effects.fireworks ||
    effects.lightning ||
    effects.butterflies;

  // Particle Density Multiplier
  const densityMultiplier =
    effects.particleDensity === 'high' ? 1.5 : effects.particleDensity === 'low' ? 0.5 : 1.0;

  // Unified High-performance 60-120 FPS Canvas Animation Engine
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
    const mousePos = { x: -500, y: -500, targetX: -500, targetY: -500, isOver: false };
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

    // Generic Particle Interface
    interface Particle {
      x: number;
      y: number;
      type: string;
      size: number;
      speedX: number;
      speedY: number;
      swayAmp?: number;
      swaySpeed?: number;
      seed: number;
      opacity: number;
      rotation?: number;
      rotationSpeed?: number;
      color?: string;
      char?: string;
      scaleX?: number;
    }

    const particles: Particle[] = [];

    // 1. SAKURA PETALS (Hoa Đào Bay 3D)
    if (effects.cherryBlossom) {
      const count = Math.floor(30 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'sakura',
          size: Math.random() * 6 + 5,
          speedX: Math.random() * 0.8 + 0.3,
          speedY: Math.random() * 1.0 + 0.6,
          swayAmp: Math.random() * 1.2 + 0.6,
          swaySpeed: Math.random() * 0.002 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.4 + 0.5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 1.5,
        });
      }
    }

    // 2. AUTUMN LEAVES (Lá Phong Rơi Mùa Thu)
    if (effects.autumnLeaves) {
      const count = Math.floor(25 * densityMultiplier);
      const leafColors = ['#EA580C', '#DC2626', '#F59E0B', '#B45309', '#EF4444'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'autumn_leaf',
          size: Math.random() * 8 + 7,
          speedX: Math.random() * 1.2 + 0.4,
          speedY: Math.random() * 1.2 + 0.7,
          swayAmp: Math.random() * 1.8 + 0.8,
          swaySpeed: Math.random() * 0.0025 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.35 + 0.65,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2,
          color: leafColors[Math.floor(Math.random() * leafColors.length)],
        });
      }
    }

    // 3. FIREFLIES (Đom Đóm Đêm Huyền Ảo)
    if (effects.fireflies) {
      const count = Math.floor(35 * densityMultiplier);
      const colors = ['#A3E635', '#FACC15', '#4ADE80', '#38BDF8'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'firefly',
          size: Math.random() * 2.5 + 1.5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          swayAmp: Math.random() * 0.8 + 0.3,
          swaySpeed: Math.random() * 0.003 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.8 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    // 4. PLEXUS CONSTELLATION NODES (Mạng Nơ-ron Tơ Không Gian)
    if (effects.plexus) {
      const count = Math.floor(45 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'plexus_node',
          size: Math.random() * 2 + 1.5,
          speedX: (Math.random() - 0.5) * 0.6,
          speedY: (Math.random() - 0.5) * 0.6,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.5 + 0.4,
          color: '#22D3EE',
        });
      }
    }

    // 5. VOLCANO EMBERS (Tàn Tro Núi Lửa Đỏ Cam)
    if (effects.volcanoEmbers) {
      const count = Math.floor(45 * densityMultiplier);
      const emberColors = ['#FF4500', '#FFA500', '#FF6347', '#FFD700', '#EF4444'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'ember',
          size: Math.random() * 2.5 + 1,
          speedX: (Math.random() - 0.5) * 0.6,
          speedY: -(Math.random() * 1.5 + 0.6), // float up
          swayAmp: Math.random() * 0.8 + 0.2,
          swaySpeed: Math.random() * 0.004 + 0.002,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.7 + 0.3,
          color: emberColors[Math.floor(Math.random() * emberColors.length)],
        });
      }
    }

    // 6. CYBERPUNK RAIN (Mưa Laser Siêu Tốc)
    if (effects.cyberRain) {
      const count = Math.floor(70 * densityMultiplier);
      const rainColors = ['#06B6D4', '#7C3AED', '#38BDF8', '#C084FC'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'cyber_rain',
          size: Math.random() * 20 + 15, // streak length
          speedX: -0.5,
          speedY: Math.random() * 8 + 12,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.5 + 0.3,
          color: rainColors[Math.floor(Math.random() * rainColors.length)],
        });
      }
    }

    // 7. AQUARIUM BUBBLES (Bong Bóng Nước Nổi)
    if (effects.bubbles) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'bubble',
          size: Math.random() * 5 + 3,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: -(Math.random() * 1.0 + 0.5),
          swayAmp: Math.random() * 0.9 + 0.3,
          swaySpeed: Math.random() * 0.003 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.4 + 0.3,
          color: '#38BDF8',
        });
      }
    }

    // 8. GOLD COINS (Mưa Đồng Xu Vàng May Mắn)
    if (effects.goldCoins) {
      const count = Math.floor(25 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'gold_coin',
          size: Math.random() * 6 + 7,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: Math.random() * 1.5 + 1.0,
          swayAmp: 0.6,
          swaySpeed: 0.002,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.3 + 0.7,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 2 + 1,
          scaleX: 1,
        });
      }
    }

    // 9. GLOWING BUTTERFLIES (Bướm Dạ Quang Vỗ Cánh)
    if (effects.butterflies) {
      const count = Math.floor(15 * densityMultiplier);
      const bColors = ['#06B6D4', '#EC4899', '#A855F7', '#38BDF8'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'butterfly',
          size: Math.random() * 5 + 6,
          speedX: Math.random() * 0.8 + 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          swayAmp: Math.random() * 1.5 + 0.8,
          swaySpeed: Math.random() * 0.003 + 0.002,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.3 + 0.7,
          color: bColors[Math.floor(Math.random() * bColors.length)],
        });
      }
    }

    // 10. SNOW (Tuyết Rơi Mùa Đông)
    if (effects.snow) {
      const count = Math.floor(50 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'snow',
          size: Math.random() * 2.5 + 1.2,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: Math.random() * 0.9 + 0.4,
          swayAmp: Math.random() * 0.8 + 0.3,
          swaySpeed: Math.random() * 0.0015 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.5 + 0.3,
          color: '#FFFFFF',
        });
      }
    }

    // 11. NEON PARTICLES (Hạt Neon Bay Lên)
    if (effects.neonParticles) {
      const count = Math.floor(40 * densityMultiplier);
      const colors = ['#06B6D4', '#7C3AED', '#C084FC', '#22D3EE', '#F43F5E'];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'neon',
          size: Math.random() * 2.5 + 1,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: -(Math.random() * 0.8 + 0.3),
          swayAmp: Math.random() * 0.6 + 0.2,
          swaySpeed: Math.random() * 0.002 + 0.001,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.6 + 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    // 12. SPARKLES (Sao Lấp Lánh)
    if (effects.sparkles) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'sparkle',
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.15,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.7 + 0.2,
          color: '#FDE047',
        });
      }
    }

    // 13. MATRIX RAIN
    const matrixChars = '0123456789ABCDEFTHAN0XVIP';
    if (effects.matrixRain) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          type: 'matrix',
          size: Math.random() * 4 + 11,
          speedX: 0,
          speedY: Math.random() * 1.8 + 1.4,
          seed: Math.random() * 1000,
          opacity: Math.random() * 0.6 + 0.3,
          color: '#10B981',
          char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
        });
      }
    }

    // 14. FIREWORKS ENGINE
    interface FireworkSpark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      decay: number;
    }
    const fireworkSparks: FireworkSpark[] = [];
    let lastFireworkTime = performance.now();

    const spawnFirework = () => {
      const burstX = Math.random() * (width * 0.8) + width * 0.1;
      const burstY = Math.random() * (height * 0.45) + 50;
      const colors = ['#EC4899', '#06B6D4', '#EAB308', '#A855F7', '#10B981', '#F97316'];
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      const sparkCount = 35;

      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.2;
        const speed = Math.random() * 3.5 + 1.5;
        fireworkSparks.push({
          x: burstX,
          y: burstY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: chosenColor,
          alpha: 1.0,
          decay: Math.random() * 0.015 + 0.012,
        });
      }
    };

    // 15. CYBER LIGHTNING ENGINE
    let lightningTimer = performance.now();
    let currentLightning: Array<{ x1: number; y1: number; x2: number; y2: number }> | null = null;
    let lightningOpacity = 0;

    const spawnLightning = () => {
      const startX = Math.random() * (width * 0.8) + width * 0.1;
      let curX = startX;
      let curY = 0;
      const segments = [];
      while (curY < height * 0.65) {
        const nextX = curX + (Math.random() - 0.5) * 45;
        const nextY = curY + Math.random() * 35 + 15;
        segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
        curX = nextX;
        curY = nextY;
      }
      currentLightning = segments;
      lightningOpacity = 1.0;
    };

    // 16. SHOOTING STARS ENGINE
    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      life: number;
    }
    const shootingStars: ShootingStar[] = [];
    let lastStarTime = performance.now();

    // Delta-Time Animation Loop
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 16.667, 2.0);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // A. Glow Cursor & Click Ripples
      if (effects.glowCursor && mousePos.isOver) {
        mousePos.x += (mousePos.targetX - mousePos.x) * 0.25 * delta;
        mousePos.y += (mousePos.targetY - mousePos.y) * 0.25 * delta;

        const glowGrad = ctx.createRadialGradient(
          mousePos.x,
          mousePos.y,
          0,
          mousePos.x,
          mousePos.y,
          35
        );
        glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
        glowGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.18)');
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 35, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#22D3EE';
        ctx.shadowColor = '#06B6D4';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (effects.glowCursor && ripples.length > 0) {
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

      // B. Plexus Constellation Lines (Interactive Network)
      if (effects.plexus) {
        const plexusParticles = particles.filter((p) => p.type === 'plexus_node');
        ctx.lineWidth = 0.75;

        for (let i = 0; i < plexusParticles.length; i++) {
          const p1 = plexusParticles[i];

          // Connect to nearby nodes
          for (let j = i + 1; j < plexusParticles.length; j++) {
            const p2 = plexusParticles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              const alpha = (1 - dist / 110) * 0.35;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
              ctx.stroke();
            }
          }

          // Connect to mouse cursor
          if (mousePos.isOver) {
            const mdx = p1.x - mousePos.x;
            const mdy = p1.y - mousePos.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 140) {
              const alpha = (1 - mdist / 140) * 0.6;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(mousePos.x, mousePos.y);
              ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
              ctx.stroke();
            }
          }
        }
      }

      // C. Fireworks Bursts
      if (effects.fireworks) {
        if (currentTime - lastFireworkTime > 1800) {
          lastFireworkTime = currentTime;
          spawnFirework();
        }

        for (let i = fireworkSparks.length - 1; i >= 0; i--) {
          const s = fireworkSparks[i];
          s.x += s.vx * delta;
          s.y += s.vy * delta;
          s.vy += 0.04 * delta; // gravity
          s.alpha -= s.decay * delta;

          if (s.alpha <= 0) {
            fireworkSparks.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.alpha;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
        }
      }

      // D. Cyber Lightning Bolt
      if (effects.lightning) {
        if (currentTime - lightningTimer > 4000) {
          lightningTimer = currentTime;
          if (Math.random() < 0.6) spawnLightning();
        }

        if (currentLightning && lightningOpacity > 0) {
          ctx.beginPath();
          currentLightning.forEach((seg) => {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
          });
          ctx.strokeStyle = `rgba(56, 189, 248, ${lightningOpacity})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;

          lightningOpacity -= 0.08 * delta;
          if (lightningOpacity <= 0) currentLightning = null;
        }
      }

      // E. Shooting Stars
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

      // F. Main Particles Render
      for (const p of particles) {
        // Continuous Sinusoidal Drift
        const sway = p.swaySpeed && p.swayAmp ? Math.sin(currentTime * p.swaySpeed + p.seed) * p.swayAmp : 0;
        p.x += (p.speedX + sway) * delta;
        p.y += p.speedY * delta;

        if (p.rotation !== undefined && p.rotationSpeed) {
          p.rotation += p.rotationSpeed * delta;
        }

        // Boundary Wrapping
        if (p.speedY > 0 && p.y > height + 30) {
          p.y = -30;
          p.x = Math.random() * width;
        } else if (p.speedY < 0 && p.y < -30) {
          p.y = height + 30;
          p.x = Math.random() * width;
        }

        if (p.x > width + 30) p.x = -30;
        else if (p.x < -30) p.x = width + 30;

        // Custom Renderers per effect
        if (p.type === 'sakura') {
          // Sakura Petal
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(((p.rotation || 0) * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 183, 197, ${p.opacity})`;
          ctx.shadowColor = '#FF69B4';
          ctx.shadowBlur = 3;
          ctx.fill();
          ctx.restore();
        } else if (p.type === 'autumn_leaf') {
          // 3D Maple Autumn Leaf
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(((p.rotation || 0) * Math.PI) / 180);
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = p.color || '#EA580C';
          ctx.globalAlpha = p.opacity;
          ctx.shadowColor = '#F97316';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1.0;
        } else if (p.type === 'firefly') {
          // Glowing Bioluminescent Firefly (Breathing pulse)
          const pulse = Math.sin(currentTime * 0.004 + p.seed) * 0.35 + 0.65;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
          ctx.fillStyle = p.color || '#A3E635';
          ctx.globalAlpha = p.opacity * pulse;
          ctx.shadowColor = p.color || '#A3E635';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
        } else if (p.type === 'cyber_rain') {
          // Cyber Rain Streaks
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.strokeStyle = p.color || '#06B6D4';
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = p.opacity;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        } else if (p.type === 'bubble') {
          // Translucent Water Bubble
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.lineWidth = 1.2;
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'gold_coin') {
          // 3D Spinning Gold Coin
          const scale = Math.cos(currentTime * 0.005 + p.seed);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(scale, 1);
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = '#FACC15';
          ctx.shadowColor = '#EAB308';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.strokeStyle = '#CA8A04';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
          ctx.shadowBlur = 0;
        } else if (p.type === 'butterfly') {
          // Glowing Flapping Butterfly
          const flap = Math.cos(currentTime * 0.012 + p.seed);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(flap, 1);
          ctx.beginPath();
          ctx.ellipse(-p.size * 0.6, -p.size * 0.3, p.size * 0.7, p.size * 0.5, 0.3, 0, Math.PI * 2);
          ctx.ellipse(p.size * 0.6, -p.size * 0.3, p.size * 0.7, p.size * 0.5, -0.3, 0, Math.PI * 2);
          ctx.fillStyle = p.color || '#06B6D4';
          ctx.globalAlpha = p.opacity;
          ctx.shadowColor = p.color || '#06B6D4';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
        } else if (p.type === 'matrix') {
          // Matrix Green Rain
          ctx.font = `${p.size}px monospace`;
          ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
          ctx.fillText(p.char || '0', p.x, p.y);
          if (Math.random() < 0.03) {
            p.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          }
        } else {
          // Default Glowing Orbs / Snow / Embers
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color || '#FFFFFF';
          ctx.globalAlpha = p.opacity;

          if (p.type === 'neon' || p.type === 'ember') {
            ctx.shadowColor = p.color || '#06B6D4';
            ctx.shadowBlur = 8;
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
      {/* Unified 60-120 FPS Canvas Layer */}
      {hasCanvasEffect && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-500"
          style={{ width: '100vw', height: '100vh' }}
        />
      )}
    </>
  );
};
