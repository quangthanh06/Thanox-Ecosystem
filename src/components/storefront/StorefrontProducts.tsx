import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Zap,
  ArrowUpDown,
  Filter,
  Package,
} from 'lucide-react';

export const StorefrontProducts: React.FC = () => {
  const {
    products,
    categories,
    navigateToStorefront,
    addToCart,
    createOrder,
    currentUser,
    showToast,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'sold'>('featured');

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
      if (sortBy === 'sold') return b.soldCount - a.soldCount;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

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
    <div className="space-y-6 py-4">
      {/* Breadcrumb & Title */}
      <div className="border-b border-white/5 pb-5">
        <div className="flex items-center gap-2 text-xs text-[#8B84A8] mb-1.5">
          <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
            Trang Chủ
          </button>
          <span>/</span>
          <span className="text-[#9D5CF6] font-medium">Tất Cả Sản Phẩm</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#F0EDFF]">
              Danh Mục Sản Phẩm & Key Bản Quyền
            </h1>
            <p className="text-xs text-[#8B84A8] mt-0.5">
              Hệ thống cung cấp file tối ưu hóa game, menu VIP và acc an toàn 100%
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B84A8] whitespace-nowrap">Sắp xếp theo:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0F0F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="featured">Nổi bật nhất</option>
              <option value="sold">Bán chạy nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Categories (4 cols) + Products Grid (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Filter Column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8B84A8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          {/* Categories Filter Card */}
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F0EDFF] uppercase tracking-wider border-b border-white/5 pb-3">
              <Filter className="w-3.5 h-3.5 text-[#9D5CF6]" />
              <span>Danh Mục</span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
                    : 'text-[#CBC7E0] hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>Tất cả sản phẩm</span>
                <span className="text-[10.5px] opacity-80">{activeProducts.length}</span>
              </button>

              {categories.map((c) => {
                const count = activeProducts.filter((p) => p.category === c.name).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      selectedCategory === c.name
                        ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
                        : 'text-[#CBC7E0] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="text-[10.5px] opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Products Grid Column */}
        <div className="lg:col-span-9 space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8B84A8] bg-[#0F0F1A] border border-dashed border-white/5 rounded-2xl space-y-2">
              <Package className="w-8 h-8 text-[#6B658E] mx-auto" />
              <div>Không tìm thấy sản phẩm nào phù hợp với từ khóa hoặc danh mục đã chọn.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.map((product) => {
                const isSeller = currentUser?.sellerStatus === 'active' && !!product.sellerPrice;
                const effectivePrice = isSeller ? product.sellerPrice! : product.price;
                const originalDisplayPrice = isSeller ? product.price : product.originalPrice;

                const discount = originalDisplayPrice
                  ? Math.round(((originalDisplayPrice - effectivePrice) / originalDisplayPrice) * 100)
                  : null;

                return (
                  <div
                    key={product.id}
                    className="bg-[#0F0F1A] border border-white/5 hover:border-[#7C3AED]/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all group hover:bg-[#121222]"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#7C3AED]/15 text-[#9D5CF6]">
                          {product.category}
                        </span>
                        {isSeller ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                            Giá Đại Lý
                          </span>
                        ) : discount ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                            -{discount}%
                          </span>
                        ) : null}
                      </div>

                      <h3
                        onClick={() => navigateToStorefront('product-detail', product.id)}
                        className="font-display font-bold text-sm text-[#F0EDFF] group-hover:text-[#9D5CF6] transition-colors cursor-pointer line-clamp-2"
                      >
                        {product.name}
                      </h3>

                      <p className="text-[11.5px] text-[#6B658E] line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="pt-2">
                        <div className="font-display font-extrabold text-base text-emerald-400">
                          {effectivePrice.toLocaleString('vi-VN')} <span className="text-xs">đ</span>
                        </div>
                        {originalDisplayPrice && originalDisplayPrice > effectivePrice && (
                          <div className="text-[11px] text-[#6B658E] line-through">
                            {originalDisplayPrice.toLocaleString('vi-VN')}đ
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 mt-3 border-t border-white/5">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => addToCart(product)}
                        className="justify-center"
                      >
                        + Giỏ Hàng
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleQuickBuy(product.id, effectivePrice)}
                        className="justify-center font-bold"
                      >
                        Mua Ngay
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
