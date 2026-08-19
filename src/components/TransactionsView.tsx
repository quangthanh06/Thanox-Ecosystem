import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Transaction, TransactionType } from '../types';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import {
  ArrowLeftRight,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ShoppingBag,
  Wallet,
  Share2,
  DollarSign,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { transactions, showToast } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesQuery =
      tx.txCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || tx.type === selectedType;
    return matchesQuery && matchesType;
  });

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('Không có giao dịch nào để xuất', 'warning');
      return;
    }

    const headers = ['Mã GD', 'Loại', 'Khách Hàng', 'Mô Tả', 'Số Tiền (VNĐ)', 'Số Dư Sau (VNĐ)', 'Thời Gian'];
    const rows = transactions.map((t) => [
      t.txCode,
      t.type,
      t.userName,
      `"${t.description}"`,
      t.amount,
      t.balanceAfter,
      t.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thanox_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất sao kê giao dịch thành công!', 'success');
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <Badge variant="success" size="xs" dot>Nạp VietQR (+)</Badge>;
      case 'card_recharge':
        return <Badge variant="warning" size="xs" dot>Thẻ cào (+)</Badge>;
      case 'purchase':
        return <Badge variant="neutral" size="xs" dot>Mua hàng (-)</Badge>;
      case 'commission':
        return <Badge variant="brand" size="xs" dot>Hoa hồng (+)</Badge>;
      case 'adjustment':
        return <Badge variant="info" size="xs" dot>Điều chỉnh (±)</Badge>;
      case 'withdraw':
        return <Badge variant="danger" size="xs" dot>Rút tiền (-)</Badge>;
      default:
        return <Badge variant="neutral" size="xs">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F1A] border border-white/5 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-[#F0EDFF]">Nhật Ký Sao Kê Giao Dịch</h2>
            <Badge variant="brand" size="xs">
              {transactions.length} biến động
            </Badge>
          </div>
          <p className="text-xs text-[#6B658E] mt-0.5">
            Sổ cái toàn bộ biến động tài chính, nạp tiền VietQR, nạp thẻ cào và thanh toán
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          leftIcon={<Download className="w-3.5 h-3.5" />}
        >
          Xuất Báo Cáo Sao Kê
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-3" variant="default">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B658E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã giao dịch, khách hàng, lý do..."
              className="w-full bg-[#161626] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
          >
            <option value="all">Tất cả loại giao dịch</option>
            <option value="deposit">🟢 Nạp tiền VietQR (Deposit)</option>
            <option value="card_recharge">🟡 Nạp thẻ cào (Card Recharge)</option>
            <option value="purchase">🛒 Mua hàng (Purchase)</option>
            <option value="commission">🟣 Hoa hồng (Commission)</option>
            <option value="adjustment">🔵 Điều chỉnh (Adjustment)</option>
            <option value="withdraw">🔴 Rút tiền (Withdraw)</option>
          </select>
        </div>
      </Card>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="w-6 h-6 text-[#9D5CF6]" />}
          title="Chưa có giao dịch nào"
          description="Toàn bộ lịch sử cộng trừ tiền ví sẽ tự động được ghi nhận tại đây."
        />
      ) : (
        <Card className="p-0 overflow-hidden" variant="default">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="bg-[#161626]/60 text-[#555074] border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Mã GD</th>
                  <th className="py-3 px-4">Loại</th>
                  <th className="py-3 px-4">Thành Viên</th>
                  <th className="py-3 px-4">Nội Dung Biến Động</th>
                  <th className="py-3 px-4">Số Tiền</th>
                  <th className="py-3 px-4">Số Dư Sau</th>
                  <th className="py-3 px-4">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((tx) => {
                  const isPositive = tx.amount > 0;

                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#F0EDFF]">{tx.txCode}</td>
                      <td className="py-3.5 px-4">{getTypeBadge(tx.type)}</td>
                      <td className="py-3.5 px-4 font-medium text-[#F0EDFF]">{tx.userName}</td>
                      <td className="py-3.5 px-4 text-[#8B84A8] max-w-[240px] truncate">{tx.description}</td>
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {tx.amount.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#8B84A8]">
                        {tx.balanceAfter.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3.5 px-4 text-[#6B658E] font-mono text-[11px]">{tx.createdAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
