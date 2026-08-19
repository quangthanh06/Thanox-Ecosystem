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

  // Fallback packages if not defined
  const productPackages =
    product.packages && product.packages.length > 0
      ? product.packages
      : [
          {
            id: 'pkg-default',
            name: 'GÓI MẶC ĐỊNH',
            price: product.price,
            originalPrice: product.originalPrice,
            sellerPrice: product.sellerPrice,
            keys: product.downloadLinkOrKeys,
          },
        ];

  const [selectedPkgId, setSelectedPkgId] = useState<string>(productPackages[0].id);
  const selectedPackage =
    productPackages.find((pkg) => pkg.id === selectedPkgId) || productPackages[0];

  const effectivePrice =
    isSeller && selectedPackage.sellerPrice ? selectedPackage.sellerPrice : selectedPackage.price;
  const originalDisplayPrice = isSeller
    ? selectedPackage.price
    : selectedPackage.originalPrice || product.originalPrice;

  const discount =
    originalDisplayPrice && originalDisplayPrice > effectivePrice
      ? Math.round(((originalDisplayPrice - effectivePrice) / originalDisplayPrice) * 100)
      : null;

  const handleBuyNow = () => {
    const total = effectivePrice * quantity;
    if (currentUser.balance < total) {
      showToast(
        `Số dư ví không đủ (${currentUser.balance.toLocaleString('vi-VN')} VND). Chuyển sang nạp tiền...`,
        'warning'
      );
      navigateToStorefront('account-wallet-deposit');
      return;
    }
    const success = createOrder(product.id, quantity, 'wallet', selectedPackage);
    if (success) {
      navigateToStorefront('account-orders');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
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
        {/* Left Column: Visual Cover Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-video sm:aspect-[4/3] rounded-3xl bg-[#161626] border border-white/10 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden group shadow-2xl">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-black/80 text-cyan-400 border border-cyan-500/30 backdrop-blur-md">
                {product.category}
              </span>
              {isSeller ? (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                  Giá Đại Lý / CTV
                </span>
              ) : discount ? (
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-red-600/90 text-white shadow-lg backdrop-blur-md">
                  GIẢM {discount}%
                </span>
              ) : null}
            </div>

            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-3xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-[#9D5CF6] mb-3 shadow-xl shadow-[#7C3AED]/10">
                  <Key className="w-10 h-10" />
                </div>
                <div className="font-display font-bold text-base text-[#F0EDFF]">Bản Quyền Chính Hãng Thanox</div>
                <div className="text-xs text-[#8B84A8] mt-1">Giao Key & Link tải tự động sau khi thanh toán</div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#161626] border border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#8B84A8]">Trạng thái giao hàng:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sẵn sàng giao Key tự động (24/7)
            </span>
          </div>
        </div>

        {/* Right Column: Information, Package Selection & Actions (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Header */}
          <div>
            <div className="inline-block px-3 py-1 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-cyan-400 text-[11px] font-black uppercase tracking-wider mb-2">
              {product.category}
            </div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-[#F0EDFF] leading-tight">
              {product.name}
            </h1>
            <div className="grid grid-cols-2 gap-3 mt-3 p-3 rounded-2xl bg-[#161626] border border-white/5 text-xs">
              <div>
                <span className="text-[#8B84A8] text-[10.5px] block font-semibold">ĐÃ BÁN</span>
                <span className="text-sm font-black text-emerald-400">{product.soldCount}</span>
              </div>
              <div>
                <span className="text-[#8B84A8] text-[10.5px] block font-semibold">CÒN LẠI</span>
                <span className="text-sm font-black text-[#F0EDFF]">
                  {product.stock === 'unlimited' ? '∞ Không giới hạn' : product.stock}
                </span>
              </div>
            </div>
          </div>

          {/* Current Price Box */}
          <div className="space-y-1">
            <span className="text-[11px] text-[#8B84A8] font-bold uppercase tracking-wider block">
              GIÁ HIỆN TẠI
            </span>
            <div className="font-display text-2xl sm:text-3xl font-black text-[#06B6D4] tracking-tight">
              {effectivePrice.toLocaleString('vi-VN')} <span className="text-sm font-bold text-cyan-400">VND</span>
            </div>
          </div>

          {/* CHỌN GÓI DỊCH VỤ (Service Package & Duration Selector) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#F0EDFF] uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>CHỌN GÓI DỊCH VỤ</span>
              </span>
              <span className="text-[11px] text-[#8B84A8] font-semibold">
                {productPackages.length} gói thời hạn
              </span>
            </div>

            <div className="space-y-2">
              {productPackages.map((pkg) => {
                const pkgPrice = isSeller && pkg.sellerPrice ? pkg.sellerPrice : pkg.price;
                const isSelected = selectedPackage.id === pkg.id;

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#06B6D4]/10 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-[#161626] border-white/10 hover:border-white/20 hover:bg-[#1E1E32]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-emerald-400 bg-emerald-400' : 'border-white/30'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <span className={`font-black text-xs uppercase ${isSelected ? 'text-white' : 'text-[#CBC7E0]'}`}>
                        {pkg.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`font-black text-sm ${isSelected ? 'text-emerald-400' : 'text-[#06B6D4]'}`}>
                        {pkgPrice.toLocaleString('vi-VN')} <span className="text-[11px]">VND</span>
                      </span>
                      {pkg.originalPrice && pkg.originalPrice > pkgPrice && (
                        <div className="text-[10px] text-[#6B658E] line-through">
                          {pkg.originalPrice.toLocaleString('vi-VN')} VND
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit Price & Quantity Counter */}
          <div className="p-3.5 rounded-2xl bg-[#161626]/80 border border-white/5 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="text-[#8B84A8] text-[11px]">
                Đơn giá: <strong className="text-white font-bold">{effectivePrice.toLocaleString('vi-VN')} VND</strong>
              </div>
              <div className="text-[#8B84A8] text-[11px]">
                Số lượng: <strong className="text-cyan-400 font-bold">x{quantity}</strong>
              </div>
            </div>

            <div className="flex items-center bg-[#0F0F1A] border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white font-bold cursor-pointer"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-black text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buy Now Button matching screenshot */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full py-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-black font-black uppercase text-sm sm:text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-98 cursor-pointer tracking-wider"
            >
              <ShoppingCart className="w-5 h-5 text-black stroke-[2.5]" />
              <span>MUA NGAY ({(effectivePrice * quantity).toLocaleString('vi-VN')} VND)</span>
            </button>

            <button
              type="button"
              onClick={() => addToCart(product, quantity, selectedPackage)}
              className="w-full py-2.5 rounded-xl bg-[#161626] hover:bg-[#1E1E30] text-[#CBC7E0] hover:text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Thêm Vào Giỏ Hàng</span>
            </button>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs text-[#8B84A8]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Giao key & tải ngay sau 3s</span>
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
