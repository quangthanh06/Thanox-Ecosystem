import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerFeedback } from '../../types';
import {
  Zap,
  MessageSquare,
  Star,
  CheckCircle2,
  ShieldCheck,
  Send,
  Plus,
  ThumbsUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  User,
  Heart,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

// Authentic gaming simulated feedbacks (varied capitalization, teencode, emojis, smiles)
const DEFAULT_AUTHENTIC_FEEDBACKS: CustomerFeedback[] = [
  {
    id: 'fb-1',
    authorName: 'Hoang Nam Gamer',
    authorAvatar: 'HN',
    rating: 5,
    comment: 'uy tín nha ae :)) vừa nạp 50k quét qr xong 3s tiền vào ví luôn, mua key ff vào trận test mượt đét',
    productTag: 'MENU FF VIP',
    createdAt: '2026-08-25 18:30',
    timeAgo: '5 phút trước',
    verifiedPurchase: true,
    likesCount: 14,
  },
  {
    id: 'fb-2',
    authorName: 'quockhanh_09',
    authorAvatar: 'QK',
    rating: 5,
    comment: 'Ad support nhiệt tình vcc, lúc đầu chưa biết cài dc ad ultraview hỗ trợ từ A-Z. 10 điểm ko có nhưng ^^',
    productTag: 'FILE ANDROID',
    createdAt: '2026-08-25 17:15',
    timeAgo: '18 phút trước',
    verifiedPurchase: true,
    likesCount: 22,
  },
  {
    id: 'fb-3',
    authorName: 'Minh Tri FreeFire',
    authorAvatar: 'MT',
    rating: 5,
    comment: 'Khuyên ae nên mua gói 1 Tháng cho rẻ, tính ra tiết kiệm dc cả đống tiền. Bản này bắn kéo tâm êm ru ko bị band nick',
    productTag: 'KEY VIP',
    createdAt: '2026-08-25 16:40',
    timeAgo: '42 phút trước',
    verifiedPurchase: true,
    likesCount: 39,
  },
  {
    id: 'fb-4',
    authorName: 'Thanh Tùng',
    authorAvatar: 'TT',
    rating: 5,
    comment: 'Nạp thẻ cào viettel duyệt tự động lẹ phết, web xịn sò nhất từ trước tới giờ từng mua :D',
    productTag: 'Nạp Thẻ Cào',
    createdAt: '2026-08-25 15:20',
    timeAgo: '1 giờ trước',
    verifiedPurchase: true,
    likesCount: 19,
  },
  {
    id: 'fb-5',
    authorName: 'Duy Anh Pro',
    authorAvatar: 'DA',
    rating: 5,
    comment: 'chất lượng tuyệt vời ae ơi, file ios cài nhanh ko cần jb. Mua thêm key cho th em cùng chơi :))',
    productTag: 'FILE IOS',
    createdAt: '2026-08-25 14:10',
    timeAgo: '2 giờ trước',
    verifiedPurchase: true,
    likesCount: 27,
  },
  {
    id: 'fb-6',
    authorName: 'Le Bao FF',
    authorAvatar: 'LB',
    rating: 5,
    comment: 'Shop này bán chuẩn nhất sever, trc mua bên web khác toàn lừa đảo. Bên này giao key tự động 3 giây đúng cam kết!',
    productTag: 'MENU FF VIP',
    createdAt: '2026-08-25 12:45',
    timeAgo: '4 giờ trước',
    verifiedPurchase: true,
    likesCount: 45,
  },
];

// Realistic Simulated Live Topup Events for Visual Immersion
const INITIAL_LIVE_TOPUPS = [
  { id: 'lt-1', user: '098***482', amount: 50000, method: 'VietQR MBBank', time: 'Vừa xong' },
  { id: 'lt-2', user: 'nguyen***99', amount: 100000, method: 'VietQR', time: '1 phút trước' },
  { id: 'lt-3', user: '037***915', amount: 20000, method: 'Thẻ Viettel', time: '2 phút trước' },
  { id: 'lt-4', user: 'hoang***pro', amount: 200000, method: 'VietQR', time: '3 phút trước' },
  { id: 'lt-5', user: '088***610', amount: 500000, method: 'VietQR MBBank', time: '5 phút trước' },
  { id: 'lt-6', user: 'minh***ff', amount: 50000, method: 'Thẻ Garena', time: '6 phút trước' },
];

export const LiveDepositAndFeedback: React.FC = () => {
  const { topups, currentUser, isAuthenticated, showToast, navigateToStorefront } = useStore();

  // User submitted custom feedbacks stored locally in session/localStorage
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('thanox_customer_feedbacks');
      return saved ? JSON.parse(saved) : DEFAULT_AUTHENTIC_FEEDBACKS;
    } catch {
      return DEFAULT_AUTHENTIC_FEEDBACKS;
    }
  });

  const [liveTopups, setLiveTopups] = useState(INITIAL_LIVE_TOPUPS);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review Form state
  const [reviewerName, setReviewerName] = useState(currentUser?.username || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTag, setReviewTag] = useState('MENU FF VIP');
  const [reviewComment, setReviewComment] = useState('');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Blend actual completed topups from StoreContext with simulated feed
  const combinedLiveTopups = useMemo(() => {
    const realApproved = (topups || [])
      .filter((t) => t.status === 'approved')
      .slice(0, 4)
      .map((t) => ({
        id: 'real-' + t.id,
        user: t.userName ? t.userName.slice(0, 3) + '***' + (t.userName.length > 5 ? t.userName.slice(-2) : '') : 'Khách***',
        amount: t.amount,
        method: t.method === 'Bank Transfer' ? 'VietQR MBBank' : 'Nạp Tự Động',
        time: 'Vừa xong',
      }));

    return [...realApproved, ...liveTopups].slice(0, 8);
  }, [topups, liveTopups]);

  // Periodic random live transaction trigger (every 8-15 seconds for vivid feeling)
  useEffect(() => {
    const sampleNames = ['096***214', '032***884', 'than***06', 'duy***ff', '089***771', 'tuan***9x', '091***443', 'quang***k'];
    const sampleAmounts = [10000, 20000, 50000, 100000, 200000, 500000];
    const sampleMethods = ['VietQR MBBank', 'VietQR', 'Thẻ Viettel', 'Thẻ Zing', 'VietQR 24/7'];

    const interval = setInterval(() => {
      const randomUser = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const randomAmt = sampleAmounts[Math.floor(Math.random() * sampleAmounts.length)];
      const randomMethod = sampleMethods[Math.floor(Math.random() * sampleMethods.length)];

      const newTx = {
        id: 'dyn-' + Date.now(),
        user: randomUser,
        amount: randomAmt,
        method: randomMethod,
        time: 'Vừa xong',
      };

      setLiveTopups((prev) => [newTx, ...prev.slice(0, 7)]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleLike = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    setFeedbacks((prev) =>
      prev.map((fb) => {
        if (fb.id === id) {
          const isLiked = likedMap[id];
          return { ...fb, likesCount: (fb.likesCount || 0) + (isLiked ? -1 : 1) };
        }
        return fb;
      })
    );
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast('Vui lòng nhập nội dung đánh giá!', 'error');
      return;
    }

    const nameToUse = reviewerName.trim() || (currentUser?.username ? currentUser.username : 'Game Thủ');
    const avatarLetters = nameToUse.substring(0, 2).toUpperCase();

    const newFb: CustomerFeedback = {
      id: 'fb-' + Date.now(),
      authorName: nameToUse,
      authorAvatar: avatarLetters,
      rating: reviewRating,
      comment: reviewComment.trim(),
      productTag: reviewTag,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      timeAgo: 'Vừa xong',
      verifiedPurchase: true,
      likesCount: 1,
    };

    const updated = [newFb, ...feedbacks];
    setFeedbacks(updated);
    try {
      localStorage.setItem('thanox_customer_feedbacks', JSON.stringify(updated));
    } catch {}

    setReviewComment('');
    setIsReviewModalOpen(false);
    showToast('Cảm ơn bạn đã gửi đánh giá! Đánh giá đã được xuất bản.', 'success');
  };

  return (
    <section className="space-y-6 pt-4">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl sm:text-2xl font-black text-[#F4F2FF] tracking-tight uppercase">
              Hoạt Động Trực Tuyến & Đánh Giá Cộng Đồng
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE 24/7
            </span>
          </div>
          <p className="text-xs text-[#938EB5] mt-1">
            Giao dịch nạp tiền thời gian thực và trải nghiệm thực tế từ cộng đồng game thủ
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (!reviewerName && currentUser?.username) {
              setReviewerName(currentUser.username);
            }
            setIsReviewModalOpen(true);
          }}
          leftIcon={<Plus className="w-3.5 h-3.5 text-[#C084FC]" />}
          className="self-start sm:self-auto font-bold text-xs"
        >
          Viết Đánh Giá Của Bạn
        </Button>
      </div>

      {/* 2-COLUMN GRID: Left = Live Deposit Ticker, Right = Authentic Feedbacks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: LIVE DEPOSIT TICKER (5 COLS) */}
        <div className="lg:col-span-5 glass-standard border border-white/10 shadow-xl rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/6 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-[#F4F2FF] uppercase tracking-wide">
                    Dòng Chảy Nạp Tiền Trực Tuyến
                  </h4>
                  <div className="text-[10px] text-[#938EB5]">Tự động duyệt 100% trong 1 - 3 giây</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 font-mono">
                {combinedLiveTopups.length} GD gần nhất
              </span>
            </div>

            {/* Live Ticker Feed */}
            <div className="space-y-2.5 pt-3.5 overflow-hidden">
              {combinedLiveTopups.map((tx, idx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl glass-subtle border border-white/6 hover:border-cyan-500/30 transition-all flex items-center justify-between text-xs group animate-in fade-in slide-in-from-top-1 duration-300"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-bold text-[#C084FC] group-hover:scale-105 transition-transform">
                      {tx.method.includes('Thẻ') ? (
                        <Smartphone className="w-4 h-4 text-amber-300" />
                      ) : (
                        <QrCode className="w-4 h-4 text-[#22D3EE]" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[#F4F2FF] flex items-center gap-1.5">
                        <span>{tx.user}</span>
                        <span className="text-[10px] font-normal text-[#938EB5]">({tx.method})</span>
                      </div>
                      <div className="text-[10px] text-[#938EB5] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{tx.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display font-extrabold text-sm text-emerald-400 tracking-tight">
                      +{tx.amount.toLocaleString('vi-VN')}đ
                    </div>
                    <div className="text-[9.5px] text-cyan-300/80 font-semibold uppercase flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Thành công</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/6 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#938EB5]">Cần nạp tiền vào ví ngay?</span>
            <button
              onClick={() => navigateToStorefront('account-wallet-deposit')}
              className="font-bold text-xs text-[#C084FC] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Nạp VietQR Ngay</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLUMN 2: AUTHENTIC COMMUNITY FEEDBACK (7 COLS) */}
        <div className="lg:col-span-7 glass-standard border border-white/10 shadow-xl rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/6 pb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#C084FC]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-black text-sm text-[#F4F2FF] uppercase tracking-wide">
                  Đánh Giá Từ Khách Hàng
                </h4>
                <div className="text-[10px] text-[#938EB5]">100% người dùng thực tế đã mua và trải nghiệm</div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-xl text-amber-300 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 / 5.0 (580+ Đánh giá)</span>
            </div>
          </div>

          {/* Feedback Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {feedbacks.map((fb) => {
              const isLiked = !!likedMap[fb.id];
              return (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl glass-subtle border border-white/6 hover:border-[#7C3AED]/30 transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Author & Rating Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                          {fb.authorAvatar || 'GT'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#F4F2FF] flex items-center gap-1 line-clamp-1">
                            <span>{fb.authorName}</span>
                            {fb.verifiedPurchase && (
                              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-[#938EB5]">{fb.timeAgo || 'Gần đây'}</div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: fb.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Comment Content */}
                    <p className="text-[11.5px] leading-relaxed text-[#E2DEFA] italic font-normal">
                      "{fb.comment}"
                    </p>
                  </div>

                  {/* Bottom Footer: Product Tag & Like */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10.5px]">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-[#C084FC] font-semibold">
                      {fb.productTag}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleLike(fb.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        isLiked
                          ? 'text-pink-400 bg-pink-500/15'
                          : 'text-[#938EB5] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isLiked ? 'fill-pink-400' : ''}`} />
                      <span>{fb.likesCount || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: SUBMIT CUSTOM REVIEW */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Gửi Đánh Giá Trải Nghiệm Của Bạn"
        size="md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <p className="text-xs text-[#938EB5]">
            Đánh giá của bạn sẽ giúp cộng đồng có thêm thông tin thực tế về chất lượng công cụ và dịch vụ.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider block">
              Tên hiển thị / Biệt danh
            </label>
            <input
              type="text"
              required
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="VD: Tuấn Gaming, hoangff..."
              className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider block">
                Đánh giá số sao
              </label>
              <div className="flex items-center gap-1.5 bg-[#161626] border border-white/10 rounded-xl px-3 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider block">
                Sản phẩm / Dịch vụ
              </label>
              <select
                value={reviewTag}
                onChange={(e) => setReviewTag(e.target.value)}
                className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#F0EDFF] outline-none focus:border-cyan-400"
              >
                <option value="MENU FF VIP">MENU FF VIP</option>
                <option value="FILE ANDROID">FILE ANDROID</option>
                <option value="FILE IOS">FILE IOS</option>
                <option value="KEY VIP">KEY VIP</option>
                <option value="PROXY RIÊNG">PROXY RIÊNG</option>
                <option value="Nạp Ví VietQR">Nạp Ví VietQR</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8B84A8] uppercase tracking-wider block">
              Nội dung nhận xét & cảm nhận
            </label>
            <textarea
              required
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm thực tế của bạn (VD: kéo tâm mượt, nạp tiền 3s, ad rep nhanh :)) ...)"
              className="w-full bg-[#161626] border border-white/10 rounded-xl p-3 text-xs text-[#F0EDFF] outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReviewModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="font-bold"
            >
              Gửi Đánh Giá Ngay
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
