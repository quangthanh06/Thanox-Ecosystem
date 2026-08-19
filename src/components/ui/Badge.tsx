import React from 'react';

export interface BadgeProps {
  variant?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className = '',
}) => {
  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  const variantStyles = {
    brand: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
    accent: 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    neutral: 'bg-white/5 text-[#8B84A8] border-white/10',
  };

  const dotColors = {
    brand: 'bg-[#A78BFA]',
    accent: 'bg-[#22D3EE]',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
    neutral: 'bg-[#8B84A8]',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border whitespace-nowrap select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`} />}
      {children}
    </span>
  );
};
