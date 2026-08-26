import React from 'react';
import { useStore } from '../../context/StoreContext';
import { LogoSettings } from '../../types';

export interface BrandLogoProps {
  className?: string;
  sizeOverride?: 'sm' | 'md' | 'lg' | 'xl';
  showBorderOverride?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  sizeOverride,
  showBorderOverride,
}) => {
  const { settings } = useStore();
  const logoCfg: LogoSettings = settings.logoSettings || {
    logoUrl: '/thanox-logo.webp',
    showBorder: false,
    borderStyle: 'purple_cyan',
    borderGlow: false,
    shape: 'squircle',
    size: 'md',
    scale: 110,
  };

  const showBorder = showBorderOverride !== undefined ? showBorderOverride : Boolean(logoCfg.showBorder);
  const size = sizeOverride || logoCfg.size || 'md';
  const shape = logoCfg.shape || 'squircle';
  const borderStyle = logoCfg.borderStyle || 'purple_cyan';
  const rawLogoUrl = logoCfg.logoUrl || '/thanox-logo.webp';
  const logoUrl = rawLogoUrl === '/thanox-logo.png' ? '/thanox-logo.webp' : rawLogoUrl;
  const scalePercent = logoCfg.scale || 110;

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  }[size];

  // Shape classes
  const shapeClass = {
    squircle: 'rounded-2xl',
    circle: 'rounded-full',
    rounded: 'rounded-xl',
    square: 'rounded-lg',
  }[shape];

  const innerShapeClass = {
    squircle: 'rounded-[14px]',
    circle: 'rounded-full',
    rounded: 'rounded-[10px]',
    square: 'rounded-[6px]',
  }[shape];

  // Border gradient style
  const borderGradients: Record<string, string> = {
    purple_cyan: 'bg-gradient-to-br from-[#7C3AED] via-[#9D5CF6] to-[#06B6D4]',
    cyan: 'bg-gradient-to-br from-[#06B6D4] via-[#22D3EE] to-[#38BDF8]',
    purple: 'bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#C084FC]',
    gold: 'bg-gradient-to-br from-[#F59E0B] via-[#FBBF24] to-[#FDE68A]',
    emerald: 'bg-gradient-to-br from-[#10B981] via-[#34D399] to-[#6EE7B7]',
    crimson: 'bg-gradient-to-br from-[#EF4444] via-[#F43F5E] to-[#FB7185]',
    none: 'bg-transparent',
  };

  const borderGrad = borderGradients[borderStyle] || borderGradients.purple_cyan;
  const glowShadow = logoCfg.borderGlow && showBorder ? 'shadow-[0_0_20px_rgba(124,58,237,0.6)]' : 'shadow-md';

  const logoElement = (
    <picture className="w-full h-full flex items-center justify-center">
      {logoUrl.includes('thanox-logo') && (
        <>
          <source type="image/avif" srcSet="/thanox-logo.avif" />
          <source type="image/webp" srcSet="/thanox-logo.webp" />
        </>
      )}
      <img
        src={logoUrl}
        alt="Thanox Logo"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        style={{ transform: `scale(${scalePercent / 100})` }}
        className={`w-full h-full object-cover object-center ${shapeClass} transition-transform duration-300 group-hover:scale-125`}
      />
    </picture>
  );

  if (!showBorder || borderStyle === 'none') {
    return (
      <div
        className={`${sizeClasses} ${shapeClass} overflow-hidden bg-transparent flex items-center justify-center shrink-0 ${className}`}
      >
        {logoElement}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} ${shapeClass} ${borderGrad} p-[1.5px] ${glowShadow} shrink-0 transition-all group-hover:scale-105 ${className}`}
    >
      <div
        className={`w-full h-full bg-[#080811] ${innerShapeClass} flex items-center justify-center overflow-hidden`}
      >
        {logoElement}
      </div>
    </div>
  );
};

export default BrandLogo;
