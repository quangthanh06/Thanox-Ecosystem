const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '..', 'public', 'thanox-robot-mascot.png');
const imgBase64 = fs.readFileSync(imgPath).toString('base64');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Background Squircle Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#141420" />
      <stop offset="60%" stop-color="#090910" />
      <stop offset="100%" stop-color="#020204" />
    </radialGradient>

    <!-- Neon Cyber Rim -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#06B6D4" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#A855F7" stop-opacity="0.9" />
    </linearGradient>

    <clipPath id="squircleClip">
      <rect x="12" y="12" width="488" height="488" rx="108" ry="108" />
    </clipPath>

    <filter id="cyberGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Ambient Glow Behind -->
  <rect x="24" y="24" width="464" height="464" rx="100" ry="100" fill="#7C3AED" opacity="0.3" filter="url(#cyberGlow)" />

  <!-- Base Dark Squircle -->
  <rect x="12" y="12" width="488" height="488" rx="108" ry="108" fill="url(#bgGrad)" />

  <!-- High-Res Robot Mascot Image -->
  <g clip-path="url(#squircleClip)">
    <image href="data:image/png;base64,${imgBase64}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid slice" />
  </g>

  <!-- Glowing Border Outline -->
  <rect x="12" y="12" width="488" height="488" rx="108" ry="108" stroke="url(#rimGrad)" stroke-width="8" fill="none" />
</svg>`;

const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('Successfully generated public/favicon.svg with high-res 3D mascot!');
