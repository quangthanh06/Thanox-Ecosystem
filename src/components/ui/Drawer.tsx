import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
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

  const widthStyles = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xl transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div
          className={`w-screen ${widthStyles[width]} glass-prominent border-l border-white/12 shadow-[0_30px_70px_rgba(0,0,0,0.85)] flex flex-col transform transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]`}
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4.5 border-b border-white/8 bg-white/[0.02] flex items-center justify-between shrink-0">
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

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-5 sm:px-6 py-4 border-t border-white/8 bg-white/[0.02] flex items-center justify-end gap-2.5 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
