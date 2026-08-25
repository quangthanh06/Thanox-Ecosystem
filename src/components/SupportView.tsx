import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import {
  HeadphonesIcon,
  Search,
  Send,
  MessageSquare,
  ShoppingBag,
  Wallet,
  User,
  Shield,
  Sparkles,
} from 'lucide-react';

export const SupportView: React.FC = () => {
  const {
    tickets,
    users,
    orders,
    sendTicketMessage,
    updateTicketStatus,
    createSupportTicket,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-prominent border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-black text-[#F4F2FF] tracking-tight">Trung Tâm Hỗ Trợ Khách Hàng</h2>
            {openCount > 0 && (
              <Badge variant="danger" size="xs" dot>
                {openCount} ticket chưa giải quyết
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#938EB5] mt-0.5">
            Phản hồi khiếu nại, hỗ trợ cài đặt tệp tin và hướng dẫn kích hoạt key
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<HeadphonesIcon className="w-6 h-6 text-[#C084FC]" />}
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
            <div className="p-3.5 border-b border-white/6 space-y-2.5 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#938EB5] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã ticket, tên khách..."
                  className="w-full glass-input rounded-2xl pl-8 pr-3 py-1.5 text-xs text-[#F4F2FF]"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {(['all', 'open', 'processing', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'btn-liquid-primary text-white shadow-sm'
                        : 'text-[#938EB5] hover:text-white glass-subtle'
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

            {/* Scrollable list of tickets */}
            <div className="overflow-y-auto flex-1 divide-y divide-white/6 custom-scrollbar">
              {filteredTickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3.5 transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-[#7C3AED]/15 border-l-4 border-l-[#7C3AED]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10.5px] font-bold text-[#C084FC]">
                        {t.ticketNumber}
                      </span>
                      <Badge
                        variant={
                          t.status === 'open'
                            ? 'danger'
                            : t.status === 'processing'
                            ? 'warning'
                            : 'success'
                        }
                        size="xs"
                      >
                        {t.status === 'open' ? 'Mở' : t.status === 'processing' ? 'Xử lý' : 'Đóng'}
                      </Badge>
                    </div>

                    <div className="font-bold text-xs text-[#F4F2FF] truncate">{t.subject}</div>

                    <div className="flex items-center justify-between text-[10.5px] text-[#938EB5]">
                      <span>{t.userName}</span>
                      <span>{t.createdAt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* PANE 2: Conversation Thread (Col 5) */}
          <Card className="lg:col-span-5 p-0 flex flex-col justify-between overflow-hidden max-h-[500px] lg:max-h-[600px] lg:h-[600px]" variant="default">
            {activeTicket ? (
              <>
                {/* Thread Header */}
                <div className="p-3.5 border-b border-white/6 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-bold text-xs text-[#F4F2FF] truncate max-w-[200px] sm:max-w-xs">
                      {activeTicket.subject}
                    </h3>
                    <div className="text-[10px] text-[#938EB5]">Mã: {activeTicket.ticketNumber} • Mục: {activeTicket.category}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={activeTicket.status}
                      onChange={(e) => updateTicketStatus(activeTicket.id, e.target.value as any)}
                      className="glass-input rounded-xl px-2.5 py-1 text-[11px] text-[#F4F2FF] cursor-pointer"
                    >
                      <option value="open" className="bg-[#121220] text-white">Mở</option>
                      <option value="processing" className="bg-[#121220] text-white">Đang xử lý</option>
                      <option value="closed" className="bg-[#121220] text-white">Đóng ticket</option>
                    </select>
                  </div>
                </div>

                {/* Messages View */}
                <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                  {activeTicket.messages.map((msg) => {
                    const isAdmin = msg.senderRole === 'admin' || msg.sender === 'admin';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className="text-[10px] text-[#5C567A] mb-1 px-1">
                          {msg.senderName} • {msg.time || msg.createdAt}
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                            isAdmin
                              ? 'btn-liquid-primary rounded-br-none'
                              : 'glass-subtle text-[#E2DEFA] border border-white/8 rounded-bl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Canned Responses */}
                <div className="p-2 border-t border-white/6 flex items-center gap-1.5 overflow-x-auto shrink-0 text-[10px]">
                  <span className="text-[#938EB5] px-1 shrink-0 font-bold">Mẫu:</span>
                  <button
                    type="button"
                    onClick={() => handleCannedReply('Chào bạn, bạn vui lòng cung cấp mã đơn hàng để Admin kiểm tra nhé.')}
                    className="px-2 py-0.5 rounded-lg glass-subtle text-[#938EB5] hover:text-white cursor-pointer truncate max-w-[140px]"
                  >
                    Xin mã đơn
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCannedReply('Đã hỗ trợ reset key mới cho bạn, bạn kiểm tra lại trong mục Đơn Hàng nhé!')}
                    className="px-2 py-0.5 rounded-lg glass-subtle text-[#938EB5] hover:text-white cursor-pointer truncate max-w-[140px]"
                  >
                    Đã cấp lại key
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCannedReply('Đã hoàn tiền ví cho bạn thành công!')}
                    className="px-2 py-0.5 rounded-lg glass-subtle text-[#938EB5] hover:text-white cursor-pointer truncate max-w-[140px]"
                  >
                    Đã hoàn tiền
                  </button>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="p-3 border-t border-white/6 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Nhập nội dung phản hồi cho khách..."
                    className="flex-1 glass-input rounded-2xl px-3.5 py-2 text-xs text-[#F4F2FF]"
                  />
                  <Button variant="primary" size="sm" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />}>
                    Gửi
                  </Button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-[#938EB5]">Chọn một ticket để xem chi tiết</div>
            )}
          </Card>

          {/* PANE 3: Customer Quick Profile (Col 3) */}
          <Card className="lg:col-span-3 p-5 space-y-4 max-h-[600px]" variant="default">
            <h4 className="font-bold text-xs text-[#F4F2FF] border-b border-white/6 pb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#C084FC]" /> Thông Tin Khách Hàng
            </h4>

            {ticketUser ? (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-bold text-white shadow-sm">
                    {ticketUser.avatarText || ticketUser.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-[#F4F2FF]">{ticketUser.username}</div>
                    <div className="text-[10.5px] text-[#938EB5]">{ticketUser.email}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-subtle border border-white/6 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#938EB5]">Số dư ví:</span>
                    <span className="font-bold text-emerald-300">
                      {ticketUser.balance.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#938EB5]">Tổng đơn mua:</span>
                    <span className="font-bold text-white">{ticketUser.totalOrders} đơn</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#938EB5]">Tổng chi tiêu:</span>
                    <span className="font-bold text-[#C084FC]">
                      {ticketUser.totalSpent.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {relatedOrder && (
                  <div className="p-3.5 rounded-2xl glass-subtle border border-white/6 space-y-1.5">
                    <div className="text-[10px] text-[#938EB5] uppercase font-bold">Đơn hàng liên quan</div>
                    <div className="font-bold text-white text-xs">{relatedOrder.productName}</div>
                    <div className="text-[10.5px] text-emerald-300 font-bold">
                      {relatedOrder.totalPrice.toLocaleString('vi-VN')}đ ({relatedOrder.status})
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#938EB5]">
                {activeTicket ? `Khách: ${activeTicket.userName}` : 'Chưa có thông tin'}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
