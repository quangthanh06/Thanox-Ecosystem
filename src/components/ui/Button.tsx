import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold select-none cursor-pointer transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#08080E] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.965] tracking-tight';

  const sizeStyles = {
    xs: 'text-[11px] px-3 py-1.5 gap-1.5 min-h-[32px] rounded-xl',
    sm: 'text-xs px-3.5 py-2 gap-1.5 min-h-[38px] rounded-2xl',
    md: 'text-xs sm:text-sm px-5 py-2.5 gap-2 min-h-[44px] rounded-2xl',
    lg: 'text-sm sm:text-base px-6 py-3.5 gap-2.5 min-h-[48px] rounded-3xl',
  };

  const variantStyles = {
    primary:
      'btn-liquid-primary focus-visible:ring-[#7C3AED]/70',
    secondary:
      'btn-liquid-secondary focus-visible:ring-white/20',
    glass:
      'glass-subtle hover:bg-white/10 text-[#F4F2FF] border border-white/12 hover:border-white/20 shadow-md focus-visible:ring-white/20',
    outline:
      'bg-transparent hover:bg-white/5 text-[#F4F2FF] border border-white/15 hover:border-white/30 focus-visible:ring-white/20',
    ghost:
      'bg-transparent hover:bg-white/6 text-[#938EB5] hover:text-[#F4F2FF] focus-visible:ring-white/10 active:bg-white/10',
    danger:
      'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 hover:border-red-500/50 shadow-sm shadow-red-500/10 focus-visible:ring-red-500/40',
    success:
      'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm shadow-emerald-500/10 focus-visible:ring-emerald-500/40',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
