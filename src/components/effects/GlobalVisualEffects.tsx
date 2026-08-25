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
      const dpr = window.devicePixelRatio || 1;
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

    // Smooth Mouse tracking in memory
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

    // --- VECTOR SHAPE DRAWING UTILITIES ---

    // 1. Realistic 5-Pointed Serrated Maple Autumn Leaf (Lá Phong Thật)
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

      // Stem at bottom
      c.moveTo(0, size * 0.9);
      c.lineTo(0, size * 0.4);

      // Left lower lobe
      c.lineTo(-size * 0.35, size * 0.45);
      c.lineTo(-size * 0.5, size * 0.2);
      c.lineTo(-size * 0.35, size * 0.1);

      // Left middle main lobe (3 sharp serrated tips)
      c.lineTo(-size * 0.65, 0);
      c.lineTo(-size * 0.85, -size * 0.25);
      c.lineTo(-size * 0.6, -size * 0.25);
      c.lineTo(-size * 0.7, -size * 0.55);
      c.lineTo(-size * 0.45, -size * 0.4);

      // Top main central lobe (3 sharp serrated tips)
      c.lineTo(-size * 0.25, -size * 0.75);
      c.lineTo(0, -size * 1.05); // Topmost sharp tip
      c.lineTo(size * 0.25, -size * 0.75);

      // Right middle main lobe (3 sharp serrated tips)
      c.lineTo(size * 0.45, -size * 0.4);
      c.lineTo(size * 0.7, -size * 0.55);
      c.lineTo(size * 0.6, -size * 0.25);
      c.lineTo(size * 0.85, -size * 0.25);
      c.lineTo(size * 0.65, 0);

      // Right lower lobe
      c.lineTo(size * 0.35, size * 0.1);
      c.lineTo(size * 0.5, size * 0.2);
      c.lineTo(size * 0.35, size * 0.45);
      c.lineTo(0, size * 0.4);

      c.closePath();
      c.shadowColor = '#EA580C';
      c.shadowBlur = 4;
      c.fill();
      c.shadowBlur = 0;

      // Leaf veins
      c.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, size * 0.9);
      c.lineTo(0, -size * 0.85);
      c.moveTo(0, size * 0.1);
      c.lineTo(-size * 0.6, -size * 0.2);
      c.moveTo(0, size * 0.1);
      c.lineTo(size * 0.6, -size * 0.2);
      c.stroke();

      c.restore();
    };

    // 2. Realistic Cherry Blossom (Sakura) Petal with notched tip
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
      c.shadowColor = '#FF69B4';
      c.shadowBlur = 4;
      c.fill();
      c.restore();
    };

    // 3. Realistic Glowing Butterfly (Bướm phát sáng vỗ cánh)
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
      c.shadowColor = color;
      c.shadowBlur = 8;
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
      c.shadowColor = color;
      c.shadowBlur = 8;
      c.fill();
      c.restore();

      // Body
      c.beginPath();
      c.ellipse(0, 0, 1.5, size * 0.35, 0, 0, Math.PI * 2);
      c.fillStyle = '#FFFFFF';
      c.fill();

      c.restore();
    };

    // 4. Realistic 3D Rotating Gold Coin
    const drawGoldCoin = (
      c: CanvasRenderingContext2D,
      size: number,
      rotationY: number,
      opacity: number
    ) => {
      c.save();
      c.globalAlpha = opacity;
      c.scale(Math.cos(rotationY), 1);

      c.beginPath();
      c.arc(0, 0, size, 0, Math.PI * 2);
      c.fillStyle = '#FACC15';
      c.fill();
      c.strokeStyle = '#CA8A04';
      c.lineWidth = size * 0.18;
      c.stroke();

      // Inner rim
      c.beginPath();
      c.arc(0, 0, size * 0.65, 0, Math.PI * 2);
      c.strokeStyle = '#EAB308';
      c.lineWidth = 1;
      c.stroke();

      // Symbol
      c.fillStyle = '#92400E';
      c.font = `bold ${Math.round(size * 0.9)}px sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('$', 0, 1);

      c.restore();
    };

    // 5. Realistic Translucent Water Bubble
    const drawBubble = (c: CanvasRenderingContext2D, size: number, opacity: number) => {
      c.save();
      c.globalAlpha = opacity;

      c.beginPath();
      c.arc(0, 0, size, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      c.fillStyle = 'rgba(56, 189, 248, 0.12)';
      c.lineWidth = 1.2;
      c.fill();
      c.stroke();

      c.beginPath();
      c.arc(-size * 0.35, -size * 0.35, size * 0.3, 0, Math.PI * 1.5);
      c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      c.lineWidth = 1.5;
      c.stroke();

      c.restore();
    };

    // --- PARTICLE MODEL & GENERATION ---

    interface NaturalParticle {
      type: string;
      baseX: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      swayRadius: number;
      swayFreq: number;
      phase: number;
      rotation: number;
      rotationSpeed: number;
      flipPhase: number;
      flipSpeed: number;
      opacity: number;
      color: string;
      char?: string;
    }

    const particles: NaturalParticle[] = [];

    // Initialize Sakura
    if (effects.cherryBlossom) {
      const count = Math.floor(30 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'sakura',
          baseX: Math.random() * (width + 100) - 50,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 5 + 6,
          speedX: Math.random() * 0.4 + 0.2,
          speedY: Math.random() * 0.8 + 0.6,
          swayRadius: Math.random() * 25 + 15,
          swayFreq: Math.random() * 0.008 + 0.004,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 1.2,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: Math.random() * 0.02 + 0.01,
          opacity: Math.random() * 0.35 + 0.55,
          color: '#FFB7C5',
        });
      }
    }

    // Initialize Autumn Leaves (Lá Phong Rơi Mùa Thu 5 Cánh)
    if (effects.autumnLeaves) {
      const count = Math.floor(25 * densityMultiplier);
      const leafColors = ['#EA580C', '#DC2626', '#F59E0B', '#B45309', '#EF4444'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'autumn_leaf',
          baseX: Math.random() * (width + 150) - 75,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 7 + 9,
          speedX: Math.random() * 0.5 + 0.3,
          speedY: Math.random() * 1.0 + 0.7,
          swayRadius: Math.random() * 35 + 20,
          swayFreq: Math.random() * 0.007 + 0.003,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 1.5,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: Math.random() * 0.02 + 0.01,
          opacity: Math.random() * 0.3 + 0.7,
          color: leafColors[Math.floor(Math.random() * leafColors.length)],
        });
      }
    }

    // Initialize Fireflies (Đom Đóm)
    if (effects.fireflies) {
      const count = Math.floor(35 * densityMultiplier);
      const colors = ['#A3E635', '#FACC15', '#4ADE80', '#38BDF8'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'firefly',
          baseX: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.5 + 1.8,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          swayRadius: Math.random() * 20 + 10,
          swayFreq: Math.random() * 0.01 + 0.005,
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

    // Initialize Plexus Nodes
    if (effects.plexus) {
      const count = Math.floor(45 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'plexus',
          baseX: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1.5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          swayRadius: 0,
          swayFreq: 0,
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

    // Initialize Volcano Embers
    if (effects.volcanoEmbers) {
      const count = Math.floor(45 * densityMultiplier);
      const emberColors = ['#FF4500', '#FFA500', '#FF6347', '#FFD700', '#EF4444'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'volcano_ember',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 2.5 + 1.2,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: -(Math.random() * 1.2 + 0.6),
          swayRadius: Math.random() * 15 + 5,
          swayFreq: Math.random() * 0.01 + 0.005,
          phase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.7 + 0.3,
          color: emberColors[Math.floor(Math.random() * emberColors.length)],
        });
      }
    }

    // Initialize Cyber Rain
    if (effects.cyberRain) {
      const count = Math.floor(65 * densityMultiplier);
      const rainColors = ['#06B6D4', '#7C3AED', '#38BDF8', '#C084FC'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'cyber_rain',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 22 + 16,
          speedX: -0.4,
          speedY: Math.random() * 6 + 10,
          swayRadius: 0,
          swayFreq: 0,
          phase: 0,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.45 + 0.35,
          color: rainColors[Math.floor(Math.random() * rainColors.length)],
        });
      }
    }

    // Initialize Bubbles
    if (effects.bubbles) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'bubble',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 5 + 3.5,
          speedX: 0,
          speedY: -(Math.random() * 0.8 + 0.5),
          swayRadius: Math.random() * 18 + 8,
          swayFreq: Math.random() * 0.008 + 0.003,
          phase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          flipPhase: 0,
          flipSpeed: 0,
          opacity: Math.random() * 0.4 + 0.4,
          color: '#38BDF8',
        });
      }
    }

    // Initialize Gold Coins
    if (effects.goldCoins) {
      const count = Math.floor(25 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'gold_coin',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 5 + 7,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: Math.random() * 1.3 + 0.8,
          swayRadius: Math.random() * 15 + 5,
          swayFreq: 0.005,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 1.5 + 0.5,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: Math.random() * 0.03 + 0.02,
          opacity: Math.random() * 0.3 + 0.7,
          color: '#FACC15',
        });
      }
    }

    // Initialize Glowing Butterflies
    if (effects.butterflies) {
      const count = Math.floor(16 * densityMultiplier);
      const bColors = ['#06B6D4', '#EC4899', '#A855F7', '#38BDF8'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'butterfly',
          baseX: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 4 + 7,
          speedX: Math.random() * 0.6 + 0.4,
          speedY: (Math.random() - 0.5) * 0.3,
          swayRadius: Math.random() * 30 + 15,
          swayFreq: Math.random() * 0.008 + 0.004,
          phase: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: 0,
          flipPhase: Math.random() * Math.PI * 2,
          flipSpeed: Math.random() * 0.08 + 0.06,
          opacity: Math.random() * 0.3 + 0.7,
          color: bColors[Math.floor(Math.random() * bColors.length)],
        });
      }
    }

    // Initialize Snow
    if (effects.snow) {
      const count = Math.floor(55 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'snow',
          baseX: Math.random() * (width + 80) - 40,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 2.2 + 1.2,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: Math.random() * 0.7 + 0.4,
          swayRadius: Math.random() * 15 + 5,
          swayFreq: 0.005,
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

    // Initialize Neon Particles
    if (effects.neonParticles) {
      const count = Math.floor(40 * densityMultiplier);
      const colors = ['#06B6D4', '#7C3AED', '#C084FC', '#22D3EE', '#F43F5E'];
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'neon',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 2.5 + 1.2,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: -(Math.random() * 0.8 + 0.4),
          swayRadius: Math.random() * 12 + 4,
          swayFreq: 0.006,
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

    // Initialize Sparkles
    if (effects.sparkles) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'sparkle',
          baseX: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.1,
          speedY: (Math.random() - 0.5) * 0.1,
          swayRadius: 0,
          swayFreq: 0,
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

    // Initialize Matrix Rain
    const matrixChars = '0123456789ABCDEFTHAN0XVIP';
    if (effects.matrixRain) {
      const count = Math.floor(35 * densityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'matrix',
          baseX: Math.random() * width,
          y: Math.random() * (height + 160) - 80,
          size: Math.random() * 4 + 11,
          speedX: 0,
          speedY: Math.random() * 1.5 + 1.2,
          swayRadius: 0,
          swayFreq: 0,
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

    // Fireworks & Lightning Helpers
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

    // --- MASTER 60-120 FPS ANIMATION LOOP ---
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 16.667, 2.0);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // A. Smooth Mouse Aura & Ripple Waves
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
            const actualX2 = p2.baseX;
            const actualY2 = p2.y;

            const dx = actualX1 - actualX2;
            const dy = actualY1 - actualY2;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              const alpha = (1 - dist / 110) * 0.35;
              ctx.beginPath();
              ctx.moveTo(actualX1, actualY1);
              ctx.lineTo(actualX2, actualY2);
              ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
              ctx.stroke();
            }
          }

          if (mousePos.isOver) {
            const mdx = actualX1 - mousePos.x;
            const mdy = actualY1 - mousePos.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 140) {
              const alpha = (1 - mdist / 140) * 0.6;
              ctx.beginPath();
              ctx.moveTo(actualX1, actualY1);
              ctx.lineTo(mousePos.x, mousePos.y);
              ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
              ctx.stroke();
            }
          }
        }
      }

      // C. Fireworks
      if (effects.fireworks) {
        if (currentTime - lastFireworkTime > 1800) {
          lastFireworkTime = currentTime;
          spawnFirework();
        }

        for (let i = fireworkSparks.length - 1; i >= 0; i--) {
          const s = fireworkSparks[i];
          s.x += s.vx * delta;
          s.y += s.vy * delta;
          s.vy += 0.04 * delta;
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

      // D. Lightning
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

      // F. Smooth Continuous Particle Flow (Falls all the way through bottom of viewport)
      const bottomPadding = 90; // Fall deep beyond the bottom of the screen
      const topPadding = 90;

      for (const p of particles) {
        p.baseX += p.speedX * delta;
        p.y += p.speedY * delta;
        p.phase += (p.swayFreq || 0.005) * 16.667 * delta;
        p.flipPhase += (p.flipSpeed || 0.01) * 16.667 * delta;

        if (p.rotationSpeed !== 0) {
          p.rotation += p.rotationSpeed * delta;
        }

        // Natural Sinusoidal Sway
        const renderX = p.swayRadius ? p.baseX + Math.sin(p.phase) * p.swayRadius : p.baseX;
        const renderY = p.y;

        // Fall all the way down past the bottom of the screen before re-entering at the top
        if (p.speedY > 0 && p.y > height + bottomPadding) {
          p.y = -topPadding - Math.random() * 80;
          p.baseX = Math.random() * (width + 120) - 60;
        } else if (p.speedY < 0 && p.y < -topPadding) {
          p.y = height + bottomPadding + Math.random() * 80;
          p.baseX = Math.random() * (width + 120) - 60;
        }

        if (p.baseX > width + 100) {
          p.baseX = -80;
        } else if (p.baseX < -100) {
          p.baseX = width + 80;
        }

        // Draw particle based on authentic vector shaders
        if (p.type === 'autumn_leaf') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const leafTilt = Math.sin(p.phase) * 0.4;
          const leaf3DFlip = Math.cos(p.flipPhase);
          ctx.rotate(((p.rotation + leafTilt * 45) * Math.PI) / 180);
          ctx.scale(leaf3DFlip, 1);
          drawMapleLeaf(ctx, p.size, p.color, p.opacity);
          ctx.restore();
        } else if (p.type === 'sakura') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const petal3DFlip = Math.cos(p.flipPhase);
          ctx.rotate(((p.rotation + Math.sin(p.phase) * 30) * Math.PI) / 180);
          ctx.scale(petal3DFlip, 1);
          drawSakuraPetal(ctx, p.size, p.opacity);
          ctx.restore();
        } else if (p.type === 'butterfly') {
          ctx.save();
          ctx.translate(renderX, renderY);
          const flap = Math.cos(p.flipPhase);
          const flightAngle = Math.atan2(p.speedY, p.speedX);
          ctx.rotate(flightAngle);
          drawButterfly(ctx, p.size, p.color, flap, p.opacity);
          ctx.restore();
        } else if (p.type === 'gold_coin') {
          ctx.save();
          ctx.translate(renderX, renderY);
          ctx.rotate((p.rotation * Math.PI) / 180);
          drawGoldCoin(ctx, p.size, p.flipPhase, p.opacity);
          ctx.restore();
        } else if (p.type === 'bubble') {
          ctx.save();
          ctx.translate(renderX, renderY);
          drawBubble(ctx, p.size, p.opacity);
          ctx.restore();
        } else if (p.type === 'firefly') {
          const breathingPulse = Math.sin(p.phase * 3) * 0.35 + 0.65;
          ctx.beginPath();
          ctx.arc(renderX, renderY, p.size * breathingPulse, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity * breathingPulse;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
        } else if (p.type === 'cyber_rain') {
          ctx.beginPath();
          ctx.moveTo(renderX, renderY);
          ctx.lineTo(renderX - 1.5, renderY + p.size);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.3;
          ctx.globalAlpha = p.opacity;
          ctx.stroke();
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

          if (p.type === 'neon' || p.type === 'volcano_ember') {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 7;
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
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
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
