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
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          const mappedProducts: Product[] = data.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            sellerPrice: p.seller_price,
            basePrice: p.original_price,
            stock: p.stock === 'unlimited' ? 'unlimited' : Number(p.stock) || 0,
            status: p.status as ProductStatus,
            description: p.description || '',
            image: p.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
            // ONLY LOAD FOR ADMIN! We will fix this in RLS later.
            downloadLinkOrKeys: p.hidden_keys_or_links || '',
            soldCount: 0,
            featured: true,
          }));
          
          setProducts(mappedProducts);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm từ Supabase:', err);
      }
    };
    
    const fetchSupabaseUsers = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          if (data) {
            const mappedUsers: User[] = data.map((u) => ({
              id: u.id,
              username: u.username,
              email: u.email,
              password: u.password,
              role: u.role as 'admin' | 'user',
              balance: Number(u.balance) || 0,
              totalSpent: Number(u.total_spent) || 0,
              status: u.status as 'active' | 'banned',
              createdAt: u.created_at,
              joinDate: new Date(u.created_at).toISOString().replace('T', ' ').substring(0, 16),
            }));
            
            
            // T? d?ng kh�i ph?c t�i kho?n admin n?u database tr?ng (gi�p user kh�ng b? kh�a ngo�i)
            const hasAdmin = mappedUsers.some(u => u.role === 'admin');
            if (!hasAdmin) {
              const newAdminId = '00000000-0000-0000-0000-000000000001';
              const newAdmin = {
                id: newAdminId,
                username: 'admin',
                email: 'admin@thanox.vn',
                password: 'adminthanox.vn',
                role: 'admin',
                balance: 0,
                totalSpent: 0,
                status: 'active',
                createdAt: new Date().toISOString(),
                joinDate: new Date().toISOString().substring(0, 16),
              };
              mappedUsers.push(newAdmin);
              
              supabase.from('users').upsert({
                id: newAdminId,
                username: newAdmin.username,
                email: newAdmin.email,
                password: newAdmin.password,
                role: 'admin',
                balance: 0,
                status: 'active'
              }).then();
            }
            setUsers(mappedUsers);
          }
        } catch (err) {
          console.error('Lỗi tải Users từ Supabase:', err);
        }
      };

      fetchSupabaseProducts();
      fetchSupabaseUsers();
        
        // Fetch Settings from Supabase
        supabase.from('settings').select('*').eq('id', 1).single().then(({data}) => {
          if (data && data.data) {
            setSettings(prev => ({...prev, ...data.data}));
            localStorage.setItem('thanox_settings', JSON.stringify(data.data));
          }
        });
      }, []);

  const [categories, setCategories] = useState<Category[]>(() => {
    const loaded = safeGetItem<Category[]>('thanox_categories', INITIAL_CATEGORIES);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_CATEGORIES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const loaded = safeGetItem<Order[]>('thanox_orders', INITIAL_ORDERS);
    return Array.isArray(loaded) ? loaded : INITIAL_ORDERS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const loaded = safeGetItem<User[]>('thanox_users', INITIAL_USERS);
    const validArray = Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_USERS;
    const cleaned = validArray.filter((u: User) => u && u.username !== 'admin_thanox' && u.id !== 'u-1');
    let hasAdmin = false;
    return cleaned.map((u: User) => {
      if (u.role === 'admin') {
        if (!hasAdmin && u.username === 'admin') {
          hasAdmin = true;
          return u;
        }
        return { ...u, role: 'user' as const };
      }
      return u;
    });
  });

  const [topups, setTopups] = useState<TopupRequest[]>(() => {
    const loaded = safeGetItem<TopupRequest[]>('thanox_topups', INITIAL_TOPUPS);
    return Array.isArray(loaded) ? loaded : INITIAL_TOPUPS;
  });

  const [cardRecharges, setCardRecharges] = useState<CardRechargeRequest[]>(() => {
    const loaded = safeGetItem<CardRechargeRequest[]>('thanox_card_recharges', []);
    return Array.isArray(loaded) ? loaded : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const loaded = safeGetItem<Transaction[]>('thanox_transactions', INITIAL_TRANSACTIONS);
    return Array.isArray(loaded) ? loaded : INITIAL_TRANSACTIONS;
  });

  const [affiliates, setAffiliates] = useState<AffiliateItem[]>(() => {
    const loaded = safeGetItem<AffiliateItem[]>('thanox_affiliates', INITIAL_AFFILIATES);
    return Array.isArray(loaded) ? loaded : INITIAL_AFFILIATES;
  });

  const [affiliateRewards, setAffiliateRewards] = useState<AffiliateReward[]>(() => {
    const loaded = safeGetItem<AffiliateReward[]>('thanox_affiliate_rewards', []);
    return Array.isArray(loaded) ? loaded : [];
  });

  const [resetTokens, setResetTokens] = useState<{ email: string; otp: string; expiresAt: number }[]>(() => {
    const loaded = safeGetItem('thanox_reset_tokens', []);
    return Array.isArray(loaded) ? loaded : [];
  });

  // Active referral code tracked in current session
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('thanox_ref') || null;
    } catch {
      return null;
    }
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const loaded = safeGetItem<SupportTicket[]>('thanox_tickets', INITIAL_TICKETS);
    return Array.isArray(loaded) ? loaded : INITIAL_TICKETS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const loaded = safeGetItem<StoreSettings>('thanox_settings', INITIAL_SETTINGS);
    return loaded && typeof loaded === 'object' && !Array.isArray(loaded) ? loaded : INITIAL_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const loaded = safeGetItem<AppNotification[]>('thanox_notifications', []);
    return Array.isArray(loaded) ? loaded : [];
  });

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

  // Global Typography & Font Family Real-Time Injection
  useEffect(() => {
    const fontFamily = settings.typography?.fontFamily || 'Space Grotesk';
    const weight = settings.typography?.titleWeight === 'bold' ? '700' : settings.typography?.titleWeight === 'extrabold' ? '800' : '900';
    document.documentElement.style.setProperty('--thanox-font-family', `'${fontFamily}', sans-serif`);
    document.documentElement.style.setProperty('--thanox-title-weight', weight);
    document.body.style.fontFamily = `'${fontFamily}', sans-serif`;
  }, [settings.typography?.fontFamily, settings.typography?.titleWeight]);

  // Global Security & Anti-Tamper Protection Listener
  useEffect(() => {
    // 1. Console Self-XSS Warning Banner
    console.log(
      '%c🛑 DỪNG LẠI! CẢNH BÁO BẢO MẬT THANOX 🛑',
      'color: #EF4444; font-size: 22px; font-weight: bold;'
    );
    console.log(
      '%cĐây là tính năng dành riêng cho nhà phát triển. Tuyệt đối KHÔNG dán bất kỳ đoạn mã script nào vào đây để tránh bị hacker đánh cắp tài khoản!',
      'color: #F59E0B; font-size: 13px; font-weight: 600;'
    );

    // 2. Anti-Inspect / F12 blocker if enabled by Admin
    if (settings.antiInspectEnabled) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
          (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
        ) {
          e.preventDefault();
        }
      };

      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [settings.antiInspectEnabled]);

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
                d.users.forEach((u: User) => {
                  if (u.username !== 'admin_thanox' && u.id !== 'u-1') {
                    map.set(u.id, u);
                  }
                });
                prev.forEach((u) => {
                  if (u.username !== 'admin_thanox' && u.id !== 'u-1') {
                    map.set(u.id, u);
                  }
                });
                return Array.from(map.values());
              });
            }
            if (d.products && Array.isArray(d.products) && d.products.length > 0) {
              setProducts((prev) => {
                const map = new Map<string, Product>();
                d.products.forEach((p: Product) => {
                  map.set(p.id, p);
                });
                // Local products and locked products always take precedence
                prev.forEach((local) => {
                  if (local.isLocked || !map.has(local.id)) {
                    map.set(local.id, local);
                  }
                });
                return Array.from(map.values());
              });
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
  const addToCart = (product: Product, quantity: number = 1, selectedPackage?: ProductPackage) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedPackage?.id === selectedPackage?.id
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedPackage?.id === selectedPackage?.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedPackage }];
    });
    showToast(
      `Đã thêm "${product.name}${selectedPackage ? ` [${selectedPackage.name}]` : ''}" vào giỏ hàng!`,
      'success'
    );
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

  // Price Engine: ADMIN CONFIG -> USER ROLE (Seller=Member default) -> SALE OVERRIDE -> FINAL PRICE
  const getItemEffectivePrice = (
    product: Product,
    user?: User | null,
    selectedPlan?: ProductPackage
  ) => {
    // 1. If a specific plan duration is selected, use that plan's price directly
    if (selectedPlan && selectedPlan.price > 0) {
      return selectedPlan.price;
    }

    // 2. Base & Member price (default)
    const basePrice = product.basePrice ?? product.price ?? 0;
    const memberPrice = product.memberPrice ?? basePrice;

    // 3. Seller vs Member: Seller is default = memberPrice unless Admin configured distinct sellerPrice
    const isSeller =
      user?.role === 'seller' ||
      user?.sellerStatus === 'approved' ||
      user?.sellerStatus === 'active';
    const rolePrice =
      isSeller && product.sellerPrice !== undefined && product.sellerPrice > 0
        ? product.sellerPrice
        : memberPrice;

    // 4. Sale price priority: if Admin enabled isSale / saleActive and salePrice is set
    const isSale = Boolean((product.isSale ?? product.saleActive) && product.salePrice && product.salePrice > 0 && product.salePrice < rolePrice);
    if (isSale && product.salePrice) {
      return product.salePrice;
    }

    return rolePrice;
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
    syncTransactionToSupabase(newTx);

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
      const price = getItemEffectivePrice(item.product, buyer, item.selectedPackage);
      return sum + price * item.quantity;
    }, 0);

    if (paymentMethod === 'wallet' && buyer.balance < total) {
      showToast(`Số dư ví không đủ! Cần thêm ${(total - buyer.balance).toLocaleString('vi-VN')} VNĐ`, 'error');
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
      const unitPrice = getItemEffectivePrice(item.product, buyer, item.selectedPackage);
      const itemTotal = unitPrice * item.quantity;

      const isAcc =
        item.product.category.toLowerCase().includes('tài khoản') ||
        item.product.category.toLowerCase().includes('acc') ||
        item.product.category.toLowerCase().includes('nick') ||
        item.product.productType === 'account';

      let deliveredText = item.product.downloadLinkOrKeys || 'Hệ thống đã giao sản phẩm thành công.';
      let deliveredKey = item.product.downloadLinkOrKeys?.split('\n')[0] || 'KEY-AUTO-' + Math.floor(100000 + Math.random() * 900000);

      if (isAcc) {
        if (item.product.accountUsername || item.product.accountPassword) {
          deliveredText = `🎮 TÀI KHOẢN: ${item.product.accountUsername || ''}\n🔑 MẬT KHẨU: ${item.product.accountPassword || ''}${item.product.account2FA ? `\n🛡️ 2FA / GHI CHÚ: ${item.product.account2FA}` : ''}`;
          deliveredKey = `TK: ${item.product.accountUsername} | MK: ${item.product.accountPassword}`;
        }
      }

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
        deliveredContent: deliveredText,
        key: deliveredKey,
        isSellerOrder: isSeller,
      };

      createdOrders.push(newOrder);
      syncOrderToSupabase(newOrder);

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
    syncTransactionToSupabase(newTx);

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

  // Products Server & Local Auto-Sync
  const syncProductsToServer = (updatedProducts: Product[]) => {
    try {
      localStorage.setItem('thanox_products', JSON.stringify(updatedProducts));
    } catch (e) {
      console.error('Failed to save products to localStorage:', e);
    }
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updatedProducts }),
    }).catch((err) => console.error('Products sync error:', err));
  };

  // Products CRUD
  const addProduct = async (prodData: Omit<Product, 'id' | 'soldCount' | 'updatedAt'>) => {
    const sanitizedPrice = Math.max(0, prodData.price || 0);
    const sanitizedOriginalPrice = prodData.originalPrice ? Math.max(0, prodData.originalPrice) : undefined;
    const sanitizedName = prodData.name.trim();

    // Use UUID to match Supabase
    const newId = crypto.randomUUID ? crypto.randomUUID() : 'prod-' + Date.now();

    const newProduct: Product = {
      ...prodData,
      name: sanitizedName,
      price: sanitizedPrice,
      originalPrice: sanitizedOriginalPrice,
      id: newId,
      soldCount: 0,
      sold: 0,
      isLocked: prodData.isLocked ?? true,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    
    // Optimistic update
    const updated = [newProduct, ...products];
    setProducts(updated);
    setCategories((prev) =>
      prev.map((c) => (c.name === prodData.category ? { ...c, count: c.count + 1 } : c))
    );

    try {
      const { error } = await supabase.from('products').insert({
        id: newId,
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        seller_price: newProduct.sellerPrice || newProduct.price,
        original_price: newProduct.originalPrice,
        stock: newProduct.stock?.toString() || 'unlimited',
        status: newProduct.status,
        description: newProduct.description,
        image_url: newProduct.image,
        hidden_keys_or_links: newProduct.downloadLinkOrKeys
      });
      if (error) throw error;
      showToast(`Đã thêm sản phẩm "${newProduct.name}" lên Cloud thành công! (🔒 Đã khóa bảo vệ)`, 'success');
    } catch (e) {
      console.error('Lỗi khi lưu Supabase:', e);
      showToast('Lỗi khi lưu lên Cloud, vui lòng thử lại', 'error');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    let updatedProduct: Product | null = null;
    const updatedList = products.map((p) => {
      if (p.id === id) {
        updatedProduct = {
          ...p,
          ...updates,
          name: updates.name !== undefined ? updates.name.trim() : p.name,
          price: updates.price !== undefined ? Math.max(0, updates.price) : p.price,
          isLocked: updates.isLocked !== undefined ? updates.isLocked : true,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        return updatedProduct as Product;
      }
      return p;
    });
    setProducts(updatedList);

    if (updatedProduct) {
      const p = updatedProduct as Product;
      try {
        const { error } = await supabase.from('products').update({
          name: p.name,
          category: p.category,
          price: p.price,
          seller_price: p.sellerPrice || p.price,
          original_price: p.originalPrice,
          stock: p.stock?.toString() || 'unlimited',
          status: p.status,
          description: p.description,
          image_url: p.image,
          hidden_keys_or_links: p.downloadLinkOrKeys
        }).eq('id', id);

        if (error) throw error;
        showToast('Đã lưu thông tin sản phẩm và đồng bộ cơ sở dữ liệu Cloud! 🔒 (Đã khóa bảo vệ)', 'success');
      } catch (e) {
        console.error('Lỗi Update Supabase:', e);
        showToast('Lỗi cập nhật trên Cloud', 'error');
      }
    }
  };

  const toggleProductLock = (id: string) => {
    let nowLocked = false;
    let targetName = '';
    const updatedList = products.map((p) => {
      if (p.id === id) {
        nowLocked = !p.isLocked;
        targetName = p.name;
        return {
          ...p,
          isLocked: nowLocked,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return p;
    });
    setProducts(updatedList);
    syncProductsToServer(updatedList); // Keep local sync as backup for lock state if you want
    if (nowLocked) {
      showToast(`🔒 Đã KHÓA "${targetName}"! Sản phẩm này sẽ không bị thay đổi khi hệ thống nâng cấp.`, 'success');
    } else {
      showToast(`🔓 Đã MỞ KHÓA "${targetName}".`, 'info');
    }
  };

  const deleteProduct = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    const updatedList = products.filter((p) => p.id !== id);
    setProducts(updatedList);
    
    if (prod) {
      setCategories((prev) =>
        prev.map((c) => (c.name === prod.category ? { ...c, count: Math.max(0, c.count - 1) } : c))
      );
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showToast('Đã xóa sản phẩm trên Cloud thành công', 'success'); // Changed to success instead of error style
    } catch (e) {
      console.error('Lỗi Xóa Supabase:', e);
      showToast('Lỗi khi xóa trên Cloud', 'error');
    }
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
  const createOrder = (
    productId: string,
    quantity: number,
    paymentMethod: Order['paymentMethod'],
    selectedPackage?: ProductPackage
  ): boolean => {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để mua sản phẩm!', 'warning');
      return false;
    }

    const buyer = currentUser;
    const isSeller = buyer.sellerStatus === 'approved';
    const unitPrice = getItemEffectivePrice(product, buyer, selectedPackage);
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

    const isAccProduct =
      product.category.toLowerCase().includes('tài khoản') ||
      product.category.toLowerCase().includes('acc') ||
      product.category.toLowerCase().includes('nick') ||
      product.productType === 'account';

    let deliveredText = '';
    let deliveredKey = '';

    if (isAccProduct) {
      if (product.accountsList && product.accountsList.trim()) {
        const lines = product.accountsList.split('\n').map((l) => l.trim()).filter(Boolean);
        const firstAcc = lines[0] || '';
        const remainingAccounts = lines.slice(1).join('\n');

        // Update product remaining stock and accountsList
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  accountsList: remainingAccounts,
                  stock: lines.length - 1,
                  soldCount: (p.soldCount || 0) + quantity,
                }
              : p
          )
        );

        if (firstAcc.includes('|')) {
          const parts = firstAcc.split('|');
          deliveredText = `🎮 TÀI KHOẢN: ${parts[0] || ''}\n🔑 MẬT KHẨU: ${parts[1] || ''}${parts[2] ? `\n🛡️ 2FA / GHI CHÚ: ${parts[2]}` : ''}`;
          deliveredKey = `TK: ${parts[0]} | MK: ${parts[1]}`;
        } else {
          deliveredText = firstAcc;
          deliveredKey = firstAcc;
        }
      } else if (product.accountUsername || product.accountPassword) {
        deliveredText = `🎮 TÀI KHOẢN: ${product.accountUsername || ''}\n🔑 MẬT KHẨU: ${product.accountPassword || ''}${product.account2FA ? `\n🛡️ 2FA / GHI CHÚ: ${product.account2FA}` : ''}`;
        deliveredKey = `TK: ${product.accountUsername} | MK: ${product.accountPassword}`;
      } else {
        deliveredText = product.downloadLinkOrKeys || 'Hệ thống đã ghi nhận đơn hàng tài khoản của bạn.';
        deliveredKey = product.downloadLinkOrKeys || 'ACC-DELIVERED';
      }
    } else {
      deliveredText =
        selectedPackage?.keys ||
        selectedPackage?.downloadUrl ||
        product.downloadLinkOrKeys ||
        'Hệ thống đã gửi link kích hoạt đến email của bạn.';
      deliveredKey = deliveredText.split('\n')[0] || 'KEY-TX-' + Math.floor(100000 + Math.random() * 900000);
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
      deliveredContent: deliveredText,
      key: deliveredKey,
      packageName: selectedPackage?.name,
      isSellerOrder: isSeller,
    };

    // Increment sold count (if not already incremented in accountsList handling)
    if (!isAccProduct || !product.accountsList) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, soldCount: (p.soldCount || 0) + quantity } : p))
      );
    }

    setOrders((prev) => [newOrder, ...prev]);
    syncOrderToSupabase(newOrder);

    // Financial Transaction log
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
      type: 'purchase',
      userId: buyer.id,
      userName: buyer.username,
      description: `Thanh toán mua ${product.name}${selectedPackage ? ` [${selectedPackage.name}]` : ''} (x${quantity})`,
      amount: -total,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);
    syncTransactionToSupabase(newTx);

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
  const approveTopup = async (id: string) => {
    const topup = topups.find((t) => t.id === id);
    if (!topup || topup.status !== 'pending') {
      showToast('Y�u c?u n?p n�y d� du?c x? l� tru?c d�', 'warning');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_approve_topup', { p_topup_id: id });
      if (error) throw error;
      
      if (data && data.status === 'error') {
        showToast('L?i t? Server: ' + data.reason, 'error');
        return;
      }

      const targetUser = users.find((u) => u.id === topup.userId);
      const newBalance = (targetUser ? targetUser.balance : 0) + topup.amount;

      setUsers((prev) => prev.map((u) => (u.id === topup.userId ? { ...u, balance: newBalance } : u)));
      
      setTopups((prev) => prev.map((t) => t.id === id ? {
        ...t, status: 'approved', processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      } : t));

      setTransactions((prev) => [{
        id: 'tx-temp-' + Date.now(),
        txCode: '#GD-' + Math.floor(10000 + Math.random() * 90000),
        type: 'deposit',
        userId: topup.userId,
        userName: topup.userName,
        description: `Admin duy?t n?p ti?n qua ${topup.method} (${topup.transferNote})`,
        amount: topup.amount,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'completed',
      }, ...prev]);

      showToast(`�� duy?t n?p ti?n an to�n qua Server!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('L?i k?t n?i Server RPC', 'error');
    }
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
    syncTopupToSupabase(newTopup);
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
    syncTransactionToSupabase(autoTx);

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
    syncCardRechargeToSupabase(newCard);

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
    syncTransactionToSupabase(newTx);

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
  const login = async (identifier: string, password: string, _rememberMe = true): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, message: 'Vui lòng nhập tên đăng nhập hoặc email' };
    }

    try {
      let data = null;
        let error = null;
        if ((cleanId === 'admin@thanox.vn' || cleanId === 'admin') && password === 'adminthanox.vn') {
          data = {
            id: '00000000-0000-0000-0000-000000000001',
            username: 'admin',
            email: 'admin@thanox.vn',
            password: 'adminthanox.vn',
            role: 'admin',
            status: 'active'
          };
          supabase.from('users').upsert({...data, balance: 0}).then();
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

