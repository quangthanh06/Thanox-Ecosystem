import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  ArrowRight,
  Search,
  ShoppingCart,
  ShoppingBag,
  Package,
  CheckCircle2,
  Star,
  Flame,
  Key,
  Download,
  Wallet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getThemeTypography } from '../../utils/themeStyles';
import { useDragScroll } from '../../hooks/useDragScroll';

export const StorefrontHome: React.FC = () => {
  const {
    products,
    categories,
    settings,
    navigateToStorefront,
    addToCart,
    createOrder,
    currentUser,
    showToast,
  } = useStore();

  const themeTypo = getThemeTypography(settings);
  const { dragProps: homeCatDragProps } = useDragScroll<HTMLDivElement>();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Dynamic Banner Customizer Settings from Admin Panel
  const bannerBg = settings.heroBanner?.backgroundImage || '/thanox-master-banner.jpg';
  const bannerBrightness = (settings.heroBanner?.brightness ?? 65) / 100;
  const bannerBlur = settings.heroBanner?.blur ?? 0;
  const bannerOverlayOpacity = (settings.heroBanner?.overlayOpacity ?? 45) / 100;
  const bannerHotline = settings.heroBanner?.hotlineZalo || settings.zaloHotline || '0916396901';

  // Active public products (filter out hidden status)
  const activeProducts = products.filter((p) => p.status !== 'hidden');

  // Auto-slide carousel every 4.5 seconds
  useEffect(() => {
    if (activeProducts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeProducts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeProducts.length]);

  const currentSlide = activeProducts[currentSlideIndex] || activeProducts[0];

  const filteredProducts = activeProducts.filter((p) => {
    const matchesCategory = activeCategoryFilter === 'all' || p.category === activeCategoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(localSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = activeProducts.filter((p) => p.featured);

  const handleQuickBuy = (productId: string, price: number) => {
    if (currentUser.balance < price) {
      showToast(`Số dư ví không đủ (${currentUser.balance.toLocaleString('vi-VN')}đ). Chuyển sang nạp tiền...`, 'warning');
      navigateToStorefront('account-wallet-deposit');
      return;
    }
    const success = createOrder(productId, 1, 'wallet');
    if (success) {
      navigateToStorefront('account-orders');
    }
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. UNIFIED CYBERPUNK HERO PRODUCT SLIDER WITH CUSTOMIZABLE MASTER BANNER */}
      {currentSlide && (
        <section className="relative overflow-hidden rounded-3xl border border-[#7C3AED]/40 shadow-[0_0_50px_rgba(124,58,237,0.25)] p-6 sm:p-10 lg:p-12 min-h-[340px] sm:min-h-[400px] flex flex-col justify-between group">
          {/* Master Cyberpunk Backdrop Image & Atmospheric Lighting */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={bannerBg}
              alt="Thanox Master Background"
              className="w-full h-full object-cover object-center contrast-125 scale-105 group-hover:scale-100 transition-transform duration-1000"
              style={{
                filter: `brightness(${bannerBrightness}) blur(${bannerBlur}px)`,
              }}
            />
            {/* Customizable Dynamic Gradient Overlays for Perfect Contrast */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#070714] via-[#0A0A1E] to-[#070714]"
              style={{
                opacity: bannerOverlayOpacity,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070714] via-transparent to-black/30" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left Content Column (7 cols) */}
            <div key={currentSlide.id} className="lg:col-span-7 space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
              {/* Category Indicator with Top Line */}
              <div className="space-y-1.5">
                <div className="w-8 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#06B6D4]" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#06B6D4] font-display">
                  {currentSlide.category || 'FILE BẢN QUYỀN'}
                </span>
              </div>

              {/* Huge Bold Title with Pure Thanox Digital Gradient (Purple ➔ Pink ➔ Cyan) or Admin Typography */}
              <h1
                style={themeTypo.fontStyle}
                className={`text-3xl sm:text-5xl md:text-6xl ${themeTypo.headingClass} tracking-tight uppercase leading-[1.15] drop-shadow-[0_5px_30px_rgba(124,58,237,0.4)] line-clamp-2`}
              >
                {currentSlide.name}
              </h1>

              {/* Golden / Orange Price with VND */}
              <div className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#FBBF24] tracking-tight flex items-baseline gap-1.5 drop-shadow-md">
                <span>{currentSlide.price.toLocaleString('vi-VN')}</span>
                <span className="text-lg sm:text-2xl font-black text-amber-400">VND</span>
              </div>

              {/* Action Buttons Side-by-Side */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigateToStorefront('product-detail', currentSlide.id)}
                  className="px-6 sm:px-8 py-3.5 rounded-2xl bg-[#14B8A6] hover:bg-[#0D9488] text-black font-black uppercase text-xs sm:text-sm shadow-xl shadow-teal-500/30 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer tracking-wider"
                >
                  <ShoppingBag className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>XEM SẢN PHẨM</span>
                </button>

                {/* Button 2: Dark Glassmorphism Hỗ Trợ Ngay */}
                <button
                  type="button"
                  onClick={() => navigateToStorefront('support')}
                  className="px-6 sm:px-8 py-3.5 rounded-2xl bg-[#0F172A]/85 hover:bg-[#1E293B] border border-white/15 text-white font-extrabold uppercase text-xs sm:text-sm shadow-lg flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer tracking-wider"
                >
                  <Headphones className="w-4 h-4 text-cyan-300" />
                  <span>HỖ TRỢ NGAY</span>
                </button>
              </div>
            </div>

            {/* Right Showcase Image Card (5 cols) */}
            <div className="lg:col-span-5 hidden lg:flex justify-center items-center">
              <div
                onClick={() => navigateToStorefront('product-detail', currentSlide.id)}
                className="relative w-full max-w-2xl aspect-video rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 p-2 shadow-2xl backdrop-blur-md overflow-hidden group/card cursor-pointer hover:border-cyan-400/50 transition-all hover:scale-105"
              >
                {currentSlide.image ? (
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#121220] rounded-2xl p-6 text-center space-y-2">
                    <Package className="w-16 h-16 text-[#06B6D4]" />
                    <span className="text-xs font-bold text-[#CBC7E0]">{currentSlide.name}</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-[#06B6D4] text-xs font-black border border-cyan-500/30">
                  {currentSlide.category}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. TRUST HIGHLIGHTS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#F0EDFF]">Giao Key 3 Giây</div>
            <div className="text-[11px] text-[#8B84A8]">Tự động trả mã ngay</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#F0EDFF]">Bảo Hành 100%</div>
            <div className="text-[11px] text-[#8B84A8]">1 đổi 1 & hỗ trợ key</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#F0EDFF]">Hỗ Trợ 24/7</div>
            <div className="text-[11px] text-[#8B84A8]">Zalo & Telegram trực</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#F0EDFF]">Cộng Đồng 50k+</div>
            <div className="text-[11px] text-[#8B84A8]">Game thủ tin dùng</div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES CAROUSEL / GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`${themeTypo.headingClass} text-lg sm:text-xl flex items-center gap-2 uppercase tracking-wide`}
              style={themeTypo.fontStyle}
            >
              <span>Danh Mục Sản Phẩm</span>
            </h2>
            <p className="text-xs text-[#8B84A8]">Khám phá các danh mục công cụ game phổ biến</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategoryFilter(cat.name);
                navigateToStorefront('products');
              }}
              className="p-4 rounded-2xl bg-[#0F0F1A] border border-white/5 hover:border-[#7C3AED]/40 hover:bg-[#161626] transition-all cursor-pointer text-center group"
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-transparent flex items-center justify-center overflow-hidden group-hover:scale-110 group-hover:border-[#7C3AED]/50 transition-transform shadow-sm">
                {cat.image || (cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:image'))) ? (
                  <img src={cat.image || cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">{cat.icon || '📱'}</span>
                )}
              </div>
              <div className="font-bold text-xs text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors line-clamp-1">
                {cat.name}
              </div>
              <div className="text-[11px] text-[#6B658E] mt-0.5">{cat.count} sản phẩm</div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS (FLASH DEALS) */}
      {featuredProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`${themeTypo.headingClass} text-lg sm:text-xl flex items-center gap-2 uppercase tracking-wide`}
                style={themeTypo.fontStyle}
              >
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>Sản Phẩm Nổi Bật & Bán Chạy</span>
              </h2>
              <p className="text-xs text-[#8B84A8]">Được mua nhiều nhất bởi các game thủ chuyên nghiệp</p>
            </div>
            <button
              onClick={() => navigateToStorefront('products')}
              className="text-xs font-semibold text-[#9D5CF6] hover:text-[#C084FC] transition-colors flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredProducts.slice(0, 3).map((product) => {
              const discount = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : null;

              return (
                <div
                  key={product.id}
                  className="bg-[#0F0F1A] border border-white/10 hover:border-[#7C3AED]/50 rounded-3xl p-4.5 flex flex-col justify-between transition-all group hover:bg-[#131326] shadow-lg shadow-black/40"
                >
                  <div className="space-y-3">
                    {/* Product Cover Thumbnail */}
                    <div
                      onClick={() => navigateToStorefront('product-detail', product.id)}
                      className="relative w-full aspect-video rounded-2xl bg-transparent overflow-hidden cursor-pointer group-hover:border-[#7C3AED]/50 transition-colors"
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#6B658E]">
                          <Package className="w-8 h-8 text-[#9D5CF6]/60" />
                        </div>
                      )}
                      {/* Badges on Image */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/80 backdrop-blur-md text-[#C084FC] border border-purple-500/30">
                        {product.category}
                      </span>
                      {discount && (
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600/90 text-white shadow-md">
                          GIẢM {discount}%
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        onClick={() => navigateToStorefront('product-detail', product.id)}
                        className="font-display font-bold text-sm sm:text-base text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#8B84A8] line-clamp-2 mt-1.5 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {(() => {
                      const basePrice = product.basePrice ?? product.price ?? 0;
                      const memberPrice = product.memberPrice ?? basePrice;
                      const isSeller = currentUser?.role === 'seller' || currentUser?.sellerStatus === 'active' || currentUser?.sellerStatus === 'approved';
                      const rolePrice = isSeller && product.sellerPrice !== undefined && product.sellerPrice > 0 ? product.sellerPrice : memberPrice;
                      const isSale = Boolean(product.saleActive && product.salePrice && product.salePrice > 0 && product.salePrice < rolePrice);
                      const displayPrice = isSale && product.salePrice ? product.salePrice : rolePrice;
                      const displayOriginalPrice = isSale ? rolePrice : (product.originalPrice && product.originalPrice > displayPrice ? product.originalPrice : undefined);

                      return (
                        <>
                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="font-display font-extrabold text-lg text-emerald-400">
                              {displayPrice.toLocaleString('vi-VN')} <span className="text-xs font-bold">VNĐ</span>
                            </span>
                            {displayOriginalPrice && (
                              <span className="text-xs text-[#6B658E] line-through">
                                {displayOriginalPrice.toLocaleString('vi-VN')} VNĐ
                              </span>
                            )}
                            {isSale && (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-red-600/90 text-white">
                                SALE
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-white/5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => addToCart(product)}
                              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                            >
                              Thêm Giỏ
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleQuickBuy(product.id, displayPrice)}
                            >
                              Mua Ngay
                            </Button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. ALL PRODUCTS WITH SEARCH & FILTER TABS */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2
              className={`${themeTypo.headingClass} text-lg sm:text-xl uppercase tracking-wide`}
              style={themeTypo.fontStyle}
            >
              Tất Cả Sản Phẩm & Key Bản Quyền
            </h2>
            <p className="text-xs text-[#8B84A8]">
              Hiển thị {filteredProducts.length} sản phẩm sẵn sàng kích hoạt
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8B84A8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm file, menu, acc..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
        </div>

        {/* Category Filter Pills with Mouse Drag & Wheel Scrolling Support */}
        <div
          {...homeCatDragProps}
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar"
        >
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategoryFilter === 'all'
                ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30'
                : 'bg-[#0F0F1A] text-[#8B84A8] hover:text-white border border-white/5'
            }`}
          >
            Tất Cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategoryFilter(c.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeCategoryFilter === c.name
                  ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30'
                  : 'bg-[#0F0F1A] text-[#8B84A8] hover:text-white border border-white/5'
              }`}
            >
              {c.image || (c.icon && (c.icon.startsWith('http') || c.icon.startsWith('data:image'))) ? (
                <img src={c.image || c.icon} alt={c.name} className="w-3.5 h-3.5 rounded-full object-cover" />
              ) : (
                <span>{c.icon}</span>
              )}
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8B84A8] bg-[#0F0F1A] border border-dashed border-white/5 rounded-2xl">
            Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-[#0F0F1A] border border-white/5 hover:border-[#7C3AED]/40 rounded-3xl p-4 sm:p-4.5 flex flex-col justify-between transition-all group hover:bg-[#121224] shadow-md shadow-black/20"
              >
                <div className="space-y-2.5">
                  {/* Product Thumbnail Banner */}
                  <div
                    onClick={() => navigateToStorefront('product-detail', prod.id)}
                    className="relative w-full aspect-video rounded-2xl bg-transparent overflow-hidden cursor-pointer group-hover:border-[#7C3AED]/50 transition-colors"
                  >
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#6B658E]">
                        <Package className="w-7 h-7 text-[#9D5CF6]/50" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-black/80 backdrop-blur-md text-[#9D5CF6] border border-purple-500/30">
                      {prod.category}
                    </span>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/80 text-emerald-400">
                      Đã bán: {prod.soldCount}
                    </span>
                  </div>

                  <h4
                    onClick={() => navigateToStorefront('product-detail', prod.id)}
                    className="font-display font-bold text-xs sm:text-sm text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors cursor-pointer line-clamp-2"
                  >
                    {prod.name}
                  </h4>

                  <p className="text-[11.5px] text-[#6B658E] line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>

                  {(() => {
                    const basePrice = prod.basePrice ?? prod.price ?? 0;
                    const memberPrice = prod.memberPrice ?? basePrice;
                    const isSeller = currentUser?.role === 'seller' || currentUser?.sellerStatus === 'active' || currentUser?.sellerStatus === 'approved';
                    const rolePrice = isSeller && prod.sellerPrice !== undefined && prod.sellerPrice > 0 ? prod.sellerPrice : memberPrice;
                    const isSale = Boolean((prod.isSale ?? prod.saleActive) && prod.salePrice && prod.salePrice > 0 && prod.salePrice < rolePrice);
                    const displayPrice = isSale && prod.salePrice ? prod.salePrice : rolePrice;
                    const displayOriginalPrice = isSale ? rolePrice : undefined;

                    return (
                      <>
                        <div className="pt-1 flex items-baseline gap-2">
                          <div className="font-display font-extrabold text-base text-emerald-400">
                            {displayPrice.toLocaleString('vi-VN')} <span className="text-xs font-bold">VNĐ</span>
                          </div>
                          {displayOriginalPrice && (
                            <span className="text-[11px] text-[#6B658E] line-through">
                              {displayOriginalPrice.toLocaleString('vi-VN')} VNĐ
                            </span>
                          )}
                          {isSale && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-600/90 text-white">
                              SALE
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 mt-3 border-t border-white/5">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => addToCart(prod)}
                            className="justify-center"
                          >
                            + Giỏ Hàng
                          </Button>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleQuickBuy(prod.id, displayPrice)}
                            className="justify-center font-bold"
                          >
                            Mua Ngay
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. STEP-BY-STEP PROCESS */}
      <section className="bg-[#0F0F1A] border border-white/10 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h3
            style={themeTypo.fontStyle}
            className={`text-xl sm:text-2xl ${themeTypo.headingClass}`}
          >
            Quy Trình Mua Hàng & Nhận Key 3 Bước
          </h3>
          <p className="text-xs text-[#8B84A8]">Hệ thống vận hành tự động 100% không cần chờ đợi thủ công</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 rounded-2xl bg-[#161626] border border-white/5 text-center space-y-3 relative group hover:border-[#7C3AED]/50 transition-all shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-lg mx-auto shadow-md">
              <span className={themeTypo.headingClass}>1</span>
            </div>
            <h4
              style={themeTypo.fontStyle}
              className={`text-sm ${themeTypo.headingClass}`}
            >
              1. Nạp Tiền Ví VietQR
            </h4>
            <p className="text-xs text-[#8B84A8] leading-relaxed">
              Quét mã VietQR tự động. Tiền vào ví chỉ sau 1-3 phút.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161626] border border-white/5 text-center space-y-3 relative group hover:border-[#06B6D4]/50 transition-all shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-lg mx-auto shadow-md">
              <span className={themeTypo.headingClass}>2</span>
            </div>
            <h4
              style={themeTypo.fontStyle}
              className={`text-sm ${themeTypo.headingClass}`}
            >
              2. Chọn Sản Phẩm & Mua
            </h4>
            <p className="text-xs text-[#8B84A8] leading-relaxed">
              Nhấn Mua Ngay để thanh toán tức thì bằng số dư ví tài khoản.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161626] border border-white/5 text-center space-y-3 relative group hover:border-emerald-500/50 transition-all shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg mx-auto shadow-md">
              <span className={themeTypo.headingClass}>3</span>
            </div>
            <h4
              style={themeTypo.fontStyle}
              className={`text-sm ${themeTypo.headingClass}`}
            >
              3. Nhận Key & Tải File
            </h4>
            <p className="text-xs text-[#8B84A8] leading-relaxed">
              Mã kích hoạt hoặc link tải hiển thị ngay trong mục Đơn Hàng.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
