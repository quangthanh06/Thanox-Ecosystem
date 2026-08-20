import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Search,
  Filter,
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
      <div className="border-b border-white/5 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8B84A8] mb-1.5">
            <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
              Trang Chủ
            </button>
            <span>/</span>
            <button onClick={() => navigateToStorefront('account')} className="hover:text-white transition-colors cursor-pointer">
              Tài Khoản
            </button>
            <span>/</span>
            <span className="text-[#9D5CF6] font-medium">Biến Động Số Dư</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#F0EDFF]">
            Lịch Sử Giao Dịch Số Dư Ví
          </h1>
          <p className="text-xs text-[#8B84A8] mt-0.5">
            Chi tiết các khoản nạp tiền, thanh toán đơn hàng và hoàn tiền
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateToStorefront('account-wallet-deposit')}
            leftIcon={<Wallet className="w-4 h-4" />}
          >
            Nạp Tiền Vào Ví
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
              : 'bg-[#0F0F1A] text-[#8B84A8] hover:text-white border border-white/5'
          }`}
        >
          Tất cả ({userTransactions.length})
        </button>
        <button
          onClick={() => setFilterType('deposit')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            filterType === 'deposit'
              ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
              : 'bg-[#0F0F1A] text-[#8B84A8] hover:text-white border border-white/5'
          }`}
        >
          Nạp tiền
        </button>
        <button
          onClick={() => setFilterType('purchase')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            filterType === 'purchase'
              ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
              : 'bg-[#0F0F1A] text-[#8B84A8] hover:text-white border border-white/5'
          }`}
        >
          Mua hàng
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#8B84A8]">
            Không có giao dịch nào trong danh mục này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[#8B84A8] text-[11px] uppercase">
                  <th className="pb-3 font-semibold">Mã Giao Dịch</th>
                  <th className="pb-3 font-semibold">Loại</th>
                  <th className="pb-3 font-semibold">Mô Tả Chi Tiết</th>
                  <th className="pb-3 font-semibold">Thời Gian</th>
                  <th className="pb-3 font-semibold text-right">Số Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-mono font-bold text-[#9D5CF6]">{tx.id}</td>
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
                      <td className="py-3 text-[#CBC7E0] max-w-xs">{tx.description}</td>
                      <td className="py-3 text-[#8B84A8]">{tx.createdAt}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-display font-bold text-sm ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
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
