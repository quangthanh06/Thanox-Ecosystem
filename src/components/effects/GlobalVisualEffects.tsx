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
    effects.butterflies;

  // Particle Density Multiplier
  const densityMultiplier =
    effects.particleDensity === 'high' ? 1.4 : effects.particleDensity === 'low' ? 0.6 : 1.0;

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

    // --- REALISTIC & LIGHTWEIGHT VECTOR DRAWING FUNCTIONS ---

    // 1. Maple Autumn Leaf (5-pointed serrated leaf)
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

      // Left lower lobe
      c.lineTo(-size * 0.35, size * 0.4);
      c.lineTo(-size * 0.5, size * 0.18);
      c.lineTo(-size * 0.35, size * 0.08);

      // Left middle main lobe
      c.lineTo(-size * 0.65, 0);
      c.lineTo(-size * 0.85, -size * 0.22);
      c.lineTo(-size * 0.6, -size * 0.22);
      c.lineTo(-size * 0.7, -size * 0.52);
      c.lineTo(-size * 0.45, -size * 0.38);

      // Top main central lobe
      c.lineTo(-size * 0.25, -size * 0.72);
      c.lineTo(0, -size * 1.0);
      c.lineTo(size * 0.25, -size * 0.72);

      // Right middle main lobe
      c.lineTo(size * 0.45, -size * 0.38);
      c.lineTo(size * 0.7, -size * 0.52);
      c.lineTo(size * 0.6, -size * 0.22);
      c.lineTo(size * 0.85, -size * 0.22);
      c.lineTo(size * 0.65, 0);

      // Right lower lobe
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

    // 2. Sakura Petal
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

    // 3. Velvet Red Rose Petal
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

    // 4. White Angel Feather
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

      // Quill spine
      c.beginPath();
      c.moveTo(0, size * 1.1);
      c.lineTo(0, -size * 1.0);
      c.strokeStyle = '#FFFFFF';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    };

    // 5. Diamond Crystal Shard
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

    // 6. Floating Heart
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

    // 7. Glowing Butterfly
    const drawButterfly = (
      c: CanvasRenderingContext2D,
      size: number,
      color: string,
      flap: number,
      opacity: number
    ) => {
      c.save();
      c.globalAlpha = opacity;

      // Left wing
      c.save();
      c.scale(flap, 1);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-size * 1.3, -size * 1.1, -size * 1.6, -size * 0.2, -size * 0.8, size * 0.3);
      c.bezierCurveTo(-size * 1.3, size * 0.8, -size * 0.6, size * 1.2, 0, size * 0.4);
      c.fillStyle = color;
      c.fill();
      c.restore();

      // Right wing
      c.save();
      c.scale(-flap, 1);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-size * 1.3, -size * 1.1, -size * 1.6, -size * 0.2, -size * 0.8, size * 0.3);
      c.bezierCurveTo(-size * 1.3, size * 0.8, -size * 0.6, size * 1.2, 0, size * 0.4);
      c.fillStyle = color;
      c.fill();
      c.restore();

      // Body
      c.beginPath();
      c.ellipse(0, 0, 1.5, size * 0.35, 0, 0, Math.PI * 2);
      c.fillStyle = '#FFFFFF';
      c.fill();
      c.restore();
    };

    // --- PARTICLE MODEL ---

    interface SmoothParticle {
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

    const particles: SmoothParticle[] = [];

    // Sakura Petals
    if (effects.cherryBlossom) {
      const count = Math.floor(28 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'sakura',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 4 + 6,
          speedX: Math.random() * 0.2 + 0.05,
          speedY: Math.random() * 0.5 + 0.4,
          swayRadius: Math.random() * 16 + 8,
          swayStep: 0.012,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 0.6,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.008,
          opacity: Math.random() * 0.35 + 0.55,
          color: '#FFB7C5',
        });
      }
    }

    // Autumn Leaves (Lá Phong 5 Cánh)
    if (effects.autumnLeaves) {
      const count = Math.floor(22 * densityMultiplier);
      const leafColors = ['#EA580C', '#DC2626', '#F59E0B', '#B45309', '#EF4444'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'autumn_leaf',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 6 + 9,
          speedX: Math.random() * 0.2 + 0.1,
          speedY: Math.random() * 0.6 + 0.4,
          swayRadius: Math.random() * 20 + 10,
          swayStep: 0.01,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 0.7,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.008,
          opacity: Math.random() * 0.3 + 0.7,
          color: leafColors[Math.floor(Math.random() * leafColors.length)],
        });
      }
    }

    // Rose Petals (Cánh Hoa Hồng Đỏ)
    if (effects.rosePetals) {
      const count = Math.floor(22 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'rose_petal',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 5 + 7,
          speedX: Math.random() * 0.2 + 0.05,
          speedY: Math.random() * 0.5 + 0.4,
          swayRadius: Math.random() * 16 + 8,
          swayStep: 0.012,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 0.6,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.008,
          opacity: Math.random() * 0.3 + 0.7,
          color: '#E11D48',
        });
      }
    }

    // Angel Feathers (Lông Vũ Thiên Thần)
    if (effects.angelFeathers) {
      const count = Math.floor(18 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'angel_feather',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 5 + 8,
          speedX: Math.random() * 0.15 + 0.05,
          speedY: Math.random() * 0.4 + 0.25,
          swayRadius: Math.random() * 25 + 12,
          swayStep: 0.009,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 0.4,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.006,
          opacity: Math.random() * 0.25 + 0.75,
          color: '#FFFFFF',
        });
      }
    }

    // Diamond Shards (Kim Cương Pha Lê)
    if (effects.diamondShards) {
      const count = Math.floor(22 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'diamond_shard',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 4 + 5,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: Math.random() * 0.6 + 0.4,
          swayRadius: Math.random() * 10 + 4,
          swayStep: 0.015,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 1.0 + 0.5,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.015,
          opacity: Math.random() * 0.3 + 0.7,
          color: '#38BDF8',
        });
      }
    }

    // Fairy Magic Stardust (Bụi Tiên Tộc)
    if (effects.fairyStardust) {
      const count = Math.floor(35 * densityMultiplier);
      const stardustColors = ['#FACC15', '#C084FC', '#38BDF8', '#F472B6'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'fairy_stardust',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 2 + 1.2,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: -(Math.random() * 0.4 + 0.2), // Float up
          swayRadius: Math.random() * 12 + 4,
          swayStep: 0.012,
          phase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.6 + 0.4,
          color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
        });
      }
    }

    // Floating Hearts (Trái Tim Tình Yêu)
    if (effects.floatingHearts) {
      const count = Math.floor(18 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'floating_heart',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 4 + 6,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: -(Math.random() * 0.5 + 0.25),
          swayRadius: Math.random() * 14 + 6,
          swayStep: 0.01,
          phase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.01,
          opacity: Math.random() * 0.3 + 0.7,
          color: '#EC4899',
        });
      }
    }

    // Fireflies (Đom Đóm)
    if (effects.fireflies) {
      const count = Math.floor(30 * densityMultiplier);
      const colors = ['#A3E635', '#FACC15', '#4ADE80', '#38BDF8'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'firefly',
          baseX: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1.5,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          swayRadius: Math.random() * 15 + 8,
          swayStep: 0.012,
          phase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.6 + 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    // Glowing Butterflies (Bướm Dạ Quang)
    if (effects.butterflies) {
      const count = Math.floor(14 * densityMultiplier);
      const bColors = ['#06B6D4', '#EC4899', '#A855F7', '#38BDF8'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'butterfly',
          baseX: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 4 + 6,
          speedX: Math.random() * 0.4 + 0.2,
          speedY: (Math.random() - 0.5) * 0.15,
          swayRadius: Math.random() * 20 + 10,
          swayStep: 0.01,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: 0,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: 0.04,
          opacity: Math.random() * 0.3 + 0.7,
          color: bColors[Math.floor(Math.random() * bColors.length)],
        });
      }
    }

    // Snow (Tuyết Rơi)
    if (effects.snow) {
      const count = Math.floor(45 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'snow',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: Math.random() * 0.5 + 0.3,
          swayRadius: Math.random() * 10 + 4,
          swayStep: 0.01,
          phase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.5 + 0.35,
          color: '#FFFFFF',
        });
      }
    }

    // Neon Particles
    if (effects.neonParticles) {
      const count = Math.floor(35 * densityMultiplier);
      const colors = ['#06B6D4', '#7C3AED', '#C084FC', '#22D3EE', '#F43F5E'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'neon',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: -(Math.random() * 0.5 + 0.3),
          swayRadius: Math.random() * 10 + 4,
          swayStep: 0.012,
          phase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.6 + 0.35,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    // Sparkles
    if (effects.sparkles) {
      const count = Math.floor(30 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'sparkle',
          baseX: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.05,
          speedY: (Math.random() - 0.5) * 0.05,
          swayRadius: 0,
          swayStep: 0,
          phase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.7 + 0.2,
          color: '#FDE047',
        });
      }
    }

    // Matrix Rain
    const matrixChars = '0123456789ABCDEFTHAN0XVIP';
    if (effects.matrixRain) {
      const count = Math.floor(30 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'matrix',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 3 + 11,
          speedX: 0,
          speedY: Math.random() * 1.2 + 1.0,
          swayRadius: 0,
          swayStep: 0,
          phase: 0,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.6 + 0.3,
          color: '#10B981',
          char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
        });
      }
    }

    // Plexus Nodes
    if (effects.plexus) {
      const count = Math.floor(38 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'plexus',
          baseX: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.8 + 1.2,
          speedX: (Math.random() - 0.5) * 0.35,
          speedY: (Math.random() - 0.5) * 0.35,
          swayRadius: 0,
          swayStep: 0,
          phase: 0,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.5 + 0.4,
          color: '#22D3EE',
        });
      }
    }

    // Shooting Stars
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

    // --- ROCK-SOLID 60-120 FPS FLUID ANIMATION LOOP ---
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // A. Smooth Mouse Aura (Glow Cursor)
      if (effects.glowCursor && mousePos.isOver) {
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
      if (effects.plexus) {
        const plexusNodes = particles.filter((p) => p.type === 'plexus');
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
      if (effects.shootingStars) {
        const now = performance.now();
        if (now - lastStarTime > 3000 && shootingStars.length < 2) {
          lastStarTime = now;
          shootingStars.push({
            x: Math.random() * (width * 0.7) + 50,
            y: Math.random() * (height * 0.35),
            length: Math.random() * 60 + 40,
            speed: Math.random() * 6 + 5,
            angle: Math.PI / 4,
            life: 1.0,
          });
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const star = shootingStars[i];
          star.x += Math.cos(star.angle) * star.speed;
          star.y += Math.sin(star.angle) * star.speed;
          star.life -= 0.012;

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
          ctx.lineWidth = 1.6;
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.x, star.y);
          ctx.stroke();
        }
      }

      // D. Main Particle Physics Engine (Ultra-Smooth Constant Step)
      const bottomPadding = 90;
      const topPadding = 90;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Advance position smoothly
        p.baseX += p.speedX;
        p.y += p.speedY;
        p.phase += p.swayStep;
        p.flipPhase += p.flipSpeed;
        p.rotation += p.rotationSpeed;

        // 2. Smooth gentle sway coordinate
        const renderX = p.swayRadius ? p.baseX + Math.sin(p.phase) * p.swayRadius : p.baseX;
        const renderY = p.y;

        // 3. Falling particles ONLY reset when reaching 90px past bottom of screen
        if (p.speedY > 0 && p.y > height + bottomPadding) {
          p.y = -topPadding - Math.random() * 60;
          p.baseX = Math.random() * width;
        } else if (p.speedY < 0 && p.y < -topPadding) {
          p.y = height + bottomPadding + Math.random() * 60;
          p.baseX = Math.random() * width;
        }

        // 4. Draw particle based on type
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
  }, [hasCanvasEffect, effects, densityMultiplier]);

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
