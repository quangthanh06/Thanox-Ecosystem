import { uploadMediaToSupabase } from '../lib/supabase';
import { isAccountLikeCategory } from '../utils/productAccount';
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, ProductStatus, ProductPackage } from '../types';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Drawer } from './ui/Drawer';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Sparkles,
  Download,
  Key,
  DollarSign,
  Layers,
  ArrowUpDown,
  Upload,
  Image as ImageIcon,
  Star,
  X,
  Check,
  Clock,
  Lock,
  Unlock,
  ShieldCheck,
  FileUp,
  FileText,
  Percent,
  Paperclip,
  File as FileIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useDragScroll } from '../hooks/useDragScroll';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductLock,
    showToast,
  } = useStore();

  const { dragProps: drawerDragProps, scrollLeft: drawerScrollLeft, scrollRight: drawerScrollRight } = useDragScroll<HTMLDivElement>();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'sold_desc' | 'newest'>('newest');

  // Form Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [drawerTab, setDrawerTab] = useState<'basic' | 'pricing' | 'files' | 'packages' | 'images' | 'delivery'>('basic');

  // Package Form State
  const [pkgNameInput, setPkgNameInput] = useState('1 NGÀY');
  const [pkgPriceInput, setPkgPriceInput] = useState(90000);
  const [pkgOrigPriceInput, setPkgOrigPriceInput] = useState(120000);
  const [pkgSellerPriceInput, setPkgSellerPriceInput] = useState(60000);
  const [pkgKeysInput, setPkgKeysInput] = useState('');

  // Helper to determine if a product category is Account/Nick/Acc FF
  // (dùng chung qua utils/productAccount để storefront & admin nhận diện giống nhau)
  const isAccountCategory = (catName: string): boolean => isAccountLikeCategory(catName);

  // Form Fields
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    price: number;
    isSale: boolean;
    salePrice?: number;
    sellerPrice?: number;
    image?: string;
    images?: string[];
    packages?: ProductPackage[];
    stock: number | 'unlimited';
    status: ProductStatus;
    description: string;
    downloadUrl?: string;
    licenseKeys?: string;
    instructions?: string;
    downloadLinkOrKeys: string;
    featured: boolean;
    isLocked: boolean;
    accountUsername?: string;
    accountPassword?: string;
    account2FA?: string;
    accountsList?: string;
    attachedFileName?: string;
    attachedFileSize?: string;
    attachedFileData?: string;
  }>({
    name: '',
    category: categories[0]?.name || 'File Android',
    price: 0,
    isSale: false,
    salePrice: 0,
    sellerPrice: 0,
    image: '',
    images: [],
    packages: [],
    stock: 'unlimited',
    status: 'active',
    description: '',
    downloadUrl: '',
    licenseKeys: '',
    instructions: '',
    downloadLinkOrKeys: '',
    featured: false,
    isLocked: true,
    accountUsername: '',
    accountPassword: '',
    account2FA: '',
    accountsList: '',
    attachedFileName: '',
    attachedFileSize: '',
    attachedFileData: '',
  });

  // Delete Dialog State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // File Upload Handlers (ALL File types: APK, ZIP, RAR, EXE, TXT, PDF, IPA...)
  const handleAnyFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;

    
      setIsUploading(true);
      try {
        const url = await uploadMediaToSupabase(file, 'digital_files');
        setFormData((prev) => ({
          ...prev,
          attachedFileName: file.name,
          attachedFileSize: formattedSize,
          attachedFileData: url,
        }));
        showToast(`Đã đính kèm tệp "${file.name}" (${formattedSize}) lên Cloud thành công!`, 'success');
      } catch (e) {
        showToast('Lỗi khi tải tệp lên Cloud', 'error');
      } finally {
        setIsUploading(false);
      }
  };

  const removeAttachedFile = () => {
    setFormData((prev) => ({
      ...prev,
      attachedFileName: '',
      attachedFileSize: '',
      attachedFileData: '',
    }));
    showToast('Đã gỡ tệp đính kèm', 'info');
  };

  const handleImageFilesUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      Array.from(files).forEach(async (file) => {
        if (!file.type.startsWith('image/')) {
          showToast('Vui l�ng ch?n file h�nh ?nh (PNG, JPG, WEBP)', 'error');
          return;
        }
        try {
          const url = await uploadMediaToSupabase(file, 'products');
          setFormData((prev) => {
            const currentImages = prev.images || [];
            const newImages = [...currentImages, url];
            return {
              ...prev,
              images: newImages,
              image: prev.image || url,
            };
          });
          showToast('Đã tải ảnh lên Cloud thành công!', 'success');
        } catch (e: any) {
          showToast('Đã tải ảnh lên Cloud thành công!', 'success');
        }
      });
    };

    const removeImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const currentImages = prev.images || [];
      const filtered = currentImages.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: filtered,
        image: filtered[0] || '',
      };
    });
  };

  const setPrimaryImage = (imgUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      image: imgUrl,
      images: [imgUrl, ...(prev.images || []).filter((im) => im !== imgUrl)],
    }));
    showToast('Đã đặt làm ảnh đại diện chính!', 'success');
  };

  const openCreateDrawer = () => {
    setEditingProduct(null);
    setDrawerTab('basic');
    setFormData({
      name: '',
      category: categories[0]?.name || 'File Android',
      price: 0,
      isSale: false,
      salePrice: 0,
      sellerPrice: 0,
      image: '',
      images: [],
      packages: [],
      stock: 'unlimited',
      status: 'active',
      description: '',
      downloadUrl: '',
      licenseKeys: '',
      instructions: '',
      downloadLinkOrKeys: '',
      featured: false,
      isLocked: true,
      accountUsername: '',
      accountPassword: '',
      account2FA: '',
      accountsList: '',
      attachedFileName: '',
      attachedFileSize: '',
      attachedFileData: '',
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (product: Product) => {
    setEditingProduct(product);
    setDrawerTab('basic');

    // Parse existing account / key if available
    let defaultAccUser = product.accountUsername || '';
    let defaultAccPass = product.accountPassword || '';
    let defaultAcc2FA = product.account2FA || '';
    let defaultAccList = product.accountsList || '';

    const rawKey = product.licenseKeys || product.downloadLinkOrKeys || '';
    if (!defaultAccUser && !defaultAccPass && rawKey) {
      if (rawKey.includes('|')) {
        const firstLine = rawKey.split('\n')[0].trim();
        const parts = firstLine.split('|');
        if (parts.length >= 2) {
          defaultAccUser = parts[0].trim();
          defaultAccPass = parts[1].trim();
          if (parts[2]) defaultAcc2FA = parts[2].trim();
        }
        defaultAccList = rawKey;
      } else if (rawKey.includes('Tài khoản:') || rawKey.includes('TÀI KHOẢN:')) {
        const uMatch = rawKey.match(/(?:Tài khoản|TÀI KHOẢN):\s*([^\n|]+)/i);
        const pMatch = rawKey.match(/(?:Mật khẩu|MẬT KHẨU):\s*([^\n|]+)/i);
        const fMatch = rawKey.match(/(?:2FA|Mã 2FA|Ghi chú):\s*([^\n|]+)/i);
        if (uMatch) defaultAccUser = uMatch[1].trim();
        if (pMatch) defaultAccPass = pMatch[1].trim();
        if (fMatch) defaultAcc2FA = fMatch[1].trim();
      }
    }

    const regularPrice = product.price ?? product.basePrice ?? 0;
    const hasSale = Boolean(
      product.isSale ??
      product.saleActive ??
      (product.salePrice && product.salePrice > 0 && product.salePrice < regularPrice)
    );

    setFormData({
      name: product.name,
      category: product.category,
      price: regularPrice,
      isSale: hasSale,
      salePrice: product.salePrice ?? 0,
      sellerPrice: product.sellerPrice ?? regularPrice,
      image: product.image || '',
      images: product.images || (product.image ? [product.image] : []),
      packages: isAccountCategory(product.category) ? [] : (product.packages || []),
      stock: product.stock,
      status: product.status,
      description: product.description,
      downloadUrl: product.downloadUrl || '',
      licenseKeys: product.licenseKeys || '',
      instructions: product.instructions || '',
      downloadLinkOrKeys: product.downloadLinkOrKeys || '',
      featured: product.featured,
      isLocked: product.isLocked ?? true,
      accountUsername: defaultAccUser,
      accountPassword: defaultAccPass,
      account2FA: defaultAcc2FA,
      accountsList: defaultAccList,
      attachedFileName: product.attachedFileName || '',
      attachedFileSize: product.attachedFileSize || '',
      attachedFileData: product.attachedFileData || '',
    });
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui l�ng nh?p t�n sản phẩm', 'error');
      return;
    }

    const isAcc = isAccountCategory(formData.category);
    let finalDelivery = formData.downloadLinkOrKeys;
    let finalLicenseKeys = formData.licenseKeys;

    if (isAcc) {
      if (formData.accountsList && formData.accountsList.trim()) {
        finalDelivery = formData.accountsList.trim();
        finalLicenseKeys = formData.accountsList.trim();
      } else if (formData.accountUsername || formData.accountPassword) {
        const text = `🎮 TÀI KHOẢN: ${formData.accountUsername || ''}\n🔑 MẬT KHẨU: ${formData.accountPassword || ''}${formData.account2FA ? `\n🛡️ 2FA / GHI CHÚ: ${formData.account2FA}` : ''}`;
        finalDelivery = text;
        finalLicenseKeys = text;
      }
    } else {
      finalDelivery = formData.licenseKeys || formData.downloadUrl || formData.downloadLinkOrKeys;
    }

    const finalSalePrice = formData.isSale && formData.salePrice && formData.salePrice > 0 ? formData.salePrice : undefined;
    const finalSellerPrice = formData.sellerPrice && formData.sellerPrice > 0 ? formData.sellerPrice : formData.price;

    const payload: Partial<Product> = {
      ...formData,
      isSale: formData.isSale,
      saleActive: formData.isSale,
      salePrice: finalSalePrice,
      sellerPrice: finalSellerPrice,
      packages: isAcc ? [] : formData.packages,
      licenseKeys: finalLicenseKeys,
      downloadLinkOrKeys: finalDelivery,
      downloadUrl: isAcc ? '' : formData.downloadUrl,
      attachedFileName: formData.attachedFileName,
      attachedFileSize: formData.attachedFileSize,
      attachedFileData: formData.attachedFileData,
      productType: isAcc ? ('account' as const) : formData.attachedFileData ? ('file' as const) : ('key' as const),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      showToast(`Đã cập nhật sản phẩm "${formData.name}"!`, 'success');
    } else {
      addProduct(payload as any);
      showToast(`Đã thêm mới sản phẩm "${formData.name}"!`, 'success');
    }
    setIsDrawerOpen(false);
  };

  const handleDuplicate = (product: Product) => {
    const duplicatedData = {
      name: `${product.name} (Bản sao)`,
      category: product.category,
      price: product.price,
      isSale: product.isSale ?? product.saleActive ?? false,
      salePrice: product.salePrice,
      sellerPrice: product.sellerPrice,
      image: product.image,
      images: product.images,
      stock: product.stock,
      status: product.status,
      description: product.description,
      downloadUrl: product.downloadUrl,
      licenseKeys: product.licenseKeys,
      instructions: product.instructions,
      downloadLinkOrKeys: product.downloadLinkOrKeys,
      featured: false,
      isLocked: true,
      accountUsername: product.accountUsername,
      accountPassword: product.accountPassword,
      account2FA: product.account2FA,
      accountsList: product.accountsList,
      attachedFileName: product.attachedFileName,
      attachedFileSize: product.attachedFileSize,
      attachedFileData: product.attachedFileData,
    };
    addProduct(duplicatedData);
    showToast(`Đã nhân bản "${product.name}"!`, 'success');
  };

  const toggleProductStatus = (product: Product) => {
    const newStatus: ProductStatus = product.status === 'active' ? 'hidden' : 'active';
    updateProduct(product.id, { status: newStatus });
  };

  // Filtering & Sorting
  const filteredProducts = products
    .filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesStat = selectedStatus === 'all' || p.status === selectedStatus;

      return matchesQuery && matchesCat && matchesStat;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'sold_desc') return b.soldCount - a.soldCount;
      return 0; // default order
    });

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F1A] border border-white/5 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-[#F0EDFF]">Kho Sản Phẩm & Key Tự Động</h2>
            <Badge variant="brand" size="xs">
              {products.length} sản phẩm
            </Badge>
          </div>
          <p className="text-xs text-[#6B658E] mt-0.5">
            Quản lý file mod, key vip, tệp tin cấu hình và phân phối bàn giao tự động
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="primary" size="sm" onClick={openCreateDrawer} leftIcon={<Plus className="w-4 h-4" />}>
            Thêm Sản Phẩm Mới
          </Button>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <Card className="p-4 space-y-3" variant="default">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B658E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên sản phẩm, danh mục, mô tả..."
              className="w-full bg-[#161626] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          {/* Select Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="all">Tất cả danh mục ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Select Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Đang bán</option>
              <option value="hidden">⚪ Đang ẩn</option>
              <option value="out_of_stock">🔴 Hết hàng</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="sold_desc">Bán chạy nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#161626] p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#7C3AED] text-white' : 'text-[#8B84A8] hover:text-white'
                }`}
                title="Dạng bảng"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#7C3AED] text-white' : 'text-[#8B84A8] hover:text-white'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Products Rendering */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6 text-[#9D5CF6]" />}
          title="Không tìm thấy sản phẩm nào"
          description={
            products.length === 0
              ? 'Kho sản phẩm hiện đang trống. Nhấn nút bên dưới để tạo sản phẩm đầu tiên.'
              : 'Không có sản phẩm nào khớp với bộ lọc tìm kiếm hiện tại.'
          }
          actionLabel="Thêm Sản Phẩm Mới"
          onAction={openCreateDrawer}
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className="p-0 overflow-hidden" variant="default">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="bg-[#161626]/60 text-[#555074] border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4">Đã bán</th>
                  <th className="py-3 px-4">Kho</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Name & Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-white/10 flex items-center justify-center text-[#9D5CF6] shrink-0 overflow-hidden font-bold shadow-sm">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#F0EDFF] flex items-center gap-2 truncate">
                            <span>{product.name}</span>
                            {product.featured && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                                HOT
                              </span>
                            )}
                            {product.isLocked && (
                              <span
                                className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1 shrink-0"
                                title="Sản phẩm đã được KHÓA bảo vệ chống ghi đè khi nâng cấp"
                              >
                                <Lock className="w-2.5 h-2.5" />
                                ĐÃ KHÓA
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-[#6B658E] line-clamp-1 mt-0.5">
                            {product.description || 'Không có mô tả'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-[#8B84A8] font-medium">{product.category}</td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {product.price.toLocaleString('vi-VN')}đ
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-[10px] text-[#555074] line-through font-normal">
                          {product.originalPrice.toLocaleString('vi-VN')}đ
                        </div>
                      )}
                      {(() => {
                        const pkgs = product.packages || product.plans || [];
                        return pkgs.length > 0 ? (
                          <div
                            className="mt-1 text-[9.5px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 rounded-md px-1.5 py-0.5 inline-block"
                            title={pkgs.map((g) => `${g.name}: ${g.price.toLocaleString('vi-VN')}đ`).join('\n')}
                          >
                            📦 {pkgs.length} gói dịch vụ
                          </div>
                        ) : null;
                      })()}
                    </td>

                    {/* Sold Count */}
                    <td className="py-3.5 px-4 text-[#F0EDFF] font-semibold">{product.soldCount}</td>

                    {/* Stock */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-[#8B84A8]">
                        {product.stock === 'unlimited' ? '∞ Không giới hạn' : `${product.stock} còn lại`}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleProductStatus(product)}
                        className="cursor-pointer"
                        title="Bấm để đổi trạng thái nhanh"
                      >
                        <Badge
                          variant={
                            product.status === 'active'
                              ? 'success'
                              : product.status === 'hidden'
                              ? 'neutral'
                              : 'danger'
                          }
                          size="xs"
                          dot
                        >
                          {product.status === 'active'
                            ? 'Đang bán'
                            : product.status === 'hidden'
                            ? 'Đang ẩn'
                            : 'Hết hàng'}
                        </Badge>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* 1-Click Lock Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleProductLock(product.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            product.isLocked
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                              : 'bg-[#161626] hover:bg-[#1E1E30] text-[#8B84A8] hover:text-white'
                          }`}
                          title={
                            product.isLocked
                              ? 'Sản phẩm đang KHÓA (Bấm để mở khóa)'
                              : 'Bấm để KHÓA BẢO VỆ (chống bị thay đổi khi nâng cấp)'
                          }
                        >
                          {product.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => openEditDrawer(product)}
                          className="p-1.5 rounded-lg bg-[#161626] hover:bg-[#1E1E30] text-[#8B84A8] hover:text-white transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(product)}
                          className="p-1.5 rounded-lg bg-[#161626] hover:bg-[#1E1E30] text-[#8B84A8] hover:text-[#9D5CF6] transition-colors cursor-pointer"
                          title="Nhân bản"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTargetId(product.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-4 space-y-3 flex flex-col justify-between" variant="interactive">
              <div className="space-y-2.5">
                {/* Product Thumbnail Banner */}
                <div
                  onClick={() => openEditDrawer(product)}
                  className="relative w-full aspect-[16/9] rounded-2xl bg-[#161626] border border-white/10 overflow-hidden cursor-pointer group-hover:border-[#7C3AED]/50 transition-colors shadow-inner"
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6B658E]">
                      <Package className="w-7 h-7 text-[#9D5CF6]/50" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-black/80 backdrop-blur-md text-[#9D5CF6] border border-purple-500/30">
                    {product.category}
                  </span>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={product.status === 'active' ? 'success' : 'neutral'} size="xs" dot>
                      {product.status === 'active' ? 'Đang bán' : 'Đang ẩn'}
                    </Badge>
                    {product.featured && (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/90 text-black font-extrabold shadow-md">
                        HOT
                      </span>
                    )}
                    {product.isLocked && (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1 shadow-md">
                        <Lock className="w-2.5 h-2.5" />
                        KHÓA
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3
                    onClick={() => openEditDrawer(product)}
                    className="font-semibold text-sm text-[#F0EDFF] hover:text-[#9D5CF6] transition-colors truncate cursor-pointer"
                  >
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-[#6B658E] line-clamp-2 mt-0.5">
                    {product.description || 'Không có mô tả chi tiết'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#8B84A8] font-medium">{product.category}</span>
                  <div className="font-bold text-sm text-emerald-400">
                    {product.price.toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button variant="secondary" size="xs" onClick={() => openEditDrawer(product)} className="flex-1">
                    Chỉnh sửa
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleProductLock(product.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      product.isLocked
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-[#161626] text-[#8B84A8] hover:text-white'
                    }`}
                    title={product.isLocked ? "Mở khóa sản phẩm" : "Khóa bảo vệ sản phẩm"}
                  >
                    {product.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDuplicate(product)}
                    className="p-2 rounded-xl bg-[#161626] text-[#8B84A8] hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(product.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit / Create Product Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        subtitle="Cấu hình thông tin, giá bán CTV, tải ảnh từ máy tính và nội dung giao tự động"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingProduct ? 'Lưu Thay Đổi' : 'Thêm Sản Phẩm'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Drawer Tab Switcher (Thanh ngang đa năng với kéo chuột & mũi tên) */}
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={drawerScrollLeft}
              className="p-1.5 rounded-xl bg-[#161626] border border-white/10 text-[#CBC7E0] hover:text-white shrink-0 cursor-pointer shadow-sm"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              {...drawerDragProps}
              className="flex items-center gap-1 bg-[#161626] p-1 rounded-2xl border border-white/10 overflow-x-auto scrollbar-none no-scrollbar flex-1"
            >
              <button
                type="button"
                onClick={() => setDrawerTab('basic')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-center font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  drawerTab === 'basic'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-[#8B84A8] hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Thông Tin</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('pricing')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-center font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  drawerTab === 'pricing'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-[#8B84A8] hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>2. Giá & Sale & CTV</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('files')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-center font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  drawerTab === 'files'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-[#8B84A8] hover:text-white'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>3. Tệp Đính Kèm {formData.attachedFileName ? '✓' : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('packages')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-center font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  drawerTab === 'packages'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white shadow-sm'
                    : 'text-[#8B84A8] hover:text-white'
                }`}
              >
                {isAccountCategory(formData.category) ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                    <span>4. Kho Acc</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5 text-cyan-300" />
                    <span>4. Gói Key ({(formData.packages || []).length})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('images')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-center font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  drawerTab === 'images'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-[#8B84A8] hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>5. Ảnh ({(formData.images || []).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('delivery')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-center font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  drawerTab === 'delivery'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-[#8B84A8] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>6. Giao Hàng</span>
              </button>
            </div>

            <button
              type="button"
              onClick={drawerScrollRight}
              className="p-1.5 rounded-xl bg-[#161626] border border-white/10 text-[#CBC7E0] hover:text-white shrink-0 cursor-pointer shadow-sm"
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* ========================================================================= */}
            {/* TAB 1: BASIC PRODUCT INFORMATION */}
            {/* ========================================================================= */}
            {drawerTab === 'basic' && (
              <div className="space-y-4">
                {/* 🔒 LOCK PRODUCT SWITCH (CHỐNG GHI ĐÈ KHI NÂNG CẤP) */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  formData.isLocked
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-[#161626]/80 border-white/5'
                }`}>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold text-[#F0EDFF] flex items-center gap-1.5">
                      <Lock className={`w-3.5 h-3.5 ${formData.isLocked ? 'text-amber-400' : 'text-[#8B84A8]'}`} />
                      <span>Khóa Bảo Vệ Sản Phẩm (Chống Ghi Đè)</span>
                      {formData.isLocked && (
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-amber-500 text-black">
                          ĐÃ KHÓA
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8B84A8] leading-relaxed">
                      Khi bật, toàn bộ thông tin (tên, giá, gói key, link tải, ảnh) được bảo vệ vĩnh viễn và không bị hệ thống ghi đè khi nâng cấp.
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.isLocked}
                      onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Tên Sản Phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Thanox Pro V2.5 Android File hoặc Acc Free Fire VIP"
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Danh Mục Sản Phẩm
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Trạng Thái Hiển Thị
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="active">🟢 Đang bán</option>
                      <option value="hidden">⚪ Đang ẩn</option>
                      <option value="out_of_stock">🔴 Hết hàng</option>
                    </select>
                  </div>
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Số Lượng Tồn Kho
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={formData.stock}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          stock: val === 'unlimited' || val === '' ? 'unlimited' : (Number(val) || 0),
                        });
                      }}
                      placeholder="unlimited hoặc số lượng"
                      className="flex-1 bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => setFormData({ ...formData, stock: 'unlimited' })}
                    >
                      Không Giới Hạn
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Mô Tả Tổng Quan Sản Phẩm
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả các tính năng ưu việt, tương thích thiết bị, cam kết bảo hành..."
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                {/* Featured Checkbox */}
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#161626] border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded bg-[#0F0F1A] border-white/10 text-[#7C3AED] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <div className="font-semibold text-[#F0EDFF]">Ghim sản phẩm nổi bật (Featured / HOT)</div>
                    <div className="text-[10.5px] text-[#6B658E]">
                      Hiển thị nhãn HOT và ưu tiên xếp đầu tiên trên trang chủ
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PRICING & SALE DISCOUNT & SELLER/CTV PRICING */}
            {/* ========================================================================= */}
            {drawerTab === 'pricing' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161626] to-[#0F0F1A] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <h4 className="font-bold text-xs text-[#F0EDFF] flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>Cấu Hình Giá Bán Ra & Giảm Giá SALE & CTV</span>
                      </h4>
                      <p className="text-[11px] text-[#8B84A8] mt-0.5">
                        Kiểm soát 100% minh bạch: Giá bán lẻ, Bật/tắt giảm giá SALE, và Giá đại lý CTV.
                      </p>
                    </div>
                  </div>

                  {/* 1. Regular Selling Price */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                      1. Giá Bán Ra Tiêu Chuẩn (VNĐ) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        step={1000}
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                        placeholder="VD: 50000"
                        className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-black focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-[#8B84A8] font-bold">VNĐ</span>
                    </div>
                    <p className="text-[10.5px] text-[#6B658E]">
                      Giá bán thực tế cho khách vãng lai/thành viên khi không có chương trình khuyến mãi.
                    </p>
                  </div>

                  {/* 2. SALE Discount Toggle & Sale Price */}
                  <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    formData.isSale ? 'bg-red-950/20 border-red-500/40 shadow-inner' : 'bg-[#0F0F1A] border-white/5'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#F0EDFF] flex items-center gap-1.5">
                          <Percent className={`w-3.5 h-3.5 ${formData.isSale ? 'text-red-400' : 'text-[#8B84A8]'}`} />
                          <span>Chương Trình Khuyến Mãi / Giảm Giá SALE</span>
                          {formData.isSale && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-red-600 text-white">
                              ĐANG BẬT SALE
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-[#8B84A8]">
                          {formData.isSale
                            ? 'Ngoài web sẽ hiển thị Giá Sale (nổi bật), gạch ngang Giá Bán Ra cũ kèm nhãn [SALE].'
                            : 'Hiện đang tắt. Ngoài web chỉ hiện DUY NHẤT 1 GIÁ BÁN RA (không gạch giá, không nhãn sale).'}
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.isSale}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData({
                              ...formData,
                              isSale: checked,
                              salePrice: checked ? (formData.salePrice && formData.salePrice > 0 ? formData.salePrice : Math.round(formData.price * 0.8)) : 0,
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    {/* Sale Price Input when active */}
                    {formData.isSale && (
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <label className="text-[10.5px] font-semibold text-red-300 uppercase block">
                          Giá Khuyến Mãi / Flash SALE (VNĐ) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={formData.salePrice || ''}
                            onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) || 0 })}
                            placeholder="VD: 39000"
                            className="w-full bg-[#161626] border border-red-500/40 rounded-xl px-3.5 py-2.5 text-sm text-red-400 font-black focus:outline-none focus:border-red-500"
                          />
                          <span className="absolute right-3.5 top-2.5 text-xs text-red-300 font-bold">VNĐ</span>
                        </div>

                        {/* Live Discount Calculation Preview */}
                        {formData.price > 0 && formData.salePrice && formData.salePrice > 0 && formData.salePrice < formData.price && (
                          <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 flex items-center justify-between text-xs">
                            <span className="text-[#CBC7E0]">Mức giảm giá tự động:</span>
                            <span className="font-extrabold text-red-400">
                              Giảm {Math.round(((formData.price - formData.salePrice) / formData.price) * 100)}% (Tiết kiệm {(formData.price - formData.salePrice).toLocaleString('vi-VN')}đ)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Seller / CTV Pricing */}
                  <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-cyan-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider block">
                        3. Giá Bán Dành Cho Đại Lý / Cộng Tác Viên (CTV)
                      </label>
                      <Badge variant="info" size="sm">Đại Lý / CTV</Badge>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={formData.sellerPrice || ''}
                        onChange={(e) => setFormData({ ...formData, sellerPrice: Number(e.target.value) || 0 })}
                        placeholder="Để trống hoặc điền 0 nếu không giảm"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-[#8B84A8] font-bold">VNĐ</span>
                    </div>
                    <p className="text-[10.5px] text-[#8B84A8] leading-relaxed">
                      💡 <em>Nếu để trống hoặc điền 0, CTV sẽ mua theo đúng giá bán ra bình thường (không giảm gì cả).</em>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: FILE ATTACHMENTS (FOR ALL FILE TYPES: APK, ZIP, RAR, EXE, TXT...) */}
            {/* ========================================================================= */}
            {drawerTab === 'files' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161626] to-[#0F0F1A] border border-cyan-500/30 space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-[#F0EDFF] flex items-center gap-1.5">
                      <FileUp className="w-4 h-4 text-cyan-400" />
                      <span>Đính Kèm Tệp Cài Đặt (Hỗ Trợ TẤT CẢ Loại Tệp: APK, ZIP, RAR, EXE, TXT...)</span>
                    </h4>
                    <p className="text-[11px] text-[#8B84A8] mt-0.5">
                      Cho phép bạn tải tệp trực tiếp từ máy tính lên hệ thống hoặc cung cấp link tải Google Drive/OneDrive.
                    </p>
                  </div>

                  {/* 1. Direct Computer File Uploader */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                      1. Tải Tệp Trực Tiếp Từ Máy Tính (ALL Loại Tệp)
                    </label>

                    <input
                      type="file"
                      id="product-any-file-upload"
                      accept="*/*"
                      className="hidden"
                      onChange={(e) => handleAnyFileUpload(e.target.files)}
                    />

                    {formData.attachedFileName ? (
                      <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-emerald-500/40 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                              <FileIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-mono font-bold text-xs text-emerald-300 select-all">
                                {formData.attachedFileName}
                              </div>
                              <div className="text-[10px] text-[#8B84A8]">
                                Dung lượng: {formData.attachedFileSize || 'Sẵn sàng tải xuống'} • Đã sẵn sàng bàn giao
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {formData.attachedFileData && (
                              <a
                                href={formData.attachedFileData}
                                download={formData.attachedFileName}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Tải thử
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={removeAttachedFile}
                              className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                              title="Gỡ tệp"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => document.getElementById('product-any-file-upload')?.click()}
                        className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 bg-[#0F0F1A] rounded-2xl p-6 text-center transition-colors cursor-pointer space-y-2"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-xs text-[#F0EDFF]">
                          Bấm vào đây để chọn tệp từ máy tính (APK, ZIP, RAR, EXE, TXT, PDF, IPA...)
                        </div>
                        <div className="text-[11px] text-[#8B84A8]">
                          Hỗ trợ mọi định dạng tệp tin. Khách hàng sẽ có nút 1-click tải trực tiếp trong đơn hàng.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. External Download URL */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <Download className="w-3.5 h-3.5" />
                        <span>2. Hoặc Nhập Link Tải Ngoài (Google Drive / OneDrive / MediaFire)</span>
                      </span>
                      {formData.downloadUrl && (
                        <a
                          href={formData.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          Mở link thử &rarr;
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={formData.downloadUrl || ''}
                      onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                      placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                      className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: ACCOUNTS STORAGE (FOR ACC GAME / ACC FF) OR PACKAGES (FOR KEYS) */}
            {/* ========================================================================= */}
            {drawerTab === 'packages' && (
              <div className="space-y-4">
                {isAccountCategory(formData.category) ? (
                  /* ================= SPECIFIC ACCOUNT / ACC FF FORM ================= */
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161626] to-[#0F0F1A] border border-cyan-500/30 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-[#F0EDFF] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-cyan-400" />
                            <span>Thông Tin Tài Khoản & Mật Khẩu (Acc Free Fire / Game)</span>
                          </h4>
                          <p className="text-[11px] text-[#8B84A8] mt-0.5">
                            Sản phẩm Tài khoản sẽ tự động cấp <strong>Tài Khoản | Mật Khẩu | 2FA</strong> trực tiếp cho khách khi mua (Không dùng mã Key).
                          </p>
                        </div>
                        <Badge variant="info" size="sm">
                          Acc Game / FF
                        </Badge>
                      </div>

                      {/* 1. Single Account Form */}
                      <div className="p-3.5 rounded-xl bg-[#0F0F1A] border border-white/10 space-y-3">
                        <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                          <span>1. Nhập thông tin Nick cụ thể:</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10.5px] font-semibold text-[#8B84A8] uppercase">
                              Tài khoản / Email / SĐT đăng nhập *
                            </label>
                            <input
                              type="text"
                              value={formData.accountUsername || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  accountUsername: val,
                                  licenseKeys: `🎮 TÀI KHOẢN: ${val}\n🔑 MẬT KHẨU: ${prev.accountPassword || ''}${prev.account2FA ? `\n🛡️ 2FA / GHI CHÚ: ${prev.account2FA}` : ''}`,
                                }));
                              }}
                              placeholder="VD: thanhgame.ff01@gmail.com hoặc 0916396901"
                              className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-[#7C3AED]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-semibold text-[#8B84A8] uppercase">
                              Mật khẩu đăng nhập *
                            </label>
                            <input
                              type="text"
                              value={formData.accountPassword || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  accountPassword: val,
                                  licenseKeys: `🎮 TÀI KHOẢN: ${prev.accountUsername || ''}\n🔑 MẬT KHẨU: ${val}${prev.account2FA ? `\n🛡️ 2FA / GHI CHÚ: ${prev.account2FA}` : ''}`,
                                }));
                              }}
                              placeholder="VD: Thanox@2026vip"
                              className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-[#7C3AED]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10.5px] font-semibold text-[#8B84A8] uppercase">
                            Mã 2FA / Code Dự Phòng / Ghi chú đăng nhập (Tùy chọn)
                          </label>
                          <input
                            type="text"
                            value={formData.account2FA || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                account2FA: val,
                                licenseKeys: `🎮 TÀI KHOẢN: ${prev.accountUsername || ''}\n🔑 MẬT KHẨU: ${prev.accountPassword || ''}${val ? `\n🛡️ 2FA / GHI CHÚ: ${val}` : ''}`,
                              }));
                            }}
                            placeholder="VD: 894012 (Nick Đăng nhập VK / Có Skin AK Rồng Xanh lv7)"
                            className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                          />
                        </div>
                      </div>

                      {/* 2. Bulk Accounts List */}
                      <div className="p-3.5 rounded-xl bg-[#0F0F1A] border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                            <span>2. Hoặc dán danh sách nhiều Nick vào kho (Giao tự động từng nick):</span>
                          </div>
                          <span className="text-[10.5px] text-emerald-400 font-black">
                            📦 {formData.accountsList ? formData.accountsList.split('\n').filter((l) => l.trim().length > 0).length : (formData.accountUsername ? 1 : 0)} Acc trong kho
                          </span>
                        </div>

                        <p className="text-[11px] text-[#8B84A8]">
                          Định dạng: <code>taikhoan|matkhau</code> hoặc <code>taikhoan|matkhau|2fa_ghi_chu</code> (Mỗi dòng 1 nick). Hệ thống sẽ tự động giao từng nick khi khách thanh toán.
                        </p>

                        <textarea
                          rows={4}
                          value={formData.accountsList || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const count = val.split('\n').filter((l) => l.trim().length > 0).length;
                            setFormData((prev) => ({
                              ...prev,
                              accountsList: val,
                              stock: count > 0 ? count : prev.stock,
                              licenseKeys: val || prev.licenseKeys,
                            }));
                          }}
                          placeholder="thanhgame.ff01@gmail.com|FreeFire@VIP2026|894012 (VK)&#10;thanhgame.ff02@gmail.com|FreeFire@VIP2026|192834 (FB)&#10;thanhgame.ff03@gmail.com|FreeFire@VIP2026|778899 (VK)"
                          className="w-full bg-[#161626] border border-white/10 rounded-xl p-3 text-xs text-cyan-200 font-mono focus:outline-none focus:border-[#7C3AED] leading-relaxed"
                        />

                        <div className="flex justify-between items-center pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              const sampleList = "thanhgame.ff01@gmail.com|FreeFire@VIP2026|894012 (Đăng nhập VK)\nthanhgame.ff02@gmail.com|FreeFire@VIP2026|192834 (Đăng nhập FB)\nthanhgame.ff03@gmail.com|FreeFire@VIP2026|778899 (Đăng nhập VK)";
                              setFormData((prev) => ({
                                ...prev,
                                accountsList: sampleList,
                                stock: 3,
                                licenseKeys: sampleList,
                              }));
                              showToast('Đã dán 3 nick mẫu vào kho!', 'success');
                            }}
                            className="text-cyan-400 hover:underline cursor-pointer font-bold"
                          >
                            + Dán nhanh 3 nick mẫu
                          </button>

                          {formData.accountsList && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  accountsList: '',
                                  stock: prev.accountUsername ? 1 : 0,
                                }));
                              }}
                              className="text-red-400 hover:underline cursor-pointer"
                            >
                              Xóa kho nick
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= REGULAR KEY / FILE PACKAGES FORM ================= */
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161626] to-[#0F0F1A] border border-[#7C3AED]/20 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-[#F0EDFF] flex items-center gap-1.5">
                            <Key className="w-4 h-4 text-cyan-400" />
                            <span>Thêm Gói Dịch Vụ / Thời Hạn Key Mới</span>
                          </h4>
                          <p className="text-[11px] text-[#8B84A8] mt-0.5">
                            Thiết lập các gói thời gian (1 Giờ, 1 Ngày, 7 Ngày, 1 Tháng, Vĩnh Viễn...) và giá bán riêng
                          </p>
                        </div>
                      </div>

                      {/* Quick suggestion pills */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#6B658E] font-semibold block">Gợi ý nhanh tên gói:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['1 GIỜ', '1 NGÀY', '3 NGÀY', '7 NGÀY', '15 NGÀY', '1 THÁNG', '3 THÁNG', '1 NĂM', 'VĨNH VIỄN'].map((suggestName) => (
                            <button
                              key={suggestName}
                              type="button"
                              onClick={() => setPkgNameInput(suggestName)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                                pkgNameInput === suggestName
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                  : 'bg-[#161626] border-white/10 text-[#8B84A8] hover:text-white hover:border-white/20'
                              }`}
                            >
                              {suggestName}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Package Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-semibold text-[#8B84A8] uppercase">
                            Tên Gói / Thời Hạn *
                          </label>
                          <input
                            type="text"
                            value={pkgNameInput}
                            onChange={(e) => setPkgNameInput(e.target.value)}
                            placeholder="VD: 1 NGÀY, 1 THÁNG..."
                            className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10.5px] font-semibold text-[#8B84A8] uppercase">
                            Giá Bán (VND) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={pkgPriceInput}
                            onChange={(e) => setPkgPriceInput(Number(e.target.value))}
                            className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10.5px] font-semibold text-[#8B84A8] uppercase">
                            Giá Gốc / Gạch (VND)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={pkgOrigPriceInput}
                            onChange={(e) => setPkgOrigPriceInput(Number(e.target.value))}
                            className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10.5px] font-semibold text-[#8B84A8] uppercase">
                            Giá Đại Lý / CTV (VND)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={pkgSellerPriceInput}
                            onChange={(e) => setPkgSellerPriceInput(Number(e.target.value))}
                            className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-semibold text-[#8B84A8] uppercase">
                          Nội Dung Giao Key / Link Tải Riêng Cho Gói Này (Tùy chọn)
                        </label>
                        <textarea
                          rows={2}
                          value={pkgKeysInput}
                          onChange={(e) => setPkgKeysInput(e.target.value)}
                          placeholder="Nếu để trống sẽ tự động lấy nội dung giao ở Tab 'Giao Hàng'..."
                          className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl p-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <Button
                          type="button"
                          variant="primary"
                          size="xs"
                          onClick={() => {
                            if (!pkgNameInput.trim()) {
                              showToast('Vui lòng nhập tên gói', 'error');
                              return;
                            }
                            if (pkgPriceInput <= 0) {
                              showToast('Giá bán phải lớn hơn 0', 'error');
                              return;
                            }
                            const newPkg: ProductPackage = {
                              id: 'pkg-' + Date.now(),
                              name: pkgNameInput.trim().toUpperCase(),
                              price: pkgPriceInput,
                              originalPrice: pkgOrigPriceInput > 0 ? pkgOrigPriceInput : undefined,
                              sellerPrice: pkgSellerPriceInput > 0 ? pkgSellerPriceInput : undefined,
                              keys: pkgKeysInput.trim() || undefined,
                            };
                            setFormData((prev) => ({
                              ...prev,
                              packages: [...(prev.packages || []), newPkg],
                            }));
                            showToast(`Đã thêm gói ${newPkg.name} thành công!`, 'success');
                            setPkgKeysInput('');
                          }}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Thêm Gói Này
                        </Button>
                      </div>
                    </div>

                    {/* Preset Fast Template Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#161626] border border-white/5">
                      <div className="text-[11px] text-[#CBC7E0] font-semibold">
                        ⚡ Nạp nhanh các gói mẫu chuẩn:
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                          const basePrice = formData.price || 50000;
                          const standardPackages: ProductPackage[] = [
                            { id: 'pkg-' + Date.now() + '-1', name: '1 GIỜ', price: Math.round(basePrice * 0.2), originalPrice: Math.round(basePrice * 0.35), sellerPrice: Math.round(basePrice * 0.15) },
                            { id: 'pkg-' + Date.now() + '-2', name: '1 NGÀY', price: Math.round(basePrice * 0.4), originalPrice: Math.round(basePrice * 0.6), sellerPrice: Math.round(basePrice * 0.3) },
                            { id: 'pkg-' + Date.now() + '-3', name: '7 NGÀY', price: Math.round(basePrice * 0.8), originalPrice: basePrice, sellerPrice: Math.round(basePrice * 0.6) },
                            { id: 'pkg-' + Date.now() + '-4', name: '1 THÁNG', price: basePrice, originalPrice: Math.round(basePrice * 1.4), sellerPrice: Math.round(basePrice * 0.7) },
                            { id: 'pkg-' + Date.now() + '-5', name: 'VĨNH VIỄN', price: Math.round(basePrice * 2.5), originalPrice: Math.round(basePrice * 3.5), sellerPrice: Math.round(basePrice * 1.8) },
                          ];
                          setFormData((prev) => ({
                            ...prev,
                            packages: standardPackages,
                          }));
                          showToast('Đã nạp 5 gói thời hạn chuẩn (1 Giờ - 1 Ngày - 7 Ngày - 1 Tháng - Vĩnh Viễn)', 'success');
                        }}
                        className="font-bold border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                      >
                        Nạp Bộ 5 Gói Chuẩn
                      </Button>
                    </div>

                    {/* List of Configured Packages */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#F0EDFF]">
                        <span>Danh Sách Gói Hiện Có ({(formData.packages || []).length})</span>
                        {(formData.packages || []).length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, packages: [] }))}
                            className="text-[10px] text-red-400 hover:underline cursor-pointer"
                          >
                            Xóa tất cả
                          </button>
                        )}
                      </div>

                      {(formData.packages || []).length === 0 ? (
                        <div className="p-6 rounded-2xl bg-[#161626] border border-dashed border-white/10 text-center text-xs text-[#8B84A8]">
                          Chưa có gói thời hạn nào. Hãy bấm <strong>"Nạp Bộ 5 Gói Chuẩn"</strong> hoặc tự tạo gói ở trên!
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(formData.packages || []).map((pkg, idx) => (
                            <div
                              key={pkg.id}
                              className="p-3 rounded-xl bg-[#161626] border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-black text-[10px]">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="font-black text-[#F0EDFF] uppercase">{pkg.name}</div>
                                  {pkg.keys && (
                                    <div className="text-[10px] text-[#6B658E] font-mono line-clamp-1">
                                      Key riêng: {pkg.keys}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-black text-emerald-400">
                                    {pkg.price.toLocaleString('vi-VN')} VND
                                  </div>
                                  {pkg.sellerPrice && (
                                    <div className="text-[10px] text-cyan-300">
                                      CTV: {pkg.sellerPrice.toLocaleString('vi-VN')}đ
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      packages: (prev.packages || []).filter((p) => p.id !== pkg.id),
                                    }));
                                    showToast(`Đã xóa gói ${pkg.name}`, 'info');
                                  }}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                                  title="Xóa gói"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: LOCAL COMPUTER IMAGE UPLOAD & GALLERY */}
            {/* ========================================================================= */}
            {drawerTab === 'images' && (
              <div className="space-y-4">
                {/* Upload from Computer Drag & Drop Area */}
                <div className="border-2 border-dashed border-[#7C3AED]/40 hover:border-[#7C3AED] bg-[#161626]/60 rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    id="product-image-upload"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageFilesUpload(e.target.files)}
                  />
                  <label htmlFor="product-image-upload" className="cursor-pointer block space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 mx-auto flex items-center justify-center text-[#9D5CF6]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-xs text-[#F0EDFF]">
                      Bấm để chọn ảnh từ máy tính hoặc kéo thả vào đây
                    </div>
                    <div className="text-[11px] text-[#8B84A8]">
                      Hỗ trợ PNG, JPG, WEBP, GIF. Tự động lưu trữ ảnh chất lượng cao.
                    </div>
                  </label>
                </div>

                {/* Direct Image URL input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    Hoặc nhập URL ảnh trực tiếp:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      className="flex-1 bg-[#161626] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setFormData((prev) => ({
                              ...prev,
                              images: [...(prev.images || []), val],
                              image: prev.image || val,
                            }));
                            (e.target as HTMLInputElement).value = '';
                            showToast('Đã thêm link ảnh!', 'success');
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Uploaded Images Gallery Grid */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Bộ sưu tập ảnh ({formData.images?.length || 0})
                    </span>
                    <span className="text-[10px] text-amber-400">
                      * Nhấp vào ngôi sao để chọn ảnh đại diện chính
                    </span>
                  </div>

                  {(!formData.images || formData.images.length === 0) ? (
                    <div className="p-6 text-center text-xs text-[#6B658E] border border-white/5 rounded-2xl bg-[#0F0F1A]">
                      Chưa có hình ảnh nào. Hãy tải ảnh từ máy tính lên!
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {formData.images.map((imgUrl, idx) => {
                        const isPrimary = formData.image === imgUrl || (!formData.image && idx === 0);
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-2xl overflow-hidden border group bg-[#0F0F1A] aspect-square flex items-center justify-center ${
                              isPrimary ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/40' : 'border-white/10'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Preview ${idx}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Badge if primary */}
                            {isPrimary && (
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#7C3AED] text-white text-[9px] font-bold flex items-center gap-1 shadow-md z-10">
                                <Star className="w-2.5 h-2.5 fill-white" /> Chính
                              </div>
                            )}

                            {/* Hover overlay actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(imgUrl)}
                                  className="p-1.5 rounded-lg bg-[#7C3AED] text-white hover:bg-[#9D5CF6] transition-colors cursor-pointer"
                                  title="Đặt làm ảnh chính"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                                title="Xóa ảnh"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: AUTO DELIVERY PREVIEW & INSTRUCTIONS */}
            {/* ========================================================================= */}
            {drawerTab === 'delivery' && (
              <div className="space-y-4">
                {isAccountCategory(formData.category) ? (
                  /* ================= AUTO DELIVERY FOR ACCOUNT / ACC FF ================= */
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-cyan-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>Bàn Giao Tài Khoản & Mật Khẩu Tự Động</span>
                        </h4>
                        <Badge variant="info" size="sm">Tự động bàn giao 100%</Badge>
                      </div>

                      <p className="text-[11px] text-[#8B84A8]">
                        Khách mua sản phẩm này sẽ nhận được <strong>Tài Khoản | Mật Khẩu | 2FA</strong> ngay lập tức trong phần chi tiết đơn hàng kèm nút Sao chép tiện lợi.
                      </p>

                      {/* Live Preview Box */}
                      <div className="p-3.5 rounded-xl bg-[#161626] border border-white/10 space-y-2">
                        <div className="text-[10.5px] uppercase font-bold text-[#8B84A8]">
                          Giao diện khách hàng nhìn thấy trong đơn hàng:
                        </div>
                        <div className="p-3 rounded-lg bg-[#080A14] border border-slate-800 font-mono text-xs text-emerald-400 space-y-1.5">
                          <div>🎮 <strong>Tài khoản:</strong> {formData.accountUsername || ((formData.accountsList || '').split('|')[0] || 'thanhgaming.ff@gmail.com')}</div>
                          <div>🔑 <strong>Mật khẩu:</strong> {formData.accountPassword || ((formData.accountsList || '').split('|')[1]?.split('\n')[0] || 'Thanox@2026')}</div>
                          {(formData.account2FA || (formData.accountsList || '').split('|')[2]) && (
                            <div>🛡️ <strong>2FA / Ghi chú:</strong> {formData.account2FA || (formData.accountsList || '').split('|')[2]?.split('\n')[0]}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Instructions for login */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider flex items-center gap-1.5 text-purple-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hướng Dẫn Đăng Nhập & Bảo Hành Nick (Tùy chọn)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.instructions || ''}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="1. Mở game Free Fire -> Chọn đăng nhập qua Facebook hoặc VK.&#10;2. Nhập tài khoản và mật khẩu được cấp ở trên.&#10;3. Đổi mật khẩu ngay sau khi đăng nhập để đảm bảo an toàn tuyệt đối!"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>
                ) : (
                  /* ================= AUTO DELIVERY FOR REGULAR FILES & KEYS ================= */
                  <div className="space-y-4">
                    {/* 1. Attached File / Direct Link Delivery Preview */}
                    <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-cyan-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                          <Download className="w-4 h-4 text-cyan-400" />
                          <span>Tệp Cài Đặt Khách Hàng Sẽ Nhận</span>
                        </h4>
                        <Badge variant="info" size="sm">Download 1-Click</Badge>
                      </div>

                      {formData.attachedFileName ? (
                        <div className="p-3 rounded-xl bg-[#161626] border border-emerald-500/30 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <FileIcon className="w-5 h-5 text-emerald-400" />
                            <div>
                              <div className="font-bold text-xs text-emerald-300 font-mono">{formData.attachedFileName}</div>
                              <div className="text-[10.5px] text-[#8B84A8]">{formData.attachedFileSize || 'File tải trực tiếp'}</div>
                            </div>
                          </div>
                          <span className="text-[10.5px] text-emerald-400 font-bold">✓ Tệp đính kèm</span>
                        </div>
                      ) : formData.downloadUrl ? (
                        <div className="p-3 rounded-xl bg-[#161626] border border-cyan-500/30 font-mono text-xs text-cyan-300 truncate">
                          🔗 Link tải: {formData.downloadUrl}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#8B84A8]">
                          Chưa có tệp đính kèm hoặc link tải. Hãy bổ sung ở Tab <strong>"3. Tệp Đính Kèm"</strong>.
                        </p>
                      )}
                    </div>

                    {/* 2. License Key / Auto Delivery Content */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                        <Key className="w-3.5 h-3.5" />
                        <span>Mã License Key / Khóa Kích Hoạt Tự Động (Tùy chọn)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.licenseKeys || formData.downloadLinkOrKeys || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            licenseKeys: e.target.value,
                            downloadLinkOrKeys: e.target.value,
                          })
                        }
                        placeholder="VD: TX-PRO-2026-889922 (Mỗi key 1 dòng hoặc ghi chú kích hoạt)"
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] font-mono"
                      />
                      <span className="text-[10px] text-[#6B658E]">
                        Khách hàng có thể bấm 1 nút để sao chép mã Key này ngay sau khi thanh toán.
                      </span>
                    </div>

                    {/* 3. Setup Instructions */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hướng Dẫn Cài Đặt & Kích Hoạt (Tùy chọn)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.instructions || ''}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="VD: 1. Cài đặt file APK -> 2. Cấp quyền Root / Magisk -> 3. Dán key để kích hoạt..."
                        className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteProduct(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Xóa Sản Phẩm?"
        message="Bạn có chắc chắn muốn xóa sản phẩm này khỏi kho? Hành động này không thể hoàn tác."
        confirmLabel="Xác nhận xóa"
        variant="danger"
      />
    </div>
  );
};
