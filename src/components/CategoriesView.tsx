import { uploadMediaToSupabase } from '../lib/supabase';
import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Category } from '../types';
import { CategoryIcon } from './ui/SafeImage';
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
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Cloud,
  RefreshCw,
} from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, syncAllCategoriesToCloud, showToast } = useStore();
  const [isSyncing, setIsSyncing] = useState(false);

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
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      showToast('Tải ảnh đại diện danh mục lên Cloud thành công!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi tải ảnh lên Cloud', 'error');
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

  const sampleIcons = ['📱', '🍎', '🎮', '🌐', '👤', '🔧', '⚡', '🔥', '💎', '🚀', '👑', '🛡️', '📦', '💻', '🎯'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-prominent border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-black text-[#F4F2FF] tracking-tight">Danh Mục Phân Loại</h2>
            <Badge variant="brand" size="xs">
              {categories.length} nhóm
            </Badge>
          </div>
          <p className="text-xs text-[#938EB5] mt-0.5">
            Cấu hình icon, hình ảnh đại diện và trạng thái hiển thị của các nhóm sản phẩm
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              setIsSyncing(true);
              await syncAllCategoriesToCloud(categories);
              setIsSyncing(false);
            }}
            disabled={isSyncing}
            leftIcon={isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4 text-cyan-400" />}
          >
            {isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Lên Cloud'}
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Thêm Danh Mục
          </Button>
        </div>
      </div>

      {/* Grid of Categories */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="w-6 h-6 text-[#C084FC]" />}
          title="Chưa có danh mục nào"
          description="Tạo danh mục đầu tiên để phân loại các file và key bản quyền."
          actionLabel="Tạo Danh Mục Đầu Tiên"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const productCount = products.filter((p) => p.category === cat.name).length;
            const hasImage = cat.image || (cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:image')));

            return (
              <Card
                key={cat.id}
                className="p-5 space-y-4 glass-standard border-white/8 hover:border-[#7C3AED]/40 transition-all group"
                variant="default"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl glass-subtle border border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                    <CategoryIcon icon={cat.icon} image={cat.image} name={cat.name} className="w-full h-full" />
                  </div>

                  <div className="flex items-center gap-1">
                    <Badge variant={cat.status === 'active' ? 'success' : 'neutral'} size="xs" dot>
                      {cat.status === 'active' ? 'Đang hiện' : 'Đang ẩn'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#F4F2FF] group-hover:text-[#C084FC] transition-colors">
                    {cat.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-[#938EB5] mt-1">
                    <span className="font-mono text-[11px] text-[#5C567A]">/{cat.slug}</span>
                    <span className="font-semibold text-white">{productCount} sản phẩm</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/6">
                  <Button variant="ghost" size="xs" onClick={() => openEditModal(cat)} leftIcon={<Edit2 className="w-3 h-3" />}>
                    Sửa
                  </Button>
                  <Button variant="danger" size="xs" onClick={() => setDeleteTargetId(cat.id)} leftIcon={<Trash2 className="w-3 h-3" />}>
                    Xóa
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCat ? `Chỉnh Sửa Danh Mục "${editingCat.name}"` : 'Tạo Danh Mục Mới'}
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
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Tên Danh Mục *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Hack Free Fire OB44"
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-[#F4F2FF]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Đường Dẫn Tĩnh (Slug)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="Tự động tạo nếu để trống..."
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-[#F4F2FF] font-mono"
            />
          </div>

          {/* Upload Ảnh Đại Diện / Icon */}
          <div className="space-y-2 pt-1 border-t border-white/6">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider flex items-center justify-between">
              <span>Hình Ảnh / Icon Danh Mục</span>
              {formData.image && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="text-red-400 hover:text-red-300 font-bold"
                >
                  Xóa ảnh
                </button>
              )}
            </label>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl glass-subtle border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{formData.icon}</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Tải Ảnh Lên Cloud
                </Button>
              </div>
            </div>

            {/* Quick Emoji selector */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-[#938EB5]">Hoặc chọn Emoji mặc định:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleIcons.map((ico) => (
                  <button
                    key={ico}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: ico, image: '' })}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm cursor-pointer transition-all ${
                      formData.icon === ico && !formData.image
                        ? 'btn-liquid-primary shadow-sm'
                        : 'glass-subtle hover:bg-white/10'
                    }`}
                  >
                    {ico}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Trạng Thái Hiển Thị
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-[#F4F2FF]"
            >
              <option value="active" className="bg-[#121220] text-white">🟢 Hiển thị trên Storefront</option>
              <option value="hidden" className="bg-[#121220] text-white">⚪ Tạm ẩn khỏi khách hàng</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteCategory(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Xóa Danh Mục Này?"
        message="Các sản phẩm thuộc danh mục này sẽ không bị xóa nhưng sẽ cần gán lại danh mục mới."
        confirmLabel="Xác Nhận Xóa"
        variant="danger"
      />
    </div>
  );
};
