import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      {/* Backdrop with Optical Diffusion */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-200"
        onClick={onClose}
      />

      {/* iOS 27 Liquid Glass Dialog Box / Bottom Sheet on mobile */}
      <div
        className={`relative w-full ${sizeStyles[size]} glass-prominent max-sm:rounded-b-none rounded-3xl overflow-hidden z-10 flex flex-col max-h-[90vh] sm:max-h-[92vh] shadow-[0_30px_70px_rgba(0,0,0,0.85)] border border-white/14 transform transition-all duration-200`}
      >
        {/* Mobile Pull Bar Indicator */}
        <div className="sm:hidden w-full flex items-center justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Header with specular highlight */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/8 bg-white/[0.02] shrink-0">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-[#F4F2FF] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#938EB5] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-subtle hover:bg-white/10 flex items-center justify-center text-[#938EB5] hover:text-white transition-all cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-white/8 bg-white/[0.02] flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
