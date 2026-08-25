import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import {
  Search,
  Package,
  Eye,
  Zap,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { getThemeTypography } from '../../utils/themeStyles';
import { useDragScroll } from '../../hooks/useDragScroll';
import { preloadProductImageList } from '../../utils/imageOptimizer';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Bán Chạy Nhất', icon: '🔥' },
  { value: 'newest', label: 'Mới Nhất', icon: '✨' },
  { value: 'price-asc', label: 'Giá Thấp → Cao', icon: '📈' },
  { value: 'price-desc', label: 'Giá Cao → Thấp', icon: '📉' },
];

export const StorefrontProducts: React.FC = () => {
  const {
    products,
    categories,
    searchQuery,
    setSearchQuery,
    navigateToStorefront,
    addToCart,
    createOrder,
    currentUser,
    isAuthenticated,
    setSelectedOrderId,
    showToast,
    settings,
  } = useStore();

  React.useEffect(() => {
    if (products && products.length > 0) {
      preloadProductImageList(products.map((p) => p.image));
    }
  }, [products]);

  const themeTypo = getThemeTypography(settings);
  const { dragProps: catDragProps } = useDragScroll<HTMLDivElement>();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filter & Search logic
  const filteredProducts = products.filter((p) => {
    if (p.status === 'hidden') return false;

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Sort logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
    // Default popular
    return (b.soldCount || 0) - (a.soldCount || 0);
  });

  const currentSortOption = SORT_OPTIONS.find((s) => s.value === sortBy) || SORT_OPTIONS[0];

  const handleBuyNow = async (productId: string) => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để mua hàng', 'error');
      navigateToStorefront('login');
      return;
    }

    setPurchasingId(productId);
    try {
      const res = await createOrder(productId, 1, 'wallet');
      if (res?.success && res?.order) {
        showToast('🎉 Mua hàng thành công!', 'success');
        setSelectedOrderId(res.order.id);
        navigateToStorefront('account-orders');
      } else {
        showToast(res?.error || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
      }
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* Breadcrumb & Header Title */}
      <div className="border-b border-white/6 pb-4">
        <div className="flex items-center gap-2 text-[11px] text-[#938EB5] mb-1.5">
          <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
            Trang Chủ
          </button>
          <span>/</span>
          <span className="text-[#C084FC] font-semibold">Tất Cả Sản Phẩm</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1
              className={`${themeTypo.headingClass} text-xl sm:text-3xl tracking-tight uppercase font-black`}
              style={themeTypo.fontStyle}
            >
              Kho Sản Phẩm & Key Bản Quyền
            </h1>
            <p className="text-[11px] sm:text-xs text-[#938EB5] mt-0.5">
              Hệ thống tối ưu game, file mod an toàn và proxy tốc độ cao 24/7
            </p>
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#938EB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhanh file, key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input rounded-2xl pl-9 pr-3.5 py-2 text-xs text-[#F4F2FF] placeholder-[#5C567A]"
              />
            </div>

            {/* Custom Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 glass-subtle hover:bg-white/10 border border-white/8 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#F4F2FF] transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>{currentSortOption.icon}</span>
                <span className="whitespace-nowrap">{currentSortOption.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#938EB5] transition-transform ${isSortOpen ? 'rotate-180 text-[#C084FC]' : ''}`} />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 glass-prominent border border-white/12 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value as any);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          sortBy === opt.value
                            ? 'btn-liquid-primary shadow-sm'
                            : 'text-[#938EB5] hover:text-[#F4F2FF] hover:bg-white/5'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1. HORIZONTAL TOUCH-FRIENDLY CATEGORY BAR */}
      <div
        {...catDragProps}
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0"
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
            selectedCategory === 'all'
              ? 'btn-liquid-primary shadow-md'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          Tất Cả ({products.filter((p) => p.status !== 'hidden').length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 ${
              selectedCategory === cat.name
                ? 'btn-liquid-primary shadow-md'
                : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
            }`}
          >
            {cat.image || (cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:image'))) ? (
              <img src={cat.image || cat.icon} alt={cat.name} className="w-3.5 h-3.5 rounded-full object-cover" />
            ) : (
              <span>{cat.icon || '📁'}</span>
            )}
            <span>{cat.name}</span>
            <span className="text-[10px] opacity-70">
              ({products.filter((p) => p.category === cat.name && p.status !== 'hidden').length})
            </span>
          </button>
        ))}
      </div>

      {/* 2. PRODUCT GRID (iOS 27 Liquid Glass Product Cards) */}
      {sortedProducts.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#938EB5] glass-subtle border border-dashed border-white/10 rounded-3xl">
          Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {sortedProducts.map((product: Product) => {
            const isSeller = currentUser?.role === 'seller' || currentUser?.sellerStatus === 'active' || currentUser?.sellerStatus === 'approved';
            const basePrice = product.basePrice ?? product.price ?? 0;
            const memberPrice = product.memberPrice ?? basePrice;
            const rolePrice = isSeller && product.sellerPrice !== undefined && product.sellerPrice > 0 ? product.sellerPrice : memberPrice;
            const isSale = Boolean((product.isSale ?? product.saleActive) && product.salePrice && product.salePrice > 0 && product.salePrice < rolePrice);
            const effectivePrice = isSale && product.salePrice ? product.salePrice : rolePrice;
            const originalDisplayPrice = isSale ? rolePrice : (product.originalPrice && product.originalPrice > effectivePrice ? product.originalPrice : undefined);
            const discount = originalDisplayPrice
              ? Math.round(((originalDisplayPrice - effectivePrice) / originalDisplayPrice) * 100)
              : null;

            return (
              <div
                key={product.id}
                className="glass-standard hover:glass-elevated border border-white/8 hover:border-[#7C3AED]/40 rounded-3xl p-4 sm:p-4.5 flex flex-col justify-between transition-all group shadow-md"
              >
                <div className="space-y-3">
                  {/* Thumbnail Cover with Badge */}
                  <div
                    onClick={() => navigateToStorefront('product-detail', product.id)}
                    className="relative aspect-video rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer group-hover:border-[#7C3AED]/30 transition-colors"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 image-skeleton-shimmer"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl glass-subtle flex items-center justify-center text-[#C084FC] font-bold">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                      <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold glass-prominent text-[#C084FC] border border-purple-500/30">
                        {product.category}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      {isSeller ? (
                        <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                          CTV
                        </span>
                      ) : discount ? (
                        <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-md">
                          -{discount}%
                        </span>
                      ) : null}
                    </div>

                    {/* View Detail Overlay */}
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

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => navigateToStorefront('product-detail', product.id)}
                      className="font-display font-bold text-sm text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors cursor-pointer line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-[#938EB5] line-clamp-2 leading-relaxed mt-1">
                      {product.description || 'Giao key và link tải file tự động sau 3 giây.'}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="pt-1 flex items-baseline justify-between">
                    <div>
                      <div className="font-display font-black text-base sm:text-lg text-emerald-300">
                        {effectivePrice.toLocaleString('vi-VN')} <span className="text-[11px] font-bold">VND</span>
                      </div>
                      {originalDisplayPrice && originalDisplayPrice > effectivePrice && (
                        <div className="text-[10.5px] text-[#5C567A] line-through">
                          {originalDisplayPrice.toLocaleString('vi-VN')} VND
                        </div>
                      )}
                    </div>

                    <div className="text-[10.5px] text-[#938EB5] font-medium">
                      Đã bán: <strong className="text-[#F4F2FF]">{product.soldCount}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-white/6">
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="py-2 px-2.5 rounded-xl btn-liquid-secondary text-xs font-bold text-center cursor-pointer"
                  >
                    + Giỏ Hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateToStorefront('product-detail', product.id)}
                    className="py-2 px-2.5 rounded-xl btn-liquid-primary cursor-pointer text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
                  >
                    {purchasingId === product.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Đang mua...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>Mua Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
