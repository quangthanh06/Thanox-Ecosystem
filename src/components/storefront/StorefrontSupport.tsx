import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  HelpCircle,
  MessageSquare,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Headphones,
} from 'lucide-react';

export const StorefrontSupport: React.FC = () => {
  const {
    tickets,
    currentUser,
    createTicket,
    addTicketMessage,
    settings,
    navigateToStorefront,
    showToast,
  } = useStore();

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');

  const userTickets = tickets.filter((t) => t.userId === currentUser.id);
  const currentTicket = userTickets.find((t) => t.id === activeTicketId) || userTickets[0];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      showToast('Vui lòng điền tiêu đề và nội dung cần hỗ trợ', 'error');
      return;
    }
    const newId = createTicket(subject, initialMessage);
    setActiveTicketId(newId);
    setIsCreatingNew(false);
    setSubject('');
    setInitialMessage('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentTicket) return;
    addTicketMessage(currentTicket.id, replyText);
    setReplyText('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="border-b border-white/5 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8B84A8] mb-1.5">
            <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
              Trang Chủ
            </button>
            <span>/</span>
            <span className="text-[#9D5CF6] font-medium">Trung Tâm Hỗ Trợ</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#F0EDFF]">
            Hỗ Trợ Kỹ Thuật & Khiếu Nại 24/7
          </h1>
          <p className="text-xs text-[#8B84A8] mt-0.5">
            Gửi yêu cầu hỗ trợ khi gặp sự cố về key bản quyền, lỗi file hoặc nạp tiền
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreatingNew(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tạo Ticket Mới
          </Button>
        </div>
      </div>

      {/* Support Layout */}
      {isCreatingNew ? (
        <div className="max-w-2xl mx-auto bg-[#0F0F1A] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-display font-bold text-base text-[#F0EDFF]">Tạo Yêu Cầu Hỗ Trợ Mới</h3>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="text-xs text-[#8B84A8] hover:text-white"
            >
              Hủy
            </button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#CBC7E0]">Tiêu đề vấn đề:</label>
              <input
                type="text"
                placeholder="Ví dụ: Lỗi key không kích hoạt được OB44..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#CBC7E0]">Mô tả chi tiết lỗi:</label>
              <textarea
                rows={5}
                placeholder="Vui lòng cung cấp mã đơn hàng hoặc mô tả dòng máy đang dùng để admin hỗ trợ nhanh nhất..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <Button variant="primary" size="md" type="submit" className="w-full justify-center">
              Gửi Ticket Hỗ Trợ
            </Button>
          </form>
        </div>
      ) : userTickets.length === 0 ? (
        <div className="text-center py-16 bg-[#0F0F1A] border border-dashed border-white/10 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto">
            <Headphones className="w-8 h-8" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#F0EDFF]">
            Hiện Không Có Yêu Cầu Hỗ Trợ Nào
          </h2>
          <p className="text-xs text-[#8B84A8] max-w-sm mx-auto">
            Nếu bạn gặp bất kỳ vấn đề gì khi mua và sử dụng file, hãy tạo ticket để được giải quyết ngay.
          </p>
          <Button variant="primary" onClick={() => setIsCreatingNew(true)}>
            Tạo Ticket Hỗ Trợ
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Tickets List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-[#8B84A8] uppercase tracking-wider px-1">
              Danh sách Ticket ({userTickets.length})
            </div>
            <div className="space-y-2">
              {userTickets.map((t) => {
                const isSelected = currentTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTicketId(t.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#7C3AED]/15 border-[#7C3AED]'
                        : 'bg-[#0F0F1A] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#9D5CF6]">{t.id}</span>
                      <Badge
                        variant={t.status === 'open' ? 'warning' : 'success'}
                        size="xs"
                      >
                        {t.status === 'open' ? 'Đang xử lý' : 'Đã giải quyết'}
                      </Badge>
                    </div>
                    <div className="font-display font-bold text-xs text-[#F0EDFF] line-clamp-1">
                      {t.subject}
                    </div>
                    <div className="text-[10.5px] text-[#8B84A8] flex items-center justify-between">
                      <span>{t.createdAt}</span>
                      <span>{t.messages.length} tin nhắn</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Ticket Conversation (8 cols) */}
          {currentTicket && (
            <div className="lg:col-span-8 bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 flex flex-col justify-between min-h-[480px]">
              {/* Ticket Head */}
              <div className="border-b border-white/5 pb-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#9D5CF6]">{currentTicket.id}</span>
                  <Badge variant={currentTicket.status === 'open' ? 'warning' : 'success'} size="xs">
                    {currentTicket.status === 'open' ? 'Đang hỗ trợ' : 'Đã hoàn tất'}
                  </Badge>
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base text-[#F0EDFF]">
                  {currentTicket.subject}
                </h3>
              </div>

              {/* Messages List */}
              <div className="py-4 space-y-3 flex-1 overflow-y-auto max-h-[350px]">
                {currentTicket.messages.map((m) => {
                  const isUser = m.senderRole === 'user' || m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-[#6B658E] mb-1 px-1">
                        {m.senderName} • {m.createdAt || m.time}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl text-xs max-w-md leading-relaxed ${
                          isUser
                            ? 'bg-[#7C3AED] text-white rounded-br-none'
                            : 'bg-[#161626] text-[#CBC7E0] border border-white/5 rounded-bl-none'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập nội dung phản hồi cho Admin..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                />
                <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-4 h-4" />}>
                  Gửi
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
