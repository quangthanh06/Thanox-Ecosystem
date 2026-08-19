import React, { useState } from 'react';
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
  CheckCircle2,
  Star,
  Flame,
  Key,
  Download,
  Wallet,
  TrendingUp,
} from 'lucide-react';

export const StorefrontHome: React.FC = () => {
  const {
    products,
    categories,
    navigateToStorefront,
    addToCart,
    createOrder,
    currentUser,
    showToast,
  } = useStore();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Active public products (filter out hidden status)
  const activeProducts = products.filter((p) => p.status !== 'hidden');

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
    <div className="space-y-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#120D26] via-[#0F0F1A] to-[#0A0A12] border border-white/10 p-6 sm:p-10 lg:p-14">
        {/* Glow lights */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#06B6D4]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#CBC7E0] text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Hệ Thống Tối Ưu Game & Key Bản Quyền Số 1 VN</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#F0EDFF] tracking-tight leading-[1.15]">
            Nâng Tầm Kỹ Năng Game Với <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9D5CF6] via-[#C084FC] to-[#06B6D4]">Thanox Digital</span>
          </h1>

          <p className="text-sm sm:text-base text-[#8B84A8] max-w-2xl leading-relaxed">
            Chuyên cung cấp File Android, iOS, Menu VIP, Proxy đường truyền riêng và công cụ tối ưu hóa tốc độ cao. Giao key tự động 3 giây qua ví số dư.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigateToStorefront('products')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-bold shadow-lg shadow-[#7C3AED]/25"
            >
              Xem Tất Cả Sản Phẩm
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigateToStorefront('account-wallet-deposit')}
              leftIcon={<Wallet className="w-4 h-4 text-emerald-400" />}
              className="font-bold"
            >
              Nạp Tiền Ví VietQR
            </Button>
          </div>
        </div>
      </section>

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
            <div className="text-[11px] text-[#8B84A8]">Hoàn tiền nếu lỗi file</div>
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
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F0EDFF] flex items-center gap-2">
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
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
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
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#F0EDFF] flex items-center gap-2">
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
                  className="bg-[#0F0F1A] border border-white/10 hover:border-[#7C3AED]/50 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#7C3AED]/15 text-[#9D5CF6] border border-[#7C3AED]/20">
                        {product.category}
                      </span>
                      {discount && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">
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

                    <div className="flex items-baseline gap-2 pt-2">
                      <span className="font-display font-extrabold text-lg text-emerald-400">
                        {product.price.toLocaleString('vi-VN')} <span className="text-xs">đ</span>
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-[#6B658E] line-through">
                          {product.originalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
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
                      onClick={() => handleQuickBuy(product.id, product.price)}
                    >
                      Mua Ngay
                    </Button>
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
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F0EDFF]">
              Tất Cả Sản Phẩm
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

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeCategoryFilter === c.name
                  ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/30'
                  : 'bg-[#0F0F1A] text-[#8B84A8] hover:text-white border border-white/5'
              }`}
            >
              {c.icon} {c.name}
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
                className="bg-[#0F0F1A] border border-white/5 hover:border-[#7C3AED]/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all group hover:bg-[#121222]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8B84A8] font-medium">{prod.category}</span>
                    <span className="text-emerald-400 font-bold">Đã bán: {prod.soldCount}</span>
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

                  <div className="pt-2">
                    <div className="font-display font-extrabold text-base text-emerald-400">
                      {prod.price.toLocaleString('vi-VN')} <span className="text-xs">đ</span>
                    </div>
                  </div>
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
                    onClick={() => handleQuickBuy(prod.id, prod.price)}
                    className="justify-center font-bold"
                  >
                    Mua Ngay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. STEP-BY-STEP PROCESS */}
      <section className="bg-[#0F0F1A] border border-white/10 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F0EDFF]">
            Quy Trình Mua Hàng & Nhận Key 3 Bước
          </h3>
          <p className="text-xs text-[#8B84A8]">Hệ thống vận hành tự động 100% không cần chờ đợi thủ công</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 rounded-2xl bg-[#161626] border border-white/5 text-center space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#9D5CF6] font-display font-black text-lg mx-auto">
              1
            </div>
            <h4 className="font-display font-bold text-sm text-[#F0EDFF]">Nạp Tiền Ví VietQR</h4>
            <p className="text-xs text-[#8B84A8] leading-relaxed">
              Quét mã VietQR tự động. Tiền vào ví chỉ sau 1-3 phút.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161626] border border-white/5 text-center space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4] font-display font-black text-lg mx-auto">
              2
            </div>
            <h4 className="font-display font-bold text-sm text-[#F0EDFF]">Chọn Sản Phẩm & Mua</h4>
            <p className="text-xs text-[#8B84A8] leading-relaxed">
              Nhấn Mua Ngay để thanh toán tức thì bằng số dư ví tài khoản.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161626] border border-white/5 text-center space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-display font-black text-lg mx-auto">
              3
            </div>
            <h4 className="font-display font-bold text-sm text-[#F0EDFF]">Nhận Key & Tải File</h4>
            <p className="text-xs text-[#8B84A8] leading-relaxed">
              Mã kích hoạt hoặc link tải hiển thị ngay trong mục Đơn Hàng.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
