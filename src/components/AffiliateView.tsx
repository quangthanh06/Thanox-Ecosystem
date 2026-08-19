import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AffiliateItem } from '../types';
import { Card, CardHeader } from './ui/Card';
import { StatCard } from './ui/StatCard';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import {
  Share2,
  DollarSign,
  Users,
  MousePointerClick,
  ShoppingBag,
  Copy,
  CheckCircle2,
  Plus,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const AffiliateView: React.FC = () => {
  const { affiliates, settings, updateSettings, showToast } = useStore();

  const [newPartnerUser, setNewPartnerUser] = useState('');

  const totalCommission = affiliates.reduce((sum, a) => sum + a.commissionEarned, 0);
  const totalPendingWithdraw = affiliates.reduce((sum, a) => sum + a.pendingWithdraw, 0);
  const totalClicks = affiliates.reduce((sum, a) => sum + a.clicks, 0);
  const totalConversions = affiliates.reduce((sum, a) => sum + a.successfulOrders, 0);
  const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';

  const copyRefLink = (refCode: string) => {
    const link = `https://thanox.vn/?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    showToast(`Đã sao chép link CTV: ${link}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F1A] border border-white/5 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-[#F0EDFF]">Mạng Lưới Tiếp Thị Liên Kết</h2>
            <Badge variant="brand" size="xs">
              {affiliates.length} đối tác
            </Badge>
          </div>
          <p className="text-xs text-[#6B658E] mt-0.5">
            Quản lý cộng tác viên (CTV), theo dõi lượt click giới thiệu và chi trả hoa hồng
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs text-[#8B84A8] bg-[#161626] px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2">
            <span>Hoa hồng mặc định:</span>
            <span className="font-bold text-emerald-400">{settings.affiliateCommissionRate || 10}%</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng Hoa Hồng Đã Phát"
          value={totalCommission > 0 ? `${totalCommission.toLocaleString('vi-VN')}đ` : '0đ'}
          icon={<DollarSign className="w-4 h-4" />}
          trend={{ value: `${totalConversions} đơn giới thiệu`, isPositive: true }}
          accentColor="success"
        />

        <StatCard
          label="Đang Chờ Rút Tiền"
          value={totalPendingWithdraw > 0 ? `${totalPendingWithdraw.toLocaleString('vi-VN')}đ` : '0đ'}
          icon={<Share2 className="w-4 h-4" />}
          trend={{
            value: totalPendingWithdraw > 0 ? 'Cần thanh toán' : 'Không có yêu cầu',
            isPositive: totalPendingWithdraw === 0,
          }}
          accentColor="warning"
        />

        <StatCard
          label="Tổng Lượt Click Ref"
          value={totalClicks.toLocaleString('vi-VN')}
          icon={<MousePointerClick className="w-4 h-4" />}
          accentColor="brand"
        />

        <StatCard
          label="Tỷ Lệ Chuyển Đổi"
          value={`${convRate}%`}
          icon={<ShoppingBag className="w-4 h-4" />}
          trend={{ value: 'Click → Mua hàng', isPositive: true }}
          accentColor="accent"
        />
      </div>

      {/* Affiliate Partner List */}
      <Card className="p-0 overflow-hidden" variant="default">
        <CardHeader
          title="Danh Sách Đối Tác & Mã Giới Thiệu"
          subtitle="Theo dõi hiệu suất từng CTV giới thiệu khách hàng"
          className="p-5"
        />

        {affiliates.length === 0 ? (
          <EmptyState
            icon={<Share2 className="w-6 h-6 text-[#9D5CF6]" />}
            title="Chưa có đối tác tiếp thị nào"
            description="Khi thành viên đăng ký làm CTV hoặc chia sẻ link ref, danh sách sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="bg-[#161626]/60 text-[#555074] border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Đối Tác</th>
                  <th className="py-3 px-4">Mã Ref</th>
                  <th className="py-3 px-4">Lượt Click</th>
                  <th className="py-3 px-4">Đơn Thành Công</th>
                  <th className="py-3 px-4">Hoa Hồng Đã Nhận</th>
                  <th className="py-3 px-4">Chờ Rút</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Link Giới Thiệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {affiliates.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#F0EDFF]">{item.userName}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#A78BFA]">{item.refCode}</td>
                    <td className="py-3.5 px-4 font-mono text-[#8B84A8]">{item.clicks}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">{item.successfulOrders}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {item.commissionEarned.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-400">
                      {item.pendingWithdraw.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.status === 'active' ? 'success' : 'neutral'} size="xs" dot>
                        {item.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => copyRefLink(item.refCode)}
                        leftIcon={<Copy className="w-3 h-3" />}
                      >
                        Copy Link
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
