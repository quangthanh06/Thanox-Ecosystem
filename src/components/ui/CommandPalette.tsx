import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { PageId } from '../../types';
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Package,
  FolderTree,
  ShoppingBag,
  Wallet,
  ArrowLeftRight,
  Share2,
  Users,
  HeadphonesIcon,
  Settings,
  Plus,
  Zap,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    setCurrentPage,
    navigateToStorefront,
    products,
    orders,
    users,
    resetToDefaultData,
    resetToZeroData,
    showToast,
  } = useStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Command items
  const navigationItems = [
    { id: 'p-dash', label: 'Bảng điều khiển (Dashboard)', category: 'Trang', page: 'dashboard' as PageId, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'p-analy', label: 'Thống kê & Báo cáo (Analytics)', category: 'Trang', page: 'analytics' as PageId, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'p-prod', label: 'Quản lý Sản phẩm (Products)', category: 'Trang', page: 'products' as PageId, icon: <Package className="w-4 h-4" /> },
    { id: 'p-cat', label: 'Danh mục Sản phẩm (Categories)', category: 'Trang', page: 'categories' as PageId, icon: <FolderTree className="w-4 h-4" /> },
    { id: 'p-ord', label: 'Quản lý Đơn hàng (Orders)', category: 'Trang', page: 'orders' as PageId, icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'p-wal', label: 'Ví tiền & Duyệt nạp (Wallet)', category: 'Trang', page: 'wallet' as PageId, icon: <Wallet className="w-4 h-4" /> },
    { id: 'p-tx', label: 'Biến động Giao dịch (Transactions)', category: 'Trang', page: 'transactions' as PageId, icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'p-aff', label: 'Tiếp thị liên kết (Affiliate)', category: 'Trang', page: 'affiliate' as PageId, icon: <Share2 className="w-4 h-4" /> },
    { id: 'p-usr', label: 'Quản lý Người dùng (Users)', category: 'Trang', page: 'users' as PageId, icon: <Users className="w-4 h-4" /> },
    { id: 'p-sup', label: 'Trung tâm Hỗ trợ (Support Tickets)', category: 'Trang', page: 'support' as PageId, icon: <HeadphonesIcon className="w-4 h-4" /> },
    { id: 'p-set', label: 'Cài đặt Hệ thống (Settings)', category: 'Trang', page: 'settings' as PageId, icon: <Settings className="w-4 h-4" /> },
  ];

  const actionItems = [
    {
      id: 'a-storefront',
      label: 'Mở xem Cửa hàng (Storefront Preview)',
      category: 'Thao tác nhanh',
      icon: <Zap className="w-4 h-4 text-[#06B6D4]" />,
      action: () => {
        navigateToStorefront('home');
        onClose();
      },
    },
    {
      id: 'a-add-prod',
      label: 'Thêm sản phẩm mới',
      category: 'Thao tác nhanh',
      icon: <Plus className="w-4 h-4 text-[#9D5CF6]" />,
      action: () => {
        setCurrentPage('products');
        onClose();
      },
    },
    {
      id: 'a-reset-zero',
      label: 'Xóa trắng dữ liệu (Đưa toàn bộ số liệu về 0)',
      category: 'Dữ liệu',
      icon: <RotateCcw className="w-4 h-4 text-red-400" />,
      action: () => {
        resetToZeroData();
        onClose();
      },
    },
    {
      id: 'a-reset-demo',
      label: 'Nạp lại dữ liệu mẫu (Restore Demo Data)',
      category: 'Dữ liệu',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => {
        resetToDefaultData();
        onClose();
      },
    },
  ];

  // Dynamic search items from products & orders
  const dynamicProductItems = products
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3)
    .map((p) => ({
      id: 'prod-' + p.id,
      label: `Sản phẩm: ${p.name} (${p.price.toLocaleString('vi-VN')}đ)`,
      category: 'Sản phẩm',
      icon: <Package className="w-4 h-4 text-[#9D5CF6]" />,
      action: () => {
        setCurrentPage('products');
        onClose();
      },
    }));

  const allFiltered = [
    ...navigationItems
      .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
      .map((item) => ({
        ...item,
        action: () => {
          setCurrentPage(item.page);
          onClose();
        },
      })),
    ...actionItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    ...dynamicProductItems,
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allFiltered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allFiltered.length - 1));
    } else if (e.key === 'Enter' && allFiltered[selectedIndex]) {
      e.preventDefault();
      allFiltered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Command Box */}
      <div className="relative w-full max-w-xl bg-[#0F0F1A] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#161626]/60">
          <Search className="w-4 h-4 text-[#9D5CF6] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm trang, thao tác, sản phẩm, cài đặt... (nhấn Enter để chọn)"
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none"
          />
          <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[#8B84A8] font-mono">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allFiltered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B658E]">
              Không tìm thấy kết quả phù hợp với từ khóa
            </div>
          ) : (
            allFiltered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-sm'
                      : 'text-[#8B84A8] hover:text-[#F0EDFF] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={isSelected ? 'text-[#9D5CF6]' : 'text-[#6B658E]'}>
                      {item.icon}
                    </span>
                    <span className="font-medium truncate">{item.label}</span>
                  </div>
                  <span className="text-[10.5px] px-2 py-0.5 rounded bg-white/5 text-[#6B658E] font-medium shrink-0">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/5 bg-[#161626]/30 flex items-center justify-between text-[11px] text-[#6B658E]">
          <div className="flex items-center gap-3">
            <span>↑↓ để di chuyển</span>
            <span>↵ để chọn</span>
          </div>
          <span>Thanox Command</span>
        </div>
      </div>
    </div>
  );
};
