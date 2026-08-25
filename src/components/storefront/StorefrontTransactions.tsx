import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Wallet,
} from 'lucide-react';

export const StorefrontTransactions: React.FC = () => {
  const { transactions, currentUser, navigateToStorefront } = useStore();
  const [filterType, setFilterType] = useState<string>('all');

  const userTransactions = (transactions || []).filter((tx) => tx && tx.userId === currentUser?.id);

  const filtered = userTransactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="border-b border-white/6 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#938EB5] mb-1.5">
            <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
              Trang Chủ
            </button>
            <span>/</span>
            <button onClick={() => navigateToStorefront('account')} className="hover:text-white transition-colors cursor-pointer">
              Tài Khoản
            </button>
            <span>/</span>
            <span className="text-[#C084FC] font-semibold">Biến Động Số Dư</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[#F4F2FF] tracking-tight uppercase">
            Lịch Sử Giao Dịch Số Dư Ví
          </h1>
          <p className="text-xs text-[#938EB5] mt-0.5">
            Chi tiết các khoản nạp tiền, thanh toán đơn hàng và hoàn tiền
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateToStorefront('account-wallet-deposit')}
            leftIcon={<Wallet className="w-4 h-4 text-amber-300" />}
            className="font-bold"
          >
            Nạp Tiền Vào Ví
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            filterType === 'all'
              ? 'btn-liquid-primary shadow-sm'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          Tất cả ({userTransactions.length})
        </button>
        <button
          onClick={() => setFilterType('deposit')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            filterType === 'deposit'
              ? 'btn-liquid-primary shadow-sm'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          Nạp tiền
        </button>
        <button
          onClick={() => setFilterType('purchase')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            filterType === 'purchase'
              ? 'btn-liquid-primary shadow-sm'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          Mua hàng
        </button>
      </div>

      {/* Transactions Table */}
      <div className="glass-standard border border-white/8 rounded-3xl p-5 sm:p-6 space-y-4 shadow-md">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#938EB5]">
            Không có giao dịch nào trong danh mục này.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[580px]">
              <thead>
                <tr className="border-b border-white/6 text-[#938EB5] text-[11px] uppercase tracking-wider">
                  <th className="pb-3 px-2 font-semibold">Mã Giao Dịch</th>
                  <th className="pb-3 px-2 font-semibold">Loại</th>
                  <th className="pb-3 px-2 font-semibold">Mô Tả Chi Tiết</th>
                  <th className="pb-3 px-2 font-semibold">Thời Gian</th>
                  <th className="pb-3 px-2 font-semibold text-right">Số Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {filtered.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="glass-tr">
                      <td className="py-3 px-2 font-mono font-bold text-[#C084FC]">{tx.txCode || tx.id}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            tx.type === 'deposit'
                              ? 'success'
                              : tx.type === 'purchase'
                              ? 'brand'
                              : 'warning'
                          }
                          size="xs"
                        >
                          {tx.type === 'deposit'
                            ? 'Nạp Tiền'
                            : tx.type === 'purchase'
                            ? 'Mua Hàng'
                            : tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 text-[#E2DEFA] max-w-xs">{tx.description}</td>
                      <td className="py-3 text-[#938EB5]">{tx.createdAt}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-display font-bold text-sm ${
                            isPositive ? 'text-emerald-300' : 'text-red-300'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {tx.amount.toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
