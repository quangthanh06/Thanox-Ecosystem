import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';
import { Toast } from '../Toast';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#08080F] text-[#F0EDFF] overflow-hidden font-sans selection:bg-[#7C3AED]/30 selection:text-white">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
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
