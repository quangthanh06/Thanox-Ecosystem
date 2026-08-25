import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'danger',
  isLoading = false,
}) => {
  const icon =
    variant === 'danger' ? (
      <div className="w-10 h-10 rounded-2xl bg-red-500/12 text-red-400 border border-red-500/25 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
        <AlertTriangle className="w-5 h-5" />
      </div>
    ) : variant === 'warning' ? (
      <div className="w-10 h-10 rounded-2xl bg-amber-500/12 text-amber-300 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
        <AlertTriangle className="w-5 h-5" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/12 text-[#C084FC] border border-[#7C3AED]/25 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(124,58,237,0.2)]">
        <Info className="w-5 h-5" />
      </div>
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        {icon}
        <div className="text-xs text-[#938EB5] leading-relaxed pt-1">{message}</div>
      </div>
    </Modal>
  );
};
