import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glow' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6 sm:p-7',
  };

  const variantStyles = {
    default: 'bg-[#0F0F1A] border border-white/5 shadow-xl',
    elevated: 'bg-[#161626] border border-white/10 shadow-2xl',
    glow: 'bg-[#0F0F1A] border border-[#7C3AED]/30 shadow-[0_0_30px_rgba(124,58,237,0.12)]',
    interactive:
      'bg-[#0F0F1A] border border-white/5 hover:border-[#7C3AED]/40 hover:bg-[#161626]/80 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-0.5',
  };

  return (
    <div
      className={`rounded-2xl backdrop-blur-sm ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className = '' }) => {
  return (
    <div className={`flex items-center justify-between gap-3 pb-4 border-b border-white/5 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <div className="text-[#9D5CF6] shrink-0">{icon}</div>}
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-sm text-[#F0EDFF] truncate">{title}</h3>
          {subtitle && <p className="text-xs text-[#6B658E] mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
