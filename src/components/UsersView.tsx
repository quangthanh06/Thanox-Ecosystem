import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User, UserRole } from '../types';
import { Card } from './ui/Card';
import { StatCard } from './ui/StatCard';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';
import {
  Users,
  Search,
  Crown,
  Wallet,
  Lock,
  Unlock,
  Edit2,
  UserX,
  Key,
  CheckCircle2,
  Sparkles,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const {
    users,
    updateUser,
    deleteUser,
    adjustUserBalance,
    toggleBanUser,
    updateSellerStatus,
    adminResetPassword,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'users' | 'sellers'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleForm, setRoleForm] = useState<UserRole>('user');

  // Adjust balance modal
  const [adjustTargetUser, setAdjustTargetUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50000);
  const [adjustAction, setAdjustAction] = useState<'add' | 'subtract'>('add');
  const [adjustNote, setAdjustNote] = useState('');

  // Password Reset Modal (Admin Reset)
  const [resetPassTargetUser, setResetPassTargetUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Ban confirmation
  const [banTargetUser, setBanTargetUser] = useState<User | null>(null);

  // Delete confirmation
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);

  // Real calculations
  const totalUsers = users.length;
  const bannedUsers = users.filter((u) => u.status === 'banned').length;
  const sellerRequests = users.filter((u) => u.sellerStatus === 'pending');
  const activeSellers = users.filter((u) => u.sellerStatus === 'active');
  const totalUserBalance = users.reduce((sum, u) => sum + u.balance, 0);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger" size="xs" dot>Super Admin</Badge>;
      case 'vip':
        return <Badge variant="warning" size="xs" dot>VIP Member</Badge>;
      case 'affiliate':
        return <Badge variant="brand" size="xs" dot>Đối tác CTV</Badge>;
      default:
        return <Badge variant="neutral" size="xs">Thành viên</Badge>;
    }
  };

  const getSellerBadge = (status?: User['sellerStatus']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="xs" dot>Đại Lý Active</Badge>;
      case 'pending':
        return <Badge variant="warning" size="xs" dot>Chờ Duyệt Đại Lý</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="xs">Từ Chối</Badge>;
      case 'suspended':
        return <Badge variant="neutral" size="xs">Thu Hồi</Badge>;
      default:
        return null;
    }
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, { role: roleForm });
      setEditingUser(null);
    }
  };

  const handleConfirmAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustTargetUser) {
      const finalAmount = adjustAction === 'add' ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);
      adjustUserBalance(adjustTargetUser.id, finalAmount, adjustNote || 'Admin điều chỉnh số dư');
      setAdjustTargetUser(null);
    }
  };

  const handleAdminResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassTargetUser) return;
    if (!newPasswordInput || newPasswordInput.length < 6) {
      showToast('Mật khẩu mới phải từ 6 ký tự trở lên', 'error');
      return;
    }
    adminResetPassword(resetPassTargetUser.id, newPasswordInput);
    setResetPassTargetUser(null);
    setNewPasswordInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-prominent border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg sm:text-xl font-black text-[#F4F2FF] tracking-tight">Quản Lý Người Dùng & Đại Lý</h2>
            <Badge variant="brand" size="xs">
              {users.length} tài khoản
            </Badge>
            {sellerRequests.length > 0 && (
              <Badge variant="warning" size="xs" dot>
                {sellerRequests.length} đơn CTV chờ duyệt
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#938EB5] mt-0.5">
            Quản trị danh bạ thành viên, phê duyệt hồ sơ Đại lý / CTV, đổi mật khẩu và điều chỉnh số dư
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng Số Thành Viên"
          value={totalUsers.toString()}
          icon={<Users className="w-4 h-4" />}
          accentColor="brand"
        />

        <StatCard
          label="Hồ Sơ CTV Chờ Duyệt"
          value={sellerRequests.length.toString()}
          icon={<Crown className="w-4 h-4" />}
          trend={{ value: `${activeSellers.length} CTV active`, isPositive: true }}
          accentColor="warning"
        />

        <StatCard
          label="Tổng Số Dư Thành Viên"
          value={totalUserBalance > 0 ? `${totalUserBalance.toLocaleString('vi-VN')}đ` : '0đ'}
          icon={<Wallet className="w-4 h-4" />}
          accentColor="success"
        />

        <StatCard
          label="Tài Khoản Đang Khóa"
          value={bannedUsers.toString()}
          icon={<UserX className="w-4 h-4" />}
          trend={{ value: bannedUsers > 0 ? 'Vi phạm quy định' : 'Không có vi phạm', isPositive: bannedUsers === 0 }}
          accentColor="danger"
        />
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/6 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'btn-liquid-primary shadow-sm'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#C084FC]" />
          <span>Tất Cả Thành Viên ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sellers')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sellers'
              ? 'btn-liquid-primary shadow-sm'
              : 'glass-subtle text-[#938EB5] hover:text-white border border-white/8'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-300" />
          <span>Hồ Sơ Đại Lý / CTV</span>
          {sellerRequests.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              {sellerRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Filter Toolbar */}
          <Card className="p-4 space-y-3" variant="default">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#938EB5] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo username, email, số điện thoại..."
                  className="w-full glass-input rounded-2xl pl-9 pr-4 py-2 text-xs text-[#F4F2FF]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="glass-input rounded-2xl px-3 py-2 text-xs text-[#F4F2FF] cursor-pointer"
                >
                  <option value="all" className="bg-[#121220] text-white">Tất cả vai trò</option>
                  <option value="user" className="bg-[#121220] text-white">Thành viên</option>
                  <option value="vip" className="bg-[#121220] text-white">VIP Member</option>
                  <option value="affiliate" className="bg-[#121220] text-white">Đối tác CTV</option>
                  <option value="admin" className="bg-[#121220] text-white">Quản trị viên</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="glass-input rounded-2xl px-3 py-2 text-xs text-[#F4F2FF] cursor-pointer"
                >
                  <option value="all" className="bg-[#121220] text-white">Tất cả trạng thái</option>
                  <option value="active" className="bg-[#121220] text-white">🟢 Đang hoạt động</option>
                  <option value="banned" className="bg-[#121220] text-white">🔴 Bị khóa</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6 text-[#C084FC]" />}
              title="Không tìm thấy người dùng nào"
              description="Danh sách người dùng hiện đang trống hoặc không khớp với bộ lọc tìm kiếm."
            />
          ) : (
            <Card className="p-0 overflow-hidden" variant="default">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap min-w-[750px]">
                  <thead>
                    <tr className="bg-white/[0.02] text-[#938EB5] border-b border-white/6 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Tài Khoản</th>
                      <th className="py-3 px-4">Vai Trò</th>
                      <th className="py-3 px-4">Đại Lý</th>
                      <th className="py-3 px-4">Số Dư Ví</th>
                      <th className="py-3 px-4">Đã Mua</th>
                      <th className="py-3 px-4">Tổng Chi Tiêu</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                              {user.avatarText || user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#F4F2FF] truncate">{user.username}</div>
                              <div className="text-[10px] text-[#938EB5] truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>

                        <td className="py-3.5 px-4">
                          {getSellerBadge(user.sellerStatus) || (
                            <span className="text-[#5C567A] text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-300">
                          {user.balance.toLocaleString('vi-VN')}đ
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#F4F2FF]">{user.totalOrders} đơn</td>

                        <td className="py-3.5 px-4 font-mono text-[#938EB5]">
                          {user.totalSpent.toLocaleString('vi-VN')}đ
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={user.status === 'active' ? 'success' : 'danger'} size="xs" dot>
                            {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setResetPassTargetUser(user);
                                setNewPasswordInput('');
                              }}
                              className="p-1.5 rounded-xl glass-subtle hover:bg-white/10 text-[#938EB5] hover:text-amber-300 transition-colors cursor-pointer"
                              title="Đặt lại mật khẩu"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Adjust balance */}
                            <button
                              onClick={() => {
                                setAdjustTargetUser(user);
                                setAdjustAmount(50000);
                                setAdjustAction('add');
                              }}
                              className="p-1.5 rounded-xl glass-subtle hover:bg-white/10 text-[#938EB5] hover:text-emerald-300 transition-colors cursor-pointer"
                              title="Cộng/Trừ số dư ví"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                            </button>

                            {/* Role edit */}
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setRoleForm(user.role);
                              }}
                              className="p-1.5 rounded-xl glass-subtle hover:bg-white/10 text-[#938EB5] hover:text-white transition-colors cursor-pointer"
                              title="Đổi vai trò"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Ban toggle */}
                            <button
                              onClick={() => setBanTargetUser(user)}
                              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                                user.status === 'active'
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                              }`}
                              title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              {user.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            {/* Delete User */}
                            {user.role !== 'admin' && user.username !== 'admin' && (
                              <button
                                onClick={() => setDeleteTargetUser(user)}
                                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors cursor-pointer"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : (
        /* SELLERS TAB */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users
              .filter((u) => u.sellerStatus && u.sellerStatus !== 'none')
              .map((user) => (
                <Card
                  key={user.id}
                  className={`p-5 space-y-3.5 glass-subtle border-white/8 ${
                    user.sellerStatus === 'pending'
                      ? 'border-amber-500/30'
                      : user.sellerStatus === 'active'
                      ? 'border-emerald-500/20'
                      : 'border-white/5'
                  }`}
                  variant="default"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#F4F2FF]">{user.username}</h4>
                      <p className="text-[11px] text-[#938EB5]">{user.email}</p>
                    </div>
                    {getSellerBadge(user.sellerStatus)}
                  </div>

                  <div className="p-3.5 rounded-2xl glass-standard border border-white/6 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#938EB5]">Số dư ví:</span>
                      <span className="font-bold text-emerald-300">{user.balance.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#938EB5]">Đã mua:</span>
                      <span className="font-bold text-white">{user.totalOrders} đơn</span>
                    </div>
                  </div>

                  {/* Seller Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {user.sellerStatus === 'pending' ? (
                      <>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => updateSellerStatus(user.id, 'rejected')}
                          className="flex-1"
                        >
                          Từ Chối
                        </Button>
                        <Button
                          variant="success"
                          size="xs"
                          onClick={() => updateSellerStatus(user.id, 'active')}
                          className="flex-1"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Duyệt Làm Đại Lý
                        </Button>
                      </>
                    ) : user.sellerStatus === 'active' ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => updateSellerStatus(user.id, 'suspended')}
                        className="w-full text-red-300 hover:text-red-200"
                      >
                        Thu Hồi Quyền Đại Lý
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => updateSellerStatus(user.id, 'active')}
                        className="w-full"
                      >
                        Cấp Lại Quyền Đại Lý
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
          </div>

          {users.filter((u) => u.sellerStatus && u.sellerStatus !== 'none').length === 0 && (
            <EmptyState
              icon={<Crown className="w-6 h-6 text-amber-300" />}
              title="Chưa có hồ sơ đại lý nào"
              description="Khi thành viên đăng ký trở thành Đại lý / CTV ngoài trang chủ, hồ sơ sẽ hiển thị tại đây để duyệt."
            />
          )}
        </div>
      )}

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Phân Quyền: ${editingUser?.username}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditingUser(null)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRole}>
              Lưu Phân Quyền
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Chọn Vai Trò Mới
            </label>
            <select
              value={roleForm}
              onChange={(e) => setRoleForm(e.target.value as UserRole)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-[#F4F2FF]"
            >
              <option value="user" className="bg-[#121220] text-white">Thành viên thông thường</option>
              <option value="vip" className="bg-[#121220] text-white">VIP Member (Chiết khấu riêng)</option>
              <option value="affiliate" className="bg-[#121220] text-white">Đối tác CTV (Nhận hoa hồng)</option>
              <option value="admin" className="bg-[#121220] text-white">Quản trị viên (Super Admin)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Adjust User Balance Modal */}
      <Modal
        isOpen={!!adjustTargetUser}
        onClose={() => setAdjustTargetUser(null)}
        title={`Điều Chỉnh Số Dư Ví: ${adjustTargetUser?.username}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAdjustTargetUser(null)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmAdjustBalance}>
              Xác Nhận Thay Đổi
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmAdjustBalance} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl glass-standard border border-white/6 flex justify-between items-baseline">
            <span className="text-[#938EB5]">Số dư hiện tại:</span>
            <span className="font-black text-emerald-300 text-sm">
              {adjustTargetUser?.balance.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Hành Động
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustAction('add')}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjustAction === 'add'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'glass-subtle border-white/8 text-[#938EB5]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Cộng Tiền
              </button>

              <button
                type="button"
                onClick={() => setAdjustAction('subtract')}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjustAction === 'subtract'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'glass-subtle border-white/8 text-[#938EB5]'
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Trừ Tiền
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Số Tiền Điều Chỉnh (VNĐ)
            </label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(Number(e.target.value))}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-[#F4F2FF] font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
              Ghi Chú Lý Do
            </label>
            <input
              type="text"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="VD: Hỗ trợ nạp tiền, hoàn phí..."
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-[#F4F2FF]"
            />
          </div>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={!!resetPassTargetUser}
        onClose={() => setResetPassTargetUser(null)}
        title={`Đặt Lại Mật Khẩu: ${resetPassTargetUser?.username}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setResetPassTargetUser(null)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdminResetPassword}>
              Lưu Mật Khẩu Mới
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl glass-subtle border border-white/6 text-xs space-y-1">
            <div className="text-[#938EB5]">Tài khoản: <strong className="text-white">{resetPassTargetUser?.username}</strong></div>
            <div className="text-[#938EB5]">Email: <strong className="text-cyan-300">{resetPassTargetUser?.email}</strong></div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-[#938EB5] uppercase tracking-wider">
                Mật Khẩu Mới *
              </label>
              <button
                type="button"
                onClick={() => {
                  const randomPass = 'TX' + Math.floor(100000 + Math.random() * 900000);
                  setNewPasswordInput(randomPass);
                }}
                className="text-[10px] text-[#C084FC] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <Sparkles className="w-3 h-3" /> Tạo ngẫu nhiên
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-[#F4F2FF] font-mono"
            />
          </div>
        </form>
      </Modal>

      {/* Ban / Unban Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!banTargetUser}
        onClose={() => setBanTargetUser(null)}
        onConfirm={() => {
          if (banTargetUser) {
            toggleBanUser(banTargetUser.id);
            setBanTargetUser(null);
          }
        }}
        title={banTargetUser?.status === 'active' ? 'Khóa Tài Khoản?' : 'Mở Khóa Tài Khoản?'}
        message={
          banTargetUser ? (
            <div>
              Bạn có chắc muốn{' '}
              {banTargetUser.status === 'active' ? 'khóa tài khoản' : 'mở khóa tài khoản'} của{' '}
              <strong>{banTargetUser.username}</strong> ({banTargetUser.email})?
            </div>
          ) : null
        }
        confirmLabel={banTargetUser?.status === 'active' ? 'Khóa ngay' : 'Mở khóa'}
        variant={banTargetUser?.status === 'active' ? 'danger' : 'primary'}
      />

      {/* Delete User Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetUser}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={() => {
          if (deleteTargetUser) {
            deleteUser(deleteTargetUser.id);
            setDeleteTargetUser(null);
          }
        }}
        title="Xóa Vĩnh Viễn Tài Khoản Người Dùng?"
        message={
          deleteTargetUser ? (
            <div>
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>{deleteTargetUser.username}</strong> ({deleteTargetUser.email})? Thao tác này không thể hoàn tác!
            </div>
          ) : null
        }
        confirmLabel="Xóa vĩnh viễn"
        variant="danger"
      />
    </div>
  );
};
