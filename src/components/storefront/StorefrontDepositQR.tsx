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

const DEPOSIT_REDIRECT = '/account/wallet/deposit';

export const StorefrontDepositQR: React.FC = () => {
  const {
    settings,
    currentUser,
    isAuthenticated,
    topups,
    cardRecharges,
    createTopupRequest,
    createCardRecharge,
    createBulkCardRecharge,
    showToast,
    navigateToStorefront,
  } = useStore();

  // Channel switcher: VietQR Bank vs Card Recharge
  const [depositChannel, setDepositChannel] = useState<'vietqr' | 'card'>('vietqr');

  // Card Recharge State
  const [cardMode, setCardMode] = useState<'single' | 'bulk'>('single');
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('Viettel');
  const [cardAmount, setCardAmount] = useState<number>(50000);
  const [cardSerial, setCardSerial] = useState<string>('');
  const [cardPin, setCardPin] = useState<string>('');
  const [isSubmittingCard, setIsSubmittingCard] = useState<boolean>(false);

  // Bulk Cards State
  const [bulkCardsText, setBulkCardsText] = useState<string>('');
  const [bulkDefaultNetwork, setBulkDefaultNetwork] = useState<CardNetwork>('Viettel');

  const minDeposit = settings.minDeposit || 10000;
  const maxDeposit = settings.maxDeposit || 10000000;

  // Selected or typed amount - Initially empty, only generated when user clicks or types
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmountText, setCustomAmountText] = useState<string>('');
  const [activeAmount, setActiveAmount] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrLoadError, setQrLoadError] = useState<boolean>(false);

  // Dynamic Transaction Code generator
  const generateNewTransactionCode = () => {
    const prefix = (settings.transferPrefix || 'NAP').toUpperCase().trim();
    const cleanUser = ((currentUser && (currentUser.username || currentUser.name)) || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix} ${cleanUser} ${randomSuffix}`.trim();
  };

  const scrollToQrSection = () => {
    const el = document.getElementById('deposit-qr-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Dynamic Transaction Code for current valid amount session (STT<random_code>)
  const [transactionCode, setTransactionCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isManualChecking, setIsManualChecking] = useState<boolean>(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    amount: number;
    code: string;
    balance?: number;
  } | null>(null);

  // Check if a QR session is currently active and pending
  const isSessionActive = Boolean(transactionCode && timeLeft !== null && timeLeft > 0 && activeAmount > 0);

  // Sync to serverless topup handler without writing pending to public history
  useEffect(() => {
    if (isAuthenticated && transactionCode && activeAmount > 0) {
      syncTopupToServer(activeAmount, transactionCode);
    }
  }, [isAuthenticated]);

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

  // Server Topup Synchronizer
  const syncTopupToServer = async (amt: number, code: string) => {
    try {
      const res = await fetch('/api/topup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name || currentUser.username,
          amount: amt,
          transferNote: code,
          method: 'VietQR',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isInstantCredited || data.status === 'approved') {
          setSuccessData({
            amount: amt,
            code,
            balance: data.newBalance ?? (currentUser.balance + amt),
          });
          setShowSuccessModal(true);
          window.dispatchEvent(new CustomEvent('thanox:balance_updated'));
        }
      }
    } catch (err) {
      console.warn('[Deposit] Server topup sync error:', err);
    }
  };

  const triggerManualCheck = async () => {
    if (!transactionCode) return;
    setIsManualChecking(true);
    try {
      const res = await fetch(`/api/topup/check-bank?note=${encodeURIComponent(transactionCode)}&userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.matched || data.status === 'approved') {
          setSuccessData({
            amount: Number(data.amount) || activeAmount,
            code: transactionCode,
            balance: data.newBalance ?? (currentUser.balance + activeAmount),
          });
          setShowSuccessModal(true);
          window.dispatchEvent(new CustomEvent('thanox:balance_updated'));
          setIsManualChecking(false);
          return;
        }
      }
      showToast('Đang kết nối SePay & Ngân hàng kiểm tra... Tiền sẽ vào ví sau vài giây!', 'info');
    } catch {
      showToast('Đang kết nối SePay & Ngân hàng kiểm tra...', 'info');
    } finally {
      setIsManualChecking(false);
    }
  };

  // ONE-CLICK PRESET SELECTION WITH ANTI-SPAM LOCK
  const handleSelectPreset = (amt: number) => {
    // ANTI-SPAM: If an active QR session is running with a different amount, block and notify
    if (isSessionActive && amt !== activeAmount) {
      showToast(
        'Mã QR hiện tại đang chờ thanh toán! Bấm "Đổi Mệnh Giá" nếu bạn muốn chuyển sang số tiền khác.',
        'warning'
      );
      return;
    }

    setIsTyping(false);
    setSelectedPreset(amt);
    setCustomAmountText(amt.toLocaleString('vi-VN'));
    setActiveAmount(amt);
    setQrLoadError(false);

    let codeToUse = transactionCode;
    if (!codeToUse || !timeLeft || timeLeft <= 0) {
      codeToUse = generateNewTransactionCode();
      setTransactionCode(codeToUse);
      setTimeLeft(300);
    }

    if (isAuthenticated) {
      syncTopupToServer(amt, codeToUse);
    }
    scrollToQrSection();
  };

  // Explicitly unlock to choose another denomination
  const handleUnlockToChangeAmount = () => {
    setTransactionCode('');
    setTimeLeft(null);
    setSelectedPreset(null);
    setActiveAmount(0);
    setCustomAmountText('');
    showToast('Đã hủy mã cũ. Vui lòng bấm chọn mệnh giá mới bạn muốn nạp!', 'info');
  };

  // Reset current session to generate a fresh transaction code for same amount
  const handleResetSession = () => {
    const freshCode = generateNewTransactionCode();
    setTransactionCode(freshCode);
    setTimeLeft(300);
    if (isAuthenticated && activeAmount > 0) {
      syncTopupToServer(activeAmount, freshCode);
    }
    showToast('Đã tạo mới mã giao dịch VietQR!', 'info');
  };

  // Custom Amount change with Anti-Spam protection
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSessionActive) {
      showToast(
        'Mã QR hiện tại đang chờ thanh toán. Vui lòng bấm "Đổi Mệnh Giá" để nhập số tiền khác!',
        'warning'
      );
      return;
    }

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

      if (num >= minDeposit && num <= maxDeposit) {
        let codeToUse = transactionCode;
        if (!codeToUse || !timeLeft || timeLeft <= 0) {
          codeToUse = generateNewTransactionCode();
          setTransactionCode(codeToUse);
          setTimeLeft(300);
        }
        if (isAuthenticated) {
          syncTopupToServer(num, codeToUse);
        }
      }
    }
  };

  // Custom Amount generate QR button
  const handleGenerateCustomQR = () => {
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

    let codeToUse = transactionCode;
    if (!codeToUse || !timeLeft || timeLeft <= 0) {
      codeToUse = generateNewTransactionCode();
      setTransactionCode(codeToUse);
      setTimeLeft(300);
    }

    if (isAuthenticated) {
      syncTopupToServer(activeAmount, codeToUse);
    }
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

    // 2. POLLING SIÊU TỐC 1.5 GIÂY (Quét đồng bộ SePay + Bank Transactions + DB)
    const checkDepositStatus = async (isManual = false) => {
      try {
        if (isManual) setIsManualChecking(true);

        // 2.1. Quét API Serverless check-bank với Service Role (Tự động cộng tiền nếu SePay đã nhận)
        try {
          const res = await fetch(`/api/topup/check-bank?note=${encodeURIComponent(transactionCode)}&userId=${encodeURIComponent(currentUser.id)}`);
          if (res.ok) {
            const data = await res.json();
            if (isSubscribed && (data.matched || data.status === 'approved')) {
              handleSuccess(Number(data.amount) || activeAmount, data.newBalance);
              if (isManual) setIsManualChecking(false);
              return true;
            }
          }
        } catch {}

        // 2.2. Kiểm tra Supabase DB trực tiếp
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
          handleSuccess(Number(topupRow.amount) || activeAmount, updatedBal);
          if (isManual) setIsManualChecking(false);
          return true;
        }

        if (isManual) {
          setIsManualChecking(false);
          showToast('Đang kết nối SePay & Ngân hàng kiểm tra... Tiền sẽ vào ví sau vài giây!', 'info');
        }
      } catch {
        if (isManual) setIsManualChecking(false);
      }
      return false;
    };

    // Chạy kiểm tra ban đầu ngay lập tức
    checkDepositStatus();

    // Quét định kỳ mỗi 1.5 giây siêu tốc
    const interval = setInterval(async () => {
      const isDone = await checkDepositStatus();
      if (isDone) clearInterval(interval);
    }, 1500);

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

  // Parse bulk card entries
  const parsedBulkCards = useMemo(() => {
    if (!bulkCardsText.trim()) return [];
    const lines = bulkCardsText.split('\n');
    const results: Array<{
      network: CardNetwork;
      declaredAmount: number;
      serial: string;
      pin: string;
      isValid: boolean;
      error?: string;
    }> = [];

    const supportedNetworks: Record<string, CardNetwork> = {
      viettel: 'Viettel',
      vina: 'Vinaphone',
      vinaphone: 'Vinaphone',
      mobi: 'Mobifone',
      mobifone: 'Mobifone',
      zing: 'Zing',
      garena: 'Garena',
      gate: 'Gate',
    };

    lines.forEach((line) => {
      const clean = line.trim();
      if (!clean) return;

      const parts = clean.split(/[|,/ \t]+/).filter(Boolean);
      if (parts.length < 2) {
        results.push({
          network: bulkDefaultNetwork,
          declaredAmount: 50000,
          serial: clean,
          pin: '',
          isValid: false,
          error: 'Thiếu mã PIN hoặc Mệnh giá',
        });
        return;
      }

      let net: CardNetwork = bulkDefaultNetwork;
      let pin = '';
      let serial = '';
      let amt = 50000;

      const firstLower = parts[0].toLowerCase();
      let startIndex = 0;
      if (supportedNetworks[firstLower]) {
        net = supportedNetworks[firstLower];
        startIndex = 1;
      }

      const remaining = parts.slice(startIndex);
      if (remaining.length >= 3) {
        pin = remaining[0];
        serial = remaining[1];
        const numAmt = parseInt(remaining[2].replace(/\D/g, ''), 10);
        if (!isNaN(numAmt) && numAmt >= 10000) amt = numAmt;
      } else if (remaining.length === 2) {
        pin = remaining[0];
        serial = remaining[1];
      }

      const isValid = pin.length >= 6 && serial.length >= 6;
      results.push({
        network: net,
        declaredAmount: amt,
        serial,
        pin,
        isValid,
        error: !isValid ? 'PIN/Serial quá ngắn (< 6 ký tự)' : undefined,
      });
    });

    return results;
  }, [bulkCardsText, bulkDefaultNetwork]);

  const validBulkCards = useMemo(() => parsedBulkCards.filter((c) => c.isValid), [parsedBulkCards]);
  const totalBulkFaceValue = useMemo(() => validBulkCards.reduce((s, c) => s + c.declaredAmount, 0), [validBulkCards]);
  const totalBulkReceivedValue = useMemo(() => {
    const discount = (settings.cardDiscountRate ?? 20) / 100;
    return Math.round(totalBulkFaceValue * (1 - discount));
  }, [totalBulkFaceValue, settings.cardDiscountRate]);

  const handleBulkCardRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản trước khi nạp thẻ cào.', 'warning');
      navigateToStorefront('login', DEPOSIT_REDIRECT);
      return;
    }

    if (validBulkCards.length === 0) {
      showToast('Vui lòng nhập ít nhất 1 thẻ cào hợp lệ!', 'error');
      return;
    }

    setIsSubmittingCard(true);
    setTimeout(() => {
      createBulkCardRecharge(validBulkCards);
      setBulkCardsText('');
      setIsSubmittingCard(false);
    }, 600);
  };

  const userTopups = useMemo(() => {
    return topups.filter(
      (t) => t.userId === currentUser.id && t.status === 'approved'
    );
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

        <div className="flex items-center gap-3 glass-subtle border border-white/8 p-3.5 rounded-2xl shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#C084FC]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#938EB5] uppercase tracking-wider">Số dư ví của bạn</div>
            <div className="font-display text-lg font-black text-emerald-300">
              {currentUser.balance.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 border-b border-white/8 pb-4">
        <button
          type="button"
          onClick={() => setDepositChannel('vietqr')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer border active:scale-95 min-h-[44px] ${
            depositChannel === 'vietqr'
              ? 'btn-liquid-primary shadow-md'
              : 'glass-subtle text-[#938EB5] border-white/8 hover:text-white hover:bg-white/5'
          }`}
        >
          <QrCode className="w-4 h-4 shrink-0 text-[#22D3EE]" />
          <span className="sm:hidden">VietQR / Bank</span>
          <span className="hidden sm:inline">Chuyển Khoản VietQR</span>
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] bg-emerald-400/20 text-emerald-300 font-bold ml-1">
            Tự Động 24/7
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDepositChannel('card')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer border active:scale-95 min-h-[44px] ${
            depositChannel === 'card'
              ? 'btn-liquid-primary shadow-md'
              : 'glass-subtle text-[#938EB5] border-white/8 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-4 h-4 shrink-0 text-amber-300" />
          <span>Nạp Thẻ Cào</span>
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-bold ml-1">
            Phí {cardFeePercent}%
          </span>
        </button>
      </div>

      {depositChannel === 'vietqr' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Preset Denominations & Custom Amount */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-standard border border-white/10 shadow-xl rounded-3xl p-6 space-y-4">
                <div>
                  <h3 className="font-display font-black text-sm sm:text-base text-[#F4F2FF] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C084FC]" />
                    Chọn mệnh giá nạp (1 Chạm)
                  </h3>
                  <p className="text-xs text-[#938EB5] mt-1">
                    Bấm chọn số tiền, hệ thống sẽ tự động tạo mã QR chuyển khoản ngay lập tức.
                  </p>
                </div>

                {/* 1-Click Preset Buttons with Anti-Spam Lock Indicator */}
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 pt-1">
                  {PRESET_AMOUNTS.map((amt) => {
                    const active = selectedPreset === amt;
                    const isLockedOther = isSessionActive && !active;
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
                        className={`py-3 px-2 rounded-2xl text-center font-bold text-xs transition-all border ${
                          active
                            ? 'btn-liquid-primary border-cyan-400/50 shadow-lg shadow-[#7C3AED]/35 scale-[1.03]'
                            : isLockedOther
                            ? 'glass-subtle text-[#E2DEFA]/40 border-white/5 opacity-50 hover:opacity-80 hover:border-amber-400/30 cursor-not-allowed'
                            : 'glass-subtle text-[#E2DEFA] border-white/8 hover:border-white/20 hover:text-white hover:bg-white/10 cursor-pointer active:scale-95'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-black">{label}</span>
                          {isLockedOther && <Lock className="w-2.5 h-2.5 text-amber-400/60" />}
                        </div>
                        <span className="text-[10px] font-normal text-white/70 block mt-0.5">
                          {amt.toLocaleString('vi-VN')}đ
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Field - Instant Auto QR with Anti-Spam Lock */}
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                      Hoặc nhập số tiền tùy chọn
                    </label>
                    <span className="text-[10.5px] text-emerald-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Tự động tạo QR ngay khi gõ</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customAmountText}
                      onChange={handleCustomAmountChange}
                      disabled={isSessionActive}
                      placeholder={`Tối thiểu ${minDeposit.toLocaleString('vi-VN')}đ`}
                      className={`w-full glass-input rounded-2xl pl-4 pr-12 py-3 text-xs text-[#F4F2FF] font-bold border-white/15 focus:border-[#7C3AED] ${
                        isSessionActive ? 'opacity-60 cursor-not-allowed bg-black/40' : ''
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#C084FC]">
                      VND
                    </span>
                  </div>
                  {isSessionActive && (
                    <div className="flex items-center justify-between text-[11px] text-amber-300/90 pt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Đang có mã QR {activeAmount.toLocaleString('vi-VN')}đ chờ nạp</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleUnlockToChangeAmount}
                        className="underline font-bold text-amber-300 hover:text-white cursor-pointer"
                      >
                        Đổi Mệnh Giá Khác
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 24/7 Support */}
              <div className="p-5 rounded-3xl glass-subtle border border-white/8 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-[#F4F2FF]">
                  <MessageSquare className="w-4 h-4 text-[#C084FC]" />
                  <span>Hỗ trợ nạp tiền 24/7</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-[#938EB5]">
                  Nếu giao dịch chưa cộng tiền sau 3-5 phút, vui lòng liên hệ Admin để được hỗ trợ kiểm tra tức thì:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://t.me/quangthank"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl glass-subtle border border-white/6 hover:border-[#06B6D4]/40 flex items-center gap-1.5 text-[11px] text-[#22D3EE] font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="truncate">Telegram: @quangthank</span>
                  </a>
                  <a
                    href="https://zalo.me/0889696810"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl glass-subtle border border-white/6 hover:border-emerald-400/40 flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="truncate">Zalo: 0889696810</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code & Transfer Information */}
            <div className="lg:col-span-7 space-y-6">
              <div id="deposit-qr-section" className="glass-standard border border-white/10 shadow-xl rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-white/6 pb-4">
                  <div>
                    <h3 className="font-display font-black text-base sm:text-lg text-[#F4F2FF] flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-[#C084FC]" />
                      Mã QR Thanh Toán
                    </h3>
                    <p className="text-xs text-[#938EB5] mt-0.5">
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
                  <div className="py-14 px-6 rounded-3xl border border-dashed border-white/10 glass-subtle text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl glass-standard border border-white/10 mx-auto flex items-center justify-center text-[#938EB5] shadow-sm">
                      <QrCode className="w-8 h-8 opacity-60" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-sm text-[#F4F2FF] uppercase tracking-wider">
                        Chưa chọn số tiền nạp
                      </h4>
                      <p className="text-xs text-[#938EB5] mt-1 max-w-sm mx-auto">
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
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[11px] font-mono font-bold text-amber-200">
                          Hết hạn: {timeLeft ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : '05:00'}
                        </span>
                        <button
                          type="button"
                          onClick={handleUnlockToChangeAmount}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10.5px] font-bold border border-amber-500/40 transition-colors cursor-pointer"
                          title="Hủy mã này để chọn số tiền khác"
                        >
                          Đổi Mệnh Giá
                        </button>
                        <button
                          type="button"
                          onClick={handleResetSession}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10.5px] font-bold border border-white/20 transition-colors cursor-pointer"
                          title="Làm mới mã giao dịch cho cùng số tiền"
                        >
                          Đổi Mã Mới
                        </button>
                      </div>
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
                    <div className="p-4 rounded-2xl bg-[#161626]/60 border border-white/5 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Hệ thống tự động cộng tiền sau khi nhận chuyển khoản (1-3s)</span>
                      </div>
                      <p className="text-[11px] text-[#8B84A8]">
                        Bạn chỉ cần mở App ngân hàng quét mã QR hoặc chuyển đúng nội dung ở trên. Tiền sẽ tự động vào ví sau vài giây mà không cần thao tác thêm.
                      </p>

                      <button
                        type="button"
                        onClick={triggerManualCheck}
                        disabled={isManualChecking}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl btn-liquid-primary text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer mx-auto mt-1"
                      >
                        {isManualChecking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        <span>{isManualChecking ? 'Đang kiểm tra SePay...' : '⚡ Đã Chuyển Khoản? Kiểm Tra Ngay'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="glass-standard border border-white/10 shadow-xl rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C084FC]" />
                <h3 className="font-display font-black text-sm sm:text-base text-[#F4F2FF]">
                  Lịch sử nạp tiền VietQR
                </h3>
              </div>
              <span className="text-xs text-[#938EB5]">{userTopups.length} giao dịch</span>
            </div>

            {userTopups.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#938EB5] border border-dashed border-white/8 rounded-2xl glass-subtle">
                Bạn chưa có yêu cầu nạp tiền nào. Hãy chọn mức nạp bên trên để bắt đầu!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/6 text-[#938EB5] text-[11px] uppercase">
                      <th className="pb-3 font-semibold">Mã Yêu Cầu</th>
                      <th className="pb-3 font-semibold">Số Tiền</th>
                      <th className="pb-3 font-semibold">Phương Thức</th>
                      <th className="pb-3 font-semibold">Nội Dung</th>
                      <th className="pb-3 font-semibold">Thời Gian</th>
                      <th className="pb-3 font-semibold text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {userTopups.map((topup) => (
                      <tr key={topup.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-mono font-bold text-[#C084FC]">{topup.requestCode}</td>
                        <td className="py-3 font-display font-bold text-emerald-300">
                          +{topup.amount.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3 text-[#E2DEFA]">{topup.method}</td>
                        <td className="py-3 font-mono text-[11px] text-[#938EB5]">{topup.transferNote}</td>
                        <td className="py-3 text-[#938EB5]">{topup.createdAt}</td>
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
          {/* Card Recharge Mode Toggle */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-standard border border-white/10 max-w-md">
            <button
              type="button"
              onClick={() => setCardMode('single')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                cardMode === 'single'
                  ? 'btn-liquid-primary shadow-md'
                  : 'text-[#938EB5] hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Nạp Từng Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setCardMode('bulk')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                cardMode === 'bulk'
                  ? 'bg-[#06B6D4] text-white border border-cyan-300 shadow-md shadow-[#06B6D4]/30'
                  : 'text-[#938EB5] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ Nạp Hàng Loạt (Nhiều Thẻ)</span>
            </button>
          </div>

          {/* SINGLE CARD RECHARGE FORM */}
          {cardMode === 'single' ? (
            <form onSubmit={handleCardRechargeSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 glass-standard border border-white/10 shadow-xl rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2 border-b border-white/6 pb-3 font-bold text-sm text-[#F4F2FF]">
                  <CreditCard className="w-4 h-4 text-[#22D3EE]" />
                  <span>Nhập Thông Tin 1 Thẻ Cào</span>
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

              {/* Card Calculation Summary */}
              <div className="lg:col-span-5 space-y-4">
                <div className="glass-standard border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="font-bold text-xs text-[#F4F2FF] uppercase tracking-wider">Tóm Tắt Nạp Thẻ</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#938EB5]">Loại thẻ:</span>
                      <span className="font-bold text-[#C084FC]">{cardNetwork}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#938EB5]">Mệnh giá:</span>
                      <span className="font-bold text-white">{cardAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#938EB5]">Chiết khấu:</span>
                      <span className="font-bold text-amber-400">{cardFeePercent}%</span>
                    </div>
                    <div className="pt-2 border-t border-white/6 flex justify-between items-baseline">
                      <span className="text-[#938EB5] font-semibold">Thực nhận vào ví:</span>
                      <span className="font-display font-black text-lg text-emerald-400">
                        {Math.round(cardAmount * (1 - cardFeePercent / 100)).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* BULK CARD RECHARGE FORM */
            <form onSubmit={handleBulkCardRechargeSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 glass-standard border border-white/10 shadow-xl rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-white/6 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#F4F2FF]">
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Nạp Hàng Loạt Nhiều Thẻ Cào</span>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-300">
                    {validBulkCards.length} thẻ hợp lệ
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                    Nhà Mạng Mặc Định (Nếu dòng không ghi tên mạng)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['Viettel', 'Vinaphone', 'Mobifone', 'Zing', 'Garena', 'Gate'] as CardNetwork[]).map(
                      (net) => {
                        const active = bulkDefaultNetwork === net;
                        return (
                          <button
                            key={net}
                            type="button"
                            onClick={() => setBulkDefaultNetwork(net)}
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
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                      Danh Sách Thẻ Cào (Mỗi dòng 1 thẻ)
                    </label>
                    <span className="text-[10px] text-[#938EB5]">Cú pháp: Mã_PIN | Serial | Mệnh_Giá</span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={bulkCardsText}
                    onChange={(e) => setBulkCardsText(e.target.value)}
                    placeholder={`Ví dụ nhập mỗi dòng 1 thẻ:\n100029384918 | 100038472918 | 50000\n882910394821 | 992810482910 | 100000\nViettel 773829103847 662810482910 200000`}
                    className="w-full bg-[#161626] border border-white/10 rounded-2xl p-4 text-xs font-mono text-[#F0EDFF] outline-none focus:border-cyan-400 leading-relaxed resize-y"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center font-bold"
                  isLoading={isSubmittingCard}
                  disabled={validBulkCards.length === 0}
                >
                  ⚡ Gửi {validBulkCards.length} Thẻ Cào Lên Hệ Thống
                </Button>
              </div>

              {/* Bulk Calculation & Live Parser Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="glass-standard border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="font-bold text-xs text-[#F4F2FF] uppercase tracking-wider">Tổng Kết Nạp Hàng Loạt</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#938EB5]">Số lượng thẻ hợp lệ:</span>
                      <span className="font-bold text-[#C084FC]">{validBulkCards.length} thẻ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#938EB5]">Tổng mệnh giá gửi:</span>
                      <span className="font-bold text-white">{totalBulkFaceValue.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="pt-2 border-t border-white/6 flex justify-between items-baseline">
                      <span className="text-[#938EB5] font-semibold">Ước tính thực nhận:</span>
                      <span className="font-display font-black text-lg text-emerald-400">
                        {totalBulkReceivedValue.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Parsed Cards Table */}
                {parsedBulkCards.length > 0 && (
                  <div className="glass-subtle border border-white/8 rounded-2xl p-4 space-y-2 max-h-[300px] overflow-y-auto">
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Xem Trước Danh Sách ({parsedBulkCards.length} dòng)
                    </div>
                    <div className="space-y-1.5">
                      {parsedBulkCards.map((c, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
                            c.isValid
                              ? 'bg-white/5 border-white/8 text-white'
                              : 'bg-red-500/10 border-red-500/30 text-red-300'
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-bold text-[#C084FC] mr-1.5">[{c.network}]</span>
                            <span>{c.pin}</span>
                            <span className="text-zinc-500 mx-1">|</span>
                            <span>{c.serial}</span>
                          </div>
                          <span className="font-bold text-emerald-400 shrink-0 ml-2">
                            {c.declaredAmount.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
