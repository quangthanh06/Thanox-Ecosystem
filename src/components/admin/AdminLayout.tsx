import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';
import { Toast } from '../Toast';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#07070D] text-[#F4F2FF] overflow-hidden font-sans selection:bg-[#7C3AED]/30 selection:text-white relative">
      {/* Subtle ambient lighting layer */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[350px] bg-[#7C3AED]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[400px] bg-[#06B6D4]/06 rounded-full blur-[140px]" />
      </div>

      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 custom-scrollbar">
          <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global Notifications Toast Container */}
      <Toast />
    </div>
  );
};
