import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Toast } from '../Toast';
import {
  Flame,
  ShoppingCart,
  Wallet,
  Zap,
  User,
  Shield,
  Send,
  MessageCircle,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Search,
  LogIn,
  UserPlus,
  LogOut,
  ShoppingBag,
  Package,
  Wrench,
  UserCheck,
} from 'lucide-react';

import { StorefrontHome } from './StorefrontHome';
import { StorefrontProducts } from './StorefrontProducts';
import { StorefrontProductDetail } from './StorefrontProductDetail';
import { StorefrontCart } from './StorefrontCart';
import { StorefrontDepositQR } from './StorefrontDepositQR';
import { StorefrontAccount } from './StorefrontAccount';
import { StorefrontOrders } from './StorefrontOrders';
import { StorefrontTransactions } from './StorefrontTransactions';
import { StorefrontSupport } from './StorefrontSupport';
import { StorefrontAffiliate } from './StorefrontAffiliate';
import { StorefrontMaintenanceScreen } from './StorefrontMaintenanceScreen';
import { StorefrontAIAssistant } from './StorefrontAIAssistant';
import { MusicPlayer } from './MusicPlayer';
import { getThemeTypography } from '../../utils/themeStyles';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    setAccountDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  // If maintenance mode is active and user is not admin, immediately render full-page maintenance screen
  if (settings.maintenanceMode && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#08080F] text-[#F0EDFF] flex flex-col justify-center items-center font-sans">
        <StorefrontMaintenanceScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A12] text-[#F0EDFF] flex flex-col font-sans selection:bg-[#7C3AED]/30">
      {/* Admin Maintenance Alert Banner */}
      {settings.maintenanceMode && currentUser?.role === 'admin' && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-black text-xs font-black py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-lg z-50">
          <Wrench className="w-4 h-4 text-black animate-spin" style={{ animationDuration: '6s' }} />
          <span>⚠️ CHẾ ĐỘ BẢO TRÌ ĐANG BẬT: Khách hàng ngoài web đang thấy màn hình bảo trì & nút Zalo Admin.</span>
          <button
            type="button"
            onClick={() => navigateToAdmin('maintenance-settings')}
            className="underline ml-2 bg-black text-amber-300 px-3 py-1 rounded-lg hover:bg-zinc-900 cursor-pointer transition-all text-xs font-bold"
          >
            Vào Tắt Bảo Trì →
          </button>
        </div>
      )}

      {/* 1. TOP ANNOUNCEMENT BAR */}
      {(settings.announcementBar?.enabled ?? settings.announcementEnabled) && (
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#06B6D4] text-white text-[11px] sm:text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
          <span>{settings.announcementBar?.text || settings.announcementText || 'Khuyến mãi nạp tiền tự động qua VietQR — Giao key tức thì 24/7!'}</span>
          {settings.announcementBar?.linkText && (
            <button
              onClick={() => navigateToStorefront('account-wallet-deposit')}
              className="underline font-bold hover:text-amber-200 transition-colors cursor-pointer ml-1"
            >
              {settings.announcementBar.linkText}
            </button>
          )}
        </div>
      )}

      {/* 2. MAIN STOREFRONT NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#0F0F1A]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigateToStorefront('home')}
              className="flex items-center gap-2.5 cursor-pointer text-left group select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#9D5CF6] to-[#06B6D4] p-0.5 shadow-lg shadow-[#7C3AED]/30 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.6)] transition-all">
                <div className="w-full h-full bg-[#0F0F1A] rounded-[10px] flex items-center justify-center text-[#9D5CF6] group-hover:text-white transition-colors">
                  <Flame className="w-5 h-5 text-[#9D5CF6] group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <span
                  className={`${themeTypo.logoClass} text-xl sm:text-[23px] tracking-wider uppercase leading-tight`}
                  style={themeTypo.fontStyle}
                >
                  THANOX.VN
                </span>
                <span className="hidden sm:block text-[9.5px] uppercase tracking-widest text-[#8B84A8] font-extrabold -mt-0.5">
                  Digital Gaming Hub
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 bg-[#0F0F1A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-lg shadow-black/40 shrink-0">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  storefrontPage === 'home'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#9D5CF6] text-white shadow-md shadow-[#7C3AED]/40'
                    : 'text-[#CBC7E0] hover:text-white hover:bg-white/5'
                }`}
                style={themeTypo.fontStyle}
              >
                <span>Trang Chủ</span>
              </Link>
              <Link
                to="/products"
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  storefrontPage === 'products'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#9D5CF6] text-white shadow-md shadow-[#7C3AED]/40'
                    : 'text-[#CBC7E0] hover:text-white hover:bg-white/5'
                }`}
                style={themeTypo.fontStyle}
              >
                <span>Sản Phẩm</span>
              </Link>
              <Link
                to="/account/wallet/deposit"
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  storefrontPage === 'account-wallet-deposit'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#9D5CF6] text-white shadow-md shadow-[#7C3AED]/40'
                    : 'text-[#CBC7E0] hover:text-white hover:bg-white/5'
                }`}
                style={themeTypo.fontStyle}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span className="text-amber-300">Nạp Tiền VietQR</span>
              </Link>
              <Link
                to="/account/orders"
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  storefrontPage === 'account-orders'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#9D5CF6] text-white shadow-md shadow-[#7C3AED]/40'
                    : 'text-[#CBC7E0] hover:text-white hover:bg-white/5'
                }`}
                style={themeTypo.fontStyle}
              >
                <span>Đơn Hàng & Key</span>
              </Link>
              <Link
                to="/affiliate"
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  storefrontPage === 'affiliate'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#9D5CF6] text-white shadow-md shadow-[#7C3AED]/40'
                    : 'text-[#CBC7E0] hover:text-white hover:bg-white/5'
                }`}
                style={themeTypo.fontStyle}
              >
                <span>Giới Thiệu</span>
              </Link>
              <Link
                to="/support"
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  storefrontPage === 'support'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#9D5CF6] text-white shadow-md shadow-[#7C3AED]/40'
                    : 'text-[#CBC7E0] hover:text-white hover:bg-white/5'
                }`}
                style={themeTypo.fontStyle}
              >
                <span>Hỗ Trợ</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Customer Wallet Pill (When authenticated) */}
            {isAuthenticated && currentUser ? (
              <div className="hidden sm:flex items-center bg-[#161626] border border-white/10 rounded-xl p-1.5 pl-3 gap-2.5 shrink-0 whitespace-nowrap">
                <div className="text-left whitespace-nowrap">
                  <div className="text-[10px] uppercase font-bold text-[#8B84A8] whitespace-nowrap leading-none mb-0.5">Số dư ví</div>
                  <div className="font-display font-extrabold text-xs text-emerald-400 whitespace-nowrap leading-none">
                    {(currentUser?.balance ?? 0).toLocaleString('vi-VN')} <span className="text-[10px] font-bold">VND</span>
                  </div>
                </div>
                <Link
                  to="/account/wallet/deposit"
                  className="px-2.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Nạp</span>
                </Link>
              </div>
            ) : null}

            {/* Cart Button */}
            <button
              onClick={() => navigateToStorefront('cart')}
              className="relative p-2.5 sm:px-3 sm:py-2 rounded-xl bg-[#161626] border border-white/10 hover:border-[#7C3AED]/50 text-[#CBC7E0] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md group"
              style={themeTypo.fontStyle}
              title="Giỏ hàng"
            >
              <ShoppingCart className={`w-4 h-4 transition-transform group-hover:scale-110 ${themeTypo.isFlowEnabled ? 'text-[#22D3EE]' : 'text-white'}`} />
              <span className={`hidden md:inline-block text-xs ${themeTypo.navClass}`}>Giỏ Hàng</span>
              {cartItemsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-[10px] font-black flex items-center justify-center shadow-lg animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Account area / Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#161626] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#9D5CF6] font-bold text-xs">
                    {(currentUser.name || currentUser.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-xs font-bold text-[#F0EDFF] max-w-[90px] truncate">
                    {currentUser.name || currentUser.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8B84A8]" />
                </button>

                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0F0F1A] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 space-y-1 text-xs">
                    <div className="px-3 py-2 border-b border-white/5">
                      <div className="font-bold text-[#F0EDFF]">{currentUser.name || currentUser.username}</div>
                      <div className="text-[11px] text-[#8B84A8] truncate">{currentUser.email}</div>
                    </div>

                    <button
                      onClick={() => {
                        navigateToStorefront('account');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#CBC7E0] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#8B84A8]" />
                      <span>Tổng quan tài khoản</span>
                    </button>
                    <button
                      onClick={() => {
                        navigateToStorefront('account-orders');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#CBC7E0] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#8B84A8]" />
                      <span>Đơn hàng & License Key</span>
                    </button>
                    <button
                      onClick={() => {
                        navigateToStorefront('account-wallet-deposit');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#CBC7E0] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Wallet className="w-3.5 h-3.5 text-[#8B84A8]" />
                      <span>Nạp tiền</span>
                    </button>
                    <button
                      onClick={() => {
                        navigateToStorefront('account-transactions');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-[#CBC7E0] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#8B84A8]" />
                      <span>Lịch sử biến động ví</span>
                    </button>

                    <div className="border-t border-white/5 pt-1 mt-1 space-y-1">
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => {
                            navigateToAdmin();
                            setAccountDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-[#9D5CF6] hover:bg-[#7C3AED]/15 transition-colors cursor-pointer font-bold flex items-center justify-between"
                        >
                          <span>Quản Trị Admin Panel</span>
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#F0EDFF] transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng Nhập</span>
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-[#7C3AED]/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng Ký</span>
                </Link>
              </div>
            )}

            {/* Desktop Switch to Admin Button (Admin only) */}
            {isAuthenticated && currentUser?.role === 'admin' && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => navigateToAdmin()}
                leftIcon={<Shield className="w-3.5 h-3.5 text-[#9D5CF6]" />}
                className="hidden xl:flex font-bold border-[#7C3AED]/30 hover:border-[#7C3AED] shrink-0 whitespace-nowrap"
              >
                Vào Admin
              </Button>
            )}

            {/* Mobile Menu Toggle (Ba gạch) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-[#161626] border border-white/10 hover:border-[#7C3AED]/50 text-white cursor-pointer active:scale-95 transition-all shadow-md"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className={`w-5 h-5 ${themeTypo.isFlowEnabled ? 'text-[#22D3EE]' : 'text-white'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0F0F1A] border-b border-white/10 px-4 py-4 space-y-2">
            {isAuthenticated && currentUser ? (
              <div className="p-3 bg-[#161626] rounded-xl flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] text-[#8B84A8]">Số dư ví của {currentUser?.username || 'bạn'}:</div>
                  <div className="font-display font-bold text-sm text-emerald-400">
                    {(currentUser?.balance ?? 0).toLocaleString('vi-VN')}đ
                  </div>
                </div>
                <Link
                  to="/account/wallet/deposit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-bold cursor-pointer"
                >
                  + Nạp Tiền
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-white/5 text-center text-xs font-bold text-[#F0EDFF] hover:bg-white/10 transition-colors"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-[#7C3AED] text-center text-xs font-bold text-white hover:bg-[#6D28D9] transition-colors"
                >
                  Đăng Ký
                </Link>
              </div>
            )}

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
                onClick={handleLogout}
                className="w-full text-left py-2 px-3 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                Đăng Xuất
              </button>
            )}

            {isAuthenticated && currentUser?.role === 'admin' && (
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    navigateToAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-bold text-[#9D5CF6] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 cursor-pointer"
                >
                  ⚡ Chuyển Sang Admin Panel
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 3. MAIN STOREFRONT CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Fixed Mobile Bottom Navigation Bar (Chunky high-tech navigation on smartphones) */}
      <nav
        aria-label="Mobile Navigation"
        className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B17]/95 backdrop-blur-2xl border-t border-cyan-500/20 h-[70px] px-1 shadow-[0_-10px_30px_rgba(0,0,0,0.7)]"
      >
        <div className="grid grid-cols-5 h-full items-center">
          {/* 1. Shop */}
          <button
            type="button"
            onClick={() => {
              navigateToStorefront('products');
              navigate('/products');
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1.5 relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {(storefrontPage === 'products' || storefrontPage === 'home') && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_8px_#06B6D4]" />
            )}
            <ShoppingBag
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                storefrontPage === 'products' || storefrontPage === 'home'
                  ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                  : 'text-[#8B84A8]'
              }`}
            />
            <span
              className={`text-[11px] ${
                storefrontPage === 'products' || storefrontPage === 'home'
                  ? 'text-cyan-300 font-black'
                  : 'text-[#8B84A8] font-bold'
              }`}
            >
              Shop
            </span>
          </button>

          {/* 2. Nạp */}
          <button
            type="button"
            onClick={() => {
              navigateToStorefront('account-wallet-deposit');
              navigate('/account/wallet');
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1.5 relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {storefrontPage === 'account-wallet-deposit' && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-[0_0_8px_#F59E0B]" />
            )}
            <Zap
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                storefrontPage === 'account-wallet-deposit'
                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  : 'text-[#8B84A8]'
              }`}
            />
            <span
              className={`text-[11px] ${
                storefrontPage === 'account-wallet-deposit'
                  ? 'text-amber-300 font-black'
                  : 'text-[#8B84A8] font-bold'
              }`}
            >
              Nạp
            </span>
          </button>

          {/* 3. Đơn */}
          <button
            type="button"
            onClick={() => {
              navigateToStorefront('account-orders');
              navigate('/account/orders');
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1.5 relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {storefrontPage === 'account-orders' && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full shadow-[0_0_8px_#C084FC]" />
            )}
            <Package
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                storefrontPage === 'account-orders'
                  ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
                  : 'text-[#8B84A8]'
              }`}
            />
            <span
              className={`text-[11px] ${
                storefrontPage === 'account-orders'
                  ? 'text-purple-300 font-black'
                  : 'text-[#8B84A8] font-bold'
              }`}
            >
              Đơn
            </span>
            {cartItemsCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-[9px] font-black flex items-center justify-center shadow-lg">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* 4. Hỗ Trợ */}
          <button
            type="button"
            onClick={() => {
              navigateToStorefront('support');
              navigate('/account/support');
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1.5 relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {(storefrontPage === 'support' || storefrontPage === 'account-support') && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_0_8px_#10B981]" />
            )}
            <MessageCircle
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                storefrontPage === 'support' || storefrontPage === 'account-support'
                  ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'text-[#8B84A8]'
              }`}
            />
            <span
              className={`text-[11px] ${
                storefrontPage === 'support' || storefrontPage === 'account-support'
                  ? 'text-emerald-300 font-black'
                  : 'text-[#8B84A8] font-bold'
              }`}
            >
              Hỗ Trợ
            </span>
          </button>

          {/* 5. Tài Khoản (Góc cuối bên phải: Chưa đăng nhập -> vào /login, Đã đăng nhập -> vào /account) */}
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                navigateToStorefront('account');
                navigate('/account');
              } else {
                navigate('/login');
              }
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1.5 relative group active:scale-90"
            style={themeTypo.fontStyle}
          >
            {(storefrontPage === 'account' || (!isAuthenticated && window.location.pathname === '/login')) && (
              <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full shadow-[0_0_8px_#06B6D4]" />
            )}
            {isAuthenticated ? (
              <UserCheck
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  storefrontPage === 'account'
                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : 'text-[#8B84A8]'
                }`}
              />
            ) : (
              <User
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  storefrontPage === 'account'
                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : 'text-[#8B84A8]'
                }`}
              />
            )}
            <span
              className={`text-[11px] ${
                storefrontPage === 'account'
                  ? 'text-cyan-300 font-black'
                  : 'text-[#8B84A8] font-bold'
              }`}
            >
              Tài Khoản
            </span>
          </button>
        </div>
      </nav>

      {/* Floating Music Player for Customer */}
      <MusicPlayer />

      {/* Global Toast in Storefront */}
      <Toast />

      {/* 4. STOREFRONT FOOTER */}
      <footer className="bg-[#0A0A10] border-t border-white/10 mt-16 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-0.5 shadow-md shadow-[#7C3AED]/30 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-cyan-300" />
                </div>
                <span className="thanox-animated-logo text-base font-black tracking-wider uppercase">
                  THANOX.VN
                </span>
              </div>
              <p className="text-xs text-[#8B84A8] leading-relaxed">
                Nền tảng cung cấp công cụ tối ưu hóa hiệu năng, file mod an toàn và key bản quyền uy tín hàng đầu Việt Nam.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#F0EDFF] uppercase tracking-wider">Khám Phá</div>
              <ul className="space-y-2 text-xs text-[#8B84A8]">
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
              <div className="text-xs font-bold text-[#F0EDFF] uppercase tracking-wider">Chính Sách & Bảo Mật</div>
              <ul className="space-y-2 text-xs text-[#8B84A8]">
                <li>Chính sách bảo hành 100%</li>
                <li>Điều khoản sử dụng dịch vụ</li>
                <li>Cam kết an toàn bảo mật tài khoản</li>
                <li>Hỗ trợ kích hoạt & bảo hành key</li>
              </ul>
            </div>

            {/* Contact & Support Channels */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#F0EDFF] uppercase tracking-wider">Kênh Hỗ Trợ Trực Tuyến</div>
              <div className="space-y-2 text-xs text-[#8B84A8]">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Zalo: <strong className="text-[#CBC7E0]">{settings.zaloHotline || '0916396901'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#06B6D4]" />
                  <span>Telegram: <strong className="text-[#CBC7E0]">{settings.telegramLink || '@quangthank'}</strong></span>
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
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B658E]">
            <div>© 2026 Thanox Digital Ecosystem. All rights reserved.</div>
            <div className="flex items-center gap-3">
              <span className="text-[11px]">Thanh toán bảo mật:</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-[#CBC7E0] text-[10px] font-bold">VietQR</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-[#CBC7E0] text-[10px] font-bold">Thẻ Cào</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-[#CBC7E0] text-[10px] font-bold">Napas247</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
