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
    brand: 'bg-[#7C3AED]/15 text-[#C084FC] border-[#7C3AED]/30 shadow-[0_0_10px_rgba(124,58,237,0.15)]',
    accent: 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    danger: 'bg-red-500/15 text-red-300 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]',
    info: 'bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
    neutral: 'bg-white/6 text-[#938EB5] border-white/10 shadow-sm',
  };

  const dotColors = {
    brand: 'bg-[#C084FC] shadow-[0_0_6px_#C084FC]',
    accent: 'bg-[#22D3EE] shadow-[0_0_6px_#22D3EE]',
    success: 'bg-emerald-400 shadow-[0_0_6px_#34D399]',
    warning: 'bg-amber-400 shadow-[0_0_6px_#FBBF24]',
    danger: 'bg-red-400 shadow-[0_0_6px_#F87171]',
    info: 'bg-blue-400 shadow-[0_0_6px_#60A5FA]',
    neutral: 'bg-[#938EB5]',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border whitespace-nowrap select-none backdrop-blur-md ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`} />}
      {children}
    </span>
  );
};
