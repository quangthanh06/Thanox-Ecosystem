import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { GlassButton } from '../ui/GlassButton';
import {
  ShieldCheck,
  Headphones,
  ArrowRight,
  Search,
  ShoppingCart,
  ShoppingBag,
  Package,
  Flame,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Zap,
} from 'lucide-react';
import { getThemeTypography } from '../../utils/themeStyles';
import { useDragScroll } from '../../hooks/useDragScroll';
import { ThanoxMascot } from '../ui/ThanoxMascot';
import { LiveDepositAndFeedback } from './LiveDepositAndFeedback';
import { preloadProductImageList } from '../../utils/imageOptimizer';
import { ProductImage, CategoryIcon } from '../ui/SafeImage';

export const StorefrontHome: React.FC = () => {
  const {
    products,
    categories,
    settings,
    navigateToStorefront,
    addToCart,
    currentUser,
    isAuthenticated,
    setSelectedOrderId,
    showToast,
  } = useStore();

  // Instant Image Pre-caching to eliminate mobile network latency
  useEffect(() => {
    if (products && products.length > 0) {
      preloadProductImageList(products.map((p) => p.image));
    }
  }, [products]);

  const themeTypo = getThemeTypography(settings);
  const { dragProps: homeCatDragProps } = useDragScroll<HTMLDivElement>();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [heroMousePos, setHeroMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
    setHeroMousePos({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setHeroMousePos({ x: 0, y: 0 });
  };

  // Dynamic Banner Customizer Settings from Admin Panel
  const bannerBg = settings.heroBanner?.backgroundImage || '/gojo-eyes-banner.jpg';
  const bannerVideo = settings.heroBanner?.backgroundVideo || '';
  const isVideoBanner = (settings.heroBanner?.backgroundType === 'video' || (bannerBg && (bannerBg.endsWith('.mp4') || bannerBg.endsWith('.webm')))) && (bannerVideo || bannerBg);
  const activeVideoSrc = bannerVideo || bannerBg;
  const bannerBrightness = (settings.heroBanner?.brightness ?? 65) / 100;
  const bannerBlur = settings.heroBanner?.blur ?? 0;
  const bannerOverlayOpacity = (settings.heroBanner?.overlayOpacity ?? 45) / 100;

  // Active public products (filter out hidden status)
  const activeProducts = products.filter((p) => p.status !== 'hidden');

  // Auto-slide carousel every 4.5 seconds
  useEffect(() => {
    if (activeProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeProducts.length);
    }, 4500);
    return () => clearInterval(interval);
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

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. iOS 27 LIQUID GLASS HERO PRODUCT SLIDER WITH 4K LIVE MOTION */}
      {currentSlide && (
        <section
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="relative overflow-hidden rounded-3xl glass-prominent border border-white/14 shadow-[0_30px_70px_rgba(0,0,0,0.85)] p-6 sm:p-10 lg:p-12 min-h-[340px] sm:min-h-[400px] flex flex-col justify-between group"
        >
          {/* Master 4K Live Motion Backdrop */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div
              className="w-full h-full relative transition-transform duration-700 ease-out"
              style={{
                transform: `translate3d(${heroMousePos.x}px, ${heroMousePos.y}px, 0)`,
              }}
            >
              {isVideoBanner ? (
                <video
                  key={activeVideoSrc}
                  src={activeVideoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center contrast-125 scale-105"
                  style={{
                    filter: `brightness(${bannerBrightness}) blur(${bannerBlur}px)`,
                  }}
                />
              ) : (
                <img
                  src={bannerBg}
                  alt="Thanox Master 4K Live Background"
                  className="w-full h-full object-cover object-center contrast-125 live-motion-image-4k"
                  style={{
                    filter: `brightness(${bannerBrightness}) blur(${bannerBlur}px)`,
                  }}
                />
              )}
            </div>

            {/* Darkened Gradient Overlays for Readability & Seamless Tablet Framing */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#07070D] via-[#0D0D1A]/80 to-[#07070D]/70"
              style={{
                opacity: bannerOverlayOpacity,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070D] via-transparent to-black/35" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
            {/* Left Content Column (7 cols on desktop) */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-5">
              {/* 1. Dynamic Slide Content with stabilized height to prevent CTA jumping */}
              <div className="min-h-[160px] sm:min-h-[190px] flex flex-col justify-center">
                <div
                  key={`hero-text-${currentSlide.id}`}
                  className="space-y-2.5 sm:space-y-3 animate-in fade-in slide-in-from-left-2 duration-300"
                >
                  {/* Eyebrow / Mascot & AI Status Row */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <ThanoxMascot size="xs" isAnimated className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full glass-subtle border border-white/8 text-[11px] font-semibold text-[#938EB5] shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] shadow-[0_0_6px_#06B6D4] animate-pulse" />
                      <span className="text-[#F4F2FF] font-bold">THANOX AI</span>
                      <span className="text-white/20">•</span>
                      <span className="text-[#22D3EE] font-bold">TRỰC TUYẾN</span>
                    </div>

                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#C084FC] glass-subtle px-2.5 py-0.5 rounded-full border border-purple-500/20">
                      {currentSlide.category || 'BẢN QUYỀN'}
                    </span>
                  </div>

                  {/* High-Impact Bold Title */}
                  <h1
                    className="text-3xl sm:text-5xl lg:text-[46px] font-black text-[#F4F2FF] tracking-tight leading-[1.12] line-clamp-2 drop-shadow-md uppercase"
                  >
                    {currentSlide.name}
                  </h1>

                  {/* Price Display with Tabular Numbers */}
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="font-display font-black text-2xl sm:text-4xl lg:text-[38px] text-[#FBBF24] tabular-nums tracking-tight drop-shadow-sm">
                      {currentSlide.price.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-sm sm:text-xl font-black text-amber-400 tracking-wide">
                      VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Desktop Persistent Fixed CTA Action Row (Never re-mounts / Never jumps) */}
              <div className="hidden lg:flex items-center gap-3 pt-1">
                <GlassButton
                  type="button"
                  size="default"
                  onClick={() => navigateToStorefront('product-detail', currentSlide.id)}
                  contentClassName="flex items-center gap-2 font-black"
                >
                  <ShoppingBag className="w-4 h-4 text-cyan-300" />
                  <span>Xem Sản Phẩm</span>
                </GlassButton>

                <button
                  type="button"
                  onClick={() => navigateToStorefront('support')}
                  className="px-6 py-3 rounded-full btn-liquid-secondary font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all min-h-[44px] border border-white/10"
                >
                  <Headphones className="w-4 h-4 text-[#22D3EE]" />
                  <span>Hỗ Trợ Ngay</span>
                </button>
              </div>
            </div>

            {/* Right Showcase Image Card (Floating Product Showcase) */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div
                onClick={() => navigateToStorefront('product-detail', currentSlide.id)}
                className="relative w-full max-w-md aspect-video sm:aspect-[16/10] rounded-3xl glass-elevated p-2 sm:p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.85)] border border-white/14 group/showcase cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:-translate-y-1"
              >
                {/* Ambient glow behind product image */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1B1B38]/70 via-[#0F0F20]/80 to-[#07070D] z-0" />
                <div className="absolute inset-2 rounded-2xl bg-[#7C3AED]/12 blur-2xl group-hover/showcase:bg-[#06B6D4]/18 transition-all duration-500 pointer-events-none" />

                <div
                  key={`hero-img-${currentSlide.id}`}
                  className="w-full h-full relative z-10 rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center animate-in fade-in zoom-in-95 duration-300"
                >
                  {currentSlide.image ? (
                    <img
                      src={currentSlide.image}
                      alt={currentSlide.name}
                      className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover/showcase:scale-105"
                      style={{ aspectRatio: '16 / 10', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center glass-subtle rounded-2xl p-6 text-center space-y-2">
                      <Package className="w-12 h-12 text-[#06B6D4]" />
                      <span className="text-xs font-bold text-[#938EB5] line-clamp-1">{currentSlide.name}</span>
                    </div>
                  )}
                </div>

                {/* Floating Product Badge */}
                <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-xl glass-prominent text-[#22D3EE] text-[11px] font-bold border border-cyan-500/30 shadow-md z-20">
                  {currentSlide.category}
                </div>
              </div>
            </div>

            {/* Mobile Persistent Fixed CTA Action Row (< lg) */}
            <div className="lg:hidden flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1 w-full">
              <GlassButton
                type="button"
                size="default"
                onClick={() => navigateToStorefront('product-detail', currentSlide.id)}
                className="w-full sm:w-auto flex-1"
                contentClassName="flex items-center justify-center gap-2 font-black"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-300" />
                <span>Xem Sản Phẩm</span>
              </GlassButton>

              <button
                type="button"
                onClick={() => navigateToStorefront('support')}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-full btn-liquid-secondary font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all min-h-[44px] border border-white/10"
              >
                <Headphones className="w-4 h-4 text-[#22D3EE]" />
                <span>Hỗ Trợ Ngay</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. TRUST HIGHLIGHTS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl glass-subtle border border-white/8 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#F4F2FF]">Giao Key 3 Giây</div>
            <div className="text-[11px] text-[#938EB5]">Tự động trả mã ngay</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-subtle border border-white/8 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center text-emerald-300 flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#F4F2FF]">Bảo Hành 100%</div>
            <div className="text-[11px] text-[#938EB5]">1 đổi 1 & hỗ trợ key</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-subtle border border-white/8 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/12 border border-blue-500/25 flex items-center justify-center text-blue-300 flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#F4F2FF]">Hỗ Trợ 24/7</div>
            <div className="text-[11px] text-[#938EB5]">Zalo & Telegram trực</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-subtle border border-white/8 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/12 border border-purple-500/25 flex items-center justify-center text-[#C084FC] flex-shrink-0 shadow-[0_0_10px_rgba(124,58,237,0.2)]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#F4F2FF]">Cộng Đồng 50k+</div>
            <div className="text-[11px] text-[#938EB5]">Game thủ tin dùng</div>
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
            <p className="text-xs text-[#938EB5]">Khám phá các danh mục công cụ game phổ biến</p>
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
              className="p-4 rounded-2xl glass-subtle hover:glass-standard border border-white/8 hover:border-[#7C3AED]/40 transition-all cursor-pointer text-center group active:scale-95"
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl glass-pill flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform shadow-sm">
                <CategoryIcon icon={cat.icon} image={cat.image} name={cat.name} className="w-full h-full" />
              </div>
              <div className="font-bold text-xs text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors line-clamp-1">
                {cat.name}
              </div>
              <div className="text-[11px] text-[#938EB5] mt-0.5">{cat.count} sản phẩm</div>
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
              <p className="text-xs text-[#938EB5]">Được mua nhiều nhất bởi các game thủ chuyên nghiệp</p>
            </div>
            <button
              onClick={() => navigateToStorefront('products')}
              className="text-xs font-semibold text-[#C084FC] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
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
                  className="glass-standard hover:glass-elevated border border-white/10 hover:border-[#7C3AED]/40 rounded-3xl p-4.5 flex flex-col justify-between transition-all group shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Product Cover Thumbnail */}
                    <div
                      onClick={() => navigateToStorefront('product-detail', product.id)}
                      className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-pointer group-hover:border-[#7C3AED]/40 transition-colors"
                    >
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        fallbackCategory={product.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Badges on Image */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold glass-prominent text-[#C084FC] border border-purple-500/30">
                        {product.category}
                      </span>
                      {discount && (
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/90 text-white shadow-md">
                          GIẢM {discount}%
                        </span>
                      )}

                      {/* View Details Overlay */}
                      <div className="absolute inset-0 z-[5] flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToStorefront('product-detail', product.id);
                          }}
                          className="pointer-events-auto px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-black font-extrabold text-xs uppercase tracking-wide shadow-2xl border border-white/80 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
                        >
                          <Eye className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                          <span className="text-black font-extrabold">Xem Chi Tiết</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3
                        onClick={() => navigateToStorefront('product-detail', product.id)}
                        className="font-display font-bold text-sm sm:text-base text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#938EB5] line-clamp-2 mt-1.5 leading-relaxed">
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
                            <span className="font-display font-black text-lg text-emerald-300">
                              {displayPrice.toLocaleString('vi-VN')} <span className="text-xs font-bold">VNĐ</span>
                            </span>
                            {displayOriginalPrice && (
                              <span className="text-xs text-[#5C567A] line-through">
                                {displayOriginalPrice.toLocaleString('vi-VN')} VNĐ
                              </span>
                            )}
                            {isSale && (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-red-500/90 text-white">
                                SALE
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-white/6">
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
                              onClick={() => navigateToStorefront('product-detail', product.id)}
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
            <p className="text-xs text-[#938EB5]">
              Hiển thị {filteredProducts.length} sản phẩm sẵn sàng kích hoạt
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#938EB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm file, menu, acc..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full glass-input rounded-2xl pl-9.5 pr-4 py-2.5 text-xs text-[#F4F2FF] placeholder-[#5C567A]"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          {...homeCatDragProps}
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar"
        >
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
              activeCategoryFilter === 'all'
                ? 'btn-liquid-primary shadow-md'
                : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
            }`}
          >
            Tất Cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategoryFilter(c.name)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 ${
                activeCategoryFilter === c.name
                  ? 'btn-liquid-primary shadow-md'
                  : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
              }`}
            >
              <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
                <CategoryIcon icon={c.icon} image={c.image} name={c.name} className="w-full h-full" />
              </div>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#938EB5] glass-subtle border border-dashed border-white/10 rounded-3xl">
            Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="glass-standard hover:glass-elevated border border-white/8 hover:border-[#7C3AED]/40 rounded-3xl p-4 sm:p-4.5 flex flex-col justify-between transition-all group shadow-md"
              >
                <div className="space-y-2.5">
                  {/* Product Thumbnail Banner */}
                  <div
                    onClick={() => navigateToStorefront('product-detail', prod.id)}
                    className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-pointer group-hover:border-[#7C3AED]/40 transition-colors"
                  >
                    <ProductImage
                      src={prod.image}
                      alt={prod.name}
                      fallbackCategory={prod.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9.5px] font-bold glass-prominent text-[#C084FC] border border-purple-500/30">
                      {prod.category}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-bold glass-prominent text-emerald-300">
                      Đã bán: {prod.soldCount}
                    </span>

                    {/* View Detail Overlay */}
                    <div className="absolute inset-0 z-[5] flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToStorefront('product-detail', prod.id);
                        }}
                        className="pointer-events-auto px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-black font-extrabold text-xs uppercase tracking-wide shadow-2xl border border-white/80 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
                      >
                        <Eye className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                        <span className="text-black font-extrabold">Xem Chi Tiết</span>
                      </button>
                    </div>
                  </div>

                  <h4
                    onClick={() => navigateToStorefront('product-detail', prod.id)}
                    className="font-display font-bold text-xs sm:text-sm text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors cursor-pointer line-clamp-2"
                  >
                    {prod.name}
                  </h4>

                  <p className="text-[11.5px] text-[#938EB5] line-clamp-2 leading-relaxed">
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
                          <div className="font-display font-black text-base text-emerald-300">
                            {displayPrice.toLocaleString('vi-VN')} <span className="text-xs font-bold">VNĐ</span>
                          </div>
                          {displayOriginalPrice && (
                            <span className="text-[11px] text-[#5C567A] line-through">
                              {displayOriginalPrice.toLocaleString('vi-VN')} VNĐ
                            </span>
                          )}
                          {isSale && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-500/90 text-white">
                              SALE
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3.5 mt-3 border-t border-white/6">
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
                            onClick={() => navigateToStorefront('product-detail', prod.id)}
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
      <section className="glass-standard border border-white/10 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h3
            style={themeTypo.fontStyle}
            className={`text-xl sm:text-2xl font-black ${themeTypo.headingClass}`}
          >
            Quy Trình Mua Hàng & Nhận Key 3 Bước
          </h3>
          <p className="text-xs text-[#938EB5]">Hệ thống vận hành tự động 100% không cần chờ đợi thủ công</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          <div className="p-6 rounded-2xl glass-subtle border border-white/8 text-center space-y-3 relative group hover:border-[#7C3AED]/40 transition-all shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-lg mx-auto shadow-md">
              <span className={themeTypo.headingClass}>1</span>
            </div>
            <h4
              style={themeTypo.fontStyle}
              className={`text-sm font-bold ${themeTypo.headingClass}`}
            >
              1. Nạp Tiền Ví VietQR
            </h4>
            <p className="text-xs text-[#938EB5] leading-relaxed">
              Quét mã VietQR tự động. Tiền vào ví chỉ sau 1-3 phút.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-subtle border border-white/8 text-center space-y-3 relative group hover:border-[#06B6D4]/40 transition-all shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-lg mx-auto shadow-md">
              <span className={themeTypo.headingClass}>2</span>
            </div>
            <h4
              style={themeTypo.fontStyle}
              className={`text-sm font-bold ${themeTypo.headingClass}`}
            >
              2. Chọn Sản Phẩm & Mua
            </h4>
            <p className="text-xs text-[#938EB5] leading-relaxed">
              Nhấn Mua Ngay để thanh toán tức thì bằng số dư ví tài khoản.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-subtle border border-white/8 text-center space-y-3 relative group hover:border-emerald-500/40 transition-all shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg mx-auto shadow-md">
              <span className={themeTypo.headingClass}>3</span>
            </div>
            <h4
              style={themeTypo.fontStyle}
              className={`text-sm font-bold ${themeTypo.headingClass}`}
            >
              3. Nhận Key & Tải File
            </h4>
            <p className="text-xs text-[#938EB5] leading-relaxed">
              Mã kích hoạt hoặc link tải hiển thị ngay trong mục Đơn Hàng.
            </p>
          </div>
        </div>
      </section>

      {/* 7. LIVE DEPOSIT STREAM & COMMUNITY FEEDBACK */}
      <LiveDepositAndFeedback />
    </div>
  );
};
