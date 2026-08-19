import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Download,
  Key,
  Flame,
  ArrowLeft,
  Share2,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const StorefrontProductDetail: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug?: string }>();
  const {
    products,
    selectedProductSlugOrId,
    navigateToStorefront,
    addToCart,
    createOrder,
    currentUser,
    showToast,
  } = useStore();

  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'info' | 'guide' | 'policy'>('info');

  const activeIdOrSlug = idOrSlug || selectedProductSlugOrId;
  const product =
    products.find(
      (p) => p.id === activeIdOrSlug || p.name.toLowerCase().replace(/\s+/g, '-') === activeIdOrSlug
    ) || products[0];

  if (!product) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Không tìm thấy sản phẩm!</h2>
        <Button onClick={() => navigateToStorefront('products')}>Quay lại danh mục</Button>
      </div>
    );
  }

  const isSeller = currentUser?.sellerStatus === 'active' && !!product.sellerPrice;
  const effectivePrice = isSeller ? product.sellerPrice! : product.price;
  const originalDisplayPrice = isSeller ? product.price : product.originalPrice;

  const discount = originalDisplayPrice
    ? Math.round(((originalDisplayPrice - effectivePrice) / originalDisplayPrice) * 100)
    : null;

  const handleBuyNow = () => {
    const total = effectivePrice * quantity;
    if (currentUser.balance < total) {
      showToast(`Số dư ví không đủ (${currentUser.balance.toLocaleString('vi-VN')}đ). Chuyển sang nạp tiền...`, 'warning');
      navigateToStorefront('account-wallet-deposit');
      return;
    }
    const success = createOrder(product.id, quantity, 'wallet');
    if (success) {
      navigateToStorefront('account-orders');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#8B84A8]">
        <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
          Trang Chủ
        </button>
        <span>/</span>
        <button onClick={() => navigateToStorefront('products')} className="hover:text-white transition-colors cursor-pointer">
          Sản Phẩm
        </button>
        <span>/</span>
        <span className="text-[#9D5CF6] font-medium line-clamp-1">{product.name}</span>
      </div>

      {/* Main Product Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0F0F1A] border border-white/10 rounded-3xl p-6 sm:p-8">
        {/* Left Column: Visual Cover Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square rounded-2xl bg-[#161626] border border-white/10 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group">
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#7C3AED]/20 text-[#9D5CF6] border border-[#7C3AED]/30 backdrop-blur-md">
                {product.category}
              </span>
              {isSeller ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                  Giá Đại Lý / CTV
                </span>
              ) : discount ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-md">
                  GIẢM {discount}%
                </span>
              ) : null}
            </div>

            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-3xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-[#9D5CF6] mb-4 shadow-xl shadow-[#7C3AED]/10">
                  <Key className="w-12 h-12" />
                </div>
                <div className="font-display font-bold text-base text-[#F0EDFF]">Bản Quyền Chính Hãng Thanox</div>
                <div className="text-xs text-[#8B84A8] mt-1">Giao Key & Link tải tự động sau khi thanh toán</div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[#161626] border border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#8B84A8]">Trạng thái:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sẵn sàng giao ngay (Auto 24/7)
            </span>
          </div>
        </div>

        {/* Right Column: Information & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F0EDFF] leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-xs text-[#8B84A8] mt-2">
              <span>Mã sản phẩm: <strong className="text-[#CBC7E0]">{product.id}</strong></span>
              <span>•</span>
              <span>Đã bán: <strong className="text-emerald-400">{product.soldCount} lượt</strong></span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-[#161626] border border-white/5 flex items-baseline justify-between">
            <div>
              <div className="text-[11px] text-[#8B84A8] uppercase font-bold">
                {isSeller ? 'Giá Đại Lý Ưu Đãi' : 'Giá bán hiện tại'}
              </div>
              <div className="font-display text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
                {effectivePrice.toLocaleString('vi-VN')} <span className="text-sm">VND</span>
              </div>
            </div>

            {originalDisplayPrice && originalDisplayPrice > effectivePrice && (
              <div className="text-right">
                <div className="text-[11px] text-[#6B658E] line-through">
                  Giá gốc: {originalDisplayPrice.toLocaleString('vi-VN')}đ
                </div>
                <div className="text-xs text-amber-400 font-bold mt-0.5">
                  Tiết kiệm {(originalDisplayPrice - effectivePrice).toLocaleString('vi-VN')}đ
                </div>
              </div>
            )}
          </div>

          {/* Short Description */}
          <div className="text-xs sm:text-sm text-[#CBC7E0] leading-relaxed space-y-2">
            <p>{product.description}</p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs font-semibold text-[#8B84A8]">Số lượng:</span>
            <div className="flex items-center bg-[#161626] border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white font-bold cursor-pointer transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center text-xs font-bold text-[#F0EDFF]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white font-bold cursor-pointer transition-colors"
              >
                +
              </button>
            </div>
            <span className="text-xs text-[#8B84A8]">
              Tổng: <strong className="text-emerald-400 font-bold">{(product.price * quantity).toLocaleString('vi-VN')}đ</strong>
            </span>
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => addToCart(product, quantity)}
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              className="justify-center font-bold"
            >
              Thêm Vào Giỏ Hàng
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleBuyNow}
              leftIcon={<Zap className="w-4 h-4" />}
              className="justify-center font-bold shadow-lg shadow-[#7C3AED]/25"
            >
              Mua Ngay Bằng Số Dư Ví
            </Button>
          </div>

          {/* Guarantees List */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs text-[#8B84A8]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Giao key & tải ngay sau 3 giây</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4] flex-shrink-0" />
              <span>Bảo hành chống ban 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Detailed Info, Installation Guide, Warranty Policy */}
      <div className="bg-[#0F0F1A] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            Thông Tin Chi Tiết
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            Hướng Dẫn Kích Hoạt
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'policy'
                ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
                : 'text-[#8B84A8] hover:text-white bg-[#161626]'
            }`}
          >
            Chính Sách & Hỗ Trợ
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-4 text-xs sm:text-sm text-[#CBC7E0] leading-relaxed">
            <h3 className="font-display font-bold text-base text-[#F0EDFF]">Tính năng nổi bật</h3>
            <ul className="list-disc list-inside space-y-1.5 text-[#8B84A8]">
              <li>Tương thích mượt mà với phiên bản Free Fire OB44 mới nhất 2026.</li>
              <li>Hỗ trợ kéo tâm tự động nhạy 100%, không rung lắc tâm khi bắn xa hoặc gần.</li>
              <li>Mã hóa bảo vệ tài khoản, chống quét thuật toán chống hack an toàn tuyệt đối.</li>
              <li>Cập nhật miễn phí trọn đời khi game có bản vá mới.</li>
            </ul>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-3 text-xs sm:text-sm text-[#CBC7E0] leading-relaxed">
            <h3 className="font-display font-bold text-base text-[#F0EDFF]">Các bước cài đặt & kích hoạt</h3>
            <ol className="list-decimal list-inside space-y-2 text-[#8B84A8]">
              <li>Sau khi thanh toán thành công, vào mục <strong>Tài Khoản → Đơn Hàng</strong> để nhận key và link tải.</li>
              <li>Tải file về máy và mở bằng ứng dụng quản lý file (ZArchiver hoặc Scarlet/Esign).</li>
              <li>Nhập mã License Key được cấp để kích hoạt dịch vụ và bắt đầu trải nghiệm.</li>
            </ol>
          </div>
        )}

        {activeTab === 'policy' && (
          <div className="space-y-3 text-xs sm:text-sm text-[#CBC7E0] leading-relaxed">
            <h3 className="font-display font-bold text-base text-[#F0EDFF]">Cam kết bảo hành & hoàn tiền</h3>
            <p className="text-[#8B84A8]">
              Nếu file bị lỗi không kích hoạt được hoặc không tương thích máy, bạn có thể gửi yêu cầu hỗ trợ qua Ticket. Đội ngũ admin Thanox cam kết hoàn tiền 100% vào số dư ví nếu không giải quyết được lỗi trong 24h.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
