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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`w-screen ${widthStyles[width]} bg-[#0F0F1A] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250`}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 bg-[#161626]/50 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-display font-semibold text-base text-[#F0EDFF]">{title}</h3>
              {subtitle && <p className="text-xs text-[#6B658E] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#161626] border border-white/5 flex items-center justify-center text-[#8B84A8] hover:text-white hover:bg-[#1E1E30] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-4 border-t border-white/5 bg-[#161626]/30 flex items-center justify-end gap-2.5 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
