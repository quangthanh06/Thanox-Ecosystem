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
  X,
  Music,
  QrCode,
  Wrench,
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
    isSidebarOpen,
    setIsSidebarOpen,
    orders,
    topups,
    tickets,
    settings,
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
      title: 'GIAO DIỆN & TÙY BIẾN',
      items: [
        { id: 'theme-settings', label: 'Banner & Phông Chữ', icon: <Sparkles className="w-4 h-4 text-[#C084FC]" /> },
        { id: 'music-settings', label: 'Quản Lý Nhạc Nền', icon: <Music className="w-4 h-4 text-pink-400" /> },
      ],
    },
    {
      title: 'HỆ THỐNG & BẢO MẬT',
      items: [
        { id: 'payment-settings', label: 'Cổng Nạp VietQR', icon: <QrCode className="w-4 h-4 text-cyan-400" /> },
        {
          id: 'maintenance-settings',
          label: 'Bảo Trì & Zalo Admin',
          icon: <Wrench className="w-4 h-4 text-amber-400" />,
          badge: settings.maintenanceMode ? 'BẬT' : undefined,
          badgeVariant: 'danger',
        },
        { id: 'security-settings', label: 'Trung Tâm Bảo Mật', icon: <Shield className="w-4 h-4 text-emerald-400" /> },
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
      {/* Mobile Backdrop with Optical Diffusion */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xl z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* iOS 27 Liquid Glass Sidebar Container */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 h-full shrink-0
          glass-prominent border-r border-white/8 flex flex-col justify-between
          transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[76px]' : 'lg:w-[256px] w-[275px]'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/6 shrink-0 bg-white/[0.01]">
          <div
            onClick={() => navigateToAdmin('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#9D5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_16px_rgba(124,58,237,0.45)] border border-white/20 shrink-0 transform group-hover:scale-105 transition-transform">
              <Zap className="w-4.5 h-4.5 fill-current" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-sm tracking-wider text-[#F4F2FF]">
                    THANOX
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#7C3AED]/20 text-[#C084FC] font-bold border border-[#7C3AED]/30">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] text-[#938EB5] tracking-tight">Admin System Pro</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-xl glass-subtle hover:bg-white/10 items-center justify-center text-[#938EB5] hover:text-white transition-all cursor-pointer active:scale-90"
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-full glass-subtle hover:bg-white/10 flex items-center justify-center text-[#938EB5] hover:text-white cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 custom-scrollbar">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[9.5px] font-black text-[#5C567A] uppercase tracking-wider">
                  {group.title}
                </div>
              )}

              {group.items.map((item) => {
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? undefined : undefined}
                    className={`
                      w-full flex items-center rounded-2xl text-xs font-semibold transition-all duration-200 relative group cursor-pointer active:scale-[0.97]
                      ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-3'}
                      ${
                        isActive
                          ? 'bg-[#7C3AED]/22 text-white border border-[#7C3AED]/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_0_24px_rgba(124,58,237,0.28)] font-bold'
                          : 'text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/[0.05]'
                      }
                    `}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#C084FC] shadow-[0_0_10px_#C084FC]" />
                    )}

                    <div
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-[#C084FC]' : 'text-[#726C96] group-hover:text-[#F4F2FF]'
                      }`}
                    >
                      {item.icon}
                    </div>

                    {/* Floating Tooltip when Collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl glass-prominent text-white text-xs font-bold whitespace-nowrap shadow-[0_12px_32px_rgba(0,0,0,0.85)] border border-white/14 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#7C3AED]/30 text-[#C084FC] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.badgeVariant === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                : item.badgeVariant === 'danger'
                                ? 'bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                : 'bg-[#7C3AED]/20 text-[#C084FC] border-[#7C3AED]/30'
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
        <div className="p-3 border-t border-white/6 space-y-2 shrink-0 bg-white/[0.01]">
          {/* Quick Storefront Button */}
          <button
            onClick={() => navigateToStorefront('home')}
            className={`
              w-full rounded-2xl bg-gradient-to-r from-[#7C3AED]/15 via-[#9D5CF6]/10 to-[#06B6D4]/15 border border-[#7C3AED]/30 hover:border-[#7C3AED]/50 text-white font-semibold text-xs transition-all flex items-center cursor-pointer active:scale-95 shadow-sm
              ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-2.5'}
            `}
            title="Xem giao diện Cửa Hàng Khách Hàng"
          >
            <Sparkles className="w-4 h-4 text-[#22D3EE] shrink-0 animate-pulse" />
            {!isCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <div className="text-[11.5px] font-bold text-[#F4F2FF] truncate">Xem Cửa Hàng</div>
                <div className="text-[10px] text-[#22D3EE] truncate">Preview Storefront →</div>
              </div>
            )}
          </button>

          {/* Admin User info card */}
          <div
            className={`flex items-center rounded-2xl glass-subtle border border-white/6 ${
              isCollapsed ? 'justify-center p-2' : 'p-2.5 gap-2.5'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0">
              AD
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-bold text-[#F4F2FF] truncate">Admin Thanox</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]"></span> Super Admin
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
