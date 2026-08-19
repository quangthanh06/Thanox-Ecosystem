import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { PageId } from '../types';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  FolderTree,
  ShoppingBag,
  Wallet,
  ArrowLeftRight,
  Share2,
  Users,
  HeadphonesIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Sparkles,
  RotateCcw,
  X,
} from 'lucide-react';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeVariant?: 'brand' | 'warning' | 'danger' | 'success';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    isSidebarOpen,
    setIsSidebarOpen,
    orders,
    topups,
    tickets,
    navigateToStorefront,
    navigateToAdmin,
  } = useStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic counts for badge indicators
  const pendingOrders = orders.filter((o) => o.status === 'processing' || o.status === 'pending').length;
  const pendingTopups = topups.filter((t) => t.status === 'pending').length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;

  const navGroups: NavGroup[] = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard', label: 'Bảng Điều Khiển', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'analytics', label: 'Thống Kê & Báo Cáo', icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'BÁN HÀNG & KHO',
      items: [
        { id: 'products', label: 'Sản Phẩm', icon: <Package className="w-4 h-4" /> },
        { id: 'categories', label: 'Danh Mục', icon: <FolderTree className="w-4 h-4" /> },
        {
          id: 'orders',
          label: 'Đơn Hàng',
          icon: <ShoppingBag className="w-4 h-4" />,
          badge: pendingOrders > 0 ? pendingOrders : undefined,
          badgeVariant: 'brand',
        },
      ],
    },
    {
      title: 'TÀI CHÍNH & ĐỐI TÁC',
      items: [
        {
          id: 'wallet',
          label: 'Ví Tiền & Nạp Rút',
          icon: <Wallet className="w-4 h-4" />,
          badge: pendingTopups > 0 ? pendingTopups : undefined,
          badgeVariant: 'warning',
        },
        { id: 'transactions', label: 'Lịch Sử Giao Dịch', icon: <ArrowLeftRight className="w-4 h-4" /> },
        { id: 'affiliate', label: 'Tiếp Thị Liên Kết', icon: <Share2 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'QUẢN TRỊ & HỆ THỐNG',
      items: [
        { id: 'users', label: 'Người Dùng', icon: <Users className="w-4 h-4" /> },
        {
          id: 'support',
          label: 'Hỗ Trợ Khách Hàng',
          icon: <HeadphonesIcon className="w-4 h-4" />,
          badge: openTickets > 0 ? openTickets : undefined,
          badgeVariant: 'danger',
        },
        { id: 'settings', label: 'Cài Đặt Hệ Thống', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const handleNavClick = (pageId: PageId) => {
    navigateToAdmin(pageId);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 h-full shrink-0
          bg-[#0F0F1A] border-r border-white/5 flex flex-col justify-between
          transition-all duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-[252px] w-[270px]'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <div
            onClick={() => navigateToAdmin('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#9D5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm tracking-wider text-[#F0EDFF]">
                    THANOX
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-[#7C3AED]/20 text-[#A78BFA] font-bold border border-[#7C3AED]/30">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] text-[#6B658E] tracking-tight">Admin System Pro</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-[#161626] border border-white/5 items-center justify-center text-[#8B84A8] hover:text-white hover:bg-[#1E1E30] transition-colors"
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-[#161626] border border-white/5 flex items-center justify-center text-[#8B84A8] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold text-[#4E4A6F] uppercase tracking-wider">
                  {group.title}
                </div>
              )}

              {group.items.map((item) => {
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 relative group cursor-pointer
                      ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'}
                      ${
                        isActive
                          ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/35 shadow-[0_0_20px_rgba(124,58,237,0.15)] font-bold'
                          : 'text-[#8B84A8] hover:text-[#F0EDFF] hover:bg-[#161626]/80'
                      }
                    `}
                  >
                    {/* Active Left indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#9D5CF6] shadow-[0_0_8px_#9D5CF6]" />
                    )}

                    <div
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-[#9D5CF6]' : 'text-[#6B658E] group-hover:text-[#F0EDFF]'
                      }`}
                    >
                      {item.icon}
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              item.badgeVariant === 'warning'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                : item.badgeVariant === 'danger'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Actions: Storefront preview trigger & Admin Profile */}
        <div className="p-3 border-t border-white/5 space-y-2 shrink-0 bg-[#0A0A13]">
          {/* Quick Storefront Button */}
          <button
            onClick={() => navigateToStorefront('home')}
            className={`
              w-full rounded-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#06B6D4]/20 border border-[#7C3AED]/30 hover:border-[#7C3AED]/60 text-white font-semibold text-xs transition-all flex items-center cursor-pointer
              ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-2.5'}
            `}
            title="Xem giao diện Cửa Hàng Khách Hàng"
          >
            <Sparkles className="w-4 h-4 text-[#06B6D4] shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <div className="text-[11.5px] font-bold text-[#F0EDFF] truncate">Xem Cửa Hàng</div>
                <div className="text-[10px] text-[#06B6D4] truncate">Preview Storefront</div>
              </div>
            )}
          </button>

          {/* Admin User info card */}
          <div
            className={`flex items-center rounded-xl bg-[#161626]/60 border border-white/5 ${
              isCollapsed ? 'justify-center p-2' : 'p-2.5 gap-2.5'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              AD
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-semibold text-[#F0EDFF] truncate">Admin Thanox</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Super Admin
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
