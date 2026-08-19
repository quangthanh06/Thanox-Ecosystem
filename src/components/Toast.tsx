import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let borderCls = 'border-purple-500/30 bg-[#161626]';
        let icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;

        if (toast.type === 'success') {
          borderCls = 'border-emerald-500/40 bg-[#121c22]';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          borderCls = 'border-red-500/40 bg-[#221216]';
          icon = <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          borderCls = 'border-amber-500/40 bg-[#221c12]';
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
        } else {
          borderCls = 'border-cyan-500/40 bg-[#121e26]';
          icon = <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium text-[#F0EDFF] transition-all animate-in fade-in slide-in-from-right-5 duration-200 ${borderCls}`}
          >
            {icon}
            <div className="flex-1 leading-snug">
              {toast.title && <div className="font-semibold text-sm mb-0.5 text-white">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Toast = ToastContainer;

