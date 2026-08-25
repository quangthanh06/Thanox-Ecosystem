import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Drawer } from './ui/Drawer';
import { EmptyState } from './ui/EmptyState';
import {
  ShoppingBag,
  Search,
  Eye,
  RotateCcw,
  Download,
  Copy,
  User,
} from 'lucide-react';

export const OrdersView: React.FC = () => {
  const { orders, updateOrderStatus, showToast, navigateToStorefront, refundOrder } = useStore();

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
        return <span className="text-[#C084FC] font-bold">Ví Thanox</span>;
      case 'bank':
        return <span className="text-emerald-300 font-bold">Chuyển khoản VietQR</span>;
      case 'card':
        return <span className="text-amber-300 font-bold">Thẻ cào</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-prominent border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-black text-[#F4F2FF] tracking-tight">Quản Lý Đơn Hàng</h2>
            <Badge variant="brand" size="xs">
              {orders.length} đơn
            </Badge>
          </div>
          <p className="text-xs text-[#938EB5] mt-0.5">
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
            <Search className="w-4 h-4 text-[#938EB5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn (#TX-...), tên khách, email, sản phẩm..."
              className="w-full glass-input rounded-2xl pl-9 pr-4 py-2 text-xs text-[#F4F2FF]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="glass-input rounded-2xl px-3 py-2 text-xs text-[#F4F2FF] cursor-pointer"
            >
              <option value="all" className="bg-[#121220] text-white">Tất cả trạng thái</option>
              <option value="completed" className="bg-[#121220] text-white">🟢 Hoàn thành</option>
              <option value="processing" className="bg-[#121220] text-white">🟡 Đang xử lý</option>
              <option value="pending" className="bg-[#121220] text-white">🔵 Chờ duyệt</option>
              <option value="cancelled" className="bg-[#121220] text-white">🔴 Đã hủy</option>
              <option value="failed" className="bg-[#121220] text-white">⚪ Thất bại</option>
            </select>

            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="glass-input rounded-2xl px-3 py-2 text-xs text-[#F4F2FF] cursor-pointer"
            >
              <option value="all" className="bg-[#121220] text-white">Tất cả thanh toán</option>
              <option value="wallet" className="bg-[#121220] text-white">Ví Thanox</option>
              <option value="bank" className="bg-[#121220] text-white">Ngân hàng VietQR</option>
              <option value="card" className="bg-[#121220] text-white">Thẻ cào</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6 text-[#C084FC]" />}
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
                <tr className="bg-white/[0.02] text-[#938EB5] border-b border-white/6 uppercase text-[10px] tracking-wider font-bold">
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
              <tbody className="divide-y divide-white/6">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Order Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#F4F2FF]">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="hover:text-[#C084FC] transition-colors cursor-pointer text-left"
                      >
                        {order.orderCode}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#F4F2FF]">{order.userName}</div>
                      <div className="text-[10px] text-[#938EB5]">{order.userEmail}</div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#F4F2FF] max-w-[180px] truncate">
                        {order.productName}
                      </div>
                      <div className="text-[10px] text-[#938EB5]">SL: {order.quantity} | {order.category}</div>
                    </td>

                    {/* Total Price */}
                    <td className="py-3.5 px-4 font-bold text-emerald-300">
                      {order.totalPrice.toLocaleString('vi-VN')}đ
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 text-[11px]">{getPaymentBadge(order.paymentMethod)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-[#938EB5] text-[11px] font-mono">{order.createdAt}</td>

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
            <div className="flex items-center justify-between w-full gap-2">
              {selectedOrder.status === 'completed' ? (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={async () => {
                    const reason = window.prompt(`Hoàn tiền ${selectedOrder.totalPrice.toLocaleString('vi-VN')}đ cho đơn ${selectedOrder.orderCode}.\nLý do hoàn tiền:`, 'Khách yêu cầu hoàn tiền');
                    if (reason === null) return;
                    const ok = await refundOrder(selectedOrder.id, reason);
                    if (ok) setSelectedOrder(null);
                  }}
                >
                  Hoàn Tiền
                </Button>
              ) : (
                <span />
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                Đóng
              </Button>
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs">
            {/* Status overview box */}
            <div className="p-4 rounded-3xl glass-subtle border border-white/6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#938EB5] uppercase tracking-wider font-bold">
                  Trạng Thái Hiện Tại
                </span>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#938EB5] uppercase tracking-wider font-bold">
                  Tổng Thanh Toán
                </span>
                <div className="text-base font-black text-emerald-300 mt-0.5">
                  {selectedOrder.totalPrice.toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="p-4 rounded-3xl glass-subtle border border-white/6 space-y-2.5">
              <h4 className="font-bold text-[#F4F2FF] text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C084FC]" /> Thông Tin Khách Hàng
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#938EB5]">Tên đăng nhập:</span>
                  <span className="text-[#F4F2FF] font-bold ml-1">{selectedOrder.userName}</span>
                </div>
                <div>
                  <span className="text-[#938EB5]">Email liên hệ:</span>
                  <span className="text-[#F4F2FF] font-bold ml-1">{selectedOrder.userEmail}</span>
                </div>
                <div>
                  <span className="text-[#938EB5]">Phương thức:</span>
                  <span className="ml-1">{getPaymentBadge(selectedOrder.paymentMethod)}</span>
                </div>
                <div>
                  <span className="text-[#938EB5]">Thời gian tạo:</span>
                  <span className="text-[#938EB5] ml-1 font-mono">{selectedOrder.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Product item details */}
            <div className="p-4 rounded-3xl glass-subtle border border-white/6 space-y-2.5">
              <h4 className="font-bold text-[#F4F2FF] text-xs flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#22D3EE]" /> Sản Phẩm Đặt Mua
              </h4>
              <div className="flex items-center justify-between p-3 rounded-2xl glass-standard border border-white/6">
                <div>
                  <div className="font-bold text-[#F4F2FF]">{selectedOrder.productName}</div>
                  <div className="text-[10.5px] text-[#938EB5]">{selectedOrder.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-300">
                    {selectedOrder.totalPrice.toLocaleString('vi-VN')}đ
                  </div>
                  <div className="text-[10px] text-[#938EB5]">Số lượng: {selectedOrder.quantity}</div>
                </div>
              </div>
            </div>

            {/* Delivered Key or Account Content */}
            <div className="p-4 rounded-3xl glass-subtle border border-white/6 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#F4F2FF] text-xs flex items-center gap-1.5">
                  {(selectedOrder.category || '').toLowerCase().includes('tài khoản') || (selectedOrder.category || '').toLowerCase().includes('acc') ? (
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                      🔐 Tài Khoản & Mật Khẩu Bàn Giao
                    </span>
                  ) : (
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      🔑 Mã Key Bản Quyền / Link Bàn Giao
                    </span>
                  )}
                </h4>
                {selectedOrder.deliveredContent && (
                  <button
                    onClick={() => copyToClipboard(selectedOrder.deliveredContent || '', 'nội dung bàn giao')}
                    className="text-[11px] text-[#C084FC] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Sao chép tất cả
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-2xl glass-standard border border-white/6 text-xs text-cyan-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
                {selectedOrder.deliveredContent || 'Chưa có nội dung giao tự động'}
              </div>
            </div>

            {/* Quick Status Changer */}
            <div className="p-4 rounded-3xl glass-subtle border border-white/6 space-y-2">
              <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
                Đổi Trạng Thái Đơn Hàng
              </label>
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  const newStat = e.target.value as OrderStatus;
                  updateOrderStatus(selectedOrder.id, newStat);
                  setSelectedOrder({ ...selectedOrder, status: newStat });
                }}
                className="w-full glass-input rounded-2xl px-3 py-2 text-xs text-[#F4F2FF]"
              >
                <option value="completed" className="bg-[#121220] text-white">🟢 Hoàn thành (Giao file)</option>
                <option value="processing" className="bg-[#121220] text-white">🟡 Đang xử lý</option>
                <option value="pending" className="bg-[#121220] text-white">🔵 Chờ duyệt</option>
                <option value="cancelled" className="bg-[#121220] text-white">🔴 Đã hủy</option>
                <option value="failed" className="bg-[#121220] text-white">⚪ Thất bại</option>
              </select>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
