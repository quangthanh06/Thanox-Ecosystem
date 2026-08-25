import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CustomerFeedback } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import {
  HeadphonesIcon,
  Search,
  Send,
  MessageSquare,
  Star,
  Trash2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Heart,
} from 'lucide-react';

export const SupportView: React.FC = () => {
  const {
    tickets,
    users,
    orders,
    sendTicketMessage,
    updateTicketStatus,
    createSupportTicket,
    showToast,
  } = useStore();

  const [activeViewTab, setActiveViewTab] = useState<'tickets' | 'feedbacks'>('tickets');

  // Support Tickets State
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyMessage, setReplyMessage] = useState('');

  // Feedbacks State
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('thanox_customer_feedbacks_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toxicLogs, setToxicLogs] = useState<{
    id: string;
    authorName: string;
    rating: number;
    comment: string;
    productTag: string;
    createdAt: string;
    reason: string;
  }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('thanox_moderated_toxic_feedbacks') || '[]');
    } catch {
      return [];
    }
  });

  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [isAddFeedbackOpen, setIsAddFeedbackOpen] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('MENU FF VIP');

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

  const filteredFeedbacks = feedbacks.filter((fb) => {
    return (
      fb.authorName.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      fb.comment.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      fb.productTag.toLowerCase().includes(feedbackSearch.toLowerCase())
    );
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

  const handleDeleteFeedback = (id: string) => {
    const updated = feedbacks.filter((fb) => fb.id !== id);
    setFeedbacks(updated);
    try {
      localStorage.setItem('thanox_customer_feedbacks_v3', JSON.stringify(updated));
    } catch {}
    showToast('Đã xóa đánh giá thành công!', 'info');
  };

  const handleAddFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newAuthor.trim()) {
      showToast('Vui lòng nhập đầy đủ tên và nhận xét!', 'error');
      return;
    }

    const newFb: CustomerFeedback = {
      id: 'fb-admin-' + Date.now(),
      authorName: newAuthor.trim(),
      authorAvatar: newAuthor.substring(0, 2).toUpperCase(),
      rating: newRating,
      comment: newComment.trim(),
      productTag: newTag,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      timeAgo: 'Vừa xong',
      verifiedPurchase: true,
      likesCount: Math.floor(Math.random() * 20) + 10,
    };

    const updated = [newFb, ...feedbacks];
    setFeedbacks(updated);
    try {
      localStorage.setItem('thanox_customer_feedbacks_v3', JSON.stringify(updated));
    } catch {}

    setNewAuthor('');
    setNewComment('');
    setIsAddFeedbackOpen(false);
    showToast('Đã thêm đánh giá mới lên Storefront!', 'success');
  };

  const openCount = tickets.filter((t) => t.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header Banner with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-prominent border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-black text-[#F4F2FF] tracking-tight">
              Trung Tâm Hỗ Trợ & Kiểm Duyệt Feedback
            </h2>
            {openCount > 0 && activeViewTab === 'tickets' && (
              <Badge variant="danger" size="xs" dot>
                {openCount} ticket chưa giải quyết
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#938EB5] mt-0.5">
            Hỗ trợ khiếu nại khách hàng, quản lý danh sách đánh giá và kiểm soát bình luận tự động
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-[#121220] p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveViewTab('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewTab === 'tickets'
                ? 'btn-liquid-primary text-white shadow-md'
                : 'text-[#938EB5] hover:text-white'
            }`}
          >
            <HeadphonesIcon className="w-3.5 h-3.5" />
            <span>Ticket Khiếu Nại ({tickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('feedbacks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewTab === 'feedbacks'
                ? 'bg-[#7C3AED]/30 text-[#C084FC] border border-[#7C3AED]/50 shadow-md'
                : 'text-[#938EB5] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#C084FC]" />
            <span>Đánh Giá Feedback ({feedbacks.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SUPPORT TICKETS */}
      {activeViewTab === 'tickets' && (
        <>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* PANE 1: Ticket List */}
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

                  <div className="flex gap-1.5">
                    {['all', 'open', 'resolved'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-xl text-[10.5px] font-bold capitalize transition-colors cursor-pointer ${
                          statusFilter === st
                            ? 'bg-purple-500/20 text-[#C084FC] border border-purple-500/40'
                            : 'text-[#938EB5] hover:text-white'
                        }`}
                      >
                        {st === 'all' ? 'Tất cả' : st === 'open' ? 'Chưa Xong' : 'Đã Xong'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-white/6 overflow-y-auto flex-1">
                  {filteredTickets.map((t) => {
                    const isSelected = activeTicket?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`w-full text-left p-3.5 space-y-1.5 transition-colors block cursor-pointer ${
                          isSelected ? 'bg-white/[0.06] border-l-2 border-[#7C3AED]' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-[#C084FC]">{t.ticketNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'open' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {t.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[#F4F2FF] line-clamp-1">{t.subject}</div>
                        <div className="text-[10.5px] text-[#938EB5] flex items-center justify-between">
                          <span>{t.userName}</span>
                          <span>{t.createdAt.substring(0, 10)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* PANE 2: Chat Transcript */}
              <Card className="lg:col-span-5 p-0 flex flex-col justify-between overflow-hidden max-h-[420px] lg:max-h-[600px] lg:h-[600px]" variant="default">
                {activeTicket ? (
                  <>
                    <div className="p-3.5 border-b border-white/6 flex items-center justify-between shrink-0">
                      <div>
                        <div className="font-bold text-xs text-[#F4F2FF]">{activeTicket.subject}</div>
                        <div className="text-[10px] text-[#938EB5]">Mã: {activeTicket.ticketNumber} • Khách: {activeTicket.userName}</div>
                      </div>
                      <button
                        onClick={() => updateTicketStatus(activeTicket.id, activeTicket.status === 'open' ? 'closed' : 'open')}
                        className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-white/5 hover:bg-white/10 text-[#C084FC] border border-white/10 transition-colors cursor-pointer"
                      >
                        {activeTicket.status === 'open' ? 'Đóng Ticket' : 'Mở Lại'}
                      </button>
                    </div>

                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                      {activeTicket.messages.map((m) => {
                        const isAdmin = m.sender === 'admin';
                        return (
                          <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                            <div className="text-[10px] text-[#938EB5] mb-1">
                              {isAdmin ? '🛡️ Admin Thanox' : activeTicket.userName} • {m.time}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                              isAdmin
                                ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                                : 'bg-[#161626] border border-white/10 text-[#F4F2FF] rounded-tl-sm'
                            }`}>
                              {m.message}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSendReply} className="p-3 border-t border-white/6 flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Nhập câu trả lời cho khách..."
                        className="flex-1 bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F4F2FF] outline-none focus:border-cyan-400"
                      />
                      <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                        Gửi
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs text-[#938EB5]">Hãy chọn một ticket bên trái</div>
                )}
              </Card>

              {/* PANE 3: User Info */}
              <Card className="lg:col-span-3 p-5 space-y-4" variant="default">
                <h3 className="font-bold text-xs text-[#F4F2FF] uppercase tracking-wide">Thông Tin Khách Hàng</h3>
                {ticketUser ? (
                  <div className="space-y-3 text-xs">
                    <div className="font-bold text-white">{ticketUser.username}</div>
                    <div className="text-[#938EB5]">{ticketUser.email}</div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/8 space-y-1">
                      <div>Số dư ví: <span className="font-bold text-emerald-400">{ticketUser.balance.toLocaleString('vi-VN')}đ</span></div>
                      <div>Tổng đơn: <span className="font-bold text-white">{ticketUser.totalOrders}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#938EB5]">Chưa có thông tin tài khoản</div>
                )}
              </Card>
            </div>
          )}
        </>
      )}

      {/* TAB 2: FEEDBACKS MANAGEMENT & AUTO-MODERATION */}
      {activeViewTab === 'feedbacks' && (
        <div className="space-y-6">
          {/* Summary & Auto-Moderation Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4.5 space-y-1.5 border-[#7C3AED]/30" variant="default">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#938EB5] font-medium">Tổng Đánh Giá Công Khai</span>
                <MessageSquare className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{feedbacks.length}</div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Hiển thị trực tiếp tại Storefront</span>
              </div>
            </Card>

            <Card className="p-4.5 space-y-1.5 border-amber-500/30" variant="default">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#938EB5] font-medium">Điểm Đánh Giá Trung Bình</span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">4.9 / 5.0</div>
              <div className="text-[11px] text-[#938EB5]">99.8% đánh giá 5 sao hài lòng</div>
            </Card>

            <Card className="p-4.5 space-y-1.5 border-emerald-500/30" variant="default">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#938EB5] font-medium">Bộ Lọc Kiểm Duyệt Tự Động</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-black text-emerald-300 font-mono uppercase">🟢 ĐANG BẬT BẢO VỆ</div>
              <div className="text-[11px] text-[#938EB5]">Tự động xóa review chê / chửi bậy âm thầm</div>
            </Card>
          </div>

          {/* Action & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#938EB5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                placeholder="Tìm người đánh giá, nội dung, sản phẩm..."
                className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-8 pr-3 py-2 text-xs text-[#F4F2FF] outline-none focus:border-cyan-400"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddFeedbackOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="font-bold text-xs"
            >
              + Thêm Đánh Giá Mới
            </Button>
          </div>

          {/* Feedbacks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeedbacks.map((fb) => (
              <Card key={fb.id} className="p-4 space-y-3 flex flex-col justify-between border-white/8 hover:border-[#7C3AED]/40 transition-all" variant="default">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-[10px] font-black text-white">
                        {fb.authorAvatar || 'GT'}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1">
                          <span>{fb.authorName}</span>
                          {fb.verifiedPurchase && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <div className="text-[10px] text-[#938EB5]">{fb.timeAgo || fb.createdAt}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: fb.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11.5px] text-[#E2DEFA] italic leading-relaxed">
                    "{fb.comment}"
                  </p>
                </div>

                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-[#C084FC] font-semibold border border-white/8">
                    {fb.productTag}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-[10.5px] text-[#938EB5] flex items-center gap-1">
                      <Heart className="w-3 h-3 text-pink-400" />
                      <span>{fb.likesCount || 0}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
                      title="Xóa đánh giá này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Toxic Log Section (Suppressed Feedback) */}
          {toxicLogs.length > 0 && (
            <div className="mt-8 space-y-3 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <h3 className="font-bold text-xs text-red-300 uppercase tracking-wider">
                    Nhật Ký Tự Động Chặn Đánh Giá Xấu / Chửi Bậy ({toxicLogs.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('thanox_moderated_toxic_feedbacks');
                    setToxicLogs([]);
                    showToast('Đã xóa sạch nhật ký kiểm duyệt!', 'info');
                  }}
                  className="text-[10.5px] text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  Xóa Lịch Sử
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/6 glass-subtle">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/6 text-[#938EB5] text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Người Gửi</th>
                      <th className="p-3">Nội Dung</th>
                      <th className="p-3">Số Sao</th>
                      <th className="p-3">Lý Do Chặn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6 text-[11px]">
                    {toxicLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-white">{log.authorName}</td>
                        <td className="p-3 text-red-300 italic max-w-xs truncate">"{log.comment}"</td>
                        <td className="p-3 text-amber-300">{log.rating} ⭐</td>
                        <td className="p-3 text-red-400 font-semibold">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD NEW FEEDBACK */}
      <Modal
        isOpen={isAddFeedbackOpen}
        onClose={() => setIsAddFeedbackOpen(false)}
        title="Thêm Đánh Giá Khách Hàng Mới (Admin)"
        size="md"
      >
        <form onSubmit={handleAddFeedbackSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider block">
              Tên Khách Hàng / Biệt Danh
            </label>
            <input
              type="text"
              required
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="VD: Tuấn Gaming, Hoang Nam FF..."
              className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider block">
                Số Sao Đánh Giá
              </label>
              <div className="flex items-center gap-1.5 bg-[#161626] border border-white/10 rounded-xl px-3 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewRating(s)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${s <= newRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider block">
                Gắn Tag Sản Phẩm
              </label>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#F0EDFF] outline-none focus:border-cyan-400"
              >
                <option value="MENU FF VIP">MENU FF VIP</option>
                <option value="FILE ANDROID">FILE ANDROID</option>
                <option value="FILE IOS">FILE IOS</option>
                <option value="KEY VIP">KEY VIP</option>
                <option value="PROXY RIÊNG">PROXY RIÊNG</option>
                <option value="Nạp Ví VietQR">Nạp Ví VietQR</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider block">
              Nội Dung Nhận Xét
            </label>
            <textarea
              required
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Nhập cảm nhận chân thật, vui vẻ, có dấu :)) hoặc ^^..."
              className="w-full bg-[#161626] border border-white/10 rounded-xl p-3 text-xs text-[#F0EDFF] outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddFeedbackOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Xuất Bản Đánh Giá
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
