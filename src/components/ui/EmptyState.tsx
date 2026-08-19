import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-[#0F0F1A]/50 border border-white/5 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-[#161626] border border-white/10 text-[#9D5CF6] flex items-center justify-center shadow-lg shadow-[#7C3AED]/5">
        {icon}
      </div>

      <div className="max-w-md space-y-1.5">
        <h4 className="font-display font-semibold text-base text-[#F0EDFF]">{title}</h4>
        <p className="text-xs text-[#6B658E] leading-relaxed">{description}</p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2.5 pt-2">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
