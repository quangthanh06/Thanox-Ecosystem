import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CardNetwork } from '../../types';
import {
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Wallet,
  Building2,
  CreditCard,
  UserCheck,
  Send,
  PhoneCall,
  MessageSquare,
  Lock,
  ArrowRight,
  Smartphone,
  Loader2,
  X,
  ShoppingBag,
} from 'lucide-react';

const PRESET_AMOUNTS = [
  10000,
  20000,
  50000,
  100000,
  200000,
  500000,
  1000000,
];

const CARD_DENOMINATIONS = [
  10000,
  20000,
  30000,
  50000,
  100000,
  200000,
  300000,
  500000,
  1000000,
];

export const StorefrontDepositQR: React.FC = () => {
  const {
    settings,
    currentUser,
    isAuthenticated,
    topups,
    cardRecharges,
    createTopupRequest,
    createCardRecharge,
    showToast,
    navigateToStorefront,
  } = useStore();

  // Channel switcher: VietQR Bank vs Card Recharge
  const [depositChannel, setDepositChannel] = useState<'vietqr' | 'card'>('vietqr');

  // Card Recharge State
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('Viettel');
  const [cardAmount, setCardAmount] = useState<number>(50000);
  const [cardSerial, setCardSerial] = useState<string>('');
  const [cardPin, setCardPin] = useState<string>('');
  const [isSubmittingCard, setIsSubmittingCard] = useState<boolean>(false);

  const minDeposit = settings.minDeposit || 10000;
  const maxDeposit = settings.maxDeposit || 10000000;

  // Selected or typed amount
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmountText, setCustomAmountText] = useState<string>('');
  const [activeAmount, setActiveAmount] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrLoadError, setQrLoadError] = useState<boolean>(false);

  // Dynamic Transaction Code for current valid amount session (STT<random_code>)
  const [transactionCode, setTransactionCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    amount: number;
    code: string;
    balance?: number;
  } | null>(null);

  // Countdown timer (5 minutes)
  useEffect(() => {
    if (transactionCode) setTimeLeft(300);
    else setTimeLeft(null);
  }, [transactionCode]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timerId = setTimeout(() => setTimeLeft((prev) => (prev ? prev - 1 : 0)), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && transactionCode) {
      showToast('Thời gian giao dịch đã hết hạn (5 phút). Vui lòng chọn lại mệnh giá!', 'error');
      setTransactionCode('');
      setActiveAmount(0);
      setSelectedPreset(null);
      setTimeLeft(null);
    }
  }, [timeLeft, transactionCode, showToast]);

  // Generate a fresh unique transaction code (STT + alphanumeric)
  const generateNewTransactionCode = () => {
    const prefix = (settings.transferPrefix || 'STT').trim();
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}${randomPart}`;
  };

  const DEPOSIT_REDIRECT = '/account/wallet/deposit';

  const scrollToQrSection = () => {
    setTimeout(() => {
      const qrEl = document.getElementById('deposit-qr-section');
      if (qrEl) qrEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  // ONE-CLICK PRESET SELECTION: Tự tạo topup + mở QR ngay lập tức
  const handleSelectPreset = (amt: number) => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản trước khi nạp tiền!', 'warning');
      navigateToStorefront('login', DEPOSIT_REDIRECT);
      return;
    }
    setIsTyping(false);
    setSelectedPreset(amt);
    setCustomAmountText(amt.toLocaleString('vi-VN'));
    setActiveAmount(amt);
    setQrLoadError(false);

    // Kiểm tra xem đã có đơn pending tương ứng chưa, nếu chưa thì tạo mới
    const existing = topups.find(
      (t) => t.userId === currentUser.id && t.status === 'pending' && t.amount === amt
    );

    let codeToUse = '';
    if (existing && existing.transferNote) {
      codeToUse = existing.transferNote;
    } else {
      codeToUse = generateNewTransactionCode();
      createTopupRequest(amt, 'Bank Transfer', codeToUse);
    }

    setTransactionCode(codeToUse);
    scrollToQrSection();
  };

  // Custom Amount change
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTyping(true);
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setCustomAmountText('');
      setActiveAmount(0);
      setSelectedPreset(null);
      return;
    }
    const num = parseInt(raw, 10);
    if (isNaN(num)) {
      setCustomAmountText('');
      setActiveAmount(0);
      setSelectedPreset(null);
    } else {
      setCustomAmountText(num.toLocaleString('vi-VN'));
      setActiveAmount(num);
      setSelectedPreset(PRESET_AMOUNTS.includes(num) ? num : null);
    }
  };

  // Custom Amount generate QR button
  const handleGenerateCustomQR = () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản trước khi nạp tiền!', 'warning');
      navigateToStorefront('login', DEPOSIT_REDIRECT);
      return;
    }
    if (!isValidAmount) {
      if (activeAmount < minDeposit) {
        showToast(`Số tiền nạp tối thiểu là ${minDeposit.toLocaleString('vi-VN')}đ`, 'error');
      } else if (activeAmount > maxDeposit) {
        showToast(`Số tiền nạp tối đa là ${maxDeposit.toLocaleString('vi-VN')}đ`, 'error');
      } else {
        showToast('Vui lòng nhập số tiền nạp hợp lệ', 'error');
      }
      return;
    }

    const codeToUse = generateNewTransactionCode();
    createTopupRequest(activeAmount, 'Bank Transfer', codeToUse);
    setTransactionCode(codeToUse);
    scrollToQrSection();
  };

  const isAmountEntered = activeAmount > 0;
  const isBelowMin = isAmountEntered && activeAmount < minDeposit;
  const isAboveMax = isAmountEntered && activeAmount > maxDeposit;
  const isValidAmount = isAmountEntered && !isBelowMin && !isAboveMax;

  // Real-time Bank Reconciliation: Supabase WebSockets (50ms) + Fast Polling (1.5s)
  useEffect(() => {
    if (!transactionCode || !isValidAmount) return;

    let isSubscribed = true;

    const handleSuccess = (amount: number, newBal?: number) => {
      if (!isSubscribed) return;
      setSuccessData({
        amount,
        code: transactionCode,
        balance: newBal ?? (currentUser.balance + amount),
      });
      setShowSuccessModal(true);
      // Bắn sự kiện cập nhật số dư cho toàn bộ giao diện Header
      window.dispatchEvent(new CustomEvent('thanox:balance_updated'));
    };

    // 1. SUPABASE REALTIME WEBSOCKET: Nhận thông báo duyệt tiền ngay lập tức (<50ms)
    const realtimeChannel = supabase
      .channel(`topup-realtime-${transactionCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topups',
        },
        async (payload: any) => {
          if (
            payload?.new &&
            (payload.new.status === 'approved' || payload.new.status === 'paid') &&
            payload.new.transfer_note?.includes(transactionCode)
          ) {
            let updatedBal: number | undefined;
            try {
              const { data: prof } = await supabase.from('profiles').select('balance').eq('id', currentUser.id).maybeSingle();
              if (prof?.balance !== undefined) updatedBal = Number(prof.balance);
            } catch {}
            handleSuccess(Number(payload.new.amount) || activeAmount, updatedBal);
          }
        }
      )
      .subscribe();

    // 2. FAST SCANNER FALLBACK (Quét mỗi 1.5s)
    const checkDepositStatus = async () => {
      try {
        // Quét trực tiếp SePay API
        try {
          const res = await fetch(`/api/topup/check-bank?note=${encodeURIComponent(transactionCode)}`);
          if (res.ok) {
            const data = await res.json();
            if (isSubscribed && (data.matched || data.status === 'approved')) {
              handleSuccess(activeAmount, data.newBalance);
              return true;
            }
          }
        } catch {}

        // Kiểm tra Supabase
        const { data: topupRow } = await supabase
          .from('topups')
          .select('id, status, amount, user_id')
          .ilike('transfer_note', '%' + transactionCode + '%')
          .in('status', ['approved', 'paid'])
          .maybeSingle();

        if (isSubscribed && topupRow && (topupRow.status === 'approved' || topupRow.status === 'paid')) {
          let updatedBal: number | undefined;
          try {
            const { data: prof } = await supabase.from('profiles').select('balance').eq('id', currentUser.id).maybeSingle();
            if (prof?.balance !== undefined) updatedBal = Number(prof.balance);
          } catch {}
          handleSuccess(topupRow.amount || activeAmount, updatedBal);
          return true;
        }
      } catch {}
      return false;
    };

    // Chạy kiểm tra ngay lập tức
    checkDepositStatus();

    // Quét định kỳ mỗi 1 giây siêu tốc
    const interval = setInterval(async () => {
      const isDone = await checkDepositStatus();
      if (isDone) clearInterval(interval);
    }, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      supabase.removeChannel(realtimeChannel);
    };
  }, [transactionCode, isValidAmount, activeAmount, currentUser.id]);

  // 3. BALANCE INCREASE WATCHER: Vừa thấy số dư ví nhảy lên là bật Popup chúc mừng tức thì
  const prevBalanceRef = useRef(currentUser.balance);
  useEffect(() => {
    if (transactionCode && isValidAmount && currentUser.balance > prevBalanceRef.current) {
      const added = currentUser.balance - prevBalanceRef.current;
      setSuccessData({
        amount: activeAmount || added,
        code: transactionCode,
        balance: currentUser.balance,
      });
      setShowSuccessModal(true);
    }
    prevBalanceRef.current = currentUser.balance;
  }, [currentUser.balance, transactionCode, isValidAmount, activeAmount]);

  // Auto-close Success Modal after 15 seconds
  useEffect(() => {
    if (!showSuccessModal) return;
    const timer = setTimeout(() => {
      setShowSuccessModal(false);
      setTransactionCode('');
      setActiveAmount(0);
      setSelectedPreset(null);
    }, 15000);
    return () => clearTimeout(timer);
  }, [showSuccessModal]);

  // Safe extraction helpers
  const safeAccountNumber =
    typeof settings.bankAccount === 'string'
      ? settings.bankAccount
      : (settings.bankAccount as any)?.accountNumber || '0326884292';
  const safeBankName =
    typeof settings.bankName === 'string'
      ? settings.bankName
      : (settings.bankAccount as any)?.bankName || 'MBBank Quân Đội';
  const safeBankCode =
    typeof settings.bankCode === 'string'
      ? settings.bankCode
      : (settings.bankAccount as any)?.bankCode || 'MB';
  const safeAccountHolder =
    typeof settings.accountHolder === 'string'
      ? settings.accountHolder
      : (settings.bankAccount as any)?.accountHolder || 'TRAN QUANG THANH';

  // Multi-tier resilient VietQR URLs
  const [qrFallbackIndex, setQrFallbackIndex] = useState(0);

  const qrUrls = useMemo(() => {
    if (!isValidAmount || !transactionCode) return [];
    const bankCode = safeBankCode || 'MB';
    const bankAccount = safeAccountNumber || '0326884292';
    const accountHolder = safeAccountHolder || 'TRAN QUANG THANH';
    const memo = transactionCode;
    const template = settings.qrTemplate || 'compact2';

    return [
      `https://img.vietqr.io/image/${bankCode}-${bankAccount}-${template}.png?amount=${activeAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountHolder)}`,
      `https://api.vietqr.io/image/${bankCode}-${bankAccount}-${template}.jpg?amount=${activeAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountHolder)}`,
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://img.vietqr.io/image/${bankCode}-${bankAccount}-${template}.png?amount=${activeAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountHolder)}`)}&margin=10`,
      `https://quickchart.io/qr?text=${encodeURIComponent(`https://img.vietqr.io/image/${bankCode}-${bankAccount}-${template}.png?amount=${activeAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountHolder)}`)}&size=300`,
    ];
  }, [isValidAmount, activeAmount, transactionCode, safeBankCode, safeAccountNumber, safeAccountHolder, settings.qrTemplate]);

  const activeQrUrl = qrUrls[qrFallbackIndex] || qrUrls[0];

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Đã sao chép ${fieldName}`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCardRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản trước khi nạp thẻ cào.', 'warning');
      navigateToStorefront('login', DEPOSIT_REDIRECT);
      return;
    }
    if (!cardSerial.trim() || cardSerial.trim().length < 6) {
      showToast('Vui lòng nhập số Serial thẻ hợp lệ (tối thiểu 6 ký tự)', 'error');
      return;
    }
    if (!cardPin.trim() || cardPin.trim().length < 6) {
      showToast('Vui lòng nhập Mã Thẻ (PIN) hợp lệ (tối thiểu 6 ký tự)', 'error');
      return;
    }
    setIsSubmittingCard(true);
    setTimeout(() => {
      createCardRecharge(cardNetwork, cardAmount, cardSerial.trim(), cardPin.trim());
      setCardSerial('');
      setCardPin('');
      setIsSubmittingCard(false);
    }, 500);
  };

  const userTopups = useMemo(() => {
    return topups.filter((t) => t.userId === currentUser.id);
  }, [topups, currentUser.id]);

  const currentNetworkKey = (cardNetwork || 'VIETTEL').toUpperCase();
  const networkConfigs = settings.cardSettings?.networkMatrix?.[currentNetworkKey] || [];
  const matchedConfig = networkConfigs.find((c) => c.amount === cardAmount);

  const cardFeePercent = matchedConfig ? matchedConfig.feePercent : (settings.cardSettings?.feePercentage ?? 15);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* SUCCESS MODAL (Centered, Premium, Dark Theme, Purple Accent) */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#121220] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(124,58,237,0.35)] space-y-5 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setTransactionCode('');
                setActiveAmount(0);
                setSelectedPreset(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-[#8B84A8] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Check Circle Icon with glow */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="success" size="sm" className="px-3 py-1 font-bold">
                GIAO DỊCH HOÀN TẤT
              </Badge>
              <h3 className="font-display font-black text-xl sm:text-2xl text-[#F0EDFF] tracking-tight">
                NẠP TIỀN THÀNH CÔNG!
              </h3>
              <p className="text-xs text-[#8B84A8]">
                Hệ thống đã nhận được thanh toán và cộng tiền vào ví của bạn.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#18182E] border border-white/5 space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-[#8B84A8]">Số tiền nạp:</span>
                <span className="font-display font-extrabold text-base text-emerald-400">
                  +{successData.amount.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8B84A8]">Mã giao dịch:</span>
                <span className="font-mono font-bold text-[#F0EDFF]">{successData.code}</span>
              </div>
              {successData.balance !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[#8B84A8]">Số dư ví hiện tại:</span>
                  <span className="font-display font-extrabold text-sm text-cyan-400">
                    {successData.balance.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2.5">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center font-bold text-sm bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] hover:from-[#6D28D9] hover:to-[#0891B2] shadow-xl shadow-[#7C3AED]/30 gap-2 cursor-pointer py-3.5"
                onClick={() => {
                  setShowSuccessModal(false);
                  setTransactionCode('');
                  setActiveAmount(0);
                  setSelectedPreset(null);
                  navigateToStorefront('products');
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Vào Shop Chọn Sản Phẩm Ngay</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <button
                type="button"
                className="w-full py-2 text-xs font-semibold text-[#8B84A8] hover:text-white transition-colors cursor-pointer"
                onClick={() => {
                  setShowSuccessModal(false);
                  setTransactionCode('');
                  setActiveAmount(0);
                  setSelectedPreset(null);
                }}
              >
                Ở lại trang Nạp Tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-xs text-amber-200">Bạn chưa đăng nhập tài khoản</div>
              <div className="text-[11px] text-amber-300/80">
                Hãy đăng nhập để hệ thống tự động cộng tiền vào ví tài khoản của bạn sau khi chuyển khoản hoặc gửi thẻ cào.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigateToStorefront('login', DEPOSIT_REDIRECT)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5 whitespace-nowrap"
          >
            Đăng Nhập Ngay <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8B84A8] mb-1.5">
            <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">Trang Chủ</button>
            <span>/</span>
            <button onClick={() => navigateToStorefront('account')} className="hover:text-white transition-colors cursor-pointer">Tài Khoản</button>
            <span>/</span>
            <span className="text-[#9D5CF6] font-medium">Nạp tiền</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F0EDFF] tracking-tight">
            Nạp tiền vào tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-[#8B84A8] mt-1 font-medium">
            Hỗ trợ chuyển khoản ngân hàng VietQR tự động 24/7 và gạch thẻ cào điện thoại / game
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 p-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#9D5CF6]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">Số dư ví của bạn</div>
            <div className="font-display text-lg font-bold text-emerald-400">
              {currentUser.balance.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setDepositChannel('vietqr')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${
            depositChannel === 'vietqr'
              ? 'bg-[#7C3AED] text-white border-[#9D5CF6] shadow-lg shadow-[#7C3AED]/30'
              : 'bg-[#161626]/80 text-[#8B84A8] border-white/5 hover:text-white hover:border-white/15'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Chuyển Khoản Ngân Hàng (VietQR)</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-400/20 text-emerald-300 font-bold ml-1">
            Khuyên Dùng
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDepositChannel('card')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${
            depositChannel === 'card'
              ? 'bg-[#7C3AED] text-white border-[#9D5CF6] shadow-lg shadow-[#7C3AED]/30'
              : 'bg-[#161626]/80 text-[#8B84A8] border-white/5 hover:text-white hover:border-white/15'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Nạp Thẻ Cào Điện Thoại / Game</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-400/20 text-amber-300 font-bold ml-1">
            Chiết khấu {cardFeePercent}%
          </span>
        </button>
      </div>

      {depositChannel === 'vietqr' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Preset Denominations & Custom Amount */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] rounded-3xl p-6 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#F0EDFF] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#9D5CF6]" />
                    Chọn mệnh giá nạp (1 Chạm)
                  </h3>
                  <p className="text-xs text-[#8B84A8] mt-1">
                    Bấm chọn số tiền, hệ thống sẽ tự động tạo mã QR chuyển khoản ngay lập tức.
                  </p>
                </div>

                {/* 1-Click Preset Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 pt-1">
                  {PRESET_AMOUNTS.map((amt) => {
                    const active = selectedPreset === amt;
                    const label =
                      amt >= 1000000
                        ? `${amt / 1000000}M`
                        : amt >= 1000
                        ? `${amt / 1000}K`
                        : `${amt}`;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPreset(amt)}
                        className={`py-3 px-2 rounded-2xl text-center font-bold text-xs transition-all cursor-pointer border ${
                          active
                            ? 'bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-white border-cyan-400 shadow-lg shadow-[#7C3AED]/35 scale-[1.03]'
                            : 'bg-[#161626]/90 text-[#CBC7E0] border-white/5 hover:border-white/20 hover:text-white hover:bg-[#1f1f33]'
                        }`}
                      >
                        <span className="text-sm font-extrabold block">{label}</span>
                        <span className="text-[10px] font-normal text-white/70 block mt-0.5">
                          {amt.toLocaleString('vi-VN')}đ
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Field */}
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                    Hoặc nhập số tiền khác
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customAmountText}
                        onChange={handleCustomAmountChange}
                        placeholder={`Tối thiểu ${minDeposit.toLocaleString('vi-VN')}đ`}
                        className="w-full bg-[#161626] border border-white/10 focus:border-[#7C3AED] rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] font-bold outline-none transition-colors"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8B84A8]">
                        VND
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateCustomQR}
                      disabled={!isValidAmount}
                      className="font-bold whitespace-nowrap text-xs border-white/10"
                    >
                      Tạo QR
                    </Button>
                  </div>
                </div>
              </div>

              {/* 24/7 Support */}
              <div className="p-5 rounded-3xl bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-[#F0EDFF]">
                  <MessageSquare className="w-4 h-4 text-[#9D5CF6]" />
                  <span>Hỗ trợ nạp tiền 24/7</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-[#8B84A8]">
                  Nếu giao dịch chưa cộng tiền sau 3-5 phút, vui lòng liên hệ Admin để được hỗ trợ kiểm tra tức thì:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://t.me/quangthank"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#161626]/80 border border-white/5 hover:border-[#06B6D4]/40 flex items-center gap-1.5 text-[11px] text-[#06B6D4] font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="truncate">Telegram: @quangthank</span>
                  </a>
                  <a
                    href="https://zalo.me/0889696810"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#161626]/80 border border-white/5 hover:border-emerald-400/40 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="truncate">Zalo: 0889696810</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code & Transfer Information */}
            <div className="lg:col-span-7 space-y-6">
              <div id="deposit-qr-section" className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-[#F0EDFF] flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-[#9D5CF6]" />
                      Mã QR Thanh Toán
                    </h3>
                    <p className="text-xs text-[#8B84A8] mt-0.5">
                      {transactionCode
                        ? 'Quét mã để tự động điền số tiền và nội dung chuyển khoản chính xác'
                        : 'Vui lòng chọn một mệnh giá nạp bên trái để hiển thị mã QR'}
                    </p>
                  </div>
                  <Badge variant="brand" size="sm" dot>
                    VietQR 24/7
                  </Badge>
                </div>

                {!transactionCode ? (
                  <div className="py-14 px-6 rounded-2xl border border-dashed border-white/10 bg-[#161626]/40 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-[#8B84A8]">
                      <QrCode className="w-8 h-8 opacity-60" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-[#F0EDFF] uppercase tracking-wider">
                        Chưa chọn số tiền nạp
                      </h4>
                      <p className="text-xs text-[#8B84A8] mt-1 max-w-sm mx-auto">
                        Hãy bấm vào một trong các mệnh giá nạp (10K, 20K, 50K...) ở cột bên trái để hệ thống tự tạo mã QR thanh toán.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Live Pending Status Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-amber-300">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
                        <span>Đang chờ nhận chuyển khoản từ ngân hàng...</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-200">
                        Hết hạn: {timeLeft ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : '05:00'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                      {/* QR Visual */}
                      <div className="sm:col-span-6 flex flex-col items-center justify-center p-3 sm:p-5 bg-[#0F0F1A] rounded-2xl border border-white/5">
                        <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-2xl shadow-cyan-500/10 border-2 border-cyan-400/40 w-full max-w-[280px] sm:max-w-[300px] flex items-center justify-center relative overflow-hidden group">
                          {/* 4 Cyber Corner Framing Brackets */}
                          <div className="vietqr-corner-bracket top-2 left-2 border-t-2 border-l-2 rounded-tl-sm" />
                          <div className="vietqr-corner-bracket top-2 right-2 border-t-2 border-r-2 rounded-tr-sm" />
                          <div className="vietqr-corner-bracket bottom-2 left-2 border-b-2 border-l-2 rounded-bl-sm" />
                          <div className="vietqr-corner-bracket bottom-2 right-2 border-b-2 border-r-2 rounded-br-sm" />

                          {/* Laser Scanner Line */}
                          {!qrLoadError && <div className="vietqr-scan-laser-line" />}

                          {qrLoadError ? (
                            <div className="aspect-square w-full flex flex-col items-center justify-center p-4 text-center text-zinc-800">
                              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                              <p className="text-xs font-bold">Không thể tải mã QR</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setQrFallbackIndex(0);
                                  setQrLoadError(false);
                                }}
                                className="mt-3 px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Thử lại
                              </button>
                            </div>
                          ) : (
                            <img
                              src={activeQrUrl}
                              alt={`VietQR ${activeAmount} VND`}
                              onError={() => {
                                if (qrFallbackIndex < qrUrls.length - 1) {
                                  setQrFallbackIndex((prev) => prev + 1);
                                } else {
                                  setQrLoadError(true);
                                }
                              }}
                              className="w-full aspect-square object-contain rounded-lg relative z-10"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                        <div className="mt-3 text-[11px] text-[#CBC7E0] text-center flex items-center justify-center gap-1.5 font-medium">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Mở App Ngân Hàng để Quét Mã
                        </div>
                      </div>

                      {/* Bank Details & Copy Buttons */}
                      <div className="sm:col-span-6 space-y-2.5 text-xs">
                        <div className="p-3 rounded-2xl bg-[#161626]/80 border border-white/5 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#8B84A8]">Ngân hàng nhận</div>
                            <div className="font-bold text-[#F0EDFF] text-xs mt-0.5">
                              {safeBankName} ({safeBankCode})
                            </div>
                          </div>
                          <Building2 className="w-4 h-4 text-[#8B84A8]" />
                        </div>

                        <div className="p-3 rounded-2xl bg-[#161626]/80 border border-white/5 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#8B84A8]">Số tài khoản</div>
                            <div className="font-mono font-bold text-sm text-[#06B6D4] mt-0.5">
                              {safeAccountNumber}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(safeAccountNumber, 'Số tài khoản')}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#CBC7E0] transition-colors cursor-pointer"
                          >
                            {copiedField === 'Số tài khoản' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#161626]/80 border border-white/5 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#8B84A8]">Chủ tài khoản</div>
                            <div className="font-bold text-[#F0EDFF] uppercase text-xs mt-0.5">
                              {safeAccountHolder}
                            </div>
                          </div>
                          <UserCheck className="w-4 h-4 text-[#8B84A8]" />
                        </div>

                        <div className="p-3 rounded-2xl bg-[#161626]/80 border border-white/5 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#8B84A8]">Số tiền</div>
                            <div className="font-display font-bold text-sm text-emerald-400 mt-0.5">
                              {activeAmount.toLocaleString('vi-VN')} VND
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeAmount.toString(), 'Số tiền')}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#CBC7E0] transition-colors cursor-pointer"
                          >
                            {copiedField === 'Số tiền' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#9D5CF6]">
                              Nội dung chuyển khoản (Bắt buộc)
                            </div>
                            <div className="font-mono font-bold text-xs text-amber-300 tracking-wider mt-0.5">
                              {transactionCode}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(transactionCode, 'Nội dung')}
                            className="p-2 rounded-xl bg-[#7C3AED]/30 hover:bg-[#7C3AED]/50 text-[#F0EDFF] transition-colors cursor-pointer"
                          >
                            {copiedField === 'Nội dung' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Automatic Reconciliation Notice */}
                    <div className="p-4 rounded-2xl bg-[#161626]/60 border border-white/5 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Hệ thống tự động cộng tiền sau khi nhận chuyển khoản</span>
                      </div>
                      <p className="text-[11px] text-[#8B84A8]">
                        Bạn chỉ cần mở App ngân hàng quét mã QR hoặc chuyển đúng nội dung ở trên. Tiền sẽ tự động vào ví sau 3-10 giây mà không cần thao tác thêm.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9D5CF6]" />
                <h3 className="font-display font-bold text-sm sm:text-base text-[#F0EDFF]">
                  Lịch sử nạp tiền VietQR
                </h3>
              </div>
              <span className="text-xs text-[#8B84A8]">{userTopups.length} giao dịch</span>
            </div>

            {userTopups.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8B84A8] border border-dashed border-white/5 rounded-2xl bg-[#161626]/30">
                Bạn chưa có yêu cầu nạp tiền nào. Hãy chọn mức nạp bên trên để bắt đầu!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[#8B84A8] text-[11px] uppercase">
                      <th className="pb-3 font-semibold">Mã Yêu Cầu</th>
                      <th className="pb-3 font-semibold">Số Tiền</th>
                      <th className="pb-3 font-semibold">Phương Thức</th>
                      <th className="pb-3 font-semibold">Nội Dung</th>
                      <th className="pb-3 font-semibold">Thời Gian</th>
                      <th className="pb-3 font-semibold text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {userTopups.map((topup) => (
                      <tr key={topup.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-mono font-bold text-[#9D5CF6]">{topup.requestCode}</td>
                        <td className="py-3 font-display font-bold text-emerald-400">
                          +{topup.amount.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3 text-[#CBC7E0]">{topup.method}</td>
                        <td className="py-3 font-mono text-[11px] text-[#8B84A8]">{topup.transferNote}</td>
                        <td className="py-3 text-[#8B84A8]">{topup.createdAt}</td>
                        <td className="py-3 text-right">
                          {topup.status === 'pending' && <Badge variant="warning" size="xs" dot>Đang Chờ</Badge>}
                          {topup.status === 'processing' && <Badge variant="warning" size="xs" dot>Đang Xử Lý</Badge>}
                          {topup.status === 'approved' && <Badge variant="success" size="xs">Đã Cộng Tiền</Badge>}
                          {topup.status === 'rejected' && <Badge variant="danger" size="xs">Từ Chối</Badge>}
                          {topup.status === 'cancelled' && <Badge variant="neutral" size="xs">Đã Hủy</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {depositChannel === 'card' && (
        <div className="space-y-6">
          <form onSubmit={handleCardRechargeSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[rgba(255,255,255,0.05)] backdrop-blur-[26px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 font-bold text-sm text-[#F0EDFF]">
                <CreditCard className="w-4 h-4 text-[#06B6D4]" />
                <span>Nhập Thông Tin Thẻ Cào</span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                  1. Chọn Loại Thẻ / Nhà Mạng
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['Viettel', 'Vinaphone', 'Mobifone', 'Zing', 'Garena', 'Gate'] as CardNetwork[]).map(
                    (net) => {
                      const active = cardNetwork === net;
                      return (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setCardNetwork(net)}
                          className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                            active
                              ? 'bg-[#06B6D4] text-white border-cyan-300 shadow-md shadow-[#06B6D4]/30'
                              : 'bg-[#161626] text-[#8B84A8] border-white/5 hover:text-white hover:border-white/15'
                          }`}
                        >
                          {net}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                  2. Chọn Mệnh Giá Thẻ
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {CARD_DENOMINATIONS.map((amt) => {
                    const active = cardAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCardAmount(amt)}
                        className={`py-2.5 px-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                          active
                            ? 'bg-[#7C3AED] text-white border-[#9D5CF6] shadow-md shadow-[#7C3AED]/30'
                            : 'bg-[#161626] text-[#8B84A8] border-white/5 hover:text-white hover:border-white/15'
                        }`}
                      >
                        {amt.toLocaleString('vi-VN')}đ
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    3. Số Serial Thẻ
                  </label>
                  <input
                    type="text"
                    required
                    value={cardSerial}
                    onChange={(e) => setCardSerial(e.target.value)}
                    placeholder="Nhập mã serial in trên thẻ..."
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] font-mono outline-none focus:border-[#06B6D4]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    4. Mã Thẻ (PIN / Sau lớp cào)
                  </label>
                  <input
                    type="text"
                    required
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value)}
                    placeholder="Nhập mã cào PIN..."
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] font-mono outline-none focus:border-[#06B6D4]"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center font-bold mt-2"
                  isLoading={isSubmittingCard}
                >
                  Gửi Thẻ & Nạp Tiền
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
