import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { MenuIcon } from '../ui/MenuIcon';
import { Toast } from '../Toast';
import {
  Flame,
  ShoppingCart,
  Zap,
  User,
  Shield,
  Send,
  MessageCircle,
  Menu,
  X,
  ChevronDown,
  Layers,
  Sparkles,
  LogIn,
  UserPlus,
  LogOut,
  Package,
  Wrench,
  UserCheck,
  Wallet,
  ArrowRight,
} from 'lucide-react';

import { MusicPlayer } from './MusicPlayer';
import { getThemeTypography } from '../../utils/themeStyles';
import { StorefrontMaintenanceScreen } from './StorefrontMaintenanceScreen';

export const StorefrontLayout: React.FC = () => {
  const {
    storefrontPage,
    navigateToStorefront,
    navigateToAdmin,
    currentUser,
    isAuthenticated,
    logout,
    cart,
    settings,
  } = useStore();

  const themeTypo = getThemeTypography(settings);

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    setAccountDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  // If maintenance mode is active and user is not admin, exempt auth routes so admin can log in
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  if (settings.maintenanceMode && currentUser?.role !== 'admin' && !isAuthRoute) {
    return (
      <div className="min-h-screen bg-[#07070D] text-[#F4F2FF] flex flex-col justify-center items-center font-sans">
        <StorefrontMaintenanceScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070D] text-[#F4F2FF] flex flex-col font-sans selection:bg-[#7C3AED]/30 selection:text-white relative">
      {/* Subtle ambient lighting layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] left-[25%] w-[600px] h-[350px] bg-[#7C3AED]/08 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-5%] w-[500px] h-[400px] bg-[#06B6D4]/05 rounded-full blur-[150px]" />
      </div>

      {/* Admin Maintenance Bypass Notice Header Bar */}
      {settings.maintenanceMode && currentUser?.role === 'admin' && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-center text-xs font-semibold text-amber-200 flex items-center justify-center gap-2 z-50">
          <Wrench className="w-4 h-4 text-amber-300" />
          <span>Hệ thống đang BẬT BẢO TRÌ. Bạn đang xem với quyền Quản Trị Viên (Bypass).</span>
          <button
            type="button"
            onClick={() => navigateToAdmin('maintenance-settings')}
            className="underline ml-2 bg-black text-amber-300 px-3 py-0.5 rounded-lg hover:bg-zinc-900 cursor-pointer transition-all text-xs font-bold"
          >
            Vào Tắt Bảo Trì →
          </button>
        </div>
      )}

      {/* 1. TOP ANNOUNCEMENT BAR (Apple-Inspired iOS 27 Liquid Glass) */}
      {(settings.announcementBar?.enabled ?? settings.announcementEnabled) && (
        <aside
          aria-label="Thông báo hệ thống"
          className="relative z-30 bg-[#0A0A14]/80 backdrop-blur-md border-b border-white/[0.06] text-[#E2DEFA] text-[11px] sm:text-xs font-medium h-[36px] px-3 sm:px-6 flex items-center justify-center transition-colors shadow-[0_1px_0_0_rgba(255,255,255,0.03)]"
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-center gap-2 overflow-hidden select-none">
            <Sparkles className="w-3 h-3 text-[#22D3EE] shrink-0 opacity-80" />
            <span className="truncate font-normal text-[#F4F2FF]/90 tracking-wide">
              {settings.announcementBar?.text || settings.announcementText || 'Khuyến mãi nạp tiền tự động qua VietQR — Giao key tức thì 24/7!'}
            </span>
            {(settings.announcementBar?.linkText || 'Xem Ngay') && (
              <button
                type="button"
                onClick={() => navigateToStorefront('account-wallet-deposit')}
                className="group inline-flex items-center gap-1 font-semibold text-[#22D3EE] hover:text-[#38BDF8] transition-all cursor-pointer shrink-0 ml-1 text-[11px] sm:text-xs active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22D3EE] rounded"
              >
                <span>{settings.announcementBar?.linkText || 'Xem Ngay'}</span>
                <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* 2. MAIN STOREFRONT NAVBAR (iOS 27 Liquid Glass Sticky Header) */}
      <header className="sticky top-0 z-40 glass-prominent border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigateToStorefront('home')}
              className="flex items-center gap-2.5 cursor-pointer text-left group select-none"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#9D5CF6] to-[#06B6D4] p-0.5 shadow-lg shadow-[#7C3AED]/25 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all shrink-0">
                <div className="w-full h-full bg-[#0B0B14] rounded-[14px] flex items-center justify-center p-1 overflow-hidden">
                  <img src="/favicon.svg" alt="Thanox Flame 3D" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span
                  className={`${themeTypo.logoClass} text-xl sm:text-[22px] tracking-wider uppercase leading-tight font-black`}
                  style={themeTypo.fontStyle}
                >
                  THANOX.VN
                </span>
                <span className="hidden sm:block text-[9px] uppercase tracking-widest text-[#938EB5] font-extrabold -mt-0.5 leading-none">
                  Digital Gaming Hub
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 glass-subtle border border-white/8 rounded-2xl p-1 shadow-md shrink-0">
              <Link
                to="/"
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 leading-none ${
                  location.pathname === '/' || storefrontPage === 'home'
                    ? 'btn-liquid-primary shadow-md text-white'
                    : 'text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/[0.05]'
                }`}
              >
                <span>Trang Chủ</span>
              </Link>
              <Link
                to="/products"
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 leading-none ${
                  location.pathname.startsWith('/products') || location.pathname.startsWith('/categories') || storefrontPage === 'products'
                    ? 'btn-liquid-primary shadow-md text-white'
                    : 'text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/[0.05]'
                }`}
              >
                <span>Sản Phẩm</span>
              </Link>
              <Link
                to="/account/wallet/deposit"
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 leading-none ${
                  location.pathname.startsWith('/account/wallet') || storefrontPage === 'account-wallet-deposit'
                    ? 'btn-liquid-primary shadow-md text-white'
                    : 'text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/[0.05]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className={location.pathname.startsWith('/account/wallet') || storefrontPage === 'account-wallet-deposit' ? 'text-white' : 'text-amber-300'}>
                  Nạp Tiền VietQR
                </span>
              </Link>
              <Link
                to="/account/orders"
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 leading-none ${
                  location.pathname.startsWith('/account/orders') || storefrontPage === 'account-orders'
                    ? 'btn-liquid-primary shadow-md text-white'
                    : 'text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/[0.05]'
                }`}
              >
                <span>Đơn Hàng & Key</span>
              </Link>
              <Link
                to="/affiliate"
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 leading-none ${
                  location.pathname.startsWith('/affiliate') || storefrontPage === 'affiliate'
                    ? 'btn-liquid-primary shadow-md text-white'
                    : 'text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/[0.05]'
                }`}
              >
                <span>Giới Thiệu</span>
              </Link>
              <Link
                to="/support"
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 leading-none ${
                  location.pathname.startsWith('/support') || storefrontPage === 'support'
                    ? 'btn-liquid-primary shadow-md text-white'
                    : 'text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/[0.05]'
                }`}
              >
                <span>Hỗ Trợ</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Customer Wallet Pill */}
            {isAuthenticated && currentUser ? (
              <div className="hidden sm:flex items-center h-9 px-3 py-1 rounded-xl glass-subtle border border-white/8 gap-2.5 shrink-0 whitespace-nowrap shadow-sm">
                <div className="flex flex-col justify-center text-left leading-none">
                  <span className="text-[9px] uppercase font-bold text-[#938EB5] tracking-wider leading-none mb-0.5">Số dư ví</span>
                  <span className="font-display font-black text-xs text-emerald-300 tabular-nums leading-none">
                    {(currentUser?.balance ?? 0).toLocaleString('vi-VN')} <span className="text-[10px] font-bold text-emerald-400/80">đ</span>
                  </span>
                </div>
                <Link
                  to="/account/wallet/deposit"
                  className="inline-flex items-center justify-center gap-1 h-6.5 px-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap active:scale-95 leading-none"
                >
                  <Zap className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>Nạp</span>
                </Link>
              </div>
            ) : null}

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => navigateToStorefront('cart')}
              className="relative h-9 px-3 rounded-xl glass-subtle hover:bg-white/10 border border-white/8 hover:border-[#7C3AED]/50 text-[#E2DEFA] hover:text-white transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm group active:scale-95 shrink-0"
              title="Giỏ hàng"
            >
              <ShoppingCart className="w-4 h-4 text-[#22D3EE] transition-transform group-hover:scale-110 shrink-0" />
              <span className="hidden md:inline-block text-xs font-bold leading-none text-[#F4F2FF]">Giỏ Hàng</span>
              {cartItemsCount > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-[9.5px] font-black inline-flex items-center justify-center shadow-md leading-none animate-pulse shrink-0">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Account area / Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="h-9 px-2 sm:px-2.5 rounded-xl glass-subtle hover:bg-white/10 border border-white/8 transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                  <div className="w-6.5 h-6.5 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#C084FC] font-bold text-xs shrink-0 leading-none">
                    {(currentUser.name || currentUser.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline-block text-xs font-bold text-[#F4F2FF] max-w-[90px] truncate leading-none">
                    {currentUser.name || currentUser.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#938EB5] shrink-0" />
                </button>

                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-prominent border border-white/12 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-white/8 mb-1">
                      <div className="font-bold text-[#F4F2FF]">{currentUser.name || currentUser.username}</div>
                      <div className="text-[10.5px] text-[#938EB5] truncate">{currentUser.email}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigateToStorefront('account');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#938EB5] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#938EB5]" />
                      <span>Tổng quan tài khoản</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigateToStorefront('account-orders');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#938EB5] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#938EB5]" />
                      <span>Đơn hàng & License Key</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigateToStorefront('account-wallet-deposit');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#938EB5] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Wallet className="w-3.5 h-3.5 text-[#938EB5]" />
                      <span>Nạp tiền</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigateToStorefront('account-transactions');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#938EB5] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#938EB5]" />
                      <span>Lịch sử biến động ví</span>
                    </button>

                    <div className="border-t border-white/8 pt-1 mt-1 space-y-1">
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            navigateToAdmin();
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-[#C084FC] hover:bg-[#7C3AED]/15 transition-colors cursor-pointer font-bold flex items-center justify-between"
                        >
                          <span>Quản Trị Admin Panel</span>
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer font-semibold flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  to="/login"
                  className="h-9 px-3 rounded-xl glass-subtle hover:bg-white/10 text-xs font-semibold text-[#F4F2FF] transition-all inline-flex items-center justify-center gap-1.5 active:scale-95 leading-none shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Đăng Nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="h-9 px-3 rounded-xl btn-liquid-primary text-xs font-bold text-white transition-all inline-flex items-center justify-center gap-1.5 shadow-sm active:scale-95 leading-none shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Đăng Ký</span>
                </Link>
              </div>
            )}

            {/* Desktop Switch to Admin Button (Admin only) */}
            {isAuthenticated && currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigateToAdmin()}
                className="hidden xl:inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl btn-liquid-secondary border border-[#7C3AED]/40 hover:border-[#7C3AED] hover:bg-[#7C3AED]/15 text-[#C084FC] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap active:scale-95 leading-none"
                title="Chuyển sang bảng quản trị Admin"
              >
                <Shield className="w-3.5 h-3.5 text-[#C084FC] shrink-0" />
                <span>Vào Admin</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden h-9 w-9 rounded-xl glass-subtle hover:bg-white/10 text-white cursor-pointer active:scale-90 transition-all shadow-sm flex items-center justify-center shrink-0 border border-white/8 group"
              aria-label="Menu"
            >
              <MenuIcon
                isOpen={mobileMenuOpen}
                size={20}
                strokeWidth={2.2}
                className={themeTypo.isFlowEnabled ? 'text-[#22D3EE]' : 'text-white'}
              />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden glass-prominent border-b border-white/8 px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {isAuthenticated && currentUser ? (
              <div className="p-3 glass-subtle rounded-2xl flex items-center justify-between mb-3 border border-white/8">
                <div>
                  <div className="text-[10px] text-[#938EB5]">Số dư ví của {currentUser?.username || 'bạn'}:</div>
                  <div className="font-display font-black text-sm text-emerald-300">
                    {(currentUser?.balance ?? 0).toLocaleString('vi-VN')}đ
                  </div>
                </div>
                <Link
                  to="/account/wallet/deposit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  + Nạp Tiền
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-2xl glass-subtle text-center text-xs font-bold text-[#F4F2FF] hover:bg-white/10 transition-colors"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-2xl btn-liquid-primary text-center text-xs font-bold text-white transition-colors"
                >
                  Đăng Ký
                </Link>
              </div>
            )}

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl text-xs font-semibold text-[#CBC7E0] hover:bg-white/5 hover:text-white"
            >
              Trang Chủ
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl text-xs font-semibold text-[#CBC7E0] hover:bg-white/5 hover:text-white"
            >
              Tất Cả Sản Phẩm
            </Link>
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold text-[#CBC7E0] hover:bg-white/5 hover:text-white"
            >
              <span>Giỏ Hàng</span>
              {cartItemsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            <Link
              to="/affiliate"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl text-xs font-semibold text-[#CBC7E0] hover:bg-white/5 hover:text-white"
            >
              Kiếm Tiền Affiliate
            </Link>
            <Link
              to="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-xl text-xs font-semibold text-[#CBC7E0] hover:bg-white/5 hover:text-white"
            >
              Hỗ Trợ Kỹ Thuật
            </Link>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left py-2 px-3 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                Đăng Xuất
              </button>
            )}

            {isAuthenticated && currentUser?.role === 'admin' && (
              <div className="pt-2 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => {
                    navigateToAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-bold text-[#C084FC] bg-[#7C3AED]/12 hover:bg-[#7C3AED]/20 cursor-pointer"
                >
                  ⚡ Chuyển Sang Admin Panel
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 3. MAIN STOREFRONT CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 md:pb-8 relative z-10">
        <Outlet />
      </main>

      {/* Floating Mobile Bottom Navigation Bar (iOS 27 Liquid Glass Floating Island) */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="block md:hidden fixed bottom-3 left-3 right-3 max-w-lg mx-auto z-40 glass-prominent rounded-3xl border border-white/14 h-[68px] px-2 shadow-[0_16px_48px_rgba(0,0,0,0.85)]"
      >
        <div className="grid grid-cols-5 h-full items-center">
          {/* 1. Shop */}
          <button
            type="button"
            aria-label="Cửa hàng sản phẩm"
            onClick={() => {
              navigateToStorefront('products');
              navigate('/products');
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 min-h-[44px] relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {(storefrontPage === 'products' || storefrontPage === 'home') && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_8px_#06B6D4]" />
            )}
            <Package
              className={`w-5 h-5 transition-transform ${
                storefrontPage === 'products' || storefrontPage === 'home'
                  ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                  : 'text-[#938EB5]'
              }`}
            />
            <span
              className={`text-[10.5px] ${
                storefrontPage === 'products' || storefrontPage === 'home'
                  ? 'text-cyan-300 font-black'
                  : 'text-[#938EB5] font-bold'
              }`}
            >
              Shop
            </span>
          </button>

          {/* 2. Nạp */}
          <button
            type="button"
            aria-label="Nạp tiền VietQR"
            onClick={() => {
              navigateToStorefront('account-wallet-deposit');
              navigate('/account/wallet');
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 min-h-[44px] relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {storefrontPage === 'account-wallet-deposit' && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-[0_0_8px_#F59E0B]" />
            )}
            <Zap
              className={`w-5 h-5 transition-transform ${
                storefrontPage === 'account-wallet-deposit'
                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  : 'text-[#938EB5]'
              }`}
            />
            <span
              className={`text-[10.5px] ${
                storefrontPage === 'account-wallet-deposit'
                  ? 'text-amber-300 font-black'
                  : 'text-[#938EB5] font-bold'
              }`}
            >
              Nạp
            </span>
          </button>

          {/* 3. Đơn */}
          <button
            type="button"
            aria-label="Đơn hàng của tôi"
            onClick={() => {
              navigateToStorefront('account-orders');
              navigate('/account/orders');
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 min-h-[44px] relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {storefrontPage === 'account-orders' && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full shadow-[0_0_8px_#C084FC]" />
            )}
            <Layers
              className={`w-5 h-5 transition-transform ${
                storefrontPage === 'account-orders'
                  ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
                  : 'text-[#938EB5]'
              }`}
            />
            <span
              className={`text-[10.5px] ${
                storefrontPage === 'account-orders'
                  ? 'text-purple-300 font-black'
                  : 'text-[#938EB5] font-bold'
              }`}
            >
              Đơn
            </span>
            {cartItemsCount > 0 && (
              <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-[9px] font-black flex items-center justify-center shadow-lg">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* 4. Hỗ Trợ */}
          <button
            type="button"
            aria-label="Kênh hỗ trợ"
            onClick={() => {
              navigateToStorefront('support');
              navigate('/account/support');
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 min-h-[44px] relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {(storefrontPage === 'support' || storefrontPage === 'account-support') && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_0_8px_#10B981]" />
            )}
            <MessageCircle
              className={`w-5 h-5 transition-transform ${
                storefrontPage === 'support' || storefrontPage === 'account-support'
                  ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'text-[#938EB5]'
              }`}
            />
            <span
              className={`text-[10.5px] ${
                storefrontPage === 'support' || storefrontPage === 'account-support'
                  ? 'text-emerald-300 font-black'
                  : 'text-[#938EB5] font-bold'
              }`}
            >
              Hỗ Trợ
            </span>
          </button>

          {/* 5. Tài Khoản */}
          <button
            type="button"
            aria-label="Tài khoản cá nhân"
            onClick={() => {
              if (isAuthenticated) {
                navigateToStorefront('account');
                navigate('/account');
              } else {
                navigate('/login');
              }
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 min-h-[44px] relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {(storefrontPage === 'account' || (!isAuthenticated && window.location.pathname === '/login')) && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full shadow-[0_0_8px_#06B6D4]" />
            )}
            {isAuthenticated ? (
              <UserCheck
                className={`w-5 h-5 transition-transform ${
                  storefrontPage === 'account'
                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : 'text-[#938EB5]'
                }`}
              />
            ) : (
              <LogIn className="w-5 h-5 text-[#938EB5]" />
            )}
            <span
              className={`text-[10.5px] ${
                storefrontPage === 'account'
                  ? 'text-cyan-300 font-black'
                  : 'text-[#938EB5] font-bold'
              }`}
            >
              {isAuthenticated ? 'Tài Khoản' : 'Đăng Nhập'}
            </span>
          </button>
        </div>
      </nav>

      {/* Floating Music Player for Customer */}
      <MusicPlayer />

      {/* Global Toast in Storefront */}
      <Toast />

      {/* 4. STOREFRONT FOOTER */}
      <footer className="glass-standard border-t border-white/8 mt-16 pt-12 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-0.5 shadow-md shadow-[#7C3AED]/25 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-cyan-300" />
                </div>
                <span className="thanox-animated-logo text-base font-black tracking-wider uppercase">
                  THANOX.VN
                </span>
              </div>
              <p className="text-xs text-[#938EB5] leading-relaxed">
                Nền tảng cung cấp công cụ tối ưu hóa hiệu năng, file mod an toàn và key bản quyền uy tín hàng đầu Việt Nam.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#F4F2FF] uppercase tracking-wider">Khám Phá</div>
              <ul className="space-y-2 text-xs text-[#938EB5]">
                <li>
                  <button onClick={() => navigateToStorefront('products')} className="hover:text-white transition-colors cursor-pointer">
                    Danh mục sản phẩm
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateToStorefront('account-wallet-deposit')} className="hover:text-white transition-colors cursor-pointer">
                    Nạp tiền tự động
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateToStorefront('account-orders')} className="hover:text-white transition-colors cursor-pointer">
                    Lấy mã License Key
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateToStorefront('affiliate')} className="hover:text-white transition-colors cursor-pointer">
                    Kiếm tiền cùng Thanox
                  </button>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#F4F2FF] uppercase tracking-wider">Chính Sách & Bảo Mật</div>
              <ul className="space-y-2 text-xs text-[#938EB5]">
                <li>Chính sách bảo hành 100%</li>
                <li>Điều khoản sử dụng dịch vụ</li>
                <li>Cam kết an toàn bảo mật tài khoản</li>
                <li>Hỗ trợ kích hoạt & bảo hành key</li>
              </ul>
            </div>

            {/* Contact & Support Channels */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#F4F2FF] uppercase tracking-wider">Kênh Hỗ Trợ Trực Tuyến</div>
              <div className="space-y-2 text-xs text-[#938EB5]">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Zalo: <strong className="text-[#E2DEFA]">{settings.zaloHotline || '0889696810'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#22D3EE]" />
                  <span>Telegram: <strong className="text-[#E2DEFA]">{settings.telegramLink || '@quangthank'}</strong></span>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => navigateToStorefront('support')}
                  className="w-full justify-center"
                >
                  Gửi Yêu Cầu Hỗ Trợ (Ticket)
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom copyright & payment badges */}
          <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5C567A]">
            <div>© 2026 Thanox Digital Ecosystem. All rights reserved.</div>
            <div className="flex items-center gap-3">
              <span className="text-[11px]">Thanh toán bảo mật:</span>
              <span className="px-2.5 py-0.5 rounded-full glass-subtle text-[#E2DEFA] text-[10px] font-bold border border-white/8">VietQR</span>
              <span className="px-2.5 py-0.5 rounded-full glass-subtle text-[#E2DEFA] text-[10px] font-bold border border-white/8">Thẻ Cào</span>
              <span className="px-2.5 py-0.5 rounded-full glass-subtle text-[#E2DEFA] text-[10px] font-bold border border-white/8">Napas247</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
