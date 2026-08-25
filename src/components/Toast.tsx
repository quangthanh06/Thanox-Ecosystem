import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let borderCls = 'border-[#7C3AED]/35 shadow-[0_12px_30px_rgba(124,58,237,0.25)]';
        let icon = <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />;

        if (toast.type === 'success') {
          borderCls = 'border-emerald-500/35 shadow-[0_12px_30px_rgba(16,185,129,0.2)]';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />;
        } else if (toast.type === 'error') {
          borderCls = 'border-red-500/35 shadow-[0_12px_30px_rgba(239,68,68,0.2)]';
          icon = <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />;
        } else if (toast.type === 'warning') {
          borderCls = 'border-amber-500/35 shadow-[0_12px_30px_rgba(245,158,11,0.2)]';
          icon = <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />;
        } else {
          borderCls = 'border-cyan-500/35 shadow-[0_12px_30px_rgba(6,182,212,0.2)]';
          icon = <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl glass-prominent text-xs font-medium text-[#F4F2FF] transition-all transform animate-in fade-in slide-in-from-top-4 duration-200 border ${borderCls}`}
          >
            {icon}
            <div className="flex-1 leading-relaxed">
              {toast.title && <div className="font-bold text-sm mb-0.5 text-white">{toast.title}</div>}
              <div className="text-[#E2DEFA]">{toast.message}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Toast = ToastContainer;
