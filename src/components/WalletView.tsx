import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { TopupRequest } from '../types';
import { Card } from './ui/Card';
import { StatCard } from './ui/StatCard';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { EmptyState } from './ui/EmptyState';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  Trash2,
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const {
    topups,
    cardRecharges,
    users,
    approveTopup,
    rejectTopup,
    approveCardRecharge,
    rejectCardRecharge,
    adjustUserBalance,
    createTopupRequest,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'cards' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Reject Modal
  const [rejectModalTarget, setRejectModalTarget] = useState<TopupRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Giao dịch không khớp sao kê tài khoản');

  // Manual Balance Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [adjustAmount, setAdjustAmount] = useState<number>(100000);
  const [adjustAction, setAdjustAction] = useState<'add' | 'subtract'>('add');
  const [adjustNote, setAdjustNote] = useState('Thưởng nạp sự kiện hoặc hỗ trợ nạp bù');

  // Test Topup creation for simulation
  const [isSimulateTopupOpen, setIsSimulateTopupOpen] = useState(false);
  const [simAmount, setSimAmount] = useState(100000);
  const [simMethod, setSimMethod] = useState<TopupRequest['method']>('Bank Transfer');
  const [simNote, setSimNote] = useState('NAP THANOX');

  // Real calculations
  const pendingTopups = topups.filter((t) => t.status === 'pending');
  const approvedTopups = topups.filter((t) => t.status === 'approved');
  const pendingCards = cardRecharges.filter((c) => c.status === 'pending');

  const totalTopupApprovedAmount = approvedTopups.reduce((sum, t) => sum + t.amount, 0);
  const totalUserBalances = users.reduce((sum, u) => sum + u.balance, 0);

  const filteredHistory = topups.filter((t) => {
    const matchesQuery =
      t.requestCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transferNote.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQuery;
  });

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast('Vui lòng chọn người dùng', 'error');
      return;
    }
    const finalAmount = adjustAction === 'add' ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);
    adjustUserBalance(selectedUserId, finalAmount, adjustNote);
    setIsAdjustModalOpen(false);
  };

  const handleSimulateTopup = (e: React.FormEvent) => {
    e.preventDefault();
    createTopupRequest(simAmount, simMethod, simNote);
    setIsSimulateTopupOpen(false);
  };

  const handleCleanAllPending = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';
      await fetch('/api/topup/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'clean_all_pending' }),
      });
    } catch {}
    pendingTopups.forEach((t) => rejectTopup(t.id, 'Hết hạn chờ'));
    showToast('Đã dọn dẹp và từ chối toàn bộ đơn chờ cũ!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-prominent border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-black text-[#F4F2FF] tracking-tight">Quản Lý Ví & Nạp Tiền</h2>
            {pendingTopups.length > 0 && (
              <Badge variant="warning" size="xs" dot>
                {pendingTopups.length} chờ duyệt VietQR
              </Badge>
            )}
            {pendingCards.length > 0 && (
              <Badge variant="brand" size="xs" dot>
                {pendingCards.length} thẻ cào chờ duyệt
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#938EB5] mt-0.5">
            Duyệt sao kê nạp tiền tự động qua VietQR MBBank, nạp thẻ cào và điều chỉnh số dư ví thành viên
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {pendingTopups.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCleanAllPending}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Dọn Dẹp {pendingTopups.length} Đơn Cũ
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSimulateTopupOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Tạo Yêu Cầu Nạp Thử
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdjustModalOpen(true)}
            leftIcon={<DollarSign className="w-3.5 h-3.5" />}
          >
            Cộng / Trừ Số Dư Thủ Công
          </Button>
        </div>
      </div>

      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng Tiền Đã Duyệt Nạp"
          value={totalTopupApprovedAmount > 0 ? `${totalTopupApprovedAmount.toLocaleString('vi-VN')}đ` : '0đ'}
          icon={<DollarSign className="w-4 h-4" />}
          trend={{ value: `${approvedTopups.length} lần nạp`, isPositive: true }}
          accentColor="success"
        />

        <StatCard
          label="Chờ Phê Duyệt VietQR"
          value={pendingTopups.length.toString()}
          icon={<Clock className="w-4 h-4" />}
          trend={{
            value: pendingTopups.length > 0 ? 'Cần xử lý ngay' : 'Không có tồn đọng',
            isPositive: pendingTopups.length === 0,
          }}
          accentColor="warning"
        />

        <StatCard
          label="Tổng Số Dư Thành Viên"
          value={totalUserBalances > 0 ? `${totalUserBalances.toLocaleString('vi-VN')}đ` : '0đ'}
          icon={<Wallet className="w-4 h-4" />}
          trend={{ value: `${users.length} tài khoản`, isPositive: true }}
          accentColor="brand"
        />

        <StatCard
          label="Thẻ Cào Chờ Duyệt"
          value={pendingCards.length.toString()}
          icon={<CreditCard className="w-4 h-4" />}
          trend={{ value: `${cardRecharges.length} tổng thẻ`, isPositive: pendingCards.length === 0 }}
          accentColor="accent"
        />
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/6 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'btn-liquid-primary shadow-sm'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>Chờ Duyệt VietQR</span>
          {pendingTopups.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              {pendingTopups.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cards')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'cards'
              ? 'btn-liquid-primary shadow-sm'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-[#22D3EE]" />
          <span>Duyệt Thẻ Cào</span>
          {pendingCards.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
              {pendingCards.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'btn-liquid-primary shadow-sm'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-[#C084FC]" />
          <span>Toàn Bộ Lịch Sử Nạp</span>
        </button>
      </div>

      {/* Content Rendering based on Tab */}
      {activeTab === 'pending' ? (
        pendingTopups.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
            title="Tuyệt vời! Không có yêu cầu nạp nào cần duyệt"
            description="Tất cả các giao dịch nạp tiền của thành viên đều đã được xử lý xong."
            actionLabel="Tạo Yêu Cầu Nạp Giả Lập"
            onAction={() => setIsSimulateTopupOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingTopups.map((topup) => (
              <Card
                key={topup.id}
                className="p-5 space-y-3.5 border-amber-500/20 glass-subtle"
                variant="default"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#938EB5]">{topup.requestCode}</span>
                    <h3 className="font-bold text-sm text-[#F4F2FF]">{topup.userName}</h3>
                  </div>

                  <Badge variant="warning" size="xs" dot>
                    Chờ duyệt
                  </Badge>
                </div>

                <div className="p-3.5 rounded-2xl glass-standard border border-white/6 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#938EB5]">Số tiền nạp:</span>
                    <span className="text-base font-black text-emerald-300">
                      {topup.amount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#938EB5]">Phương thức:</span>
                    <span className="text-[#F4F2FF] font-medium">{topup.method}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#938EB5]">Nội dung CK:</span>
                    <span className="font-mono text-amber-300 font-bold">{topup.transferNote}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#938EB5]">Thời gian:</span>
                    <span className="text-[#938EB5] font-mono text-[11px]">{topup.createdAt}</span>
                  </div>
                </div>

                {/* Actions: Approve & Reject */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => {
                      setRejectModalTarget(topup);
                      setRejectReason('Giao dịch không khớp sao kê tài khoản ngân hàng');
                    }}
                    className="flex-1"
                    leftIcon={<XCircle className="w-3 h-3" />}
                  >
                    Từ Chối
                  </Button>

                  <Button
                    variant="success"
                    size="xs"
                    onClick={() => approveTopup(topup.id)}
                    className="flex-1"
                    leftIcon={<CheckCircle2 className="w-3 h-3" />}
                  >
                    Duyệt Nạp
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : activeTab === 'cards' ? (
        /* CARDS TAB */
        cardRecharges.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-6 h-6 text-[#22D3EE]" />}
            title="Chưa có thẻ cào nào được gửi"
            description="Khi khách hàng thực hiện nạp thẻ cào trên Storefront, yêu cầu sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardRecharges.map((card) => (
              <Card
                key={card.id}
                className={`p-5 space-y-3.5 glass-subtle border-white/8 ${
                  card.status === 'pending'
                    ? 'border-cyan-500/30'
                    : card.status === 'success'
                    ? 'border-emerald-500/20'
                    : 'border-rose-500/20'
                }`}
                variant="default"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#938EB5]">{card.code}</span>
                    <h3 className="font-bold text-sm text-[#F4F2FF]">{card.userName}</h3>
                  </div>

                  <Badge
                    variant={
                      card.status === 'success'
                        ? 'success'
                        : card.status === 'invalid' || card.status === 'failed'
                        ? 'danger'
                        : 'brand'
                    }
                    size="xs"
                    dot
                  >
                    {card.status === 'success'
                      ? 'Thành công'
                      : card.status === 'invalid'
                      ? 'Thẻ sai'
                      : 'Chờ kiểm tra'}
                  </Badge>
                </div>

                <div className="p-3.5 rounded-2xl glass-standard border border-white/6 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#938EB5]">Nhà mạng:</span>
                    <span className="text-xs font-bold text-[#F4F2FF]">{card.network}</span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#938EB5]">Mệnh giá gửi:</span>
                    <span className="text-xs font-bold text-[#F4F2FF]">
                      {card.declaredAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#938EB5]">Thực nhận (sau phí):</span>
                    <span className="text-sm font-black text-emerald-300">
                      {card.receivedAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#938EB5]">Serial:</span>
                    <span className="font-mono text-cyan-300 select-all font-semibold">{card.serial}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#938EB5]">Mã thẻ (PIN):</span>
                    <span className="font-mono text-amber-300 select-all font-bold">{card.pin}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#938EB5]">Thời gian:</span>
                    <span className="text-[#938EB5] font-mono text-[11px]">{card.createdAt}</span>
                  </div>
                </div>

                {/* Card Actions */}
                {card.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => rejectCardRecharge(card.id, 'Mã thẻ hoặc số serial không đúng')}
                      className="flex-1"
                      leftIcon={<XCircle className="w-3 h-3" />}
                    >
                      Báo Sai Thẻ
                    </Button>

                    <Button
                      variant="success"
                      size="xs"
                      onClick={() => approveCardRecharge(card.id)}
                      className="flex-1"
                      leftIcon={<CheckCircle2 className="w-3 h-3" />}
                    >
                      Duyệt & Cộng Tiền
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        /* HISTORY TAB */
        <Card className="p-0 overflow-hidden" variant="default">
          <div className="p-3 border-b border-white/6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã nạp, tên khách, nội dung chuyển khoản..."
              className="w-full glass-input rounded-2xl px-4 py-2 text-xs text-[#F4F2FF]"
            />
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#938EB5]">Không có dữ liệu nạp tiền</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
                <thead>
                  <tr className="bg-white/[0.02] text-[#938EB5] border-b border-white/6 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-4">Mã Yêu Cầu</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Số Tiền</th>
                    <th className="py-3 px-4">Phương Thức</th>
                    <th className="py-3 px-4">Nội Dung CK</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {filteredHistory.map((topup) => (
                    <tr key={topup.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#F4F2FF]">{topup.requestCode}</td>
                      <td className="py-3.5 px-4 font-medium text-[#F4F2FF]">{topup.userName}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-300">
                        {topup.amount.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3.5 px-4 text-[#E2DEFA]">{topup.method}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-300">{topup.transferNote}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            topup.status === 'approved'
                              ? 'success'
                              : topup.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                          size="xs"
                          dot
                        >
                          {topup.status === 'approved'
                            ? 'Đã duyệt'
                            : topup.status === 'rejected'
                            ? 'Đã từ chối'
                            : 'Chờ duyệt'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-[#938EB5] font-mono text-[11px]">{topup.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Reject Topup Modal */}
      <Modal
        isOpen={!!rejectModalTarget}
        onClose={() => setRejectModalTarget(null)}
        title="Từ Chối Yêu Cầu Nạp Tiền"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRejectModalTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (rejectModalTarget) {
                  rejectTopup(rejectModalTarget.id, rejectReason);
                  setRejectModalTarget(null);
                }
              }}
            >
              Xác Nhận Từ Chối
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-[#938EB5]">
            Bạn đang từ chối yêu cầu nạp{' '}
            <strong className="text-[#F4F2FF]">
              {rejectModalTarget?.amount.toLocaleString('vi-VN')}đ
            </strong>{' '}
            của <strong>{rejectModalTarget?.userName}</strong>.
          </p>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Lý do từ chối
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full glass-input rounded-2xl px-3 py-2 text-xs text-[#F4F2FF]"
            />
          </div>
        </div>
      </Modal>

      {/* Manual Balance Adjust Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Điều Chỉnh Số Dư Ví Thành Viên"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAdjustModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmAdjust}>
              Lưu Thay Đổi
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Chọn Thành Viên *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-[#F4F2FF]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#121220] text-white">
                  {u.username} ({u.balance.toLocaleString('vi-VN')}đ)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Hành Động
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustAction('add')}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjustAction === 'add'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'glass-subtle border-white/8 text-[#938EB5]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Cộng Tiền
              </button>

              <button
                type="button"
                onClick={() => setAdjustAction('subtract')}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjustAction === 'subtract'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'glass-subtle border-white/8 text-[#938EB5]'
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Trừ Tiền
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Số Tiền (VNĐ) *
            </label>
            <input
              type="number"
              min={1000}
              step={1000}
              required
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(Number(e.target.value))}
              className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-[#F4F2FF] font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Lý Do Sao Kê
            </label>
            <input
              type="text"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="VD: Khuyến mãi nạp, hỗ trợ sự kiện..."
              className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-[#F4F2FF]"
            />
          </div>
        </form>
      </Modal>

      {/* Simulate Topup Modal */}
      <Modal
        isOpen={isSimulateTopupOpen}
        onClose={() => setIsSimulateTopupOpen(false)}
        title="Giả Lập Yêu Cầu Nạp Tiền"
        subtitle="Dùng để kiểm thử quy trình duyệt nạp tiền"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsSimulateTopupOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleSimulateTopup}>
              Tạo Yêu Cầu
            </Button>
          </>
        }
      >
        <form onSubmit={handleSimulateTopup} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Số Tiền Nạp (VNĐ)
            </label>
            <input
              type="number"
              min={10000}
              step={10000}
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-emerald-300 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Phương Thức
            </label>
            <select
              value={simMethod}
              onChange={(e) => setSimMethod(e.target.value as any)}
              className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-[#F4F2FF]"
            >
              <option value="Bank Transfer" className="bg-[#121220] text-white">Chuyển Khoản Ngân Hàng (VietQR)</option>
              <option value="Thẻ cào" className="bg-[#121220] text-white">Thẻ Cào Điện Thoại</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Nội Dung Chuyển Khoản
            </label>
            <input
              type="text"
              value={simNote}
              onChange={(e) => setSimNote(e.target.value)}
              className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-[#F4F2FF] font-mono"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
