import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Product, ProductPlan } from '../../types';
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
  <nav
    aria-label="Breadcrumb"
    className="flex items-center gap-1.5 text-[11px] font-medium text-[#64748B] py-0.5 leading-[1.4] select-none"
  >
    <button
      type="button"
      onClick={onNavigateHome}
      className="hover:text-[#22D3EE] transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50 focus-visible:outline-offset-2 rounded"
    >
      Trang chủ
    </button>
    <ChevronRight className="w-3 h-3 text-[#64748B] shrink-0" />
    <button
      type="button"
      onClick={onNavigateProducts}
      className="hover:text-[#22D3EE] transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50 focus-visible:outline-offset-2 rounded"
    >
      Sản phẩm
    </button>
    <ChevronRight className="w-3 h-3 text-[#64748B] shrink-0" />
    <span className="text-[#CBD5E1] font-semibold truncate max-w-[220px] sm:max-w-[360px] md:max-w-none">
      {productName}
    </span>
  </nav>
);

// ============================================================================
// 2. SUBCOMPONENT: PRODUCT GALLERY / IMAGE SLOT
// ============================================================================
interface ProductGalleryProps {
  product: Product;
  isSeller: boolean;
  discountPercent?: number;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ product, isSeller, discountPercent }) => {
  // ======================================
  // THAY ẢNH SẢN PHẨM TẠI ĐÂY (PRODUCT_IMAGE_SLOT)
  // ======================================
  const productImage = product.image || (product.images && product.images[0]) || '';

  return (
    <div className="space-y-3 w-full">
      {/* Product Image Card Container */}
      <div className="rounded-[18px] bg-[#0D1020] border border-slate-800/80 p-2 sm:p-2.5 relative overflow-hidden shadow-xl shadow-black/40">
        <div
          className="product-image-container w-full rounded-[14px] bg-[#080A14] relative overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: '1.45 / 1' }}
        >
          {/* Badges Overlay on Image */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-[8px] text-[10.5px] font-bold uppercase tracking-wider bg-[#080A14]/90 text-[#22D3EE] border border-[#22D3EE]/30 backdrop-blur-md shadow-md">
              {product.category}
            </span>
            {isSeller ? (
              <span className="px-2.5 py-0.5 rounded-[8px] text-[10.5px] font-bold bg-cyan-500/20 text-[#22D3EE] border border-cyan-500/40 backdrop-blur-md shadow-md">
                Giá Đại Lý / CTV
              </span>
            ) : discountPercent ? (
              <span className="px-2.5 py-0.5 rounded-[8px] text-[10.5px] font-bold bg-red-600/90 text-[#F8FAFC] shadow-md backdrop-blur-md">
                GIẢM {discountPercent}%
              </span>
            ) : null}
          </div>

          {/* PRODUCT_IMAGE_SLOT: Locked aspect-ratio container and cover image */}
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="product-main-image w-full h-full object-cover block transition-transform duration-500 hover:scale-[1.03]"
              style={{ aspectRatio: '1.45 / 1', objectFit: 'cover' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] mb-2 shadow-lg shadow-[#8B5CF6]/10">
                <Key className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-medium text-[#94A3B8]">Bản Quyền Chính Hãng Thanox</span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Status Card */}
      <div className="delivery-status p-3 rounded-[14px] bg-[#0D1020] border border-slate-800/80 flex items-center justify-between gap-2.5 text-[11px] leading-[1.4] text-[#94A3B8]">
        <span className="font-medium text-[#94A3B8] shrink-0">Trạng thái giao hàng:</span>
        <span className="text-[#10E6A1] font-semibold flex items-center gap-1.5 shrink-0">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#10E6A1] shadow-[0_0_8px_rgba(16,230,161,0.55)] animate-pulse"
            style={{ animation: 'statusPulse 2s ease-in-out infinite' }}
          />
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
  productPlans: ProductPlan[];
  selectedPlan: ProductPlan | null;
  onSelectPlan: (plan: ProductPlan | null) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  productBasePrice: number;
  productCurrentPrice: number;
  productOriginalPrice?: number;
  isProductSale: boolean;
  productDiscountPercent?: number;
  effectiveUnitPrice: number;
  onBuyNow: () => void;
  onAddToCart: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  productPlans,
  selectedPlan,
  onSelectPlan,
  quantity,
  onQuantityChange,
  productCurrentPrice,
  productOriginalPrice,
  isProductSale,
  productDiscountPercent,
  effectiveUnitPrice,
  onBuyNow,
  onAddToCart,
}) => {
  return (
    <div className="space-y-4 w-full">
      {/* 1. CATEGORY */}
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] bg-cyan-500/10 border border-cyan-500/30 text-[#22D3EE] text-[10.5px] font-bold uppercase tracking-wider">
        {product.category}
      </div>

      {/* 2. PRODUCT TITLE */}
      <h1
        className="font-bold text-[#F8FAFC] leading-[1.2] break-words"
        style={{
          fontSize: 'clamp(21px, 2.1vw, 28px)',
          overflowWrap: 'anywhere',
        }}
      >
        {product.name}
      </h1>

      {/* 3. SOLD / STOCK (Thống kê ngang) */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-[14px] bg-[#0D1020] border border-slate-800/80 text-[11px] leading-[1.4]">
        <div>
          <span className="text-[11px] font-medium text-[#94A3B8] tracking-[0.15px] uppercase block">
            ĐÃ BÁN
          </span>
          <span className="text-[13px] font-bold text-[#10E6A1] mt-0.5 block leading-[1.35]">
            {product.sold ?? product.soldCount ?? 0}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[#94A3B8] tracking-[0.15px] uppercase block">
            CÒN LẠI
          </span>
          <span className="text-[13px] font-bold text-[#F8FAFC] mt-0.5 block leading-[1.35]">
            {product.stock === 'unlimited' ? '∞ Không giới hạn' : product.stock}
          </span>
        </div>
      </div>

      {/* 4. GIÁ SẢN PHẨM & GIÁ SALE (Nằm ở khu vực thông tin sản phẩm) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#94A3B8] tracking-[0.15px] uppercase block">
            GIÁ HIỆN TẠI
          </span>
          {isProductSale && productDiscountPercent && (
            <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-extrabold bg-red-600/90 text-white tracking-wider">
              SALE -{productDiscountPercent}%
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3">
          <div className="text-[28px] sm:text-[32px] font-extrabold text-[#22D3EE] tracking-tight leading-[1.1]">
            {productCurrentPrice.toLocaleString('vi-VN')} <span className="text-sm font-bold text-[#22D3EE]">VNĐ</span>
          </div>

          {isProductSale && productOriginalPrice && (
            <div className="text-[12px] font-medium text-[#64748B] line-through leading-[1.2]">
              {productOriginalPrice.toLocaleString('vi-VN')} VNĐ
            </div>
          )}
        </div>
      </div>

      {/* 5. CHỌN GÓI DỊCH VỤ (Các gói thời hạn với giá riêng cố định của từng gói) */}
      {productPlans.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#F8FAFC] uppercase tracking-[0.15px] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>CHỌN GÓI DỊCH VỤ</span>
            </span>
            <span className="text-[11px] font-medium text-[#64748B]">
              {productPlans.length} gói thời hạn
            </span>
          </div>

          <div className="space-y-1.5">
            {productPlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-[12px] flex items-center justify-between text-left transition-all duration-200 cursor-pointer border focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50 focus-visible:outline-offset-2 ${
                    isSelected
                      ? 'bg-[#22D3EE]/[0.06] border-[#10E6A1] shadow-[0_0_15px_rgba(16,230,161,0.18)]'
                      : 'bg-[#0D1020] border-slate-800/80 hover:border-slate-700 hover:bg-[#11152A]'
                  }`}
                >
                  {/* Left: Radio + Plan Name */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isSelected ? 'border-[#10E6A1] bg-[#10E6A1]' : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span
                      className={`text-[13px] font-bold uppercase truncate leading-[1.35] ${
                        isSelected ? 'text-[#F8FAFC]' : 'text-[#CBD5E1]'
                      }`}
                    >
                      {plan.name}
                    </span>
                  </div>

                  {/* Right: Plan Price */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[13px] font-bold leading-[1.35] ${
                        isSelected ? 'text-[#10E6A1]' : 'text-[#22D3EE]'
                      }`}
                    >
                      {plan.price.toLocaleString('vi-VN')} <span className="text-[10.5px]">VNĐ</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. QUANTITY (Khối số lượng) */}
      <div className="p-3 rounded-[14px] bg-[#0D1020] border border-slate-800/80 flex items-center justify-between text-[11px] leading-[1.4]">
        <div className="space-y-0.5">
          <div className="text-[#94A3B8]">
            Đơn giá: <strong className="text-[#F8FAFC] font-bold">{effectiveUnitPrice.toLocaleString('vi-VN')} VNĐ</strong>
          </div>
          <div className="text-[#94A3B8]">
            Số lượng: <strong className="text-[#22D3EE] font-bold">x{quantity}</strong>
          </div>
        </div>

        {/* - 1 + counter */}
        <div className="flex items-center bg-[#080A14] border border-slate-800/90 rounded-[10px] p-0.5">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded-[8px] hover:bg-white/10 flex items-center justify-center text-[#F8FAFC] font-bold cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50"
            aria-label="Giảm số lượng"
          >
            -
          </button>
          <span className="w-8 text-center text-[12px] font-bold text-[#F8FAFC] select-none">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-8 h-8 rounded-[8px] hover:bg-white/10 flex items-center justify-center text-[#F8FAFC] font-bold cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50"
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>
      </div>

      {/* 7. MUA NGAY & 8. THÊM VÀO GIỎ */}
      <div className="space-y-2 pt-0.5">
        {/* MUA NGAY button (Height ~50-52px, bold emerald green, subtle glow) */}
        <button
          type="button"
          onClick={onBuyNow}
          className="w-full h-[50px] sm:h-[52px] rounded-[13px] bg-[#10E6A1] hover:bg-[#05C989] text-black font-extrabold uppercase text-[14px] sm:text-[15px] shadow-[0_4px_20px_rgba(16,230,161,0.25)] flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer tracking-wide focus-visible:outline-2 focus-visible:outline-[#10E6A1]/60 focus-visible:outline-offset-2"
        >
          <ShoppingCart className="w-4.5 h-4.5 text-black stroke-[2.5]" />
          <span>MUA NGAY ({(effectiveUnitPrice * quantity).toLocaleString('vi-VN')} VNĐ)</span>
        </button>

        {/* THÊM VÀO GIỎ button */}
        <button
          type="button"
          onClick={onAddToCart}
          className="w-full min-h-[44px] py-2 rounded-[12px] bg-[#11152A] hover:bg-[#181E3B] text-[#CBD5E1] hover:text-white font-bold text-xs border border-slate-700/40 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50 focus-visible:outline-offset-2"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Thêm Vào Giỏ Hàng</span>
        </button>
      </div>

      {/* 9. TRUST FEATURES */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] leading-[1.4] text-[#94A3B8]">
        <div className="flex items-center gap-1.5 truncate">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10E6A1] shrink-0" />
          <span className="truncate">Giao key & tải ngay sau 3s</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
          <span className="truncate">Bảo hành chống ban 100%</span>
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
  <section
    aria-label="Mô tả sản phẩm"
    className="bg-[#0D1020] border border-slate-800/80 rounded-[18px] p-5 sm:p-7 space-y-4 shadow-xl shadow-black/40 w-full"
  >
    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
      <h2 className="font-bold text-sm sm:text-base text-[#22D3EE] uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#22D3EE]" />
        <span>MÔ TẢ SẢN PHẨM</span>
      </h2>
    </div>

    <div className="space-y-4 text-xs sm:text-[13px] text-[#CBD5E1] leading-relaxed">
      {product.description && (
        <div className="p-3.5 rounded-[12px] bg-[#11152A] border border-slate-800/80 text-xs sm:text-[13px] text-[#F8FAFC] flex items-start gap-2.5 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] mt-1.5 shrink-0" />
          <p className="font-medium">{product.description}</p>
        </div>
      )}

      {/* 3 Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-0.5">
        <div className="p-3.5 rounded-[12px] bg-[#11152A] border border-slate-800/80 space-y-1.5">
          <h4 className="font-bold text-xs text-[#F8FAFC] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Tính Năng & Tương Thích</span>
          </h4>
          <ul className="space-y-1 text-[11px] text-[#94A3B8] leading-[1.4]">
            <li>● Tương thích 100% phiên bản mới nhất 2026</li>
            <li>● Thuật toán mã hóa chống ban, chống quét an toàn</li>
            <li>● Tối ưu hóa FPS mượt mà, không giật lag</li>
          </ul>
        </div>

        <div className="p-3.5 rounded-[12px] bg-[#11152A] border border-slate-800/80 space-y-1.5">
          <h4 className="font-bold text-xs text-[#F8FAFC] flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#10E6A1]" />
            <span>Giao Nhận Tự Động</span>
          </h4>
          <p className="text-[11px] text-[#94A3B8] leading-[1.4]">
            Hệ thống cấp mã Key kích hoạt và link tải trực tiếp ngay sau khi bấm thanh toán, xem trong mục Đơn Hàng 24/7.
          </p>
        </div>

        <div className="p-3.5 rounded-[12px] bg-[#11152A] border border-slate-800/80 space-y-1.5">
          <h4 className="font-bold text-xs text-[#F8FAFC] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Chính Sách Bảo Hành</span>
          </h4>
          <p className="text-[11px] text-[#94A3B8] leading-[1.4]">
            Hỗ trợ kỹ thuật 24/7 qua Ticket và LiveChat. Cam kết 1 đổi 1 hoặc hoàn tiền ví 100% nếu có lỗi phát sinh.
          </p>
        </div>
      </div>
    </div>
  </section>
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
        <h2 className="text-xl font-bold text-[#F8FAFC]">Không tìm thấy sản phẩm!</h2>
        <button
          type="button"
          onClick={() => navigateToStorefront('products')}
          className="px-5 py-2.5 rounded-[12px] bg-[#22D3EE] text-black font-bold text-xs hover:bg-[#06B6D4] transition-colors cursor-pointer"
        >
          Quay lại danh mục
        </button>
      </div>
    );
  }

  // ==========================================================================
  // PRICING ENGINE RESOLUTION (Single Source of Truth)
  // Logic: ADMIN CONFIG -> USER ROLE (Seller=Member by default) -> SALE OVERRIDE
  // ==========================================================================
  const isSeller =
    currentUser?.role === 'seller' ||
    currentUser?.sellerStatus === 'active' ||
    currentUser?.sellerStatus === 'approved';

  const basePrice = product.basePrice ?? product.price ?? 30000;
  const memberPrice = product.memberPrice ?? basePrice;
  const sellerPrice = product.sellerPrice !== undefined && product.sellerPrice > 0 ? product.sellerPrice : memberPrice;
  const rolePrice = isSeller ? sellerPrice : memberPrice;

  const isProductSale = Boolean(
    product.saleActive && product.salePrice && product.salePrice > 0 && product.salePrice < rolePrice
  );
  const productCurrentPrice = isProductSale && product.salePrice ? product.salePrice : rolePrice;
  const productOriginalPrice = isProductSale ? rolePrice : (product.originalPrice && product.originalPrice > productCurrentPrice ? product.originalPrice : undefined);
  const productDiscountPercent = productOriginalPrice && productOriginalPrice > productCurrentPrice
    ? Math.round(((productOriginalPrice - productCurrentPrice) / productOriginalPrice) * 100)
    : undefined;

  // Service Plans list
  const productPlans: ProductPlan[] =
    product.plans && product.plans.length > 0
      ? product.plans
      : product.packages && product.packages.length > 0
      ? product.packages
      : [];

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    productPlans.length > 0 ? productPlans[0].id : null
  );

  const selectedPlan = productPlans.find((p) => p.id === selectedPlanId) || null;

  // Effective unit price calculation:
  // If plan is chosen, use plan's price. Otherwise use productCurrentPrice (product sale price or role price)
  const effectiveUnitPrice = selectedPlan ? selectedPlan.price : productCurrentPrice;

  const handleBuyNow = () => {
    const total = effectiveUnitPrice * quantity;
    if (currentUser.balance < total) {
      showToast(
        `Số dư ví không đủ (${currentUser.balance.toLocaleString('vi-VN')} VNĐ). Chuyển sang nạp tiền...`,
        'warning'
      );
      navigateToStorefront('account-wallet-deposit');
      return;
    }
    const success = createOrder(product.id, quantity, 'wallet', selectedPlan || undefined);
    if (success) {
      navigateToStorefront('account-orders');
    }
  };

  return (
    <div
      className="w-full mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-5 font-sans"
      style={{ width: 'min(1180px, calc(100% - 32px))', margin: '0 auto' }}
    >
      {/* 1. Header / Breadcrumb */}
      <Breadcrumb
        productName={product.name}
        onNavigateHome={() => navigateToStorefront('home')}
        onNavigateProducts={() => navigateToStorefront('products')}
      />

      {/* 2. Main 2-Column Product Detail Layout (Desktop: minmax(0,1fr) minmax(0,1fr) starting at exact same Y, natural height) */}
      <div
        className="product-main grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-[#0D1020] border border-slate-800/80 rounded-[18px] p-4 sm:p-6 lg:p-7 shadow-2xl shadow-black/50"
        style={{
          display: 'grid',
          alignItems: 'start',
        }}
      >
        {/* CỘT TRÁI: PRODUCT IMAGE + DELIVERY STATUS */}
        <ProductGallery
          product={product}
          isSeller={isSeller}
          discountPercent={productDiscountPercent}
        />

        {/* CỘT PHẢI: CATEGORY -> TITLE -> SOLD/STOCK -> PRICE -> PLANS -> QUANTITY -> BUY -> CART -> TRUST */}
        <ProductInfo
          product={product}
          productPlans={productPlans}
          selectedPlan={selectedPlan}
          onSelectPlan={(plan) => setSelectedPlanId(plan ? plan.id : null)}
          quantity={quantity}
          onQuantityChange={setQuantity}
          productBasePrice={basePrice}
          productCurrentPrice={productCurrentPrice}
          productOriginalPrice={productOriginalPrice}
          isProductSale={isProductSale}
          productDiscountPercent={productDiscountPercent}
          effectiveUnitPrice={effectiveUnitPrice}
          onBuyNow={handleBuyNow}
          onAddToCart={() => addToCart(product, quantity, selectedPlan || undefined)}
        />
      </div>

      {/* 3. Product Description Full-Width Section */}
      <ProductDescription product={product} />
    </div>
  );
};
