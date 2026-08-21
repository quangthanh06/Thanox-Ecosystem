import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Category } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
} from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, showToast } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    icon: string;
    image: string;
    status: 'active' | 'hidden';
  }>({
    name: '',
    slug: '',
    icon: '📱',
    image: '',
    status: 'active',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openCreateModal = () => {
    setEditingCat(null);
    setFormData({
      name: '',
      slug: '',
      icon: '📱',
      image: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '📱',
      image: cat.image || (cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:image')) ? cat.icon : ''),
      status: cat.status,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP, SVG)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa là 5MB', 'warning');
      return;
    }

          setIsUploading(true);
      try {
        const url = await uploadMediaToSupabase(file, 'categories');
        setFormData((prev) => ({
          ...prev,
          image: url,
        }));
        showToast('T?i ?nh d?i di?n danh m?c l�n Cloud th�nh c�ng!', 'success');
      } catch (e) {
        showToast('L?i khi t?i ?nh l�n Cloud', 'error');
      } finally {
        setIsUploading(false);
      }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (editingCat) {
      updateCategory(editingCat.id, {
        ...formData,
        slug,
        icon: formData.image || formData.icon || '📱',
        image: formData.image,
      });
      showToast(`Đã cập nhật danh mục "${formData.name}"`, 'success');
    } else {
      addCategory({
        ...formData,
        slug,
        icon: formData.image || formData.icon || '📱',
        image: formData.image,
      });
      showToast(`Đã thêm danh mục mới "${formData.name}"`, 'success');
    }
    setIsModalOpen(false);
  };

  // Sample icon choices
  const sampleIcons = ['📱', '🍎', '🎮', '🌐', '👤', '🔧', '⚡', '🔥', '💎', '🚀', '👑', '🛡️', '📦', '💻', '🎯'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F1A] border border-white/5 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-[#F0EDFF]">Danh Mục Phân Loại</h2>
            <Badge variant="brand" size="xs">
              {categories.length} nhóm
            </Badge>
          </div>
          <p className="text-xs text-[#6B658E] mt-0.5">
            Tổ chức cây thư mục và danh mục hiển thị cho khách hàng chọn mua (hỗ trợ ảnh đại diện & icon)
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Thêm Danh Mục Mới
        </Button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="w-6 h-6 text-[#9D5CF6]" />}
          title="Chưa có danh mục nào"
          description="Tạo danh mục để phân loại các sản phẩm như File Android, Menu FF, Proxy..."
          actionLabel="Tạo Danh Mục Đầu Tiên"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const actualCount = products.filter((p) => p.category === cat.name).length;
            const hasImage = cat.image || (cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:image')));

            return (
              <Card
                key={cat.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-[#7C3AED]/40 transition-all group"
                variant="interactive"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    {/* Category Avatar / Icon Box */}
                    <div className="w-12 h-12 rounded-2xl bg-[#161626] border border-white/10 flex items-center justify-center text-xl shadow-inner overflow-hidden flex-shrink-0 relative group-hover:border-[#7C3AED]/50 transition-colors">
                      {hasImage ? (
                        <img
                          src={cat.image || cat.icon}
                          alt={cat.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-2xl">{cat.icon || '📱'}</span>
                      )}
                    </div>

                    <Badge variant={cat.status === 'active' ? 'success' : 'neutral'} size="xs" dot>
                      {cat.status === 'active' ? 'Hiển thị' : 'Đang ẩn'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-[#F0EDFF] truncate">{cat.name}</h3>
                    <p className="text-[11px] text-[#6B658E] font-mono mt-0.5 truncate">/{cat.slug}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-[#8B84A8] font-semibold">{actualCount} sản phẩm</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg bg-[#161626] hover:bg-[#1E1E30] text-[#8B84A8] hover:text-white transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(cat.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCat ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingCat ? 'Lưu Thay Đổi' : 'Thêm Danh Mục'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Avatar / Image Upload Section */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#161626]/80 border border-white/5">
            <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider block">
              Ảnh Đại Diện / Avatar Danh Mục
            </label>

            <div className="flex items-center gap-3.5">
              {/* Image / Avatar Preview Box */}
              <div className="w-16 h-16 rounded-2xl bg-[#0F0F1A] border border-white/10 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 relative shadow-inner">
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                      title="Gỡ ảnh"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <span>{formData.icon || '📱'}</span>
                )}
              </div>

              {/* Upload buttons */}
              <div className="space-y-2 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
                    className="font-bold border-white/10 hover:border-cyan-400"
                  >
                    Tải ảnh từ máy tính
                  </Button>
                </div>

                <div className="relative">
                  <LinkIcon className="w-3 h-3 text-[#8B84A8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Hoặc dán link ảnh (https://...)"
                    className="w-full bg-[#0F0F1A] border border-white/10 rounded-xl pl-7 pr-3 py-1.5 text-[11px] text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Emoji selection */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="text-[10.5px] text-[#8B84A8]">Hoặc chọn biểu tượng Emoji mặc định:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sampleIcons.map((ic) => (
                  <button
                    type="button"
                    key={ic}
                    onClick={() => setFormData({ ...formData, icon: ic, image: '' })}
                    className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center border transition-all cursor-pointer ${
                      !formData.image && formData.icon === ic
                        ? 'bg-[#7C3AED]/20 border-[#7C3AED] scale-110 shadow-sm'
                        : 'bg-[#0F0F1A] border-white/10 hover:bg-[#1E1E30]'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
              Tên Danh Mục *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: File Android, File iOS, Menu VIP, Proxy..."
              className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
              Đường Dẫn Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="VD: file-android (để trống sẽ tự tạo)"
              className="w-full bg-[#161626] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F0EDFF] font-mono focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
              Trạng Thái Hiển Thị
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
            >
              <option value="active">🟢 Hiển thị trên cửa hàng</option>
              <option value="hidden">⚪ Đang ẩn</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteCategory(deleteTargetId);
            setDeleteTargetId(null);
            showToast('Đã xóa danh mục thành công', 'info');
          }
        }}
        title="Xóa Danh Mục?"
        message="Xóa danh mục này có thể ảnh hưởng đến hiển thị nhóm sản phẩm. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Xóa danh mục"
        variant="danger"
      />
    </div>
  );
};
