import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreSettings } from '../types';
import { DEFAULT_CARD_MATRIX } from '../data/mockData';
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
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDefaultData, resetToZeroData, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<'banner' | 'payments' | 'general' | 'security' | 'affiliate' | 'music' | 'data'>('banner');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

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
            Cấu hình cổng VietQR động, giới hạn nạp tiền 10K - 10M, thông tin hỗ trợ và quản trị dữ liệu
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
          Lưu Cấu Hình
        </Button>
      </div>

      {/* Tabs Switcher with Mouse Wheel Scrolling */}
      <div
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto scrollbar-none no-scrollbar cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={() => setActiveTab('banner')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'banner'
              ? 'bg-[#7C3AED]/20 text-white border border-[#7C3AED]/40 shadow-sm'
              : 'text-[#8B84A8] hover:text-white bg-[#161626]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
          <span>🎨 Banner & Giao Diện</span>
        </button>

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
          <span>Giới Thiệu & Kiếm Tiền</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('music')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'music'
              ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
              : 'text-[#8B84A8] hover:text-white bg-[#161626]'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-[#9D5CF6]" />
          <span>Quản Lý Nhạc Nền</span>
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
