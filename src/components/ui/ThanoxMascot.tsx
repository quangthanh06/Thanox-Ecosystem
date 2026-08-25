import React from 'react';

export interface ThanoxMascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  isAnimated?: boolean;
}

/**
 * Thanox Mascot — Cyber Digital Assistant Avatar
 * Exclusive Thanox brand mascot with dark, white, violet, and cyan palette.
 */
export const ThanoxMascot: React.FC<ThanoxMascotProps> = ({
  size = 'md',
  className = '',
  isAnimated = true,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeMap[size]} ${
        isAnimated ? 'animate-[bounce_4s_ease-in-out_infinite]' : ''
      } ${className}`}
      style={isAnimated ? { animation: 'thanoxFloat 3.5s ease-in-out infinite' } : undefined}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_16px_rgba(124,58,237,0.35)]"
      >
        <defs>
          <linearGradient id="thanox_body_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A2A48" />
            <stop offset="50%" stopColor="#141426" />
            <stop offset="100%" stopColor="#0B0B18" />
          </linearGradient>

          <linearGradient id="thanox_visor_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          <linearGradient id="thanox_ear_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          <radialGradient id="thanox_eye_glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Core Glow */}
        <circle cx="32" cy="32" r="28" fill="#7C3AED" fillOpacity="0.12" filter="blur(4px)" />

        {/* Cyber Ears / Side Nodes */}
        <rect x="6" y="24" width="6" height="14" rx="3" fill="url(#thanox_ear_grad)" />
        <rect x="52" y="24" width="6" height="14" rx="3" fill="url(#thanox_ear_grad)" />

        {/* Top Digital Antenna */}
        <path d="M32 6V13" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="5" r="3.5" fill="#22D3EE" className="animate-pulse" />

        {/* Main Head Base Frame */}
        <rect
          x="10"
          y="12"
          width="44"
          height="40"
          rx="18"
          fill="url(#thanox_body_grad)"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.5"
        />

        {/* Specular Head Highlight */}
        <path
          d="M18 16C22 14.5 42 14.5 46 16"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Dark Visor Screen */}
        <rect
          x="14"
          y="20"
          width="36"
          height="22"
          rx="11"
          fill="#07070F"
          stroke="rgba(6, 182, 212, 0.35)"
          strokeWidth="1"
        />

        {/* Cyber Visor Glow Accent */}
        <path
          d="M17 23C21 21.5 43 21.5 47 23"
          stroke="url(#thanox_visor_grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Dynamic Digital Eyes */}
        <g>
          {/* Left Eye */}
          <rect x="22" y="27" width="5" height="7" rx="2.5" fill="#22D3EE" />
          <circle cx="24.5" cy="30.5" r="4.5" fill="url(#thanox_eye_glow)" opacity="0.85" />

          {/* Right Eye */}
          <rect x="37" y="27" width="5" height="7" rx="2.5" fill="#22D3EE" />
          <circle cx="39.5" cy="30.5" r="4.5" fill="url(#thanox_eye_glow)" opacity="0.85" />
        </g>

        {/* Cute Cyber Smile / Mouth Beam */}
        <path
          d="M28 37C29.5 38.5 34.5 38.5 36 37"
          stroke="#7C3AED"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Chest Plate / Base Collar */}
        <path
          d="M20 52L24 58H40L44 52"
          fill="#16162A"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1"
        />
        <circle cx="32" cy="55" r="1.5" fill="#22D3EE" />
      </svg>
    </div>
  );
};
