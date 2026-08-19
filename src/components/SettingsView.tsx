import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreSettings } from '../types';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ConfirmDialog } from './ui/ConfirmDialog';
import {
  Store,
  CreditCard,
  Shield,
  Share2,
  Database,
  RotateCcw,
  Sparkles,
  Save,
  QrCode,
  Zap,
  Building2,
  UserCheck,
  Eye,
  Send,
  PhoneCall,
  Bot,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDefaultData, resetToZeroData, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'security' | 'affiliate' | 'data'>('payments');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  // VietQR Admin Preview states
  const [previewAmount, setPreviewAmount] = useState<number>(200000);
  const [previewMemo, setPreviewMemo] = useState<string>('TX123456');

  // Dialogs
  const [isResetZeroOpen, setIsResetZeroOpen] = useState(false);
  const [isResetDemoOpen, setIsResetDemoOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    showToast('Đã lưu cấu hình hệ thống & cổng thanh toán thành công!', 'success');
  };

  // Generate Admin Preview VietQR URL dynamically based on current form data
  const previewQrUrl = `https://img.vietqr.io/image/${formData.bankCode || 'MB'}-${formData.bankAccount || '0326884292'}-${formData.qrTemplate || 'compact2'}.png?amount=${previewAmount}&addInfo=${encodeURIComponent(previewMemo)}&accountName=${encodeURIComponent(formData.accountHolder || 'TRAN QUANG THANH')}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F1A] border border-white/5 rounded-2xl p-5">
        <div>
          <h2 className="font-display text-lg font-bold text-[#F0EDFF]">Cài Đặt Hệ Thống & Cổng Thanh Toán</h2>
          <p className="text-xs text-[#6B658E] mt-0.5">
            Cấu hình cổng VietQR động, giới hạn nạp tiền 10K - 10M, thông tin hỗ trợ và quản trị dữ liệu
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
          Lưu Cấu Hình
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
              : 'text-[#8B84A8] hover:text-white bg-[#161626]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>VietQR & Thanh Toán</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
              : 'text-[#8B84A8] hover:text-white bg-[#161626]'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-[#9D5CF6]" />
          <span>Cửa Hàng & Hỗ Trợ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
              : 'text-[#8B84A8] hover:text-white bg-[#161626]'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bảo Mật & 2FA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('affiliate')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'affiliate'
              ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
              : 'text-[#8B84A8] hover:text-white bg-[#161626]'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Tiếp Thị Liên Kết</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'data'
              ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
              : 'text-[#8B84A8] hover:text-white bg-[#161626]'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-red-400" />
          <span>Quản Lý Dữ Liệu (Reset 0)</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* 1. PAYMENTS TAB (VietQR Focus) */}
        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: VietQR Configuration Fields (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <Card className="p-5 space-y-4" variant="default">
                <CardHeader
                  title="VietQR / Thanh Toán Ngân Hàng"
                  subtitle="Cấu hình tài khoản nhận tiền và quy tắc nạp tự động cho Storefront"
                  icon={<CreditCard className="w-4 h-4 text-[#9D5CF6]" />}
                />

                <div className="space-y-4 text-xs">
                  {/* Enable VietQR Toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#161626] border border-white/5 cursor-pointer">
                    <div>
                      <div className="font-semibold text-[#F0EDFF]">Kích Hoạt Cổng VietQR</div>
                      <div className="text-[10.5px] text-[#6B658E]">
                        Cho phép khách hàng tạo mã QR nạp tiền tự động qua mọi App ngân hàng
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.bankEnabled}
                      onChange={(e) => setFormData({ ...formData, bankEnabled: e.target.checked })}
                      className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Bank Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Tên Ngân Hàng (BANK_NAME)
                      </label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="MBBank"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] font-medium focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Mã Ngân Hàng (BANK_CODE)
                      </label>
                      <input
                        type="text"
                        value={formData.bankCode}
                        onChange={(e) => setFormData({ ...formData, bankCode: e.target.value.toUpperCase() })}
                        placeholder="MB"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#06B6D4] font-mono font-bold focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Số Tài Khoản (BANK_ACCOUNT)
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                        placeholder="0326884292"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Chủ Tài Khoản (BANK_HOLDER)
                      </label>
                      <input
                        type="text"
                        value={formData.accountHolder}
                        onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value.toUpperCase() })}
                        placeholder="TRAN QUANG THANH"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] font-semibold uppercase focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* Limits and Prefix */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Nạp Tối Thiểu (VNĐ)
                      </label>
                      <input
                        type="number"
                        min={1000}
                        step={1000}
                        value={formData.minDeposit}
                        onChange={(e) => setFormData({ ...formData, minDeposit: Number(e.target.value) })}
                        placeholder="10000"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Nạp Tối Đa (VNĐ)
                      </label>
                      <input
                        type="number"
                        min={10000}
                        step={100000}
                        value={formData.maxDeposit}
                        onChange={(e) => setFormData({ ...formData, maxDeposit: Number(e.target.value) })}
                        placeholder="10000000"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Tiền Tố Nội Dung (PREFIX)
                      </label>
                      <input
                        type="text"
                        value={formData.transferPrefix}
                        onChange={(e) => setFormData({ ...formData, transferPrefix: e.target.value.toUpperCase() })}
                        placeholder="TX"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#9D5CF6] font-mono font-bold focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* VietQR Template Selection */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Mẫu Hiển Thị VietQR (QR_TEMPLATE)
                    </label>
                    <select
                      value={formData.qrTemplate || 'compact2'}
                      onChange={(e) => setFormData({ ...formData, qrTemplate: e.target.value })}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
                    >
                      <option value="compact2">Compact 2 (Khuyên dùng - Chuẩn nhận diện App Bank)</option>
                      <option value="compact">Compact (Nhỏ gọn)</option>
                      <option value="qr_only">QR Only (Chỉ khung mã QR)</option>
                      <option value="print">Print (Khung in hóa đơn)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Support & Brand Payment Meta */}
              <Card className="p-5 space-y-4" variant="default">
                <CardHeader
                  title="Kênh Hỗ Trợ & Thương Hiệu Thanh Toán"
                  subtitle="Thông tin hiển thị khi khách hàng cần trợ giúp nạp tiền"
                  icon={<Store className="w-4 h-4 text-[#06B6D4]" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Tên Cửa Hàng (SHOP_NAME)
                    </label>
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      placeholder="THANOX STORE"
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Bot Telegram (BOT_USERNAME)
                    </label>
                    <input
                      type="text"
                      value={formData.botUsername || 'thanoxstorebot'}
                      onChange={(e) => setFormData({ ...formData, botUsername: e.target.value })}
                      placeholder="thanoxstorebot"
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#06B6D4] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Telegram Hỗ Trợ (CONTACT_TELEGRAM)
                    </label>
                    <input
                      type="text"
                      value={formData.telegramLink}
                      onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
                      placeholder="@quangthank"
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Zalo Hỗ Trợ (CONTACT_ZALO)
                    </label>
                    <input
                      type="text"
                      value={formData.zaloHotline}
                      onChange={(e) => setFormData({ ...formData, zaloHotline: e.target.value })}
                      placeholder="0916396901"
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Col: Live VietQR Preview Box (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <Card className="p-5 space-y-4 border-[#7C3AED]/30 bg-[#0F0F1A]" variant="default">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#9D5CF6]" />
                    <h3 className="font-display font-bold text-sm text-[#F0EDFF]">Preview VietQR Trực Tiếp</h3>
                  </div>
                  <Badge variant="brand" size="xs">
                    Mẫu Thử Nghiệm
                  </Badge>
                </div>

                {/* Preview Amount & Memo Controls */}
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-semibold text-[#8B84A8]">Số tiền thử nghiệm:</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[50000, 200000, 500000, 1000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setPreviewAmount(amt)}
                          className={`py-1.5 px-1 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer border ${
                            previewAmount === amt
                              ? 'bg-[#7C3AED] text-white border-[#9D5CF6]'
                              : 'bg-[#161626] text-[#CBC7E0] border-white/5 hover:border-white/20'
                          }`}
                        >
                          {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-semibold text-[#8B84A8]">Nội dung chuyển khoản mẫu:</label>
                    <input
                      type="text"
                      value={previewMemo}
                      onChange={(e) => setPreviewMemo(e.target.value)}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* QR Preview Box */}
                <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20 flex flex-col items-center justify-center max-w-[260px] mx-auto">
                  <img
                    src={previewQrUrl}
                    alt="VietQR Preview"
                    className="w-full aspect-square object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Info preview text */}
                <div className="p-3 rounded-xl bg-[#161626] border border-white/5 space-y-1 text-[11px] text-[#CBC7E0]">
                  <div className="flex justify-between">
                    <span className="text-[#8B84A8]">Ngân hàng:</span>
                    <span className="font-bold text-white">
                      {formData.bankName || 'MBBank'} ({formData.bankCode || 'MB'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B84A8]">Số tài khoản:</span>
                    <span className="font-mono font-bold text-[#06B6D4]">
                      {formData.bankAccount || '0326884292'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B84A8]">Chủ tài khoản:</span>
                    <span className="font-bold text-white uppercase">
                      {formData.accountHolder || 'TRAN QUANG THANH'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B84A8]">Số tiền preview:</span>
                    <span className="font-bold text-emerald-400">
                      {previewAmount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>

                <p className="text-[10.5px] text-center text-[#8B84A8] italic">
                  * Đây là khung xem trước theo thời gian thực. Bấm &ldquo;Lưu Cấu Hình&rdquo; phía trên để áp dụng cho khách hàng.
                </p>
              </Card>

              {/* Card Recharge Configuration */}
              <Card className="p-4 space-y-3" variant="default">
                <CardHeader title="Nạp Thẻ Cào Tự Động" subtitle="Cấu hình chiết khấu và nhà mạng hỗ trợ" />
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer text-xs">
                  <div>
                    <div className="font-semibold text-[#F0EDFF]">Bật Nạp Thẻ Cào</div>
                    <div className="text-[10px] text-[#6B658E]">Cho phép khách hàng nạp tiền qua thẻ cào Viettel, Vina, Mobi, Zing, Garena</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.scratchCardEnabled}
                    onChange={(e) => setFormData({ ...formData, scratchCardEnabled: e.target.checked })}
                    className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </label>
                {formData.scratchCardEnabled && (
                  <div className="space-y-3 text-xs pt-1">
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-semibold text-[#8B84A8]">Phí Chiết Khấu Gạch Thẻ (%):</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={formData.cardSettings?.feePercentage ?? 15}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cardSettings: {
                              ...(formData.cardSettings || {
                                enabled: true,
                                feePercentage: 15,
                                minAmount: 10000,
                                maxAmount: 1000000,
                                allowedNetworks: ['Viettel', 'Vinaphone', 'Mobifone', 'Vietnamobile', 'Zing', 'Garena'],
                              }),
                              feePercentage: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* 2. GENERAL STORE TAB */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5 space-y-4" variant="default">
              <CardHeader title="Thông Tin Thương Hiệu" subtitle="Tên shop, hotline Zalo & Telegram hỗ trợ" />

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Tên Cửa Hàng
                  </label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Khẩu Hiệu / Mô Tả
                  </label>
                  <textarea
                    rows={2}
                    value={formData.storeDescription}
                    onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Hotline / Zalo Hỗ Trợ
                  </label>
                  <input
                    type="text"
                    value={formData.zaloHotline}
                    onChange={(e) => setFormData({ ...formData, zaloHotline: e.target.value })}
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Kênh Telegram
                  </label>
                  <input
                    type="text"
                    value={formData.telegramLink}
                    onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-4" variant="default">
              <CardHeader title="Trạng Thái Vận Hành" subtitle="Bật chế độ bảo trì hoặc thông báo toàn hệ thống" />

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer">
                  <div>
                    <div className="font-semibold text-[#F0EDFF]">Chế Độ Bảo Trì Cửa Hàng</div>
                    <div className="text-[10.5px] text-[#6B658E]">
                      Tạm ngưng đặt hàng và nạp tiền ngoài giao diện khách
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.maintenanceMode}
                    onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                    className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4"
                  />
                </label>
              </div>
            </Card>
          </div>
        )}

        {/* 3. SECURITY TAB */}
        {activeTab === 'security' && (
          <Card className="p-5 space-y-4 max-w-2xl" variant="default">
            <CardHeader title="Bảo Mật Hệ Thống & Quản Trị" subtitle="Chống tấn công Brute-force & xác thực hai lớp" />

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#F0EDFF]">Xác Thực Hai Lớp (2FA Google Authenticator)</div>
                  <div className="text-[10.5px] text-[#6B658E]">Bắt buộc nhập OTP 6 số khi đăng nhập quản trị</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enable2FA}
                  onChange={(e) => setFormData({ ...formData, enable2FA: e.target.checked })}
                  className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#F0EDFF]">Chống Spam & Giới Hạn Tần Suất (Rate Limiting)</div>
                  <div className="text-[10.5px] text-[#6B658E]">Chặn IP gửi quá 60 request/phút</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.rateLimiting}
                  onChange={(e) => setFormData({ ...formData, rateLimiting: e.target.checked })}
                  className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#F0EDFF]">Ghi Nhật Ký Thao Tác (Audit Logs)</div>
                  <div className="text-[10.5px] text-[#6B658E]">Lưu vết mọi hành động sửa giá, xóa đơn, cộng tiền</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.adminLogs}
                  onChange={(e) => setFormData({ ...formData, adminLogs: e.target.checked })}
                  className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4"
                />
              </label>
            </div>
          </Card>
        )}

        {/* 4. AFFILIATE TAB */}
        {activeTab === 'affiliate' && (
          <Card className="p-5 space-y-4 max-w-2xl" variant="default">
            <CardHeader title="Cấu Hình Tiếp Thị Liên Kết (Affiliate)" subtitle="Quy định trả thưởng, hạn mức tối đa / ngày và điều kiện đơn hàng" />

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer">
                <div>
                  <div className="font-semibold text-[#F0EDFF]">Kích Hoạt Hệ Thống Affiliate</div>
                  <div className="text-[10.5px] text-[#6B658E]">Cho phép thành viên tạo link giới thiệu nhận tiền</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.affiliateEnabled}
                  onChange={(e) => setFormData({ ...formData, affiliateEnabled: e.target.checked })}
                  className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Đơn Tối Thiểu Để Tính Thưởng (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={50000}
                    step={10000}
                    value={formData.affiliateMinimumOrderValue ?? 200000}
                    onChange={(e) => setFormData({ ...formData, affiliateMinimumOrderValue: Number(e.target.value) })}
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] font-bold focus:outline-none focus:border-[#7C3AED]"
                  />
                  <span className="text-[10px] text-[#6B658E]">Mặc định: 200.000đ</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Mức Thưởng Mặc Định / Đơn (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={formData.affiliateDefaultReward ?? 10000}
                    onChange={(e) => setFormData({ ...formData, affiliateDefaultReward: Number(e.target.value) })}
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-[#7C3AED]"
                  />
                  <span className="text-[10px] text-[#6B658E]">Mặc định: 10.000đ</span>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Mức Nhận Thưởng Tối Đa / Người / Ngày (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={50000}
                    step={50000}
                    value={formData.affiliateDailyCap ?? 500000}
                    onChange={(e) => setFormData({ ...formData, affiliateDailyCap: Number(e.target.value) })}
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 font-bold focus:outline-none focus:border-[#7C3AED]"
                  />
                  <span className="text-[10px] text-[#6B658E]">Mặc định: 500.000đ / ngày. Chống gian lận vượt giới hạn ngân sách.</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 5. DATA MANAGEMENT & ZERO RESET TAB */}
        {activeTab === 'data' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Reset to Zero Card */}
            <Card className="p-5 space-y-4 border-red-500/20 bg-red-950/10" variant="default">
              <CardHeader
                title="Xóa Trắng Dữ Liệu (Reset Về 0)"
                subtitle="Đưa toàn bộ doanh thu, đơn hàng, sản phẩm, giao dịch về 0"
                icon={<RotateCcw className="w-4 h-4 text-red-400" />}
              />

              <p className="text-xs text-[#8B84A8] leading-relaxed">
                Tùy chọn này sẽ xóa trắng toàn bộ danh sách sản phẩm, đơn hàng, giao dịch, nạp tiền và
                đưa tất cả các chỉ số trên Dashboard về <strong>0đ, 0 đơn</strong> để chuẩn bị bàn giao hoặc
                bắt đầu kinh doanh thực tế.
              </p>

              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => setIsResetZeroOpen(true)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Xác Nhận Đưa Tất Cả Số Liệu Về 0
              </Button>
            </Card>

            {/* Restore Demo Data Card */}
            <Card className="p-5 space-y-4 border-emerald-500/20 bg-emerald-950/10" variant="default">
              <CardHeader
                title="Nạp Lại Dữ Liệu Mẫu (Demo)"
                subtitle="Khôi phục lại dữ liệu mẫu sản phẩm, đơn hàng và biểu đồ"
                icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
              />

              <p className="text-xs text-[#8B84A8] leading-relaxed">
                Khôi phục lại toàn bộ dữ liệu mẫu đầy đủ để thử nghiệm các tính năng, biểu đồ báo cáo và
                cửa hàng khách hàng.
              </p>

              <Button
                variant="success"
                size="sm"
                type="button"
                onClick={() => setIsResetDemoOpen(true)}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Khôi Phục Dữ Liệu Mẫu
              </Button>
            </Card>
          </div>
        )}
      </form>

      {/* Confirm Reset to Zero Dialog */}
      <ConfirmDialog
        isOpen={isResetZeroOpen}
        onClose={() => setIsResetZeroOpen(false)}
        onConfirm={() => {
          resetToZeroData();
          setIsResetZeroOpen(false);
        }}
        title="Xác Nhận Xóa Trắng Toàn Bộ Số Liệu Về 0?"
        message="Hành động này sẽ xóa toàn bộ đơn hàng, sản phẩm và giao dịch hiện tại, đưa hệ thống về trạng thái trắng tinh 0đ."
        confirmLabel="Đưa về 0 ngay"
        variant="danger"
      />

      {/* Confirm Restore Demo Data Dialog */}
      <ConfirmDialog
        isOpen={isResetDemoOpen}
        onClose={() => setIsResetDemoOpen(false)}
        onConfirm={() => {
          resetToDefaultData();
          setIsResetDemoOpen(false);
        }}
        title="Nạp Lại Dữ Liệu Mẫu?"
        message="Hệ thống sẽ nạp lại danh sách sản phẩm mẫu và đơn hàng thử nghiệm."
        confirmLabel="Nạp dữ liệu mẫu"
        variant="primary"
      />
    </div>
  );
};
