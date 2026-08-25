import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAuthLoading, currentUser, showToast } = useStore();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl glass-standard border border-white/12 flex items-center justify-center shadow-xl shadow-[#7C3AED]/20">
          <Loader2 className="w-6 h-6 animate-spin text-[#C084FC]" />
        </div>
        <p className="text-xs font-bold text-[#938EB5] tracking-wider uppercase">Đang xác thực bảo mật...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Security Check: If route specifically requires Admin role
  if (requireAdmin && currentUser?.role !== 'admin') {
    showToast('Bạn không có quyền truy cập khu vực Quản trị Admin', 'error');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

