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
  Info,
  Gift,
  CheckCircle2,
  Clock,
  ExternalLink,
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
  const userAffiliate = affiliates.find((a) => a.userId === currentUser.id);

  // User referral code
  const userRefCode = currentUser.refCode || currentUser.username.toUpperCase();

  // Dynamic origin URL for referral link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thanox.vn';
  const referralUrl = `${origin}/?ref=${userRefCode}`;

  // Real statistics (NO FAKE DATA: If zero, displays 0)
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
      <div className="border-b border-white/5 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8B84A8] mb-1.5">
            <button
              onClick={() => navigateToStorefront('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Trang Chủ
            </button>
            <span>/</span>
            <span className="text-[#9D5CF6] font-medium">Đối Tác Giới Thiệu</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F0EDFF] flex items-center gap-3">
            <span>Chương Trình Đối Tác & Tiếp Thị Liên Kết</span>
            <Badge variant="brand" size="sm" className="font-mono">
              +10.000đ / Đơn hợp lệ
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-[#8B84A8] mt-1 max-w-2xl">
            Chia sẻ liên kết của bạn. Khi bạn bè đăng ký và hoàn tất đơn hàng hợp lệ từ {minOrderVal.toLocaleString('vi-VN')}đ, bạn nhận ngay +{defaultReward.toLocaleString('vi-VN')}đ vào Số Dư Affiliate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToStorefront('support')}
            leftIcon={<HelpCircle className="w-4 h-4 text-[#8B84A8]" />}
          >
            Hỏi Đáp & Điều Khoản
          </Button>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED]/20 via-[#0F0F1A] to-[#06B6D4]/10 border border-[#7C3AED]/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#9D5CF6]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F0EDFF] uppercase tracking-wider">
                Liên Kết Giới Thiệu Riêng Biệt
              </div>
              <div className="text-[11px] text-[#8B84A8]">
                Mã giới thiệu của bạn: <span className="font-mono font-bold text-amber-400">{userRefCode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
              className="w-full bg-[#090910] border border-[#7C3AED]/40 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-mono font-bold text-amber-300 select-all focus:outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            className="font-bold shadow-lg shadow-[#7C3AED]/30 whitespace-nowrap"
          >
            {copied ? 'Đã Sao Chép Link!' : 'Sao Chép Liên Kết'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#8B84A8] border-t border-white/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Ghi nhận cookie phiên giới thiệu tức thì</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Tự động liên kết khi bạn bè đăng ký tài khoản</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Cộng thưởng tự động khi đơn hàng thành công</span>
          </div>
        </div>
      </div>

      {/* Real Stats Cards (Real Data: 0 if no records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Rate */}
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 space-y-2 hover:border-[#7C3AED]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B84A8] font-semibold">Tỷ Lệ Thưởng</span>
            <Gift className="w-4 h-4 text-[#9D5CF6]" />
          </div>
          <div className="font-display font-black text-2xl text-[#9D5CF6]">
            +{defaultReward.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
          </div>
          <div className="text-[11px] text-[#8B84A8]">
            Cho mỗi đơn hợp lệ từ {minOrderVal.toLocaleString('vi-VN')}đ
          </div>
        </div>

        {/* Metric 2: Clicks */}
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 space-y-2 hover:border-[#06B6D4]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B84A8] font-semibold">Lượt Nhấp Link</span>
            <Users className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div className="font-display font-black text-2xl text-[#06B6D4]">
            {realClicks}
          </div>
          <div className="text-[11px] text-[#8B84A8]">
            {realClicks === 0 ? 'Chưa có lượt truy cập qua link' : 'Lượt khách mở qua link bạn gửi'}
          </div>
        </div>

        {/* Metric 3: Qualifying Orders */}
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 space-y-2 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B84A8] font-semibold">Đơn Hàng Hợp Lệ</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-black text-2xl text-amber-400">
            {realConversions}
          </div>
          <div className="text-[11px] text-[#8B84A8]">
            {realConversions === 0 ? 'Chưa có đơn hàng đủ điều kiện' : 'Đơn từ khách bạn giới thiệu'}
          </div>
        </div>

        {/* Metric 4: Affiliate Balance & Total Earnings */}
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 space-y-2 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B84A8] font-semibold">Số Dư Affiliate</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-black text-2xl text-emerald-400">
            {affiliateBalance.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
          </div>
          <div className="text-[11px] text-emerald-400/80">
            Tổng thu nhập: {realEarnings.toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div>

      {/* Reward Policy & Automated Balance Notice */}
      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#F0EDFF]">
              Hoa Hồng Cộng Thẳng Vào Ví: <span className="text-emerald-400 font-mono">{affiliateBalance.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="text-xs text-[#8B84A8]">
              Thưởng hoa hồng được cộng tự động vào ví của bạn để mua hàng và gia hạn dịch vụ trên toàn hệ thống.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <span>⚡ Giới hạn nhận thưởng: 500.000đ / ngày</span>
        </div>
      </div>

      {/* 5-Step Transparent Process Breakdown */}
      <div className="bg-[#0F0F1A] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F0EDFF]">
              Quy Trình Hoạt Động & Cơ Chế Trả Thưởng Minh Bạch
            </h2>
            <p className="text-xs text-[#8B84A8] mt-0.5">
              Cam kết tính thưởng chính xác theo thời gian thực và bảo vệ quyền lợi đối tác
            </p>
          </div>
          <Badge variant="brand" size="sm">
            5 Bước Tự Động
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-[#141424] border border-white/5 rounded-2xl p-4 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-xs font-bold text-[#9D5CF6]">
              1
            </div>
            <div className="text-xs font-bold text-[#F0EDFF]">Chia sẻ link</div>
            <p className="text-[11.5px] text-[#8B84A8]">
              Gửi link giới thiệu riêng biệt cho bạn bè, hội nhóm hoặc gắn trên mạng xã hội.
            </p>
          </div>

          <div className="bg-[#141424] border border-white/5 rounded-2xl p-4 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-xs font-bold text-[#06B6D4]">
              2
            </div>
            <div className="text-xs font-bold text-[#F0EDFF]">Đăng ký tài khoản</div>
            <p className="text-[11.5px] text-[#8B84A8]">
              Khách truy cập mở link và tạo tài khoản Thanox mới. Hệ thống tự động ghi nhận người giới thiệu.
            </p>
          </div>

          <div className="bg-[#141424] border border-white/5 rounded-2xl p-4 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-400">
              3
            </div>
            <div className="text-xs font-bold text-[#F0EDFF]">Đơn hàng từ {minOrderVal.toLocaleString('vi-VN')}đ</div>
            <p className="text-[11.5px] text-[#8B84A8]">
              Khách hàng thực hiện thanh toán đơn hàng có giá trị từ {minOrderVal.toLocaleString('vi-VN')}đ trở lên.
            </p>
          </div>

          <div className="bg-[#141424] border border-white/5 rounded-2xl p-4 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400">
              4
            </div>
            <div className="text-xs font-bold text-[#F0EDFF]">Nhận +{defaultReward.toLocaleString('vi-VN')}đ</div>
            <p className="text-[11.5px] text-[#8B84A8]">
              Hoa hồng +{defaultReward.toLocaleString('vi-VN')}đ được cộng trực tiếp vào Số Dư Affiliate của bạn.
            </p>
          </div>

          <div className="bg-[#141424] border border-white/5 rounded-2xl p-4 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#9D5CF6]/20 border border-[#9D5CF6]/40 flex items-center justify-center text-xs font-bold text-[#9D5CF6]">
              5
            </div>
            <div className="text-xs font-bold text-[#F0EDFF]">Minh bạch 100%</div>
            <p className="text-[11.5px] text-[#8B84A8]">
              Chống tự giới thiệu chính mình, chống trùng lặp đơn hàng, theo dõi lịch sử rõ ràng.
            </p>
          </div>
        </div>
      </div>

      {/* Rewards History Table */}
      <div className="bg-[#0F0F1A] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base sm:text-lg font-bold text-[#F0EDFF]">
            Lịch Sử Nhận Thưởng Giới Thiệu
          </h3>
          <span className="text-xs text-[#8B84A8]">
            {myRewards.length} lượt thưởng được ghi nhận
          </span>
        </div>

        {myRewards.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8B84A8] mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-[#F0EDFF]">Chưa Có Lịch Sử Trả Thưởng</div>
            <p className="text-xs text-[#8B84A8] max-w-md mx-auto">
              Bạn chưa có khoản hoa hồng nào. Hãy sao chép liên kết giới thiệu phía trên và gửi cho bạn bè để bắt đầu nhận thưởng {defaultReward.toLocaleString('vi-VN')}đ/đơn hợp lệ!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Sao Chép Link Ngay
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-[#8B84A8]">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Giá trị đơn</th>
                  <th className="py-3 px-4">Hoa hồng nhận</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {myRewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-[#8B84A8] font-mono">{reward.createdAt}</td>
                    <td className="py-3 px-4 font-semibold text-[#F0EDFF]">{reward.referredUserName}</td>
                    <td className="py-3 px-4 font-mono text-amber-300">{reward.orderCode}</td>
                    <td className="py-3 px-4 font-mono text-[#8B84A8]">
                      {reward.orderAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      +{reward.rewardAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success" size="sm">
                        Đã cộng vào Affiliate
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
