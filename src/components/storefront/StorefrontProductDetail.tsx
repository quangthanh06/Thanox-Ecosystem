import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Product, ProductPackage } from '../../types';
import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Key,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// 1. SUBCOMPONENT: BREADCRUMB
// ============================================================================
interface BreadcrumbProps {
  productName: string;
  onNavigateHome: () => void;
  onNavigateProducts: () => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  productName,
  onNavigateHome,
  onNavigateProducts,
}) => (
  <div className="flex items-center gap-2 text-xs text-[#8B84A8] py-1">
    <button
      type="button"
      onClick={onNavigateHome}
      className="hover:text-white transition-colors cursor-pointer font-medium"
    >
      Trang chủ
    </button>
    <ChevronRight className="w-3.5 h-3.5 text-[#555074] shrink-0" />
    <button
      type="button"
      onClick={onNavigateProducts}
      className="hover:text-white transition-colors cursor-pointer font-medium"
    >
      Sản phẩm
    </button>
    <ChevronRight className="w-3.5 h-3.5 text-[#555074] shrink-0" />
    <span className="text-[#F0EDFF] font-semibold line-clamp-1">{productName}</span>
  </div>
);

// ============================================================================
// 2. SUBCOMPONENT: PRODUCT GALLERY / IMAGE SLOT
// ============================================================================
interface ProductGalleryProps {
  product: Product;
  isSeller: boolean;
  discount: number | null;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ product, isSeller, discount }) => {
  // ================================
  // THAY ẢNH SẢN PHẨM TẠI ĐÂY (PRODUCT_IMAGE_SLOT)
  // ================================
  const productImage = product.image || (product.images && product.images[0]) || '';

  return (
    <div className="space-y-3.5">
      {/* Product Image Card Container */}
      <div className="rounded-3xl bg-[#141527] border border-white/10 p-2 sm:p-2.5 relative overflow-hidden shadow-2xl">
        <div
          className="product-image-container w-full rounded-2xl bg-[#090A14] relative overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: '1.45 / 1' }}
        >
          {/* Badges on image */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-black/85 text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-md">
              {product.category}
            </span>
            {isSeller ? (
              <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                Giá Đại Lý / CTV
              </span>
            ) : discount ? (
              <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-red-600/90 text-white shadow-md backdrop-blur-md">
                GIẢM {discount}%
              </span>
            ) : null}
          </div>

          {/* PRODUCT_IMAGE_SLOT: Main image element with locked aspect ratio */}
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="product-main-image w-full h-full object-cover block transition-transform duration-500 hover:scale-105"
              style={{ aspectRatio: '1.45 / 1', objectFit: 'cover' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-[#9D5CF6] mb-2 shadow-lg shadow-[#7C3AED]/10">
                <Key className="w-8 h-8" />
              </div>
              <span className="text-xs font-semibold text-[#8B84A8]">Bản Quyền Chính Hãng Thanox</span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Status Bar */}
      <div className="p-3.5 rounded-2xl bg-[#141527] border border-white/5 flex items-center justify-between text-xs">
        <span className="text-[#8B84A8] font-medium">Trạng thái giao hàng:</span>
        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Sẵn sàng giao Key tự động (24/7)
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 3. SUBCOMPONENT: PRODUCT INFO & ACTION CONTROLS
// ============================================================================
interface ProductInfoProps {
  product: Product;
  isSeller: boolean;
  productPackages: ProductPackage[];
  selectedPackage: ProductPackage;
  selectedPkgId: string;
  onSelectPackage: (id: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  effectivePrice: number;
  onBuyNow: () => void;
  onAddToCart: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  isSeller,
  productPackages,
  selectedPackage,
  selectedPkgId,
  onSelectPackage,
  quantity,
  onQuantityChange,
  effectivePrice,
  onBuyNow,
  onAddToCart,
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Badge & Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-black uppercase tracking-wider">
          {product.category}
        </div>
        <h1 className="font-display text-xl sm:text-2xl lg:text-[26px] font-black text-[#F0EDFF] leading-snug break-words max-w-full">
          {product.name}
        </h1>
      </div>

      {/* Sales & Stock Card */}
      <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-[#141527] border border-white/5 text-xs">
        <div>
          <span className="text-[#8B84A8] text-[10.5px] uppercase font-bold tracking-wider block">
            ĐÃ BÁN
          </span>
          <span className="text-base font-black text-emerald-400 mt-0.5 block">
            {product.soldCount}
          </span>
        </div>
        <div>
          <span className="text-[#8B84A8] text-[10.5px] uppercase font-bold tracking-wider block">
            CÒN LẠI
          </span>
          <span className="text-base font-black text-[#F0EDFF] mt-0.5 block">
            {product.stock === 'unlimited' ? '∞ Không giới hạn' : product.stock}
          </span>
        </div>
      </div>

      {/* Current Price Block */}
      <div className="space-y-0.5">
        <span className="text-[11px] text-[#8B84A8] font-bold uppercase tracking-wider block">
          GIÁ HIỆN TẠI
        </span>
        <div className="font-display text-2xl sm:text-3xl font-black text-[#06B6D4] tracking-tight">
          {effectivePrice.toLocaleString('vi-VN')} <span className="text-sm font-bold text-cyan-400">VND</span>
        </div>
      </div>

      {/* Service Packages Selector */}
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
                onClick={() => onSelectPackage(pkg.id)}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-500/10 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-[#141527] border-white/5 hover:border-white/20 hover:bg-[#1A1C33]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-emerald-400 bg-emerald-400' : 'border-white/30 bg-transparent'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <span
                    className={`font-black text-xs uppercase ${
                      isSelected ? 'text-white' : 'text-[#CBC7E0]'
                    }`}
                  >
                    {pkg.name}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black text-sm ${
                      isSelected ? 'text-emerald-400' : 'text-[#06B6D4]'
                    }`}
                  >
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

      {/* Quantity & Unit Price Card */}
      <div className="p-3.5 rounded-2xl bg-[#141527] border border-white/5 flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <div className="text-[#8B84A8] text-[11px]">
            Đơn giá: <strong className="text-white font-bold">{effectivePrice.toLocaleString('vi-VN')} VND</strong>
          </div>
          <div className="text-[#8B84A8] text-[11px]">
            Số lượng: <strong className="text-cyan-400 font-bold">x{quantity}</strong>
          </div>
        </div>

        {/* Counter controls */}
        <div className="flex items-center bg-[#090A14] border border-white/10 rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white font-bold cursor-pointer transition-colors"
          >
            -
          </button>
          <span className="w-8 text-center text-xs font-black text-white">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white font-bold cursor-pointer transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* MUA NGAY button (Height ~50px, bold emerald green) */}
        <button
          type="button"
          onClick={onBuyNow}
          className="w-full h-12 sm:h-13 py-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-black font-black uppercase text-sm sm:text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-98 cursor-pointer tracking-wider"
        >
          <ShoppingCart className="w-5 h-5 text-black stroke-[2.5]" />
          <span>MUA NGAY ({(effectivePrice * quantity).toLocaleString('vi-VN')} VND)</span>
        </button>

        {/* THÊM VÀO GIỎ button */}
        <button
          type="button"
          onClick={onAddToCart}
          className="w-full py-2.5 rounded-xl bg-[#141527] hover:bg-[#1C1E38] text-[#CBC7E0] hover:text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Thêm Vào Giỏ Hàng</span>
        </button>
      </div>

      {/* Trust Features Row */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs text-[#8B84A8]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Giao key & tải ngay sau 3s</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Bảo hành chống ban 100%</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. SUBCOMPONENT: PRODUCT DESCRIPTION SECTION (FULL-WIDTH)
// ============================================================================
interface ProductDescriptionProps {
  product: Product;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ product }) => (
  <div className="bg-[#0D0E1A] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
      <h2 className="font-display font-black text-base sm:text-lg text-[#06B6D4] uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <span>MÔ TẢ SẢN PHẨM</span>
      </h2>
    </div>

    <div className="space-y-4 text-xs sm:text-sm text-[#CBC7E0] leading-relaxed">
      {product.description && (
        <div className="p-4 rounded-2xl bg-[#141527] border border-white/5 text-xs sm:text-sm text-[#E0DCF5] flex items-start gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
          <p className="font-medium leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div className="p-4 rounded-2xl bg-[#141527] border border-white/5 space-y-2">
          <h4 className="font-bold text-xs text-[#F0EDFF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Tính Năng & Tương Thích</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-[#8B84A8]">
            <li>● Tương thích 100% phiên bản mới nhất 2026</li>
            <li>● Thuật toán mã hóa chống ban, chống quét an toàn</li>
            <li>● Tối ưu hóa FPS mượt mà, không giật lag</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-[#141527] border border-white/5 space-y-2">
          <h4 className="font-bold text-xs text-[#F0EDFF] flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Giao Nhận Tự Động</span>
          </h4>
          <p className="text-xs text-[#8B84A8] leading-relaxed">
            Hệ thống cấp mã Key kích hoạt và link tải trực tiếp ngay sau khi bấm thanh toán, xem trong mục Đơn Hàng 24/7.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#141527] border border-white/5 space-y-2">
          <h4 className="font-bold text-xs text-[#F0EDFF] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#9D5CF6]" />
            <span>Chính Sách Bảo Hành</span>
          </h4>
          <p className="text-xs text-[#8B84A8] leading-relaxed">
            Hỗ trợ kỹ thuật 24/7 qua Ticket và LiveChat. Cam kết 1 đổi 1 hoặc hoàn tiền ví 100% nếu có lỗi phát sinh.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// 5. MAIN CONTAINER: STOREFRONT PRODUCT DETAIL
// ============================================================================
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

  const activeIdOrSlug = idOrSlug || selectedProductSlugOrId;
  const product =
    products.find(
      (p) => p.id === activeIdOrSlug || p.name.toLowerCase().replace(/\s+/g, '-') === activeIdOrSlug
    ) || products[0];

  if (!product) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Không tìm thấy sản phẩm!</h2>
        <button
          type="button"
          onClick={() => navigateToStorefront('products')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
        >
          Quay lại danh mục
        </button>
      </div>
    );
  }

  const isSeller = currentUser?.sellerStatus === 'active' && !!product.sellerPrice;

  // Fallback packages if not defined
  const productPackages: ProductPackage[] =
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

  const [selectedPkgId, setSelectedPkgId] = useState<string>(productPackages[0]?.id || 'pkg-default');
  const selectedPackage =
    productPackages.find((pkg) => pkg.id === selectedPkgId) || productPackages[0];

  const effectivePrice =
    isSeller && selectedPackage?.sellerPrice ? selectedPackage.sellerPrice : (selectedPackage?.price ?? product.price);
  const originalDisplayPrice = isSeller
    ? selectedPackage?.price
    : selectedPackage?.originalPrice || product.originalPrice;

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
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* 1. Header / Breadcrumb */}
      <Breadcrumb
        productName={product.name}
        onNavigateHome={() => navigateToStorefront('home')}
        onNavigateProducts={() => navigateToStorefront('products')}
      />

      {/* 2. Main 2-Column Product Block (Desktop 2 equal columns on the same row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start bg-[#0D0E1A] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl">
        {/* Left Column: Product Gallery / Image Slot */}
        <ProductGallery product={product} isSeller={isSeller} discount={discount} />

        {/* Right Column: Product Information & Action Controls */}
        <ProductInfo
          product={product}
          isSeller={isSeller}
          productPackages={productPackages}
          selectedPackage={selectedPackage}
          selectedPkgId={selectedPkgId}
          onSelectPackage={setSelectedPkgId}
          quantity={quantity}
          onQuantityChange={setQuantity}
          effectivePrice={effectivePrice}
          onBuyNow={handleBuyNow}
          onAddToCart={() => addToCart(product, quantity, selectedPackage)}
        />
      </div>

      {/* 3. Product Description Full-Width Section */}
      <ProductDescription product={product} />
    </div>
  );
};
