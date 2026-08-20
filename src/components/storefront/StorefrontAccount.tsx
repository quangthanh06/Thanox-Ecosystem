import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ComponentErrorBoundary } from '../ComponentErrorBoundary';
import {
  Wallet,
  Package,
  History,
  HelpCircle,
  Share2,
  ArrowRight,
  ShieldCheck,
  User,
  Zap,
  Clock,
  Sparkles,
  CreditCard,
} from 'lucide-react';

const StorefrontAccountContent: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    orders,
    topups,
    transactions,
    navigateToStorefront,
    applySeller,
    showToast,
  } = useStore();

  const userOrders = (orders || []).filter((o) => o && o.userId === currentUser?.id);
  const userTopups = (topups || []).filter((t) => t && t.userId === currentUser?.id);

  const handleApplySeller = () => {
    const res = applySeller('Đăng ký trở thành đại lý phân phối Thanox');
    if (res.success) {
      showToast('Gửi hồ sơ đại lý thành công! Admin sẽ duyệt sớm nhất.', 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  // If not logged in or guest, render a welcoming login prompt without breaking
  if (!isAuthenticated || !currentUser || currentUser.id === 'guest') {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
          🔒
        </div>
        <h2 className="text-xl font-bold text-[#F0EDFF]">Vui Lòng Đăng Nhập</h2>
        <p className="text-xs text-[#8B84A8]">
          Bạn cần đăng nhập tài khoản để xem thông tin hồ sơ, số dư ví và các đơn hàng đã mua.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Đăng Nhập Ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Profile Banner */}
      <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] p-0.5 shadow-xl shadow-[#7C3AED]/20">
            <div className="w-full h-full bg-[#0F0F1A] rounded-[14px] flex items-center justify-center text-white font-display font-extrabold text-2xl">
              {(currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-[#F0EDFF]">
                {currentUser?.name || currentUser?.username}
              </h1>
              <Badge variant="brand" size="xs">
                {currentUser?.role === 'admin' ? 'Quản Trị Viên' : 'Thành Viên VIP'}
              </Badge>
            </div>
            <p className="text-xs text-[#8B84A8]">{currentUser?.email || ''}</p>
            <div className="text-[11px] text-[#6B658E]">
              Thành viên từ: <span className="text-[#CBC7E0]">{currentUser?.createdAt || 'Hôm nay'}</span>
            </div>
          </div>
        </div>

        {/* Quick Deposit CTA */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigateToStorefront('account-wallet-deposit')}
            leftIcon={<Zap className="w-4 h-4" />}
            className="font-bold shadow-lg shadow-[#7C3AED]/20"
          >
            Nạp Tiền Ví VietQR
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Wallet Balance Card */}
        <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-lg rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider">Số Dư Ví</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-emerald-400">
            {(currentUser?.balance ?? 0).toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
          </div>
          <button
            onClick={() => navigateToStorefront('account-wallet-deposit')}
            className="text-xs font-bold text-[#9D5CF6] hover:text-[#C084FC] transition-colors flex items-center gap-1 cursor-pointer pt-1"
          >
            Nạp thêm tiền <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Orders Count Card */}
        <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-lg rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider">Đơn Hàng Đã Mua</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-[#F0EDFF]">
            {userOrders.length} <span className="text-xs font-normal text-[#8B84A8]">đơn</span>
          </div>
          <button
            onClick={() => navigateToStorefront('account-orders')}
            className="text-xs font-bold text-[#9D5CF6] hover:text-[#C084FC] transition-colors flex items-center gap-1 cursor-pointer pt-1"
          >
            Xem key & đơn hàng <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Spent Card */}
        <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-lg rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider">Tổng Đã Chi Tiêu</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-[#F0EDFF]">
            {(currentUser?.totalSpent ?? 0).toLocaleString('vi-VN')} <span className="text-xs font-normal text-[#8B84A8]">đ</span>
          </div>
          <button
            onClick={() => navigateToStorefront('account-transactions')}
            className="text-xs font-bold text-[#9D5CF6] hover:text-[#C084FC] transition-colors flex items-center gap-1 cursor-pointer pt-1"
          >
            Lịch sử giao dịch <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Account Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigateToStorefront('account-orders')}
          className="p-5 rounded-2xl bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/5 hover:border-[#7C3AED]/40 hover:bg-[#161626] transition-all text-left space-y-2 cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 w-fit group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <div className="font-display font-bold text-sm text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors">
            Đơn Hàng & License Key
          </div>
          <p className="text-[11.5px] text-[#8B84A8] leading-relaxed">
            Xem lại tất cả key bản quyền và link tải file đã mua.
          </p>
        </button>

        <button
          onClick={() => navigateToStorefront('account-wallet-deposit')}
          className="p-5 rounded-2xl bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/5 hover:border-[#7C3AED]/40 hover:bg-[#161626] transition-all text-left space-y-2 cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit group-hover:scale-110 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="font-display font-bold text-sm text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors">
            Nạp Tiền VietQR Tự Động
          </div>
          <p className="text-[11.5px] text-[#8B84A8] leading-relaxed">
            Quét mã VietQR nhận tiền vào ví nhanh chóng 24/7.
          </p>
        </button>

        <button
          onClick={() => navigateToStorefront('account-transactions')}
          className="p-5 rounded-2xl bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/5 hover:border-[#7C3AED]/40 hover:bg-[#161626] transition-all text-left space-y-2 cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit group-hover:scale-110 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <div className="font-display font-bold text-sm text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors">
            Biến Động Số Dư
          </div>
          <p className="text-[11.5px] text-[#8B84A8] leading-relaxed">
            Kiểm tra chi tiết lịch sử cộng/trừ tiền trong ví.
          </p>
        </button>

        <button
          onClick={() => navigateToStorefront('support')}
          className="p-5 rounded-2xl bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/5 hover:border-[#7C3AED]/40 hover:bg-[#161626] transition-all text-left space-y-2 cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 w-fit group-hover:scale-110 transition-transform">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="font-display font-bold text-sm text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors">
            Hỗ Trợ Kỹ Thuật 24/7
          </div>
          <p className="text-[11.5px] text-[#8B84A8] leading-relaxed">
            Gửi yêu cầu trợ giúp khi gặp sự cố cài đặt file hoặc key.
          </p>
        </button>
      </div>

      {/* SELLER PROGRAM SECTION */}
      <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-xl rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-bold text-lg text-[#F0EDFF]">
                Chương Trình Đại Lý / CTV Thanox Store
              </h3>
              {currentUser?.sellerStatus === 'active' && (
                <Badge variant="success" size="xs" dot>Đại Lý Chính Thức</Badge>
              )}
              {currentUser?.sellerStatus === 'pending' && (
                <Badge variant="warning" size="xs" dot>Đang Chờ Duyệt</Badge>
              )}
            </div>
            <p className="text-xs text-[#8B84A8] leading-relaxed">
              Trở thành đại lý để hưởng chính sách giá sỉ CTV ưu đãi cực tốt và quyền phân phối kho file Thanox.
            </p>
          </div>

          <div>
            {currentUser?.sellerStatus === 'active' ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                ✓ Đã Kích Hoạt Giá Đại Lý
              </div>
            ) : currentUser?.sellerStatus === 'pending' ? (
              <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
                ⏳ Hồ Sơ Đang Chờ Admin Duyệt
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplySeller}
                className="font-bold shadow-lg shadow-[#7C3AED]/20 cursor-pointer"
              >
                Đăng Ký Làm Đại Lý Ngay
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StorefrontAccount: React.FC = () => {
  return (
    <ComponentErrorBoundary componentName="Tài Khoản">
      <StorefrontAccountContent />
    </ComponentErrorBoundary>
  );
};
