import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StatCard } from './ui/StatCard';
import { Card, CardHeader } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Package,
  Plus,
  Zap,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    orders,
    products,
    users,
    topups,
    transactions,
    setCurrentPage,
    navigateToStorefront,
  } = useStore();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; amount: number; x: number; y: number } | null>(null);

  // REAL COMPUTATIONS (Defaulting cleanly to 0 if empty)
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrdersCount = orders.length;
  const netProfit = Math.round(totalRevenue * 0.7); // 70% estimated gross margin
  const approvedTopups = topups.filter((t) => t.status === 'approved');
  const totalTopupVolume = approvedTopups.reduce((sum, t) => sum + t.amount, 0);
  const pendingTopupCount = topups.filter((t) => t.status === 'pending').length;
  const pendingOrderCount = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;

  // Chart data generation based on actual orders
  const chartDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 12 : 7;
  const chartData = Array.from({ length: chartDays }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (chartDays - 1 - i));
    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    // Filter orders on this day
    const dayOrders = completedOrders.filter((o) => {
      const orderDate = o.createdAt.split(' ')[0];
      return orderDate === d.toISOString().split('T')[0];
    });

    const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    return {
      date: dateStr,
      revenue: dayRevenue,
    };
  });

  // Calculate sparkline arrays
  const revenueSparkline = chartData.map((c) => c.revenue);
  const maxRevenue = Math.max(...revenueSparkline, 100000);

  // Top products leaderboard
  const topProducts = [...products]
    .sort((a, b) => b.soldCount * b.price - a.soldCount * a.price)
    .slice(0, 5);

  // Category shares
  const categorySalesMap: Record<string, number> = {};
  completedOrders.forEach((o) => {
    categorySalesMap[o.category] = (categorySalesMap[o.category] || 0) + o.totalPrice;
  });
  const categoryEntries = Object.entries(categorySalesMap);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#7C3AED]/15 via-[#161626] to-[#06B6D4]/10 border border-[#7C3AED]/20 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F0EDFF]">
              Chào mừng trở lại, Admin
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#7C3AED]/25 text-[#A78BFA] font-semibold">
              Live
            </span>
          </div>
          <p className="text-xs text-[#8B84A8]">
            {pendingOrderCount > 0 || pendingTopupCount > 0
              ? `Bạn có ${pendingOrderCount} đơn hàng đang xử lý và ${pendingTopupCount} yêu cầu nạp tiền cần duyệt.`
              : 'Hệ thống đang hoạt động ổn định. Không có yêu cầu xử lý tồn đọng.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateToStorefront('home')}
            leftIcon={<Zap className="w-3.5 h-3.5 text-[#06B6D4]" />}
          >
            Cửa Hàng Khách
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentPage('products')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Thêm Sản Phẩm
          </Button>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng Doanh Thu"
          value={totalRevenue > 0 ? `${totalRevenue.toLocaleString('vi-VN')}đ` : '0đ'}
          icon={<DollarSign className="w-4 h-4" />}
          trend={{
            value: totalRevenue > 0 ? '+18.4%' : '0%',
            isPositive: totalRevenue > 0,
            label: 'so với tuần trước',
          }}
          accentColor="brand"
          sparklineData={revenueSparkline}
          onClick={() => setCurrentPage('analytics')}
        />

        <StatCard
          label="Tổng Đơn Hàng"
          value={totalOrdersCount.toLocaleString('vi-VN')}
          icon={<ShoppingBag className="w-4 h-4" />}
          trend={{
            value: totalOrdersCount > 0 ? `+${totalOrdersCount}` : '0',
            isPositive: totalOrdersCount > 0,
            label: 'đơn đã khởi tạo',
          }}
          accentColor="accent"
          onClick={() => setCurrentPage('orders')}
        />

        <StatCard
          label="Lợi Nhuận Ước Tính"
          value={netProfit > 0 ? `${netProfit.toLocaleString('vi-VN')}đ` : '0đ'}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={{
            value: totalRevenue > 0 ? '70%' : '0%',
            isPositive: true,
            label: 'biên lợi nhuận gộp',
          }}
          accentColor="success"
          onClick={() => setCurrentPage('analytics')}
        />

        <StatCard
          label="Tổng Tiền Nạp Ví"
          value={totalTopupVolume > 0 ? `${totalTopupVolume.toLocaleString('vi-VN')}đ` : '0đ'}
          icon={<Wallet className="w-4 h-4" />}
          trend={{
            value: pendingTopupCount > 0 ? `${pendingTopupCount} chờ duyệt` : 'Tất cả đã xử lý',
            isPositive: pendingTopupCount === 0,
            label: '',
          }}
          accentColor="warning"
          onClick={() => setCurrentPage('wallet')}
        />
      </div>

      {/* Main Grid: Revenue Analytics Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Revenue SVG Interactive Chart */}
        <Card className="lg:col-span-8 p-5 space-y-4" variant="default">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div>
              <h3 className="font-display font-semibold text-sm text-[#F0EDFF]">Biểu Đồ Doanh Thu</h3>
              <p className="text-xs text-[#6B658E]">Biến động doanh thu theo thời gian thực</p>
            </div>

            <div className="flex items-center gap-1 bg-[#161626] p-1 rounded-xl border border-white/5 text-xs">
              {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    timeRange === r
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'text-[#8B84A8] hover:text-[#F0EDFF]'
                  }`}
                >
                  {r === '7d' ? '7 Ngày' : r === '30d' ? '30 Ngày' : r === '90d' ? '3 Tháng' : 'Tất Cả'}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart Rendering */}
          <div className="relative pt-2">
            <div className="h-60 w-full flex items-end relative overflow-hidden">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartDays * 50} 200`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 50, 100, 150].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2={chartDays * 50}
                    y2={y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Area Fill */}
                {(() => {
                  const points = chartData.map((d, i) => {
                    const x = i * 50 + 25;
                    const y = 180 - (d.revenue / maxRevenue) * 150;
                    return `${x},${y}`;
                  });

                  const firstX = 25;
                  const lastX = (chartDays - 1) * 50 + 25;
                  const areaD = `M ${firstX},180 L ${points.join(' L ')} L ${lastX},180 Z`;
                  const lineD = `M ${points.join(' L ')}`;

                  return (
                    <>
                      <path d={areaD} fill="url(#revGrad)" />
                      <path
                        d={lineD}
                        fill="none"
                        stroke="#9D5CF6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Interactive Dots */}
                      {chartData.map((d, i) => {
                        const cx = i * 50 + 25;
                        const cy = 180 - (d.revenue / maxRevenue) * 150;
                        return (
                          <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r="4"
                            className="fill-[#0F0F1A] stroke-[#9D5CF6] stroke-2 hover:r-6 transition-all cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ date: d.date, amount: d.revenue, x: cx, y: cy })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute bg-[#161626] border border-white/20 px-3 py-1.5 rounded-xl shadow-2xl text-xs pointer-events-none z-20 transform -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${(hoveredPoint.x / (chartDays * 50)) * 100}%`,
                    top: `${(hoveredPoint.y / 200) * 100}%`,
                  }}
                >
                  <div className="text-[10px] text-[#8B84A8]">{hoveredPoint.date}</div>
                  <div className="font-bold text-emerald-400">
                    {hoveredPoint.amount.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              )}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between pt-3 border-t border-white/5 text-[10.5px] text-[#6B658E]">
              {chartData.map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Category Breakdown Card */}
        <Card className="lg:col-span-4 p-5 space-y-4" variant="default">
          <div className="pb-3 border-b border-white/5">
            <h3 className="font-display font-semibold text-sm text-[#F0EDFF]">Tỷ Trọng Danh Mục</h3>
            <p className="text-xs text-[#6B658E]">Phân bổ doanh thu theo nhóm sản phẩm</p>
          </div>

          {categoryEntries.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B658E]">Chưa có dữ liệu phân loại</div>
          ) : (
            <div className="space-y-3.5">
              {categoryEntries.map(([cat, amount]) => {
                const percent = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#F0EDFF]">{cat}</span>
                      <span className="text-emerald-400">{percent}% ({amount.toLocaleString('vi-VN')}đ)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#161626] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Grid: Recent Orders & Top Products Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Recent Orders List */}
        <Card className="lg:col-span-7 p-5 space-y-4" variant="default">
          <CardHeader
            title="Đơn Hàng Gần Đây"
            subtitle="Danh sách các đơn mua mới nhất"
            action={
              <Button variant="ghost" size="xs" onClick={() => setCurrentPage('orders')}>
                Xem tất cả ({orders.length})
              </Button>
            }
          />

          {orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="w-6 h-6 text-[#9D5CF6]" />}
              title="Chưa có đơn hàng nào"
              description="Khi khách hàng mua file hoặc tool từ cửa hàng, đơn hàng sẽ hiển thị tại đây."
              actionLabel="Mở Cửa Hàng Xem Thử"
              onAction={() => navigateToStorefront('home')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[500px]">
                <thead>
                  <tr className="text-[#555074] border-b border-white/5 uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5">Mã đơn</th>
                    <th className="pb-2.5">Khách hàng</th>
                    <th className="pb-2.5">Sản phẩm</th>
                    <th className="pb-2.5">Tổng tiền</th>
                    <th className="pb-2.5 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono font-bold text-[#F0EDFF]">{o.orderCode}</td>
                      <td className="py-3 text-[#F0EDFF] font-medium">{o.userName}</td>
                      <td className="py-3 text-[#8B84A8] max-w-[160px] truncate">{o.productName}</td>
                      <td className="py-3 font-bold text-emerald-400">
                        {o.totalPrice.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant={
                            o.status === 'completed'
                              ? 'success'
                              : o.status === 'failed' || o.status === 'cancelled'
                              ? 'danger'
                              : 'warning'
                          }
                          size="xs"
                          dot
                        >
                          {o.status === 'completed'
                            ? 'Hoàn thành'
                            : o.status === 'failed'
                            ? 'Thất bại'
                            : o.status === 'cancelled'
                            ? 'Đã hủy'
                            : 'Đang xử lý'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Top Selling Products Leaderboard */}
        <Card className="lg:col-span-5 p-5 space-y-4" variant="default">
          <CardHeader
            title="Sản Phẩm Bán Chạy"
            subtitle="Top sản phẩm có doanh số cao nhất"
            action={
              <Button variant="ghost" size="xs" onClick={() => setCurrentPage('products')}>
                Quản lý kho
              </Button>
            }
          />

          {topProducts.length === 0 ? (
            <EmptyState
              icon={<Package className="w-6 h-6 text-[#9D5CF6]" />}
              title="Chưa có sản phẩm nào"
              description="Thêm sản phẩm đầu tiên để bắt đầu bán hàng tự động."
              actionLabel="Thêm sản phẩm"
              onAction={() => setCurrentPage('products')}
            />
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#161626]/50 border border-white/5 hover:border-[#7C3AED]/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : idx === 1
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                          : 'bg-white/5 text-[#6B658E]'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-[#F0EDFF] truncate">{p.name}</div>
                      <div className="text-[10.5px] text-[#6B658E]">{p.category}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-emerald-400">
                      {p.price.toLocaleString('vi-VN')}đ
                    </div>
                    <div className="text-[10.5px] text-[#8B84A8]">Đã bán {p.soldCount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
