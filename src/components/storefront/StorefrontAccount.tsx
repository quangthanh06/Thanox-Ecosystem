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
  ArrowRight,
  Zap,
  Sparkles,
  CreditCard,
} from 'lucide-react';

const StorefrontAccountContent: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    orders,
    navigateToStorefront,
    applySeller,
    showToast,
  } = useStore();

  const userOrders = (orders || []).filter((o) => o && o.userId === currentUser?.id);

  const handleApplySeller = () => {
    const res = applySeller('Đăng ký trở thành đại lý phân phối Thanox');
    if (res.success) {
      showToast('Gửi hồ sơ đại lý thành công! Admin sẽ duyệt sớm nhất.', 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  if (!isAuthenticated || !currentUser || currentUser.id === 'guest') {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl glass-standard text-amber-300 flex items-center justify-center mx-auto text-2xl font-bold shadow-lg border border-white/12">
          🔒
        </div>
        <h2 className="text-xl font-black text-[#F4F2FF]">Vui Lòng Đăng Nhập</h2>
        <p className="text-xs text-[#938EB5]">
          Bạn cần đăng nhập tài khoản để xem thông tin hồ sơ, số dư ví và các đơn hàng đã mua.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 rounded-2xl btn-liquid-primary font-bold text-xs shadow-md active:scale-95 transition-all"
        >
          Đăng Nhập Ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Profile Banner */}
      <div className="glass-prominent rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-white/12 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] p-0.5 shadow-xl shadow-[#7C3AED]/25">
            <div className="w-full h-full bg-[#0B0B14] rounded-[14px] flex items-center justify-center text-white font-display font-black text-2xl">
              {(currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl sm:text-2xl text-[#F4F2FF]">
                {currentUser?.name || currentUser?.username}
              </h1>
              <Badge variant="brand" size="xs">
                {currentUser?.role === 'admin' ? 'Quản Trị Viên' : 'Thành Viên VIP'}
              </Badge>
            </div>
            <p className="text-xs text-[#938EB5]">{currentUser?.email || ''}</p>
            <div className="text-[11px] text-[#5C567A]">
              Thành viên từ: <span className="text-[#F4F2FF] font-medium">{currentUser?.createdAt || 'Hôm nay'}</span>
            </div>
          </div>
        </div>

        {/* Quick Deposit CTA */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigateToStorefront('account-wallet-deposit')}
            leftIcon={<Zap className="w-4 h-4 text-amber-300" />}
            className="font-bold shadow-lg shadow-[#7C3AED]/25 uppercase tracking-wide"
          >
            Nạp Tiền Ví VietQR
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Wallet Balance Card */}
        <div className="glass-standard rounded-3xl p-5 space-y-3 border border-white/8 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#938EB5] uppercase tracking-wider">Số Dư Ví</span>
            <div className="p-2 rounded-xl bg-emerald-500/12 text-emerald-300 border border-emerald-500/25">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-emerald-300">
            {(currentUser?.balance ?? 0).toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
          </div>
          <button
            onClick={() => navigateToStorefront('account-wallet-deposit')}
            className="text-xs font-bold text-[#C084FC] hover:text-white transition-colors flex items-center gap-1 cursor-pointer pt-1"
          >
            Nạp thêm tiền <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Orders Count Card */}
        <div className="glass-standard rounded-3xl p-5 space-y-3 border border-white/8 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#938EB5] uppercase tracking-wider">Đơn Hàng Đã Mua</span>
            <div className="p-2 rounded-xl bg-blue-500/12 text-blue-300 border border-blue-500/25">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-[#F4F2FF]">
            {userOrders.length} <span className="text-xs font-normal text-[#938EB5]">đơn</span>
          </div>
          <button
            onClick={() => navigateToStorefront('account-orders')}
            className="text-xs font-bold text-[#C084FC] hover:text-white transition-colors flex items-center gap-1 cursor-pointer pt-1"
          >
            Xem key & đơn hàng <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Spent Card */}
        <div className="glass-standard rounded-3xl p-5 space-y-3 border border-white/8 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#938EB5] uppercase tracking-wider">Tổng Đã Chi Tiêu</span>
            <div className="p-2 rounded-xl bg-purple-500/12 text-[#C084FC] border border-purple-500/25">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-[#F4F2FF]">
            {(currentUser?.totalSpent ?? 0).toLocaleString('vi-VN')} <span className="text-xs font-normal text-[#938EB5]">đ</span>
          </div>
          <button
            onClick={() => navigateToStorefront('account-transactions')}
            className="text-xs font-bold text-[#C084FC] hover:text-white transition-colors flex items-center gap-1 cursor-pointer pt-1"
          >
            Lịch sử giao dịch <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Account Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigateToStorefront('account-orders')}
          className="p-5 rounded-3xl glass-subtle hover:glass-standard border border-white/8 hover:border-[#7C3AED]/40 transition-all text-left space-y-2 cursor-pointer group active:scale-95"
        >
          <div className="p-2.5 rounded-2xl bg-blue-500/12 text-blue-300 w-fit group-hover:scale-110 transition-transform border border-blue-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div className="font-display font-bold text-sm text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors">
            Đơn Hàng & License Key
          </div>
          <p className="text-[11.5px] text-[#938EB5] leading-relaxed">
            Xem lại tất cả key bản quyền và link tải file đã mua.
          </p>
        </button>

        <button
          onClick={() => navigateToStorefront('account-wallet-deposit')}
          className="p-5 rounded-3xl glass-subtle hover:glass-standard border border-white/8 hover:border-[#7C3AED]/40 transition-all text-left space-y-2 cursor-pointer group active:scale-95"
        >
          <div className="p-2.5 rounded-2xl bg-emerald-500/12 text-emerald-300 w-fit group-hover:scale-110 transition-transform border border-emerald-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="font-display font-bold text-sm text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors">
            Nạp Tiền VietQR Tự Động
          </div>
          <p className="text-[11.5px] text-[#938EB5] leading-relaxed">
            Quét mã VietQR nhận tiền vào ví nhanh chóng 24/7.
          </p>
        </button>

        <button
          onClick={() => navigateToStorefront('account-transactions')}
          className="p-5 rounded-3xl glass-subtle hover:glass-standard border border-white/8 hover:border-[#7C3AED]/40 transition-all text-left space-y-2 cursor-pointer group active:scale-95"
        >
          <div className="p-2.5 rounded-2xl bg-purple-500/12 text-[#C084FC] w-fit group-hover:scale-110 transition-transform border border-purple-500/20">
            <History className="w-5 h-5" />
          </div>
          <div className="font-display font-bold text-sm text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors">
            Biến Động Số Dư
          </div>
          <p className="text-[11.5px] text-[#938EB5] leading-relaxed">
            Kiểm tra chi tiết lịch sử cộng/trừ tiền trong ví.
          </p>
        </button>

        <button
          onClick={() => navigateToStorefront('support')}
          className="p-5 rounded-3xl glass-subtle hover:glass-standard border border-white/8 hover:border-[#7C3AED]/40 transition-all text-left space-y-2 cursor-pointer group active:scale-95"
        >
          <div className="p-2.5 rounded-2xl bg-amber-500/12 text-amber-300 w-fit group-hover:scale-110 transition-transform border border-amber-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="font-display font-bold text-sm text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors">
            Hỗ Trợ Kỹ Thuật 24/7
          </div>
          <p className="text-[11.5px] text-[#938EB5] leading-relaxed">
            Gửi yêu cầu trợ giúp khi gặp sự cố cài đặt file hoặc key.
          </p>
        </button>
      </div>

      {/* SELLER PROGRAM SECTION */}
      <div className="glass-standard border border-white/10 shadow-xl rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="font-display font-black text-lg text-[#F4F2FF]">
                Chương Trình Đại Lý / CTV Thanox Store
              </h3>
              {currentUser?.sellerStatus === 'active' && (
                <Badge variant="success" size="xs" dot>Đại Lý Chính Thức</Badge>
              )}
              {currentUser?.sellerStatus === 'pending' && (
                <Badge variant="warning" size="xs" dot>Đang Chờ Duyệt</Badge>
              )}
            </div>
            <p className="text-xs text-[#938EB5] leading-relaxed">
              Trở thành đại lý để hưởng chính sách giá sỉ CTV ưu đãi cực tốt và quyền phân phối kho file Thanox.
            </p>
          </div>

          <div>
            {currentUser?.sellerStatus === 'active' ? (
              <div className="px-4 py-2 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                ✓ Đã Kích Hoạt Giá Đại Lý
              </div>
            ) : currentUser?.sellerStatus === 'pending' ? (
              <div className="px-4 py-2 rounded-2xl bg-amber-500/12 border border-amber-500/30 text-amber-300 font-bold text-xs">
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
