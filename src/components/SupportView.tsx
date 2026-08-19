import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { SupportTicket } from '../types';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import {
  HeadphonesIcon,
  Search,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Wallet,
  User,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';

export const SupportView: React.FC = () => {
  const {
    tickets,
    users,
    orders,
    sendTicketMessage,
    updateTicketStatus,
    createSupportTicket,
    setCurrentPage,
    showToast,
  } = useStore();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyMessage, setReplyMessage] = useState('');

  // Selected Ticket
  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  // Selected User info
  const ticketUser = activeTicket ? users.find((u) => u.id === activeTicket.userId) : null;
  const relatedOrder = activeTicket?.relatedOrderCode
    ? orders.find((o) => o.orderCode === activeTicket.relatedOrderCode)
    : null;

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    sendTicketMessage(activeTicket.id, replyMessage.trim(), 'admin');
    setReplyMessage('');
  };

  const handleCannedReply = (text: string) => {
    setReplyMessage(text);
  };

  const openCount = tickets.filter((t) => t.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F1A] border border-white/5 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-[#F0EDFF]">Trung Tâm Hỗ Trợ Khách Hàng</h2>
            {openCount > 0 && (
              <Badge variant="danger" size="xs" dot>
                {openCount} ticket chưa giải quyết
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#6B658E] mt-0.5">
            Phản hồi khiếu nại, hỗ trợ cài đặt tệp tin và hướng dẫn kích hoạt key
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<HeadphonesIcon className="w-6 h-6 text-[#9D5CF6]" />}
          title="Không có yêu cầu hỗ trợ nào"
          description="Khi khách hàng gửi ticket khiếu nại hoặc hỏi đáp, tin nhắn sẽ hiển thị tại đây."
          actionLabel="Tạo Ticket Thử Nghiệm"
          onAction={() =>
            createSupportTicket('Cần hỗ trợ nhận file Android', 'Kỹ thuật', 'Tôi đã mua file nhưng chưa rõ cách cài đặt.')
          }
        />
      ) : (
        /* 3-PANE SUPPORT DESK */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* PANE 1: Ticket List (Col 4) */}
          <Card className="lg:col-span-4 p-0 flex flex-col justify-between overflow-hidden max-h-[420px] lg:max-h-[600px] lg:h-[600px]" variant="default">
            <div className="p-3 border-b border-white/5 space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6B658E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã ticket, tên khách..."
                  className="w-full bg-[#161626] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {(['all', 'open', 'processing', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-[#7C3AED] text-white'
                        : 'text-[#8B84A8] hover:text-white bg-[#161626]'
                    }`}
                  >
                    {st === 'all'
                      ? 'Tất cả'
                      : st === 'open'
                      ? 'Mở'
                      : st === 'processing'
                      ? 'Đang xử lý'
                      : 'Đóng'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket items */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 min-h-0">
              {filteredTickets.map((ticket) => {
                const isSelected = activeTicket?.id === ticket.id;
                const lastMsg = ticket.messages[ticket.messages.length - 1];

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#7C3AED]/15 border-l-2 border-[#9D5CF6]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono font-bold text-[#A78BFA]">{ticket.ticketNumber}</span>
                      <Badge
                        variant={
                          ticket.status === 'open'
                            ? 'danger'
                            : ticket.status === 'processing'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="xs"
                        dot
                      >
                        {ticket.status === 'open'
                          ? 'Mới'
                          : ticket.status === 'processing'
                          ? 'Đang xử lý'
                          : 'Đã đóng'}
                      </Badge>
                    </div>

                    <div className="font-semibold text-[#F0EDFF] truncate">{ticket.subject}</div>
                    <div className="text-[11px] text-[#6B658E] truncate mt-0.5">
                      {lastMsg ? lastMsg.message : 'Chưa có tin nhắn'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#4E4A6F] mt-2">
                      <span>{ticket.userName}</span>
                      <span>{ticket.updatedAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* PANE 2: Interactive Live Chat (Col 5) */}
          <Card className="lg:col-span-5 p-0 flex flex-col justify-between overflow-hidden min-h-[450px] lg:h-[600px]" variant="default">
            {activeTicket ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 border-b border-white/5 bg-[#161626]/50 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#A78BFA]">
                        {activeTicket.ticketNumber}
                      </span>
                      <h3 className="font-semibold text-xs text-[#F0EDFF] truncate">
                        {activeTicket.subject}
                      </h3>
                    </div>
                    <div className="text-[10.5px] text-[#6B658E] mt-0.5">
                      Khách hàng: <span className="text-[#F0EDFF]">{activeTicket.userName}</span>
                    </div>
                  </div>

                  <select
                    value={activeTicket.status}
                    onChange={(e) => updateTicketStatus(activeTicket.id, e.target.value as any)}
                    className="bg-[#0F0F1A] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="open">🔴 Đang mở</option>
                    <option value="processing">🟡 Đang xử lý</option>
                    <option value="closed">🟢 Đã giải quyết</option>
                  </select>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0A0A13]">
                  {activeTicket.messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#6B658E]">
                          <span className="font-semibold text-[#8B84A8]">{msg.senderName}</span>
                          <span>•</span>
                          <span>{msg.time}</span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                            isAdmin
                              ? 'bg-[#7C3AED] text-white rounded-br-none shadow-md shadow-[#7C3AED]/20'
                              : 'bg-[#161626] text-[#F0EDFF] border border-white/10 rounded-bl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Canned Replies & Send Input */}
                <div className="p-3 border-t border-white/5 bg-[#161626]/40 space-y-2">
                  {/* Canned reply chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => handleCannedReply('Chào bạn, mình đã kiểm tra và gửi lại mã kích hoạt cho bạn nhé!')}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-[#A78BFA] border border-white/5 whitespace-nowrap cursor-pointer"
                    >
                      ⚡ Gửi lại key
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCannedReply('Đơn hàng đã được hoàn tiền trực tiếp vào số dư ví của bạn.')}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/5 whitespace-nowrap cursor-pointer"
                    >
                      💰 Báo hoàn tiền
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCannedReply('Bạn vui lòng gửi ảnh chụp lỗi màn hình để bên mình kiểm tra kỹ hơn nhé.')}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-[#06B6D4] border border-white/5 whitespace-nowrap cursor-pointer"
                    >
                      📸 Yêu cầu ảnh lỗi
                    </button>
                  </div>

                  {/* Send Form */}
                  <form onSubmit={handleSendReply} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Nhập nội dung phản hồi khách hàng..."
                      className="flex-1 bg-[#0F0F1A] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                    />
                    <Button variant="primary" size="sm" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />}>
                      Gửi
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[#6B658E]">
                Chọn ticket để xem chi tiết
              </div>
            )}
          </Card>

          {/* PANE 3: Customer 360 & Order Details (Col 3) */}
          <Card className="lg:col-span-3 p-4 space-y-4" variant="default">
            <CardHeader title="Thông Tin Khách Hàng" subtitle="Hồ sơ thành viên & lịch sử mua" />

            {ticketUser ? (
              <div className="space-y-4 text-xs">
                {/* User avatar and balance card */}
                <div className="p-3.5 rounded-xl bg-[#161626]/60 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-bold text-white shadow-sm">
                      {ticketUser.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[#F0EDFF]">{ticketUser.username}</div>
                      <div className="text-[10px] text-[#6B658E]">{ticketUser.email}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex justify-between items-baseline">
                    <span className="text-[#8B84A8]">Số dư ví:</span>
                    <span className="font-bold text-emerald-400">
                      {ticketUser.balance.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8B84A8]">Tổng chi tiêu:</span>
                    <span className="text-[#F0EDFF] font-medium">
                      {ticketUser.totalSpent.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* Related Order Shortcut */}
                {activeTicket?.relatedOrderCode && (
                  <div className="p-3.5 rounded-xl bg-[#161626]/60 border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-[#6B658E] uppercase tracking-wider">
                      Đơn Hàng Liên Quan
                    </span>
                    <div className="font-mono font-bold text-[#A78BFA]">
                      {activeTicket.relatedOrderCode}
                    </div>
                    {relatedOrder && (
                      <div className="text-[11px] text-[#8B84A8]">
                        <div>Sản phẩm: {relatedOrder.productName}</div>
                        <div>Tổng: {relatedOrder.totalPrice.toLocaleString('vi-VN')}đ</div>
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setCurrentPage('orders')}
                      className="w-full mt-1"
                    >
                      Xem Đơn Này
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#6B658E]">Không tìm thấy hồ sơ thành viên</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
