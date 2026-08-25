import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Product, ProductPlan } from '../../types';
import { isAccountLikeProduct as isAccountProduct } from '../../utils/productAccount';
import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Key,
  ChevronRight,
  Sparkles,
  Loader2,
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
    className="flex items-center gap-1.5 text-[11px] font-medium text-[#938EB5] py-0.5 leading-[1.4] select-none"
  >
    <button
      type="button"
      onClick={onNavigateHome}
      className="hover:text-white transition-colors duration-200 cursor-pointer rounded"
    >
      Trang chủ
    </button>
    <ChevronRight className="w-3 h-3 text-[#5C567A] shrink-0" />
    <button
      type="button"
      onClick={onNavigateProducts}
      className="hover:text-white transition-colors duration-200 cursor-pointer rounded"
    >
      Sản phẩm
    </button>
    <ChevronRight className="w-3 h-3 text-[#5C567A] shrink-0" />
    <span className="text-[#C084FC] font-semibold truncate max-w-[200px] sm:max-w-[360px] md:max-w-none">
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
  const productImage = product.image || (product.images && product.images[0]) || '';

  return (
    <div className="space-y-2.5 w-full">
      {/* Product Image Card Container */}
      <div className="rounded-3xl glass-standard border border-white/10 p-2 sm:p-3 relative overflow-hidden shadow-2xl w-full">
        <div
          className="product-image-container w-full rounded-2xl glass-subtle relative overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: '16 / 9' }}
        >
          {/* Badges Overlay on Image */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-xl text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider glass-prominent text-[#22D3EE] border border-cyan-500/30 backdrop-blur-md shadow-md">
              {product.category}
            </span>
            {isSeller ? (
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] sm:text-[10.5px] font-bold bg-cyan-500/20 text-[#22D3EE] border border-cyan-500/40 backdrop-blur-md shadow-md">
                Giá Đại Lý / CTV
              </span>
            ) : discountPercent ? (
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] sm:text-[10.5px] font-black bg-red-500/90 text-[#F4F2FF] shadow-md backdrop-blur-md">
                GIẢM {discountPercent}%
              </span>
            ) : null}
          </div>

          {/* Locked aspect-ratio container and cover image */}
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="product-main-image w-full h-full object-cover block transition-transform duration-500 hover:scale-[1.03]"
              style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/35 flex items-center justify-center text-[#C084FC] mb-2 shadow-lg shadow-[#7C3AED]/15">
                <Key className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-medium text-[#938EB5]">Bản Quyền Chính Hãng Thanox</span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Status Card */}
      <div className="delivery-status w-full min-h-[44px] p-2.5 sm:p-3 rounded-2xl glass-subtle border border-white/8 flex items-center justify-between flex-wrap gap-x-2.5 gap-y-1 text-[11px] leading-[1.4] text-[#938EB5]">
        <span className="font-medium text-[#938EB5] shrink-0">Trạng thái giao hàng:</span>
        <span className="text-emerald-300 font-bold flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
          Sẵn sàng giao tự động (24/7)
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 3. SUBCOMPONENT: PRODUCT INFO & CHECKOUT CONTROLS
// ============================================================================
interface ProductInfoProps {
  product: Product;
  productPlans: ProductPlan[];
  selectedPlan: ProductPlan | null;
  onSelectPlan: (plan: ProductPlan | null) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  productCurrentPrice: number;
  productOriginalPrice?: number;
  isProductSale: boolean;
  productDiscountPercent?: number;
  effectiveUnitPrice: number;
  isPurchasing?: boolean;
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
  isPurchasing = false,
  onBuyNow,
  onAddToCart,
}) => {
  const isAcc = isAccountProduct(product);

  return (
    <div className="product-info space-y-2.5 sm:space-y-4 w-full">
      {/* 1. TITLE & CATEGORY CARD */}
      <div className="p-3.5 sm:p-4 rounded-3xl glass-standard border border-white/10 space-y-1 w-full shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-[10px] sm:text-[11px] font-bold text-[#22D3EE] uppercase tracking-wider">
            {product.category}
          </div>
          {isAcc && (
            <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              🎮 TÀI KHOẢN GAME
            </span>
          )}
        </div>
        <h1
          className="product-title font-black text-[#F4F2FF] leading-snug break-words tracking-tight"
          style={{
            fontSize: 'clamp(20px, 2.2vw, 26px)',
            overflowWrap: 'anywhere',
          }}
        >
          {product.name}
        </h1>
      </div>

      {/* 2. SOLD / STOCK CARD */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        <div className="p-3 sm:p-3.5 rounded-2xl glass-subtle border border-white/8 min-h-[68px] sm:min-h-[76px] flex flex-col justify-center shadow-sm">
          <span className="text-[10.5px] sm:text-[11px] font-bold text-[#938EB5] tracking-[0.15px] uppercase block">
            ĐÃ BÁN
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-300 mt-0.5 block leading-none">
            {product.sold ?? product.soldCount ?? 0}
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl glass-subtle border border-white/8 min-h-[68px] sm:min-h-[76px] flex flex-col justify-center shadow-sm">
          <span className="text-[10.5px] sm:text-[11px] font-bold text-[#938EB5] tracking-[0.15px] uppercase block">
            CÒN LẠI TRONG KHO
          </span>
          <span className="text-base sm:text-lg font-black text-[#F4F2FF] mt-0.5 block leading-none">
            {product.stock === 'unlimited' ? '∞ Không giới hạn' : `${product.stock} ${isAcc ? 'Acc' : 'Key'}`}
          </span>
        </div>
      </div>

      {/* 3. PRICE CARD */}
      <div className="p-3.5 sm:p-4 rounded-3xl glass-standard border border-white/10 space-y-1 w-full shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] sm:text-[11px] font-bold text-[#938EB5] tracking-[0.15px] uppercase block">
            GIÁ BÁN NIÊM YẾT
          </span>
          {isProductSale && productDiscountPercent && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-500/90 text-white tracking-wider">
              SALE -{productDiscountPercent}%
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3">
          <div className="current-price text-[28px] sm:text-[32px] font-black text-emerald-300 tracking-tight leading-none">
            {productCurrentPrice.toLocaleString('vi-VN')} <span className="text-sm font-bold">VNĐ</span>
          </div>

          {isProductSale && productOriginalPrice && (
            <div className="text-[12px] sm:text-[13px] font-medium text-[#5C567A] line-through leading-[1.2]">
              {productOriginalPrice.toLocaleString('vi-VN')} VNĐ
            </div>
          )}
        </div>
      </div>

      {/* 4. SERVICE PLANS & CHECKOUT CONTROLS CARD */}
      <div className="p-3.5 sm:p-5 rounded-3xl glass-standard border border-white/10 space-y-3.5 w-full shadow-xl">
        {/* If Account: Show Auto Account Delivery Specs */}
        {isAcc ? (
          <div className="p-3.5 rounded-2xl glass-subtle border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] sm:text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>BÀN GIAO TÀI KHOẢN TỰ ĐỘNG</span>
              </span>
              <span className="text-[10.5px] font-black text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/25">
                100% Cấp Nick Ngay
              </span>
            </div>
            <p className="text-[11px] text-[#938EB5] leading-relaxed">
              Sau khi thanh toán thành công, hệ thống sẽ cấp ngay <strong>Tài khoản | Mật khẩu | Mã 2FA</strong> trong mục Đơn Hàng kèm nút Sao chép 1 chạm.
            </p>
          </div>
        ) : (
          /* If Key/File: Show Service Packages */
          productPlans.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] sm:text-xs font-bold text-[#F4F2FF] uppercase tracking-[0.15px] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>CHỌN GÓI DỊCH VỤ</span>
                </span>
                <span className="text-[11px] font-medium text-[#938EB5]">
                  {productPlans.length} gói thời hạn
                </span>
              </div>

              {/* Plans List */}
              <div className="space-y-2">
                {productPlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => onSelectPlan(plan)}
                      className={`service-plan w-full min-h-[54px] sm:min-h-[56px] px-3.5 sm:px-4 py-3 rounded-2xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer border active:scale-[0.99] ${
                        isSelected
                          ? 'border-2 border-[#7C3AED] bg-[#7C3AED]/15 shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                          : 'glass-subtle border-white/6 hover:border-white/15'
                      }`}
                    >
                      {/* Left: Plan Name */}
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                            isSelected ? 'border-[#C084FC] bg-[#7C3AED]' : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span
                          className={`plan-name text-[13.5px] sm:text-[14px] font-bold uppercase truncate leading-[1.35] ${
                            isSelected ? 'text-[#F4F2FF]' : 'text-[#938EB5]'
                          }`}
                        >
                          {plan.name}
                        </span>
                      </div>

                      {/* Right: Plan Price */}
                      <div className="text-right shrink-0">
                        {plan.originalPrice && plan.originalPrice > plan.price && (
                          <div className="text-[10.5px] font-medium text-[#5C567A] line-through leading-[1.2]">
                            {plan.originalPrice.toLocaleString('vi-VN')}đ
                          </div>
                        )}
                        <span
                          className={`plan-price text-[14.5px] sm:text-[15px] font-black leading-[1.35] ${
                            isSelected ? 'text-emerald-300' : 'text-[#22D3EE]'
                          }`}
                        >
                          {plan.price.toLocaleString('vi-VN')} <span className="text-[11px] font-bold">VNĐ</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* Quantity & Unit Price Card */}
        <div className="p-3 rounded-2xl glass-subtle border border-white/6 flex items-center justify-between text-[11px] leading-[1.4] w-full">
          <div className="space-y-0.5">
            <div className="text-[#938EB5]">
              Đơn giá: <strong className="text-[#F4F2FF] font-bold">{effectiveUnitPrice.toLocaleString('vi-VN')} VNĐ</strong>
            </div>
            <div className="text-[#938EB5]">
              Số lượng: <strong className="text-[#22D3EE] font-bold">x{quantity}</strong>
            </div>
          </div>

          {/* Counter */}
          <div className="flex items-center glass-subtle border border-white/8 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#F4F2FF] font-bold cursor-pointer transition-colors active:scale-90"
              aria-label="Giảm số lượng"
            >
              -
            </button>
            <span className="w-8 text-center text-[13px] font-bold text-[#F4F2FF] select-none">{quantity}</span>
            <button
              type="button"
              onClick={() => {
                const maxStock = typeof product.stock === 'number' ? Math.max(1, product.stock) : 99;
                onQuantityChange(Math.min(maxStock, quantity + 1));
              }}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#F4F2FF] font-bold cursor-pointer transition-colors active:scale-90"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 w-full">
          {/* MUA NGAY Button */}
          <button
            type="button"
            disabled={isPurchasing}
            onClick={onBuyNow}
            className={`buy-button w-full min-h-[52px] sm:min-h-[54px] py-3.5 rounded-2xl btn-liquid-primary text-white font-black uppercase text-[15px] flex items-center justify-center gap-2 transition-all tracking-wide shadow-lg`}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>ĐANG XỬ LÝ ĐƠN HÀNG...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>{isAcc ? 'MUA TÀI KHOẢN NGAY' : 'MUA NGAY'} ({(effectiveUnitPrice * quantity).toLocaleString('vi-VN')} VNĐ)</span>
              </>
            )}
          </button>

          {/* THÊM VÀO GIỎ Button */}
          <button
            type="button"
            onClick={onAddToCart}
            className="cart-button w-full min-h-[46px] py-2.5 rounded-2xl btn-liquid-secondary text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>+ Thêm Vào Giỏ Hàng</span>
          </button>
        </div>

        {/* Trust Features Row */}
        <div className="trust-features grid grid-cols-2 gap-2 pt-2 border-t border-white/6 text-[11px] leading-[1.4] text-[#938EB5]">
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{isAcc ? 'Giao Nick sau 3s' : 'Giao key sau 3s'}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
            <span className="truncate">{isAcc ? 'Bảo hành 1 đổi 1' : 'Bảo hành 100%'}</span>
          </div>
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

const ProductDescription: React.FC<ProductDescriptionProps> = ({ product }) => {
  const isAcc = isAccountProduct(product);

  return (
    <section
      aria-label="Mô tả sản phẩm"
      className="glass-standard border border-white/10 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl w-full"
    >
      <div className="flex items-center gap-2 border-b border-white/6 pb-3">
        <h2 className="font-black text-sm sm:text-base text-[#22D3EE] uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#22D3EE]" />
          <span>MÔ TẢ SẢN PHẨM</span>
        </h2>
      </div>

      <div className="space-y-4 text-xs sm:text-[13px] text-[#E2DEFA] leading-relaxed">
        {product.description && (
          <div className="p-4 rounded-2xl glass-subtle border border-white/6 text-xs sm:text-[13px] text-[#F4F2FF] flex items-start gap-2.5 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] mt-1.5 shrink-0" />
            <p className="font-medium">{product.description}</p>
          </div>
        )}

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0.5">
          <div className="p-4 rounded-2xl glass-subtle border border-white/6 space-y-1.5">
            <h4 className="font-bold text-xs text-[#F4F2FF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>{isAcc ? 'Thông Tin & Trạng Thái Nick' : 'Tính Năng & Tương Thích'}</span>
            </h4>
            <ul className="space-y-1 text-[11px] text-[#938EB5] leading-[1.4]">
              {isAcc ? (
                <>
                  <li>● Tài khoản chuẩn thông tin, đăng nhập an toàn</li>
                  <li>● Không bị khóa, rank và skin nguyên vẹn</li>
                  <li>● Có hỗ trợ đổi mật khẩu sau khi nhận</li>
                </>
              ) : (
                <>
                  <li>● Tương thích 100% phiên bản mới nhất 2026</li>
                  <li>● Thuật toán mã hóa chống ban, chống quét an toàn</li>
                  <li>● Tối ưu hóa FPS mượt mà, không giật lag</li>
                </>
              )}
            </ul>
          </div>

          <div className="p-4 rounded-2xl glass-subtle border border-white/6 space-y-1.5">
            <h4 className="font-bold text-xs text-[#F4F2FF] flex items-center gap-1.5">
              {isAcc ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Key className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Giao Nhận Tự Động</span>
            </h4>
            <p className="text-[11px] text-[#938EB5] leading-[1.4]">
              {isAcc
                ? 'Hệ thống tự động cấp Tài Khoản & Mật Khẩu kèm mã 2FA ngay sau khi thanh toán thành công 24/7.'
                : 'Hệ thống cấp mã Key kích hoạt và link tải trực tiếp ngay sau khi bấm thanh toán, xem trong mục Đơn Hàng 24/7.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-subtle border border-white/6 space-y-1.5">
            <h4 className="font-bold text-xs text-[#F4F2FF] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>Chính Sách Bảo Hành</span>
            </h4>
            <p className="text-[11px] text-[#938EB5] leading-[1.4]">
              {isAcc
                ? 'Bảo hành 1 đổi 1 ngay lập tức nếu có lỗi sai thông tin đăng nhập. Đội ngũ hỗ trợ 24/7 qua Ticket.'
                : 'Hỗ trợ kỹ thuật 24/7 qua Ticket và LiveChat. Cam kết 1 đổi 1 hoặc hoàn tiền ví 100% nếu có lỗi phát sinh.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

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
    isAuthenticated,
    showToast,
    setSelectedOrderId,
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
        <h2 className="text-xl font-black text-[#F4F2FF]">Không tìm thấy sản phẩm!</h2>
        <button
          type="button"
          onClick={() => navigateToStorefront('products')}
          className="px-5 py-2.5 rounded-2xl btn-liquid-primary text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Quay lại danh mục
        </button>
      </div>
    );
  }

  // Pricing Engine Resolution
  const isSeller = false;

  const basePrice = product.basePrice ?? product.price ?? 30000;
  const memberPrice = product.memberPrice ?? basePrice;
  const sellerPrice = product.sellerPrice !== undefined && product.sellerPrice > 0 ? product.sellerPrice : memberPrice;
  const rolePrice = isSeller ? sellerPrice : memberPrice;

  const isProductSale = Boolean(
    (product.isSale ?? product.saleActive) && product.salePrice && product.salePrice > 0 && product.salePrice < rolePrice
  );
  const productCurrentPrice = isProductSale && product.salePrice ? product.salePrice : rolePrice;
  const productOriginalPrice = isProductSale ? rolePrice : undefined;
  const productDiscountPercent = isProductSale && productOriginalPrice && productOriginalPrice > productCurrentPrice
    ? Math.round(((productOriginalPrice - productCurrentPrice) / productOriginalPrice) * 100)
    : undefined;

  const configuredPlans: ProductPlan[] =
    product.plans && product.plans.length > 0
      ? product.plans
      : product.packages && product.packages.length > 0
      ? product.packages
      : [];

  const productPlans: ProductPlan[] =
    configuredPlans.length > 0
      ? configuredPlans
      : isAccountProduct(product)
      ? []
      : [
          {
            id: 'goi-chuan',
            name: 'GÓI CHUẨN',
            price: productCurrentPrice,
          },
        ];

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    productPlans.length > 0 ? productPlans[0].id : null
  );

  const selectedPlan = productPlans.find((p) => p.id === selectedPlanId) || (productPlans.length > 0 ? productPlans[0] : null);
  const effectiveUnitPrice = selectedPlan ? selectedPlan.price : productCurrentPrice;

  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleBuyNow = async () => {
    if (isPurchasing) return;
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản để mua hàng!', 'warning');
      navigateToStorefront('login', `/products/${activeIdOrSlug || product.id}`);
      return;
    }
    setIsPurchasing(true);
    try {
      const res = await createOrder(product.id, quantity, 'wallet', selectedPlan || undefined);
      if (res.success && res.order) {
        showToast('🎉 Mua hàng thành công!', 'success');
        setSelectedOrderId(res.order.id);
        navigateToStorefront('account-orders');
      } else {
        showToast(res.error || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="product-detail-container w-full max-w-[1180px] mx-auto px-1 sm:px-4 md:px-6 py-2 sm:py-4 space-y-3 sm:space-y-5 font-sans relative">
      {/* 1. Header / Breadcrumb */}
      <Breadcrumb
        productName={product.name}
        onNavigateHome={() => navigateToStorefront('home')}
        onNavigateProducts={() => navigateToStorefront('products')}
      />

      {/* 2. Main Product Block */}
      <div className="product-main grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 items-start md:glass-prominent md:border md:border-white/10 md:rounded-3xl md:p-6 lg:p-7 md:shadow-2xl">
        {/* Left Column */}
        <ProductGallery
          product={product}
          isSeller={isSeller}
          discountPercent={productDiscountPercent}
        />

        {/* Right Column */}
        <ProductInfo
          product={product}
          productPlans={productPlans}
          selectedPlan={selectedPlan}
          onSelectPlan={(plan) => setSelectedPlanId(plan ? plan.id : null)}
          quantity={quantity}
          onQuantityChange={setQuantity}
          productCurrentPrice={productCurrentPrice}
          productOriginalPrice={productOriginalPrice}
          isProductSale={isProductSale}
          productDiscountPercent={productDiscountPercent}
          effectiveUnitPrice={effectiveUnitPrice}
          isPurchasing={isPurchasing}
          onBuyNow={handleBuyNow}
          onAddToCart={() => addToCart(product, quantity, selectedPlan || undefined)}
        />
      </div>

      {/* 3. Product Description Full-Width Section */}
      <ProductDescription product={product} />
    </div>
  );
};
