import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Share2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Gift,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';

export const StorefrontAffiliate: React.FC = () => {
  const {
    affiliates,
    affiliateRewards,
    currentUser,
    settings,
    navigateToStorefront,
    showToast,
  } = useStore();
  const [copied, setCopied] = useState<boolean>(false);

  // Look up real affiliate record for current user
  const userAffiliate = (affiliates || []).find((a) => a && a.userId === currentUser?.id);

  // User referral code
  const userRefCode = currentUser?.refCode || (currentUser?.username ? currentUser.username.toUpperCase() : 'VIP');

  // Dynamic origin URL for referral link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thanox.vn';
  const referralUrl = `${origin}/?ref=${userRefCode}`;

  // Real statistics
  const realClicks = userAffiliate ? (userAffiliate.clicks ?? userAffiliate.totalClicks ?? 0) : 0;
  const realConversions = userAffiliate ? (userAffiliate.successfulOrders ?? userAffiliate.totalConversions ?? 0) : 0;
  const realEarnings = userAffiliate ? (userAffiliate.commissionEarned ?? userAffiliate.totalEarnings ?? 0) : 0;
  const affiliateBalance = currentUser.affiliateBalance ?? 0;

  // Real user rewards history filtered by current user as referrer
  const myRewards = affiliateRewards.filter((r) => r.referrerUserId === currentUser.id);

  const minOrderVal = settings.affiliateMinimumOrderValue || 200000;
  const defaultReward = settings.affiliateDefaultReward || 10000;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    showToast('Đã sao chép liên kết giới thiệu vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 px-2 sm:px-4">
      {/* Breadcrumb & Header */}
      <div className="border-b border-white/6 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#938EB5] mb-1.5">
            <button
              onClick={() => navigateToStorefront('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Trang Chủ
            </button>
            <span>/</span>
            <span className="text-[#C084FC] font-semibold">Đối Tác Giới Thiệu</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[#F4F2FF] flex items-center gap-3 tracking-tight uppercase">
            <span>Chương Trình Giới Thiệu & Kiếm Tiền</span>
            <Badge variant="brand" size="sm" className="font-mono">
              +10.000đ / Đơn hợp lệ
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-[#938EB5] mt-1 max-w-2xl">
            Chia sẻ liên kết của bạn. Khi bạn bè đăng ký và hoàn tất đơn hàng hợp lệ từ {minOrderVal.toLocaleString('vi-VN')}đ, bạn nhận ngay +{defaultReward.toLocaleString('vi-VN')}đ vào Số Dư Affiliate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToStorefront('support')}
            leftIcon={<HelpCircle className="w-4 h-4 text-[#938EB5]" />}
          >
            Hỏi Đáp & Điều Khoản
          </Button>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="relative overflow-hidden glass-prominent border border-white/12 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#C084FC]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F4F2FF] uppercase tracking-wider">
                Liên Kết Giới Thiệu Riêng Biệt
              </div>
              <div className="text-[11px] text-[#938EB5]">
                Mã giới thiệu của bạn: <span className="font-mono font-bold text-amber-300">{userRefCode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/12 text-emerald-300 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Đang kích hoạt trọn đời
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={referralUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full glass-input rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-mono font-bold text-amber-300 select-all"
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            className="font-bold shrink-0 shadow-lg shadow-[#7C3AED]/25"
          >
            {copied ? 'Đã Sao Chép Link!' : 'Sao Chép Liên Kết'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-standard rounded-3xl p-5 space-y-2 border border-white/8 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#938EB5] uppercase tracking-wider">Lượt Nhấp Chuột</span>
            <div className="p-2 rounded-xl bg-blue-500/12 text-blue-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-[#F4F2FF]">
            {realClicks} <span className="text-xs font-normal text-[#938EB5]">click</span>
          </div>
          <p className="text-[11px] text-[#5C567A]">Số lượt truy cập qua link</p>
        </div>

        <div className="glass-standard rounded-3xl p-5 space-y-2 border border-white/8 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#938EB5] uppercase tracking-wider">Đơn Hàng Hợp Lệ</span>
            <div className="p-2 rounded-xl bg-purple-500/12 text-[#C084FC]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-[#F4F2FF]">
            {realConversions} <span className="text-xs font-normal text-[#938EB5]">đơn</span>
          </div>
          <p className="text-[11px] text-[#5C567A]">Đơn mua ≥ {minOrderVal.toLocaleString('vi-VN')}đ</p>
        </div>

        <div className="glass-standard rounded-3xl p-5 space-y-2 border border-white/8 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#938EB5] uppercase tracking-wider">Tổng Hoa Hồng Kiếm Được</span>
            <div className="p-2 rounded-xl bg-emerald-500/12 text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-emerald-300">
            {realEarnings.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
          </div>
          <p className="text-[11px] text-[#5C567A]">Tổng tiền thưởng đã nhận</p>
        </div>

        <div className="glass-standard rounded-3xl p-5 space-y-2 border border-white/8 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#938EB5] uppercase tracking-wider">Số Dư Affiliate Hiện Có</span>
            <div className="p-2 rounded-xl bg-amber-500/12 text-amber-300">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl text-amber-300">
            {affiliateBalance.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
          </div>
          <p className="text-[11px] text-[#5C567A]">Sẵn sàng dùng mua hàng hoặc rút</p>
        </div>
      </div>

      {/* Rewards History Table */}
      <div className="glass-standard border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#C084FC]" />
            <h3 className="font-display font-black text-base text-[#F4F2FF]">
              Lịch Sử Nhận Thưởng Giới Thiệu
            </h3>
          </div>
          <span className="text-xs text-[#938EB5]">{myRewards.length} lượt nhận</span>
        </div>

        {myRewards.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#938EB5] border border-dashed border-white/8 rounded-2xl glass-subtle">
            Bạn chưa có phần thưởng nào. Hãy sao chép liên kết ở trên và gửi cho bạn bè để nhận +10.000đ cho mỗi đơn hàng hợp lệ!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/6 text-[#938EB5] text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Mã Đơn</th>
                  <th className="pb-3 font-semibold">Người Mua</th>
                  <th className="pb-3 font-semibold">Giá Trị Đơn</th>
                  <th className="pb-3 font-semibold">Tiền Thưởng Nhận</th>
                  <th className="pb-3 font-semibold">Thời Gian</th>
                  <th className="pb-3 font-semibold text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {myRewards.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono font-bold text-[#C084FC]">#{r.orderId}</td>
                    <td className="py-3 text-[#F4F2FF] font-medium">{r.referredUserName || r.referredUserId}</td>
                    <td className="py-3 text-[#E2DEFA]">{(r.orderAmount || 0).toLocaleString('vi-VN')}đ</td>
                    <td className="py-3 font-display font-bold text-emerald-300">
                      +{r.rewardAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 text-[#938EB5]">{r.createdAt}</td>
                    <td className="py-3 text-right">
                      <Badge variant="success" size="xs">
                        Đã Cộng Ví
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
