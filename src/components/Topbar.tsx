import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { CommandPalette } from './ui/CommandPalette';
import { MenuIcon } from './ui/MenuIcon';
import {
  Search,
  Bell,
  CheckCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ShoppingBag,
  Sliders,
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    toggleSidebar,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    resetToDefaultData,
    resetToZeroData,
    navigateToStorefront,
  } = useStore();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Global ⌘K or Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Bảng Điều Khiển', subtitle: 'Tổng quan hoạt động kinh doanh & doanh thu' },
    analytics: { title: 'Thống Kê & Phân Tích', subtitle: 'Báo cáo hiệu suất tăng trưởng và xu hướng' },
    products: { title: 'Quản Lý Sản Phẩm', subtitle: 'Danh sách sản phẩm số, file game & mã bản quyền' },
    categories: { title: 'Danh Mục Sản Phẩm', subtitle: 'Phân loại nhóm tệp tin và menu hỗ trợ' },
    orders: { title: 'Quản Lý Đơn Hàng', subtitle: 'Theo dõi đơn mua hàng và bàn giao key tự động' },
    wallet: { title: 'Ví Tiền & Nạp Rút', subtitle: 'Duyệt yêu cầu nạp Momo, VNPay & Chuyển khoản VietQR' },
    transactions: { title: 'Lịch Sử Giao Dịch', subtitle: 'Sao kê toàn bộ dòng tiền biến động trên hệ thống' },
    affiliate: { title: 'Tiếp Thị Liên Kết (Affiliate)', subtitle: 'Quản lý đối tác cộng tác viên & hoa hồng giới thiệu' },
    users: { title: 'Quản Lý Người Dùng', subtitle: 'Danh bạ thành viên, phân quyền VIP và số dư ví' },
    support: { title: 'Trung Tâm Hỗ Trợ', subtitle: 'Kênh tiếp nhận và giải quyết ticket khiếu nại khách hàng' },
    settings: { title: 'Cài Đặt Hệ Thống', subtitle: 'Cấu hình cửa hàng, cổng thanh toán và bảo mật' },
  };

  const currentInfo = pageTitles[currentPage] || { title: 'Quản Trị', subtitle: 'Bảng điều khiển Thanox' };

  return (
    <>
      <header className="h-16 glass-prominent border-b border-white/8 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
        {/* Left: Mobile Hamburger & Breadcrumb */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={toggleSidebar}
            aria-label="Mở thanh điều hướng"
            className="lg:hidden w-9 h-9 rounded-2xl glass-subtle hover:bg-white/10 flex items-center justify-center text-[#938EB5] hover:text-white cursor-pointer active:scale-90 transition-all border border-white/8 group"
          >
            <MenuIcon size={18} strokeWidth={2.2} animateOnHover />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-[10.5px] text-[#5C567A]">
              <span>Thanox</span>
              <span>/</span>
              <span className="text-[#C084FC] font-semibold">{currentInfo.title}</span>
            </div>
            <h1 className="font-display font-bold text-sm sm:text-base text-[#F4F2FF] truncate tracking-tight">
              {currentInfo.title}
            </h1>
          </div>
        </div>

        {/* Right Actions: Command Search, Live Status, Notifs, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button (⌘K) */}
          <button
            onClick={() => setIsCommandOpen(true)}
            aria-label="Tìm kiếm nhanh hệ thống"
            className="hidden md:flex items-center gap-2.5 h-9.5 glass-input hover:border-white/20 rounded-2xl px-3.5 text-xs text-[#938EB5] hover:text-[#F4F2FF] transition-all cursor-pointer w-48 sm:w-60 shadow-sm active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="flex-1 text-left truncate">Tìm kiếm nhanh...</span>
            <kbd className="text-[10px] glass-pill px-2 py-0.5 rounded-lg font-mono text-[#938EB5] border border-white/8">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setIsCommandOpen(true)}
            aria-label="Mở tìm kiếm nhanh"
            className="md:hidden w-9 h-9 rounded-2xl glass-subtle flex items-center justify-center text-[#938EB5] hover:text-white cursor-pointer active:scale-90 border border-white/8"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Live System Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-[11px] font-semibold text-emerald-300 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse"></span>
            <span>Online</span>
          </div>

          {/* Notifications Center Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="Xem thông báo hệ thống"
              className="w-9 h-9 rounded-2xl glass-subtle hover:bg-white/10 flex items-center justify-center text-[#938EB5] hover:text-[#F4F2FF] relative transition-all cursor-pointer active:scale-90 border border-white/8"
              title="Thông báo hệ thống"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#7C3AED] text-white text-[9px] font-black flex items-center justify-center border-2 border-[#07070D] shadow-[0_0_8px_#7C3AED]">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 glass-prominent rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/14 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-xs text-[#F4F2FF]">Thông Báo</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#7C3AED]/20 text-[#C084FC] font-bold border border-[#7C3AED]/30">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-[#C084FC] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#938EB5]">Không có thông báo nào</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3.5 text-xs transition-colors cursor-pointer flex gap-3 items-start ${
                          n.read ? 'opacity-55 hover:bg-white/[0.04]' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-xl bg-[#7C3AED]/20 text-[#C084FC] flex items-center justify-center shrink-0 mt-0.5 border border-[#7C3AED]/30">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#F4F2FF] truncate">{n.title}</div>
                          <div className="text-[11px] text-[#938EB5] line-clamp-2 mt-0.5">
                            {n.description}
                          </div>
                          <div className="text-[10px] text-[#5C567A] mt-1">{n.time}</div>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0 mt-1.5 shadow-[0_0_6px_#7C3AED]" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Data Reset Actions Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl glass-subtle hover:bg-white/10 transition-all cursor-pointer active:scale-95"
            >
              <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                AD
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#938EB5]" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-prominent rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/14 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/8 mb-1">
                  <div className="font-bold text-xs text-[#F4F2FF]">Admin Thanox</div>
                  <div className="text-[10.5px] text-[#938EB5]">admin@thanox.vn</div>
                </div>

                <button
                  onClick={() => {
                    navigateToStorefront('home');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#22D3EE] hover:bg-[#06B6D4]/10 transition-colors text-left cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Xem Cửa Hàng Khách</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentPage('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Cài Đặt Hệ Thống</span>
                </button>

                <div className="pt-1 border-t border-white/8 my-1" />

                <button
                  onClick={() => {
                    resetToZeroData();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa Trắng (Về 0)</span>
                </button>

                <button
                  onClick={() => {
                    resetToDefaultData();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 transition-colors text-left cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nạp Dữ Liệu Mẫu</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette Search Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};
