import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Category } from '../types';
import { Card, CardHeader } from './ui/Card';
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
  Package,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, showToast } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    icon: string;
    status: 'active' | 'hidden';
  }>({
    name: '',
    slug: '',
    icon: '📱',
    status: 'active',
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCat(null);
    setFormData({
      name: '',
      slug: '',
      icon: '📱',
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
      status: cat.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (editingCat) {
      updateCategory(editingCat.id, { ...formData, slug });
    } else {
      addCategory({ ...formData, slug });
    }
    setIsModalOpen(false);
  };

  // Icon choices
  const sampleIcons = ['📱', '🎮', '⚡', '🍎', '🔥', '💎', '🚀', '👑', '🛡️', '📦'];

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
            Tổ chức cây thư mục và danh mục hiển thị cho khách hàng chọn mua
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

            return (
              <Card
                key={cat.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-[#7C3AED]/40 transition-all"
                variant="interactive"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-[#161626] border border-white/10 flex items-center justify-center text-xl shadow-inner">
                      {cat.icon}
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
        size="sm"
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
            <label className="text-[11px] font-semibold text-[#8B84A8] uppercase tracking-wider">
              Biểu Tượng (Icon)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {sampleIcons.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setFormData({ ...formData, icon: ic })}
                  className={`w-9 h-9 rounded-xl text-base flex items-center justify-center border transition-all cursor-pointer ${
                    formData.icon === ic
                      ? 'bg-[#7C3AED]/20 border-[#7C3AED] scale-110 shadow-sm'
                      : 'bg-[#161626] border-white/10 hover:bg-[#1E1E30]'
                  }`}
                >
                  {ic}
                </button>
              ))}
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
              placeholder="VD: File Android, Menu VIP..."
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
              Trạng Thái
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-[#161626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#F0EDFF] focus:outline-none focus:border-[#7C3AED]"
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
