import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, ProductStatus } from '../types';
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
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    showToast,
  } = useStore();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'sold_desc' | 'newest'>('newest');

  // Form Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [drawerTab, setDrawerTab] = useState<'basic' | 'images' | 'delivery'>('basic');

  // Form Fields
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    price: number;
    originalPrice: number;
    sellerPrice?: number;
    image?: string;
    images?: string[];
    stock: number | 'unlimited';
    status: ProductStatus;
    description: string;
    downloadUrl?: string;
    licenseKeys?: string;
    instructions?: string;
    downloadLinkOrKeys: string;
    featured: boolean;
  }>({
    name: '',
    category: categories[0]?.name || 'File Android',
    price: 50000,
    originalPrice: 70000,
    sellerPrice: 35000,
    image: '',
    images: [],
    stock: 'unlimited',
    status: 'active',
    description: '',
    downloadUrl: '',
    licenseKeys: '',
    instructions: '',
    downloadLinkOrKeys: '',
    featured: false,
  });

  // Delete Dialog State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleImageFilesUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormData((prev) => {
            const currentImages = prev.images || [];
            const newImages = [...currentImages, result];
            return {
              ...prev,
              images: newImages,
              image: prev.image || result, // If no primary image set, set this one as primary
            };
          });
          showToast('Đã tải ảnh lên thành công!', 'success');
        }
      };
      reader.readAsDataURL(file);
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
    }));
    showToast('Đã đặt làm ảnh đại diện chính!', 'success');
  };

  const openCreateDrawer = () => {
    setEditingProduct(null);
    setDrawerTab('basic');
    setFormData({
      name: '',
      category: categories[0]?.name || 'File Android',
      price: 50000,
      originalPrice: 70000,
      sellerPrice: 35000,
      image: '',
      images: [],
      stock: 'unlimited',
      status: 'active',
      description: '',
      downloadUrl: '',
      licenseKeys: '',
      instructions: '',
      downloadLinkOrKeys: '',
      featured: false,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (product: Product) => {
    setEditingProduct(product);
    setDrawerTab('basic');
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      sellerPrice: product.sellerPrice || Math.round(product.price * 0.7),
      image: product.image || '',
      images: product.images || (product.image ? [product.image] : []),
      stock: product.stock,
      status: product.status,
      description: product.description,
      downloadUrl: product.downloadUrl || '',
      licenseKeys: product.licenseKeys || '',
      instructions: product.instructions || '',
      downloadLinkOrKeys: product.downloadLinkOrKeys || '',
      featured: product.featured,
    });
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên sản phẩm', 'error');
      return;
    }

    const payload = {
      ...formData,
      downloadLinkOrKeys: formData.licenseKeys || formData.downloadUrl || formData.downloadLinkOrKeys,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setIsDrawerOpen(false);
  };

  const handleDuplicate = (product: Product) => {
    const duplicatedData = {
      name: `${product.name} (Bản sao)`,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
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
    };
    addProduct(duplicatedData);
    showToast(`Đã nhân bản "${product.name}"`, 'success');
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
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#9D5CF6] shrink-0 font-bold">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#F0EDFF] flex items-center gap-2 truncate">
                            <span>{product.name}</span>
                            {product.featured && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                                HOT
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
            <Card key={product.id} className="p-4 space-y-3.5 flex flex-col justify-between" variant="interactive">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={product.status === 'active' ? 'success' : 'neutral'} size="xs" dot>
                    {product.status === 'active' ? 'Đang bán' : 'Đang ẩn'}
                  </Badge>

                  {product.featured && (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                      HOT
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-[#F0EDFF] truncate">{product.name}</h3>
                  <p className="text-[11px] text-[#6B658E] line-clamp-2 mt-1">
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
          {/* Drawer Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#161626] p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setDrawerTab('basic')}
              className={`flex-1 py-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                drawerTab === 'basic'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-[#8B84A8] hover:text-white'
              }`}
            >
              Thông Tin & Giá
            </button>

            <button
              type="button"
              onClick={() => setDrawerTab('images')}
              className={`flex-1 py-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                drawerTab === 'images'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-[#8B84A8] hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Hình Ảnh ({(formData.images || []).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerTab('delivery')}
              className={`flex-1 py-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                drawerTab === 'delivery'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-[#8B84A8] hover:text-white'
              }`}
            >
              Giao Tự Động
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* TAB 1: BASIC INFO & PRICING */}
            {drawerTab === 'basic' && (
              <div className="space-y-4">
                {/* Product Cover Image Upload (Direct from computer / URL) */}
                <div className="p-3.5 rounded-2xl bg-[#161626]/80 border border-white/5 space-y-2">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
                    Ảnh Bìa / Thumbnail Sản Phẩm
                  </label>
                  <div className="flex items-center gap-3.5">
                    {/* Preview */}
                    <div className="w-16 h-16 rounded-2xl bg-[#0F0F1A] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-inner">
                      {formData.image ? (
                        <>
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                image: '',
                                images: (formData.images || []).filter((im) => im !== formData.image),
                              })
                            }
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                            title="Gỡ ảnh"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <Package className="w-6 h-6 text-[#6B658E]" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 flex-1">
                      <input
                        type="file"
                        id="quick-product-cover-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith('image/')) {
                            showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            setFormData((prev) => ({
                              ...prev,
                              image: base64,
                              images: [base64, ...(prev.images || []).filter((im) => im !== base64)],
                            }));
                            showToast('Đã tải ảnh bìa sản phẩm thành công!', 'success');
                          };
                          reader.readAsDataURL(file);
                        }}
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => document.getElementById('quick-product-cover-upload')?.click()}
                          leftIcon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
                          className="font-bold border-white/10 hover:border-cyan-400"
                        >
                          Tải ảnh từ máy tính
                        </Button>
                      </div>

                      <input
                        type="text"
                        value={formData.image || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            image: val,
                            images: val ? [val, ...(prev.images || []).filter((im) => im !== val)] : prev.images,
                          }));
                        }}
                        placeholder="Hoặc dán link ảnh (https://...)"
                        className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>
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
                    placeholder="VD: Thanox Pro V2.5 Android File"
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Danh Mục
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
                      Trạng Thái
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

                {/* Price, Original Price, and Seller Price (CTV) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Giá Khách Lẻ (VNĐ) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Giá Gốc Gạch Đi (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#8B84A8] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                      Giá Đại Lý / CTV (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.sellerPrice ?? Math.round(formData.price * 0.7)}
                      onChange={(e) => setFormData({ ...formData, sellerPrice: Number(e.target.value) })}
                      className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-cyan-400 font-bold focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
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
                    <div className="font-semibold text-[#F0EDFF]">Ghim sản phẩm nổi bật (Featured)</div>
                    <div className="text-[10.5px] text-[#6B658E]">
                      Hiển thị nhãn HOT và ưu tiên vị trí đầu tiên ngoài trang khách
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* TAB 2: LOCAL COMPUTER IMAGE UPLOAD & GALLERY */}
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
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#7C3AED] text-white text-[9px] font-bold flex items-center gap-1 shadow-md">
                                <Star className="w-2.5 h-2.5 fill-white" /> Chính
                              </div>
                            )}

                            {/* Hover overlay actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(imgUrl)}
                                  className="p-1.5 rounded-lg bg-[#7C3AED] text-white hover:bg-[#9D5CF6] transition-colors"
                                  title="Đặt làm ảnh chính"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
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

            {/* TAB 3: AUTO DELIVERY & FILE DOWNLOAD & INSTRUCTIONS */}
            {drawerTab === 'delivery' && (
              <div className="space-y-4">
                {/* 1. Direct Download Link */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Download className="w-3.5 h-3.5" />
                      <span>1. Link Tải File Cài Đặt (Google Drive / OneDrive / Direct Link)</span>
                    </span>
                    {formData.downloadUrl && (
                      <a
                        href={formData.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#9D5CF6] hover:underline"
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
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 placeholder-[#6B658E] font-mono focus:outline-none focus:border-[#7C3AED]"
                  />
                  <span className="text-[10px] text-[#6B658E]">
                    Link này sẽ hiển thị thành nút &ldquo;📥 Tải File Cài Đặt&rdquo; trong chi tiết đơn hàng của khách.
                  </span>
                </div>

                {/* 2. License Key / Auto Delivery Content */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                    <Key className="w-3.5 h-3.5" />
                    <span>2. Mã License Key / Tài Khoản Bàn Giao Tự Động</span>
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
                    <span>3. Hướng Dẫn Cài Đặt & Lưu Ý Kỹ Thuật (Tùy chọn)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.instructions || ''}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="VD: 1. Cài đặt file APK -> 2. Cấp quyền Root / Magisk -> 3. Dán key để kích hoạt..."
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                {/* 4. Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
                    4. Mô Tả Tổng Quan Sản Phẩm
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả các tính năng ưu việt, tương thích thiết bị..."
                    className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
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
