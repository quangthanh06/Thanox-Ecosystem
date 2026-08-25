import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glow' | 'interactive' | 'subtle';
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
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    default: 'glass-standard',
    elevated: 'glass-elevated',
    subtle: 'glass-subtle',
    glow: 'glass-standard border-[#7C3AED]/40 shadow-[0_0_30px_rgba(124,58,237,0.18)]',
    interactive: 'glass-standard glass-interactive cursor-pointer',
  };

  return (
    <div
      className={`rounded-3xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
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
    <div className={`flex items-center justify-between gap-3 pb-4 border-b border-white/6 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-8.5 h-8.5 rounded-2xl glass-subtle border border-white/8 flex items-center justify-center text-[#C084FC] shrink-0 shadow-sm">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-display font-bold text-sm sm:text-base text-[#F4F2FF] truncate tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-[#938EB5] mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
