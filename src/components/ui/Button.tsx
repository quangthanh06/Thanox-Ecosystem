import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
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
    'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer rounded-xl active:scale-[0.98]';

  const sizeStyles = {
    xs: 'text-[11px] px-2.5 py-1 gap-1.5 h-7',
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8.5',
    md: 'text-xs px-4 py-2 gap-2 h-9.5',
    lg: 'text-sm px-5 py-2.5 gap-2.5 h-11',
  };

  const variantStyles = {
    primary:
      'bg-[#7C3AED] hover:bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(124,58,237,0.35)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] border border-white/10 focus-visible:ring-[#7C3AED]',
    secondary:
      'bg-[#161626] hover:bg-[#1E1E30] text-[#F0EDFF] border border-white/10 hover:border-white/20 focus-visible:ring-white/20',
    outline:
      'bg-transparent hover:bg-[#161626] text-[#F0EDFF] border border-white/15 hover:border-white/30 focus-visible:ring-white/20',
    ghost:
      'bg-transparent hover:bg-white/5 text-[#8B84A8] hover:text-[#F0EDFF] focus-visible:ring-white/10',
    danger:
      'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 hover:border-red-500/40 focus-visible:ring-red-500/30',
    success:
      'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 hover:border-emerald-500/40 focus-visible:ring-emerald-500/30',
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
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
