import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Drawer } from './ui/Drawer';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  CreditCard,
  Key,
  ExternalLink,
  User,
} from 'lucide-react';

export const OrdersView: React.FC = () => {
  const { orders, updateOrderStatus, showToast, navigateToStorefront } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');

  // Detail Drawer State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label}!`, 'success');
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast('Không có đơn hàng nào để xuất', 'warning');
      return;
    }

    const headers = ['Mã Đơn', 'Khách Hàng', 'Email', 'Sản Phẩm', 'Số Lượng', 'Tổng Tiền (VNĐ)', 'Phương Thức', 'Trạng Thái', 'Thời Gian'];
    const rows = orders.map((o) => [
      o.orderCode,
      o.userName,
      o.userEmail,
      `"${o.productName}"`,
      o.quantity,
      o.totalPrice,
      o.paymentMethod,
      o.status,
      o.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thanox_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!', 'success');
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
    const matchesPayment = selectedPayment === 'all' || o.paymentMethod === selectedPayment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="xs" dot>Hoàn thành</Badge>;
      case 'processing':
        return <Badge variant="warning" size="xs" dot>Đang xử lý</Badge>;
      case 'pending':
        return <Badge variant="info" size="xs" dot>Chờ duyệt</Badge>;
      case 'failed':
        return <Badge variant="neutral" size="xs" dot>Thất bại</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="xs" dot>Đã hủy</Badge>;
      default:
        return <Badge variant="neutral" size="xs">{status}</Badge>;
    }
  };

  const getPaymentBadge = (method: Order['paymentMethod']) => {
    switch (method) {
      case 'wallet':
        return <span className="text-[#A78BFA] font-semibold">Ví Thanox</span>;
      case 'bank':
        return <span className="text-emerald-400 font-semibold">Chuyển khoản VietQR</span>;
      case 'card':
        return <span className="text-amber-400 font-semibold">Thẻ cào</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F1A] border border-white/5 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-[#F0EDFF]">Quản Lý Đơn Hàng</h2>
            <Badge variant="brand" size="xs">
              {orders.length} đơn
            </Badge>
          </div>
          <p className="text-xs text-[#6B658E] mt-0.5">
            Lịch sử mua hàng, trạng thái giao mã kích hoạt và xử lý hoàn tiền ví
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Xuất File CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-3" variant="default">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B658E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn (#TX-...), tên khách, email, sản phẩm..."
              className="w-full bg-[#161626] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">🟢 Hoàn thành</option>
              <option value="processing">🟡 Đang xử lý</option>
              <option value="pending">🔵 Chờ duyệt</option>
              <option value="cancelled">🔴 Đã hủy</option>
              <option value="failed">⚪ Thất bại</option>
            </select>

            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="wallet">Ví Thanox</option>
              <option value="bank">Ngân hàng VietQR</option>
              <option value="card">Thẻ cào</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6 text-[#9D5CF6]" />}
          title="Chưa có đơn hàng nào"
          description={
            orders.length === 0
              ? 'Hệ thống chưa ghi nhận đơn hàng nào. Mở cửa hàng để mua thử nghiệm.'
              : 'Không tìm thấy đơn hàng phù hợp với bộ lọc.'
          }
          actionLabel="Thử Đặt Hàng"
          onAction={() => navigateToStorefront('products')}
        />
      ) : (
        <Card className="p-0 overflow-hidden" variant="default">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[750px]">
              <thead>
                <tr className="bg-[#161626]/60 text-[#555074] border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Sản Phẩm</th>
                  <th className="py-3 px-4">Tổng Tiền</th>
                  <th className="py-3 px-4">Thanh Toán</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Order Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#F0EDFF]">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="hover:text-[#9D5CF6] transition-colors cursor-pointer text-left"
                      >
                        {order.orderCode}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#F0EDFF]">{order.userName}</div>
                      <div className="text-[10px] text-[#6B658E]">{order.userEmail}</div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#F0EDFF] max-w-[180px] truncate">
                        {order.productName}
                      </div>
                      <div className="text-[10px] text-[#8B84A8]">SL: {order.quantity} | {order.category}</div>
                    </td>

                    {/* Total Price */}
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {order.totalPrice.toLocaleString('vi-VN')}đ
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 text-[11px]">{getPaymentBadge(order.paymentMethod)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-[#6B658E] text-[11px] font-mono">{order.createdAt}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setSelectedOrder(order)}
                        leftIcon={<Eye className="w-3 h-3" />}
                      >
                        Xem
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Chi Tiết Đơn Hàng ${selectedOrder.orderCode}` : 'Chi Tiết'}
        subtitle="Thông tin giao dịch, khách hàng và nội dung bàn giao"
        footer={
          selectedOrder && (
            <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
              Đóng
            </Button>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs">
            {/* Status overview box */}
            <div className="p-4 rounded-2xl bg-[#161626] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#6B658E] uppercase tracking-wider font-bold">
                  Trạng Thái Hiện Tại
                </span>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#6B658E] uppercase tracking-wider font-bold">
                  Tổng Thanh Toán
                </span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {selectedOrder.totalPrice.toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="p-4 rounded-2xl bg-[#161626]/50 border border-white/5 space-y-2.5">
              <h4 className="font-semibold text-[#F0EDFF] text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#9D5CF6]" /> Thông Tin Khách Hàng
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#6B658E]">Tên đăng nhập:</span>
                  <span className="text-[#F0EDFF] font-semibold ml-1">{selectedOrder.userName}</span>
                </div>
                <div>
                  <span className="text-[#6B658E]">Email liên hệ:</span>
                  <span className="text-[#F0EDFF] font-semibold ml-1">{selectedOrder.userEmail}</span>
                </div>
                <div>
                  <span className="text-[#6B658E]">Phương thức:</span>
                  <span className="ml-1">{getPaymentBadge(selectedOrder.paymentMethod)}</span>
                </div>
                <div>
                  <span className="text-[#6B658E]">Thời gian tạo:</span>
                  <span className="text-[#8B84A8] ml-1 font-mono">{selectedOrder.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Product item details */}
            <div className="p-4 rounded-2xl bg-[#161626]/50 border border-white/5 space-y-2.5">
              <h4 className="font-semibold text-[#F0EDFF] text-xs flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#06B6D4]" /> Sản Phẩm Đặt Mua
              </h4>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0F0F1A] border border-white/5">
                <div>
                  <div className="font-semibold text-[#F0EDFF]">{selectedOrder.productName}</div>
                  <div className="text-[10.5px] text-[#6B658E]">{selectedOrder.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">
                    {selectedOrder.totalPrice.toLocaleString('vi-VN')}đ
                  </div>
                  <div className="text-[10px] text-[#8B84A8]">Số lượng: {selectedOrder.quantity}</div>
                </div>
              </div>
            </div>

            {/* Delivered Key or Content */}
            <div className="p-4 rounded-2xl bg-[#161626]/50 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-[#F0EDFF] text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Nội Dung Đã Bàn Giao
                </h4>
                {selectedOrder.deliveredContent && (
                  <button
                    onClick={() => copyToClipboard(selectedOrder.deliveredContent || '', 'nội dung bàn giao')}
                    className="text-[11px] text-[#9D5CF6] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Sao chép
                  </button>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#0F0F1A] border border-white/5 text-xs text-[#F0EDFF] font-mono whitespace-pre-wrap break-all">
                {selectedOrder.deliveredContent || 'Chưa có nội dung giao tự động'}
              </div>
            </div>

            {/* Quick Status Changer */}
            <div className="p-4 rounded-2xl bg-[#161626]/50 border border-white/5 space-y-2">
              <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                Đổi Trạng Thái Đơn Hàng
              </label>
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  const newStat = e.target.value as OrderStatus;
                  updateOrderStatus(selectedOrder.id, newStat);
                  setSelectedOrder({ ...selectedOrder, status: newStat });
                }}
                className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="completed">🟢 Hoàn thành (Giao file)</option>
                <option value="processing">🟡 Đang xử lý</option>
                <option value="pending">🔵 Chờ duyệt</option>
                <option value="cancelled">🔴 Đã hủy</option>
                <option value="failed">⚪ Thất bại</option>
              </select>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
