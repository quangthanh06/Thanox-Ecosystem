import React, { useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreEffects } from '../../types';

interface SmoothParticle {
  id: number;
  type: string;
  baseX: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  swayRadius: number;
  swayStep: number;
  phase: number;
  rotation: number;
  rotationSpeed: number;
  flipPhase: number;
  flipSpeed: number;
  opacity: number;
  color: string;
  char?: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  life: number;
}

export const GlobalVisualEffects: React.FC = () => {
  const { settings } = useStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store latest effects and density in mutable refs so the animation loop NEVER restarts or resets coordinates
  const effectsRef = useRef<StoreEffects>(settings.effects || {});
  effectsRef.current = settings.effects || {};

  const densityMultiplierRef = useRef<number>(1.0);
  densityMultiplierRef.current =
    settings.effects?.particleDensity === 'high'
      ? 1.4
      : settings.effects?.particleDensity === 'low'
      ? 0.6
      : 1.0;

  // Persistent Particle Pool across all re-renders
  const particlesRef = useRef<SmoothParticle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const nextParticleId = useRef<number>(1);
  const isInitializedRef = useRef<boolean>(false);

  // Check if any canvas effect is active
  const effects = settings.effects || {};
  const hasCanvasEffect = Boolean(
    effects.snow ||
      effects.cherryBlossom ||
      effects.autumnLeaves ||
      effects.rosePetals ||
      effects.angelFeathers ||
      effects.diamondShards ||
      effects.fairyStardust ||
      effects.floatingHearts ||
      effects.neonParticles ||
      effects.sparkles ||
      effects.shootingStars ||
      effects.matrixRain ||
      effects.glowCursor ||
      effects.fireflies ||
      effects.plexus ||
      effects.fireworks ||
      effects.lightning ||
      effects.butterflies
  );

  // Sync particle pool when active effect toggles change WITHOUT resetting existing particles' positions
  useEffect(() => {
    const currentEff = effectsRef.current;
    const density = densityMultiplierRef.current;
    const currentParticles = particlesRef.current;
    const width = window.innerWidth || 1920;
    const height = window.innerHeight || 1080;

    const targets: Record<string, number> = {
      sakura: currentEff.cherryBlossom ? Math.floor(28 * density) : 0,
      autumn_leaf: currentEff.autumnLeaves ? Math.floor(22 * density) : 0,
      rose_petal: currentEff.rosePetals ? Math.floor(22 * density) : 0,
      angel_feather: currentEff.angelFeathers ? Math.floor(18 * density) : 0,
      diamond_shard: currentEff.diamondShards ? Math.floor(22 * density) : 0,
      fairy_stardust: currentEff.fairyStardust ? Math.floor(35 * density) : 0,
      floating_heart: currentEff.floatingHearts ? Math.floor(18 * density) : 0,
      firefly: currentEff.fireflies ? Math.floor(30 * density) : 0,
      butterfly: currentEff.butterflies ? Math.floor(14 * density) : 0,
      snow: currentEff.snow ? Math.floor(45 * density) : 0,
      neon: currentEff.neonParticles ? Math.floor(35 * density) : 0,
      sparkle: currentEff.sparkles ? Math.floor(30 * density) : 0,
      matrix: currentEff.matrixRain ? Math.floor(30 * density) : 0,
      plexus: currentEff.plexus ? Math.floor(38 * density) : 0,
    };

    const leafColors = ['#EA580C', '#DC2626', '#F59E0B', '#B45309', '#EF4444'];
    const stardustColors = ['#FACC15', '#C084FC', '#38BDF8', '#F472B6'];
    const bColors = ['#06B6D4', '#EC4899', '#A855F7', '#38BDF8'];
    const neonColors = ['#06B6D4', '#7C3AED', '#C084FC', '#22D3EE', '#F43F5E'];
    const fireflyColors = ['#A3E635', '#FACC15', '#4ADE80', '#38BDF8'];
    const matrixChars = '0123456789ABCDEFTHAN0XVIP';

    const newPool: SmoothParticle[] = [];

    // Retain existing active particles of each type up to the target count
    Object.keys(targets).forEach((type) => {
      const targetCount = targets[type];
      const existing = currentParticles.filter((p) => p.type === type);
      const toKeep = existing.slice(0, targetCount);
      newPool.push(...toKeep);

      // Add missing particles if target count increased
      const needed = targetCount - toKeep.length;
      for (let i = 0; i < needed; i++) {
        // If initial load, scatter vertically across full screen. If dynamic toggle, spawn at top.
        const spawnY = isInitializedRef.current
          ? -80 - Math.random() * 60
          : Math.random() * (height + 160) - 80;

        let p: SmoothParticle = {
          id: nextParticleId.current++,
          type,
          baseX: Math.random() * width,
          y: spawnY,
          size: 6,
          speedX: 0,
          speedY: 0.5,
          swayRadius: 15,
          swayStep: 0.01,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: 0,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.008,
          opacity: 0.8,
          color: '#FFFFFF',
        };

        if (type === 'sakura') {
          p.size = Math.random() * 4 + 6;
          p.speedX = Math.random() * 0.2 + 0.05;
          p.speedY = Math.random() * 0.5 + 0.4;
          p.swayRadius = Math.random() * 16 + 8;
          p.swayStep = 0.012;
          p.rotationSpeed = (Math.random() - 0.5) * 0.6;
          p.opacity = Math.random() * 0.35 + 0.55;
          p.color = '#FFB7C5';
        } else if (type === 'autumn_leaf') {
          p.size = Math.random() * 6 + 9;
          p.speedX = Math.random() * 0.2 + 0.1;
          p.speedY = Math.random() * 0.6 + 0.4;
          p.swayRadius = Math.random() * 20 + 10;
          p.swayStep = 0.01;
          p.rotationSpeed = (Math.random() - 0.5) * 0.7;
          p.opacity = Math.random() * 0.3 + 0.7;
          p.color = leafColors[Math.floor(Math.random() * leafColors.length)];
        } else if (type === 'rose_petal') {
          p.size = Math.random() * 5 + 7;
          p.speedX = Math.random() * 0.2 + 0.05;
          p.speedY = Math.random() * 0.5 + 0.4;
          p.swayRadius = Math.random() * 16 + 8;
          p.swayStep = 0.012;
          p.rotationSpeed = (Math.random() - 0.5) * 0.6;
          p.opacity = Math.random() * 0.3 + 0.7;
          p.color = '#E11D48';
        } else if (type === 'angel_feather') {
          p.size = Math.random() * 5 + 8;
          p.speedX = Math.random() * 0.15 + 0.05;
          p.speedY = Math.random() * 0.4 + 0.25;
          p.swayRadius = Math.random() * 25 + 12;
          p.swayStep = 0.009;
          p.rotationSpeed = (Math.random() - 0.5) * 0.4;
          p.flipSpeed = 0.006;
          p.opacity = Math.random() * 0.25 + 0.75;
          p.color = '#FFFFFF';
        } else if (type === 'diamond_shard') {
          p.size = Math.random() * 4 + 5;
          p.speedX = (Math.random() - 0.5) * 0.15;
          p.speedY = Math.random() * 0.6 + 0.4;
          p.swayRadius = Math.random() * 10 + 4;
          p.swayStep = 0.015;
          p.rotationSpeed = Math.random() * 1.0 + 0.5;
          p.flipSpeed = 0.015;
          p.opacity = Math.random() * 0.3 + 0.7;
          p.color = '#38BDF8';
        } else if (type === 'fairy_stardust') {
          p.size = Math.random() * 2 + 1.2;
          p.speedX = (Math.random() - 0.5) * 0.15;
          p.speedY = -(Math.random() * 0.4 + 0.2);
          p.swayRadius = Math.random() * 12 + 4;
          p.swayStep = 0.012;
          p.opacity = Math.random() * 0.6 + 0.4;
          p.color = stardustColors[Math.floor(Math.random() * stardustColors.length)];
        } else if (type === 'floating_heart') {
          p.size = Math.random() * 4 + 6;
          p.speedX = (Math.random() - 0.5) * 0.15;
          p.speedY = -(Math.random() * 0.5 + 0.25);
          p.swayRadius = Math.random() * 14 + 6;
          p.swayStep = 0.01;
          p.opacity = Math.random() * 0.3 + 0.7;
          p.color = '#EC4899';
        } else if (type === 'firefly') {
          p.size = Math.random() * 2 + 1.5;
          p.speedX = (Math.random() - 0.5) * 0.2;
          p.speedY = (Math.random() - 0.5) * 0.2;
          p.swayRadius = Math.random() * 15 + 8;
          p.swayStep = 0.012;
          p.opacity = Math.random() * 0.6 + 0.4;
          p.color = fireflyColors[Math.floor(Math.random() * fireflyColors.length)];
        } else if (type === 'butterfly') {
          p.size = Math.random() * 4 + 6;
          p.speedX = Math.random() * 0.4 + 0.2;
          p.speedY = (Math.random() - 0.5) * 0.15;
          p.swayRadius = Math.random() * 20 + 10;
          p.swayStep = 0.01;
          p.flipSpeed = 0.04;
          p.opacity = Math.random() * 0.3 + 0.7;
          p.color = bColors[Math.floor(Math.random() * bColors.length)];
        } else if (type === 'snow') {
          p.size = Math.random() * 2 + 1;
          p.speedX = (Math.random() - 0.5) * 0.15;
          p.speedY = Math.random() * 0.5 + 0.3;
          p.swayRadius = Math.random() * 10 + 4;
          p.swayStep = 0.01;
          p.opacity = Math.random() * 0.5 + 0.35;
          p.color = '#FFFFFF';
        } else if (type === 'neon') {
          p.size = Math.random() * 2 + 1;
          p.speedX = (Math.random() - 0.5) * 0.15;
          p.speedY = -(Math.random() * 0.5 + 0.3);
          p.swayRadius = Math.random() * 10 + 4;
          p.swayStep = 0.012;
          p.opacity = Math.random() * 0.6 + 0.35;
          p.color = neonColors[Math.floor(Math.random() * neonColors.length)];
        } else if (type === 'sparkle') {
          p.size = Math.random() * 2 + 1;
          p.speedX = (Math.random() - 0.5) * 0.05;
          p.speedY = (Math.random() - 0.5) * 0.05;
          p.opacity = Math.random() * 0.7 + 0.2;
          p.color = '#FDE047';
        } else if (type === 'matrix') {
          p.size = Math.random() * 3 + 11;
          p.speedX = 0;
          p.speedY = Math.random() * 1.2 + 1.0;
          p.opacity = Math.random() * 0.6 + 0.3;
          p.color = '#10B981';
          p.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        } else if (type === 'plexus') {
          p.size = Math.random() * 1.8 + 1.2;
          p.speedX = (Math.random() - 0.5) * 0.35;
          p.speedY = (Math.random() - 0.5) * 0.35;
          p.opacity = Math.random() * 0.5 + 0.4;
          p.color = '#22D3EE';
        }

        newPool.push(p);
      }
    });

    particlesRef.current = newPool;
    isInitializedRef.current = true;
  }, [
    effects.cherryBlossom,
    effects.autumnLeaves,
    effects.rosePetals,
    effects.angelFeathers,
    effects.diamondShards,
    effects.fairyStardust,
    effects.floatingHearts,
    effects.fireflies,
    effects.butterflies,
    effects.snow,
    effects.neonParticles,
    effects.sparkles,
    effects.matrixRain,
    effects.plexus,
    effects.particleDensity,
  ]);

  // Main Persistent Canvas Lifecycle (Runs ONLY ONCE on mount / resize)
  useEffect(() => {
    if (!hasCanvasEffect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth || document.documentElement.clientWidth;
    let height = window.innerHeight || document.documentElement.clientHeight;

    const resizeCanvas = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth || document.documentElement.clientWidth;
      height = window.innerHeight || document.documentElement.clientHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('orientationchange', resizeCanvas, { passive: true });

    // Smooth Mouse tracking
    const mousePos = { x: -500, y: -500, targetX: -500, targetY: -500, isOver: false };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.targetX = e.clientX;
      mousePos.targetY = e.clientY;
      mousePos.isOver = true;
    };

    const handleMouseLeave = () => {
      mousePos.isOver = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // --- DRAWING FUNCTIONS ---
    const drawMapleLeaf = (
      c: CanvasRenderingContext2D,
      size: number,
      color: string,
      opacity: number
    ) => {
      c.save();
      c.globalAlpha = opacity;
      c.fillStyle = color;
      c.beginPath();

      c.moveTo(0, size * 0.85);
      c.lineTo(0, size * 0.35);

      c.lineTo(-size * 0.35, size * 0.4);
      c.lineTo(-size * 0.5, size * 0.18);
      c.lineTo(-size * 0.35, size * 0.08);

      c.lineTo(-size * 0.65, 0);
      c.lineTo(-size * 0.85, -size * 0.22);
      c.lineTo(-size * 0.6, -size * 0.22);
      c.lineTo(-size * 0.7, -size * 0.52);
      c.lineTo(-size * 0.45, -size * 0.38);

      c.lineTo(-size * 0.25, -size * 0.72);
      c.lineTo(0, -size * 1.0);
      c.lineTo(size * 0.25, -size * 0.72);

      c.lineTo(size * 0.45, -size * 0.38);
      c.lineTo(size * 0.7, -size * 0.52);
      c.lineTo(size * 0.6, -size * 0.22);
      c.lineTo(size * 0.85, -size * 0.22);
      c.lineTo(size * 0.65, 0);

      c.lineTo(size * 0.35, size * 0.08);
      c.lineTo(size * 0.5, size * 0.18);
      c.lineTo(size * 0.35, size * 0.4);
      c.lineTo(0, size * 0.35);

      c.closePath();
      c.fill();

      // Veins
      c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(0, size * 0.85);
      c.lineTo(0, -size * 0.8);
      c.moveTo(0, size * 0.1);
      c.lineTo(-size * 0.55, -size * 0.18);
      c.moveTo(0, size * 0.1);
      c.lineTo(size * 0.55, -size * 0.18);
      c.stroke();

      c.restore();
    };

    const drawSakuraPetal = (c: CanvasRenderingContext2D, size: number, opacity: number) => {
      c.save();
      c.fillStyle = `rgba(255, 183, 197, ${opacity})`;
      c.beginPath();
      c.moveTo(0, size);
      c.bezierCurveTo(-size * 0.8, size * 0.4, -size * 0.9, -size * 0.5, -size * 0.2, -size * 0.9);
      c.lineTo(0, -size * 0.7);
      c.lineTo(size * 0.2, -size * 0.9);
      c.bezierCurveTo(size * 0.9, -size * 0.5, size * 0.8, size * 0.4, 0, size);
      c.closePath();
      c.fill();
      c.restore();
    };

    const drawRosePetal = (c: CanvasRenderingContext2D, size: number, opacity: number) => {
      c.save();
      c.globalAlpha = opacity;
      c.beginPath();
      c.moveTo(0, size * 0.8);
      c.bezierCurveTo(-size * 0.9, size * 0.5, -size * 1.1, -size * 0.4, -size * 0.4, -size * 0.9);
      c.bezierCurveTo(0, -size * 1.05, size * 0.4, -size * 0.9, size * 0.4, -size * 0.9);
      c.bezierCurveTo(size * 1.1, -size * 0.4, size * 0.9, size * 0.5, 0, size * 0.8);
      c.closePath();
      c.fillStyle = '#E11D48';
      c.fill();
      c.restore();
    };

    const drawAngelFeather = (c: CanvasRenderingContext2D, size: number, opacity: number) => {
      c.save();
      c.globalAlpha = opacity;
      c.beginPath();
      c.moveTo(0, size);
      c.bezierCurveTo(-size * 0.4, size * 0.5, -size * 0.5, -size * 0.4, 0, -size * 1.1);
      c.bezierCurveTo(size * 0.5, -size * 0.4, size * 0.4, size * 0.5, 0, size);
      c.closePath();
      c.fillStyle = 'rgba(255, 255, 255, 0.8)';
      c.fill();

      c.beginPath();
      c.moveTo(0, size * 1.1);
      c.lineTo(0, -size * 1.0);
      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    };

    const drawDiamondShard = (c: CanvasRenderingContext2D, size: number, opacity: number) => {
      c.save();
      c.globalAlpha = opacity;
      c.beginPath();
      c.moveTo(0, -size);
      c.lineTo(size * 0.8, -size * 0.3);
      c.lineTo(size * 0.5, size * 0.9);
      c.lineTo(-size * 0.5, size * 0.9);
      c.lineTo(-size * 0.8, -size * 0.3);
      c.closePath();
      c.fillStyle = 'rgba(56, 189, 248, 0.8)';
      c.fill();
      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 0.8;
      c.stroke();
      c.restore();
    };

    const drawFloatingHeart = (c: CanvasRenderingContext2D, size: number, opacity: number) => {
      c.save();
      c.globalAlpha = opacity;
      c.beginPath();
      c.moveTo(0, size * 0.6);
      c.bezierCurveTo(-size * 0.8, size * 0.1, -size, -size * 0.5, -size * 0.4, -size * 0.8);
      c.bezierCurveTo(-size * 0.1, -size * 0.9, 0, -size * 0.6, 0, -size * 0.4);
      c.bezierCurveTo(0, -size * 0.6, size * 0.1, -size * 0.9, size * 0.4, -size * 0.8);
      c.bezierCurveTo(size, -size * 0.5, size * 0.8, size * 0.1, 0, size * 0.6);
      c.closePath();
      c.fillStyle = '#EC4899';
      c.fill();
      c.restore();
    };

    const drawButterfly = (
      c: CanvasRenderingContext2D,
      size: number,
      color: string,
      flap: number,
      opacity: number
    ) => {
      c.save();
      c.globalAlpha = opacity;

      c.save();
      c.scale(flap, 1);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-size * 1.3, -size * 1.1, -size * 1.6, -size * 0.2, -size * 0.8, size * 0.3);
      c.bezierCurveTo(-size * 1.3, size * 0.8, -size * 0.6, size * 1.2, 0, size * 0.4);
      c.fillStyle = color;
      c.fill();
      c.restore();

      c.save();
      c.scale(-flap, 1);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-size * 1.3, -size * 1.1, -size * 1.6, -size * 0.2, -size * 0.8, size * 0.3);
      c.bezierCurveTo(-size * 1.3, size * 0.8, -size * 0.6, size * 1.2, 0, size * 0.4);
      c.fillStyle = color;
      c.fill();
      c.restore();

      c.beginPath();
      c.ellipse(0, 0, 1.5, size * 0.35, 0, 0, Math.PI * 2);
      c.fillStyle = '#FFFFFF';
      c.fill();
      c.restore();
    };

    let lastStarTime = performance.now();
    const matrixChars = '0123456789ABCDEFTHAN0XVIP';

    // --- CONTINUOUS PERPETUAL FLUID LOOP ---
    const render = () => {
      const curEff = effectsRef.current;
      ctx.clearRect(0, 0, width, height);

      // A. Smooth Mouse Aura
      if (curEff.glowCursor && mousePos.isOver) {
        mousePos.x += (mousePos.targetX - mousePos.x) * 0.2;
        mousePos.y += (mousePos.targetY - mousePos.y) * 0.2;

        const glowGrad = ctx.createRadialGradient(
          mousePos.x,
          mousePos.y,
          0,
          mousePos.x,
          mousePos.y,
          32
        );
        glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        glowGrad.addColorStop(0.6, 'rgba(124, 58, 237, 0.12)');
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 32, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#22D3EE';
        ctx.fill();
      }

      // B. Plexus Constellation Line Network
      if (curEff.plexus) {
        const plexusNodes = particlesRef.current.filter((p) => p.type === 'plexus');
        ctx.lineWidth = 0.75;

        for (let i = 0; i < plexusNodes.length; i++) {
          const p1 = plexusNodes[i];
          const actualX1 = p1.baseX;
          const actualY1 = p1.y;

          for (let j = i + 1; j < plexusNodes.length; j++) {
            const p2 = plexusNodes[j];
            const dx = actualX1 - p2.baseX;
            const dy = actualY1 - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
              const alpha = (1 - dist / 100) * 0.3;
              ctx.beginPath();
              ctx.moveTo(actualX1, actualY1);
              ctx.lineTo(p2.baseX, p2.y);
              ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
              ctx.stroke();
            }
          }

          if (mousePos.isOver) {
            const mdx = actualX1 - mousePos.x;
            const mdy = actualY1 - mousePos.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 130) {
              const alpha = (1 - mdist / 130) * 0.55;
              ctx.beginPath();
              ctx.moveTo(actualX1, actualY1);
              ctx.lineTo(mousePos.x, mousePos.y);
              ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
              ctx.stroke();
            }
          }
        }
      }

      // C. Shooting Stars
      if (curEff.shootingStars) {
        const now = performance.now();
        if (now - lastStarTime > 3000 && shootingStarsRef.current.length < 2) {
          lastStarTime = now;
          shootingStarsRef.current.push({
            x: Math.random() * (width * 0.7) + 50,
            y: Math.random() * (height * 0.35),
            length: Math.random() * 60 + 40,
            speed: Math.random() * 6 + 5,
            angle: Math.PI / 4,
            life: 1.0,
          });
        }

        for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
          const star = shootingStarsRef.current[i];
          star.x += Math.cos(star.angle) * star.speed;
          star.y += Math.sin(star.angle) * star.speed;
          star.life -= 0.012;

          if (star.life <= 0 || star.x > width || star.y > height) {
            shootingStarsRef.current.splice(i, 1);
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
          ctx.lineWidth = 1.6;
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.x, star.y);
          ctx.stroke();
        }
      }

      // D. Main Particle Loop
      const particles = particlesRef.current;
      const bottomPadding = 90;
      const topPadding = 90;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.baseX += p.speedX;
        p.y += p.speedY;
        p.phase += p.swayStep;
        p.flipPhase += p.flipSpeed;
        p.rotation += p.rotationSpeed;

        const renderX = p.swayRadius ? p.baseX + Math.sin(p.phase) * p.swayRadius : p.baseX;
        const renderY = p.y;

        // Falling particles ONLY reset when reaching 90px past bottom of screen
        if (p.speedY > 0 && p.y > height + bottomPadding) {
          p.y = -topPadding - Math.random() * 60;
          p.baseX = Math.random() * width;
        } else if (p.speedY < 0 && p.y < -topPadding) {
          p.y = height + bottomPadding + Math.random() * 60;
          p.baseX = Math.random() * width;
        }

        // Draw particle
        if (p.type === 'autumn_leaf') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const leafTilt = Math.sin(p.phase) * 0.3;
          const leaf3DFlip = Math.cos(p.flipPhase);
          ctx.rotate(((p.rotation + leafTilt * 35) * Math.PI) / 180);
          ctx.scale(leaf3DFlip, 1);
          drawMapleLeaf(ctx, p.size, p.color, p.opacity);
          ctx.restore();
        } else if (p.type === 'sakura') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const petal3DFlip = Math.cos(p.flipPhase);
          ctx.rotate(((p.rotation + Math.sin(p.phase) * 25) * Math.PI) / 180);
          ctx.scale(petal3DFlip, 1);
          drawSakuraPetal(ctx, p.size, p.opacity);
          ctx.restore();
        } else if (p.type === 'rose_petal') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const petal3DFlip = Math.cos(p.flipPhase);
          ctx.rotate(((p.rotation + Math.sin(p.phase) * 20) * Math.PI) / 180);
          ctx.scale(petal3DFlip, 1);
          drawRosePetal(ctx, p.size, p.opacity);
          ctx.restore();
        } else if (p.type === 'angel_feather') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const featherTilt = Math.sin(p.phase) * 0.35;
          const feather3D = Math.cos(p.flipPhase);
          ctx.rotate(((p.rotation + featherTilt * 30) * Math.PI) / 180);
          ctx.scale(feather3D, 1);
          drawAngelFeather(ctx, p.size, p.opacity);
          ctx.restore();
        } else if (p.type === 'diamond_shard') {
          ctx.save();
          ctx.translate(renderX, renderY);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.scale(Math.cos(p.flipPhase), 1);
          drawDiamondShard(ctx, p.size, p.opacity);
          ctx.restore();
        } else if (p.type === 'floating_heart') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const heartPulse = Math.sin(p.phase * 1.5) * 0.1 + 0.9;
          ctx.scale(heartPulse, heartPulse);
          drawFloatingHeart(ctx, p.size, p.opacity);
          ctx.restore();
        } else if (p.type === 'fairy_stardust') {
          const pulse = Math.sin(p.phase * 2) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(renderX, renderY, p.size * pulse, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity * pulse;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else if (p.type === 'butterfly') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const flap = Math.cos(p.flipPhase);
          const flightAngle = Math.atan2(p.speedY, p.speedX);
          ctx.rotate(flightAngle);
          drawButterfly(ctx, p.size, p.color, flap, p.opacity);
          ctx.restore();
        } else if (p.type === 'firefly') {
          const breathingPulse = Math.sin(p.phase * 2) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(renderX, renderY, p.size * breathingPulse, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity * breathingPulse;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else if (p.type === 'matrix') {
          ctx.font = `${p.size}px monospace`;
          ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
          ctx.fillText(p.char || '0', renderX, renderY);
          if (Math.random() < 0.02) {
            p.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          }
        } else {
          ctx.beginPath();
          ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasCanvasEffect]);

  return (
    <>
      {hasCanvasEffect && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-500 w-full h-full"
        />
      )}
    </>
  );
};
