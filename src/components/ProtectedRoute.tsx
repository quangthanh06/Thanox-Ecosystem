import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser, showToast } = useStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Security Check: Only admin can access protected admin route
  if (currentUser.role !== 'admin') {
    showToast('Bạn không có quyền truy cập khu vực Quản trị Admin', 'error');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
