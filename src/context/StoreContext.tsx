import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  addToCart: (product: Product, quantity?: number) => void;
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
  login: (identifier: string, password: string, rememberMe?: boolean) => { success: boolean; message?: string };
  register: (username: string, email: string, password: string) => { success: boolean; message?: string };
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

  addCategory: (category: Omit<Category, 'id' | 'count'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  updateOrderStatus: (id: string, status: Order['status']) => void;
  createOrder: (productId: string, quantity: number, paymentMethod: Order['paymentMethod']) => boolean;

  approveTopup: (id: string) => void;
  rejectTopup: (id: string, reason: string) => void;
  createTopupRequest: (amount: number, method: TopupRequest['method'], transferNote: string, proofImage?: string) => string;

  updateUser: (id: string, updates: Partial<User>) => void;
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
  const [cart, setCart] = useState<CartItem[]>(() => safeGetItem('thanox_cart', []));

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Persistent States with Safe LocalStorage Parsing
  const [products, setProducts] = useState<Product[]>(() =>
    safeGetItem('thanox_products', INITIAL_PRODUCTS)
  );

  const [categories, setCategories] = useState<Category[]>(() =>
    safeGetItem('thanox_categories', INITIAL_CATEGORIES)
  );

  const [orders, setOrders] = useState<Order[]>(() =>
    safeGetItem('thanox_orders', INITIAL_ORDERS)
  );

  const [users, setUsers] = useState<User[]>(() =>
    safeGetItem('thanox_users', INITIAL_USERS)
  );

  const [topups, setTopups] = useState<TopupRequest[]>(() =>
    safeGetItem('thanox_topups', INITIAL_TOPUPS)
  );

  const [cardRecharges, setCardRecharges] = useState<CardRechargeRequest[]>(() =>
    safeGetItem('thanox_card_recharges', [])
  );

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    safeGetItem('thanox_transactions', INITIAL_TRANSACTIONS)
  );

  const [affiliates, setAffiliates] = useState<AffiliateItem[]>(() =>
    safeGetItem('thanox_affiliates', INITIAL_AFFILIATES)
  );

  const [affiliateRewards, setAffiliateRewards] = useState<AffiliateReward[]>(() =>
    safeGetItem('thanox_affiliate_rewards', [])
  );

  const [resetTokens, setResetTokens] = useState<{ email: string; otp: string; expiresAt: number }[]>(() =>
    safeGetItem('thanox_reset_tokens', [])
  );

  // Active referral code tracked in current session
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('thanox_ref') || null;
    } catch {
      return null;
    }
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    safeGetItem('thanox_tickets', INITIAL_TICKETS)
  );

  const [settings, setSettings] = useState<StoreSettings>(() =>
    safeGetItem('thanox_settings', INITIAL_SETTINGS)
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    safeGetItem('thanox_notifications', [])
  );

  // Current active user authentication state (null if not logged in)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    safeGetItem('thanox_current_user_id', null)
  );

  const fallbackUser: User = {
    id: 'guest',
    username: 'Khách',
    name: 'Khách hàng',
    email: 'guest@thanox.vn',
    role: 'user',
    balance: 0,
    affiliateBalance: 0,
    sellerStatus: 'none',
    totalOrders: 0,
    totalSpent: 0,
    status: 'active',
    createdAt: new Date().toISOString().substring(0, 10),
    avatarText: 'KH',
  };

  const currentUser: User =
    users.find((u) => u.id === currentUserId) || fallbackUser;

  const isAuthenticated = Boolean(
    currentUserId && users.some((u) => u.id === currentUserId && u.status === 'active')
  );

  // Sync current user ID to LocalStorage
  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem('thanox_current_user_id', JSON.stringify(currentUserId));
      } else {
        localStorage.removeItem('thanox_current_user_id');
      }
    } catch (e) {
      console.error('Failed to save currentUserId to localStorage:', e);
    }
  }, [currentUserId]);

  // Save to LocalStorage on updates with try-catch
  useEffect(() => {
    try {
      localStorage.setItem('thanox_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_products', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage:', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage:', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_topups', JSON.stringify(topups));
    } catch (e) {
      console.error('Failed to save topups to localStorage:', e);
    }
  }, [topups]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_card_recharges', JSON.stringify(cardRecharges));
    } catch (e) {
      console.error('Failed to save cardRecharges to localStorage:', e);
    }
  }, [cardRecharges]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_affiliates', JSON.stringify(affiliates));
    } catch (e) {
      console.error('Failed to save affiliates to localStorage:', e);
    }
  }, [affiliates]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_affiliate_rewards', JSON.stringify(affiliateRewards));
    } catch (e) {
      console.error('Failed to save affiliateRewards to localStorage:', e);
    }
  }, [affiliateRewards]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_reset_tokens', JSON.stringify(resetTokens));
    } catch (e) {
      console.error('Failed to save resetTokens to localStorage:', e);
    }
  }, [resetTokens]);

  // Live Sync with Server Backend for real-time multi-device updates (Customer <-> Admin)
  useEffect(() => {
    let isMounted = true;
    const syncWithServer = async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            const d = json.data;
            if (d.users && Array.isArray(d.users)) {
              setUsers((prev) => {
                const map = new Map();
                d.users.forEach((u: User) => map.set(u.id, u));
                prev.forEach((u) => map.set(u.id, u));
                return Array.from(map.values());
              });
            }
            if (d.products && Array.isArray(d.products) && d.products.length > 0) {
              setProducts(d.products);
            }
            if (d.orders && Array.isArray(d.orders)) {
              setOrders((prev) => {
                const map = new Map();
                d.orders.forEach((o: Order) => map.set(o.id, o));
                prev.forEach((o) => map.set(o.id, o));
                return Array.from(map.values());
              });
            }
            if (d.topups && Array.isArray(d.topups)) {
              setTopups((prev) => {
                const map = new Map();
                d.topups.forEach((t: TopupRequest) => map.set(t.id, t));
                prev.forEach((t) => map.set(t.id, t));
                return Array.from(map.values());
              });
            }
            if (d.cardRecharges && Array.isArray(d.cardRecharges)) {
              setCardRecharges((prev) => {
                const map = new Map();
                d.cardRecharges.forEach((c: CardRechargeRequest) => map.set(c.id, c));
                prev.forEach((c) => map.set(c.id, c));
                return Array.from(map.values());
              });
            }
            if (d.settings && typeof d.settings === 'object') {
              setSettings((prev) => ({
                ...prev,
                ...d.settings,
              }));
            }
          }
        }
      } catch {
        // Fallback silently to local state
      }
    };
    syncWithServer();
    const interval = setInterval(syncWithServer, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Track referral query param (?ref=CODE) from URL
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref && ref.trim()) {
          const cleanRef = ref.trim().toUpperCase();
          sessionStorage.setItem('thanox_ref', cleanRef);
          setActiveReferralCode(cleanRef);

          // Track unique click once per session for this referral code
          const clickKey = `thanox_clicked_${cleanRef}`;
          if (!sessionStorage.getItem(clickKey)) {
            sessionStorage.setItem(clickKey, 'true');
            setAffiliates((prev) => {
              const existing = prev.find(
                (a) =>
                  a.refCode?.toUpperCase() === cleanRef ||
                  a.code?.toUpperCase() === cleanRef ||
                  a.userName?.toUpperCase() === cleanRef
              );
              if (existing) {
                return prev.map((a) =>
                  a.id === existing.id
                    ? {
                        ...a,
                        clicks: (a.clicks || 0) + 1,
                        totalClicks: (a.totalClicks || 0) + 1,
                      }
                    : a
                );
              }
              return prev;
            });
          }
        }
      }
    } catch (e) {
      console.warn('Referral URL tracking error:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_tickets', JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save tickets to localStorage:', e);
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem('thanox_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  // Toast handler
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastNotification = { id, message, type, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const navigate = useNavigate();
  const location = useLocation();

  // Keep appMode & active subpage in sync with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/qtri')) {
      setAppMode('admin');
      const sub = path.replace(/^\/qtri\/?/, '').split('/')[0] as PageId;
      if (sub && [
        'dashboard', 'analytics', 'products', 'categories', 'orders',
        'wallet', 'transactions', 'affiliate', 'users', 'support', 'settings'
      ].includes(sub)) {
        setCurrentPage(sub);
      } else {
        setCurrentPage('dashboard');
      }
    } else {
      setAppMode('storefront');
      if (path === '/' || path === '') {
        setStorefrontPage('home');
      } else if (path.startsWith('/products/')) {
        const slug = path.replace('/products/', '');
        setStorefrontPage('product-detail');
        setSelectedProductSlugOrId(slug);
      } else if (path === '/products') {
        setStorefrontPage('products');
      } else if (path.startsWith('/categories/')) {
        const slug = path.replace('/categories/', '');
        setStorefrontPage('categories');
        setSelectedCategorySlug(slug);
      } else if (path === '/cart') {
        setStorefrontPage('cart');
      } else if (path === '/checkout') {
        setStorefrontPage('checkout');
      } else if (path.startsWith('/account/orders/')) {
        const orderId = path.replace('/account/orders/', '');
        setStorefrontPage('account-orders');
        setSelectedOrderId(orderId);
      } else if (path === '/account/orders') {
        setStorefrontPage('account-orders');
      } else if (path === '/account/wallet' || path === '/account/wallet/deposit') {
        setStorefrontPage('account-wallet-deposit');
      } else if (path === '/account/transactions') {
        setStorefrontPage('account-transactions');
      } else if (path === '/account/support' || path === '/support') {
        setStorefrontPage('support');
      } else if (path === '/account/affiliate' || path === '/affiliate') {
        setStorefrontPage('affiliate');
      } else if (path === '/account') {
        setStorefrontPage('account');
      }
    }
  }, [location.pathname]);

  // Navigation helpers
  const navigateToStorefront = (page: StorefrontPageId = 'home', param?: string) => {
    setAppMode('storefront');
    setStorefrontPage(page);
    let target = '/';
    if (page === 'products') {
      target = '/products';
    } else if (page === 'product-detail') {
      if (param) setSelectedProductSlugOrId(param);
      target = param ? `/products/${param}` : '/products';
    } else if (page === 'categories') {
      if (param) setSelectedCategorySlug(param);
      target = param ? `/categories/${param}` : '/products';
    } else if (page === 'cart') {
      target = '/cart';
    } else if (page === 'checkout') {
      target = '/checkout';
    } else if (page === 'account') {
      target = '/account';
    } else if (page === 'account-orders') {
      if (param) setSelectedOrderId(param);
      target = param ? `/account/orders/${param}` : '/account/orders';
    } else if (page === 'account-wallet-deposit') {
      target = '/account/wallet/deposit';
    } else if (page === 'account-transactions') {
      target = '/account/transactions';
    } else if (page === 'support' || page === 'account-support') {
      target = '/account/support';
    } else if (page === 'affiliate') {
      target = '/account/affiliate';
    }
    navigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAdmin = (page: PageId = 'dashboard') => {
    setAppMode('admin');
    setCurrentPage(page);
    const target = page === 'dashboard' ? '/qtri' : `/qtri/${page}`;
    navigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Helper to determine item effective price based on Seller status
  const getItemEffectivePrice = (product: Product, user: User) => {
    if (user.sellerStatus === 'approved' && product.sellerPrice && product.sellerPrice > 0) {
      return product.sellerPrice;
    }
    return product.price;
  };

  // Real Affiliate Reward Processing with Daily Cap
  const processAffiliateRewardForOrder = (
    orderId: string,
    orderCode: string,
    orderTotal: number,
    buyer: User
  ) => {
    if (!settings.affiliateEnabled) return;

    // Check if buyer was referred by another user
    const referrerId = buyer.referredBy;
    if (!referrerId) return;

    // Self-referral protection: A user cannot refer themselves
    if (referrerId === buyer.id) return;

    // Check minimum qualifying order value (default 200.000đ)
    const minOrderVal = settings.affiliateMinimumOrderValue ?? 200000;
    if (orderTotal < minOrderVal) return;

    // Deduplication: An order can ONLY award affiliate commission ONCE
    const alreadyRewarded = affiliateRewards.some(
      (r) => r.orderId === orderId && r.status === 'completed'
    );
    if (alreadyRewarded) return;

    // Determine reward amount (default: 10.000đ, or higher tier if enabled)
    let rawReward = settings.affiliateDefaultReward ?? 10000;
    if (
      settings.affiliateHigherTierEnabled &&
      orderTotal >= (settings.affiliateHigherTierThreshold ?? 300000)
    ) {
      rawReward = settings.affiliateHigherTierReward ?? 30000;
    }

    const referrer = users.find((u) => u.id === referrerId);
    if (!referrer) return;

    // Calculate today's rewards earned by referrer to enforce DAILY REWARD CAP
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayRewardsSum = affiliateRewards
      .filter((r) => r.referrerUserId === referrerId && r.createdAt.startsWith(todayStr) && r.status === 'completed')
      .reduce((sum, r) => sum + r.rewardAmount, 0);

    const dailyCap = settings.affiliateDailyCap ?? 500000;
    if (todayRewardsSum >= dailyCap) {
      console.log(`[Affiliate] Referrer ${referrer.username} reached daily reward cap of ${dailyCap}đ.`);
      return;
    }

    // Cap reward if it exceeds remaining daily limit
    const rewardAmount = Math.min(rawReward, dailyCap - todayRewardsSum);
    if (rewardAmount <= 0) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // 1. Credit Referrer's Affiliate Balance (Ledger balance, separate from main wallet)
    setUsers((prev) =>
      prev.map((u) =>
        u.id === referrerId
          ? {
              ...u,
              affiliateBalance: (u.affiliateBalance || 0) + rewardAmount,
            }
          : u
      )
    );

    // 2. Update or Create Affiliate Item
    setAffiliates((prev) => {
      const existing = prev.find((a) => a.userId === referrerId);
      if (existing) {
        return prev.map((a) =>
          a.id === existing.id
            ? {
                ...a,
                successfulOrders: (a.successfulOrders || 0) + 1,
                totalConversions: (a.totalConversions || 0) + 1,
                commissionEarned: (a.commissionEarned || 0) + rewardAmount,
                totalEarnings: (a.totalEarnings || 0) + rewardAmount,
              }
            : a
        );
      } else {
        const newAff: AffiliateItem = {
          id: 'aff-' + Date.now(),
          userId: referrer.id,
          userName: referrer.username,
          refCode: referrer.refCode || referrer.username.toUpperCase(),
          code: referrer.refCode || referrer.username.toUpperCase(),
          clicks: 1,
          totalClicks: 1,
          successfulOrders: 1,
          totalConversions: 1,
          commissionEarned: rewardAmount,
          totalEarnings: rewardAmount,
          pendingWithdraw: 0,
          status: 'active',
          createdAt: nowStr,
        };
        return [...prev, newAff];
      }
    });

    // 3. Create Affiliate Reward Record
    const newReward: AffiliateReward = {
      id: 'aff-rew-' + Date.now(),
      referrerUserId: referrer.id,
      referredUserId: buyer.id,
      referredUserName: buyer.username,
      orderId,
      orderCode,
      orderAmount: orderTotal,
      rewardAmount,
      createdAt: nowStr,
      status: 'completed',
    };
    setAffiliateRewards((prev) => [newReward, ...prev]);

    // 4. Log in Transactions
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'commission',
      userId: referrer.id,
      userName: referrer.username,
      description: `Hoa hồng giới thiệu: Đơn ${orderCode} của ${buyer.username} (+${rewardAmount.toLocaleString('vi-VN')}đ vào Số Dư Affiliate)`,
      amount: rewardAmount,
      balanceAfter: referrer.balance || 0,
      createdAt: nowStr,
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 5. Send Notification
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `Nhận thưởng giới thiệu +${rewardAmount.toLocaleString('vi-VN')}đ`,
        description: `Bạn vừa nhận ${rewardAmount.toLocaleString('vi-VN')}đ hoa hồng từ đơn hàng hợp lệ của ${buyer.username} (${orderCode})`,
        time: 'Vừa xong',
        read: false,
        type: 'system',
      },
      ...prev,
    ]);
  };

  const checkoutCart = (paymentMethod: Order['paymentMethod']): boolean => {
    if (cart.length === 0) {
      showToast('Giỏ hàng của bạn đang trống!', 'warning');
      return false;
    }

    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập tài khoản để thực hiện thanh toán!', 'warning');
      return false;
    }

    const buyer = currentUser;
    const isSeller = buyer.sellerStatus === 'approved';

    const total = cart.reduce((sum, item) => {
      const price = getItemEffectivePrice(item.product, buyer);
      return sum + price * item.quantity;
    }, 0);

    if (paymentMethod === 'wallet' && buyer.balance < total) {
      showToast(`Số dư ví không đủ! Cần thêm ${(total - buyer.balance).toLocaleString('vi-VN')}đ`, 'error');
      return false;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const createdOrders: Order[] = [];

    // Deduct user balance atomically if paying by wallet
    if (paymentMethod === 'wallet') {
      const newBal = buyer.balance - total;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === buyer.id
            ? {
                ...u,
                balance: newBal,
                totalOrders: (u.totalOrders || 0) + cart.length,
                totalSpent: (u.totalSpent || 0) + total,
              }
            : u
        )
      );
    }

    // Process each cart item into real order
    cart.forEach((item, index) => {
      const itemCode = '#TX-' + Math.floor(10000 + Math.random() * 90000);
      const unitPrice = getItemEffectivePrice(item.product, buyer);
      const itemTotal = unitPrice * item.quantity;

      const newOrder: Order = {
        id: 'ord-' + Date.now() + '-' + index,
        orderCode: itemCode,
        userId: buyer.id,
        userName: buyer.username,
        userEmail: buyer.email,
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        productCategory: item.product.category,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        totalAmount: itemTotal,
        paymentMethod,
        status: 'completed',
        createdAt: nowStr,
        deliveredContent: item.product.downloadLinkOrKeys || 'Hệ thống đã gửi mã kích hoạt đến email của bạn.',
        key: item.product.downloadLinkOrKeys?.split('\n')[0] || 'KEY-AUTO-' + Math.floor(100000 + Math.random() * 900000),
        isSellerOrder: isSeller,
      };

      createdOrders.push(newOrder);

      // Increment product real sold count
      setProducts((prev) =>
        prev.map((p) =>
          p.id === item.product.id ? { ...p, soldCount: (p.soldCount || 0) + item.quantity } : p
        )
      );
    });

    setOrders((prev) => [...createdOrders, ...prev]);

    // Financial Transaction log
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'purchase',
      userId: buyer.id,
      userName: buyer.username,
      description: `Thanh toán ${cart.length} sản phẩm (${createdOrders.map((o) => o.orderCode).join(', ')})`,
      amount: -total,
      balanceAfter: paymentMethod === 'wallet' ? buyer.balance - total : buyer.balance,
      createdAt: nowStr,
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Process Affiliate Reward if applicable
    if (createdOrders.length > 0) {
      processAffiliateRewardForOrder(
        createdOrders[0].id,
        createdOrders[0].orderCode,
        total,
        buyer
      );
    }

    // Notification
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `Đơn hàng mới (${createdOrders[0].orderCode})`,
        description: `${buyer.username} vừa mua ${cart.length} sản phẩm (${total.toLocaleString('vi-VN')}đ)`,
        time: 'Vừa xong',
        read: false,
        type: 'order',
      },
      ...prev,
    ]);

    clearCart();
    showToast(`Thanh toán thành công ${createdOrders.length} đơn hàng!`, 'success');
    return true;
  };

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id' | 'soldCount' | 'updatedAt'>) => {
    const sanitizedPrice = Math.max(0, prodData.price || 0);
    const sanitizedOriginalPrice = prodData.originalPrice ? Math.max(0, prodData.originalPrice) : undefined;
    const sanitizedName = prodData.name.trim();

    const newProduct: Product = {
      ...prodData,
      name: sanitizedName,
      price: sanitizedPrice,
      originalPrice: sanitizedOriginalPrice,
      id: 'prod-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      soldCount: 0,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setProducts((prev) => [newProduct, ...prev]);

    // update category count
    setCategories((prev) =>
      prev.map((c) => (c.name === prodData.category ? { ...c, count: c.count + 1 } : c))
    );

    showToast(`Đã thêm sản phẩm "${newProduct.name}" thành công!`, 'success');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = {
            ...p,
            ...updates,
            name: updates.name !== undefined ? updates.name.trim() : p.name,
            price: updates.price !== undefined ? Math.max(0, updates.price) : p.price,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
          return updated;
        }
        return p;
      })
    );
    showToast('Đã cập nhật thông tin sản phẩm!', 'success');
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (prod) {
      setCategories((prev) =>
        prev.map((c) => (c.name === prod.category ? { ...c, count: Math.max(0, c.count - 1) } : c))
      );
    }
    showToast('Đã xóa sản phẩm thành công', 'error');
  };

  // Categories CRUD
  const addCategory = (catData: Omit<Category, 'id' | 'count'>) => {
    const sanitizedName = catData.name.trim();
    const sanitizedSlug = (catData.slug || sanitizedName.toLowerCase().replace(/\s+/g, '-')).trim();

    const newCat: Category = {
      ...catData,
      name: sanitizedName,
      slug: sanitizedSlug,
      id: 'cat-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      count: 0,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Đã thêm danh mục "${newCat.name}"`, 'success');
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const oldCat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    // If category name was updated, keep products category name synced
    if (oldCat && updates.name && updates.name !== oldCat.name) {
      setProducts((prev) =>
        prev.map((p) => (p.category === oldCat.name ? { ...p, category: updates.name! } : p))
      );
    }

    showToast('Đã cập nhật danh mục', 'success');
  };

  const deleteCategory = (id: string) => {
    const targetCat = categories.find((c) => c.id === id);
    if (!targetCat) return;

    // Remaining categories
    const remainingCats = categories.filter((c) => c.id !== id);
    const fallbackCategoryName = remainingCats[0]?.name || 'Chung';

    // Safely migrate any products using this category
    setProducts((prev) =>
      prev.map((p) => (p.category === targetCat.name ? { ...p, category: fallbackCategoryName } : p))
    );

    setCategories(remainingCats);
    showToast(`Đã xóa danh mục "${targetCat.name}"`, 'error');
  };

  // Orders CRUD
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    showToast(`Đã cập nhật trạng thái đơn hàng sang "${status}"`, 'info');
  };

  // Customer creates order in storefront
  const createOrder = (productId: string, quantity: number, paymentMethod: Order['paymentMethod']): boolean => {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để mua sản phẩm!', 'warning');
      return false;
    }

    const buyer = currentUser;
    const isSeller = buyer.sellerStatus === 'approved';
    const unitPrice = getItemEffectivePrice(product, buyer);
    const total = unitPrice * quantity;

    if (paymentMethod === 'wallet' && buyer.balance < total) {
      showToast('Số dư ví không đủ! Vui lòng nạp thêm tiền.', 'error');
      return false;
    }

    const orderNum = Math.floor(10000 + Math.random() * 90000);
    const newOrderCode = `#TX-${orderNum}`;
    const newBalance = paymentMethod === 'wallet' ? buyer.balance - total : buyer.balance;

    if (paymentMethod === 'wallet') {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === buyer.id
            ? {
                ...u,
                balance: newBalance,
                totalOrders: (u.totalOrders || 0) + 1,
                totalSpent: (u.totalSpent || 0) + total,
              }
            : u
        )
      );
    }

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderCode: newOrderCode,
      userId: buyer.id,
      userName: buyer.username,
      userEmail: buyer.email,
      productId: product.id,
      productName: product.name,
      category: product.category,
      productCategory: product.category,
      quantity,
      unitPrice,
      totalPrice: total,
      totalAmount: total,
      paymentMethod,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      deliveredContent: product.downloadLinkOrKeys || 'Hệ thống đã gửi link kích hoạt đến email của bạn.',
      key: product.downloadLinkOrKeys?.split('\n')[0] || 'KEY-TX-' + Math.floor(100000 + Math.random() * 900000),
      isSellerOrder: isSeller,
    };

    // Increment sold count
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, soldCount: (p.soldCount || 0) + quantity } : p))
    );

    setOrders((prev) => [newOrder, ...prev]);

    // Financial Transaction log
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'purchase',
      userId: buyer.id,
      userName: buyer.username,
      description: `Thanh toán mua ${product.name} (x${quantity})`,
      amount: -total,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Process Affiliate Reward if eligible
    processAffiliateRewardForOrder(newOrder.id, newOrderCode, total, buyer);

    // Add notification
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `Đơn hàng mới ${newOrderCode}`,
        description: `${buyer.username} vừa mua ${product.name} (${total.toLocaleString('vi-VN')}đ)`,
        time: 'Vừa xong',
        read: false,
        type: 'order',
      },
      ...prev,
    ]);

    showToast(`Đặt mua "${product.name}" thành công! Mã đơn: ${newOrderCode}`, 'success');
    return true;
  };

  // Topup review actions with double-action prevention
  const approveTopup = (id: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('Yêu cầu nạp này đã được xử lý trước đó', 'warning');
      return;
    }

    const targetUser = users.find((u) => u.id === topup.userId);
    const newBalance = (targetUser ? targetUser.balance : 0) + topup.amount;

    setUsers((prev) =>
      prev.map((u) => (u.id === topup.userId ? { ...u, balance: newBalance } : u))
    );

    setTopups((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'approved',
              processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : t
      )
    );

    // Add deposit transaction
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'deposit',
      userId: topup.userId,
      userName: topup.userName,
      description: `Nạp tiền qua ${topup.method} (${topup.transferNote})`,
      amount: topup.amount,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(
      `Đã duyệt nạp tiền ${topup.amount.toLocaleString('vi-VN')}đ cho ${topup.userName}!`,
      'success'
    );
  };

  const rejectTopup = (id: string, reason: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('Yêu cầu nạp này đã được xử lý trước đó', 'warning');
      return;
    }

    setTopups((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'rejected',
              rejectReason: reason || 'Giao dịch không khớp sao kê',
              processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : t
      )
    );
    showToast('Đã từ chối yêu cầu nạp tiền', 'error');
  };

  const createTopupRequest = (
    amount: number,
    method: TopupRequest['method'],
    transferNote: string,
    proofImage?: string
  ): string => {
    const buyer = currentUser;
    const generatedCode = '#NAP-' + Math.floor(1000 + Math.random() * 9000);
    const newTopup: TopupRequest = {
      id: 'topup-' + Date.now(),
      requestCode: generatedCode,
      userId: buyer.id,
      userName: buyer.username,
      amount,
      method,
      proofImage,
      transferNote: transferNote || `${settings.transferPrefix || 'STT'} ${buyer.username.toUpperCase()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
    };

    setTopups((prev) => [newTopup, ...prev]);
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `Yêu cầu nạp tiền mới ${newTopup.requestCode}`,
        description: `${buyer.username} gửi yêu cầu nạp ${amount.toLocaleString('vi-VN')}đ qua ${method}`,
        time: 'Vừa xong',
        read: false,
        type: 'topup',
      },
      ...prev,
    ]);

    // Ultra-Fast Auto Credit Simulator (8 seconds)
    if (settings.autoApprovalEnabled !== false) {
      setTimeout(() => {
        setTopups((prev) =>
          prev.map((t) =>
            t.id === newTopup.id && t.status === 'pending'
              ? {
                  ...t,
                  status: 'approved',
                  processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                }
              : t
          )
        );

        setUsers((prev) =>
          prev.map((u) =>
            u.id === buyer.id ? { ...u, balance: u.balance + amount } : u
          )
        );

        const autoTx: Transaction = {
          id: 'tx-' + Date.now(),
          txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
          type: 'deposit',
          userId: buyer.id,
          userName: buyer.username,
          description: `Nạp tiền tự động VietQR (${newTopup.transferNote})`,
          amount,
          balanceAfter: (buyer.balance || 0) + amount,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'completed',
        };
        setTransactions((prev) => [autoTx, ...prev]);

        showToast(
          `🎉 Nạp tiền thành công! Đã cộng +${amount.toLocaleString('vi-VN')}đ vào ví của bạn (Xử lý trong 8s)!`,
          'success'
        );
      }, 8000);
    }

    showToast(`Đã gửi yêu cầu nạp ${amount.toLocaleString('vi-VN')}đ! Hệ thống đang tự động cộng tiền trong 8-10s...`, 'info');
    return generatedCode;
  };

  // Card Recharge (Nạp thẻ cào) Actions
  const createCardRecharge = (
    network: CardNetwork,
    declaredAmount: number,
    serial: string,
    pin: string
  ): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lòng đăng nhập tài khoản trước khi nạp thẻ!' };
    }

    if (!serial.trim() || !pin.trim()) {
      return { success: false, message: 'Vui lòng nhập đầy đủ số Serial và Mã thẻ (PIN)!' };
    }

    const fee = settings.cardSettings?.feePercentage ?? 15;
    const receivedAmount = Math.round(declaredAmount * (1 - fee / 100));
    const cardCode = '#THE-' + Math.floor(10000 + Math.random() * 90000);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newCard: CardRechargeRequest = {
      id: 'card-' + Date.now(),
      code: cardCode,
      userId: currentUser.id,
      userName: currentUser.username,
      network,
      declaredAmount,
      receivedAmount,
      serial: serial.trim(),
      pin: pin.trim(),
      status: 'pending',
      createdAt: nowStr,
    };

    setCardRecharges((prev) => [newCard, ...prev]);

    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `Nạp thẻ cào mới ${cardCode}`,
        description: `${currentUser.username} nạp thẻ ${network} ${declaredAmount.toLocaleString('vi-VN')}đ (Thực nhận: ${receivedAmount.toLocaleString('vi-VN')}đ)`,
        time: 'Vừa xong',
        read: false,
        type: 'card',
      },
      ...prev,
    ]);

    showToast(`Đã gửi thẻ cào ${network} ${declaredAmount.toLocaleString('vi-VN')}đ lên hệ thống xử lý!`, 'success');
    return { success: true, message: `Thẻ cào ${cardCode} đã được ghi nhận và đang được kiểm tra.` };
  };

  const approveCardRecharge = (id: string) => {
    const card = cardRecharges.find((c) => c.id === id);
    if (!card || card.status === 'success') return;

    const targetUser = users.find((u) => u.id === card.userId);
    const newBalance = (targetUser ? targetUser.balance : 0) + card.receivedAmount;

    setUsers((prev) =>
      prev.map((u) => (u.id === card.userId ? { ...u, balance: newBalance } : u))
    );

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setCardRecharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'success', processedAt: nowStr } : c))
    );

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'card_recharge',
      userId: card.userId,
      userName: card.userName,
      description: `Nạp thẻ cào ${card.network} ${card.declaredAmount.toLocaleString('vi-VN')}đ thành công (+${card.receivedAmount.toLocaleString('vi-VN')}đ vào ví)`,
      amount: card.receivedAmount,
      balanceAfter: newBalance,
      createdAt: nowStr,
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(`Đã duyệt thẻ cào ${card.code} và cộng ${card.receivedAmount.toLocaleString('vi-VN')}đ vào ví khách hàng ${card.userName}!`, 'success');
  };

  const rejectCardRecharge = (id: string, reason: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setCardRecharges((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'invalid', processedAt: nowStr, note: reason } : c
      )
    );
    showToast('Đã từ chối thẻ cào không hợp lệ', 'info');
  };

  // Seller Program Actions
  const applySeller = (note?: string): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lòng đăng nhập để đăng ký trở thành Đại Lý / Seller!' };
    }

    if (currentUser.sellerStatus === 'approved') {
      return { success: false, message: 'Bạn đã là Đại Lý / Seller của Thanox!' };
    }

    if (currentUser.sellerStatus === 'pending') {
      return { success: false, message: 'Yêu cầu đăng ký Đại Lý của bạn đang chờ Admin phê duyệt!' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              sellerStatus: 'pending',
              sellerNote: note || 'Đăng ký chương trình Đại Lý Thanox',
              sellerAppliedAt: nowStr,
            }
          : u
      )
    );

    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: 'Đăng ký Đại Lý / Seller mới',
        description: `Thành viên ${currentUser.username} vừa đăng ký trở thành Đại Lý / CTV`,
        time: 'Vừa xong',
        read: false,
        type: 'seller',
      },
      ...prev,
    ]);

    showToast('Đã gửi yêu cầu đăng ký Đại Lý! Admin sẽ duyệt tài khoản của bạn sớm nhất.', 'success');
    return { success: true, message: 'Đăng ký thành công, vui lòng chờ duyệt!' };
  };

  const updateSellerStatus = (userId: string, status: SellerStatus, note?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              sellerStatus: status,
              role: status === 'approved' ? 'seller' : u.role === 'seller' ? 'user' : u.role,
              sellerApprovedAt: status === 'approved' ? nowStr : u.sellerApprovedAt,
              sellerNote: note || u.sellerNote,
            }
          : u
      )
    );
    showToast(`Đã cập nhật trạng thái Đại Lý của tài khoản sang "${status}"`, 'info');
  };

  // Auth Operations
  const login = (identifier: string, _password: string, _rememberMe = true): { success: boolean; message?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, message: 'Vui lòng nhập tên đăng nhập hoặc email' };
    }

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!foundUser) {
      return { success: false, message: 'Tài khoản không tồn tại trong hệ thống.' };
    }

    if (foundUser.status === 'banned') {
      return { success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để được giải quyết.' };
    }

    setCurrentUserId(foundUser.id);
    showToast(`Đăng nhập thành công! Xin chào ${foundUser.username}`, 'success');
    return { success: true };
  };

  const register = (username: string, email: string, _password: string): { success: boolean; message?: string } => {
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

    const isDuplicateUsername = users.some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (isDuplicateUsername) {
      return { success: false, message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' };
    }

    const isDuplicateEmail = users.some(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (isDuplicateEmail) {
      return { success: false, message: 'Địa chỉ email này đã được liên kết với một tài khoản khác.' };
    }

    const refCodeToUse =
      activeReferralCode ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('thanox_ref') : null);
    let referrerUser: User | undefined;
    if (refCodeToUse) {
      const cleanRef = refCodeToUse.trim().toLowerCase();
      referrerUser = users.find(
        (u) =>
          (u.refCode && u.refCode.toLowerCase() === cleanRef) ||
          u.username.toLowerCase() === cleanRef
      );
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      username: cleanUsername,
      name: cleanUsername,
      email: cleanEmail,
      role: 'user',
      balance: 0,
      affiliateBalance: 0,
      referredBy: referrerUser ? referrerUser.id : undefined,
      refCode: cleanUsername.toUpperCase(),
      totalOrders: 0,
      totalSpent: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      avatarText: cleanUsername.substring(0, 2).toUpperCase(),
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUserId(newUser.id);

    // Sync new user to Server DB so Admin sees the user in real-time
    try {
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
          password,
          refCode: refCode || undefined,
        }),
      }).catch(() => {});
    } catch {
      // Offline fallback
    }

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
  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    showToast('Đã cập nhật thông tin người dùng', 'success');
  };

  const adjustUserBalance = (userId: string, amount: number, note: string) => {
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

    showToast(
      `Đã ${amount >= 0 ? 'cộng' : 'trừ'} ${Math.abs(amount).toLocaleString('vi-VN')}đ vào ví của ${targetUser.username}`,
      'success'
    );
  };

  const toggleBanUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
    showToast(`Đã ${newStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản ${user.username}`, newStatus === 'banned' ? 'error' : 'success');
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
    setAffiliateRewards([]);
    setTickets(INITIAL_TICKETS);
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    setNotifications([]);
    setCurrentUserId(null);
    localStorage.clear();
    showToast('Đã khôi phục dữ liệu sạch theo mặc định!', 'success');
  };

  const resetToZeroData = () => {
    setProducts([]);
    setCategories([
      { id: 'cat-1', name: 'File Android', slug: 'file-android', icon: '📱', count: 0, status: 'active' },
      { id: 'cat-2', name: 'File iOS', slug: 'file-ios', icon: '🍎', count: 0, status: 'active' },
      { id: 'cat-3', name: 'Menu FF', slug: 'menu-ff', icon: '🎮', count: 0, status: 'active' },
      { id: 'cat-4', name: 'Proxy FF', slug: 'proxy-ff', icon: '🌐', count: 0, status: 'active' },
      { id: 'cat-5', name: 'Tài khoản', slug: 'tai-khoan', icon: '👤', count: 0, status: 'active' },
      { id: 'cat-6', name: 'Tools', slug: 'tools', icon: '🔧', count: 0, status: 'active' },
    ]);
    setOrders([]);
    setUsers([
      {
        id: 'u-1',
        username: 'admin_thanox',
        email: 'admin@thanox.vn',
        phone: '0916396901',
        role: 'admin',
        balance: 0,
        affiliateBalance: 0,
        sellerStatus: 'none',
        totalOrders: 0,
        totalSpent: 0,
        status: 'active',
        createdAt: new Date().toISOString().substring(0, 10),
        avatarText: 'AD',
      },
    ]);
    setTopups([]);
    setCardRecharges([]);
    setTransactions([]);
    setAffiliates([]);
    setAffiliateRewards([]);
    setTickets([]);
    setNotifications([]);
    setCart([]);
    setCurrentUserId(null);
    localStorage.clear();
    showToast('Đã xóa trắng toàn bộ dữ liệu. Tất cả số liệu hệ thống đã về 0!', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        appMode,
        setAppMode,
        currentPage,
        setCurrentPage,
        storefrontPage,
        setStorefrontPage,
        selectedProductSlugOrId,
        setSelectedProductSlugOrId,
        selectedCategorySlug,
        setSelectedCategorySlug,
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
        addCategory,
        updateCategory,
        deleteCategory,
        updateOrderStatus,
        createOrder,
        approveTopup,
        rejectTopup,
        createTopupRequest,
        updateUser,
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

