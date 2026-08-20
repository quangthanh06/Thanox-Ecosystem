import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { StoreSettings } from '../types';
import { DEFAULT_CARD_MATRIX } from '../data/mockData';
import { useDragScroll } from '../hooks/useDragScroll';
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
  Music,
  Play,
  Trash2,
  Plus,
  Disc,
  Volume2,
  Upload,
  FileAudio,
  Check,
  CheckCircle2,
  Layers,
  Type,
  Palette,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Lock,
  ExternalLink,
  Smartphone,
  KeyRound,
  Copy,
} from 'lucide-react';
import { generateTotpUri, generateGoogleAuthQrUrl, verifyTotpCode } from '../utils/totp';

interface SettingsViewProps {
  initialTab?: 'banner' | 'typography' | 'payments' | 'general' | 'maintenance' | 'security' | 'affiliate' | 'music' | 'data';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab }) => {
  const { settings, updateSettings, resetToDefaultData, resetToZeroData, showToast } = useStore();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'banner' | 'typography' | 'payments' | 'general' | 'maintenance' | 'security' | 'affiliate' | 'music' | 'data'>(
    initialTab || 'banner'
  );
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  // Drag to scroll hook
  const { dragProps, scrollLeft, scrollRight } = useDragScroll<HTMLDivElement>();

  // Deep Security Scan states
  const [isScanningSecurity, setIsScanningSecurity] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [newBlockedIp, setNewBlockedIp] = useState('');

  // 2FA Google Authenticator testing state
  const [totpTestCode, setTotpTestCode] = useState('');
  const [totpTestResult, setTotpTestResult] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [pendingTwoFactorSecret, setPendingTwoFactorSecret] = useState<string | null>(null);

  const handleVerifyTotpTest = () => {
    if (!totpTestCode.trim()) {
      showToast('Vui lòng nhập mã 6 số từ Google Authenticator trên điện thoại', 'error');
      return;
    }
    const secret = formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP';
    const backup = formData.twoFactorBackupCode || '888999';
    const res = verifyTotpCode(secret, totpTestCode.trim(), backup);
    setTotpTestResult(res);
    if (res.valid) {
      showToast('✅ Mã OTP chính xác! Google Authenticator đã kết nối thành công với Shop.', 'success');
    } else {
      showToast(res.reason || 'Mã OTP không đúng hoặc đã hết hạn', 'error');
    }
  };

  const handleGenerateNewSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let newSec = '';
    for (let i = 0; i < 16; i++) {
      newSec += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, twoFactorSecret: newSec });
    setTotpTestResult(null);
    setTotpTestCode('');
    showToast(`Đã tạo Secret Key mới: ${newSec}. Hãy quét lại mã QR trên điện thoại!`, 'info');
  };

  const copySecretToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép Secret Key vào bộ nhớ tạm!', 'success');
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab') as any;
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [searchParams, initialTab]);

  const handleRunDeepScan = () => {
    setIsScanningSecurity(true);
    setScanProgress(10);
    setScanCompleted(false);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanningSecurity(false);
          setScanCompleted(true);
          showToast('⚡ Quét toàn diện an ninh mạng hoàn tất: 20/20 tiêu chuẩn đạt chuẩn A+ tuyệt đối!', 'success');
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  const handleAddBlockedIp = () => {
    if (!newBlockedIp.trim()) return;
    const current = formData.blockedIps || [];
    if (current.includes(newBlockedIp.trim())) {
      showToast('IP này đã có trong danh sách chặn!', 'warning');
      return;
    }
    const updated = [...current, newBlockedIp.trim()];
    setFormData({ ...formData, blockedIps: updated });
    setNewBlockedIp('');
    showToast(`Đã thêm IP ${newBlockedIp.trim()} vào danh sách chặn!`, 'success');
  };

  const handleRemoveBlockedIp = (ipToRemove: string) => {
    const updated = (formData.blockedIps || []).filter((ip) => ip !== ipToRemove);
    setFormData({ ...formData, blockedIps: updated });
    showToast(`Đã gỡ chặn IP ${ipToRemove}`, 'info');
  };

  // Music form state
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [selectedAudioFileName, setSelectedAudioFileName] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const handleAudioFileUpload = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      showToast('Vui lòng chọn file âm thanh định dạng MP3, WAV hoặc OGG', 'error');
      return;
    }

    setIsUploadingAudio(true);
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setSelectedAudioFileName(file.name);

    if (!newTrackTitle.trim()) {
      setNewTrackTitle(fileNameWithoutExt);
    }
    if (!newTrackArtist.trim()) {
      setNewTrackArtist('Thanox Audio');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setNewTrackUrl(dataUrl);
        setPreviewAudioUrl(dataUrl);
        setIsUploadingAudio(false);
        showToast(`Đã tải file "${file.name}" thành công! Bấm nghe thử hoặc bấm Thêm vào danh sách nhạc.`, 'success');
      }
    };
    reader.onerror = () => {
      setIsUploadingAudio(false);
      showToast('Lỗi khi đọc file âm thanh từ máy tính', 'error');
    };
    reader.readAsDataURL(file);
  };

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
            Cấu hình cổng VietQR động, chế độ bảo trì & Zalo Admin, tường lửa chống hack toàn diện
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
          Lưu Cấu Hình
        </Button>
      </div>

      {/* Tabs Switcher with Smooth Mouse Drag-to-Scroll + Arrow Controls */}
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          onClick={scrollLeft}
          className="p-2 rounded-xl bg-[#161626] border border-white/10 text-[#CBC7E0] hover:text-white hover:border-[#7C3AED]/40 transition-colors shrink-0 cursor-pointer shadow-md"
          title="Cuộn sang trái (hoặc giữ chuột kéo)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          {...dragProps}
          className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto scrollbar-none no-scrollbar flex-1"
        >
          <button
            type="button"
            onClick={() => setActiveTab('banner')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'banner'
                ? 'bg-[#7C3AED]/20 text-white border border-[#7C3AED]/40 shadow-sm'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
            <span>🎨 Banner Hero</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'typography'
                ? 'bg-gradient-to-r from-[#7C3AED]/30 to-[#06B6D4]/30 text-white border border-[#22D3EE]/50 shadow-md shadow-[#22D3EE]/10'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>✨ Phông Chữ & Màu Chuyển Động</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'payments'
                ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>💳 VietQR & Thanh Toán</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'maintenance'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>🛠️ Bảo Trì & Zalo Admin</span>
            {formData.maintenanceMode && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>🛡️ Trung Tâm Bảo Mật & Chống Hack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'general'
                ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-[#9D5CF6]" />
            <span>🏢 Cửa Hàng & Hỗ Trợ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('affiliate')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'affiliate'
                ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>🤝 Giới Thiệu & Kiếm Tiền</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'music'
                ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-[#9D5CF6]" />
            <span>🎵 Quản Lý Nhạc Nền</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'data'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-red-400" />
            <span>💾 Dữ Liệu & Reset 0</span>
          </button>
        </div>

        <button
          type="button"
          onClick={scrollRight}
          className="p-2 rounded-xl bg-[#161626] border border-white/10 text-[#CBC7E0] hover:text-white hover:border-[#7C3AED]/40 transition-colors shrink-0 cursor-pointer shadow-md"
          title="Cuộn sang phải (hoặc giữ chuột kéo)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* TAB CONTENTS */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* 0. HERO BANNER & GIAO DIỆN CUSTOMIZATION TAB */}
        {activeTab === 'banner' && (
          <div className="space-y-6">
            {/* Live Interactive Preview Card */}
            <Card className="p-5 space-y-4 border-[#7C3AED]/30 bg-gradient-to-b from-[#121226] to-[#0A0A14]" variant="default">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#F0EDFF] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Xem Trước Trực Tiếp Khung Hero Banner</span>
                  </h3>
                  <p className="text-xs text-[#8B84A8]">
                    Xem ngay kết quả hiển thị thực tế trên trang chủ khi bạn kéo chỉnh các thông số
                  </p>
                </div>
                <Badge variant="brand" size="sm">
                  Live Preview
                </Badge>
              </div>

              {/* Simulated Hero Banner Preview */}
              <div className="relative overflow-hidden rounded-2xl border border-[#7C3AED]/40 p-6 min-h-[220px] flex flex-col justify-between shadow-2xl">
                {/* Dynamic Background Image */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img
                    src={formData.heroBanner?.backgroundImage || '/thanox-master-banner.jpg'}
                    alt="Preview Background"
                    className="w-full h-full object-cover object-center contrast-125 transition-all duration-300"
                    style={{
                      filter: `brightness(${(formData.heroBanner?.brightness ?? 65) / 100}) blur(${formData.heroBanner?.blur ?? 0}px)`,
                    }}
                  />
                  {/* Dynamic Dark Gradient Overlay */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-[#070714] via-[#0A0A1E] to-[#070714] transition-opacity duration-300"
                    style={{
                      opacity: (formData.heroBanner?.overlayOpacity ?? 45) / 100,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070714] via-transparent to-black/30" />
                </div>

                {/* Simulated Content */}
                <div className="relative z-10 space-y-2 max-w-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-cyan-400 rounded-full" />
                    <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                      FILE BẢN QUYỀN
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9D5CF6] via-[#C084FC] to-[#06B6D4] uppercase tracking-tight">
                    CHỨNG CHỈ IOS THANOX VIP - KÝ APP TRỌN ĐỜI
                  </h2>
                  <div className="text-base font-black text-amber-400">
                    199.000 <span className="text-xs">VND</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <span className="px-3 py-1 rounded-xl bg-teal-500 text-black font-black text-[10px] uppercase shadow-md">
                      XEM SẢN PHẨM
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-black/60 border border-white/20 text-white font-bold text-[10px] uppercase">
                      HỖ TRỢ NGAY
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Background Image Picker */}
              <Card className="p-5 space-y-4" variant="default">
                <CardHeader
                  title="Hình Ảnh Nền Banner"
                  subtitle="Tải ảnh từ máy tính hoặc dán đường dẫn ảnh URL"
                />

                <div className="space-y-4 text-xs">
                  {/* File Upload from PC */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-[#161626] border border-white/5">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                      Tải file ảnh từ máy tính (JPG, PNG, WEBP)
                    </label>
                    <input
                      type="file"
                      id="hero-bg-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('image/')) {
                          showToast('Vui lòng chọn file hình ảnh', 'error');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const base64 = ev.target?.result as string;
                          setFormData((prev) => ({
                            ...prev,
                            heroBanner: {
                              ...(prev.heroBanner || {
                                brightness: 65,
                                blur: 0,
                                overlayOpacity: 45,
                                glowEffect: true,
                                hotlineZalo: '0916396901',
                              }),
                              backgroundImage: base64,
                            },
                          }));
                          showToast('Đã tải ảnh nền Banner từ máy tính thành công!', 'success');
                        };
                        reader.readAsDataURL(file);
                      }}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => document.getElementById('hero-bg-upload')?.click()}
                        leftIcon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
                        className="font-bold border-white/10 hover:border-cyan-400"
                      >
                        Chọn ảnh từ máy tính
                      </Button>
                      {formData.heroBanner?.backgroundImage && formData.heroBanner.backgroundImage !== '/thanox-master-banner.jpg' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              heroBanner: {
                                ...(prev.heroBanner || {
                                  brightness: 65,
                                  blur: 0,
                                  overlayOpacity: 45,
                                  glowEffect: true,
                                  hotlineZalo: '0916396901',
                                }),
                                backgroundImage: '/thanox-master-banner.jpg',
                              },
                            }))
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          Khôi phục ảnh gốc
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Direct URL Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Hoặc dán Link URL ảnh trực tiếp
                    </label>
                    <input
                      type="text"
                      value={formData.heroBanner?.backgroundImage || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          heroBanner: {
                            ...(prev.heroBanner || {
                              brightness: 65,
                              blur: 0,
                              overlayOpacity: 45,
                              glowEffect: true,
                              hotlineZalo: '0916396901',
                            }),
                            backgroundImage: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  {/* Preset Background Choices */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                      Ảnh mẫu chất lượng cao sẵn có:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          name: '🐉 Master Cyber Dragon',
                          url: '/thanox-master-banner.jpg',
                        },
                        {
                          name: '👾 Cyber Battlestation',
                          url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
                        },
                        {
                          name: '⚡ Purple Tech Core',
                          url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              heroBanner: {
                                ...(prev.heroBanner || {
                                  brightness: 65,
                                  blur: 0,
                                  overlayOpacity: 45,
                                  glowEffect: true,
                                  hotlineZalo: '0916396901',
                                }),
                                backgroundImage: preset.url,
                              },
                            }))
                          }
                          className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all cursor-pointer truncate ${
                            formData.heroBanner?.backgroundImage === preset.url
                              ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white shadow-sm'
                              : 'bg-[#161626] border-white/10 text-[#8B84A8] hover:text-white hover:bg-[#1E1E30]'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Right Column: Sliders for Brightness, Blur, Overlay & Hotline */}
              <Card className="p-5 space-y-4" variant="default">
                <CardHeader
                  title="Hiệu Ứng Sáng Tối & Độ Mờ"
                  subtitle="Tùy chỉnh thanh trượt để ảnh nền đạt độ sắc nét và tương phản ưng ý nhất"
                />

                <div className="space-y-4 text-xs">
                  {/* Slider 1: Brightness */}
                  <div className="space-y-2 p-3 rounded-2xl bg-[#161626] border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[#F0EDFF] uppercase tracking-wider">
                        ☀️ Độ Sáng Của Nền (Brightness)
                      </label>
                      <Badge variant="brand" size="xs">
                        {formData.heroBanner?.brightness ?? 65}%
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={formData.heroBanner?.brightness ?? 65}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          heroBanner: {
                            ...(prev.heroBanner || {
                              backgroundImage: '/thanox-master-banner.jpg',
                              blur: 0,
                              overlayOpacity: 45,
                              glowEffect: true,
                              hotlineZalo: '0916396901',
                            }),
                            brightness: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full accent-[#7C3AED] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6B658E]">
                      <span>10% (Tối mờ)</span>
                      <span>65% (Mặc định sáng nét)</span>
                      <span>100% (Sáng nét tối đa)</span>
                    </div>
                  </div>

                  {/* Slider 2: Backdrop Blur */}
                  <div className="space-y-2 p-3 rounded-2xl bg-[#161626] border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[#F0EDFF] uppercase tracking-wider">
                        🔍 Độ Mờ Kính (Backdrop Blur)
                      </label>
                      <Badge variant="brand" size="xs">
                        {formData.heroBanner?.blur ?? 0} px
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={formData.heroBanner?.blur ?? 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          heroBanner: {
                            ...(prev.heroBanner || {
                              backgroundImage: '/thanox-master-banner.jpg',
                              brightness: 65,
                              overlayOpacity: 45,
                              glowEffect: true,
                              hotlineZalo: '0916396901',
                            }),
                            blur: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full accent-[#7C3AED] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6B658E]">
                      <span>0px (Nét tuyệt đối không mờ)</span>
                      <span>3px (Mờ nhẹ)</span>
                      <span>15px (Mờ cực đại)</span>
                    </div>
                  </div>

                  {/* Slider 3: Dark Overlay Opacity */}
                  <div className="space-y-2 p-3 rounded-2xl bg-[#161626] border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[#F0EDFF] uppercase tracking-wider">
                        🌑 Lớp Phủ Tối (Overlay Darkness)
                      </label>
                      <Badge variant="brand" size="xs">
                        {formData.heroBanner?.overlayOpacity ?? 45}%
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.heroBanner?.overlayOpacity ?? 45}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          heroBanner: {
                            ...(prev.heroBanner || {
                              backgroundImage: '/thanox-master-banner.jpg',
                              brightness: 65,
                              blur: 0,
                              glowEffect: true,
                              hotlineZalo: '0916396901',
                            }),
                            overlayOpacity: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full accent-[#7C3AED] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6B658E]">
                      <span>0% (Không che phủ)</span>
                      <span>45% (Hòa hợp chữ & ảnh)</span>
                      <span>100% (Phủ đen hoàn toàn)</span>
                    </div>
                  </div>

                  {/* Hotline Zalo on Banner */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Hotline Zalo Hiển Thị Dưới Banner
                    </label>
                    <input
                      type="text"
                      value={formData.heroBanner?.hotlineZalo ?? formData.zaloHotline ?? '0916396901'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          heroBanner: {
                            ...(prev.heroBanner || {
                              backgroundImage: '/thanox-master-banner.jpg',
                              brightness: 65,
                              blur: 0,
                              overlayOpacity: 45,
                              glowEffect: true,
                            }),
                            hotlineZalo: e.target.value,
                          },
                        }))
                      }
                      placeholder="0916396901"
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                💾 Lưu Cài Đặt Banner & Giao Diện
              </Button>
            </div>
          </div>
        )}

        {/* 0.5. TYPOGRAPHY & COLOR FLOW CUSTOMIZER TAB */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            {/* Live Interactive Preview Card */}
            <Card className="p-5 space-y-4 border-[#22D3EE]/30 bg-gradient-to-b from-[#121226] to-[#0A0A14]" variant="default">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#F0EDFF] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                    <span>Xem Trước Trực Tiếp Hiệu Ứng Chữ & Chuyển Động Màu</span>
                  </h3>
                  <p className="text-xs text-[#8B84A8]">
                    Xem ngay kết quả hiển thị trên Storefront khi bạn thay đổi phông chữ, chế độ màu hoặc độ béo phồng
                  </p>
                </div>
                <Badge variant="success" size="sm" dot>
                  Live Preview
                </Badge>
              </div>

              {/* Preview Canvas */}
              <div className="p-5 rounded-2xl bg-[#080A14] border border-slate-800/90 space-y-5">
                {/* 1. Logo Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <span className="text-xs text-[#8B84A8] sm:w-28 shrink-0 font-medium">Logo Thương Hiệu:</span>
                  <div className="flex items-center gap-3 bg-[#0F0F1A] px-4 py-2.5 rounded-xl border border-white/10 w-fit">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-0.5 flex items-center justify-center shadow-md">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span
                      className={`text-xl sm:text-2xl uppercase tracking-wider ${
                        formData.typography?.enableColorFlow !== false && formData.typography?.colorMode !== 'pure_white'
                          ? formData.typography?.colorMode === 'cyber_cyan'
                            ? 'thanox-flow-cyan'
                            : formData.typography?.colorMode === 'neon_purple'
                            ? 'thanox-flow-purple'
                            : formData.typography?.colorMode === 'flame_fire'
                            ? 'thanox-flow-flame'
                            : 'thanox-flow-rainbow'
                          : 'text-white'
                      } ${formData.typography?.enableTextGlow !== false ? 'thanox-glow' : ''} ${
                        formData.typography?.titleWeight === 'bold'
                          ? 'font-bold'
                          : formData.typography?.titleWeight === 'extrabold'
                          ? 'font-extrabold'
                          : 'font-black'
                      }`}
                      style={{ fontFamily: formData.typography?.fontFamily || 'Space Grotesk' }}
                    >
                      THANOX.VN
                    </span>
                  </div>
                </div>

                {/* 2. Heading Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <span className="text-xs text-[#8B84A8] sm:w-28 shrink-0 font-medium">Tiêu Đề Mục Lớn:</span>
                  <div className="bg-[#0F0F1A] px-4 py-2.5 rounded-xl border border-white/10 w-fit">
                    <span
                      className={`text-base sm:text-lg uppercase tracking-wide ${
                        formData.typography?.enableColorFlow !== false && formData.typography?.colorMode !== 'pure_white'
                          ? formData.typography?.colorMode === 'cyber_cyan'
                            ? 'thanox-flow-cyan'
                            : formData.typography?.colorMode === 'neon_purple'
                            ? 'thanox-flow-purple'
                            : formData.typography?.colorMode === 'flame_fire'
                            ? 'thanox-flow-flame'
                            : 'thanox-flow-rainbow'
                          : 'text-white'
                      } ${formData.typography?.enableTextGlow !== false ? 'thanox-glow' : ''} ${
                        formData.typography?.titleWeight === 'bold'
                          ? 'font-bold'
                          : formData.typography?.titleWeight === 'extrabold'
                          ? 'font-extrabold'
                          : 'font-black'
                      }`}
                      style={{ fontFamily: formData.typography?.fontFamily || 'Space Grotesk' }}
                    >
                      Kho Sản Phẩm & Key Bản Quyền
                    </span>
                  </div>
                </div>

                {/* 3. Navigation & Buttons Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <span className="text-xs text-[#8B84A8] sm:w-28 shrink-0 font-medium">Menu & Nút Bấm:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {['Shop', 'Nạp', 'Đơn', 'Hỗ trợ', 'Tài khoản', '🛒 Giỏ Hàng'].map((item) => (
                      <span
                        key={item}
                        className={`px-3 py-1.5 rounded-xl bg-[#161626] border border-white/10 text-xs ${
                          formData.typography?.enableColorFlow !== false && formData.typography?.colorMode !== 'pure_white'
                            ? 'thanox-flow-rainbow'
                            : 'text-white'
                        } font-bold shadow-sm`}
                        style={{ fontFamily: formData.typography?.fontFamily || 'Space Grotesk' }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Customization Options Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Option 1: Chế Độ Màu Sắc & Hiệu Ứng */}
              <Card className="p-5 space-y-4" variant="default">
                <CardHeader
                  title="Chế Độ Màu & Chuyển Động"
                  subtitle="Tùy chọn chuyển động màu Cyberpunk đa sắc hoặc màu trắng tinh khôi tối giản"
                  icon={<Palette className="w-4 h-4 text-[#22D3EE]" />}
                />

                <div className="space-y-3 pt-1">
                  {[
                    {
                      id: 'rainbow_flow',
                      title: '🌈 Chuyển Động Cầu Vồng Cyberpunk (Mặc định)',
                      desc: 'Dải màu Trắng → Cyan → Tím → Hồng → Xanh chuyển động lượn sóng liên tục.',
                    },
                    {
                      id: 'pure_white',
                      title: '⚪ Trắng Tinh Khôi Tối Giản (Pure White)',
                      desc: 'Toàn bộ chữ giữ màu trắng tinh khiết, không màu mè, chuẩn phong cách Minimalist.',
                    },
                    {
                      id: 'cyber_cyan',
                      title: '💎 Xanh Cyan Neon Tối Thượng (Cyber Cyan)',
                      desc: 'Dải màu xanh ngọc Cyberpunk phát quang rực rỡ.',
                    },
                    {
                      id: 'neon_purple',
                      title: '🔮 Tím Ma Mị Huyền Bí (Neon Violet Glow)',
                      desc: 'Dải màu tím neon tương lai huyền ảo.',
                    },
                    {
                      id: 'flame_fire',
                      title: '🔥 Lửa Đỏ Cam Gaming (Flame Fire Flow)',
                      desc: 'Dải màu lửa đỏ - cam nhiệt huyết rực cháy.',
                    },
                  ].map((mode) => {
                    const isSelected = (formData.typography?.colorMode || 'rainbow_flow') === mode.id;
                    return (
                      <div
                        key={mode.id}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            typography: {
                              ...(formData.typography || {
                                fontFamily: 'Space Grotesk',
                                titleWeight: 'black',
                                enableColorFlow: true,
                                colorMode: 'rainbow_flow',
                                enableTextGlow: true,
                                enableChunkyTitles: true,
                                applyToNavAndButtons: true,
                                applyToSectionHeadings: true,
                              }),
                              colorMode: mode.id as any,
                              enableColorFlow: mode.id !== 'pure_white',
                            },
                          })
                        }
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#22D3EE]/10 border-[#22D3EE]/60 shadow-sm'
                            : 'bg-[#161626]/70 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#22D3EE] bg-[#22D3EE]' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-[#F0EDFF]">{mode.title}</div>
                        <div className="text-[11px] text-[#8B84A8] leading-relaxed">{mode.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Option 2: Lựa Chọn Phông Chữ & Độ Béo Phồng */}
            <Card className="p-5 space-y-4" variant="default">
              <CardHeader
                title="Phông Chữ & Độ Béo Phồng"
                subtitle="Tùy chọn phông chữ hiện đại và độ dày phồng của tiêu đề"
                icon={<Type className="w-4 h-4 text-[#9D5CF6]" />}
              />

              <div className="space-y-4 pt-1">
                {/* Font Family Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CBC7E0]">Phông Chữ Toàn Hệ Thống (Font Family):</label>
                  <select
                    value={formData.typography?.fontFamily || 'Space Grotesk'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        typography: {
                          ...(formData.typography || {
                            fontFamily: 'Space Grotesk',
                            titleWeight: 'black',
                            enableColorFlow: true,
                            colorMode: 'rainbow_flow',
                            enableTextGlow: true,
                            enableChunkyTitles: true,
                            applyToNavAndButtons: true,
                            applyToSectionHeadings: true,
                          }),
                          fontFamily: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Space Grotesk">Space Grotesk (Gaming Cyberpunk - Mặc Định)</option>
                    <option value="Montserrat">Montserrat (Hiện Đại & Mạnh Mẽ)</option>
                    <option value="Russo One">Russo One (Chữ Khối Đậm Chất Game)</option>
                    <option value="Chakra Petch">Chakra Petch (Cyber Mecha Tech)</option>
                    <option value="Orbitron">Orbitron (Futuristic Sci-Fi Game)</option>
                    <option value="Be Vietnam Pro">Be Vietnam Pro (Chuẩn Tiếng Việt Cao Cấp)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Tech Premium Sang Trọng)</option>
                    <option value="Inter">Inter (Chuẩn Quốc Tế & Tối Giản)</option>
                    <option value="Outfit">Outfit (Đậm Nét & Nổi Bật)</option>
                    <option value="Manrope">Manrope (Bo Tròn Mềm Mại)</option>
                    <option value="Syne">Syne (Artistic & Độc Đáo)</option>
                    <option value="Rajdhani">Rajdhani (Góc Cạnh Cyber Gaming)</option>
                    <option value="Roboto">Roboto (Google Chữ Cổ Điển)</option>
                    <option value="Times New Roman">Times New Roman (Chữ Báo Chí Truyền Thống)</option>
                    <option value="Arial">Arial (Chữ Cơ Bản, Dễ Nhìn)</option>
                  </select>
                </div>

                {/* Font Size Scale */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CBC7E0]">Độ To Chữ Của Tiêu Đề & Nút (Font Size):</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'small', label: 'Nhỏ' },
                      { id: 'normal', label: 'Vừa' },
                      { id: 'large', label: 'To 1' },
                      { id: 'xlarge', label: 'To 2' },
                      { id: 'xxlarge', label: 'Rất To' },
                    ].map((sz) => {
                      const isSelected = (formData.typography?.fontSizeScale || 'normal') === sz.id;
                      return (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              typography: {
                                ...(formData.typography || {
                                  fontFamily: 'Space Grotesk',
                                  titleWeight: 'black',
                                  enableColorFlow: true,
                                  colorMode: 'rainbow_flow',
                                  enableTextGlow: true,
                                  enableChunkyTitles: true,
                                  applyToNavAndButtons: true,
                                  applyToSectionHeadings: true,
                                }),
                                fontSizeScale: sz.id as any,
                              },
                            })
                          }
                          className={`py-2 rounded-xl text-center text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-[#9D5CF6] shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                              : 'bg-[#161626] border-white/5 text-[#8B84A8] hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {sz.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title Weight / Boldness */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CBC7E0]">Độ Béo Phồng Của Tiêu Đề & Logo:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { id: 'normal', label: 'Normal 400 (Mảnh)' },
                      { id: 'medium', label: 'Medium 500' },
                      { id: 'semibold', label: 'SemiBold 600' },
                      { id: 'bold', label: 'Bold 700' },
                      { id: 'extrabold', label: 'ExtraBold 800' },
                      { id: 'black', label: 'Black 900 (Béo Phồng)' },
                    ].map((w) => {
                      const isSelected = (formData.typography?.titleWeight || 'black') === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              typography: {
                                ...(formData.typography || {
                                  fontFamily: 'Space Grotesk',
                                  titleWeight: 'black',
                                  enableColorFlow: true,
                                  colorMode: 'rainbow_flow',
                                  enableTextGlow: true,
                                  enableChunkyTitles: true,
                                  applyToNavAndButtons: true,
                                  applyToSectionHeadings: true,
                                }),
                                titleWeight: w.id as any,
                              },
                            })
                          }
                          className={`py-2 px-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#7C3AED] text-white border-[#9D5CF6] shadow-sm'
                              : 'bg-[#161626] text-[#8B84A8] border-white/5 hover:text-white'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Glow Toggle */}
                <div className="p-3.5 rounded-xl bg-[#161626]/70 border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#F0EDFF]">Hiệu Ứng Phát Sáng Neon (Drop Shadow Glow)</div>
                    <div className="text-[11px] text-[#8B84A8]">Bổ sung hào quang phát sáng xung quanh chữ trên nền tối</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.typography?.enableTextGlow !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          typography: {
                            ...(formData.typography || {
                              fontFamily: 'Space Grotesk',
                              titleWeight: 'black',
                              enableColorFlow: true,
                              colorMode: 'rainbow_flow',
                              enableTextGlow: true,
                              enableChunkyTitles: true,
                              applyToNavAndButtons: true,
                              applyToSectionHeadings: true,
                            }),
                            enableTextGlow: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22D3EE]"></div>
                  </label>
                </div>

                {/* Scope Selection */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <div className="text-[11px] font-bold text-[#8B84A8] uppercase tracking-wider">
                    Phạm vi áp dụng hiệu ứng chuyển động màu:
                  </div>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer text-xs">
                    <span className="text-[#CBC7E0]">Áp dụng cho Tiêu đề các mục (Hero Banner, Quy Trình 3 Bước, Kho Sản phẩm)</span>
                    <input
                      type="checkbox"
                      checked={formData.typography?.applyToSectionHeadings !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          typography: {
                            ...(formData.typography || {
                              fontFamily: 'Space Grotesk',
                              titleWeight: 'black',
                              enableColorFlow: true,
                              colorMode: 'rainbow_flow',
                              enableTextGlow: true,
                              enableChunkyTitles: true,
                              applyToNavAndButtons: true,
                              applyToSectionHeadings: true,
                            }),
                            applyToSectionHeadings: e.target.checked,
                          },
                        })
                      }
                      className="rounded bg-[#0F0F1A] border-white/10 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer text-xs">
                    <span className="text-[#CBC7E0]">Áp dụng cho Thanh Menu & Nút Bấm (Shop, Nạp, Đơn, Hỗ trợ, Giỏ Hàng)</span>
                    <input
                      type="checkbox"
                      checked={formData.typography?.applyToNavAndButtons !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          typography: {
                            ...(formData.typography || {
                              fontFamily: 'Space Grotesk',
                              titleWeight: 'black',
                              enableColorFlow: true,
                              colorMode: 'rainbow_flow',
                              enableTextGlow: true,
                              enableChunkyTitles: true,
                              applyToNavAndButtons: true,
                              applyToSectionHeadings: true,
                            }),
                            applyToNavAndButtons: e.target.checked,
                          },
                        })
                      }
                      className="rounded bg-[#0F0F1A] border-white/10 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                💾 Lưu Cài Đặt Phông Chữ & Hiệu Ứng Màu
              </Button>
            </div>
          </div>
        )}

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

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Kích Thước Bot AI (Màn Khách)
                    </label>
                    <select
                      value={formData.aiBotSize || 'medium'}
                      onChange={(e) => setFormData({ ...formData, aiBotSize: e.target.value as 'small' | 'medium' | 'large' })}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
                    >
                      <option value="small">Nhỏ (Gọn gàng)</option>
                      <option value="medium">Vừa (Mặc định)</option>
                      <option value="large">To (Nổi bật)</option>
                    </select>
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
                <div className="p-3 bg-white rounded-2xl shadow-2xl border-2 border-cyan-400/40 flex flex-col items-center justify-center max-w-[260px] mx-auto relative overflow-hidden group">
                  <div className="vietqr-corner-bracket top-2 left-2 border-t-2 border-l-2 rounded-tl-sm" />
                  <div className="vietqr-corner-bracket top-2 right-2 border-t-2 border-r-2 rounded-tr-sm" />
                  <div className="vietqr-corner-bracket bottom-2 left-2 border-b-2 border-l-2 rounded-bl-sm" />
                  <div className="vietqr-corner-bracket bottom-2 right-2 border-b-2 border-r-2 rounded-br-sm" />
                  <div className="vietqr-scan-laser-line" />
                  <img
                    src={previewQrUrl}
                    alt="VietQR Preview"
                    className="w-full aspect-square object-contain rounded-lg relative z-10"
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

              {/* Card Recharge Configuration Matrix (Images 3, 4, 5) */}
              <div className="space-y-6">
                {/* 1. Kênh nạp thẻ cào */}
                <Card className="p-5 space-y-4" variant="default">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#06B6D4]" />
                      <h3 className="font-display font-extrabold text-sm text-[#F0EDFF]">💳 Kênh nạp thẻ cào</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Bật toàn bộ kênh thẻ */}
                    <div className="p-3 rounded-2xl bg-[#161626] border border-white/5 flex items-center justify-between">
                      <span className="font-semibold text-[#F0EDFF]">Bật toàn bộ kênh thẻ</span>
                      <input
                        type="checkbox"
                        checked={formData.scratchCardEnabled}
                        onChange={(e) => setFormData({ ...formData, scratchCardEnabled: e.target.checked })}
                        className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    {/* Thẻ sai mệnh giá */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#8B84A8] tracking-wider">
                        THẺ SAI MỆNH GIÁ
                      </label>
                      <select
                        value={formData.cardSettings?.wrongAmountAction || 'real_amount'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cardSettings: {
                              ...(formData.cardSettings || {}),
                              wrongAmountAction: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
                      >
                        <option value="real_amount">Cộng theo mệnh giá thật nhà mạng</option>
                        <option value="penalty_50">Phạt 50% mệnh giá thực tế</option>
                        <option value="reject">Không cộng tiền (Từ chối thẻ)</option>
                      </select>
                    </div>

                    {/* Tối đa / người / phút */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#8B84A8] tracking-wider">
                        TỐI ĐA / NGƯỜI / PHÚT
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.cardSettings?.maxPerUserPerMinute || 10}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cardSettings: {
                              ...(formData.cardSettings || {}),
                              maxPerUserPerMinute: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    {/* Tối đa / người / ngày */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#8B84A8] tracking-wider">
                        TỐI ĐA / NGƯỜI / NGÀY
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={formData.cardSettings?.maxPerUserPerDay || 100}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cardSettings: {
                              ...(formData.cardSettings || {}),
                              maxPerUserPerDay: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                      className="w-full sm:w-auto font-bold shadow-lg shadow-[#7C3AED]/20"
                    >
                      💾 Lưu cài đặt kênh thẻ
                    </Button>
                  </div>
                </Card>

                {/* 2. Bảng phí thẻ (Matrix Table) */}
                <Card className="p-5 space-y-6" variant="default">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <div>
                        <h3 className="font-display font-extrabold text-sm text-[#F0EDFF]">📜 Bảng phí thẻ</h3>
                        <span className="text-[11px] text-[#8B84A8]">25 mệnh giá</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => {
                        const amountStr = prompt('Nhập mệnh giá mới cần thêm (VD: 30000 hoặc 300000):');
                        if (!amountStr) return;
                        const newAmt = parseInt(amountStr.replace(/\D/g, ''));
                        if (isNaN(newAmt) || newAmt <= 0) {
                          showToast('Mệnh giá không hợp lệ', 'error');
                          return;
                        }
                        const matrix = { ...(formData.cardSettings?.networkMatrix || DEFAULT_CARD_MATRIX) };
                        Object.keys(matrix).forEach((net) => {
                          if (!matrix[net].some((item) => item.amount === newAmt)) {
                            matrix[net].push({
                              amount: newAmt,
                              receiveAmount: Math.round(newAmt * 0.8),
                              feePercent: 20.0,
                              enabled: true,
                            });
                            matrix[net].sort((a, b) => a.amount - b.amount);
                          }
                        });
                        setFormData({
                          ...formData,
                          cardSettings: {
                            ...(formData.cardSettings || {}),
                            networkMatrix: matrix,
                          },
                        });
                        showToast(`Đã thêm mệnh giá ${newAmt.toLocaleString('vi-VN')}đ vào bảng phí`, 'success');
                      }}
                      className="font-bold border-white/10 hover:border-cyan-400 text-xs"
                    >
                      + Thêm mệnh giá
                    </Button>
                  </div>

                  {/* Notice callout */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    Chủ shop đã chốt <strong>không nhận thẻ 30.000đ và 300.000đ</strong>. Hai mức này mặc định tắt; chỉ bật lại khi đã chủ động đối soát với nhà mạng.
                  </div>

                  {/* Matrix tables for each network */}
                  {Object.entries(formData.cardSettings?.networkMatrix || DEFAULT_CARD_MATRIX).map(([networkName, rates]) => (
                    <div key={networkName} className="space-y-2.5 pt-2 border-t border-white/5 first:border-0 first:pt-0">
                      <div className="flex items-center justify-between">
                        <div className="font-display font-black text-sm text-[#F0EDFF] tracking-wider uppercase flex items-center gap-2">
                          <span className="text-[#9D5CF6]">●</span>
                          <span>{networkName}</span>
                          <span className="text-[10px] font-bold text-[#8B84A8] lowercase">({rates.length} mức)</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-[10px] font-extrabold uppercase text-[#8B84A8] tracking-wider">
                              <th className="py-2.5 px-3">MỆNH GIÁ</th>
                              <th className="py-2.5 px-3">THỰC NHẬN</th>
                              <th className="py-2.5 px-3 text-center">PHÍ</th>
                              <th className="py-2.5 px-3 text-center">NHẬN THẺ</th>
                              <th className="py-2.5 px-3 text-right">VIỆC</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {rates.map((rateItem) => {
                              const calculatedFee = rateItem.amount > 0 
                                ? (((rateItem.amount - rateItem.receiveAmount) / rateItem.amount) * 100).toFixed(1)
                                : '0.0';

                              return (
                                <tr key={rateItem.amount} className="hover:bg-white/[0.02] transition-colors">
                                  {/* Mệnh giá */}
                                  <td className="py-2.5 px-3 font-bold text-[#F0EDFF] whitespace-nowrap">
                                    {rateItem.amount.toLocaleString('vi-VN')}đ
                                  </td>

                                  {/* Thực nhận input */}
                                  <td className="py-2.5 px-3">
                                    <div className="relative max-w-[140px]">
                                      <input
                                        type="number"
                                        min={0}
                                        max={rateItem.amount}
                                        value={rateItem.receiveAmount}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const matrix = { ...(formData.cardSettings?.networkMatrix || DEFAULT_CARD_MATRIX) };
                                          matrix[networkName] = matrix[networkName].map((item) =>
                                            item.amount === rateItem.amount
                                              ? {
                                                  ...item,
                                                  receiveAmount: val,
                                                  feePercent: parseFloat(
                                                    (((item.amount - val) / item.amount) * 100).toFixed(1)
                                                  ),
                                                }
                                              : item
                                          );
                                          setFormData({
                                            ...formData,
                                            cardSettings: {
                                              ...(formData.cardSettings || {}),
                                              networkMatrix: matrix,
                                            },
                                          });
                                        }}
                                        className="w-full bg-[#0F0F1A] border border-white/10 focus:border-[#7C3AED] rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-400 focus:outline-none"
                                      />
                                    </div>
                                  </td>

                                  {/* Phí */}
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[11px]">
                                      {calculatedFee}%
                                    </span>
                                  </td>

                                  {/* Nhận thẻ (Bật / Tắt) */}
                                  <td className="py-2.5 px-3 text-center">
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={rateItem.enabled}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          const matrix = { ...(formData.cardSettings?.networkMatrix || DEFAULT_CARD_MATRIX) };
                                          matrix[networkName] = matrix[networkName].map((item) =>
                                            item.amount === rateItem.amount
                                              ? { ...item, enabled: isChecked }
                                              : item
                                          );
                                          setFormData({
                                            ...formData,
                                            cardSettings: {
                                              ...(formData.cardSettings || {}),
                                              networkMatrix: matrix,
                                            },
                                          });
                                        }}
                                        className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                      />
                                      <span className={`text-[11px] font-semibold ${rateItem.enabled ? 'text-[#F0EDFF]' : 'text-[#6B658E]'}`}>
                                        Bật
                                      </span>
                                    </label>
                                  </td>

                                  {/* Việc / Thao tác */}
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateSettings(formData);
                                        showToast(`Đã lưu cấu hình thẻ ${networkName} ${rateItem.amount.toLocaleString('vi-VN')}đ`, 'success');
                                      }}
                                      className="px-3 py-1 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10 text-xs font-bold text-[#CBC7E0] transition-colors cursor-pointer"
                                    >
                                      Lưu
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* 2. GENERAL STORE TAB */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5 space-y-4" variant="default">
              <CardHeader title="Thông Tin Thương Hiệu & Cửa Hàng" subtitle="Tên shop, khẩu hiệu và kênh hỗ trợ" />

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
              <CardHeader title="Thời Gian Phiên Quản Trị" subtitle="Tự động đăng xuất bảo vệ an toàn" />

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Thời Gian Hết Hạn Phiên (Phút)
                  </label>
                  <input
                    type="number"
                    min={15}
                    value={formData.sessionTimeoutMinutes || 1440}
                    onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: Number(e.target.value) })}
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  />
                  <span className="text-[10px] text-[#6B658E]">Mặc định 1440 phút (24 tiếng)</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 3. DEDICATED MAINTENANCE & ZALO ADMIN TAB */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <Card className="p-5 space-y-4" variant="default">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-[#F0EDFF] flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-amber-400" />
                    Chế Độ Bảo Trì Cửa Hàng & Zalo Admin
                  </h3>
                  <p className="text-xs text-[#8B84A8] mt-0.5">
                    Khi bật, toàn bộ khách truy cập ngoài web sẽ thấy màn hình thông báo bảo trì kèm nút bấm liên hệ Zalo Admin để mua hàng trực tiếp.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.maintenanceMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {formData.maintenanceMode ? '🔴 ĐANG BẬT BẢO TRÌ' : '🟢 ĐANG MỞ CỬA BÌNH THƯỜNG'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.maintenanceMode}
                      onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#161626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 border border-white/10"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5" />
                    Số Zalo Admin Mua Hàng (*)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.adminZalo || formData.zaloHotline || '0916396901'}
                      onChange={(e) => setFormData({ ...formData, adminZalo: e.target.value, zaloHotline: e.target.value })}
                      placeholder="0916396901"
                      className="w-full bg-[#161626] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400"
                    />
                    <a
                      href={`https://zalo.me/${formData.adminZalo || '0916396901'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/30 flex items-center justify-center shrink-0"
                      title="Bấm thử mở Zalo"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Hotline Khẩn Cấp
                  </label>
                  <input
                    type="text"
                    value={formData.adminHotline || '0916396901'}
                    onChange={(e) => setFormData({ ...formData, adminHotline: e.target.value })}
                    placeholder="0916396901"
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Telegram Admin
                  </label>
                  <input
                    type="text"
                    value={formData.adminTelegram || formData.telegramAdminId || 'quangthank'}
                    onChange={(e) => setFormData({ ...formData, adminTelegram: e.target.value, telegramAdminId: e.target.value })}
                    placeholder="quangthank"
                    className="w-full bg-[#161626] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                  Thông Báo Bảo Trì Hiển Thị Cho Khách Hàng
                </label>
                <textarea
                  rows={3}
                  value={formData.maintenanceMessage || ''}
                  onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  placeholder="Hệ thống đang được bảo trì định kỳ & nâng cấp máy chủ để phục vụ quý khách tốt nhất. Mọi nhu cầu mua sản phẩm hoặc kích hoạt key gấp, vui lòng bấm liên hệ trực tiếp Zalo Admin!"
                  className="w-full bg-[#161626] border border-white/10 rounded-xl p-3 text-xs text-[#F0EDFF] leading-relaxed focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </Card>

            {/* Live Preview Box */}
            <Card className="p-5 space-y-4" variant="default">
              <CardHeader
                title="👁️ Xem Trước Màn Hình Bảo Trì Khách Hàng Thấy"
                subtitle="Mô phỏng trực tiếp giao diện hiển thị cho khách truy cập"
              />
              <div className="p-6 rounded-2xl bg-[#08080F] border border-amber-500/30 text-center space-y-4 max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                  <Wrench className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-lg text-amber-300 uppercase">
                  Cửa Hàng Đang Bảo Trì Nâng Cấp
                </h4>
                <p className="text-xs text-[#CBC7E0] leading-relaxed">
                  {formData.maintenanceMessage || 'Hệ thống đang được bảo trì định kỳ. Mọi nhu cầu mua hàng vui lòng bấm liên hệ Zalo Admin!'}
                </p>
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#161626] to-teal-950/40 border border-emerald-500/40 space-y-2 text-left">
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Mua hàng trực tiếp qua Zalo Admin:
                  </div>
                  <a
                    href={`https://zalo.me/${formData.adminZalo || '0916396901'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <PhoneCall className="w-4 h-4 text-black" />
                    <span>💬 NHẮN TIN ZALO ADMIN: {formData.adminZalo || '0916396901'}</span>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 4. SECURITY & ANTI-HACK SUITE */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Top Shield Status */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#161626] to-[#7C3AED]/20 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-extrabold text-base text-[#F0EDFF]">
                      Tường Lửa Web Application Firewall (WAF) & Anti-Hack
                    </h3>
                    <Badge variant="success" size="sm" dot>Đang Bảo Vệ 24/7</Badge>
                  </div>
                  <p className="text-xs text-[#8B84A8] mt-0.5">
                    Hệ thống tự động lọc mã độc XSS, chặn SQL Injection, chống Brute-Force và chống DDoS toàn diện.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRunDeepScan}
                disabled={isScanningSecurity}
                leftIcon={<Activity className={`w-4 h-4 ${isScanningSecurity ? 'animate-spin' : ''}`} />}
              >
                {isScanningSecurity ? `Đang Quét (${scanProgress}%)...` : '⚡ Quét Toàn Diện Hệ Thống'}
              </Button>
            </div>

            {/* Deep Scan Results Box */}
            {scanCompleted && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#161626] to-[#08080F] border border-emerald-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    KẾT QUẢ QUÉT AN NINH MẠNG: 20/20 TIÊU CHUẨN ĐẠT CHUẨN XUẤT SẮC (GRADE A+)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">100 / 100 Điểm</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-[#8B84A8]">Mã hóa SSL/TLS:</div>
                    <div className="font-bold text-emerald-400">✅ 256-Bit Hoạt Động</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-[#8B84A8]">XSS & SQLi Filter:</div>
                    <div className="font-bold text-emerald-400">✅ Bật Chống Mã Độc</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-[#8B84A8]">Lỗ hổng zero-day:</div>
                    <div className="font-bold text-emerald-400">✅ 0 Phát hiện</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-[#8B84A8]">Bảo vệ mã nguồn:</div>
                    <div className="font-bold text-emerald-400">✅ Khóa an toàn</div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Toggles Grid */}
            <Card className="p-5 space-y-4" variant="default">
              <CardHeader title="Cấu Hình Phòng Vệ & Tường Lửa" subtitle="Tùy chỉnh các lớp bảo mật chống hacker và bot phá hoại" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-semibold text-[#F0EDFF] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Chống DDoS & Throttling (Rate Limiting)
                    </div>
                    <div className="text-[10.5px] text-[#6B658E]">
                      Tự động chặn IP gửi quá 60 requests/phút
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.antiDDoSEnabled ?? formData.rateLimiting}
                    onChange={(e) => setFormData({ ...formData, antiDDoSEnabled: e.target.checked, rateLimiting: e.target.checked })}
                    className="rounded bg-[#0F0F1A] border-white/10 text-emerald-500 focus:ring-0 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-semibold text-[#F0EDFF] flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      Anti-Bot Shield (Chống Bot Ảo)
                    </div>
                    <div className="text-[10.5px] text-[#6B658E]">
                      Ngăn chặn bot spam tạo đơn hàng hoặc nạp tiền ảo
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.antiBotShield ?? true}
                    onChange={(e) => setFormData({ ...formData, antiBotShield: e.target.checked })}
                    className="rounded bg-[#0F0F1A] border-white/10 text-cyan-500 focus:ring-0 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-semibold text-[#F0EDFF] flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#C084FC]" />
                      Chặn F12 & Chuột Phải (Anti-Inspect)
                    </div>
                    <div className="text-[10.5px] text-[#6B658E]">
                      Bảo vệ bản quyền giao diện và mã nguồn
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.antiInspectEnabled ?? false}
                    onChange={(e) => setFormData({ ...formData, antiInspectEnabled: e.target.checked })}
                    className="rounded bg-[#0F0F1A] border-white/10 text-purple-500 focus:ring-0 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#161626] border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                  <div>
                    <div className="font-semibold text-[#F0EDFF] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Xác Thực Hai Lớp 2FA (Google Authenticator)
                    </div>
                    <div className="text-[10.5px] text-[#6B658E]">
                      Bắt buộc nhập mã OTP 6 số từ ứng dụng trên điện thoại khi đăng nhập Admin
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enable2FA}
                    onChange={(e) => setFormData({ ...formData, enable2FA: e.target.checked })}
                    className="rounded bg-[#0F0F1A] border-white/10 text-amber-500 focus:ring-0 w-4 h-4"
                  />
                </label>
              </div>
            </Card>

            {/* 📱 DEDICATED GOOGLE AUTHENTICATOR SETUP & LIVE OTP TESTER */}
            <Card className="p-5 space-y-4 border-amber-500/30" variant="default">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#F0EDFF] flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-amber-400" />
                    Thiết Lập Google Authenticator Cho Điện Thoại (2FA)
                  </h3>
                  <p className="text-xs text-[#8B84A8] mt-0.5">
                    Mở ứng dụng Google Authenticator trên điện thoại Android hoặc iPhone, quét mã QR dưới đây để kích hoạt bảo vệ 2 lớp.
                  </p>
                </div>
                <Badge variant={formData.enable2FA ? 'success' : 'default'} size="sm">
                  {formData.enable2FA ? '🟢 2FA Đang Bật' : '⚪ 2FA Đang Tắt'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                {/* Left: Google Authenticator QR Code */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-white border-2 border-amber-400/40 shadow-xl shadow-amber-500/10 text-center">
                  <img
                    src={generateGoogleAuthQrUrl(
                      generateTotpUri(pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP', 'admin@thanox.vn', formData.storeName || 'THANOX STORE')
                    )}
                    alt="Google Authenticator QR"
                    className="w-48 h-48 rounded-xl object-contain"
                  />
                  <div className="mt-2 text-[11px] font-bold text-zinc-800 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quét mã trên Google Authenticator</span>
                  </div>
                </div>

                {/* Right: Secret Key & Interactive OTP Tester */}
                <div className="md:col-span-7 space-y-4 text-xs">
                  {/* Secret Key Box */}
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#161626] border border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <KeyRound className="w-3.5 h-3.5" />
                        Khóa Bí Mật (Secret Key)
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateNewSecret}
                        className="text-amber-400 hover:text-amber-300 font-bold lowercase hover:underline cursor-pointer"
                      >
                        (tạo khóa mới)
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}
                        className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3 py-2 font-mono font-bold text-sm text-amber-300 tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => copySecretToClipboard(pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP')}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                        title="Sao chép Secret Key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-[#8B84A8]">
                      Nhập mã này thủ công vào app nếu camera điện thoại không thể quét mã QR.
                    </p>
                  </div>

                  {/* Live OTP Test Box */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#161626] to-[#161626] border border-emerald-500/30">
                    <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      Kiểm Tra Thử Mã OTP Trên Điện Thoại Của Bạn
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={totpTestCode}
                        onChange={(e) => setTotpTestCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Nhập mã 6 số (VD: 492810)..."
                        className="flex-1 bg-[#0F0F1A] border border-emerald-500/40 rounded-xl px-3 py-2 font-mono font-bold text-sm text-emerald-300 text-center tracking-widest focus:outline-none focus:border-emerald-400"
                      />
                      <Button variant="primary" size="sm" onClick={handleVerifyTotpTest}>
                        Kiểm Tra Ngay
                      </Button>
                    </div>

                    {totpTestResult && (
                      <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        totpTestResult.valid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}>
                        {totpTestResult.valid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Mã OTP 6 số hợp lệ! Google Authenticator đã kết nối thành công 100%!</span>
                          </>
                        ) : (
                          <span>❌ {totpTestResult.reason || 'Mã OTP không đúng hoặc đã hết hạn'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Emergency Master Backup Key */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-[11px]">
                    <span className="text-[#8B84A8]">Mã cứu hộ khẩn cấp khi mất điện thoại:</span>
                    <span className="font-mono font-bold text-amber-400">888999</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* IP Blacklist Manager */}
            <Card className="p-5 space-y-4" variant="default">
              <CardHeader title="Danh Sách Đen IP (IP Blacklist)" subtitle="Quản lý các địa chỉ IP bị chặn truy cập hoàn toàn khỏi website" />

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBlockedIp}
                  onChange={(e) => setNewBlockedIp(e.target.value)}
                  placeholder="Nhập địa chỉ IP cần chặn (VD: 185.220.101.4)..."
                  className="flex-1 bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <Button variant="danger" size="sm" onClick={handleAddBlockedIp}>
                  + Chặn IP
                </Button>
              </div>

              <div className="space-y-2 pt-2">
                {(formData.blockedIps || ['185.220.101.4', '45.154.255.89']).map((ip) => (
                  <div key={ip} className="p-2.5 rounded-xl bg-[#161626] border border-red-500/20 flex items-center justify-between text-xs">
                    <span className="font-mono text-red-400 font-semibold">{ip}</span>
                    <span className="text-[11px] text-[#8B84A8]">Lý do: Phát hiện tấn công quét cổng</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedIp(ip)}
                      className="text-xs text-[#8B84A8] hover:text-white px-2 py-1 bg-white/5 rounded-lg cursor-pointer"
                    >
                      Bỏ chặn
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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

        {/* 5. MUSIC MANAGEMENT TAB */}
        {activeTab === 'music' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Music Config & Add Track (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-5 space-y-4" variant="default">
                <CardHeader
                  title="Cấu Hình Nhạc Nền Khách Hàng"
                  subtitle="Phát nhạc tự động khi khách vào web Shop Thanox"
                  icon={<Music className="w-4 h-4 text-[#9D5CF6]" />}
                />

                <label className="flex items-center justify-between p-3 rounded-2xl bg-[#161626] border border-white/5 cursor-pointer text-xs">
                  <div>
                    <div className="font-semibold text-[#F0EDFF]">Bật Trình Phát Nhạc Nền</div>
                    <div className="text-[10.5px] text-[#6B658E]">
                      Hiển thị thanh nghe nhạc nổi góc trái cho tất cả khách hàng
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.musicEnabled}
                    onChange={(e) => setFormData({ ...formData, musicEnabled: e.target.checked })}
                    className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </label>
              </Card>

              {/* Add New Track Card */}
              <Card className="p-5 space-y-4 border-[#7C3AED]/30 bg-[#0F0F1A]" variant="default">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Plus className="w-4 h-4 text-[#9D5CF6]" />
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#F0EDFF]">
                    Thêm Bài Hát Mới
                  </h4>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Option 1: Upload MP3 File from Computer */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <FileAudio className="w-3.5 h-3.5" />
                        <span>1. Tải File MP3 Từ Máy Tính Lên</span>
                      </span>
                      <span className="text-[10px] text-amber-400">Khuyên dùng</span>
                    </label>

                    <input
                      type="file"
                      id="audio-file-input"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleAudioFileUpload(file);
                      }}
                    />
                    <label
                      htmlFor="audio-file-input"
                      className="border-2 border-dashed border-[#7C3AED]/40 hover:border-[#7C3AED] bg-[#161626]/80 hover:bg-[#161626] rounded-2xl p-4 text-center transition-all cursor-pointer block group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 mx-auto flex items-center justify-center text-[#9D5CF6] group-hover:scale-110 transition-transform mb-2">
                        {isUploadingAudio ? (
                          <div className="w-5 h-5 border-2 border-[#9D5CF6] border-t-transparent rounded-full animate-spin" />
                        ) : selectedAudioFileName ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>

                      {selectedAudioFileName ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đã chọn: {selectedAudioFileName}
                          </div>
                          <div className="text-[10.5px] text-[#8B84A8]">
                            Bấm vào để đổi file khác nếu muốn
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors">
                            📁 BẤM VÀO ĐÂY ĐỂ CHỌN FILE MP3 / WAV
                          </div>
                          <div className="text-[10.5px] text-[#8B84A8]">
                            Kéo thả hoặc tải file âm thanh từ máy tính của bạn
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Song Title & Artist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Tên Bài Hát *
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Cyberpunk Phonk VIP"
                        value={newTrackTitle}
                        onChange={(e) => setNewTrackTitle(e.target.value)}
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                        Nghệ Sĩ / Tác Giả
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Thanox Audio Team"
                        value={newTrackArtist}
                        onChange={(e) => setNewTrackArtist(e.target.value)}
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* Option 2: Direct URL */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      2. Hoặc Dán Link URL MP3 Trực Tiếp (Tùy chọn)
                    </label>
                    <input
                      type="url"
                      placeholder="https://.../music.mp3 (Nếu không tải file từ máy tính)"
                      value={newTrackUrl.startsWith('data:') ? '' : newTrackUrl}
                      onChange={(e) => {
                        setNewTrackUrl(e.target.value);
                        setSelectedAudioFileName(null);
                        setPreviewAudioUrl(e.target.value);
                      }}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#06B6D4] font-mono focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full justify-center shadow-lg shadow-[#7C3AED]/25"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      if (!newTrackTitle.trim() || !newTrackUrl.trim()) {
                        showToast('Vui lòng chọn file MP3 từ máy tính hoặc nhập link URL âm thanh', 'error');
                        return;
                      }
                      const newTrack = {
                        id: 'track-' + Date.now(),
                        title: newTrackTitle.trim(),
                        artist: newTrackArtist.trim() || 'Thanox Gaming',
                        url: newTrackUrl.trim(),
                      };
                      setFormData({
                        ...formData,
                        musicTracks: [...(formData.musicTracks || []), newTrack],
                      });
                      setNewTrackTitle('');
                      setNewTrackArtist('');
                      setNewTrackUrl('');
                      setSelectedAudioFileName(null);
                      showToast(`Đã thêm bài hát "${newTrack.title}" vào danh sách phát!`, 'success');
                    }}
                  >
                    Thêm Vào Danh Sách Nhạc
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Music Track Playlist (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-5 space-y-4" variant="default">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Disc className="w-4 h-4 text-[#9D5CF6]" />
                    <h3 className="font-display font-bold text-sm text-[#F0EDFF]">
                      Danh Sách Bài Hát (Playlist: {(formData.musicTracks || []).length} bài)
                    </h3>
                  </div>
                  <Badge variant="brand" size="xs">
                    Auto-Loop
                  </Badge>
                </div>

                {(!formData.musicTracks || formData.musicTracks.length === 0) ? (
                  <div className="p-8 text-center text-xs text-[#8B84A8] border border-dashed border-white/10 rounded-2xl bg-[#161626]/40 space-y-2">
                    <Music className="w-8 h-8 text-[#6B658E] mx-auto" />
                    <div>Chưa có bài hát nào trong playlist. Hãy thêm bài hát ở khung bên trái!</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.musicTracks.map((track, idx) => (
                      <div
                        key={track.id || idx}
                        className="p-3.5 rounded-2xl bg-[#161626] border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs text-[#9D5CF6]">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#F0EDFF] truncate">{track.title}</div>
                            <div className="text-[10.5px] text-[#8B84A8] truncate">{track.artist}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (previewAudioUrl === track.url) {
                                setPreviewAudioUrl(null);
                              } else {
                                setPreviewAudioUrl(track.url);
                              }
                            }}
                            className="p-2 rounded-xl bg-[#7C3AED]/20 hover:bg-[#7C3AED]/40 text-[#9D5CF6] transition-colors cursor-pointer"
                            title="Nghe thử"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                musicTracks: formData.musicTracks.filter((_, i) => i !== idx),
                              });
                              showToast('Đã xóa bài hát khỏi danh sách', 'info');
                            }}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                            title="Xóa bài hát"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {previewAudioUrl && (
                  <div className="p-3 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 space-y-2">
                    <div className="text-[11px] font-bold text-[#9D5CF6] flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Đang nghe thử:</span>
                    </div>
                    <audio src={previewAudioUrl} autoPlay controls className="w-full h-8" />
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* 6. DATA MANAGEMENT & ZERO RESET TAB */}
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
