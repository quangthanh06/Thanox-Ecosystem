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
} from 'lucide-react';

// isAccountProduct: import chung từ utils/productAccount (nhận diện acc/nick/gmail
// theo productType, category và cả tên sản phẩm — VD "ACC CLONE LV5")

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
    <span className="text-[#CBD5E1] font-semibold truncate max-w-[200px] sm:max-w-[360px] md:max-w-none">
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
    <div className="space-y-2.5 w-full">
      {/* Product Image Card Container */}
      <div className="rounded-[16px] sm:rounded-[18px] bg-[#0D1020] border border-slate-800/80 p-1.5 sm:p-2.5 relative overflow-hidden shadow-xl shadow-black/40 w-full">
        <div
          className="product-image-container w-full rounded-[12px] sm:rounded-[14px] bg-[#080A14] relative overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: '16 / 9' }}
        >
          {/* Badges Overlay on Image */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-[8px] text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider bg-[#080A14]/90 text-[#22D3EE] border border-[#22D3EE]/30 backdrop-blur-md shadow-md">
              {product.category}
            </span>
            {isSeller ? (
              <span className="px-2.5 py-0.5 rounded-[8px] text-[10px] sm:text-[10.5px] font-bold bg-cyan-500/20 text-[#22D3EE] border border-cyan-500/40 backdrop-blur-md shadow-md">
                Giá Đại Lý / CTV
              </span>
            ) : discountPercent ? (
              <span className="px-2.5 py-0.5 rounded-[8px] text-[10px] sm:text-[10.5px] font-bold bg-red-600/90 text-[#F8FAFC] shadow-md backdrop-blur-md">
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
              style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
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
      <div className="delivery-status w-full min-h-[44px] p-2.5 sm:p-3 rounded-[14px] bg-[#0D1020] border border-slate-800/80 flex items-center justify-between flex-wrap gap-x-2.5 gap-y-1 text-[11px] leading-[1.4] text-[#94A3B8]">
        <span className="font-medium text-[#94A3B8] shrink-0">Trạng thái giao hàng:</span>
        <span className="text-[#10E6A1] font-semibold flex items-center gap-1.5 shrink-0">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#10E6A1] shadow-[0_0_8px_rgba(16,230,161,0.55)] animate-pulse"
            style={{ animation: 'statusPulse 2s ease-in-out infinite' }}
          />
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
  const isAcc = isAccountProduct(product);

  return (
    <div className="product-info space-y-2.5 sm:space-y-4 w-full">
      {/* 1. TITLE & CATEGORY CARD */}
      <div className="p-3.5 sm:p-4 rounded-[16px] bg-[#0D1020] border border-slate-800/80 space-y-1 w-full shadow-lg shadow-black/30">
        <div className="flex items-center justify-between">
          <div className="text-[10px] sm:text-[11px] font-bold text-[#22D3EE] uppercase tracking-wider">
            {product.category}
          </div>
          {isAcc && (
            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              🎮 TÀI KHOẢN GAME
            </span>
          )}
        </div>
        <h1
          className="product-title font-bold text-[#F8FAFC] leading-snug break-words"
          style={{
            fontSize: 'clamp(20px, 2.2vw, 26px)',
            overflowWrap: 'anywhere',
          }}
        >
          {product.name}
        </h1>
      </div>

      {/* 2. SOLD / STOCK CARD (2 Columns Grid) */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        <div className="p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] bg-[#0D1020] border border-slate-800/80 min-h-[68px] sm:min-h-[76px] flex flex-col justify-center shadow-md shadow-black/20">
          <span className="text-[10.5px] sm:text-[11px] font-medium text-[#94A3B8] tracking-[0.15px] uppercase block">
            ĐÃ BÁN
          </span>
          <span className="text-base sm:text-lg font-black text-[#10E6A1] mt-0.5 block leading-none">
            {product.sold ?? product.soldCount ?? 0}
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] bg-[#0D1020] border border-slate-800/80 min-h-[68px] sm:min-h-[76px] flex flex-col justify-center shadow-md shadow-black/20">
          <span className="text-[10.5px] sm:text-[11px] font-medium text-[#94A3B8] tracking-[0.15px] uppercase block">
            CÒN LẠI TRONG KHO
          </span>
          <span className="text-base sm:text-lg font-black text-[#F8FAFC] mt-0.5 block leading-none">
            {product.stock === 'unlimited' ? '∞ Không giới hạn' : `${product.stock} ${isAcc ? 'Acc' : 'Key'}`}
          </span>
        </div>
      </div>

      {/* 3. PRICE CARD */}
      <div className="p-3.5 sm:p-4 rounded-[16px] bg-[#0D1020] border border-slate-800/80 space-y-1 w-full shadow-lg shadow-black/30">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] sm:text-[11px] font-medium text-[#94A3B8] tracking-[0.15px] uppercase block">
            GIÁ BÁN NIÊM YẾT
          </span>
          {isProductSale && productDiscountPercent && (
            <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-extrabold bg-red-600/90 text-white tracking-wider">
              SALE -{productDiscountPercent}%
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3">
          <div className="current-price text-[28px] sm:text-[32px] font-black text-[#22D3EE] tracking-tight leading-none">
            {productCurrentPrice.toLocaleString('vi-VN')} <span className="text-sm font-bold text-[#22D3EE]">VNĐ</span>
          </div>

          {isProductSale && productOriginalPrice && (
            <div className="text-[12px] sm:text-[13px] font-medium text-[#64748B] line-through leading-[1.2]">
              {productOriginalPrice.toLocaleString('vi-VN')} VNĐ
            </div>
          )}
        </div>
      </div>

      {/* 4. SERVICE PLANS & CHECKOUT CONTROLS CARD */}
      <div className="p-3.5 sm:p-5 rounded-[16px] bg-[#0D1020] border border-slate-800/80 space-y-3 w-full shadow-xl shadow-black/40">
        {/* If Account: Show Auto Account Delivery Specs */}
        {isAcc ? (
          <div className="p-3 sm:p-3.5 rounded-[12px] bg-[#080A14] border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] sm:text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>BÀN GIAO TÀI KHOẢN TỰ ĐỘNG</span>
              </span>
              <span className="text-[10.5px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                100% Cấp Nick Ngay
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Sau khi thanh toán thành công, hệ thống sẽ cấp ngay <strong>Tài khoản | Mật khẩu | Mã 2FA</strong> trong mục Đơn Hàng kèm nút Sao chép 1 chạm.
            </p>
          </div>
        ) : (
          /* If Key/File: Show Service Packages */
          productPlans.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] sm:text-xs font-bold text-[#F8FAFC] uppercase tracking-[0.15px] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>CHỌN GÓI DỊCH VỤ</span>
                </span>
                <span className="text-[11px] font-medium text-[#64748B]">
                  {productPlans.length} gói thời hạn
                </span>
              </div>

              {/* Plans List */}
              <div className="space-y-2.5">
                {productPlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => onSelectPlan(plan)}
                      className={`service-plan w-full min-h-[56px] sm:min-h-[58px] px-3.5 sm:px-4 py-3 rounded-[14px] flex items-center justify-between text-left transition-all duration-200 cursor-pointer border focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50 focus-visible:outline-offset-2 ${
                        isSelected
                          ? 'border-2 border-[#10E6A1] bg-[#10E6A1]/[0.08] shadow-[0_0_15px_rgba(16,230,161,0.2)]'
                          : 'bg-[#080A14] border-slate-800/80 hover:border-slate-700 hover:bg-[#11152A]'
                      }`}
                    >
                      {/* Left: Plan Name */}
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                            isSelected ? 'border-[#10E6A1] bg-[#10E6A1]' : 'border-slate-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <span
                          className={`plan-name text-[13.5px] sm:text-[14px] font-bold uppercase truncate leading-[1.35] ${
                            isSelected ? 'text-[#F8FAFC]' : 'text-[#CBD5E1]'
                          }`}
                        >
                          {plan.name}
                        </span>
                      </div>

                      {/* Right: Plan Price */}
                      <div className="text-right shrink-0">
                        {plan.originalPrice && plan.originalPrice > plan.price && (
                          <div className="text-[10.5px] font-medium text-[#64748B] line-through leading-[1.2]">
                            {plan.originalPrice.toLocaleString('vi-VN')}đ
                          </div>
                        )}
                        <span
                          className={`plan-price text-[14.5px] sm:text-[15px] font-black leading-[1.35] ${
                            isSelected ? 'text-[#10E6A1]' : 'text-[#22D3EE]'
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
        <div className="p-3 rounded-[12px] bg-[#080A14] border border-slate-800/90 flex items-center justify-between text-[11px] leading-[1.4] w-full">
          <div className="space-y-0.5">
            <div className="text-[#94A3B8]">
              Đơn giá: <strong className="text-[#F8FAFC] font-bold">{effectiveUnitPrice.toLocaleString('vi-VN')} VNĐ</strong>
            </div>
            <div className="text-[#94A3B8]">
              Số lượng: <strong className="text-[#22D3EE] font-bold">x{quantity}</strong>
            </div>
          </div>

          {/* - 1 + Counter (Touch targets >= 44px) */}
          <div className="flex items-center bg-[#0D1020] border border-slate-700/60 rounded-[10px] p-0.5">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-[8px] hover:bg-white/10 flex items-center justify-center text-[#F8FAFC] font-bold cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50"
              aria-label="Giảm số lượng"
            >
              -
            </button>
            <span className="w-8 text-center text-[13px] font-bold text-[#F8FAFC] select-none">{quantity}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-[8px] hover:bg-white/10 flex items-center justify-center text-[#F8FAFC] font-bold cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 w-full">
          {/* MUA NGAY Button (Full width, min-height 54px on mobile) */}
          <button
            type="button"
            onClick={onBuyNow}
            className="buy-button w-full min-h-[52px] sm:min-h-[54px] py-3.5 rounded-[14px] bg-[#10E6A1] hover:bg-[#05C989] text-black font-black uppercase text-[15px] shadow-[0_4px_20px_rgba(16,230,161,0.25)] flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer tracking-wide focus-visible:outline-2 focus-visible:outline-[#10E6A1]/60 focus-visible:outline-offset-2"
          >
            <ShoppingCart className="w-5 h-5 text-black stroke-[2.5]" />
            <span>{isAcc ? 'MUA TÀI KHOẢN NGAY' : 'MUA NGAY'} ({(effectiveUnitPrice * quantity).toLocaleString('vi-VN')} VNĐ)</span>
          </button>

          {/* THÊM VÀO GIỎ Button */}
          <button
            type="button"
            onClick={onAddToCart}
            className="cart-button w-full min-h-[46px] py-2.5 rounded-[12px] bg-[#11152A] hover:bg-[#181E3B] text-[#CBD5E1] hover:text-white font-bold text-xs sm:text-sm border border-slate-700/40 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#22D3EE]/50 focus-visible:outline-offset-2"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>+ Thêm Vào Giỏ Hàng</span>
          </button>
        </div>

        {/* Trust Features Row */}
        <div className="trust-features grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] leading-[1.4] text-[#94A3B8]">
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10E6A1] shrink-0" />
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
      className="bg-[#0D1020] border border-slate-800/80 rounded-[16px] sm:rounded-[18px] p-4 sm:p-7 space-y-4 shadow-xl shadow-black/40 w-full"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0.5">
          <div className="p-3.5 rounded-[12px] bg-[#11152A] border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-xs text-[#F8FAFC] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>{isAcc ? 'Thông Tin & Trạng Thái Nick' : 'Tính Năng & Tương Thích'}</span>
            </h4>
            <ul className="space-y-1 text-[11px] text-[#94A3B8] leading-[1.4]">
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

          <div className="p-3.5 rounded-[12px] bg-[#11152A] border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-xs text-[#F8FAFC] flex items-center gap-1.5">
              {isAcc ? <ShieldCheck className="w-3.5 h-3.5 text-[#10E6A1]" /> : <Key className="w-3.5 h-3.5 text-[#10E6A1]" />}
              <span>Giao Nhận Tự Động</span>
            </h4>
            <p className="text-[11px] text-[#94A3B8] leading-[1.4]">
              {isAcc
                ? 'Hệ thống tự động cấp Tài Khoản & Mật Khẩu kèm mã 2FA ngay sau khi thanh toán thành công 24/7.'
                : 'Hệ thống cấp mã Key kích hoạt và link tải trực tiếp ngay sau khi bấm thanh toán, xem trong mục Đơn Hàng 24/7.'}
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#11152A] border border-slate-800/80 space-y-1.5">
            <h4 className="font-bold text-xs text-[#F8FAFC] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Chính Sách Bảo Hành</span>
            </h4>
            <p className="text-[11px] text-[#94A3B8] leading-[1.4]">
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
    currentUser,
    isAuthenticated,
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

  // PRICING ENGINE RESOLUTION
  const isSeller =
    currentUser?.role === 'seller' ||
    currentUser?.sellerStatus === 'active' ||
    currentUser?.sellerStatus === 'approved';

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

  // Service Plans list: ưu tiên gói admin cấu hình; nếu chưa có gói nào thì
  // hiển thị 1 gói chuẩn theo giá niêm yết để khách luôn có chỗ chọn (như ảnh mẫu)
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

  // Tự động chọn gói đầu tiên khi danh sách gói tải về sau (async) hoặc đổi sản phẩm
  const selectedPlan = productPlans.find((p) => p.id === selectedPlanId) || (productPlans.length > 0 ? productPlans[0] : null);

  // Effective unit price calculation
  const effectiveUnitPrice = selectedPlan ? selectedPlan.price : productCurrentPrice;

  const handleBuyNow = () => {
    // Guests must log in before buying or topping up
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản để mua hàng!', 'warning');
      navigateToStorefront('login', `/products/${activeIdOrSlug || product.id}`);
      return;
    }
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
    <div className="product-detail-container w-full max-w-[1180px] mx-auto px-1 sm:px-4 md:px-6 py-2 sm:py-4 space-y-3 sm:space-y-5 font-sans">
      {/* 1. Header / Breadcrumb */}
      <Breadcrumb
        productName={product.name}
        onNavigateHome={() => navigateToStorefront('home')}
        onNavigateProducts={() => navigateToStorefront('products')}
      />

      {/* 2. Main Product Block: Mobile (Clean Vertical Stack of Full-Width Cards) | Desktop (2 equal columns) */}
      <div className="product-main grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 items-start md:bg-[#0D1020] md:border md:border-slate-800/80 md:rounded-[22px] md:p-6 lg:p-7 md:shadow-2xl md:shadow-black/50">
        {/* Left Column: Product Gallery / Locked Image Slot */}
        <ProductGallery
          product={product}
          isSeller={isSeller}
          discountPercent={productDiscountPercent}
        />

        {/* Right Column: Product Info & Action Controls */}
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
          onBuyNow={handleBuyNow}
          onAddToCart={() => addToCart(product, quantity, selectedPlan || undefined)}
        />
      </div>

      {/* 3. Product Description Full-Width Section */}
      <ProductDescription product={product} />
    </div>
  );
};
