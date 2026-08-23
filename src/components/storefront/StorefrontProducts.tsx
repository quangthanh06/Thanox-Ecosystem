import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Search,
  ShoppingCart,
  Zap,
  ArrowUpDown,
  Filter,
  Package,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  ChevronDown,
  Eye,
  Loader2,
} from 'lucide-react';
import { getThemeTypography } from '../../utils/themeStyles';
import { useDragScroll } from '../../hooks/useDragScroll';

export const StorefrontProducts: React.FC = () => {
  const {
    products,
    categories,
    navigateToStorefront,
    addToCart,
    createOrder,
    currentUser,
    settings,
    showToast,
  } = useStore();

  const themeTypo = getThemeTypography(settings);
  const { dragProps: catDragProps } = useDragScroll<HTMLDivElement>();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'sold'>('featured');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const SORT_OPTIONS = [
    { value: 'featured', label: 'Nổi bật', icon: '✨' },
    { value: 'sold', label: 'Bán chạy', icon: '🔥' },
    { value: 'price-asc', label: 'Giá thấp → cao', icon: '💵' },
    { value: 'price-desc', label: 'Giá cao → thấp', icon: '💎' },
  ];

  const currentSortOption = SORT_OPTIONS.find((s) => s.value === sortBy) || SORT_OPTIONS[0];

  const activeProducts = products.filter((p) => p.status !== 'hidden');

  const filteredProducts = activeProducts
    .filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'sold') return (b.soldCount || 0) - (a.soldCount || 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  const handleQuickBuy = async (productId: string, price: number) => {
    if (purchasingId) return;
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản để mua hàng!', 'warning');
      navigateToStorefront('login', '/products');
      return;
    }
    setPurchasingId(productId);
    try {
      const success = await createOrder(productId, 1, 'wallet');
      if (success) {
        navigateToStorefront('account-orders');
      }
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* Breadcrumb & Header Title */}
      <div className="border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 text-[11px] text-[#8B84A8] mb-1">
          <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
            Trang Chủ
          </button>
          <span>/</span>
          <span className="text-[#9D5CF6] font-medium">Tất Cả Sản Phẩm</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1
              className={`${themeTypo.headingClass} text-xl sm:text-3xl tracking-tight uppercase`}
              style={themeTypo.fontStyle}
            >
              Kho Sản Phẩm & Key Bản Quyền
            </h1>
            <p className="text-[11px] sm:text-xs text-[#8B84A8] mt-0.5">
              Hệ thống tối ưu game, file mod an toàn và proxy tốc độ cao 24/7
            </p>
          </div>

          {/* Search & Sort on Desktop/Mobile */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8B84A8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhanh file, key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Custom Cyberpunk Styled Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 bg-[#0F0F1A] border border-white/10 hover:border-[#7C3AED]/60 rounded-xl px-3 py-2 text-xs font-bold text-[#F0EDFF] transition-all cursor-pointer shadow-md shadow-black/20"
              >
                <span>{currentSortOption.icon}</span>
                <span className="whitespace-nowrap">{currentSortOption.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#8B84A8] transition-transform ${isSortOpen ? 'rotate-180 text-[#9D5CF6]' : ''}`} />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 bg-[#0F0F1A]/95 backdrop-blur-xl border border-[#7C3AED]/40 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(124,58,237,0.35)] z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
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
                            ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30'
                            : 'text-[#CBC7E0] hover:text-white hover:bg-white/10'
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

      {/* 1. HORIZONTAL TOUCH-FRIENDLY CATEGORY BAR WITH MOUSE DRAG & WHEEL SCROLLING */}
      <div
        {...catDragProps}
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0"
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30 scale-105'
              : 'bg-[#161626]/80 text-[#CBC7E0] border border-white/5 hover:border-white/20'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tất Cả ({activeProducts.length})</span>
        </button>

        {categories.map((c) => {
          const count = activeProducts.filter((p) => p.category === c.name).length;
          const active = selectedCategory === c.name;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                active
                  ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30 scale-105'
                  : 'bg-[#161626]/80 text-[#CBC7E0] border border-white/5 hover:border-white/20'
              }`}
            >
            {c.image || (c.icon && (c.icon.startsWith('http') || c.icon.startsWith('data:image'))) ? (
              <img src={c.image || c.icon} alt={c.name} className="w-4 h-4 rounded-md object-cover flex-shrink-0" />
            ) : (
              <span>{c.icon}</span>
            )}
              <span>{c.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-white/5 text-[#8B84A8]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. PRODUCTS GRID (1 col mobile, 2 sm, 3 lg, 4 xl) */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#8B84A8] bg-[#0F0F1A] border border-dashed border-white/10 rounded-3xl space-y-2">
          <Package className="w-10 h-10 text-[#6B658E] mx-auto" />
          <div className="font-bold text-sm text-[#F0EDFF]">Không tìm thấy sản phẩm phù hợp</div>
          <div>Hãy thử tìm bằng từ khóa khác hoặc chuyển sang danh mục khác.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((product) => {
            const basePrice = product.basePrice ?? product.price ?? 0;
            const memberPrice = product.memberPrice ?? basePrice;
            const isSeller = currentUser?.role === 'seller' || currentUser?.sellerStatus === 'active' || currentUser?.sellerStatus === 'approved';
            const rolePrice = isSeller && product.sellerPrice !== undefined && product.sellerPrice > 0 ? product.sellerPrice : memberPrice;
            const isSale = Boolean((product.isSale ?? product.saleActive) && product.salePrice && product.salePrice > 0 && product.salePrice < rolePrice);
            const effectivePrice = isSale && product.salePrice ? product.salePrice : rolePrice;
            const originalDisplayPrice = isSale ? rolePrice : undefined;

            const discount = isSale && originalDisplayPrice && originalDisplayPrice > effectivePrice
              ? Math.round(((originalDisplayPrice - effectivePrice) / originalDisplayPrice) * 100)
              : null;

            return (
              <div
                key={product.id}
                className="bg-[rgba(255,255,255,0.03)] backdrop-blur-[26px] border border-white/10 hover:border-[#7C3AED]/50 hover:shadow-[0_0_25px_rgba(124,58,237,0.2)] rounded-3xl p-4 sm:p-4.5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="space-y-3">
                  {/* Thumbnail Cover with Badge */}
                  <div
                    onClick={() => navigateToStorefront('product-detail', product.id)}
                    className="relative aspect-video rounded-2xl bg-transparent overflow-hidden flex items-center justify-center cursor-pointer group-hover:border-[#7C3AED]/30 transition-colors"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#9D5CF6] font-bold">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                      <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-[#0F0F1A]/90 text-[#9D5CF6] border border-white/10 backdrop-blur-md">
                        {product.category}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      {isSeller ? (
                        <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                          CTV
                        </span>
                      ) : discount ? (
                        <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-md">
                          -{discount}%
                        </span>
                      ) : null}
                    </div>

                    {/* Nút Xem Chi Tiết nằm giữa ảnh — chỉ hiện khi rê chuột / chạm vào card */}
                    <div className="absolute inset-0 z-[5] flex items-center justify-center bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToStorefront('product-detail', product.id);
                        }}
                        className="pointer-events-none group-hover:pointer-events-auto group-active:pointer-events-auto px-3.5 sm:px-4 py-2 rounded-xl bg-[#7C3AED]/95 hover:bg-[#8B5CF6] active:scale-95 text-white text-[11px] sm:text-xs font-extrabold uppercase tracking-wide shadow-lg shadow-purple-950/50 border border-white/25 backdrop-blur-sm transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Chi Tiết</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => navigateToStorefront('product-detail', product.id)}
                      className="font-display font-extrabold text-sm text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors cursor-pointer line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-[#8B84A8] line-clamp-2 leading-relaxed mt-1">
                      {product.description || 'Giao key và link tải file tự động sau 3 giây.'}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="pt-1 flex items-baseline justify-between">
                    <div>
                      <div className="font-display font-extrabold text-base sm:text-lg text-emerald-400">
                        {effectivePrice.toLocaleString('vi-VN')} <span className="text-[11px] font-bold">VND</span>
                      </div>
                      {originalDisplayPrice && originalDisplayPrice > effectivePrice && (
                        <div className="text-[10.5px] text-[#6B658E] line-through">
                          {originalDisplayPrice.toLocaleString('vi-VN')} VND
                        </div>
                      )}
                    </div>

                    <div className="text-[10.5px] text-[#8B84A8] font-medium">
                      Đã bán: <strong className="text-[#CBC7E0]">{product.soldCount}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="py-2 px-2.5 rounded-xl bg-[#161626] hover:bg-[#1E1E30] text-[#CBC7E0] hover:text-white text-xs font-bold transition-all text-center cursor-pointer border border-white/5"
                  >
                    + Giỏ Hàng
                  </button>
                  <button
                    type="button"
                    disabled={purchasingId !== null}
                    onClick={() => handleQuickBuy(product.id, effectivePrice)}
                    className={`py-2 px-2.5 rounded-xl ${purchasingId === product.id ? 'bg-[#7C3AED]/60 cursor-not-allowed opacity-80' : 'bg-[#7C3AED] hover:bg-[#6D28D9] cursor-pointer shadow-md shadow-[#7C3AED]/25'} text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5`}
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
