import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  MessageSquare,
  Bot,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  Smartphone,
  Apple,
  CreditCard,
  ShoppingBag,
  PhoneCall,
  ExternalLink,
  Zap,
  CheckCircle2,
  HelpCircle,
  Flame,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ThanoxMascot } from '../ui/ThanoxMascot';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: { label: string; action: () => void; isPrimary?: boolean }[];
  time: string;
}

export const StorefrontAIAssistant: React.FC = () => {
  const { products, settings, navigateToStorefront, appMode } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [inputQuery, setInputQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [deviceSelected, setDeviceSelected] = useState<'all' | 'android' | 'ios'>('all');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const shopName = settings.storeName || 'THANOX STORE';
  const adminZalo = settings.adminZalo || settings.zaloHotline || '0889696810';

  // Initial greeting
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'welcome-1',
          sender: 'bot',
          text: `Xin chào quý khách! 👋 Mình là THANOX AI Bot, chuyên viên tư vấn 24/7 của ${shopName}. Bạn cần tìm bản hack/mod game, mua Key bản quyền hay cần hướng dẫn nạp tiền ạ?`,
          time: 'Vừa xong',
          options: [
            {
              label: '🤖 Tư vấn bản Android (ADR)',
              action: () => handleSelectDevice('android'),
              isPrimary: true,
            },
            {
              label: '🍏 Tư vấn bản iOS (iPhone / iPad)',
              action: () => handleSelectDevice('ios'),
              isPrimary: true,
            },
            {
              label: '💰 Xem bảng giá hôm nay',
              action: () => handleShowPricing(),
            },
            {
              label: '💳 Hướng dẫn nạp tiền tự động',
              action: () => handleFaqClick(1),
            },
          ],
        },
      ]);
    }
  }, [shopName]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen, activeFaq]);

  const handleSelectDevice = (device: 'android' | 'ios') => {
    setDeviceSelected(device);
    const isAdr = device === 'android';
    const deviceName = isAdr ? 'ANDROID (ADR)' : 'iOS (iPhone / iPad)';

    // Filter relevant products
    const matchingProducts = products.filter((p) => {
      const name = (p.name + ' ' + (p.description || '') + ' ' + p.category).toLowerCase();
      if (isAdr) {
        return name.includes('adr') || name.includes('android') || name.includes('apk') || p.category.toLowerCase().includes('android');
      } else {
        return name.includes('ios') || name.includes('ipa') || name.includes('iphone') || p.category.toLowerCase().includes('ios');
      }
    });

    let botResponseText = '';
    if (isAdr) {
      botResponseText = `🤖 **DÀNH CHO ANDROID (ADR / APK / VIRTUAL):**\n\n` +
        `• Hỗ trợ toàn bộ dòng máy Android từ Android 7 đến Android 15 (Samsung, Xiaomi, Oppo, Realme, Vivo, ROG Phone...).\n` +
        `• Có bản **No Root** (cài qua ứng dụng phụ trợ hoặc apk trực tiếp) và bản **Root / Thanox Module** cực kỳ mượt mà.\n` +
        `• Tích hợp tính năng Aim Lock, ESP định vị, Antenna, Đạn thẳng, Anti-Ban bảo vệ an toàn nick chính.\n\n` +
        `🔥 **CÁC BẢN ANDROID ĐANG CÓ SẴN:**\n` +
        (matchingProducts.length > 0
          ? matchingProducts
              .map(
                (p) =>
                  `▪ **${p.name}**\n   Giá từ: ${p.salePrice ? p.salePrice.toLocaleString('vi-VN') + 'đ' : p.price.toLocaleString('vi-VN') + 'đ'} | Trạng thái: ${p.status === 'active' ? '🟢 Còn hàng' : '🟡 Đang cập nhật'}`
              )
              .join('\n\n')
          : '▪ Thanox ADR VIP V2 (20.000đ - 150.000đ)\n▪ Thanox Mod Menu Auto Headshot');
    } else {
      botResponseText = `🍏 **DÀNH CHO iOS (iPHONE / iPAD):**\n\n` +
        `• Hỗ trợ iOS 14, 15, 16, 17 và cả iOS 18 mới nhất.\n` +
        `• Hướng dẫn cài đặt file **.IPA** ký chứng chỉ trực tiếp không cần máy tính qua TrollStore, ESign, Scarlet, GBox, DNS.\n` +
        `• Menu mod siêu mượt 120 FPS, không giật lag, tự động cập nhật theo bản game mới nhất.\n\n` +
        `🔥 **CÁC BẢN iOS ĐANG CÓ SẴN:**\n` +
        (matchingProducts.length > 0
          ? matchingProducts
              .map(
                (p) =>
                  `▪ **${p.name}**\n   Giá từ: ${p.salePrice ? p.salePrice.toLocaleString('vi-VN') + 'đ' : p.price.toLocaleString('vi-VN') + 'đ'} | Trạng thái: ${p.status === 'active' ? '🟢 Còn hàng' : '🟡 Đang cập nhật'}`
              )
              .join('\n\n')
          : '▪ Thanox iOS IPA VIP (50.000đ - 250.000đ)\n▪ Chứng chỉ iOS Pro 1 năm');
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `Tư vấn cho mình dòng máy ${deviceName}`,
        time: 'Vừa xong',
      },
      {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: botResponseText,
        time: 'Vừa xong',
        options: [
          {
            label: '🛒 Mở Kho Sản Phẩm Để Mua Ngay',
            action: () => {
              setIsOpen(false);
              navigateToStorefront('products');
            },
            isPrimary: true,
          },
          {
            label: '💬 Nhắn Tin Zalo Admin Hỗ Trợ Cài Đặt',
            action: () => {
              window.open(`https://zalo.me/${adminZalo}`, '_blank');
            },
          },
        ],
      },
    ]);
  };

  const handleShowPricing = () => {
    const list = products.slice(0, 6).map((p) => {
      const finalPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
      return `▪ **${p.name}**: ${finalPrice.toLocaleString('vi-VN')}đ ${p.salePrice ? `(Đang Sale từ ${p.price.toLocaleString('vi-VN')}đ)` : ''}`;
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'Bảng giá sản phẩm trong Shop hiện tại như thế nào?',
        time: 'Vừa xong',
      },
      {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: `📊 **BẢNG BÁO GIÁ SẢN PHẨM HÔM NAY TẠI ${shopName}:**\n\n` +
          list.join('\n\n') +
          `\n\n💡 Tất cả đơn hàng đều được cấp Key / Tài khoản tự động ngay sau khi thanh toán!`,
        time: 'Vừa xong',
        options: [
          {
            label: '🛒 Xem Toàn Bộ Sản Phẩm',
            action: () => {
              setIsOpen(false);
              navigateToStorefront('products');
            },
            isPrimary: true,
          },
          {
            label: '💳 Nạp Tiền Vào Ví Ngay',
            action: () => {
              setIsOpen(false);
              navigateToStorefront('account-wallet-deposit');
            },
          },
        ],
      },
    ]);
  };

  const handleFaqClick = (faqIndex: number) => {
    setActiveFaq(activeFaq === faqIndex ? null : faqIndex);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    setInputQuery('');

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: 'Vừa xong',
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // AI Natural Language Matching
    setTimeout(() => {
      const q = userText.toLowerCase();
      let reply = '';
      let options: ChatMessage['options'] = [];

      if (q.includes('adr') || q.includes('android') || q.includes('apk') || q.includes('samsung') || q.includes('xiaomi') || q.includes('oppo')) {
        reply = `Dạ máy Android bạn có thể chọn các bản Thanox ADR APK (No Root hoặc Root). Menu full tính năng kéo tâm, định vị ESP và chống khóa acc cực tốt ạ! Bạn muốn xem gói ngày hay gói tháng?`;
        options = [
          {
            label: '🤖 Xem các bản Android',
            action: () => handleSelectDevice('android'),
            isPrimary: true,
          },
        ];
      } else if (q.includes('ios') || q.includes('iphone') || q.includes('ipad') || q.includes('ipa') || q.includes('scarlet') || q.includes('esign')) {
        reply = `Dạ trên iPhone/iPad, shop cung cấp file .IPA bản quyền kèm hướng dẫn cài đặt qua TrollStore / ESign / Scarlet trong 2 phút là chơi được ngay ạ!`;
        options = [
          {
            label: '🍏 Xem các bản iOS',
            action: () => handleSelectDevice('ios'),
            isPrimary: true,
          },
        ];
      } else if (q.includes('nạp') || q.includes('tiền') || q.includes('chuyển khoản') || q.includes('atm') || q.includes('momo') || q.includes('vietqr')) {
        reply = `Dạ hệ thống hỗ trợ nạp tự động qua **VietQR Ngân Hàng (MBBank)** với hiệu ứng quét laser siêu tốc 5-10s tiền vào ví, và **Nạp thẻ cào tự động** (Viettel, Vina, Mobi, Zing, Garena).`;
        options = [
          {
            label: '💳 Tới Trang Nạp Tiền VietQR',
            action: () => {
              setIsOpen(false);
              navigateToStorefront('account-wallet-deposit');
            },
            isPrimary: true,
          },
        ];
      } else if (q.includes('giá') || q.includes('nhiêu') || q.includes('bao nhiêu') || q.includes('bảng giá')) {
        reply = `Dạ giá các gói key bản quyền tại ${shopName} dao động từ 10.000đ đến 300.000đ tùy theo thời hạn (Ngày, Tuần, Tháng, Vĩnh viễn). Bạn có thể xem bảng giá trực tiếp bên dưới ạ!`;
        options = [
          {
            label: '💰 Xem Chi Tiết Bảng Giá',
            action: () => handleShowPricing(),
            isPrimary: true,
          },
        ];
      } else if (q.includes('acc') || q.includes('tài khoản') || q.includes('ff') || q.includes('free fire')) {
        reply = `Dạ shop có sẵn kho Acc Game VIP (Acc Free Fire, Acc Game chất lượng) đã được lọc sạch, bảo mật 100%. Khi mua xong hệ thống tự động giao ngay Tài Khoản + Mật Khẩu trên màn hình ạ!`;
        options = [
          {
            label: '🔥 Xem Kho Acc Ngay',
            action: () => {
              setIsOpen(false);
              navigateToStorefront('products');
            },
            isPrimary: true,
          },
        ];
      } else if (q.includes('zalo') || q.includes('admin') || q.includes('liên hệ') || q.includes('hỗ trợ') || q.includes('lỗi')) {
        reply = `Dạ nếu bạn cần hỗ trợ cài đặt hoặc giải quyết lỗi khẩn cấp, hãy liên hệ trực tiếp với Admin qua Zalo: **${adminZalo}** hoặc Telegram: **@quangthank** để được xử lý ngay trong 1 phút ạ!`;
        options = [
          {
            label: '💬 Mở Zalo Admin Ngay (0889696810)',
            action: () => window.open(`https://zalo.me/${adminZalo}`, '_blank'),
            isPrimary: true,
          },
        ];
      } else {
        reply = `Dạ mình đã ghi nhận câu hỏi của bạn: "${userText}". Bạn có thể chọn các mục tư vấn nhanh bên dưới hoặc nhắn tin trực tiếp Zalo Admin để được tư vấn tận tình nhất ạ!`;
        options = [
          {
            label: '🤖 Tư vấn máy Android',
            action: () => handleSelectDevice('android'),
          },
          {
            label: '🍏 Tư vấn máy iOS (iPhone)',
            action: () => handleSelectDevice('ios'),
          },
          {
            label: '💬 Chat Zalo Admin',
            action: () => window.open(`https://zalo.me/${adminZalo}`, '_blank'),
            isPrimary: true,
          },
        ];
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: reply,
          time: 'Vừa xong',
          options,
        },
      ]);
    }, 400);
  };

  // AI Bot cố định bên TRÁI màn hình (không kéo thả nữa) — dọn vị trí cũ nếu có
  useEffect(() => {
    try {
      localStorage.removeItem('thanox_ai_bot_pos');
    } catch {}
  }, []);

  const sizeClass = 
    settings.aiBotSize === 'small' ? 'w-9 h-9 sm:w-10 sm:h-10' :
    settings.aiBotSize === 'large' ? 'w-14 h-14 sm:w-16 sm:h-16' : 
    'w-11 h-11 sm:w-12 sm:h-12';

  if (appMode === 'admin') return null;

  return (
    <>
      {/* 1. THANОX AI GLASS ORB (Fixed Bottom-Left with Safe Margin) */}
      <div className="fixed bottom-24 sm:bottom-8 left-3 sm:left-6 z-40 pointer-events-auto select-none">
        {/* Tooltip speech bubble */}
        {!isOpen && !isBubbleDismissed && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
              setIsBubbleDismissed(true);
            }}
            className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 glass-prominent border border-cyan-400/40 text-white text-[11px] font-bold py-1.5 px-3 rounded-2xl shadow-xl backdrop-blur-xl cursor-pointer hover:scale-105 transition-all whitespace-nowrap animate-bounce"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>THANOX AI Tư vấn 24/7</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsBubbleDismissed(true);
              }}
              className="text-[#938EB5] hover:text-white ml-1 p-0.5 rounded-md hover:bg-white/10 cursor-pointer"
              title="Đóng"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute -bottom-1.5 left-4 w-2.5 h-2.5 bg-[#121226] border-b border-r border-cyan-400/40 transform rotate-45" />
          </div>
        )}

        {/* Morphing Thanox AI Glass Orb */}
        <button
          type="button"
          aria-label="Mở trợ lý THANOX AI"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsBubbleDismissed(true);
          }}
          className={`relative group p-1 rounded-full glass-prominent border transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 ${
            isOpen
              ? 'border-red-500/50 shadow-[0_8px_24px_rgba(239,68,68,0.3)]'
              : 'border-cyan-400/40 hover:border-cyan-300 shadow-[0_10px_30px_rgba(6,182,212,0.35)]'
          }`}
        >
          {isOpen ? (
            <div className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center text-white bg-red-500/20 rounded-full">
              <X className="w-5 h-5 text-red-300" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center relative">
                <ThanoxMascot size="sm" isAnimated className="relative z-10" />
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0B17] animate-pulse" />
              </div>
              <span className="hidden md:group-hover:inline-block pr-3 font-bold text-xs text-[#F4F2FF] tracking-wide whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200">
                THANOX AI · Tư vấn
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 2. MAIN AI ASSISTANT CHAT MODAL */}
      {isOpen && (
        <div
          className="fixed bottom-24 sm:bottom-8 left-2 sm:left-6 w-[calc(100vw-16px)] sm:w-[420px] max-h-[76vh] h-[580px] z-50 flex flex-col glass-prominent border border-white/14 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="p-4 glass-elevated border-b border-white/10 flex items-center justify-between shadow-md shrink-0 bg-gradient-to-r from-[#181830]/90 via-[#121226]/90 to-[#0A0A18]/90">
            <div className="flex items-center gap-3">
              <ThanoxMascot size="sm" isAnimated className="shrink-0" />
              <div>
                <h3 className="font-display font-black text-sm sm:text-base text-[#F4F2FF] flex items-center gap-1.5">
                  <span>Trợ lý THANOX AI</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trực tuyến 24/7</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl glass-subtle hover:bg-white/10 text-[#938EB5] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body / Chat Stream & Accordion Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-white/10">
            {/* Cyber Mascot Greeting Box */}
            <div className="p-4 rounded-2xl glass-subtle border border-white/10 text-center space-y-2 shadow-md">
              <div className="w-14 h-14 mx-auto flex items-center justify-center">
                <ThanoxMascot size="md" isAnimated />
              </div>
              <div className="font-bold text-sm text-[#F4F2FF]">
                Xin chào quý khách! 👋
              </div>
              <p className="text-xs text-[#938EB5] leading-relaxed">
                Mình là <strong className="text-cyan-300">THANOX AI</strong>, trợ lý thông minh của {shopName}.
              </p>
              <p className="text-[11px] text-[#5C567A]">
                Bấm chọn câu hỏi nhanh bên dưới hoặc nhập nội dung để mình hỗ trợ ngay nhé:
              </p>
            </div>

            {/* QUICK FAQ ACCORDIONS (Like in reference photo) */}
            <div className="space-y-2">
              {/* FAQ 1: Làm sao để nạp tiền? */}
              <div className="rounded-2xl bg-[#141424] border border-white/5 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => handleFaqClick(1)}
                  className="w-full p-3 flex items-center justify-between text-left font-bold text-xs text-[#F0EDFF] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#7C3AED]/30 text-[#C084FC] font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>Làm sao để nạp tiền?</span>
                  </div>
                  {activeFaq === 1 ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-[#8B84A8]" />}
                </button>
                {activeFaq === 1 && (
                  <div className="p-3.5 pt-0 text-[11.5px] text-[#CBC7E0] space-y-2 border-t border-white/5 mt-1">
                    <p>
                      1. Chọn mục <strong>Nạp Tiền</strong> trên thanh menu hoặc trang tài khoản.<br />
                      2. Chọn <strong>VietQR MBBank</strong> (Quét mã chuyển khoản tự động 5-10s tiền vào ví ngay) hoặc <strong>Nạp thẻ cào tự động</strong>.<br />
                      3. Hệ thống cộng tiền hoàn toàn tự động 24/7!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigateToStorefront('account-wallet-deposit');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Nạp tiền ngay</span>
                    </button>
                  </div>
                )}
              </div>

              {/* FAQ 2: Làm sao để mua tài khoản & Key? */}
              <div className="rounded-2xl bg-[#141424] border border-white/5 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => handleFaqClick(2)}
                  className="w-full p-3 flex items-center justify-between text-left font-bold text-xs text-[#F0EDFF] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#06B6D4]/30 text-[#22D3EE] font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>Làm sao để mua tài khoản & Key?</span>
                  </div>
                  {activeFaq === 2 ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-[#8B84A8]" />}
                </button>
                {activeFaq === 2 && (
                  <div className="p-3.5 pt-0 text-[11.5px] text-[#CBC7E0] space-y-2 border-t border-white/5 mt-1">
                    <p>
                      1. Nạp số dư vào ví tài khoản.<br />
                      2. Vào <strong>Kho Sản Phẩm</strong> → Chọn sản phẩm bạn cần.<br />
                      3. Chọn gói (Ngày, Tuần, Tháng, Vĩnh viễn) → Bấm <strong>Mua Ngay</strong>.<br />
                      4. Mã Key hoặc Tài Khoản + Mật Khẩu sẽ hiển thị ngay lập tức và lưu trong mục <strong>Đơn Hàng</strong> của bạn!
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 3: Tư vấn máy Android hay iOS? */}
              <div className="rounded-2xl bg-[#141424] border border-cyan-500/20 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => handleFaqClick(3)}
                  className="w-full p-3 flex items-center justify-between text-left font-bold text-xs text-cyan-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/30 text-cyan-300 font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>Tư vấn chọn bản Android hay iOS?</span>
                  </div>
                  {activeFaq === 3 ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-[#8B84A8]" />}
                </button>
                {activeFaq === 3 && (
                  <div className="p-3.5 pt-0 text-[11.5px] text-[#CBC7E0] space-y-2.5 border-t border-white/5 mt-1">
                    <p className="font-semibold text-white">Bạn đang sử dụng thiết bị nào?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectDevice('android')}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-[#161626] border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>Máy Android</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectDevice('ios')}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-[#161626] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Apple className="w-4 h-4 text-cyan-400" />
                        <span>iPhone / iPad</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FAQ 4: Liên hệ Admin & Nhóm thông báo? */}
              <div className="rounded-2xl bg-[#141424] border border-white/5 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => handleFaqClick(4)}
                  className="w-full p-3 flex items-center justify-between text-left font-bold text-xs text-[#F0EDFF] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <span>Liên hệ Admin & Nhóm thông báo</span>
                  </div>
                  {activeFaq === 4 ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-[#8B84A8]" />}
                </button>
                {activeFaq === 4 && (
                  <div className="p-3.5 pt-0 text-[11.5px] text-[#CBC7E0] space-y-2 border-t border-white/5 mt-1">
                    <p>
                      • <strong>Zalo Admin:</strong> {adminZalo}<br />
                      • <strong>Telegram Admin:</strong> @quangthank<br />
                      • <strong>Hỗ trợ kỹ thuật:</strong> 24/7 trực tuyến giải đáp mọi thắc mắc
                    </p>
                    <a
                      href={`https://zalo.me/${adminZalo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Nhắn tin Zalo Admin</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* CHAT MESSAGES STREAM */}
            <div className="space-y-3 pt-2">
              {chatMessages.map((msg) => {
                // Parse markdown bold **text** into clean styled elements
                const renderContent = (content: string) => {
                  const parts = content.split(/(\*\*[^*]+\*\*)/g);
                  return parts.map((part, idx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      const inner = part.slice(2, -2);
                      return (
                        <strong key={idx} className="font-bold text-cyan-300">
                          {inner}
                        </strong>
                      );
                    }
                    return <React.Fragment key={idx}>{part}</React.Fragment>;
                  });
                };

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'btn-liquid-primary text-white rounded-tr-none shadow-md shadow-purple-900/30'
                          : 'glass-standard text-[#F4F2FF] border border-white/10 rounded-tl-none shadow-md'
                      }`}
                    >
                      {renderContent(msg.text)}
                    </div>

                    {/* Interactive Option Buttons from Bot */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                        {msg.options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={opt.action}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                              opt.isPrimary
                                ? 'btn-liquid-primary shadow-md hover:scale-105'
                                : 'glass-subtle text-[#938EB5] hover:text-white border border-white/10 hover:border-white/25'
                            }`}
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[9.5px] text-[#5C567A] mt-1 px-1">{msg.time}</span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Footer Interactive Chat Input */}
          <div className="p-3 glass-elevated border-t border-white/10 space-y-2 shrink-0 bg-[#0A0A16]/90 backdrop-blur-md">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Nhập câu hỏi (VD: giá thanox adr, nạp tiền...)..."
                className="flex-1 glass-input rounded-2xl px-3.5 py-2.5 text-xs text-[#F4F2FF] placeholder-[#5C567A] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="p-2.5 rounded-2xl btn-liquid-primary text-white disabled:opacity-40 hover:scale-105 transition-transform cursor-pointer shadow-md shrink-0"
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom Admin Zalo Bar */}
            <div className="flex items-center justify-between text-[11px] text-[#938EB5] pt-1 px-1">
              <span>Bạn cần hỗ trợ thêm?</span>
              <a
                href={`https://zalo.me/${adminZalo}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10.5px] flex items-center gap-1 shadow-md shadow-blue-600/30"
              >
                <span>Zalo Admin</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
